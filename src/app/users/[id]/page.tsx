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

interface WorkStats {
  sent: {
    pending: number;
    accepted: number;
    rejected: number;
    delivered: number;
    paid: number;
  };
  received: {
    pending: number;
    accepted: number;
    rejected: number;
    delivered: number;
    paid: number;
  };
}

export default function CreatorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<WorkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, statsResponse] = await Promise.all([
          fetch(`/api/users/${params.id}`),
          fetch(`/api/users/${params.id}/stats`)
        ]);

        if (!userResponse.ok) {
          throw new Error('ユーザーが見つかりません');
        }

        const userData = await userResponse.json();
        setUser(userData);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('Stats data:', statsData);
          setStats(statsData);
        } else {
          console.error('Stats response error:', await statsResponse.text());
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error instanceof Error ? error.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan || !message.trim() || !session?.user?.id) return;

    setIsSubmitting(true);
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

  const availablePrices = user.price_entries.filter(entry => !entry.is_hidden);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* プロフィール */}
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
          </div>
        </div>

        {/* 料金プラン */}
        {user.status !== 'unavailable' && availablePrices.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">料金プラン</h2>
              <div className="space-y-4">
                {availablePrices.map((price) => (
                  <div key={price.id} className="p-4 border border-gray-200 rounded-md">
                    <div className="font-medium mb-1">¥{price.amount.toLocaleString()}</div>
                    {price.description && (
                      <div className="text-sm text-gray-500">{price.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* リクエストフォーム */}
        {user.status !== 'unavailable' && availablePrices.length > 0 && session && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">リクエストを送る</h2>
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
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? '送信中...' : 'リクエストを送信'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {user.status === 'unavailable' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="text-yellow-700 bg-yellow-100 p-4 rounded-md">
                現在リクエストを受け付けていません
              </div>
            </div>
          </div>
        )}

        {/* 依頼履歴 */}
        {stats && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">依頼履歴</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-gray-500 py-2"></th>
                      <th className="text-center font-medium text-gray-500 py-2">受信</th>
                      <th className="text-center font-medium text-gray-500 py-2">送信</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-left text-sm text-gray-900 py-2">未対応</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.received.pending}</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.sent.pending}</td>
                    </tr>
                    <tr>
                      <td className="text-left text-sm text-gray-900 py-2">作業中</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.received.accepted}</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.sent.accepted}</td>
                    </tr>
                    <tr>
                      <td className="text-left text-sm text-gray-900 py-2">却下</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.received.rejected}</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.sent.rejected}</td>
                    </tr>
                    <tr>
                      <td className="text-left text-sm text-gray-900 py-2">納品済み</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.received.delivered}</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.sent.delivered}</td>
                    </tr>
                    <tr>
                      <td className="text-left text-sm text-gray-900 py-2">支払済み</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.received.paid}</td>
                      <td className="text-center text-sm text-gray-900 py-2">{stats.sent.paid}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 