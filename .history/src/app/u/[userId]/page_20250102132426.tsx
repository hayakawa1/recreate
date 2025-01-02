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

    const requestData = {
      description,
      budget: parseInt(budget),
      creatorId: creator.id,
    };
    console.log('Sending request:', requestData);

    const response = await fetch('/api/works', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      alert('リクエストを送信しました');
      router.push('/requests');
    } else {
      const error = await response.text();
      alert(`エラーが発生しました: ${error}`);
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
                className="text-blue-500 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
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