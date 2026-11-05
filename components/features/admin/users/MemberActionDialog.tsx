'use client';

import type { AdminMemberDetail } from '@/types/admin';

import { useState } from 'react';
import AdminActionModal from '../AdminActionModal';
import {
  changeAdminMemberRole,
  suspendAdminMember,
  unsuspendAdminMember,
  withdrawAdminMember,
} from '../adminApi';
import { MEMBER_ROLE_LABEL, SUSPEND_PERIOD_OPTIONS } from '../constants';
import { formatSuspendedUntil } from '../format';

export type MemberAction = 'suspend' | 'unsuspend' | 'role' | 'withdraw';

type MemberActionDialogProps = {
  action: MemberAction;
  member: AdminMemberDetail;
  onClose: () => void;
  onDone: (message: string) => void;
};

export default function MemberActionDialog({
  action,
  member,
  onClose,
  onDone,
}: MemberActionDialogProps) {
  const [days, setDays] = useState<number | null>(7);

  if (action === 'suspend') {
    return (
      <AdminActionModal
        title="회원 이용 정지"
        description={`${member.name}님의 로그인과 서비스 이용을 정지합니다. 정지 기간이 끝나면 자동으로 해제됩니다.`}
        confirmLabel="정지하기"
        tone="danger"
        onClose={onClose}
        onSubmit={async (reason) => {
          await suspendAdminMember(member.memberId, { days, reason });
          onDone(`${member.name}님을 ${days ? `${days}일간` : '영구'} 정지했습니다.`);
        }}
      >
        <fieldset>
          <legend className="mb-1.5 text-sm font-bold text-mt-text-primary">정지 기간</legend>
          <div className="grid grid-cols-4 gap-2">
            {SUSPEND_PERIOD_OPTIONS.map((option) => {
              const selected = option.days === days;
              return (
                <label
                  key={option.label}
                  className={`flex h-10 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-action-primary ${
                    selected
                      ? 'border-mt-danger bg-mt-danger-soft text-mt-danger'
                      : 'border-mt-border bg-mt-white text-mt-text-secondary hover:bg-mt-bg-soft'
                  }`}
                >
                  <input
                    type="radio"
                    name="suspend-period"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setDays(option.days)}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </AdminActionModal>
    );
  }

  if (action === 'unsuspend') {
    return (
      <AdminActionModal
        title="정지 해제"
        description={`${member.name}님의 정지(${formatSuspendedUntil(member.suspendedUntil)})를 즉시 해제합니다.`}
        confirmLabel="정지 해제"
        onClose={onClose}
        onSubmit={async (reason) => {
          await unsuspendAdminMember(member.memberId, reason);
          onDone(`${member.name}님의 정지를 해제했습니다.`);
        }}
      />
    );
  }

  if (action === 'role') {
    const nextRole = member.role === 'ADMIN' ? 'USER' : 'ADMIN';
    return (
      <AdminActionModal
        title="권한 변경"
        description={`${member.name}님의 권한을 '${MEMBER_ROLE_LABEL[member.role]}'에서 '${MEMBER_ROLE_LABEL[nextRole]}'(으)로 변경합니다.${
          nextRole === 'ADMIN' ? ' 관리자는 모든 회원과 프로젝트를 관리할 수 있습니다.' : ''
        }`}
        confirmLabel={`${MEMBER_ROLE_LABEL[nextRole]}(으)로 변경`}
        tone={nextRole === 'ADMIN' ? 'danger' : 'primary'}
        onClose={onClose}
        onSubmit={async (reason) => {
          await changeAdminMemberRole(member.memberId, nextRole, reason);
          onDone(`${member.name}님의 권한을 ${MEMBER_ROLE_LABEL[nextRole]}(으)로 변경했습니다.`);
        }}
      />
    );
  }

  return (
    <AdminActionModal
      title="강제 탈퇴"
      description={`${member.name}님을 탈퇴 처리합니다. 대기 중인 지원서는 취소되고 참여 중인 프로젝트에서 제외되며, 되돌릴 수 없습니다.`}
      confirmLabel="탈퇴 처리"
      tone="danger"
      confirmText={member.name}
      onClose={onClose}
      onSubmit={async (reason) => {
        await withdrawAdminMember(member.memberId, reason);
        onDone(`${member.name}님을 탈퇴 처리했습니다.`);
      }}
    />
  );
}
