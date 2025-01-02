'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorType = searchParams.get('error_type');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            認証エラー
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {errorType === 'OAuthCallbackError' && (
              <div className="space-y-2">
                <p>Twitterのログイン制限にひっかかっています。</p>
                <p>しばらく時間をおいてから（30分程度）、再度ログインをお試しください。</p>
                <p>または、別のTwitterアカウントでログインすることもできます。</p>
              </div>
            )}
            {error === 'OAuthSignin' && 'ログインの開始時にエラーが発生しました。'}
            {error === 'OAuthCreateAccount' && 'アカウントの作成時にエラーが発生しました。'}
            {error === 'EmailCreateAccount' && 'アカウントの作成時にエラーが発生しました。'}
            {error === 'Callback' && 'コールバック時にエラーが発生しました。'}
            {error === 'Default' && '認証中にエラーが発生しました。'}
            {!error && !errorType && '不明なエラーが発生しました。'}
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