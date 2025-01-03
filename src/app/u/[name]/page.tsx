'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { WorkStatus } from '@/types';

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
    is_hidden: boolean;
  }[];
}

interface Work {
  id: string;
  sequentialId: number;
  description: string;
  status: WorkStatus;
  amount: number;
  creator: {
    name: string;
    image: string;
    username: string | null;
  };
}

export default function CreatorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPriceId, setSelectedPriceId] = useState<string>('');
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentStats, setSentStats] = useState({
    total: 0,
    requested: 0,
    delivered: 0,
    paid: 0,
    rejected: 0
  });
  const [receivedStats, setReceivedStats] = useState({
    total: 0,
    requested: 0,
    delivered: 0,
    paid: 0,
    rejected: 0
  });

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

    const fetchStats = async () => {
      try {
        const sentResponse = await fetch('/api/works/sent');
        const receivedResponse = await fetch('/api/works/received');
        
        if (sentResponse.ok) {
          const sentData = await sentResponse.json();
          setSentStats({
            total: sentData.length,
            requested: sentData.filter(w => w.status === 'requested').length,
            delivered: sentData.filter(w => w.status === 'delivered').length,
            paid: sentData.filter(w => w.status === 'paid').length,
            rejected: sentData.filter(w => w.status === 'rejected').length
          });
        }
        
        if (receivedResponse.ok) {
          const receivedData = await receivedResponse.json();
          setReceivedStats({
            total: receivedData.length,
            requested: receivedData.filter(w => w.status === 'requested').length,
            delivered: receivedData.filter(w => w.status === 'delivered').length,
            paid: receivedData.filter(w => w.status === 'paid').length,
            rejected: receivedData.filter(w => w.status === 'rejected').length
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (params.name) {
      fetchUser();
      if (session) {
        fetchStats();
      }
    }
  }, [params.name, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    if (!selectedPriceId) {
      alert('料金プランを選択してください');
      return;
    }

    const selectedPrice = user?.price_entries.find(p => p.id === selectedPriceId);
    if (!selectedPrice) {
      alert('選択された料金プランが見つかりません');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          creatorName: user?.name,
          priceId: selectedPriceId,
          amount: selectedPrice.amount,
        }),
      });

      if (!response.ok) {
        throw new Error('リクエストの送信に失敗しました');
      }

      setDescription('');
      setSelectedPriceId('');
      setSentCount(prev => prev + 1);
      alert('リクエストを送信しました');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'リクエストの送信に失敗しました');
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

  const availablePrices = user?.price_entries.filter(entry => !entry.is_hidden) || [];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
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
            <div className="mt-8">
              <h2 className="text-lg font-medium mb-4">リクエストを送る</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    料金プラン
                  </label>
                  <div className="grid gap-4">
                    {availablePrices.map((price) => (
                      <label
                        key={price.id}
                        className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPriceId === price.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="price"
                          value={price.id}
                          checked={selectedPriceId === price.id}
                          onChange={(e) => setSelectedPriceId(e.target.value)}
                          className="sr-only"
                          required
                        />
                        <div className="flex-1">
                          <div className="font-medium">¥{price.amount.toLocaleString()}</div>
                          {price.description && (
                            <div className="text-sm text-gray-500 mt-1">{price.description}</div>
                          )}
                        </div>
                        <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                          selectedPriceId === price.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedPriceId === price.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    リクエスト内容
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="リクエストの詳細を入力してください"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !session}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      (isSubmitting || !session) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? '送信中...' : session ? 'リクエストを送信' : 'ログインしてリクエスト'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {user.status === 'unavailable' && (
            <div className="mt-6">
              <div className="text-yellow-700 bg-yellow-100 p-4 rounded-md">
                現在リクエストを受け付けていません
              </div>
            </div>
          )}

          {user.status !== 'unavailable' && availablePrices.length === 0 && (
            <div className="mt-6">
              <div className="text-yellow-700 bg-yellow-100 p-4 rounded-md">
                料金プランが設定されていません
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-medium mb-4">リクエスト状況</h2>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      リクエスト送信
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      リクエスト受信
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      総数
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sentStats.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receivedStats.total}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      依頼中
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sentStats.requested}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receivedStats.requested}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      納品済み
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sentStats.delivered}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receivedStats.delivered}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      支払い完了
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sentStats.paid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receivedStats.paid}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      お断り
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sentStats.rejected}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receivedStats.rejected}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 