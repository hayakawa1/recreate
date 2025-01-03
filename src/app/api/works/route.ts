import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, priceId, message } = body;

    // 料金プランの情報を取得
    const priceResult = await pool.query(
      'SELECT amount FROM price_entries WHERE id = $1',
      [priceId]
    );

    if (priceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Price plan not found' }, { status: 404 });
    }

    const amount = priceResult.rows[0].amount;

    // リクエストを作成
    const result = await pool.query(
      `INSERT INTO works (
        requester_id,
        creator_id,
        description,
        price_entry_id,
        amount,
        status
      ) VALUES ($1::text, $2::text, $3, $4, $5, 'pending') 
      RETURNING id, description, status, amount`,
      [session.user.id, userId, message, priceId, amount]
    );

    const work = result.rows[0];
    return NextResponse.json({
      id: work.id,
      description: work.description,
      status: work.status,
      amount: work.amount,
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
    const result = await pool.query(
      `SELECT 
        w.id,
        w.sequential_id,
        w.description,
        w.status,
        w.amount,
        w.created_at,
        u.name as creator_name,
        u.image as creator_image,
        u.username as creator_username
       FROM works w
       JOIN users u ON w.creator_id::text = u.id::text
       WHERE w.requester_id::text = $1::text
       ORDER BY w.created_at DESC`,
      [session.user.id]
    );

    console.log('Found works:', result.rows);

    const works = result.rows.map(row => ({
      id: row.id,
      sequentialId: row.sequential_id,
      description: row.description,
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