'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            認証エラー
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {error === 'OAuthSignin' && 'ログインの開始時にエラーが発生しました。'}
            {error === 'OAuthCallback' && 'ロイッターのログインの回数制限にひっかかっていると考えられます。しばらくたってからログインをお願いします。'}
            {error === 'OAuthCreateAccount' && 'アカウントの作成時にエラーが発生しました。'}
            {error === 'EmailCreateAccount' && 'アカウントの作成時にエラーが発生しました。'}
            {error === 'Callback' && 'コールバック時にエラーが発生しました。'}
            {error === 'Default' && '認証中にエラーが発生しました。'}
            {!error && '不明なエラーが発生しました。'}
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