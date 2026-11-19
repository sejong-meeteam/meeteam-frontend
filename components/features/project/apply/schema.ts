import { z } from 'zod';

export const APPLICATION_MESSAGE_MIN_LENGTH = 10;
export const APPLICATION_MESSAGE_MAX_LENGTH = 700;

export const applicationMessageSchema = z
  .string()
  .trim()
  .min(
    APPLICATION_MESSAGE_MIN_LENGTH,
    `지원 메시지를 ${APPLICATION_MESSAGE_MIN_LENGTH}자 이상 입력해 주세요.`,
  )
  .max(
    APPLICATION_MESSAGE_MAX_LENGTH,
    `지원 메시지는 ${APPLICATION_MESSAGE_MAX_LENGTH}자 이하로 입력해 주세요.`,
  );

export const projectApplicationSchema = z.object({
  jobPositionCode: z.string().min(1, '지원할 포지션을 선택해 주세요.'),
  motivation: applicationMessageSchema,
});

export type ProjectApplicationFormValues = z.infer<typeof projectApplicationSchema>;
