import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../../api/client';
import { createTask } from './api';

vi.mock('../../api/client', () => ({
  request: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createTask', () => {
  it('posts only accepted task fields plus the mock timestamp', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T10:30:00.000Z'));

    const createdTask = {
      id: 4,
      title: 'Write create-page tests',
      description: null,
      priority: 'medium',
      due_date: null,
      is_completed: false,
      created_at: '2026-09-29T10:30:00.000Z',
    };
    request.mockResolvedValue(createdTask);

    const abortController = new AbortController();
    const result = await createTask(
      {
        title: 'Write create-page tests',
        description: null,
        priority: 'medium',
        due_date: null,
        is_completed: false,
        id: 999,
        created_at: 'untrusted timestamp',
      },
      { signal: abortController.signal },
    );

    expect(request).toHaveBeenCalledWith('/tasks', {
      method: 'POST',
      signal: abortController.signal,
      body: {
        title: 'Write create-page tests',
        description: null,
        priority: 'medium',
        due_date: null,
        is_completed: false,
        created_at: '2026-09-29T10:30:00.000Z',
      },
    });
    expect(result).toBe(createdTask);
  });

  it('rejects a created-task response without a numeric id', async () => {
    request.mockResolvedValue({ title: 'Missing id' });

    await expect(
      createTask({
        title: 'Missing id',
        description: null,
        priority: 'low',
        due_date: null,
        is_completed: false,
      }),
    ).rejects.toThrow('The created task response must include a numeric id.');
  });
});
