import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const data = await request.json();

  const work = await prisma.work.create({
    data: {
      description: data.description,
      budget: data.budget,
      status: 'requested',
      requesterId: session.user.id,
      creatorId: data.creatorId,
    },
  });

  return NextResponse.json(work);
} 