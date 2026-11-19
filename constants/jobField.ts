import type { JobFieldOption } from '@/types/auth';

// The backend names some fields differently from what the UI shows (e.g. '프론트').
// Every screen shows `label`; `aliases` lists the other names the backend may send.
const JOB_FIELDS = {
  PLANNING: { label: '기획', aliases: ['PM/기획'] },
  DESIGN: { label: '디자인', aliases: ['디자이너'] },
  FRONTEND: { label: '프론트엔드', aliases: ['프론트'] },
  BACKEND: { label: '백엔드', aliases: [] },
  AI: { label: 'AI', aliases: [] },
  INFRA_OPERATION: { label: '인프라/운영', aliases: [] },
  MARKETING: { label: '마케팅', aliases: [] },
  DATA: { label: '데이터', aliases: [] },
} as const satisfies Record<string, { label: string; aliases: readonly string[] }>;

export type JobFieldCode = keyof typeof JOB_FIELDS;

const JOB_FIELD_CODES = Object.keys(JOB_FIELDS) as JobFieldCode[];

export const JOB_FIELD_FILTER_ALL = '전체';

export type JobFieldFilter = typeof JOB_FIELD_FILTER_ALL | JobFieldCode;

export type JobFieldFilterOption = { value: JobFieldFilter; label: string };

function normalizeName(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function isJobFieldCode(code: string): code is JobFieldCode {
  return (JOB_FIELD_CODES as string[]).includes(code);
}

export function findJobFieldCodeByName(name: string): JobFieldCode | null {
  const normalizedName = normalizeName(name);

  return (
    JOB_FIELD_CODES.find((code) => {
      const { label, aliases } = JOB_FIELDS[code];
      return [label, ...aliases].some((candidate) => normalizeName(candidate) === normalizedName);
    }) ?? null
  );
}

// Accepts a displayed label, an alias, or the backend name, so a dropdown that shows labels
// still resolves to the backend field.
export function findJobFieldOption<T extends Pick<JobFieldOption, 'code' | 'name'>>(
  jobFields: T[],
  name: string,
): T | null {
  const code = findJobFieldCodeByName(name);
  const normalizedName = normalizeName(name);

  return (
    jobFields.find(
      (field) => field.code === code || normalizeName(field.name) === normalizedName,
    ) ?? null
  );
}

export function getJobFieldLabel(name: string) {
  const code = findJobFieldCodeByName(name);
  return code ? JOB_FIELDS[code].label : name.trim();
}

export function getJobFieldOptionLabel(field: Pick<JobFieldOption, 'code' | 'name'>) {
  return isJobFieldCode(field.code) ? JOB_FIELDS[field.code].label : getJobFieldLabel(field.name);
}

// Filters offer only fields the backend returned, so no option is guaranteed to be empty.
export function toJobFieldFilterOptions(
  fields: Pick<JobFieldOption, 'code'>[],
): JobFieldFilterOption[] {
  const codes = JOB_FIELD_CODES.filter((code) => fields.some((field) => field.code === code));

  return [
    { value: JOB_FIELD_FILTER_ALL, label: JOB_FIELD_FILTER_ALL },
    ...codes.map((code) => ({ value: code, label: JOB_FIELDS[code].label })),
  ];
}
