import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ユーザー名で検索（大文字小文字を区別しない）
  let user = await prisma.user.findFirst({
    where: { 
      OR: [
        { 
          username: {
            mode: 'insensitive',
            equals: params.id
          }
        },
        { id: params.id }
      ]
    },
    select: {
      id: true,
      name: true,
      image: true,
      status: true,
      stripeLink: true,
      username: true,
    },
  });

  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const data = await request.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      status: data.status,
      stripeLink: data.stripeLink,
      username: data.username,
    },
    select: {
      id: true,
      name: true,
      image: true,
      status: true,
      stripeLink: true,
      username: true,
    },
  });

  return NextResponse.json(user);
} 