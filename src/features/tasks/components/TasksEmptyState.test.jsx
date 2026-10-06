import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import TasksEmptyState from './TasksEmptyState';

describe('TasksEmptyState', () => {
  it('offers task creation for an empty collection', () => {
    render(
      <MemoryRouter>
        <TasksEmptyState />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'No tasks yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add your first task' })).toHaveAttribute(
      'href',
      '/tasks/new',
    );
  });

  it('reports a trimmed search value without offering creation', () => {
    render(
      <MemoryRouter>
        <TasksEmptyState searchValue="  missing task  " />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'No matching tasks' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/missing task/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
