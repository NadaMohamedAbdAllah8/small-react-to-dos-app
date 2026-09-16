import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { getTasks } from './features/tasks/api';

vi.mock('./features/tasks/api', () => ({
  getTasks: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    getTasks.mockResolvedValue([]);
  });

  it('renders the tasks route', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
  });

  it.each(['/tasks/new', '/tasks/1'])(
    'explains that the %s route is not implemented yet',
    (route) => {
      render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>,
      );

      expect(
        screen.getByRole('heading', { name: 'Feature not available yet' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to tasks' })).toHaveAttribute(
        'href',
        '/tasks',
      );
    },
  );
});
