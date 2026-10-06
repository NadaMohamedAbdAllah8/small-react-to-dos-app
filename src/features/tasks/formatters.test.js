import { describe, expect, it } from 'vitest';
import {
  formatTaskCreatedDate,
  formatTaskDueDate,
  formatTaskListDate,
} from './formatters';

describe('task date formatters', () => {
  it('formats date-only values in UTC', () => {
    expect(formatTaskListDate('2026-09-10')).toBe('Sep 10');
    expect(formatTaskDueDate('2026-09-10')).toBe('Sep 10, 2026');
  });

  it('formats created timestamps in UTC', () => {
    expect(formatTaskCreatedDate('2026-09-08T09:00:00.000Z')).toBe(
      'Sep 08, 2026 at 09:00 AM',
    );
  });

  it('uses context-specific empty-value fallbacks', () => {
    expect(formatTaskListDate(null)).toBe('No date');
    expect(formatTaskDueDate('')).toBe('No due date');
    expect(formatTaskCreatedDate(undefined)).toBe('Invalid date');
  });

  it.each(['not-a-date', '2026-02-30', '2026-13-01'])(
    'returns a safe fallback for malformed value %s',
    (value) => {
      expect(formatTaskListDate(value)).toBe('Invalid date');
      expect(formatTaskDueDate(value)).toBe('Invalid date');
      expect(formatTaskCreatedDate(value)).toBe('Invalid date');
    },
  );
});
