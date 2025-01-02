'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type User = {
  id: string;
  name: string | null;
  image: string | null;
  status: 'available' | 'availableButHidden' | 'unavailable';
  username: string | null;
  introduction: string | null;
};

export default function UserPage({
  params,
}: {
  params: { userId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [creator, setCreator] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // クリエイター情報を取得
    fetch(`/api/users/${params.userId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('ユーザーが見つかりません');
        }
        return res.json();
      })
      .then((data) => {
        setCreator(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        setError(error.message);
        setIsLoading(false);
      });
  }, [params.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      alert('ログインが必要です');
      return;
    }

    if (!creator) {
      alert('クリエイター情報が取得できません');
      return;
    }

    try {
      // 支払いリンクを生成
      const paymentResponse = await fetch('/api/payment/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseInt(budget),
          description: `${creator.name}さんへのリクエスト: ${description}`,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('支払いリンクの生成に失敗しました');
      }

      const { url: paymentUrl } = await paymentResponse.json();

      const requestData = {
        description,
        budget: parseInt(budget),
        creatorId: creator.id,
        paymentUrl,
      };

      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        alert('リクエストを送信しました');
        router.push('/requests/sent');
      } else {
        const error = await response.text();
        alert(`エラーが発生しました: ${error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">ユーザーが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-start space-x-6 mb-8">
        {creator.image && (
          <Image
            src={creator.image}
            alt={creator.name || ''}
            width={128}
            height={128}
            className="rounded-full"
            quality={95}
          />
        )}
        <div className="pt-2">
          <h1 className="text-2xl font-bold">
            {creator.name}さんのページ
          </h1>
          {creator.username && (
            <div className="flex items-center space-x-2">
              <p className="text-gray-600 text-lg">@{creator.username}</p>
              <a
                href={`https://twitter.com/${creator.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {creator.introduction && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">自己紹介</h2>
          <p className="whitespace-pre-wrap">{creator.introduction}</p>
        </div>
      )}

      <div className="mb-8">
        <a
          href="https://dashboard.stripe.com/test/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Stripeダッシュボードを開く
        </a>
      </div>

      {creator.status !== 'unavailable' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              リクエストの内容
            </label>
            <div className="mt-1">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="作品の詳細な要望を記入してください"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              予算（円）
            </label>
            <div className="mt-1">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="10000"
                required
              />
            </div>
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
      ) : (
        <div className="text-center py-8 text-gray-500">
          現在、リクエストを受け付けていません
        </div>
      )}
    </div>
  );
} 