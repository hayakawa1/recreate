'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type PriceEntry = {
  id: string;
  title: string;
  amount: number;
  isHidden: boolean;
};

type PriceListProps = {
  items: PriceEntry[];
  showRequestButton?: boolean;
  creatorId?: string;
};

export function PriceList({ items, showRequestButton = false, creatorId }: PriceListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedPrice, setSelectedPrice] = useState<PriceEntry | null>(null);
  const [stripeUrl, setStripeUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const visibleItems = items.filter(item => !item.isHidden);

  const handleRequest = async () => {
    if (!selectedPrice || !description || !stripeUrl || !creatorId || !session?.user?.id) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          creatorId,
          amount: selectedPrice.amount,
          stripeUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      const work = await response.json();
      router.push('/requests/sent');
    } catch (error) {
      console.error('Error creating request:', error);
      alert('リクエストの作成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 border rounded-lg cursor-pointer ${
              selectedPrice?.id === item.id ? 'border-blue-500' : 'border-gray-200'
            }`}
            onClick={() => setSelectedPrice(item)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-lg">¥{item.amount.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {showRequestButton && selectedPrice && session?.user && (
        <div className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              リクエスト内容
            </label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="依頼内容を詳しく記載してください"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stripe決済URL
            </label>
            <input
              type="url"
              className="w-full p-2 border rounded-md"
              value={stripeUrl}
              onChange={(e) => setStripeUrl(e.target.value)}
              placeholder="https://buy.stripe.com/..."
            />
          </div>

          <button
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            onClick={handleRequest}
            disabled={!description || !stripeUrl || isLoading}
          >
            {isLoading ? '送信中...' : 'リクエストを送信'}
          </button>
        </div>
      )}
    </div>
  );
} 