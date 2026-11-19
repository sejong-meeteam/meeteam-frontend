import type { JobFieldOption } from '@/types/auth';

export function collectTechStackNames(jobFields: JobFieldOption[]) {
  return Array.from(
    new Set(jobFields.flatMap((field) => field.techStacks.map((techStack) => techStack.name))),
  ).sort((left, right) => left.localeCompare(right, 'ko'));
}

export function collectOrderedTechStackNames(
  jobFields: JobFieldOption[],
  selectedField?: JobFieldOption | null,
) {
  const orderedFields = selectedField
    ? [selectedField, ...jobFields.filter((field) => field.code !== selectedField.code)]
    : jobFields;

  return Array.from(
    new Set(orderedFields.flatMap((field) => field.techStacks.map((techStack) => techStack.name))),
  );
}

export function findTechStackByName(jobFields: JobFieldOption[], name: string) {
  return jobFields
    .flatMap((field) => field.techStacks)
    .find((techStack) => techStack.name === name);
}
