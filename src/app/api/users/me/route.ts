import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getPool, hasValidPriceEntry } from '@/lib/db'
import crypto from 'crypto'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('認証が必要です。再度ログインしてください。', { status: 401 })
  }

  try {
    const pool = getPool();
    const { rows: [user] } = await pool.query(
      `SELECT 
        u.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'title', p.title,
              'amount', p.amount,
              'stripe_url', p.stripe_url,
              'description', p.description,
              'is_hidden', p.is_hidden
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as price_entries
      FROM users u
      LEFT JOIN price_entries p ON u.id = p.user_id
      WHERE u.id = $1
      GROUP BY u.id`,
      [session.user.id]
    )

    if (!user) {
      console.error('User not found in database:', session.user.id)
      return new NextResponse('ユーザー情報が見つかりません。再度ログインしてください。', { status: 404 })
    }

    // 有効な料金プランの存在チェック
    const hasValidPlan = await hasValidPriceEntry(session.user.id);
    return NextResponse.json({
      ...user,
      hasValidPlan,
      canAcceptRequests: hasValidPlan && (user.status === 'available' || user.status === 'availableButHidden')
    })
  } catch (error) {
    console.error('Failed to get user:', error)
    return new NextResponse('サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。', { status: 500 })
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

    const pool = getPool();
    // トランザクションを開始
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 既存の料金設定を削除
      await client.query(
        'DELETE FROM price_entries WHERE user_id = $1',
        [session.user.id]
      )

      // 新しい価格設定を追加
      if (priceEntries && priceEntries.length > 0) {
        const values = priceEntries.map(entry => [
          crypto.randomUUID(),
          session.user.id,
          entry.title || entry.description,
          entry.amount,
          entry.stripe_url || '',
          entry.description || '',
          entry.isHidden ?? false
        ])

        const placeholders = values.map((_, i) => 
          `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`
        ).join(', ')

        await client.query(
          `INSERT INTO price_entries (id, user_id, title, amount, stripe_url, description, is_hidden)
           VALUES ${placeholders}`,
          values.flat()
        )
      }

      // 有効な料金プランの存在チェック
      const hasValidPlan = await hasValidPriceEntry(session.user.id);

      // 有効な料金プランがない場合は強制的にunavailableに設定
      const newStatus = !hasValidPlan ? 'unavailable' : status;

      // 受付状態のバリデーション
      if (!hasValidPlan && (status === 'available' || status === 'availableButHidden')) {
        return new NextResponse('有効な料金プランが設定されていないため、受付開始できません。', { status: 400 });
      }

      // ユーザー情報を更新
      const { rows: [user] } = await client.query(
        'UPDATE users SET status = $1, description = $2 WHERE id = $3 RETURNING *',
        [newStatus, description, session.user.id]
      )

      await client.query('COMMIT')

      // レスポンスに警告メッセージを追加
      const response = {
        ...user,
        hasValidPlan,
        canAcceptRequests: hasValidPlan && (newStatus === 'available' || newStatus === 'availableButHidden'),
        warning: !hasValidPlan ? '有効な料金プランが設定されていないため、受付停止状態に設定されました。' : undefined
      };

      return NextResponse.json(response)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to update user:', error)
    return new NextResponse('プロフィールの更新に失敗しました', { status: 500 })
  }
} 