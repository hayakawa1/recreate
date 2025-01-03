'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type PriceEntry = {
  id?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // プロフィール情報の取得
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
          if (!res.ok) throw new Error('プロフィールの取得に失敗しました');
          return res.json();
        })
        .then((data) => {
          setUserStatus(data.status || 'unavailable');
          setDescription(data.description || '');
          if (data.price_entries?.length > 0) {
            setPriceEntries(data.price_entries.map((entry: any) => ({
              id: entry.id,
              amount: entry.amount,
              stripeUrl: entry.stripe_url || '',
              description: entry.description || '',
              isHidden: entry.is_hidden
            })));
          }
        })
        .catch((error) => {
          console.error('Error:', error);
          setError('プロフィールの取得に失敗しました');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [authStatus, session?.user?.id, router]);

  // ステータス変更
  const handleStatusChange = async (newStatus: typeof userStatus) => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();
      setUserStatus(newStatus);
      setSuccess('ステータスを更新しました');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Status update error:', error);
      setError(error instanceof Error ? error.message : 'ステータスの更新に失敗しました');
      // エラーが発生した場合は元のステータスに戻す
      setUserStatus(userStatus);
    }
  };

  // 自己紹介変更
  const handleDescriptionChange = async (newDescription: string) => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription })
      });

      if (!response.ok) throw new Error('自己紹介の更新に失敗しました');
      
      setDescription(newDescription);
      setSuccess('自己紹介を更新しました');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : '自己紹介の更新に失敗しました');
    }
  };

  // 料金プラン更新
  const updatePriceEntry = async (entry: PriceEntry) => {
    try {
      const response = await fetch('/api/users/me/price-entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry.id,
          amount: entry.amount,
          stripe_url: entry.stripeUrl,
          description: entry.description,
          is_hidden: entry.isHidden
        })
      });

      if (!response.ok) throw new Error('料金プランの更新に失敗しました');

      const updatedEntry = await response.json();
      setPriceEntries(current => 
        current.map(e => e.id === updatedEntry.id ? {
          id: updatedEntry.id,
          amount: updatedEntry.amount,
          stripeUrl: updatedEntry.stripe_url,
          description: updatedEntry.description,
          isHidden: updatedEntry.is_hidden
        } : e)
      );
      setSuccess('料金プランを更新しました');
      setTimeout(() => setSuccess(''), 2000);
      return updatedEntry;
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : '料金プランの更新に失敗しました');
      throw error;
    }
  };

  // 料金プラン追加
  const handleAddPriceEntry = async () => {
    const newEntry = {
      amount: 1000,
      stripeUrl: '',
      description: '',
      isHidden: false
    };

    try {
      const response = await fetch('/api/users/me/price-entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: newEntry.amount,
          stripe_url: newEntry.stripeUrl,
          description: newEntry.description,
          is_hidden: newEntry.isHidden
        })
      });

      if (!response.ok) throw new Error('料金プランの追加に失敗しました');

      const createdEntry = await response.json();
      setPriceEntries(current => [...current, {
        id: createdEntry.id,
        amount: createdEntry.amount,
        stripeUrl: createdEntry.stripe_url,
        description: createdEntry.description,
        isHidden: createdEntry.is_hidden
      }]);
      setSuccess('料金プランを追加しました');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : '料金プランの追加に失敗しました');
    }
  };

  // 料金プラン削除
  const handleDeletePriceEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/users/me/price-entries?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('料金プランの削除に失敗しました');

      setPriceEntries(current => current.filter(entry => entry.id !== id));
      setSuccess('料金プランを削除しました');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : '料金プランの削除に失敗しました');
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
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ステータス
          </label>
          <select
            value={userStatus}
            onChange={(e) => handleStatusChange(e.target.value as typeof userStatus)}
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
              onBlur={(e) => handleDescriptionChange(e.target.value)}
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
            {priceEntries.map((entry) => (
              <div key={entry.id} className={`space-y-2 p-4 border border-gray-200 rounded-md ${
                entry.isHidden ? 'bg-gray-50' : ''
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">金額</label>
                    <input
                      type="number"
                      min="300"
                      value={entry.amount}
                      onChange={(e) => {
                        const newEntry = { ...entry, amount: parseInt(e.target.value) };
                        setPriceEntries(current => 
                          current.map(e => e.id === entry.id ? newEntry : e)
                        );
                      }}
                      onBlur={() => updatePriceEntry(entry)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        entry.isHidden ? 'bg-gray-100' : ''
                      }`}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const newEntry = { ...entry, isHidden: !entry.isHidden };
                        await updatePriceEntry(newEntry);
                      }}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        entry.isHidden 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {entry.isHidden ? '非公開' : '公開中'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePriceEntry(entry.id!)}
                      className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">説明</label>
                  <textarea
                    value={entry.description}
                    onChange={(e) => {
                      const newEntry = { ...entry, description: e.target.value };
                      setPriceEntries(current => 
                        current.map(e => e.id === entry.id ? newEntry : e)
                      );
                    }}
                    onBlur={() => updatePriceEntry(entry)}
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
                    onChange={(e) => {
                      const newEntry = { ...entry, stripeUrl: e.target.value };
                      setPriceEntries(current => 
                        current.map(e => e.id === entry.id ? newEntry : e)
                      );
                    }}
                    onBlur={() => updatePriceEntry(entry)}
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
      </div>
    </div>
  );
} 