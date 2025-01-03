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
      return new NextResponse('No file uploaded', { status: 400 });
    }

    // ファイルをバッファに変換
    const buffer = await file.arrayBuffer();

    // R2にアップロード
    const key = `works/${params.id}/${Date.now()}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: file.type,
      })
    );

    // ステータスを納品済みに更新
    await sql`
      UPDATE works 
      SET status = 'delivered'
      WHERE id = ${params.id}
    `;

    return new NextResponse('OK');
  } catch (error) {
    console.error('Error delivering work:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 