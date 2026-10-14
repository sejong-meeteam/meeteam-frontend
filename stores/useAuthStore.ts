'use client';

import { create } from 'zustand';

type AuthState = {
  isSessionReady: boolean;
  isAuthenticated: boolean;
  finishSessionBootstrap: () => void;
};

// 3주차에는 상태의 소유 위치만 마련합니다. 실제 세션 복원과 로그인 연동은 다음 단계입니다.
export const useAuthStore = create<AuthState>((set) => ({
  isSessionReady: false,
  isAuthenticated: false,
  finishSessionBootstrap: () => set({ isSessionReady: true }),
}));
