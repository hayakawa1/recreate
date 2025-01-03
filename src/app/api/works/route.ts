import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, priceId, message } = body;

    // 料金プランの情報を取得
    const priceResult = await query(
      'SELECT amount, stripe_url FROM price_entries WHERE id = $1',
      [priceId]
    );

    if (priceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Price plan not found' }, { status: 404 });
    }

    const { amount, stripe_url } = priceResult.rows[0];

    // リクエストを作成
    const result = await query(
      `INSERT INTO works (
        requester_id,
        creator_id,
        message,
        price_entry_id,
        amount,
        stripe_url,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'requested')
      RETURNING id, message, status, amount, stripe_url`,
      [session.user.id, userId, message, priceId, amount, stripe_url]
    );

    const work = result.rows[0];
    return NextResponse.json({
      id: work.id,
      message: work.message,
      status: work.status,
      amount: amount,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating work:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
        u.name as creator_name,
        u.image as creator_image,
        u.username as creator_username
       FROM works w
       JOIN users u ON w.creator_id = u.id
       WHERE w.requester_id = $1
       ORDER BY w.created_at DESC`,
      [session.user.id]
    );

    const works = result.rows.map(row => ({
      id: row.id,
      sequentialId: row.sequential_id,
      message: row.message,
      status: row.status,
      amount: row.amount,
      creator: {
        name: row.creator_name,
        image: row.creator_image,
        username: row.creator_username,
      },
    }));

    return NextResponse.json(works);
  } catch (error) {
    console.error('Error fetching works:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 