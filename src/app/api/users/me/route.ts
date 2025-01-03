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
    const { status, description } = body

    const pool = getPool();

    // ステータス変更時のみ有効性チェック
    if (status !== undefined) {
      const hasValidPlan = await hasValidPriceEntry(session.user.id);
      if (!hasValidPlan && (status === 'available' || status === 'availableButHidden')) {
        return new NextResponse('有効な料金プランが設定されていないため、受付開始できません。', { status: 400 });
      }
    }

    // ユーザー情報を更新
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (status !== undefined) {
      updateFields.push(`status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${valueIndex}`);
      values.push(description);
      valueIndex++;
    }

    if (updateFields.length === 0) {
      return new NextResponse('更新する項目がありません。', { status: 400 });
    }

    values.push(session.user.id);
    const { rows: [user] } = await pool.query(
      `UPDATE users 
       SET ${updateFields.join(', ')} 
       WHERE id = $${valueIndex}
       RETURNING *`,
      values
    );

    const hasValidPlan = await hasValidPriceEntry(session.user.id);
    return NextResponse.json({
      ...user,
      hasValidPlan,
      canAcceptRequests: hasValidPlan && (user.status === 'available' || user.status === 'availableButHidden')
    });

  } catch (error) {
    console.error('Failed to update user:', error)
    return new NextResponse('プロフィールの更新に失敗しました', { status: 500 })
  }
} 