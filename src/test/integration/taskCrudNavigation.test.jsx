import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../../App';
import {
  createTask,
  getTask,
  getTasks,
} from '../../features/tasks/api';

vi.mock('../../features/tasks/api', () => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
}));

const task = {
  id: 7,
  title: 'Navigate the CRUD flow',
  description: 'Use real routed pages.',
  priority: 'medium',
  due_date: null,
  is_completed: false,
  created_at: '2026-09-29T08:00:00.000Z',
};

function renderApp(initialRoute) {
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  );
}

describe('task CRUD navigation', () => {
  it('navigates from the list to details and edit pages', async () => {
    const user = userEvent.setup();
    getTasks.mockResolvedValue([task]);
    getTask.mockResolvedValue(task);
    renderApp('/tasks');

    await user.click(
      await screen.findByRole('link', { name: 'Navigate the CRUD flow' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Navigate the CRUD flow' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Edit task' }));
    expect(
      await screen.findByRole('heading', { name: 'Edit task' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue(
      'Navigate the CRUD flow',
    );
  });

  it('navigates from creation success to the real details page', async () => {
    const user = userEvent.setup();
    const createdTask = { ...task, id: 24, title: 'Created through App' };
    createTask.mockResolvedValue(createdTask);
    getTask.mockResolvedValue(createdTask);
    renderApp('/tasks/new');

    await user.type(screen.getByLabelText(/title/i), 'Created through App');
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(
      await screen.findByRole('heading', { name: 'Created through App' }),
    ).toBeInTheDocument();
    expect(getTask).toHaveBeenCalledWith('24', {
      signal: expect.any(AbortSignal),
    });
  });
});
