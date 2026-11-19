import { getJobFieldLabel } from '@/constants/jobField';

export function formatJobRole(field?: string | null, position?: string | null) {
  const fieldLabel = field ? getJobFieldLabel(field) : '';
  const positionLabel = position?.trim() ?? '';

  if (fieldLabel && positionLabel) {
    return `${fieldLabel}(${positionLabel})`;
  }

  return fieldLabel || positionLabel || '-';
}
