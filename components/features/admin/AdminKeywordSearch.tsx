'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import BaseInput from '@/components/shared/BaseInput';

type AdminKeywordSearchProps = {
  initialValue: string;
  placeholder: string;
  onSearch: (keyword: string) => void;
};

export default function AdminKeywordSearch({
  initialValue,
  placeholder,
  onSearch,
}: AdminKeywordSearchProps) {
  const [value, setValue] = useState(initialValue);
  const [syncedValue, setSyncedValue] = useState(initialValue);

  // URL 초기화·뒤로 가기처럼 외부에서 검색어가 바뀌면 입력값을 맞춥니다.
  if (initialValue !== syncedValue) {
    setSyncedValue(initialValue);
    setValue(initialValue);
  }

  return (
    <form
      role="search"
      className="col-span-2 md:max-w-xs md:flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value.trim());
      }}
    >
      <BaseInput
        inputSize="S"
        type="search"
        aria-label={placeholder}
        placeholder={`${placeholder} 후 Enter`}
        value={value}
        maxLength={50}
        leftIcon={<Search className="h-4 w-4" aria-hidden strokeWidth={1.8} />}
        className="h-10"
        data-cy="admin-keyword-search"
        onChange={(event) => {
          setValue(event.target.value);
          if (!event.target.value && initialValue) onSearch('');
        }}
      />
    </form>
  );
}
