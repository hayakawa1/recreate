'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type User = {
  id: string;
  name: string | null;
  image: string | null;
  status: boolean | null;
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

  useEffect(() => {
    // クリエイター情報を取得
    fetch(`/api/users/${params.userId}`)
      .then((res) => res.json())
      .then((data) => setCreator(data))
      .catch((error) => console.error('Error:', error));
  }, [params.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      alert('ログインが必要です');
      return;
    }

    const response = await fetch('/api/works', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        budget: parseInt(budget),
        creatorId: params.userId,
      }),
    });

    if (response.ok) {
      alert('リクエストを送信しました');
      router.push('/requests');
    } else {
      alert('エラーが発生しました');
    }
  };

  if (!creator) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center space-x-4 mb-8">
        {creator.image && (
          <Image
            src={creator.image}
            alt={creator.name || ''}
            width={64}
            height={64}
            className="rounded-full"
          />
        )}
        <h1 className="text-2xl font-bold">
          {creator.name}さんへのリクエスト
        </h1>
      </div>

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
    </div>
  );
} 