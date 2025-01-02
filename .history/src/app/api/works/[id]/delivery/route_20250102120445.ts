import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new NextResponse('No file uploaded', { status: 400 });
  }

  // 現時点では実際のファイルアップロードは実装せず、ステータスのみ更新
  const work = await prisma.work.update({
    where: {
      id: params.id,
    },
    data: {
      status: 'delivered',
      deliveryFileUrl: file.name, // 一時的に、ファイル名を保存
    },
  });

  return NextResponse.json(work);
} 