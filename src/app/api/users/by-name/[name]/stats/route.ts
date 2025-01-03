import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    // ユーザーIDを取得
    const userResult = await pool.query(
      'SELECT id FROM users WHERE name = $1',
      [params.name]
    );

    if (userResult.rows.length === 0) {
      return new NextResponse('User not found', { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // 受信した依頼の統計を取得
    const receivedResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM works
      WHERE user_id = $1
      GROUP BY status
    `, [userId]);

    // 送信した依頼の統計を取得
    const sentResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM works
      WHERE client_id = $1
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
      stats.received[row.status as keyof typeof stats.received] = parseInt(row.count);
    });

    // 送信した依頼の統計を設定
    sentResult.rows.forEach(row => {
      stats.sent[row.status as keyof typeof stats.sent] = parseInt(row.count);
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 