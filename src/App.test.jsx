import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTask } from './features/tasks/api';
import App from './App';

vi.mock('./features/tasks/api', () => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('App', () => {
  it('routes task creation to the create page', () => {
    render(
      <MemoryRouter initialEntries={['/tasks/new']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Create task' }),
    ).toBeInTheDocument();
  });

  it('routes task editing to the edit page', async () => {
    getTask.mockResolvedValue({
      id: 7,
      title: 'Route edit task',
      description: null,
      priority: 'medium',
      due_date: null,
      is_completed: false,
      created_at: '2026-09-29T08:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/tasks/7/edit']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Edit task' }),
    ).toBeInTheDocument();
  });
});
