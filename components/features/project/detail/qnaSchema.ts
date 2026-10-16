import { z } from 'zod';

export const qnaContentSchema = z.string().trim().min(1, '내용을 입력해 주세요.');
