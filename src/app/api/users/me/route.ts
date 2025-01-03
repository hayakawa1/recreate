import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import crypto from 'crypto'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { rows: [user] } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [session.user.id]
    )

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const { rows: priceEntries } = await pool.query(
      'SELECT id, user_id, title, price as amount, is_hidden as "isHidden" FROM price_entries WHERE user_id = $1',
      [user.id]
    )

    return NextResponse.json({
      ...user,
      priceEntries
    })
  } catch (error) {
    console.error('Failed to get user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { status, description, priceEntries } = body

    // トランザクションを開始
    await pool.query('BEGIN')

    try {
      // ユーザー情報を更新
      const { rows: [user] } = await pool.query(
        'UPDATE users SET status = $1, description = $2 WHERE id = $3 RETURNING *',
        [status, description, session.user.id]
      )

      // 既存のprice_entriesを削除
      await pool.query(
        'DELETE FROM price_entries WHERE user_id = $1',
        [session.user.id]
      )

      // 新しいprice_entriesを挿入
      if (priceEntries && priceEntries.length > 0) {
        const values = priceEntries.map((entry: any, index: number) => 
          `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5})`
        ).join(', ')
        
        const params: any[] = []
        priceEntries.forEach((entry: any) => {
          params.push(
            crypto.randomUUID(),
            session.user.id,
            entry.title,
            entry.price,
            entry.is_hidden
          )
        })

        await pool.query(
          `INSERT INTO price_entries (id, user_id, title, price, is_hidden) VALUES ${values}`,
          params
        )
      }

      await pool.query('COMMIT')

      return NextResponse.json(user)
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Failed to update user:', error)
    return new NextResponse('プロフィールの更新に失敗しました', { status: 500 })
  }
} 