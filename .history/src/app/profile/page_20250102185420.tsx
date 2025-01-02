'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type UserStatus = 'available' | 'availableButHidden' | 'unavailable';

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<UserStatus>('unavailable');
  const [stripeLink, setStripeLink] = useState<string>('');
  const [introduction, setIntroduction] = useState<string>('');
  const [price, setPrice] = useState<number>(1000);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    // ユーザー情報を取得
    fetch(`/api/users/${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status || 'unavailable');
        setStripeLink(data.stripeLink || '');
        setIntroduction(data.introduction || '');
        setPrice(data.price?.toString() || '');
      });
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch(`/api/users/${session?.user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        stripeLink,
        introduction,
        price: price ? parseInt(price) : null,
      }),
    });

    if (response.ok) {
      alert('プロフィールを更新しました');
    } else {
      alert('エラーが発生しました');
    }
  };

  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">プロフィール管理</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            受注ステータス
          </label>
          <div className="mt-1">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="available">受注可能でReCreateのTOP画面にも出す</option>
              <option value="availableButHidden">受注可能だがReCreateのTOP画面には出さない</option>
              <option value="unavailable">受注不可</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            金額（最低300円）
          </label>
          <div className="mt-1">
            <input
              type="number"
              name="price"
              id="price"
              min="300"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={price}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 300) {
                  setPrice(value);
                }
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            自己紹介
          </label>
          <div className="mt-1">
            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              rows={4}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="受注できる内容や金額などを書きます"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stripeリンク
          </label>
          <div className="mt-1">
            <input
              type="text"
              value={stripeLink}
              onChange={(e) => setStripeLink(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="https://stripe.com/..."
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            更新
          </button>
        </div>
      </form>
    </div>
  );
} 