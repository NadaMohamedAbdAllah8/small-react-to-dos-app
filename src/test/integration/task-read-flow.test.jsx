import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { taskFixtures } from '../fixtures/tasks';
import { apiUrl } from '../mocks/handlers';
import { server } from '../mocks/server';
import { renderApp } from '../test-utils';

describe('task read flows', () => {
  it('renders the task list and filters it through the toolbar', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(
      await screen.findByRole('link', { name: taskFixtures[0].title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: taskFixtures[1].title })).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: `${taskFixtures[1].title} is completed`,
      }),
    ).toBeChecked();

    await user.type(
      screen.getByRole('searchbox', { name: 'Search tasks' }),
      'integration',
    );

    expect(screen.queryByRole('link', { name: taskFixtures[0].title })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: taskFixtures[1].title })).toBeInTheDocument();
  });

  it('navigates from the list to the selected task details', async () => {
    const user = userEvent.setup();
    const requestedTaskIds = [];
    server.use(
      http.get(`${apiUrl}/tasks/:taskId`, ({ params }) => {
        requestedTaskIds.push(params.taskId);
        return HttpResponse.json(taskFixtures[1]);
      }),
    );
    renderApp();

    await user.click(
      await screen.findByRole('link', { name: taskFixtures[1].title }),
    );

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks/2');
    expect(requestedTaskIds).toEqual(['2']);
    expect(
      await screen.findByRole('heading', { name: taskFixtures[1].title }),
    ).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('renders the empty state with a create action', async () => {
    server.use(
      http.get(`${apiUrl}/tasks`, () => HttpResponse.json([])),
    );
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'No tasks yet' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add your first task' })).toHaveAttribute(
      'href',
      '/tasks/new',
    );
  });

  it('recovers from a list failure when the user retries', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    server.use(
      http.get(`${apiUrl}/tasks`, () => {
        requestCount += 1;

        return requestCount === 1
          ? HttpResponse.json(
              { message: 'Temporary list failure.' },
              { status: 500 },
            )
          : HttpResponse.json(taskFixtures);
      }),
    );
    renderApp();

    expect(await screen.findByText('Temporary list failure.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('link', { name: taskFixtures[0].title }),
    ).toBeInTheDocument();
    expect(requestCount).toBe(2);
  });

  it('shows a missing-task state and returns to the list', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/tasks/999' });

    expect(
      await screen.findByRole('heading', { name: 'Task not found' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Back to tasks' }));

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks');
    expect(
      await screen.findByRole('link', { name: taskFixtures[0].title }),
    ).toBeInTheDocument();
  });
});
