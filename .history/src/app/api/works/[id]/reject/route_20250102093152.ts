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

  const work = await prisma.work.update({
    where: {
      id: params.id,
    },
    data: {
      status: 'rejected',
    },
  });

  return NextResponse.json(work);
} 