import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { taskFixtures } from '../fixtures/tasks';
import { renderApp } from '../test-utils';

describe('task routing flows', () => {
  it('redirects the application root to the task list', async () => {
    renderApp({ route: '/' });

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks');
    expect(
      await screen.findByRole('link', { name: taskFixtures[0].title }),
    ).toBeInTheDocument();
  });

  it('renders the application not-found page for an unknown route', () => {
    renderApp({ route: '/unknown-route' });

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Current route')).toHaveTextContent(
      '/unknown-route',
    );
  });

  it('supports browser-style back navigation through router history', async () => {
    const user = userEvent.setup();
    renderApp({ includeBackControl: true });

    await user.click(await screen.findByRole('link', { name: 'Add task' }));
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks/new');

    await user.click(screen.getByRole('button', { name: 'Go back in history' }));

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/tasks');
    expect(
      await screen.findByRole('link', { name: taskFixtures[0].title }),
    ).toBeInTheDocument();
  });
});
