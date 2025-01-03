'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
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
        const response = await fetch(`/api/users/by-name/${params.name}`);
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

    if (params.name) {
      fetchUser();
    }
  }, [params.name]);

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
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name}
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              {user.username && (
                <div className="flex items-center space-x-2">
                  <p className="text-gray-500">@{user.username}</p>
                  <a
                    href={`https://twitter.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">自己紹介</h2>
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">
              {user.description || '自己紹介文はありません'}
            </p>
          </div>

          {user.status !== 'unavailable' && availablePrices.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-4">料金プラン</h2>
              <div className="space-y-4">
                {availablePrices.map((price) => (
                  <div key={price.id} className="p-4 border border-gray-200 rounded-md">
                    <div className="font-medium mb-1">¥{price.amount.toLocaleString()}</div>
                    {price.description && (
                      <div className="text-sm text-gray-500 mb-4">{price.description}</div>
                    )}
                    <a
                      href={`/c/${user.name}?plan=${price.id}`}
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
            <div className="mt-6">
              <div className="text-yellow-700 bg-yellow-100 p-4 rounded-md">
                現在リクエストを受け付けていません
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 