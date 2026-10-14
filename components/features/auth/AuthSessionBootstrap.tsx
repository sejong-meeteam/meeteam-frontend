'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AuthSessionBootstrap() {
  const finishSessionBootstrap = useAuthStore((state) => state.finishSessionBootstrap);

  useEffect(() => {
    finishSessionBootstrap();
  }, [finishSessionBootstrap]);

  return null;
}
