import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTask } from '../api';
import TaskCreatePage from './TaskCreatePage';

vi.mock('../api', () => ({
  createTask: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function TaskDetailsTestPage() {
  const { taskId } = useParams();
  return <h1>Task {taskId}</h1>;
}

function PageSwitcher() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/outside')} type="button">
      Leave create page
    </button>
  );
}

function renderCreatePage({ includeSwitcher = false } = {}) {
  render(
    <MemoryRouter initialEntries={['/tasks/new']}>
      {includeSwitcher ? <PageSwitcher /> : null}
      <Routes>
        <Route element={<TaskCreatePage />} path="/tasks/new" />
        <Route element={<TaskDetailsTestPage />} path="/tasks/:taskId" />
        <Route element={<h1>Tasks list</h1>} path="/tasks" />
        <Route element={<h1>Other page</h1>} path="/outside" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TaskCreatePage', () => {
  it('renders the task creation defaults', () => {
    renderCreatePage();

    expect(screen.getByRole('heading', { name: 'Create task' })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/priority/i)).toHaveValue('medium');
    expect(screen.getByLabelText(/due date/i)).toHaveValue('');
    expect(screen.getByLabelText(/completed/i)).not.toBeChecked();
  });

  it('submits the normalized payload and navigates to the created task', async () => {
    const user = userEvent.setup();
    createTask.mockResolvedValue({ id: 24 });
    renderCreatePage();

    await user.type(screen.getByLabelText(/title/i), '  Ship create page  ');
    await user.type(screen.getByLabelText(/description/i), '  Ready to ship  ');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
    fireEvent.change(screen.getByLabelText(/due date/i), {
      target: { value: '2026-10-15' },
    });
    await user.click(screen.getByLabelText(/completed/i));
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(createTask).toHaveBeenCalledTimes(1);
    expect(createTask).toHaveBeenCalledWith(
      {
        title: 'Ship create page',
        description: 'Ready to ship',
        priority: 'high',
        due_date: '2026-10-15',
        is_completed: true,
      },
      { signal: expect.any(AbortSignal) },
    );
    expect(
      await screen.findByRole('heading', { name: 'Task 24' }),
    ).toBeInTheDocument();
  });

  it('shows a general failure and preserves the entered values', async () => {
    const user = userEvent.setup();
    createTask.mockRejectedValue(new Error('Unable to connect to the API.'));
    renderCreatePage();

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Keep this draft');
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(
      await screen.findByRole('alert', { name: '' }),
    ).toHaveTextContent('Unable to connect to the API.');
    expect(titleInput).toHaveValue('Keep this draft');
    expect(screen.getByRole('button', { name: 'Save task' })).toBeEnabled();
  });

  it('renders normalized Laravel validation errors beside their fields', async () => {
    const user = userEvent.setup();
    createTask.mockRejectedValue({
      status: 422,
      data: {
        message: 'The given data was invalid.',
        errors: {
          title: ['The title has already been taken.'],
          due_date: ['', 'The due date is invalid.'],
          unknown_field: ['This field is not part of the task form.'],
        },
      },
    });
    renderCreatePage();

    await user.type(screen.getByLabelText(/title/i), 'Duplicate task');
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(
      await screen.findByText('The title has already been taken.'),
    ).toBeInTheDocument();
    expect(screen.getByText('The due date is invalid.')).toBeInTheDocument();
    expect(screen.queryByText(/not part of the task form/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveAccessibleDescription(
      'The title has already been taken.',
    );
  });

  it('prevents repeated submissions while creation is pending', async () => {
    const user = userEvent.setup();
    let resolveCreate;
    createTask.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    renderCreatePage();

    await user.type(screen.getByLabelText(/title/i), 'Submit once');
    await user.dblClick(screen.getByRole('button', { name: 'Save task' }));

    expect(createTask).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

    resolveCreate({ id: 25 });
    expect(
      await screen.findByRole('heading', { name: 'Task 25' }),
    ).toBeInTheDocument();
  });

  it('navigates back to the task list when cancelled', async () => {
    const user = userEvent.setup();
    renderCreatePage();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      await screen.findByRole('heading', { name: 'Tasks list' }),
    ).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
  });

  it('aborts a pending creation and does not navigate after leaving', async () => {
    const user = userEvent.setup();
    let resolveCreate;
    let requestSignal;
    createTask.mockImplementation(
      (_taskPayload, { signal }) =>
        new Promise((resolve) => {
          requestSignal = signal;
          resolveCreate = resolve;
        }),
    );
    renderCreatePage({ includeSwitcher: true });

    await user.type(screen.getByLabelText(/title/i), 'Pending task');
    await user.click(screen.getByRole('button', { name: 'Save task' }));
    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Leave create page' }));
    expect(await screen.findByRole('heading', { name: 'Other page' })).toBeInTheDocument();
    expect(requestSignal.aborted).toBe(true);

    await act(async () => {
      resolveCreate({ id: 99 });
    });
    expect(screen.getByRole('heading', { name: 'Other page' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Task 99' })).not.toBeInTheDocument();
  });
});
