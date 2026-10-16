import { describe, expect, it } from 'vitest';
import { canAnswerQna, visibleQna } from '@/components/features/project/detail/qnaPermissions';
import { qnaContentSchema } from '@/components/features/project/detail/qnaSchema';
import type { ProjectQna } from '@/components/features/project/detail/projectQnaApi';

const qna: ProjectQna = {
  id: 1,
  questionerId: 2,
  questionerName: '작성자',
  questionerProfileImageUrl: 'private.png',
  question: '비밀 질문',
  isSecret: true,
  createdAt: '',
  answers: [
    {
      id: 1,
      writerId: 1,
      writerName: '리더',
      writerProfileImageUrl: '',
      isLeader: true,
      content: '비밀 답변',
      createdAt: '',
    },
  ],
};

describe('Q&A visibility and roles', () => {
  it.each([null, 3])('비회원·다른 회원에게 질문·답변·개인정보를 가린다 (%s)', (memberId) => {
    expect(visibleQna(qna, 1, memberId)).toMatchObject({
      question: '비밀글입니다.',
      questionerName: '비밀글',
      questionerProfileImageUrl: '',
      answers: [],
    });
    expect(canAnswerQna(qna, 1, memberId)).toBe(false);
  });
  it.each([1, 2])('리더·작성자는 비밀글 조회 및 답변이 가능하다 (%s)', (memberId) => {
    expect(visibleQna(qna, 1, memberId)).toEqual(qna);
    expect(canAnswerQna(qna, 1, memberId)).toBe(true);
  });
  it('공개 질문은 비회원에게도 표시하되 답변 권한은 분리한다', () => {
    expect(visibleQna({ ...qna, isSecret: false }, 1, null).question).toBe('비밀 질문');
    expect(canAnswerQna(qna, undefined, null)).toBe(false);
  });
  it('계정 전환 시 원본을 변경하지 않고 즉시 비밀글을 가린다', () => {
    expect(visibleQna(qna, 1, 2).answers).toHaveLength(1);
    expect(visibleQna(qna, 1, null).answers).toHaveLength(0);
    expect(qna.answers).toHaveLength(1);
  });
  it('공백 질문·답변을 거절하고 정상 입력을 정리한다', () => {
    expect(qnaContentSchema.safeParse('  ').success).toBe(false);
    expect(qnaContentSchema.parse('  질문  ')).toBe('질문');
  });
});
