import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';

export default async function UserPage({
  params,
}: {
  params: { username: string };
}) {
  try {
    const { rows: [user] } = await pool.query(
      `SELECT u.*, json_agg(
        json_build_object(
          'id', pe.id,
          'amount', pe.price,
          'title', pe.title,
          'isHidden', pe.is_hidden
        )
      ) as price_entries
      FROM users u
      LEFT JOIN price_entries pe ON u.id = pe.user_id
      WHERE LOWER(u.username) = LOWER($1)
      GROUP BY u.id`,
      [params.username]
    );

    if (!user) {
      return notFound();
    }

    // price_entriesがnullの場合は空配列に変換
    if (user.price_entries[0] === null) {
      user.price_entries = [];
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            {user.image && (
              <img
                src={user.image}
                alt={user.name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-600">@{user.username}</p>
            </div>
          </div>

          {user.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">自己紹介</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{user.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in UserPage:', error);
    throw error;
  }
} 