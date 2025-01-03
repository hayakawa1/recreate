import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT 
        w.id,
        w.sequential_id,
        w.description,
        w.status,
        w.amount,
        w.created_at,
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
      description: row.description,
      status: row.status,
      amount: row.amount,
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