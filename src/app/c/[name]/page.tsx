'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function RequestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/by-name/${params.name}`);
        if (!response.ok) {
          throw new Error('ユーザーが見つかりません');
        }
        const data = await response.json();
        setUser(data);
        
        // URLからプランIDを取得して設定
        const planId = searchParams.get('plan');
        if (planId) {
          setSelectedPrice(planId);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.name) {
      fetchUser();
    }
  }, [params.name, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !user?.id || !selectedPrice || !description) {
      setError('必要な情報が不足しています');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: user.id,
          description,
          price_entry_id: selectedPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('リクエストの送信に失敗しました');
      }

      router.push('/requests/sent');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
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

  if (user.status === 'unavailable') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-yellow-700 bg-yellow-100 p-4 rounded-md">
          現在リクエストを受け付けていません
        </div>
      </div>
    );
  }

  const availablePrices = user.price_entries.filter(entry => !entry.is_hidden);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">{user.name}さんへのリクエスト</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">自己紹介</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{user.description || '自己紹介文はありません'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            プラン選択
          </label>
          <div className="space-y-4">
            {availablePrices.map((price) => (
              <label key={price.id} className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="price"
                  value={price.id}
                  checked={selectedPrice === price.id}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">¥{price.amount.toLocaleString()}</div>
                  {price.description && (
                    <div className="text-sm text-gray-500">{price.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            リクエスト内容
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="依頼内容を具体的に記載してください"
          />
        </div>

        {!session && (
          <div className="text-yellow-700 bg-yellow-100 p-4 rounded-md">
            リクエストを送信するにはログインが必要です
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !session || !selectedPrice || !description}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              (isSubmitting || !session || !selectedPrice || !description) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? '送信中...' : 'リクエストを送信'}
          </button>
        </div>
      </form>
    </div>
  );
} 