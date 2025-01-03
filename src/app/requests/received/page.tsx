'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { WorkStatus } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ステータスに応じたスタイルを定義
const statusStyles = {
  requested: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-600',
    label: '依頼中'
  },
  delivered: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-600',
    label: '納品済み'
  },
  paid: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-600',
    label: '支払い完了'
  },
  rejected: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-600',
    label: 'お断り済み'
  }
};

// アップロード進捗コンポーネント
const UploadProgress = ({ progress }: { progress: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative pt-1"
  >
    <div className="flex mb-2 items-center justify-between">
      <div className="flex items-center">
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-medium text-blue-600">
          アップロード中...
        </span>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium text-blue-600">
          {progress}%
        </span>
      </div>
    </div>
    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
      <motion.div
        style={{ width: `${progress}%` }}
        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  </motion.div>
);

type Work = {
  id: string;
  sequentialId: number;
  description: string;
  status: WorkStatus;
  deliveryFileUrl: string | null;
  requester: {
    name: string;
    image: string;
    username: string | null;
    stripeLink: string | null;
  };
  creator: {
    name: string;
    image: string;
    username: string | null;
    stripeLink: string | null;
  };
  payments: {
    amount: number;
    stripeLink: string | null;
    isHidden: boolean;
  }[];
};

export default function ReceivedRequests() {
  const { data: session } = useSession();
  const router = useRouter();
  const [receivedWorks, setReceivedWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<'all' | WorkStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // フィルタリングされた作品リストを取得
  const filteredWorks = receivedWorks.filter(
    (work) => 
      (selectedStatus === 'all' || work.status === selectedStatus) &&
      (searchQuery === '' || 
        work.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.requester.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.requester.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // 統計情報を計算
  const stats = {
    total: receivedWorks.length,
    requested: receivedWorks.filter(w => w.status === 'requested').length,
    delivered: receivedWorks.filter(w => w.status === 'delivered').length,
    paid: receivedWorks.filter(w => w.status === 'paid').length,
    rejected: receivedWorks.filter(w => w.status === 'rejected').length,
    totalEarnings: receivedWorks
      .filter(w => w.status === 'paid')
      .reduce((sum, work) => {
        const payment = work.payments[0]; // 最初の支払いのみを使用
        return payment ? sum + payment.amount : sum;
      }, 0),
  };

  // 統計情報コンポーネント
  const Stats = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
    >
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">総依頼数</p>
        <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">進行中</p>
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
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">総収入</p>
        <p className="text-2xl font-bold text-gray-700">¥{stats.totalEarnings.toLocaleString()}</p>
      </div>
    </motion.div>
  );

  // 検索バーコンポーネント
  const SearchBar = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6"
    >
      <div className="relative">
        <input
          type="text"
          placeholder="依頼内容、依頼者名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </motion.div>
  );

  // ステータスフィルターコンポーネント
  const StatusFilter = () => {
    const filters = [
      { value: 'all', label: 'すべて' },
      { value: 'requested', label: '依頼中' },
      { value: 'delivered', label: '納品済み' },
      { value: 'paid', label: '支払い完了' },
      { value: 'rejected', label: 'お断り済み' },
    ];

    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedStatus(filter.value as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                selectedStatus === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    fetch(`/api/works/received`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.error || `HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Received works:', data);
        setReceivedWorks(data);
      })
      .catch((error) => {
        console.error('Error fetching works:', error);
        // ここでエラー状態を設定したり、ユーザーに通知したりできます
      });
  }, [session, router]);

  const handleFileUpload = async (workId: string, file: File) => {
    // ファイルサイズチェック (100MB制限)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      alert('ファイルサイズは100MB以下にしてください');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/works/${workId}/delivery`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('アップロードに失敗しました');
      }

      const data = await response.json();
      setUploadProgress(100);

      // アップロード成功時の処理
      const updatedWorks = await fetch(`/api/works/received`).then((res) =>
        res.json()
      );
      setReceivedWorks(updatedWorks);
      alert('ファイルを納品しました');

    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'ファイルのアップロードに失敗しました');
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDownload = async (workId: string) => {
    try {
      const response = await fetch(`/api/works/${workId}/delivery`);
      const data = await response.json();

      if (response.ok && data.url) {
        // 新しいタブでダウンロードURLを開く
        window.open(data.url, '_blank');
      } else {
        alert('ダウンロードURLの取得に失敗しました');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('ダウンロードURLの取得に失敗しました');
    }
  };

  const handleReject = async (workId: string) => {
    const response = await fetch(`/api/works/${workId}/reject`, {
      method: 'POST',
    });

    if (response.ok) {
      // リクエスト一覧を更新
      const updatedWorks = await fetch(`/api/works/received`).then((res) =>
        res.json()
      );
      setReceivedWorks(updatedWorks);
    } else {
      alert('エラーが発生しました');
    }
  };

  const handleConfirmPayment = async (workId: string) => {
    const response = await fetch(`/api/works/${workId}/paid`, {
      method: 'POST',
    });

    if (response.ok) {
      // リクエスト一覧を更新
      const updatedWorks = await fetch(`/api/works/received`).then((res) =>
        res.json()
      );
      setReceivedWorks(updatedWorks);
      alert('支払い完了を確認しました');
    } else {
      alert('エラーが発生しました');
    }
  };

  // アニメーションの設定
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          リクエスト受信箱
        </h1>
        <Link
          href="/requests/sent"
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>送信箱へ</span>
          <span>→</span>
        </Link>
      </motion.div>

      <Stats />
      <SearchBar />
      <StatusFilter />

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredWorks.length > 0 ? (
            filteredWorks.map((work) => (
              <motion.div
                key={work.id}
                layout
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={variants}
                className={`border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${statusStyles[work.status].bg} ${statusStyles[work.status].border} border-l-4`}
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      {work.requester.image && (
                        <div className="relative">
                          <Image
                            src={work.requester.image}
                            alt={work.requester.name}
                            width={48}
                            height={48}
                            className="rounded-full ring-2 ring-white"
                          />
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white flex items-center justify-center">
                            <div className={`h-3 w-3 rounded-full ${
                              work.status === 'requested' ? 'bg-blue-500' :
                              work.status === 'delivered' ? 'bg-yellow-500' :
                              work.status === 'paid' ? 'bg-green-500' :
                              'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-lg">{work.requester.name}さんから</p>
                        {work.requester.username && (
                          <p className="text-sm text-gray-500">
                            @{work.requester.username}
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.div 
                      className="text-3xl font-bold text-gray-400"
                      whileHover={{ scale: 1.1, color: '#2563EB' }}
                      whileTap={{ scale: 0.95 }}
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    >
                      #{work.sequentialId}
                    </motion.div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-white bg-opacity-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{work.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-lg font-semibold text-gray-900">
                          {work.payments[0] && !work.payments[0].isHidden 
                            ? `¥${work.payments[0].amount.toLocaleString()}`
                            : '非公開'}
                        </p>
                        <motion.p 
                          className={`text-sm font-medium ${statusStyles[work.status].text} px-3 py-1 rounded-full ${statusStyles[work.status].bg}`}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          {statusStyles[work.status].label}
                        </motion.p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    {work.status === 'requested' && (
                      <div className="flex flex-col space-y-3">
                        <div className="relative group">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(work.id, file);
                            }}
                            disabled={loading}
                            className="block w-full text-sm text-gray-500 
                              file:mr-4 file:py-2 file:px-4 
                              file:rounded-full file:border-0 
                              file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700 
                              hover:file:bg-blue-100 
                              disabled:opacity-50
                              cursor-pointer
                              transition-all"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity" />
                        </div>
                        {loading && uploadProgress > 0 && (
                          <UploadProgress progress={uploadProgress} />
                        )}
                        <motion.button
                          whileHover={{ scale: 1.01, backgroundColor: '#FEE2E2' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReject(work.id)}
                          disabled={loading}
                          className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors"
                        >
                          お断りする
                        </motion.button>
                      </div>
                    )}
                    {work.status === 'delivered' && (
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-2 text-yellow-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>納品済み</span>
                        </div>
                        {work.deliveryFileUrl && (
                          <motion.button
                            whileHover={{ scale: 1.01, backgroundColor: '#EFF6FF' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDownload(work.id)}
                            className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center justify-center space-x-2"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>ファイルをダウンロード</span>
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.01, backgroundColor: '#F0FDF4' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleConfirmPayment(work.id)}
                          className="w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>支払い完了を確認</span>
                        </motion.button>
                      </div>
                    )}
                    {work.status === 'paid' && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>支払い完了</span>
                      </div>
                    )}
                    {work.status === 'rejected' && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>お断り済み</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              {searchQuery ? (
                <p>検索条件に一致する依頼が見つかりませんでした</p>
              ) : (
                <p>依頼はまだありません</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 