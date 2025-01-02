'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<boolean>(false);
  const [stripeLink, setStripeLink] = useState<string>('');

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    // ユーザー情報を取得
    fetch(`/api/users/${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status || false);
        setStripeLink(data.stripeLink || '');
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
            受注可能ステータス
          </label>
          <div className="mt-1">
            <input
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2">受注可能</span>
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