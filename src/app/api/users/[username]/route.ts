import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    console.log('Fetching user with username:', params.username);

    // ユーザーIDまたはユーザー名で検索
    const { rows: [user] } = await pool.query(
      `SELECT u.*, json_agg(
        CASE 
          WHEN pe.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', pe.id,
            'amount', pe.price,
            'title', pe.title,
            'isHidden', pe.is_hidden
          )
        END
      ) as price_entries
      FROM users u
      LEFT JOIN price_entries pe ON u.id = pe.user_id
      WHERE LOWER(u.username) = LOWER($1)
      GROUP BY u.id`,
      [params.username]
    );

    if (!user) {
      console.log('User not found for username:', params.username);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // price_entriesがnullの場合は空配列に変換
    if (user.price_entries[0] === null) {
      user.price_entries = [];
    }

    console.log('User found:', user.id);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーを取得
    const { rows: [existingUser] } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [params.username]
    );

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 権限チェック
    if (session.user.id !== existingUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    console.log('Update data:', data);

    const { rows: [user] } = await pool.query(
      'UPDATE users SET status = $1, username = $2, description = $3 WHERE id = $4 RETURNING *',
      [data.status, data.username, data.description, existingUser.id]
    );

    console.log('Updated user:', user);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in PUT /api/users/[username]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 