import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import TaskList from './TaskList';

const tasks = [
  {
    id: 1,
    title: 'First task',
    description: 'First description',
    priority: 'high',
    due_date: '2026-10-10',
    is_completed: false,
    created_at: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 2,
    title: 'Second task',
    description: null,
    priority: 'low',
    due_date: null,
    is_completed: true,
    created_at: '2026-09-02T08:00:00.000Z',
  },
];

describe('TaskList', () => {
  it('renders an accessible table containing every task', () => {
    render(
      <MemoryRouter>
        <TaskList onDelete={vi.fn()} tasks={tasks} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('table', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'First task' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Second task' })).toBeInTheDocument();
  });

  it('passes the selected task to the delete callback', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <TaskList onDelete={onDelete} tasks={tasks} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Delete Second task' }));

    expect(onDelete).toHaveBeenCalledWith(tasks[1]);
  });
});
