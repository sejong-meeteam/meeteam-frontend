import { Clock, MessageSquareText, Video } from 'lucide-react';
import { MEETING_MODE_LABEL, formatWeeklyHours } from '@/components/features/project/collaboration';
import type { ProjectCollaboration } from '@/types/project';

const ICON_CLASS = 'h-4 w-4 shrink-0 text-mt-primary';

export default function ProjectCollaborationFacts({
  meetingMode,
  weeklyHours,
  meetingNote,
}: ProjectCollaboration) {
  return (
    <>
      {meetingMode ? (
        <div className="flex items-center gap-1.5" data-cy="project-detail-meeting-mode">
          <Video className={ICON_CLASS} aria-hidden strokeWidth={1.8} />
          <dt className="font-bold text-mt-text-secondary">회의</dt>
          <dd className="font-extrabold text-mt-text-primary">{MEETING_MODE_LABEL[meetingMode]}</dd>
        </div>
      ) : null}
      {weeklyHours ? (
        <div className="flex items-center gap-1.5" data-cy="project-detail-weekly-hours">
          <Clock className={ICON_CLASS} aria-hidden strokeWidth={1.8} />
          <dt className="font-bold text-mt-text-secondary">시간</dt>
          <dd className="font-extrabold text-mt-text-primary">
            {formatWeeklyHours(weeklyHours)} 예상
          </dd>
        </div>
      ) : null}
      {meetingNote ? (
        <div
          className="flex min-w-0 basis-full items-start gap-1.5"
          data-cy="project-detail-meeting-note"
        >
          <MessageSquareText className={`mt-0.5 ${ICON_CLASS}`} aria-hidden strokeWidth={1.8} />
          <dt className="shrink-0 font-bold text-mt-text-secondary">회의 메모</dt>
          <dd className="min-w-0 break-words font-medium text-mt-text-primary">{meetingNote}</dd>
        </div>
      ) : null}
    </>
  );
}
