'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type User = {
  id: string;
  name: string;
  username: string | null;
  image: string;
  status: 'available' | 'availableButHidden' | 'unavailable';
  description: string | null;
  stripeLink: string | null;
};

export default function UserPage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${params.username}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.error || 'ユーザーの取得に失敗しました');
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch((error) => {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'ユーザーの取得に失敗しました');
      })
      .finally(() => {
        setIsLoading(false);
      });
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

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-500">{error || 'ユーザーが見つかりません'}</div>
          <Link href="/" className="text-blue-500 hover:text-blue-700 mt-4 inline-block">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

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
                <p className="text-gray-500">@{user.username}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">自己紹介</h2>
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">
              {user.description || '自己紹介文はありません'}
            </p>
          </div>

          <div className="mt-6">
            <Link
              href={`/c/${user.username}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              クリエイターページを見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 