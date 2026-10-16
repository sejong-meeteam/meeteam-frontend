import type { ProjectQna } from './projectQnaApi';

export function canAnswerQna(
  qna: ProjectQna,
  leaderId: number | undefined,
  memberId: number | null,
) {
  return memberId !== null && (memberId === qna.questionerId || memberId === leaderId);
}

// Defensive UI masking; server-side permission checks remain mandatory.
export function visibleQna(
  qna: ProjectQna,
  leaderId: number | undefined,
  memberId: number | null,
): ProjectQna {
  if (!qna.isSecret || canAnswerQna(qna, leaderId, memberId)) return qna;
  return {
    ...qna,
    questionerName: '비밀글',
    questionerProfileImageUrl: '',
    question: '비밀글입니다.',
    answers: [],
  };
}
