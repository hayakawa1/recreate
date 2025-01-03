'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

interface PriceEntry {
  id: string;
  amount: number;
  description: string;
}

export default function NewRequestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [priceEntry, setPriceEntry] = useState<PriceEntry | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = searchParams.get('user');
        const planId = searchParams.get('plan');

        if (!userId || !planId) {
          throw new Error('必要なパラメータが不足しています');
        }

        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error('ユーザー情報の取得に失敗しました');
        }
        const userData = await userResponse.json();
        setUser(userData);

        const selectedPrice = userData.price_entries.find((p: PriceEntry) => p.id === planId);
        if (!selectedPrice) {
          throw new Error('指定された料金プランが見つかりません');
        }
        setPriceEntry(selectedPrice);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !user?.id || !priceEntry?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: user.id,
          priceId: priceEntry.id,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error('リクエストの送信に失敗しました');
      }

      router.push('/requests/sent');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-gray-600">ログインしてください</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
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

  if (!user || !priceEntry) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-red-700 bg-red-100 p-4 rounded-md">
          必要な情報が見つかりません
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">リクエストの送信</h1>

          <div className="mb-6">
            <div className="flex items-center space-x-4">
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{user.name}</p>
                {user.username && (
                  <p className="text-sm text-gray-500">@{user.username}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="font-medium mb-1">
                ¥{priceEntry.amount.toLocaleString()}
              </div>
              {priceEntry.description && (
                <div className="text-sm text-gray-600">
                  {priceEntry.description}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                リクエスト内容
              </label>
              <textarea
                id="description"
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? '送信中...' : 'リクエストを送信'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 