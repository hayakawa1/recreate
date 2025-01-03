import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { createWorkNotification } from '@/lib/notifications';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // ワークの存在確認と権限チェック
    const result = await query(
      `SELECT * FROM works 
      WHERE id = $1 
      AND creator_id = $2
      AND status = 'delivered'`,
      [params.id, session.user.id]
    );

    if (result.rows.length === 0) {
      return new NextResponse('Work not found or not authorized', { status: 404 });
    }

    // ステータスを支払い完了に更新
    const updateResult = await query(
      `UPDATE works 
      SET status = 'paid'
      WHERE id = $1
      RETURNING *`,
      [params.id]
    );

    // 通知を作成
    await createWorkNotification(updateResult.rows[0], 'status_changed');

    return new NextResponse('OK');
  } catch (error) {
    console.error('Error confirming payment:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Server Error', { status: 500 });
  }
} 