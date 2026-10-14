'use client';

import { create } from 'zustand';

type ProjectUiState = { searchKeyword: string; setSearchKeyword: (value: string) => void };

// 서버 프로젝트 데이터는 이 스토어에 복제하지 않습니다.
export const useProjectUiStore = create<ProjectUiState>((set) => ({
  searchKeyword: '',
  setSearchKeyword: (searchKeyword) => set({ searchKeyword }),
}));
