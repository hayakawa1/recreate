'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  console.log('error:', error); // デバッグ用

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            ログイン失敗
          </h2>
          <p className="mt-2 text-sm text-red-600">
            XのAPI制限です
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 