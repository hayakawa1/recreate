'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { WorkStatus } from '@prisma/client';

type Work = {
  id: string;
  description: string;
  budget: number;
  status: WorkStatus;
  deliveryFileUrl: string | null;
  requester: {
    name: string;
    image: string;
  };
  creator: {
    name: string;
    image: string;
  };
};

export default function Requests() {
  const { data: session } = useSession();
  const router = useRouter();
  const [receivedWorks, setReceivedWorks] = useState<Work[]>([]);
  const [sentWorks, setSentWorks] = useState<Work[]>([]);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    // 受信したリクエストを取得
    fetch(`/api/works/received`)
      .then((res) => res.json())
      .then((data) => setReceivedWorks(data));

    // 送信したリクエストを取得
    fetch(`/api/works/sent`)
      .then((res) => res.json())
      .then((data) => setSentWorks(data));
  }, [session, router]);

  const handleFileUpload = async (workId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

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
    } else {
      alert('エラーが発生しました');
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

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">リクエスト管理</h1>

      {/* 受信したリクエスト */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">受信したリクエスト</h2>
        <div className="space-y-4">
          {receivedWorks.map((work) => (
            <div
              key={work.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex flex-col space-y-4">
                <div>
                  <p className="font-medium">{work.requester.name}さんから</p>
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
                  {work.status === 'completed' && (
                    <span className="text-green-600">完了</span>
                  )}
                  {work.status === 'rejected' && (
                    <span className="text-red-600">お断り済み</span>
                  )}
                  {work.status === 'delivered' && (
                    <span className="text-blue-600">納品済み</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 送信したリクエスト */}
      <div>
        <h2 className="text-xl font-semibold mb-4">送信したリクエスト</h2>
        <div className="space-y-4">
          {sentWorks.map((work) => (
            <div
              key={work.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex flex-col space-y-4">
                <div>
                  <p className="font-medium">{work.creator.name}さんへ</p>
                  <p className="text-gray-600">{work.description}</p>
                  <p className="text-gray-600">予算: ¥{work.budget}</p>
                </div>
                <div>
                  {work.status === 'requested' && (
                    <span className="text-yellow-600">依頼中</span>
                  )}
                  {work.status === 'completed' && (
                    <span className="text-green-600">完了</span>
                  )}
                  {work.status === 'rejected' && (
                    <span className="text-red-600">お断り</span>
                  )}
                  {work.status === 'delivered' && (
                    <div className="flex flex-col space-y-2">
                      <span className="text-blue-600">納品済み</span>
                      <a
                        href={work.deliveryFileUrl || '#'}
                        download
                        className="text-blue-600 hover:underline"
                      >
                        納品物をダウンロード
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 