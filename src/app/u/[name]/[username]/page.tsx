'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface User {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'availableButHidden' | 'unavailable';
  price_entries: {
    id: string;
    amount: number;
    description: string;
    stripe_url: string;
    is_hidden: boolean;
  }[];
}

export default function CreatorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/by-name/${params.username}`);
        if (!response.ok) {
          throw new Error('ユーザーが見つかりません');
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.username) {
      fetchUser();
    }
  }, [params.username]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-red-700 bg-red-100 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-red-700 bg-red-100 p-4 rounded-md">
          ユーザーが見つかりません
        </div>
      </div>
    );
  }

  const availablePrices = user.price_entries.filter(entry => !entry.is_hidden);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">{user.name}</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">自己紹介</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{user.description || '自己紹介文はありません'}</p>
      </div>

      {user.status !== 'unavailable' && availablePrices.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-4">料金プラン</h2>
          <div className="space-y-4">
            {availablePrices.map((price) => (
              <div key={price.id} className="p-4 border border-gray-200 rounded-md">
                <div className="font-medium mb-1">¥{price.amount.toLocaleString()}</div>
                {price.description && (
                  <div className="text-sm text-gray-500 mb-4">{price.description}</div>
                )}
                <a
                  href={`/c/${user.name}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  リクエストを送る
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {user.status === 'unavailable' && (
        <div className="text-yellow-700 bg-yellow-100 p-4 rounded-md">
          現在リクエストを受け付けていません
        </div>
      )}
    </div>
  );
} 