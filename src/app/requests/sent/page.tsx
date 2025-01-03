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
  creator: {
    name: string;
    image: string;
    username: string | null;
  };
}

export default function SentRequestsPage() {
  const { data: session } = useSession();
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingWorkId, setDownloadingWorkId] = useState<string | null>(null);

  // 統計情報を計算
  const stats = {
    total: works.length,
    requested: works.filter(w => w.status === 'requested').length,
    delivered: works.filter(w => w.status === 'delivered').length,
    paid: works.filter(w => w.status === 'paid').length,
    rejected: works.filter(w => w.status === 'rejected').length,
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

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await fetch('/api/works/sent');
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
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-gray-600">ログインしてください</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">送信したリクエスト一覧</h1>
        <Link
          href="/requests/received"
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>受信箱へ</span>
          <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">総リクエスト数</p>
          <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">依頼中</p>
          <p className="text-2xl font-bold text-blue-600">{stats.requested}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">納品済み</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.delivered}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">支払い完了</p>
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">お断り</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      <div className="space-y-6">
        {works.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            送信したリクエストはありません
          </p>
        ) : (
          works.map((work) => (
            <div
              key={work.id}
              className={`shadow rounded-lg overflow-hidden ${
                work.status === 'requested' ? 'bg-blue-50' :
                work.status === 'delivered' ? 'bg-yellow-50' :
                work.status === 'paid' ? 'bg-green-50' :
                work.status === 'rejected' ? 'bg-red-50' :
                'bg-white'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Image
                    src={work.creator.image}
                    alt={work.creator.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-medium">{work.creator.name}</p>
                    {work.creator.username && (
                      <p className="text-sm text-gray-500">
                        @{work.creator.username}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">リクエストID</span>
                    <span className="text-sm font-medium">#{work.sequentialId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">金額</span>
                    <span className="text-sm font-medium">
                      ¥{work.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">ステータス</span>
                    <span className={`text-sm font-medium ${
                      work.status === 'requested' ? 'text-blue-600' :
                      work.status === 'delivered' ? 'text-yellow-600' :
                      work.status === 'paid' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {work.status === 'requested' && '依頼中'}
                      {work.status === 'accepted' && '受付済み'}
                      {work.status === 'rejected' && 'お断り'}
                      {work.status === 'delivered' && '納品済み'}
                      {work.status === 'paid' && '支払い完了'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">リクエスト内容</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {work.description}
                    </p>
                  </div>
                  {work.status === 'delivered' && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleDownload(work.id)}
                        disabled={downloadingWorkId === work.id}
                        className={`w-full px-4 py-2 border border-yellow-500 rounded-md text-yellow-600 hover:bg-yellow-50 ${
                          downloadingWorkId === work.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {downloadingWorkId === work.id ? 'ダウンロード中...' : '納品物をダウンロード'}
                      </button>
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