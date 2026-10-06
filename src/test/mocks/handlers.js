import { http, HttpResponse } from 'msw';
import { taskFixtures } from '../fixtures/tasks';

export const apiUrl = 'http://localhost:3001/api';

export const handlers = [
  http.get(`${apiUrl}/tasks`, () => HttpResponse.json(taskFixtures)),
  http.get(`${apiUrl}/tasks/:taskId`, ({ params }) => {
    const task = taskFixtures.find(
      (candidate) => String(candidate.id) === params.taskId,
    );

    return task
      ? HttpResponse.json(task)
      : HttpResponse.json({ message: 'Task not found.' }, { status: 404 });
  }),
];
