import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { r2Client } from '@/lib/r2';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check if work exists
    const work = await prisma.work.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    try {
      // ファイル名を生成
      const fileName = `${Date.now()}-${file.name}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      console.log('Uploading file to R2...', {
        bucket: process.env.R2_BUCKET_NAME,
        fileName,
        contentType: file.type,
      });

      // R2にアップロード
      const key = `deliveries/${params.id}/${fileName}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );

      console.log('File uploaded successfully, generating signed URL...');

      // 署名付きURLを生成（24時間有効）
      const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      });
      const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 24 * 60 * 60 });

      console.log('Signed URL generated:', signedUrl);

      // データベースを更新（キーを保存）
      const updatedWork = await prisma.work.update({
        where: {
          id: params.id,
        },
        data: {
          status: 'delivered',
          deliveryFileUrl: key, // URLではなくキーを保存
        },
      });

      return NextResponse.json({ 
        success: true, 
        work: {
          ...updatedWork,
          deliveryFileUrl: signedUrl // レスポンスには署名付きURLを含める
        }
      });
    } catch (uploadError: any) {
      console.error('Upload error details:', {
        error: uploadError,
        message: uploadError.message,
        stack: uploadError.stack,
      });
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Server error details:', {
      error,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// 署名付きURLを取得するエンドポイントを追加
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET request received for work:', params.id);
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const work = await prisma.work.findUnique({
      where: { id: params.id },
    });
    console.log('Work found:', work);

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    // 権限チェック（リクエスト送信者または作成者のみアクセス可能）
    if (work.requesterId !== session.user.id && work.creatorId !== session.user.id) {
      console.log('Access denied. User:', session.user.id, 'Work:', { requesterId: work.requesterId, creatorId: work.creatorId });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!work.deliveryFileUrl) {
      return NextResponse.json({ error: 'No file available' }, { status: 404 });
    }

    console.log('Generating download URL for:', {
      bucket: process.env.R2_BUCKET_NAME,
      key: work.deliveryFileUrl,
    });

    // 署名付きURLを生成（5分有効）
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: work.deliveryFileUrl,
    });
    
    console.log('GetObjectCommand created:', command);
    
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 5 * 60 }); // 5分
    console.log('Generated signed URL:', signedUrl);

    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    console.error('Download URL generation error details:', {
      error,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Failed to generate download URL: ${error.message}` },
      { status: 500 }
    );
  }
} 