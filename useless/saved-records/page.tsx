'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SavedRecordsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sensor-log');
  }, [router]);
  return null;
}
