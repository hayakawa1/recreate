'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { WorkStatus } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface Work {
  id: string;
  sequentialId: number;
  description: string;
  status: WorkStatus;
  amount: number;
  stripe_url: string | null;
  requester: {
    name: string;
    image: string;
    username: string | null;
  };
}

export default function ReceivedRequestsPage() {
  const { data: session } = useSession();
  const [works, setWorks] = useState<Work[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingWorkId, setDownloadingWorkId] = useState<string | null>(null);
  const [deliveringWorkId, setDeliveringWorkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkStatus | 'all'>('all');

  // 検索とフィルタリングを適用
  useEffect(() => {
    let result = [...works];
    
    // 検索フィルタを適用
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(work => 
        work.description.toLowerCase().includes(query) ||
        work.requester.name.toLowerCase().includes(query) ||
        work.requester.username?.toLowerCase().includes(query) ||
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
    requested: filteredWorks.filter(w => w.status === 'pending').length,
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

  const handleDeliver = async (workId: string) => {
    setDeliveringWorkId(workId);
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/works/by-id/${workId}/deliver`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          // 成功したら作品リストを更新
          const updatedWorks = works.map(work => 
            work.id === workId ? { ...work, status: 'delivered' } : work
          );
          setWorks(updatedWorks);
          alert('納品が完了しました');
        } else {
          const errorText = await response.text();
          console.error('Delivery failed:', errorText);
          alert(`納品に失敗しました: ${errorText}`);
        }
      };
      input.click();
    } catch (error) {
      console.error('Error delivering work:', error);
      alert(error instanceof Error ? error.message : '納品に失敗しました');
    } finally {
      setDeliveringWorkId(null);
    }
  };

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await fetch('/api/works/received');
        if (response.ok) {
          const data = await response.json();
          setWorks(data);
        }
      } catch (error) {
        console.error('Error fetching works:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchWorks();
    }
  }, [session]);

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">受信したリクエスト</h1>
        <div className="flex gap-4">
          <Link
            href="/requests/received"
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            受信一覧
          </Link>
          <Link
            href="/requests/sent"
            className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded-md hover:bg-yellow-50"
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
                placeholder="検索（説明文、リクエスター名、ID）"
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
                <option value="pending">リクエスト中</option>
                <option value="delivered">納品済み</option>
                <option value="paid">支払い済み</option>
                <option value="rejected">却下</option>
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
              <p className="text-sm text-gray-500">リクエスト中</p>
              <p className="text-xl font-bold">{stats.requested}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">納品済み</p>
              <p className="text-xl font-bold">{stats.delivered}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">支払い済み</p>
              <p className="text-xl font-bold">{stats.paid}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">拒否</p>
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
                        src={work.requester.image || '/default-avatar.png'}
                        alt={work.requester.name}
                        className="rounded-full"
                        fill
                        sizes="40px"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">{work.requester.name}</p>
                      {work.requester.username && (
                        <p className="text-sm text-gray-500">
                          @{work.requester.username}
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
                        work.status === 'pending'
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
                      {work.status === 'pending'
                        ? 'リクエスト中'
                        : work.status === 'delivered'
                        ? '納品済み'
                        : work.status === 'paid'
                        ? '支払い済み'
                        : work.status === 'rejected'
                        ? '拒否'
                        : work.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">リクエスト内容</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {work.description}
                    </p>
                  </div>
                  {work.status === 'pending' && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleDeliver(work.id)}
                        disabled={deliveringWorkId === work.id}
                        className={`w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 ${
                          deliveringWorkId === work.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {deliveringWorkId === work.id ? '納品中...' : '納品する'}
                      </button>
                    </div>
                  )}
                  {work.status === 'delivered' && (
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleDownload(work.id)}
                        disabled={downloadingWorkId === work.id}
                        className={`w-full px-4 py-2 border border-yellow-500 rounded-md text-yellow-600 hover:bg-yellow-50 ${
                          downloadingWorkId === work.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {downloadingWorkId === work.id ? 'ダウンロード中...' : '納品物をダウンロード'}
                      </button>
                      {work.stripe_url && (
                        <a
                          href={work.stripe_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-center"
                        >
                          支払いページへ
                        </a>
                      )}
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