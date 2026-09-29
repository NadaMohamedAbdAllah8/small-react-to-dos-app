import { request } from '../../api/client';

export async function getTasks({ signal } = {}) {
  const tasks = await request('/tasks', { signal });

  if (!Array.isArray(tasks)) {
    throw new Error('The tasks API response must be an array.');
  }

  return tasks;
}

function assertTaskResponse(task, message) {
  if (
    !task ||
    typeof task !== 'object' ||
    Array.isArray(task) ||
    !Number.isFinite(task.id)
  ) {
    throw new Error(message);
  }

  return task;
}

export async function getTask(taskId, { signal } = {}) {
  const task = await request(`/tasks/${encodeURIComponent(taskId)}`, { signal });

  return assertTaskResponse(
    task,
    'The task API response must include a numeric id.',
  );
}

export async function createTask(taskPayload, { signal } = {}) {
  const createdTask = await request('/tasks', {
    method: 'POST',
    signal,
    body: {
      title: taskPayload.title,
      description: taskPayload.description,
      priority: taskPayload.priority,
      due_date: taskPayload.due_date,
      is_completed: taskPayload.is_completed,
      created_at: new Date().toISOString(),
    },
  });

  return assertTaskResponse(
    createdTask,
    'The created task response must include a numeric id.',
  );
}

export async function updateTask(taskId, taskPayload, { signal } = {}) {
  const updatedTask = await request(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    signal,
    body: {
      title: taskPayload.title,
      description: taskPayload.description,
      priority: taskPayload.priority,
      due_date: taskPayload.due_date,
      is_completed: taskPayload.is_completed,
    },
  });

  return assertTaskResponse(
    updatedTask,
    'The updated task response must include a numeric id.',
  );
}

export function deleteTask(taskId, { signal } = {}) {
  return request(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
    signal,
  });
}
