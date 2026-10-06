import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { createTaskFixture } from '../fixtures/tasks';
import { apiUrl } from '../mocks/handlers';
import { server } from '../mocks/server';
import { renderApp } from '../test-utils';

describe('task edit flows', () => {
  it('loads, updates, and renders the task through real routes', async () => {
    const user = userEvent.setup();
    let currentTask = createTaskFixture({ id: 7, title: 'Original title' });
    const requestedTaskIds = [];
    const patchBodies = [];
    let releaseUpdate;
    server.use(
      http.get(`${apiUrl}/tasks/:taskId`, ({ params }) => {
        requestedTaskIds.push(params.taskId);
        return HttpResponse.json(currentTask);
      }),
      http.patch(`${apiUrl}/tasks/7`, async ({ request }) => {
        const body = await request.json();
        patchBodies.push(body);
        await new Promise((resolve) => {
          releaseUpdate = resolve;
        });
        currentTask = { ...currentTask, ...body };
        return HttpResponse.json(currentTask);
      }),
    );
    renderApp({ route: '/tasks/7' });

    await screen.findByRole('heading', { name: 'Original title' });
    await user.click(screen.getByRole('link', { name: 'Edit task' }));

    const title = await screen.findByLabelText(/title/i);
    expect(title).toHaveValue('Original title');
    expect(requestedTaskIds).toEqual(['7', '7']);

    await user.clear(title);
    await user.type(title, 'Updated through integration');
    await user.clear(screen.getByLabelText(/description/i));
    await user.type(screen.getByLabelText(/description/i), 'Updated description');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'low');
    await user.click(screen.getByLabelText(/completed/i));
    await user.click(screen.getByRole('button', { name: 'Update task' }));

    await waitFor(() => expect(patchBodies).toHaveLength(1));
    expect(patchBodies[0]).toEqual({
      title: 'Updated through integration',
      description: 'Updated description',
      priority: 'low',
      due_date: '2026-10-10',
      is_completed: true,
    });
    const pendingButton = screen.getByRole('button', { name: 'Saving...' });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(patchBodies).toHaveLength(1);

    releaseUpdate();

    expect(
      await screen.findByRole('heading', {
        name: 'Updated through integration',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks/7');
    expect(screen.getByText('Updated description')).toBeInTheDocument();
  });

  it('shows loading before an edit-route 404 resolves', async () => {
    let releaseLoad;
    server.use(
      http.get(`${apiUrl}/tasks/999`, async () => {
        await new Promise((resolve) => {
          releaseLoad = resolve;
        });
        return HttpResponse.json({ message: 'Task not found.' }, { status: 404 });
      }),
    );
    renderApp({ route: '/tasks/999/edit' });

    expect(screen.getByRole('status')).toHaveTextContent('Loading task...');
    await waitFor(() => expect(releaseLoad).toBeTypeOf('function'));
    releaseLoad();

    expect(
      await screen.findByRole('heading', { name: 'Task not found' }),
    ).toBeInTheDocument();
  });

  it('preserves edits after failure and completes a retry', async () => {
    const user = userEvent.setup();
    let currentTask = createTaskFixture({ id: 8, title: 'Retry edit' });
    const patchBodies = [];
    server.use(
      http.get(`${apiUrl}/tasks/8`, () => HttpResponse.json(currentTask)),
      http.patch(`${apiUrl}/tasks/8`, async ({ request }) => {
        const body = await request.json();
        patchBodies.push(body);

        if (patchBodies.length === 1) {
          return HttpResponse.json(
            { message: 'The update request failed.' },
            { status: 500 },
          );
        }

        currentTask = { ...currentTask, ...body };
        return HttpResponse.json(currentTask);
      }),
    );
    renderApp({ route: '/tasks/8/edit' });

    const title = await screen.findByLabelText(/title/i);
    await user.clear(title);
    await user.type(title, 'Retried edit title');
    await user.click(screen.getByRole('button', { name: 'Update task' }));

    expect(
      await screen.findByText('The update request failed.'),
    ).toBeInTheDocument();
    expect(title).toHaveValue('Retried edit title');

    await user.click(screen.getByRole('button', { name: 'Update task' }));

    expect(
      await screen.findByRole('heading', { name: 'Retried edit title' }),
    ).toBeInTheDocument();
    expect(patchBodies).toHaveLength(2);
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks/8');
  });
});
