'use client';

import React from 'react';
import { signIn } from 'next-auth/react';

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            ReCreateにログイン
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            クリエイターとユーザーをつなぐプラットフォーム
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={() => signIn('twitter', { callbackUrl: '/' })}
            className="flex w-full justify-center items-center gap-3 rounded-md bg-[#1DA1F2] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DA1F2]"
          >
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
            </svg>
            <span>Twitterでログイン</span>
          </button>
        </div>
      </div>
    </div>
  );
} 