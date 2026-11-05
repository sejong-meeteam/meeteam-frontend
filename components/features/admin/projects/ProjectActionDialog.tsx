'use client';

import type { AdminProjectDetail, AdminProjectMember } from '@/types/admin';

import AdminActionModal from '../AdminActionModal';
import {
  changeAdminProjectVisibility,
  closeAdminProjectRecruitment,
  expelAdminProjectMember,
} from '../adminApi';

export type ProjectAction =
  | { kind: 'hide' }
  | { kind: 'delete' }
  | { kind: 'restore' }
  | { kind: 'close' }
  | { kind: 'expel'; member: AdminProjectMember };

type ProjectActionDialogProps = {
  action: ProjectAction;
  project: AdminProjectDetail;
  onClose: () => void;
  onDone: (message: string) => void;
};

export default function ProjectActionDialog({
  action,
  project,
  onClose,
  onDone,
}: ProjectActionDialogProps) {
  if (action.kind === 'hide') {
    return (
      <AdminActionModal
        title="프로젝트 숨김"
        description={`'${project.name}'을(를) 프로젝트 목록과 상세 화면에서 숨깁니다. 리더와 팀원 정보는 유지되며 언제든 복구할 수 있습니다.`}
        confirmLabel="숨기기"
        onClose={onClose}
        onSubmit={async (reason) => {
          await changeAdminProjectVisibility(project.projectId, 'HIDDEN', reason);
          onDone(`'${project.name}'을(를) 숨김 처리했습니다.`);
        }}
      />
    );
  }

  if (action.kind === 'delete') {
    return (
      <AdminActionModal
        title="프로젝트 삭제"
        description={`'${project.name}'을(를) 삭제 상태로 전환합니다. 서비스에서 더 이상 노출되지 않으며, 관리자만 복구할 수 있습니다.`}
        confirmLabel="삭제하기"
        tone="danger"
        confirmText={project.name}
        onClose={onClose}
        onSubmit={async (reason) => {
          await changeAdminProjectVisibility(project.projectId, 'DELETED', reason);
          onDone(`'${project.name}'을(를) 삭제했습니다.`);
        }}
      />
    );
  }

  if (action.kind === 'restore') {
    return (
      <AdminActionModal
        title="프로젝트 복구"
        description={`'${project.name}'을(를) 다시 서비스에 노출합니다.`}
        confirmLabel="복구하기"
        onClose={onClose}
        onSubmit={async (reason) => {
          await changeAdminProjectVisibility(project.projectId, 'VISIBLE', reason);
          onDone(`'${project.name}'을(를) 복구했습니다.`);
        }}
      />
    );
  }

  if (action.kind === 'close') {
    return (
      <AdminActionModal
        title="모집 강제 마감"
        description={`'${project.name}'의 모든 포지션 모집을 마감합니다. 대기 중인 지원서는 리더가 계속 처리할 수 있습니다.`}
        confirmLabel="마감하기"
        tone="danger"
        onClose={onClose}
        onSubmit={async (reason) => {
          await closeAdminProjectRecruitment(project.projectId, reason);
          onDone(`'${project.name}'의 모집을 마감했습니다.`);
        }}
      />
    );
  }

  const { member } = action;
  return (
    <AdminActionModal
      title="팀원 강제 제외"
      description={`${member.name}님을 '${project.name}' 팀에서 제외합니다. 해당 포지션의 모집 인원이 다시 열립니다.`}
      confirmLabel="제외하기"
      tone="danger"
      onClose={onClose}
      onSubmit={async (reason) => {
        await expelAdminProjectMember(project.projectId, member.memberId, reason);
        onDone(`${member.name}님을 팀에서 제외했습니다.`);
      }}
    />
  );
}
