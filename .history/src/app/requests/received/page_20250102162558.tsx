'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { WorkStatus } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';

type Work = {
  id: string;
  description: string;
  budget: number;
  status: WorkStatus;
  deliveryFileUrl: string | null;
  requester: {
    name: string;
    image: string;
    username: string | null;
  };
};

export default function ReceivedRequests() {
  const { data: session } = useSession();
  const router = useRouter();
  const [receivedWorks, setReceivedWorks] = useState<Work[]>([]);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    // 受信したリクエストを取得
    fetch(`/api/works/received`)
      .then((res) => res.json())
      .then((data) => setReceivedWorks(data));
  }, [session, router]);

  const handleFileUpload = async (workId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/works/${workId}/delivery`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // リクエスト一覧を更新
        const updatedWorks = await fetch(`/api/works/received`).then((res) =>
          res.json()
        );
        setReceivedWorks(updatedWorks);
        alert('ファイルを納品しました');
      } else {
        const error = await response.text();
        alert(`エラーが発生しました: ${error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('ファイルのアップロードに失敗しました');
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

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
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
      </div>

      <div className="space-y-4">
        {receivedWorks.map((work) => (
          <div
            key={work.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                {work.requester.image && (
                  <Image
                    src={work.requester.image}
                    alt={work.requester.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{work.requester.name}さんから</p>
                  {work.requester.username && (
                    <p className="text-sm text-gray-500">
                      @{work.requester.username}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-600">{work.description}</p>
                <p className="text-gray-600">予算: ¥{work.budget}</p>
              </div>
              <div>
                {work.status === 'requested' && (
                  <div className="flex flex-col space-y-2">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(work.id, file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <button
                      onClick={() => handleReject(work.id)}
                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      お断りする
                    </button>
                  </div>
                )}
                {work.status === 'paid' && (
                  <span className="text-green-600">支払い完了</span>
                )}
                {work.status === 'rejected' && (
                  <span className="text-red-600">お断り済み</span>
                )}
                {work.status === 'delivered' && (
                  <div className="flex flex-col space-y-2">
                    <span className="text-blue-600">納品済み</span>
                    <button
                      onClick={() => handleConfirmPayment(work.id)}
                      className="w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md"
                    >
                      支払い完了を確認
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 