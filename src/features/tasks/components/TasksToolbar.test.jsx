import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TasksToolbar from './TasksToolbar';

describe('TasksToolbar', () => {
  it('renders the controlled search value and reports user changes', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <TasksToolbar onSearchChange={onSearchChange} searchValue="existing" />,
    );

    const search = screen.getByRole('searchbox', { name: 'Search tasks' });
    expect(search).toHaveValue('existing');

    await user.type(search, 'x');

    expect(onSearchChange).toHaveBeenLastCalledWith('existingx');
  });

  it('labels the future status and priority filters as disabled', () => {
    render(<TasksToolbar onSearchChange={vi.fn()} searchValue="" />);

    expect(
      screen.getByRole('combobox', { name: 'Filter tasks by status' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Filter tasks by priority' }),
    ).toBeDisabled();
  });
});
