import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await sql`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.image,
        u.description,
        u.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'amount', p.amount,
              'description', p.description,
              'stripe_url', p.stripe_url,
              'is_hidden', p.is_hidden
            )
            ORDER BY p.amount
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) as price_entries
      FROM users u
      LEFT JOIN price_entries p ON p.user_id = u.id
      WHERE u.id = ${params.id}
      GROUP BY u.id
    `;

    if (result.rows.length === 0) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 