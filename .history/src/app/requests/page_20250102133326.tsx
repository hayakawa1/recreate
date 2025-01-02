'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Requests() {
  const router = useRouter();

  useEffect(() => {
    router.push('/requests/received');
  }, [router]);

  return null;
} 