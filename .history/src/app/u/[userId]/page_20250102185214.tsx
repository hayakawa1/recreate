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
  price: number | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    if (!creator) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          creatorId: creator.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setDescription('');
      setIsSubmitting(false);
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      setIsSubmitting(false);
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

      {creator.price && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">金額</h2>
          <p className="text-4xl font-bold text-blue-600">¥{creator.price.toLocaleString()}</p>
        </div>
      )}

      {creator.status !== 'unavailable' ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              リクエスト内容
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                name="description"
                rows={4}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? '送信中...' : 'リクエストを送信'}
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