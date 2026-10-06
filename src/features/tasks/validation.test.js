import { describe, expect, it } from 'vitest';
import {
  normalizeTaskPayload,
  TASK_PRIORITIES,
  validateTask,
} from './validation';

describe('validateTask', () => {
  it.each(['', '   ', '\n\t'])('requires a non-whitespace title', (title) => {
    expect(
      validateTask({ title, priority: 'medium', due_date: '' }),
    ).toEqual({ title: 'Title is required.' });
  });

  it.each(TASK_PRIORITIES)('accepts the %s priority', (priority) => {
    expect(
      validateTask({ title: 'Valid task', priority, due_date: '' }),
    ).toEqual({});
  });

  it('rejects an unsupported priority', () => {
    expect(
      validateTask({ title: 'Valid task', priority: 'urgent', due_date: '' }),
    ).toEqual({ priority: 'Choose a valid priority.' });
  });

  it.each([
    '2026/10/01',
    '2026-13-01',
    '2026-00-01',
    '2026-04-31',
    '2026-02-29',
    '0000-01-01',
  ])('rejects the invalid due date %s', (dueDate) => {
    expect(
      validateTask({
        title: 'Valid task',
        priority: 'medium',
        due_date: dueDate,
      }),
    ).toEqual({ due_date: 'Enter a valid due date.' });
  });

  it.each(['', '2026-10-31', '2028-02-29', '2000-02-29'])(
    'accepts the optional or valid due date %s',
    (dueDate) => {
      expect(
        validateTask({
          title: 'Valid task',
          priority: 'medium',
          due_date: dueDate,
        }),
      ).toEqual({});
    },
  );
});

describe('normalizeTaskPayload', () => {
  it('trims text and converts empty optional values to null', () => {
    expect(
      normalizeTaskPayload({
        title: '  Prepare release  ',
        description: '   ',
        priority: 'high',
        due_date: '',
        is_completed: true,
      }),
    ).toEqual({
      title: 'Prepare release',
      description: null,
      priority: 'high',
      due_date: null,
      is_completed: true,
    });
  });

  it('preserves populated optional values and completion state', () => {
    expect(
      normalizeTaskPayload({
        title: 'Task',
        description: '  Description  ',
        priority: 'low',
        due_date: '2026-12-01',
        is_completed: false,
      }),
    ).toEqual({
      title: 'Task',
      description: 'Description',
      priority: 'low',
      due_date: '2026-12-01',
      is_completed: false,
    });
  });
});
