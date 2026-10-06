import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { taskFixtures } from '../fixtures/tasks';
import { apiUrl } from '../mocks/handlers';
import { server } from '../mocks/server';
import { renderApp } from '../test-utils';

describe('task delete flows', () => {
  it('cancels then deletes the selected list task exactly once', async () => {
    const user = userEvent.setup();
    const deletedTaskIds = [];
    let releaseDelete;
    server.use(
      http.delete(`${apiUrl}/tasks/:taskId`, async ({ params }) => {
        deletedTaskIds.push(params.taskId);
        await new Promise((resolve) => {
          releaseDelete = resolve;
        });
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp();

    await user.click(
      await screen.findByRole('button', {
        name: `Delete ${taskFixtures[0].title}`,
      }),
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      `Delete "${taskFixtures[0].title}"? This action cannot be undone.`,
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deletedTaskIds).toEqual([]);

    await user.click(
      screen.getByRole('button', { name: `Delete ${taskFixtures[0].title}` }),
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => expect(deletedTaskIds).toEqual(['1']));
    const pendingButton = screen.getByRole('button', { name: 'Deleting...' });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(deletedTaskIds).toEqual(['1']);

    releaseDelete();

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: taskFixtures[0].title }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: taskFixtures[1].title })).toBeInTheDocument();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks');
  });

  it('keeps the list dialog open after failure and succeeds on retry', async () => {
    const user = userEvent.setup();
    let deleteCount = 0;
    server.use(
      http.delete(`${apiUrl}/tasks/2`, () => {
        deleteCount += 1;

        return deleteCount === 1
          ? HttpResponse.json(
              { message: 'The delete request failed.' },
              { status: 500 },
            )
          : new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp();

    await user.click(
      await screen.findByRole('button', {
        name: `Delete ${taskFixtures[1].title}`,
      }),
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(
      await screen.findByText('The delete request failed.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: taskFixtures[1].title })).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: taskFixtures[1].title }),
      ).not.toBeInTheDocument();
    });
    expect(deleteCount).toBe(2);
  });

  it('deletes from details and navigates to the remaining list', async () => {
    const user = userEvent.setup();
    const deletedTaskIds = [];
    server.use(
      http.delete(`${apiUrl}/tasks/:taskId`, ({ params }) => {
        deletedTaskIds.push(params.taskId);
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${apiUrl}/tasks`, () => HttpResponse.json([taskFixtures[1]])),
    );
    renderApp({ route: '/tasks/1' });

    await screen.findByRole('heading', { name: taskFixtures[0].title });
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(
      await screen.findByRole('link', { name: taskFixtures[1].title }),
    ).toBeInTheDocument();
    expect(deletedTaskIds).toEqual(['1']);
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks');
  });

  it('keeps the details dialog and route visible after deletion failure', async () => {
    const user = userEvent.setup();
    server.use(
      http.delete(`${apiUrl}/tasks/1`, () =>
        HttpResponse.json(
          { message: 'Unable to delete this task.' },
          { status: 500 },
        ),
      ),
    );
    renderApp({ route: '/tasks/1' });

    await screen.findByRole('heading', { name: taskFixtures[0].title });
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(
      await screen.findByText('Unable to delete this task.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: taskFixtures[0].title })).toBeInTheDocument();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks/1');
  });
});
