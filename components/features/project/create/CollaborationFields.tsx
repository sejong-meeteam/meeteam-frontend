import { Circle, CircleDot } from 'lucide-react';
import {
  MEETING_MODES,
  MEETING_MODE_LABEL,
  MEETING_NOTE_MAX_LENGTH,
  WEEKLY_HOURS_MAX,
  WEEKLY_HOURS_MIN,
} from '@/components/features/project/collaboration';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import BaseTag from '@/components/shared/BaseTag';
import type { MeetingMode } from '@/types/project';

export type CollaborationFieldsValue = {
  meetingMode: MeetingMode | null;
  weeklyHours: string;
  meetingNote: string;
};

type CollaborationFieldsProps = {
  value: CollaborationFieldsValue;
  errors: { weeklyHours?: string; meetingNote?: string };
  onChange: (patch: Partial<CollaborationFieldsValue>) => void;
};

const MEETING_MODE_CHOICES: Array<{ value: MeetingMode | null; label: string }> = [
  { value: null, label: '미정' },
  ...MEETING_MODES.map((mode) => ({ value: mode, label: MEETING_MODE_LABEL[mode] })),
];

export default function CollaborationFields({ value, errors, onChange }: CollaborationFieldsProps) {
  return (
    <>
      <BaseField
        hintText="지원자가 지원 전에 가장 먼저 확인하는 정보예요."
        htmlFor="project-form-meeting-mode"
        label="회의 방식"
        required={false}
      >
        <div
          id="project-form-meeting-mode"
          role="radiogroup"
          aria-label="회의 방식"
          aria-describedby="project-form-meeting-mode-hint"
          className="flex flex-wrap gap-2"
        >
          {MEETING_MODE_CHOICES.map((choice) => {
            const selected = value.meetingMode === choice.value;
            const Indicator = selected ? CircleDot : Circle;

            return (
              <label key={choice.label} className="cursor-pointer">
                <input
                  type="radio"
                  name="project-form-meeting-mode"
                  value={choice.value ?? ''}
                  checked={selected}
                  onChange={() => onChange({ meetingMode: choice.value })}
                  data-cy={`project-form-meeting-mode-${choice.value ?? 'none'}`}
                  className="peer sr-only"
                />
                <BaseTag
                  selected={selected}
                  leftIcon={<Indicator className="h-4 w-4" aria-hidden strokeWidth={2} />}
                  className="min-h-10 peer-focus-visible:ring-2 peer-focus-visible:ring-mt-primary peer-focus-visible:ring-offset-2"
                >
                  {choice.label}
                </BaseTag>
              </label>
            );
          })}
        </div>
      </BaseField>

      <div className="flex w-full flex-col gap-8 sm:flex-row sm:gap-4">
        <BaseField
          className="sm:max-w-48"
          errorText={errors.weeklyHours}
          hintText={`${WEEKLY_HOURS_MIN}~${WEEKLY_HOURS_MAX}시간`}
          htmlFor="project-form-weekly-hours"
          label="주당 예상 시간"
          required={false}
        >
          <BaseInput
            id="project-form-weekly-hours"
            type="number"
            inputMode="numeric"
            min={WEEKLY_HOURS_MIN}
            max={WEEKLY_HOURS_MAX}
            value={value.weeklyHours}
            data-cy="project-form-weekly-hours"
            onChange={(event) => onChange({ weeklyHours: event.target.value })}
            placeholder="예: 6"
            rightIcon={<span className="text-sm leading-5">시간</span>}
            error={Boolean(errors.weeklyHours)}
            aria-describedby={
              errors.weeklyHours
                ? 'project-form-weekly-hours-error'
                : 'project-form-weekly-hours-hint'
            }
          />
        </BaseField>

        <BaseField
          className="min-w-0 sm:flex-1"
          errorText={errors.meetingNote}
          hintText={`${value.meetingNote.length}/${MEETING_NOTE_MAX_LENGTH}자`}
          htmlFor="project-form-meeting-note"
          label="회의 메모"
          required={false}
        >
          <BaseInput
            id="project-form-meeting-note"
            value={value.meetingNote}
            maxLength={MEETING_NOTE_MAX_LENGTH}
            data-cy="project-form-meeting-note"
            onChange={(event) => onChange({ meetingNote: event.target.value })}
            placeholder="예: 화요일 저녁 7시 디스코드"
            error={Boolean(errors.meetingNote)}
            aria-describedby={
              errors.meetingNote
                ? 'project-form-meeting-note-error'
                : 'project-form-meeting-note-hint'
            }
          />
        </BaseField>
      </div>
    </>
  );
}
