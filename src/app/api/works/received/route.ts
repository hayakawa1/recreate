import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const works = await prisma.work.findMany({
    where: {
      creatorId: session.user.id,
    },
    include: {
      requester: {
        select: {
          name: true,
          image: true,
          username: true,
        },
      },
      creator: {
        select: {
          name: true,
          image: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json(works);
} 