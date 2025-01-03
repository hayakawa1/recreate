import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { rows: works } = await pool.query(
      `SELECT 
        w.*,
        json_build_object(
          'name', r.name,
          'image', r.image,
          'username', r.username
        ) as requester,
        json_build_object(
          'name', c.name,
          'image', c.image,
          'username', c.username
        ) as creator,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'amount', p.amount,
              'stripeUrl', p.stripe_url,
              'isHidden', p.is_hidden
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as payments
      FROM works w
      LEFT JOIN users r ON w.requester_id = r.id
      LEFT JOIN users c ON w.creator_id = c.id
      LEFT JOIN payments p ON w.id = p.work_id
      WHERE w.requester_id = $1
      GROUP BY w.id, r.name, r.image, r.username, c.name, c.image, c.username
      ORDER BY w.created_at DESC`,
      [session.user.id]
    );

    console.log('Found works:', works);
    return NextResponse.json(works);
  } catch (error) {
    console.error('Error in GET /api/works/sent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 