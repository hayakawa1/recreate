import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pool = getPool();
    
    // ユーザー情報を取得
    const userResult = await pool.query(
      'SELECT id, name, username, image, description, status FROM users WHERE id = $1',
      [params.id]
    );

    if (userResult.rows.length === 0) {
      return new NextResponse('User not found', { status: 404 });
    }

    // 料金プランを取得
    const priceResult = await pool.query(
      'SELECT id, amount, description, stripe_url, is_hidden FROM price_entries WHERE user_id = $1 ORDER BY amount',
      [params.id]
    );

    // レスポンスを組み立て
    const response = {
      ...userResult.rows[0],
      price_entries: priceResult.rows
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 