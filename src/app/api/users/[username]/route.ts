import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { rows: [user] } = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.username,
        u.image,
        u.status,
        u.description,
        u.stripe_link as "stripeLink"
      FROM users u
      WHERE u.username = $1`,
      [params.username]
    );

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
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