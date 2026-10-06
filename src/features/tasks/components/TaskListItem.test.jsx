import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import TaskListItem from './TaskListItem';

const task = {
  id: 42,
  title: 'Review tests',
  description: 'Check user-visible behavior.',
  priority: 'medium',
  due_date: '2026-10-10',
  is_completed: false,
  created_at: '2026-09-01T08:00:00.000Z',
};

function renderItem(overrides = {}, onDelete = vi.fn()) {
  const renderedTask = { ...task, ...overrides };
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <TaskListItem onDelete={onDelete} task={renderedTask} />
        </tbody>
      </table>
    </MemoryRouter>,
  );
  return { onDelete, task: renderedTask };
}

describe('TaskListItem', () => {
  it('renders task details and links to the task route', () => {
    renderItem();

    expect(screen.getByRole('link', { name: 'Review tests' })).toHaveAttribute(
      'href',
      '/tasks/42',
    );
    expect(screen.getByRole('link', { name: 'View Review tests' })).toHaveAttribute(
      'href',
      '/tasks/42',
    );
    expect(screen.getByText('Check user-visible behavior.')).toBeInTheDocument();
    expect(screen.getByText('Sep 01')).toBeInTheDocument();
    expect(screen.getByText('Oct 10')).toBeInTheDocument();
  });

  it('shows optional fallbacks and completed status', () => {
    renderItem({
      description: null,
      due_date: null,
      is_completed: true,
    });

    expect(screen.queryByText('Check user-visible behavior.')).not.toBeInTheDocument();
    expect(screen.getByText('No date')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Review tests is completed' }),
    ).toBeChecked();
  });

  it('renders malformed dates safely', () => {
    renderItem({ created_at: 'invalid', due_date: '2026-02-30' });

    expect(screen.getAllByText('Invalid date')).toHaveLength(2);
  });

  it('passes the whole task to onDelete', async () => {
    const user = userEvent.setup();
    const { onDelete, task: renderedTask } = renderItem();

    await user.click(screen.getByRole('button', { name: 'Delete Review tests' }));

    expect(onDelete).toHaveBeenCalledWith(renderedTask);
  });
});
