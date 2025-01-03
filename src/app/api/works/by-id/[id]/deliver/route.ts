import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://e6c2960db18930094afec35ed8773f00.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // ワークの存在確認と権限チェック
    const works = await sql`
      SELECT * FROM works 
      WHERE id = ${params.id} 
      AND creator_id = ${session.user.id}
      AND status = 'requested'
    `;

    if (works.rows.length === 0) {
      return new NextResponse('Work not found or not authorized', { status: 404 });
    }

    // マルチパートフォームデータを取得
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new NextResponse('ファイルがアップロードされていません', { status: 400 });
    }

    // ファイルをバッファに変換
    const buffer = await file.arrayBuffer();

    // R2にアップロード
    const key = `works/${params.id}`;
    console.log('Uploading file with key:', key);
    console.log('Bucket name:', process.env.R2_BUCKET_NAME);
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    
    try {
      if (!process.env.R2_BUCKET_NAME) {
        throw new Error('R2_BUCKET_NAME is not set');
      }

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: Buffer.from(buffer),
          ContentType: file.type,
        })
      );
      console.log('File uploaded successfully');
    } catch (uploadError) {
      console.error('Error uploading file:', uploadError);
      return new NextResponse(uploadError instanceof Error ? uploadError.message : 'ファイルのアップロードに失敗しました', { status: 500 });
    }

    // ステータスを納品済みに更新
    try {
      await sql`
        UPDATE works 
        SET status = 'delivered'
        WHERE id = ${params.id}
      `;
    } catch (dbError) {
      console.error('Error updating work status:', dbError);
      return new NextResponse('ステータスの更新に失敗しました', { status: 500 });
    }

    return new NextResponse('OK');
  } catch (error) {
    console.error('Error delivering work:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Server Error', { status: 500 });
  }
} 