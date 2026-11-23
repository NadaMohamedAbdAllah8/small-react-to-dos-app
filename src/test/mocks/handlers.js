import { http, HttpResponse } from 'msw';
import {
  authSessionFixture,
  authUserFixture,
  loginPasswordFixture,
} from '../fixtures/auth';
import { taskFixtures } from '../fixtures/tasks';

export const apiUrl = 'http://localhost:8081/api';

export function createApiResponse(
  data,
  { message = 'Request completed successfully.', status = 200 } = {},
) {
  return HttpResponse.json({ status, message, data }, { status });
}

function isAuthenticated(request) {
  return (
    request.headers.get('Authorization') ===
    `${authSessionFixture.tokenType} ${authSessionFixture.token}`
  );
}

function unauthorizedResponse() {
  return HttpResponse.json(
    { status: 401, message: 'Unauthenticated.' },
    { status: 401 },
  );
}

export const handlers = [
  http.post(`${apiUrl}/login`, async ({ request }) => {
    const credentials = await request.json();

    if (
      credentials.email !== authUserFixture.email ||
      credentials.password !== loginPasswordFixture
    ) {
      return HttpResponse.json(
        { status: 401, message: 'The provided credentials are incorrect.' },
        { status: 401 },
      );
    }

    return createApiResponse(
      {
        token: authSessionFixture.token,
        token_type: authSessionFixture.tokenType,
        user: authUserFixture,
      },
      { message: 'Logged in successfully' },
    );
  }),
  http.post(`${apiUrl}/logout`, ({ request }) =>
    isAuthenticated(request)
      ? new HttpResponse(null, { status: 204 })
      : unauthorizedResponse(),
  ),
  http.get(`${apiUrl}/tasks`, ({ request }) =>
    isAuthenticated(request)
      ? createApiResponse(taskFixtures, {
          message: 'Tasks retrieved successfully.',
        })
      : unauthorizedResponse(),
  ),
  http.get(`${apiUrl}/tasks/:taskId`, ({ params, request }) => {
    if (!isAuthenticated(request)) {
      return unauthorizedResponse();
    }

    const task = taskFixtures.find(
      (candidate) => String(candidate.id) === params.taskId,
    );

    return task
      ? createApiResponse(task, { message: 'Task retrieved successfully.' })
      : HttpResponse.json({ message: 'Task not found.' }, { status: 404 });
  }),
];
