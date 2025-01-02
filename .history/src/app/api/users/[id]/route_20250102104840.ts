import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('GET API called with params:', params);

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
          username: true,
        },
      },
    },
  });

  console.log('userByUsername result:', userByUsername);

  if (userByUsername?.user) {
    console.log('Returning user from username search:', userByUsername.user);
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
      username: true,
    },
  });

  console.log('user result from ID search:', user);

  if (!user) {
    console.log('User not found');
    return new NextResponse('User not found', { status: 404 });
  }

  console.log('Returning user from ID search:', user);
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