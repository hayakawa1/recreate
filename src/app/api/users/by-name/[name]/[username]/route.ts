import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { rows: [user] } = await pool.query(
      `SELECT 
        u.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'amount', p.amount,
              'stripe_url', p.stripe_url,
              'description', p.description,
              'is_hidden', p.is_hidden
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as price_entries
      FROM users u
      LEFT JOIN price_entries p ON u.id = p.user_id
      WHERE u.name = $1
      GROUP BY u.id`,
      [params.username]
    );

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 