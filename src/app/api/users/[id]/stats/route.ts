import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pool = getPool();
    
    // ユーザーIDを取得
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [params.id]
    );

    if (userResult.rows.length === 0) {
      return new NextResponse('User not found', { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // 受信した依頼の統計を取得
    const receivedResult = await pool.query(`
      SELECT 
        COALESCE(status, 'requested') as status,
        COUNT(*) as count
      FROM works
      WHERE creator_id = $1
      GROUP BY status
    `, [userId]);

    // 送信した依頼の統計を取得
    const sentResult = await pool.query(`
      SELECT 
        COALESCE(status, 'requested') as status,
        COUNT(*) as count
      FROM works
      WHERE requester_id = $1
      GROUP BY status
    `, [userId]);

    // 統計データを整形
    const stats = {
      received: {
        pending: 0,
        accepted: 0,
        rejected: 0,
        delivered: 0,
        paid: 0
      },
      sent: {
        pending: 0,
        accepted: 0,
        rejected: 0,
        delivered: 0,
        paid: 0
      }
    };

    // 受信した依頼の統計を設定
    receivedResult.rows.forEach(row => {
      const status = row.status === 'requested' ? 'requested' : row.status;
      if (status in stats.received) {
        stats.received[status as keyof typeof stats.received] = parseInt(row.count);
      }
    });

    // 送信した依頼の統計を設定
    sentResult.rows.forEach(row => {
      const status = row.status === 'requested' ? 'requested' : row.status;
      if (status in stats.sent) {
        stats.sent[status as keyof typeof stats.sent] = parseInt(row.count);
      }
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API Error:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Server Error', { status: 500 });
  }
} 