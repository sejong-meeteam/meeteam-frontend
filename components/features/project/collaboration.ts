import { z } from 'zod';
import type { MeetingMode, ProjectCollaboration } from '@/types/project';

export const MEETING_MODES = [
  'ONLINE',
  'OFFLINE',
  'HYBRID',
] as const satisfies readonly MeetingMode[];

export const MEETING_MODE_LABEL: Record<MeetingMode, string> = {
  ONLINE: '온라인',
  OFFLINE: '대면',
  HYBRID: '온·오프라인 병행',
};

export const WEEKLY_HOURS_MIN = 1;
export const WEEKLY_HOURS_MAX = 40;
export const MEETING_NOTE_MAX_LENGTH = 100;

export const EMPTY_PROJECT_COLLABORATION: ProjectCollaboration = {
  meetingMode: null,
  weeklyHours: null,
  meetingNote: null,
};

const collaborationResponseSchema = z.object({
  meetingMode: z.enum(MEETING_MODES).nullish().catch(null),
  weeklyHours: z.number().int().min(WEEKLY_HOURS_MIN).max(WEEKLY_HOURS_MAX).nullish().catch(null),
  meetingNote: z.string().trim().nullish().catch(null),
});

export function parseProjectCollaboration(response: unknown): ProjectCollaboration {
  const parsed = collaborationResponseSchema.safeParse(response);

  if (!parsed.success) {
    return EMPTY_PROJECT_COLLABORATION;
  }

  return {
    meetingMode: parsed.data.meetingMode ?? null,
    weeklyHours: parsed.data.weeklyHours ?? null,
    meetingNote: parsed.data.meetingNote || null,
  };
}

export function toCollaborationRequest(values: ProjectCollaboration): ProjectCollaboration {
  return {
    meetingMode: values.meetingMode,
    weeklyHours: values.weeklyHours,
    meetingNote: values.meetingNote?.trim() || null,
  };
}

export function formatWeeklyHours(weeklyHours: number) {
  return `주 ${weeklyHours}시간`;
}

export function formatCollaborationSummary({
  meetingMode,
  weeklyHours,
}: Pick<ProjectCollaboration, 'meetingMode' | 'weeklyHours'>) {
  const parts = [
    meetingMode ? MEETING_MODE_LABEL[meetingMode] : null,
    weeklyHours ? formatWeeklyHours(weeklyHours) : null,
  ].filter((part) => part !== null);

  return parts.length > 0 ? parts.join(' · ') : null;
}
