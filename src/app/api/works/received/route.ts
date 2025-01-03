import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT 
        w.id,
        w.sequential_id,
        w.message,
        w.status,
        w.amount,
        w.created_at,
        w.stripe_url,
        u.name as requester_name,
        u.image as requester_image,
        u.username as requester_username
       FROM works w
       JOIN users u ON w.requester_id::text = u.id::text
       WHERE w.creator_id::text = $1::text
       ORDER BY w.created_at DESC`,
      [session.user.id]
    );

    console.log('Session:', session.user.id);
    console.log('Found works:', result.rows);

    const works = result.rows.map(row => ({
      id: row.id,
      sequentialId: row.sequential_id,
      message: row.message,
      status: row.status,
      amount: row.amount,
      stripe_url: row.stripe_url,
      requester: {
        name: row.requester_name,
        image: row.requester_image,
        username: row.requester_username,
      },
    }));

    return NextResponse.json(works);
  } catch (error) {
    console.error('Error fetching received works:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 