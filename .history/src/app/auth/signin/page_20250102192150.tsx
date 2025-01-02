'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            ログイン失敗
          </h1>
          <p className="mt-2 text-sm text-red-600">
            XのAPI制限です
          </p>
          <div className="mt-8">
            <button
              onClick={() => signIn('twitter', { callbackUrl: '/' })}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-[#1DA1F2] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DA1F2]"
            >
              <Image
                src="/twitter.svg"
                alt="Twitter logo"
                width={24}
                height={24}
                className="h-5 w-5"
              />
              <span>再度ログインする</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 