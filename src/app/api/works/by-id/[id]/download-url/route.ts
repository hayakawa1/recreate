import { NextResponse } from 'next/server';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://e6c2960db18930094afec35ed8773f00.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // ワークの存在確認と権限チェック
    const result = await pool.query(
      `SELECT * FROM works 
      WHERE id = $1 
      AND (requester_id = $2 OR creator_id = $2)
      AND status = 'delivered'`,
      [params.id, session.user.id]
    );

    if (result.rows.length === 0) {
      return new NextResponse('Work not found or not authorized', { status: 404 });
    }

    const work = result.rows[0];
    const key = `works/${params.id}`;
    console.log('Trying to download file with key:', key);
    console.log('Bucket name:', process.env.R2_BUCKET_NAME);
    console.log('Work status:', work.status);
    
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    console.log('Getting signed URL...');
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('Got signed URL:', url);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Server Error', { status: 500 });
  }
} 