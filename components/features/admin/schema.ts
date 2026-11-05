import { z } from 'zod';

export const ADMIN_PAGE_SIZE = 10;
export const ADMIN_REASON_MIN_LENGTH = 5;
export const ADMIN_REASON_MAX_LENGTH = 200;

export const MEMBER_SORTS = [
  'createdAt,desc',
  'lastLoginAt,desc',
  'projectCount,desc',
  'name,asc',
] as const;
export const PROJECT_SORTS = [
  'createdAt,desc',
  'name,asc',
  'pendingApplicationCount,desc',
] as const;

const memberStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'WITHDRAWN']);
const memberRoleSchema = z.enum(['USER', 'ADMIN']);
const projectVisibilitySchema = z.enum(['VISIBLE', 'HIDDEN', 'DELETED']);
const recruitmentStatusSchema = z.enum(['RECRUITING', 'CLOSED', 'SUSPENDED']);
const projectCategorySchema = z.enum(['CAPSTONE', 'CREATIVE_SEMESTER', 'CLUB', 'ETC']);
const auditActionSchema = z.enum([
  'MEMBER_SUSPEND',
  'MEMBER_UNSUSPEND',
  'MEMBER_ROLE_CHANGE',
  'MEMBER_WITHDRAW',
  'PROJECT_HIDE',
  'PROJECT_RESTORE',
  'PROJECT_DELETE',
  'PROJECT_FORCE_CLOSE',
  'PROJECT_MEMBER_EXPEL',
]);
const auditTargetTypeSchema = z.enum(['MEMBER', 'PROJECT']);

const optionalFilter = <T extends z.ZodType>(schema: T) => schema.or(z.literal('')).catch('');
const pageSchema = z.coerce.number().int().min(0).catch(0);
const keywordSchema = z.string().trim().max(50).catch('');

export const memberFilterSchema = z.object({
  keyword: keywordSchema,
  status: optionalFilter(memberStatusSchema),
  role: optionalFilter(memberRoleSchema),
  jobFieldCode: z.string().catch(''),
  sort: z.enum(MEMBER_SORTS).catch('createdAt,desc'),
  page: pageSchema,
});

export const projectFilterSchema = z.object({
  keyword: keywordSchema,
  category: optionalFilter(projectCategorySchema),
  recruitmentStatus: optionalFilter(recruitmentStatusSchema),
  visibility: optionalFilter(projectVisibilitySchema),
  sort: z.enum(PROJECT_SORTS).catch('createdAt,desc'),
  page: pageSchema,
});

export const auditLogFilterSchema = z.object({
  action: optionalFilter(auditActionSchema),
  targetType: optionalFilter(auditTargetTypeSchema),
  page: pageSchema,
});

export type MemberFilters = z.infer<typeof memberFilterSchema>;
export type ProjectFilters = z.infer<typeof projectFilterSchema>;
export type AuditLogFilters = z.infer<typeof auditLogFilterSchema>;

export const adminReasonSchema = z
  .string()
  .trim()
  .min(ADMIN_REASON_MIN_LENGTH, `사유를 ${ADMIN_REASON_MIN_LENGTH}자 이상 입력해 주세요.`)
  .max(ADMIN_REASON_MAX_LENGTH, `사유는 ${ADMIN_REASON_MAX_LENGTH}자 이내로 입력해 주세요.`);

export const suspendMemberRequestSchema = z.object({
  days: z.number().int().min(1).max(365).nullable(),
  reason: adminReasonSchema,
});

export const reasonRequestSchema = z.object({ reason: adminReasonSchema });

export const changeRoleRequestSchema = z.object({
  role: memberRoleSchema,
  reason: adminReasonSchema,
});

export const changeVisibilityRequestSchema = z.object({
  visibility: projectVisibilitySchema,
  reason: adminReasonSchema,
});

export type SuspendMemberRequest = z.infer<typeof suspendMemberRequestSchema>;
export type ChangeRoleRequest = z.infer<typeof changeRoleRequestSchema>;
export type ChangeVisibilityRequest = z.infer<typeof changeVisibilityRequestSchema>;
