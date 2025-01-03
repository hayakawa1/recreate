import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

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
    const works = await sql`
      SELECT * FROM works 
      WHERE id = ${params.id} 
      AND requester_id = ${session.user.id}
      AND status = 'delivered'
    `;

    if (works.rows.length === 0) {
      return new NextResponse('Work not found or not authorized', { status: 404 });
    }

    // ステータスを支払い済みに更新
    await sql`
      UPDATE works 
      SET status = 'paid'
      WHERE id = ${params.id}
    `;

    return new NextResponse('OK');
  } catch (error) {
    console.error('Error marking work as paid:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Server Error', { status: 500 });
  }
} 