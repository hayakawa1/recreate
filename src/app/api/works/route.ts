import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { description, creatorId, amount, stripeUrl } = data;

    // 作成者が存在するか確認
    const { rows: [creator] } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [creatorId]
    );

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // トランザクションを開始
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // workを作成
      const { rows: [work] } = await client.query(
        `INSERT INTO works (id, description, creator_id, requester_id, status)
         VALUES ($1, $2, $3, $4, 'requested')
         RETURNING *`,
        [crypto.randomUUID(), description, creatorId, session.user.id]
      );

      // paymentを作成
      const { rows: [payment] } = await client.query(
        `INSERT INTO payments (id, work_id, amount, stripe_url, is_hidden)
         VALUES ($1, $2, $3, $4, false)
         RETURNING *`,
        [crypto.randomUUID(), work.id, amount, stripeUrl]
      );

      // ユーザー情報を取得
      const { rows: [requester] } = await client.query(
        'SELECT name, image, username FROM users WHERE id = $1',
        [session.user.id]
      );

      const { rows: [creator] } = await client.query(
        'SELECT name, image, username FROM users WHERE id = $1',
        [creatorId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        ...work,
        payments: [payment],
        requester,
        creator
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in POST /api/works:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 