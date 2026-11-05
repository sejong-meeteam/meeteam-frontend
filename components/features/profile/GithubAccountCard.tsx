'use client';

import { useEffect, useState } from 'react';
import { Github } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useToastStore } from '@/stores/useToastStore';
import type { GithubAccount } from '@/types/github';
import {
  disconnectMyGithubAccount,
  fetchGithubAuthorizeUrl,
  fetchMyGithubAccount,
} from './githubAccountApi';

const SETTINGS_PATH = '/settings';

export default function GithubAccountCard() {
  const showToast = useToastStore((state) => state.showToast);
  const [account, setAccount] = useState<GithubAccount | null | undefined>(undefined);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let active = true;

    fetchMyGithubAccount()
      .then((nextAccount) => {
        if (active) setAccount(nextAccount);
      })
      .catch(() => {
        if (active) setAccount(null);
      });

    // OAuth 콜백에서 돌아온 경우 안내하고 쿼리를 정리한다.
    const url = new URL(window.location.href);

    if (url.searchParams.get('github') === 'connected') {
      showToast({ tone: 'success', message: 'GitHub 계정을 연결했어요.' });
      url.searchParams.delete('github');
      window.history.replaceState(null, '', url.pathname + url.search);
    }

    return () => {
      active = false;
    };
  }, [showToast]);

  const handleConnect = async () => {
    try {
      setIsBusy(true);
      window.location.assign(await fetchGithubAuthorizeUrl(SETTINGS_PATH));
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'GitHub 연결 주소를 받지 못했습니다.',
      });
      setIsBusy(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsBusy(true);
      await disconnectMyGithubAccount();
      setAccount(null);
      showToast({ tone: 'success', message: 'GitHub 계정 연결을 해제했어요.' });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'GitHub 계정 연결을 해제하지 못했습니다.',
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className="rounded-3xl border border-mt-border bg-mt-white p-6 shadow-sm md:p-8"
      data-cy="github-account-card"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg leading-7 font-bold text-mt-text-primary">
            <Github className="h-5 w-5" aria-hidden />
            GitHub 계정 연결
          </h2>
          <p className="mt-1 text-sm leading-6 text-mt-text-secondary">
            연결하면 합류한 프로젝트 저장소에 자동으로 초대되고, 내 기여가 프로젝트 개발 현황에
            표시돼요.
          </p>

          {account === undefined ? (
            <SkeletonBlock className="mt-3 h-10 w-48" />
          ) : account ? (
            <a
              href={account.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-mt-border bg-mt-bg-soft py-1 pr-3 pl-1 text-sm leading-5 font-bold text-mt-text-primary transition-colors hover:bg-mt-badge-bg"
            >
              <ProfileAvatar
                name={account.login}
                imageUrl={account.avatarUrl}
                sizeClassName="h-7 w-7"
                textClassName="text-xs"
              />
              @{account.login}
            </a>
          ) : null}
        </div>

        {account === undefined ? null : account ? (
          <BaseButton
            variant="gray"
            onClick={() => void handleDisconnect()}
            disabled={isBusy}
            className="shrink-0"
          >
            {isBusy ? '해제 중' : '연결 해제'}
          </BaseButton>
        ) : (
          <BaseButton
            onClick={() => void handleConnect()}
            disabled={isBusy}
            className="shrink-0 gap-2"
          >
            <Github className="h-4 w-4" aria-hidden />
            GitHub 연결하기
          </BaseButton>
        )}
      </div>
    </div>
  );
}
