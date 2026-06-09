// lib/date.ts

export const formatDate = (
  date?: string | null
) => {
  if (!date) return '-';

  const parsed = new Date(date);

  if (isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleDateString('en-IN');
};