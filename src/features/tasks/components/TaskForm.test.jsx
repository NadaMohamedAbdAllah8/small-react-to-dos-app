import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateTask } from '../validation';
import TaskForm from './TaskForm';

afterEach(cleanup);

const defaultProps = {
  initialValues: {},
  isSubmitting: false,
  onCancel: vi.fn(),
  onSubmit: vi.fn(),
  serverErrors: {},
  submitLabel: 'Save task',
};

function renderTaskForm(overrides = {}) {
  const props = {
    ...defaultProps,
    onCancel: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };

  render(<TaskForm {...props} />);
  return props;
}

describe('TaskForm', () => {
  it('renders initial values as an editable draft', () => {
    renderTaskForm({
      initialValues: {
        title: 'Review API contract',
        description: null,
        priority: 'high',
        due_date: null,
        is_completed: true,
      },
      submitLabel: 'Update task',
    });

    expect(screen.getByLabelText(/title/i)).toHaveValue('Review API contract');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/priority/i)).toHaveValue('high');
    expect(screen.getByLabelText(/due date/i)).toHaveValue('');
    expect(screen.getByLabelText(/completed/i)).toBeChecked();
    expect(screen.getByRole('button', { name: 'Update task' })).toBeEnabled();
  });

  it('updates every controlled field', async () => {
    const user = userEvent.setup();
    renderTaskForm();

    await user.type(screen.getByLabelText(/title/i), 'Write tests');
    await user.type(screen.getByLabelText(/description/i), 'Cover the task form');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'low');
    fireEvent.change(screen.getByLabelText(/due date/i), {
      target: { value: '2026-10-31' },
    });
    await user.click(screen.getByLabelText(/completed/i));

    expect(screen.getByLabelText(/title/i)).toHaveValue('Write tests');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Cover the task form');
    expect(screen.getByLabelText(/priority/i)).toHaveValue('low');
    expect(screen.getByLabelText(/due date/i)).toHaveValue('2026-10-31');
    expect(screen.getByLabelText(/completed/i)).toBeChecked();
  });

  it('validates all rules defined by the API contract', () => {
    expect(
      validateTask({ title: '   ', priority: 'urgent', due_date: '2026-02-29' }),
    ).toEqual({
      title: 'Title is required.',
      priority: 'Choose a valid priority.',
      due_date: 'Enter a valid due date.',
    });

    expect(
      validateTask({ title: 'Valid', priority: 'medium', due_date: '2028-02-29' }),
    ).toEqual({});
  });

  it('does not submit invalid data, focuses the first invalid field, and clears its corrected error', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderTaskForm();
    const titleInput = screen.getByLabelText(/title/i);

    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(titleInput).toHaveFocus();
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');

    await user.type(titleInput, 'Corrected title');

    expect(screen.queryByText('Title is required.')).not.toBeInTheDocument();
    expect(titleInput).toHaveAttribute('aria-invalid', 'false');
  });

  it('passes a normalized task payload to onSubmit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderTaskForm({
      initialValues: {
        title: '  Prepare release  ',
        description: '   ',
        priority: 'medium',
        due_date: null,
        is_completed: false,
        id: 42,
        created_at: '2026-09-29T09:00:00.000Z',
      },
    });

    await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
    await user.click(screen.getByLabelText(/completed/i));
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Prepare release',
      description: null,
      priority: 'high',
      due_date: null,
      is_completed: true,
    });
  });

  it('renders field-level server errors', () => {
    renderTaskForm({
      serverErrors: {
        title: 'The title has already been taken.',
        due_date: 'The due date must be in the future.',
      },
    });

    expect(screen.getByText('The title has already been taken.')).toBeInTheDocument();
    expect(screen.getByText('The due date must be in the future.')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveAccessibleDescription(
      'The title has already been taken.',
    );
  });

  it('disables and guards submission while a request is pending', () => {
    const { onSubmit } = renderTaskForm({
      initialValues: { title: 'Valid task' },
      isSubmitting: true,
    });
    const submitButton = screen.getByRole('button', { name: 'Saving...' });

    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    fireEvent.submit(submitButton.closest('form'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel without submitting the form', async () => {
    const user = userEvent.setup();
    const { onCancel, onSubmit } = renderTaskForm({
      initialValues: { title: 'Valid task' },
    });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
