'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {error ? 'ログイン失敗' : 'ログイン'}
          </h1>
          {error ? (
            <>
              <p className="mt-2 text-sm text-red-600">
                {error === 'TwitterApiError' ? 'XのAPI制限です' : 'ログインに失敗しました'}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                しばらくたってからログインしてください
              </p>
            </>
          ) : (
            <div className="mt-4">
              <button
                onClick={() => signIn('twitter')}
                className="inline-flex items-center justify-center rounded-md bg-[#1DA1F2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1a8cd8] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:ring-offset-2"
              >
                Xでログイン
              </button>
            </div>
          )}
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