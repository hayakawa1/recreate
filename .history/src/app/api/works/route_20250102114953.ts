import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.log('Unauthorized: No session or user ID');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const data = await request.json();
  console.log('Received request data:', data);

  try {
    const work = await prisma.work.create({
      data: {
        description: data.description,
        budget: data.budget,
        status: 'requested',
        requesterId: session.user.id,
        creatorId: data.creatorId,
      },
    });

    console.log('Created work:', work);
    return NextResponse.json(work);
  } catch (error) {
    console.error('Error creating work:', error);
    return new NextResponse('Error creating work', { status: 500 });
  }
} 