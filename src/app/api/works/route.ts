import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { creator_id, price_entry_id, description } = await request.json();

    if (!creator_id || !price_entry_id || !description) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const result = await sql`
      INSERT INTO works (
        client_id,
        creator_id,
        price_entry_id,
        description,
        status
      ) VALUES (
        ${session.user.id},
        ${creator_id},
        ${price_entry_id},
        ${description},
        'pending'
      ) RETURNING id
    `;

    return NextResponse.json({ id: result.rows[0].id });
  } catch (error) {
    console.error('Failed to create work:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 