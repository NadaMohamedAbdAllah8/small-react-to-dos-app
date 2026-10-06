import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { createTaskFixture } from '../fixtures/tasks';
import { apiUrl } from '../mocks/handlers';
import { server } from '../mocks/server';
import { renderApp } from '../test-utils';

describe('task create flows', () => {
  it('creates a normalized task once and renders its details', async () => {
    const user = userEvent.setup();
    const createdTask = createTaskFixture({
      id: 24,
      title: 'Created through integration',
      description: 'Ready for review',
      priority: 'high',
      due_date: '2026-11-15',
      is_completed: true,
    });
    const requestBodies = [];
    let releaseCreate;
    server.use(
      http.post(`${apiUrl}/tasks`, async ({ request }) => {
        requestBodies.push(await request.json());
        await new Promise((resolve) => {
          releaseCreate = resolve;
        });
        return HttpResponse.json(createdTask, { status: 201 });
      }),
      http.get(`${apiUrl}/tasks/24`, () => HttpResponse.json(createdTask)),
    );
    renderApp();

    await user.click(await screen.findByRole('link', { name: 'Add task' }));
    await user.type(
      screen.getByLabelText(/title/i),
      '  Created through integration  ',
    );
    await user.type(
      screen.getByLabelText(/description/i),
      '  Ready for review  ',
    );
    await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
    await user.type(screen.getByLabelText(/due date/i), '2026-11-15');
    await user.click(screen.getByLabelText(/completed/i));
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    await waitFor(() => expect(requestBodies).toHaveLength(1));
    expect(requestBodies[0]).toEqual({
      title: 'Created through integration',
      description: 'Ready for review',
      priority: 'high',
      due_date: '2026-11-15',
      is_completed: true,
      created_at: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(requestBodies[0].created_at))).toBe(false);

    const pendingButton = screen.getByRole('button', { name: 'Saving...' });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(requestBodies).toHaveLength(1);

    releaseCreate();

    expect(
      await screen.findByRole('heading', { name: createdTask.title }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks/24');
    expect(screen.getByText(createdTask.description)).toBeInTheDocument();
  });

  it('shows client validation without sending a create request', async () => {
    const user = userEvent.setup();
    let postCount = 0;
    server.use(
      http.post(`${apiUrl}/tasks`, () => {
        postCount += 1;
        return HttpResponse.json(createTaskFixture({ id: 24 }), { status: 201 });
      }),
    );
    renderApp({ route: '/tasks/new' });

    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveFocus();
    expect(postCount).toBe(0);
  });

  it('preserves the draft after failure and succeeds when retried', async () => {
    const user = userEvent.setup();
    const createdTask = createTaskFixture({
      id: 25,
      title: 'Retry this creation',
      description: 'Keep this draft',
    });
    const requestBodies = [];
    server.use(
      http.post(`${apiUrl}/tasks`, async ({ request }) => {
        requestBodies.push(await request.json());

        return requestBodies.length === 1
          ? HttpResponse.json(
              { message: 'The create request failed.' },
              { status: 500 },
            )
          : HttpResponse.json(createdTask, { status: 201 });
      }),
      http.get(`${apiUrl}/tasks/25`, () => HttpResponse.json(createdTask)),
    );
    renderApp({ route: '/tasks/new' });

    await user.type(screen.getByLabelText(/title/i), createdTask.title);
    await user.type(screen.getByLabelText(/description/i), createdTask.description);
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(
      await screen.findByText('The create request failed.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue(createdTask.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      createdTask.description,
    );

    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(
      await screen.findByRole('heading', { name: createdTask.title }),
    ).toBeInTheDocument();
    expect(requestBodies).toHaveLength(2);
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks/25');
  });
});
