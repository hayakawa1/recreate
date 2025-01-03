import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getPool } from '@/lib/db'
import crypto from 'crypto'

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, amount, stripe_url, description, is_hidden } = body

    const pool = getPool();

    if (id) {
      // 既存のエントリを更新
      const { rows: [entry] } = await pool.query(
        `UPDATE price_entries 
         SET amount = $1, stripe_url = $2, description = $3, is_hidden = $4 
         WHERE id = $5 AND user_id = $6 
         RETURNING *`,
        [amount, stripe_url, description, is_hidden, id, session.user.id]
      );
      return NextResponse.json(entry);
    } else {
      // 新規エントリを作成
      const { rows: [entry] } = await pool.query(
        `INSERT INTO price_entries (id, user_id, amount, stripe_url, description, is_hidden) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [crypto.randomUUID(), session.user.id, amount, stripe_url, description, is_hidden]
      );
      return NextResponse.json(entry);
    }
  } catch (error) {
    console.error('Failed to update price entry:', error)
    return new NextResponse('料金プランの更新に失敗しました', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return new NextResponse('IDが指定されていません', { status: 400 })
    }

    const pool = getPool();
    await pool.query(
      'DELETE FROM price_entries WHERE id = $1 AND user_id = $2',
      [id, session.user.id]
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete price entry:', error)
    return new NextResponse('料金プランの削除に失敗しました', { status: 500 })
  }
} 