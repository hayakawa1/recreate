'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { WorkStatus } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';

type Work = {
  id: string;
  sequentialId: number;
  description: string;
  budget: number;
  status: WorkStatus;
  deliveryFileUrl: string | null;
  creator: {
    name: string;
    image: string;
    username: string | null;
    stripeLink: string | null;
  };
};

export default function SentRequests() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sentWorks, setSentWorks] = useState<Work[]>([]);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    // 送信したリクエストを取得
    fetch(`/api/works/sent`)
      .then((res) => res.json())
      .then((data) => setSentWorks(data));
  }, [session, router]);

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          リクエスト送信箱
        </h1>
        <Link
          href="/requests/received"
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>←</span>
          <span>受信箱へ</span>
        </Link>
      </div>

      <div className="space-y-4">
        {sentWorks.map((work) => (
          <div
            key={work.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  {work.creator.image && (
                    <Image
                      src={work.creator.image}
                      alt={work.creator.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{work.creator.name}さんへ</p>
                    {work.creator.username && (
                      <p className="text-sm text-gray-500">
                        @{work.creator.username}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-400">
                  #{work.sequentialId}
                </div>
              </div>
              <div>
                <p className="text-gray-600">{work.description}</p>
                <p className="text-gray-600">予算: ¥{work.budget}</p>
              </div>
              <div>
                {work.status === 'requested' && (
                  <span className="text-yellow-600">依頼中</span>
                )}
                {work.status === 'paid' && (
                  <span className="text-green-600">支払い完了</span>
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
                    {work.creator.stripeLink && (
                      <a
                        href={work.creator.stripeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        支払いページへ
                      </a>
                    )}
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