import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ワークを取得
    const { rows: [work] } = await pool.query(
      'SELECT * FROM works WHERE id = $1',
      [params.username]
    );

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    // 権限チェック（リクエスト送信者のみ支払い完了可能）
    if (work.requester_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // トランザクションを開始
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ワークを更新
      const { rows: [updatedWork] } = await client.query(
        `UPDATE works 
         SET status = 'paid'
         WHERE id = $1
         RETURNING *`,
        [params.username]
      );

      await client.query('COMMIT');

      return NextResponse.json(updatedWork);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in POST /api/works/[username]/paid:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 