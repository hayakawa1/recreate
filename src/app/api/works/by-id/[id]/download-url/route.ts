import { NextResponse } from 'next/server';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@vercel/postgres';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
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
    const { rows: works } = await sql`
      SELECT * FROM works 
      WHERE id = ${params.id} 
      AND (requester_id = ${session.user.id} OR creator_id = ${session.user.id})
      AND status = 'delivered'
    `;

    if (works.length === 0) {
      return new NextResponse('Work not found or not authorized', { status: 404 });
    }

    const key = `works/${params.id}/${works[0].delivered_at.getTime()}`;
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 