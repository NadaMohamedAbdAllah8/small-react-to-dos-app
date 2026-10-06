import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { getTask, getTasks } from './features/tasks/api';
import App from './App';

vi.mock('./features/tasks/api', () => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
}));

describe('App', () => {
  it('redirects the root route to the task list', async () => {
    getTasks.mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'No tasks yet' }),
    ).toBeInTheDocument();
  });

  it('routes the task collection to the list page', async () => {
    getTasks.mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No tasks yet' })).toBeInTheDocument();
  });

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

  it('routes task details to the details page', async () => {
    getTask.mockResolvedValue({
      id: 7,
      title: 'Route details task',
      description: null,
      priority: 'medium',
      due_date: null,
      is_completed: false,
      created_at: '2026-09-29T08:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/tasks/7']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Route details task' }),
    ).toBeInTheDocument();
  });

  it('renders the not-found page for an unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument();
  });
});
