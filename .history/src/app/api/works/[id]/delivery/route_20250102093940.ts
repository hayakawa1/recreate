import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new NextResponse('No file uploaded', { status: 400 });
  }

  // ここでファイルをアップロードする処理を実装
  // 例: S3やCloudinaryなどのストレージサービスにアップロード
  const fileUrl = 'https://example.com/files/' + file.name; // 仮のURL

  const work = await prisma.work.update({
    where: {
      id: params.id,
    },
    data: {
      status: 'completed',
      deliveryFileUrl: fileUrl,
    },
  });

  return NextResponse.json(work);
} 