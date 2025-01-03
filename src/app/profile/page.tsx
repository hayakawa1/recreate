'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type PriceEntry = {
  amount: number;
  stripeUrl: string;
  description: string;
  isHidden: boolean;
};

export default function ProfilePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<'available' | 'availableButHidden' | 'unavailable'>('unavailable');
  const [description, setDescription] = useState('');
  const [priceEntries, setPriceEntries] = useState<PriceEntry[]>([]);
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
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            throw new Error(errorData?.error || 'プロフィールの取得に失敗しました');
          }
          return res.json();
        })
        .then((data) => {
          setUserStatus(data.status || 'unavailable');
          setDescription(data.description || '');
          const entries = data.price_entries?.length > 0
            ? data.price_entries.map((entry: any) => ({
                amount: entry.amount,
                stripeUrl: entry.stripe_url || '',
                description: entry.description || entry.title || '',
                isHidden: entry.is_hidden
              }))
            : [{ 
                amount: 1000, 
                stripeUrl: '', 
                description: '',
                isHidden: false 
              }];
          setPriceEntries(entries);
        })
        .catch((error) => {
          console.error('Error:', error);
          setError('プロフィールの取得に失敗しました');
          setPriceEntries([{ 
            amount: 1000, 
            stripeUrl: '', 
            description: '',
            isHidden: false 
          }]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [authStatus, session?.user?.id, router]);

  const handleAddPriceEntry = () => {
    setPriceEntries([...priceEntries, { amount: 1000, stripeUrl: '', description: '', isHidden: false }]);
  };

  const handlePriceChange = (index: number, value: number) => {
    const newEntries = [...priceEntries];
    newEntries[index] = { ...newEntries[index], amount: value };
    setPriceEntries(newEntries);
  };

  const handleStripeUrlChange = (index: number, value: string) => {
    const newEntries = [...priceEntries];
    newEntries[index] = { ...newEntries[index], stripeUrl: value };
    setPriceEntries(newEntries);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newEntries = [...priceEntries];
    newEntries[index] = { ...newEntries[index], description: value };
    setPriceEntries(newEntries);
  };

  const handleVisibilityChange = (index: number) => {
    const newEntries = [...priceEntries];
    newEntries[index] = { ...newEntries[index], isHidden: !newEntries[index].isHidden };
    setPriceEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: userStatus,
          description,
          priceEntries: priceEntries.map(entry => ({
            title: entry.description,
            amount: entry.amount,
            stripe_url: entry.stripeUrl,
            description: entry.description,
            is_hidden: entry.isHidden
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'プロフィールの更新に失敗しました');
      }

      setSuccess('プロフィールを更新しました');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
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
    <div className="max-w-2xl mx-auto py-8 px-4">
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            金額とStripe決済URL
          </label>
          <div className="space-y-4">
            {priceEntries.map((entry, index) => (
              <div key={index} className={`space-y-2 p-4 border border-gray-200 rounded-md ${
                entry.isHidden ? 'bg-gray-50' : ''
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">金額</label>
                    <input
                      type="number"
                      min="300"
                      value={entry.amount}
                      onChange={(e) => handlePriceChange(index, parseInt(e.target.value))}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        entry.isHidden ? 'bg-gray-100' : ''
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVisibilityChange(index)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      entry.isHidden 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {entry.isHidden ? '非公開' : '公開中'}
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">説明</label>
                  <textarea
                    value={entry.description}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    rows={2}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      entry.isHidden ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Stripe決済URL</label>
                  <input
                    type="text"
                    value={entry.stripeUrl}
                    onChange={(e) => handleStripeUrlChange(index, e.target.value)}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      entry.isHidden ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddPriceEntry}
            className="mt-4 text-sm text-blue-600 hover:text-blue-500"
          >
            + 料金プランを追加
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? '更新中...' : '更新する'}
          </button>
        </div>
      </form>
    </div>
  );
} 