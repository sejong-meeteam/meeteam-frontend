'use client';

import { create } from 'zustand';

const DEFAULT_LOGIN_MODAL_TITLE = '로그인이 필요한 기능입니다';

type OpenLoginModalPayload = {
  redirectPath?: string;
  title?: string;
};

type LoginModalState = {
  isOpen: boolean;
  redirectPath: string | null;
  title: string;
  openLoginModal: (payload?: OpenLoginModalPayload) => void;
  closeLoginModal: () => void;
};

export const useLoginModalStore = create<LoginModalState>((set) => ({
  isOpen: false,
  redirectPath: null,
  title: DEFAULT_LOGIN_MODAL_TITLE,
  openLoginModal: (payload) =>
    set({
      isOpen: true,
      redirectPath: payload?.redirectPath ?? null,
      title: payload?.title ?? DEFAULT_LOGIN_MODAL_TITLE,
    }),
  closeLoginModal: () =>
    set({
      isOpen: false,
      redirectPath: null,
      title: DEFAULT_LOGIN_MODAL_TITLE,
    }),
}));
