import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { creator_id, description, price_entry_id } = body;

    const result = await sql`
      INSERT INTO works (
        requester_id,
        creator_id,
        description,
        price_entry_id,
        status
      ) VALUES (
        ${session.user.id},
        ${creator_id},
        ${description},
        ${price_entry_id},
        'pending'
      ) RETURNING id
    `;

    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    console.error('Error creating work:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 