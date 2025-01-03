import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ワークを取得
    const { rows: [work] } = await pool.query(
      'SELECT * FROM works WHERE id = $1',
      [params.id]
    );

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    // 権限チェック（作成者のみ納品可能）
    if (work.creator_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const { deliveryUrl } = data;

    // トランザクションを開始
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ワークを更新
      const { rows: [updatedWork] } = await client.query(
        `UPDATE works 
         SET status = 'delivered', delivery_url = $1
         WHERE id = $2
         RETURNING *`,
        [deliveryUrl, params.id]
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
    console.error('Error in POST /api/works/[id]/delivery:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 