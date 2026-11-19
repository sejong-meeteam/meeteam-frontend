import { z } from 'zod';

export const PROPOSAL_MESSAGE_MAX_LENGTH = 300;

export const projectProposalRequestSchema = z.object({
  memberId: z.number().int().positive('제안할 회원을 확인해 주세요.'),
  jobPositionId: z.number().int().positive('제안할 포지션을 선택해 주세요.'),
  message: z
    .string()
    .trim()
    .max(
      PROPOSAL_MESSAGE_MAX_LENGTH,
      `메시지는 ${PROPOSAL_MESSAGE_MAX_LENGTH}자 이내로 작성해 주세요.`,
    ),
});
