import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { qnaContentSchema } from '@/components/features/project/detail/qnaSchema';
import { getProjects, getSessionMember } from './storage';
import { pageResponse } from './responseMappers';

type Answer = {
  answerId: number;
  writerId: number;
  writerName: string;
  writerProfileImageUrl: null;
  isLeader: boolean;
  content: string;
  createdAt: string;
};
type Question = {
  projectId: number;
  qnaId: number;
  questionerId: number;
  questionerName: string;
  questionerProfileImageUrl: null;
  question: string;
  isSecret: boolean;
  createdAt: string;
  answers: Answer[];
};
const KEY = 'meeteam-qnas';
function questions(): Question[] {
  const stored = localStorage.getItem(KEY);
  return stored
    ? JSON.parse(stored)
    : [
        {
          projectId: 102,
          qnaId: 1,
          questionerId: 1,
          questionerName: '김민지',
          questionerProfileImageUrl: null,
          question: '팀 회의는 얼마나 자주 진행하나요?',
          isSecret: false,
          createdAt: new Date().toISOString(),
          answers: [
            {
              answerId: 1,
              writerId: 2,
              writerName: '이준호',
              writerProfileImageUrl: null,
              isLeader: true,
              content: '일주일에 한 번 온라인으로 진행합니다.',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ];
}
const save = (question: Question) =>
  localStorage.setItem(
    KEY,
    JSON.stringify([...questions().filter((item) => item.qnaId !== question.qnaId), question]),
  );
const success = <T>(result: T) => HttpResponse.json({ code: 'COMMON200', result });
const failure = (status: number, message: string) => HttpResponse.json({ message }, { status });

export const qnaHandlers = [
  http.get('/api/v1/projects/:projectId/qna', ({ params, request }) => {
    const project = getProjects().find((item) => item.id === Number(params.projectId));
    if (!project) return failure(404, '프로젝트를 찾을 수 없습니다.');
    const member = getSessionMember();
    const items = questions()
      .filter((item) => item.projectId === project.id)
      .sort((a, b) => b.qnaId - a.qnaId)
      .map((item) => {
        const visible =
          !item.isSecret ||
          member?.memberId === item.questionerId ||
          member?.memberId === project.leaderId;
        return visible
          ? item
          : {
              ...item,
              questionerName: '비밀글',
              questionerProfileImageUrl: null,
              question: '비밀글입니다.',
              answers: [],
            };
      });
    return success({
      ...pageResponse(items, new URL(request.url).searchParams),
      totalElements: items.length,
    });
  }),
  http.post('/api/v1/projects/:projectId/qna', async ({ params, request }) => {
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const project = getProjects().find((item) => item.id === Number(params.projectId));
    if (!project) return failure(404, '프로젝트를 찾을 수 없습니다.');
    const parsed = z
      .object({ question: qnaContentSchema, isSecret: z.boolean().default(false) })
      .safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(400, '질문 내용을 입력해 주세요.');
    const question: Question = {
      projectId: project.id,
      qnaId: Math.max(0, ...questions().map((item) => item.qnaId)) + 1,
      questionerId: member.memberId,
      questionerName: member.name,
      questionerProfileImageUrl: null,
      question: parsed.data.question,
      isSecret: parsed.data.isSecret,
      createdAt: new Date().toISOString(),
      answers: [],
    };
    save(question);
    return success(question);
  }),
  http.post('/api/v1/projects/:projectId/qna/:qnaId/answer', async ({ params, request }) => {
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const project = getProjects().find((item) => item.id === Number(params.projectId));
    const question = questions().find(
      (item) => item.qnaId === Number(params.qnaId) && item.projectId === project?.id,
    );
    if (!project || !question) return failure(404, '질문을 찾을 수 없습니다.');
    if (member.memberId !== project.leaderId && member.memberId !== question.questionerId)
      return failure(403, '질문 작성자와 프로젝트 리더만 답변할 수 있습니다.');
    const parsed = z
      .object({ answer: qnaContentSchema })
      .safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(400, '답변 내용을 입력해 주세요.');
    const next: Question = {
      ...question,
      answers: [
        ...question.answers,
        {
          answerId:
            Math.max(
              0,
              ...questions().flatMap((item) => item.answers.map((answer) => answer.answerId)),
            ) + 1,
          writerId: member.memberId,
          writerName: member.name,
          writerProfileImageUrl: null,
          isLeader: project.leaderId === member.memberId,
          content: parsed.data.answer,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    save(next);
    return success(next);
  }),
];
