import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // まずTwitterのユーザー名でユーザーを検索
  const userByUsername = await prisma.account.findFirst({
    where: {
      provider: 'twitter',
      providerAccountId: params.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          status: true,
          stripeLink: true,
        },
      },
    },
  });

  if (userByUsername?.user) {
    return NextResponse.json(userByUsername.user);
  }

  // ユーザー名で見つからない場合はIDで検索
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      image: true,
      status: true,
      stripeLink: true,
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
  const session = await getServerSession();

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const data = await request.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      status: data.status,
      stripeLink: data.stripeLink,
    },
    select: {
      id: true,
      name: true,
      image: true,
      status: true,
      stripeLink: true,
    },
  });

  return NextResponse.json(user);
} 