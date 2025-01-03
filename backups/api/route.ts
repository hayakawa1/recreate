import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
    const result = await pool.query(
      `SELECT * FROM works 
      WHERE id = $1 
      AND requester_id = $2
      AND status = 'delivered'`,
      [params.id, session.user.id]
    );

    if (result.rows.length === 0) {
      return new NextResponse('Work not found or not authorized', { status: 404 });
    }

    // ステータスを支払い完了に更新
    await pool.query(
      `UPDATE works 
      SET status = 'paid'
      WHERE id = $1`,
      [params.id]
    );

    return new NextResponse('OK');
  } catch (error) {
    console.error('Error confirming payment:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Server Error', { status: 500 });
  }
} 