'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function RequestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>(searchParams.get('plan') || '');
  const [message, setMessage] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan || !message.trim()) return;

    try {
      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          priceId: selectedPlan,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('リクエストの送信に失敗しました');
      }

      router.push('/requests/sent');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    }
  };

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
          <div className="flex items-center space-x-4 mb-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                料金プラン
              </label>
              <select
                id="plan"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">プランを選択してください</option>
                {availablePrices.map((price) => (
                  <option key={price.id} value={price.id}>
                    ¥{price.amount.toLocaleString()} - {price.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                メッセージ
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="依頼内容を詳しく記入してください"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                リクエストを送信
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 