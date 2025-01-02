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

  try {
    const work = await prisma.work.update({
      where: {
        id: params.id,
      },
      data: {
        status: 'paid',
      },
    });

    return NextResponse.json(work);
  } catch (error) {
    console.error('Error updating work status:', error);
    return new NextResponse('Error updating work status', { status: 500 });
  }
} 