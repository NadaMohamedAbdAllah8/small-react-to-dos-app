import {
  act,
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
import { describe, expect, it, vi } from 'vitest';
import { getTask, updateTask } from '../api';
import TaskEditPage from './TaskEditPage';

vi.mock('../api', () => ({
  getTask: vi.fn(),
  updateTask: vi.fn(),
}));

const loadedTask = {
  id: 7,
  title: 'Review edit flow',
  description: 'Verify the existing task values.',
  priority: 'medium',
  due_date: '2026-10-20',
  is_completed: false,
  created_at: '2026-09-29T08:00:00.000Z',
};

function TaskDetailsTestPage() {
  const { taskId } = useParams();
  return <h1>Task {taskId}</h1>;
}

function TaskSwitcher() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/tasks/2/edit')} type="button">
      Edit task 2
    </button>
  );
}

function PageSwitcher() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/outside')} type="button">
      Leave edit page
    </button>
  );
}

function renderEditPage({ includeSwitcher = false, includePageSwitcher = false } = {}) {
  render(
    <MemoryRouter initialEntries={['/tasks/7/edit']}>
      {includeSwitcher ? <TaskSwitcher /> : null}
      {includePageSwitcher ? <PageSwitcher /> : null}
      <Routes>
        <Route element={<TaskEditPage />} path="/tasks/:taskId/edit" />
        <Route element={<TaskDetailsTestPage />} path="/tasks/:taskId" />
        <Route element={<h1>Tasks list</h1>} path="/tasks" />
        <Route element={<h1>Other page</h1>} path="/outside" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TaskEditPage', () => {
  it('shows a loading state before the task resolves', () => {
    getTask.mockReturnValue(new Promise(() => {}));

    renderEditPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading task...');
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('loads the task and prefills the form', async () => {
    getTask.mockResolvedValue(loadedTask);

    renderEditPage();

    expect(await screen.findByLabelText(/title/i)).toHaveValue('Review edit flow');
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      'Verify the existing task values.',
    );
    expect(screen.getByLabelText(/priority/i)).toHaveValue('medium');
    expect(screen.getByLabelText(/due date/i)).toHaveValue('2026-10-20');
    expect(screen.getByLabelText(/completed/i)).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Update task' })).toBeEnabled();
  });

  it('shows a not-found state for a missing task', async () => {
    getTask.mockRejectedValue({ status: 404 });

    renderEditPage();

    expect(
      await screen.findByRole('heading', { name: 'Task not found' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it('shows a loading error and retries the request', async () => {
    const user = userEvent.setup();
    getTask
      .mockRejectedValueOnce(new Error('Unable to connect to the API.'))
      .mockResolvedValueOnce(loadedTask);

    renderEditPage();

    expect(
      await screen.findByRole('heading', { name: 'Unable to load task' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Unable to connect to the API.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByLabelText(/title/i)).toHaveValue('Review edit flow');
    expect(getTask).toHaveBeenCalledTimes(2);
  });

  it('patches the editable payload and navigates to task details', async () => {
    const user = userEvent.setup();
    getTask.mockResolvedValue(loadedTask);
    updateTask.mockResolvedValue({ ...loadedTask, title: 'Updated title' });
    renderEditPage();

    const titleInput = await screen.findByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, '  Updated title  ');
    await user.clear(screen.getByLabelText(/description/i));
    await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
    fireEvent.change(screen.getByLabelText(/due date/i), {
      target: { value: '2026-11-01' },
    });
    await user.click(screen.getByLabelText(/completed/i));
    await user.click(screen.getByRole('button', { name: 'Update task' }));

    expect(updateTask).toHaveBeenCalledWith(
      '7',
      {
        title: 'Updated title',
        description: null,
        priority: 'high',
        due_date: '2026-11-01',
        is_completed: true,
      },
      { signal: expect.any(AbortSignal) },
    );
    expect(
      await screen.findByRole('heading', { name: 'Task 7' }),
    ).toBeInTheDocument();
  });

  it('shows an update failure and preserves the edited draft', async () => {
    const user = userEvent.setup();
    getTask.mockResolvedValue(loadedTask);
    updateTask.mockRejectedValue(new Error('The update request failed.'));
    renderEditPage();

    const titleInput = await screen.findByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Keep edited title');
    await user.click(screen.getByRole('button', { name: 'Update task' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The update request failed.',
    );
    expect(titleInput).toHaveValue('Keep edited title');
    expect(screen.getByRole('button', { name: 'Update task' })).toBeEnabled();
  });

  it('shows the fallback update failure when no message is available', async () => {
    const user = userEvent.setup();
    getTask.mockResolvedValue(loadedTask);
    updateTask.mockRejectedValue({});
    renderEditPage();

    await screen.findByLabelText(/title/i);
    await user.click(screen.getByRole('button', { name: 'Update task' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The task could not be updated. Please try again.',
    );
  });

  it('renders normalized Laravel validation errors', async () => {
    const user = userEvent.setup();
    getTask.mockResolvedValue(loadedTask);
    updateTask.mockRejectedValue({
      status: 422,
      data: {
        errors: {
          title: ['The title has already been taken.'],
          priority: ['The selected priority is invalid.'],
        },
      },
    });
    renderEditPage();

    await screen.findByLabelText(/title/i);
    await user.click(screen.getByRole('button', { name: 'Update task' }));

    expect(
      await screen.findByText('The title has already been taken.'),
    ).toBeInTheDocument();
    expect(screen.getByText('The selected priority is invalid.')).toBeInTheDocument();
  });

  it('prevents repeated updates while the request is pending', async () => {
    const user = userEvent.setup();
    let resolveUpdate;
    getTask.mockResolvedValue(loadedTask);
    updateTask.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    renderEditPage();

    await screen.findByLabelText(/title/i);
    await user.dblClick(screen.getByRole('button', { name: 'Update task' }));

    expect(updateTask).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

    resolveUpdate(loadedTask);
    expect(
      await screen.findByRole('heading', { name: 'Task 7' }),
    ).toBeInTheDocument();
  });

  it('navigates to task details when cancelled', async () => {
    const user = userEvent.setup();
    getTask.mockResolvedValue(loadedTask);
    renderEditPage();

    await screen.findByLabelText(/title/i);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      await screen.findByRole('heading', { name: 'Task 7' }),
    ).toBeInTheDocument();
    expect(updateTask).not.toHaveBeenCalled();
  });

  it('aborts an obsolete load and ignores its eventual result', async () => {
    const user = userEvent.setup();
    const requests = new Map();
    getTask.mockImplementation(
      (taskId, { signal }) =>
        new Promise((resolve) => {
          requests.set(taskId, { resolve, signal });
        }),
    );
    renderEditPage({ includeSwitcher: true });

    await waitFor(() => expect(requests.has('7')).toBe(true));
    await user.click(screen.getByRole('button', { name: 'Edit task 2' }));
    await waitFor(() => expect(requests.has('2')).toBe(true));

    expect(requests.get('7').signal.aborted).toBe(true);

    await act(async () => {
      requests.get('2').resolve({ ...loadedTask, id: 2, title: 'Current task' });
    });
    expect(await screen.findByLabelText(/title/i)).toHaveValue('Current task');

    await act(async () => {
      requests.get('7').resolve({ ...loadedTask, title: 'Stale task' });
    });
    expect(screen.getByLabelText(/title/i)).toHaveValue('Current task');
  });

  it('aborts a pending update and does not navigate after leaving', async () => {
    const user = userEvent.setup();
    let resolveUpdate;
    let requestSignal;
    getTask.mockResolvedValue(loadedTask);
    updateTask.mockImplementation(
      (_taskId, _taskPayload, { signal }) =>
        new Promise((resolve) => {
          requestSignal = signal;
          resolveUpdate = resolve;
        }),
    );
    renderEditPage({ includePageSwitcher: true });

    await screen.findByLabelText(/title/i);
    await user.click(screen.getByRole('button', { name: 'Update task' }));
    await waitFor(() => expect(updateTask).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Leave edit page' }));
    expect(await screen.findByRole('heading', { name: 'Other page' })).toBeInTheDocument();
    expect(requestSignal.aborted).toBe(true);

    await act(async () => {
      resolveUpdate(loadedTask);
    });
    expect(screen.getByRole('heading', { name: 'Other page' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Task 7' })).not.toBeInTheDocument();
  });

  it('aborts a pending update when switching to another task', async () => {
    const user = userEvent.setup();
    let resolveUpdate;
    let requestSignal;
    getTask.mockImplementation((taskId) =>
      Promise.resolve({
        ...loadedTask,
        id: Number(taskId),
        title: taskId === '7' ? loadedTask.title : 'Current task',
      }),
    );
    updateTask.mockImplementation(
      (_taskId, _taskPayload, { signal }) =>
        new Promise((resolve) => {
          requestSignal = signal;
          resolveUpdate = resolve;
        }),
    );
    renderEditPage({ includeSwitcher: true });

    await screen.findByLabelText(/title/i);
    await user.click(screen.getByRole('button', { name: 'Update task' }));
    await user.click(screen.getByRole('button', { name: 'Edit task 2' }));

    expect(requestSignal.aborted).toBe(true);
    expect(await screen.findByLabelText(/title/i)).toHaveValue('Current task');

    await act(async () => {
      resolveUpdate(loadedTask);
    });
    expect(screen.getByLabelText(/title/i)).toHaveValue('Current task');
  });
});
