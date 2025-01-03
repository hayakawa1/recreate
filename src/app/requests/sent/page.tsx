'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { WorkStatus, workStatusDisplayNames } from '@/types/work';
import Image from 'next/image';
import Link from 'next/link';

interface Work {
  id: string;
  sequentialId: number;
  message: string;
  status: string;
  amount: number;
  stripe_url: string;
  creator: {
    name: string;
    image: string;
    username: string;
  };
}

export default function SentRequestsPage() {
  const { data: session } = useSession();
  const [works, setWorks] = useState<Work[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingWorkId, setDownloadingWorkId] = useState<string | null>(null);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkStatus | 'all'>('all');

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await fetch('/api/works/sent');
        if (response.ok) {
          const data = await response.json();
          // APIレスポンスの型変換
          const works: Work[] = data.map((work: any) => ({
            ...work,
            status: work.status as WorkStatus
          }));
          setWorks(works);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching works:', error);
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchWorks();
    }
  }, [session]);

  // 検索とフィルタリングを適用
  useEffect(() => {
    let result = [...works];
    
    // 検索フィルタを適用
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(work => 
        work.message.toLowerCase().includes(query) ||
        work.creator.name.toLowerCase().includes(query) ||
        work.creator.username?.toLowerCase().includes(query) ||
        work.sequentialId.toString().includes(query)
      );
    }

    // ステータスフィルタを適用
    if (statusFilter !== 'all') {
      result = result.filter(work => work.status === statusFilter);
    }

    setFilteredWorks(result);
  }, [works, searchQuery, statusFilter]);

  // 統計情報を計算（filteredWorksを使用）
  const stats = {
    total: filteredWorks.length,
    requested: filteredWorks.filter(w => w.status === 'requested').length,
    delivered: filteredWorks.filter(w => w.status === 'delivered').length,
    paid: filteredWorks.filter(w => w.status === 'paid').length,
    rejected: filteredWorks.filter(w => w.status === 'rejected').length,
  };

  const handleDownload = async (workId: string) => {
    setDownloadingWorkId(workId);
    try {
      const response = await fetch(`/api/works/by-id/${workId}/download-url`);
      if (response.ok) {
        const { url } = await response.json();
        window.open(url, '_blank');
      } else {
        throw new Error('ダウンロードURLの取得に失敗しました');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('ダウンロードに失敗しました');
    } finally {
      setDownloadingWorkId(null);
    }
  };

  const handleConfirmPayment = async (workId: string) => {
    setConfirmingPaymentId(workId);
    try {
      const response = await fetch(`/api/works/by-id/${workId}/paid`, {
        method: 'POST',
      });

      if (response.ok) {
        // 成功したら作品リストを更新
        const updatedWorks = works.map(work => 
          work.id === workId ? { ...work, status: 'paid' as WorkStatus } : work
        );
        setWorks(updatedWorks);
        alert('入金確認が完了しました');
      } else {
        const errorText = await response.text();
        console.error('Payment confirmation failed:', errorText);
        alert(`入金確認に失敗しました: ${errorText}`);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert(error instanceof Error ? error.message : '入金確認に失敗しました');
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">送信したリクエスト</h1>
        <div className="flex gap-4">
          <Link
            href="/requests/received"
            className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded-md hover:bg-yellow-50"
          >
            受信一覧
          </Link>
          <Link
            href="/requests/sent"
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            送信一覧
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="検索（説明文、クリエイター名、ID）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkStatus | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">全てのステータス</option>
                {Object.entries(workStatusDisplayNames).map(([status, displayName]) => (
                  <option key={status} value={status}>
                    {displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-2">統計情報</h2>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-500">全体</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{workStatusDisplayNames.requested}</p>
              <p className="text-xl font-bold">{stats.requested}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{workStatusDisplayNames.delivered}</p>
              <p className="text-xl font-bold">{stats.delivered}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{workStatusDisplayNames.paid}</p>
              <p className="text-xl font-bold">{stats.paid}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{workStatusDisplayNames.rejected}</p>
              <p className="text-xl font-bold">{stats.rejected}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="col-span-full text-center py-8">読み込み中...</div>
        ) : filteredWorks.length === 0 ? (
          <div className="col-span-full text-center py-8">
            {works.length === 0 ? 'リクエストはまだありません' : '条件に一致するリクエストはありません'}
          </div>
        ) : (
          filteredWorks.map((work) => (
            <div key={work.id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 relative">
                      <Image
                        src={work.creator.image || '/default-avatar.png'}
                        alt={work.creator.name}
                        className="rounded-full"
                        fill
                        sizes="40px"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">{work.creator.name}</p>
                      {work.creator.username && (
                        <p className="text-sm text-gray-500">
                          @{work.creator.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-lg font-bold">
                      ¥{work.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-500">#{work.sequentialId}</span>
                    <span
                      className={`px-2 py-1 text-sm rounded-full ${
                        work.status === 'requested'
                          ? 'bg-blue-100 text-blue-800'
                          : work.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : work.status === 'paid'
                          ? 'bg-yellow-100 text-yellow-800'
                          : work.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {workStatusDisplayNames[work.status]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">リクエスト内容</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {work.message}
                    </p>
                  </div>
                  {work.status === 'delivered' && (
                    <div className="mt-4 flex flex-col gap-2">
                      <a
                        href={work.stripe_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
                      >
                        支払いページへ
                      </a>
                    </div>
                  )}
                  {work.status === 'paid' && (
                    <div className="text-sm text-green-600">
                      支払い済み
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 