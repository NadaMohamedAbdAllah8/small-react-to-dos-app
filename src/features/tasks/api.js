import { request } from '../../api/client';

export async function getTasks({ signal } = {}) {
  const tasks = await request('/tasks', { signal });

  if (!Array.isArray(tasks)) {
    throw new Error('The tasks API response must be an array.');
  }

  return tasks;
}
