import { describe, expect, it, vi } from 'vitest';
import { request } from '../../api/client';
import { createTask, deleteTask, getTask, getTasks, updateTask } from './api';

vi.mock('../../api/client', () => ({
  request: vi.fn(),
}));

describe('getTasks', () => {
  it('loads the collection and forwards the abort signal', async () => {
    const tasks = [{ id: 1, title: 'Task' }];
    const abortController = new AbortController();
    request.mockResolvedValue(tasks);

    await expect(
      getTasks({ signal: abortController.signal }),
    ).resolves.toBe(tasks);
    expect(request).toHaveBeenCalledWith('/tasks', {
      signal: abortController.signal,
    });
  });

  it('rejects a non-array collection response', async () => {
    request.mockResolvedValue({ data: [] });

    await expect(getTasks()).rejects.toThrow(
      'The tasks API response must be an array.',
    );
  });
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

describe('getTask', () => {
  it('loads one task and forwards the abort signal', async () => {
    const task = { id: 7, title: 'Loaded task' };
    const abortController = new AbortController();
    request.mockResolvedValue(task);

    const result = await getTask('7', { signal: abortController.signal });

    expect(request).toHaveBeenCalledWith('/tasks/7', {
      signal: abortController.signal,
    });
    expect(result).toBe(task);
  });

  it('encodes the task id and rejects a response without a numeric id', async () => {
    request.mockResolvedValue({ id: '7', title: 'Invalid task' });

    await expect(getTask('task/7')).rejects.toThrow(
      'The task API response must include a numeric id.',
    );
    expect(request).toHaveBeenCalledWith('/tasks/task%2F7', {
      signal: undefined,
    });
  });
});

describe('updateTask', () => {
  it('patches only editable task fields', async () => {
    const updatedTask = {
      id: 7,
      title: 'Updated task',
      description: null,
      priority: 'high',
      due_date: '2026-10-20',
      is_completed: true,
      created_at: '2026-09-01T08:00:00.000Z',
    };
    request.mockResolvedValue(updatedTask);

    const abortController = new AbortController();
    const result = await updateTask(
      '7',
      {
        title: 'Updated task',
        description: null,
        priority: 'high',
        due_date: '2026-10-20',
        is_completed: true,
        id: 999,
        created_at: 'untrusted timestamp',
      },
      { signal: abortController.signal },
    );

    expect(request).toHaveBeenCalledWith('/tasks/7', {
      method: 'PATCH',
      signal: abortController.signal,
      body: {
        title: 'Updated task',
        description: null,
        priority: 'high',
        due_date: '2026-10-20',
        is_completed: true,
      },
    });
    expect(result).toBe(updatedTask);
  });

  it('rejects an updated-task response without a numeric id', async () => {
    request.mockResolvedValue(null);

    await expect(
      updateTask('7', {
        title: 'Task',
        description: null,
        priority: 'medium',
        due_date: null,
        is_completed: false,
      }),
    ).rejects.toThrow('The updated task response must include a numeric id.');
  });
});

describe('deleteTask', () => {
  it('deletes the selected task and forwards the abort signal', async () => {
    const abortController = new AbortController();
    request.mockResolvedValue(null);

    await deleteTask('task/7', { signal: abortController.signal });

    expect(request).toHaveBeenCalledWith('/tasks/task%2F7', {
      method: 'DELETE',
      signal: abortController.signal,
    });
  });
});
