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
    request.mockResolvedValue({
      status: 200,
      message: 'Tasks retrieved successfully.',
      data: tasks,
    });

    await expect(
      getTasks({ signal: abortController.signal }),
    ).resolves.toBe(tasks);
    expect(request).toHaveBeenCalledWith('/tasks', {
      signal: abortController.signal,
    });
  });

  it.each([
    ['a missing data field', { status: 200, message: 'Success.' }],
    ['a non-array data field', { status: 200, message: 'Success.', data: {} }],
  ])('rejects %s in the collection response', async (_label, response) => {
    request.mockResolvedValue(response);

    await expect(getTasks()).rejects.toThrow(
      'The tasks API response must include a data array.',
    );
  });
});

describe('createTask', () => {
  it('posts only editable task fields and unwraps the created task', async () => {
    const createdTask = {
      id: 4,
      title: 'Write create-page tests',
      description: null,
      priority: 'medium',
      due_date: null,
      is_completed: false,
      created_at: '2026-09-29T10:30:00.000Z',
    };
    request.mockResolvedValue({
      status: 201,
      message: 'Task created successfully.',
      data: createdTask,
    });

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
      },
    });
    expect(result).toBe(createdTask);
  });

  it('rejects a created-task response without a numeric id', async () => {
    request.mockResolvedValue({
      status: 201,
      message: 'Task created successfully.',
      data: { title: 'Missing id' },
    });

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

  it('rejects a created-task response without a data field', async () => {
    request.mockResolvedValue({ status: 201, message: 'Success.' });

    await expect(
      createTask({
        title: 'Missing data',
        description: null,
        priority: 'low',
        due_date: null,
        is_completed: false,
      }),
    ).rejects.toThrow('The created task response must include task data.');
  });
});

describe('getTask', () => {
  it('loads one task and forwards the abort signal', async () => {
    const task = { id: 7, title: 'Loaded task' };
    const abortController = new AbortController();
    request.mockResolvedValue({
      status: 200,
      message: 'Task retrieved successfully.',
      data: task,
    });

    const result = await getTask('7', { signal: abortController.signal });

    expect(request).toHaveBeenCalledWith('/tasks/7', {
      signal: abortController.signal,
    });
    expect(result).toBe(task);
  });

  it('encodes the task id and rejects a response without a numeric id', async () => {
    request.mockResolvedValue({
      status: 200,
      message: 'Task retrieved successfully.',
      data: { id: '7', title: 'Invalid task' },
    });

    await expect(getTask('task/7')).rejects.toThrow(
      'The task API response must include a numeric id.',
    );
    expect(request).toHaveBeenCalledWith('/tasks/task%2F7', {
      signal: undefined,
    });
  });

  it('rejects a task response without a data field', async () => {
    request.mockResolvedValue({ status: 200, message: 'Success.' });

    await expect(getTask('7')).rejects.toThrow(
      'The task API response must include task data.',
    );
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
    request.mockResolvedValue({
      status: 200,
      message: 'Task updated successfully.',
      data: updatedTask,
    });

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
    request.mockResolvedValue({
      status: 200,
      message: 'Task updated successfully.',
      data: null,
    });

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

  it('rejects an updated-task response without a data field', async () => {
    request.mockResolvedValue({ status: 200, message: 'Success.' });

    await expect(
      updateTask('7', {
        title: 'Task',
        description: null,
        priority: 'medium',
        due_date: null,
        is_completed: false,
      }),
    ).rejects.toThrow('The updated task response must include task data.');
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
