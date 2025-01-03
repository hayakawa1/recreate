'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<'available' | 'availableButHidden' | 'unavailable'>('unavailable');
  const [introduction, setIntroduction] = useState('');
  const [price, setPrice] = useState<number>(1000);
  const [stripeUrl, setStripeUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (authStatus === 'loading') return;
    
    if (authStatus === 'unauthenticated') {
      router.replace('/auth/signin');
      return;
    }

    if (authStatus === 'authenticated' && session?.user?.id) {
      setIsLoading(true);
      fetch('/api/users/me')
        .then((res) => {
          if (!res.ok) {
            throw new Error('プロフィールの取得に失敗しました');
          }
          return res.json();
        })
        .then((data) => {
          setUserStatus(data.status || 'unavailable');
          setIntroduction(data.introduction || '');
          setPrice(data.price || 1000);
          setStripeUrl(data.stripeLink || '');
        })
        .catch((error) => {
          console.error('Error:', error);
          setError('プロフィールの取得に失敗しました');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [authStatus, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: userStatus,
          introduction,
          price,
          stripeUrl
        }),
      });

      if (!response.ok) {
        throw new Error('プロフィールの更新に失敗しました');
      }

      setSuccess('プロフィールを更新しました');
    } catch (error) {
      console.error('Error:', error);
      setError('プロフィールの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">プロフィール設定</h1>
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 text-green-700 bg-green-100 rounded-md">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ステータス
          </label>
          <select
            value={userStatus}
            onChange={(e) => setUserStatus(e.target.value as typeof userStatus)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="available">リクエスト受付中</option>
            <option value="availableButHidden">非公開で受付中</option>
            <option value="unavailable">リクエスト停止中</option>
          </select>
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
            />
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
          <label
            htmlFor="stripeUrl"
            className="block text-sm font-medium text-gray-700"
          >
            ストライプの決済URL
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="stripeUrl"
              id="stripeUrl"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={stripeUrl}
              onChange={(e) => setStripeUrl(e.target.value)}
              placeholder="https://buy.stripe.com/..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : '保存する'}
          </button>
        </div>
      </form>
    </div>
  );
} 