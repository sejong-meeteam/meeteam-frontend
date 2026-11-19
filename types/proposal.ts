export type ProposablePosition = {
  jobPositionId: number;
  jobFieldName: string;
  jobPositionName: string;
};

/** 내가 리더인 모집 중 프로젝트 중 해당 회원에게 제안할 수 있는 프로젝트 */
export type ProposableProject = {
  projectId: number;
  projectName: string;
  openPositions: ProposablePosition[];
  hasPendingProposal: boolean;
};

export type ProjectProposalRequest = {
  memberId: number;
  jobPositionId: number;
  message: string;
};

export type ProjectProposalStatus = 'PENDING';

export type ProjectProposal = {
  proposalId: number;
  projectId: number;
  memberId: number;
  jobPositionId: number;
  message: string;
  status: ProjectProposalStatus;
  createdAt: string;
};
