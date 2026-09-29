import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTask } from '../api';
import TaskDetailsPage from './TaskDetailsPage';

vi.mock('../api', () => ({
  getTask: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const loadedTask = {
  id: 42,
  title: 'Prepare API documentation',
  description: 'Document the task endpoints and response shapes.',
  priority: 'high',
  due_date: '2026-09-10',
  is_completed: true,
  created_at: '2026-09-08T09:00:00.000Z',
};

function TaskSwitcher() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/tasks/43')} type="button">
      View task 43
    </button>
  );
}

function renderDetailsPage({ includeSwitcher = false } = {}) {
  render(
    <MemoryRouter initialEntries={['/tasks/42']}>
      {includeSwitcher ? <TaskSwitcher /> : null}
      <Routes>
        <Route element={<TaskDetailsPage />} path="/tasks/:taskId" />
        <Route element={<h1>Tasks list</h1>} path="/tasks" />
        <Route element={<h1>Task editor</h1>} path="/tasks/:taskId/edit" />
        <Route element={<h1>Other page</h1>} path="/outside" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TaskDetailsPage', () => {
  it('shows a loading state while the task request is pending', () => {
    getTask.mockReturnValue(new Promise(() => {}));

    renderDetailsPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading task...');
    expect(screen.queryByRole('heading', { name: loadedTask.title })).not.toBeInTheDocument();
  });

  it('loads the route task and renders its details', async () => {
    getTask.mockResolvedValue(loadedTask);

    renderDetailsPage();

    expect(
      await screen.findByRole('heading', { name: loadedTask.title }),
    ).toBeInTheDocument();
    expect(getTask).toHaveBeenCalledWith('42', {
      signal: expect.any(AbortSignal),
    });
    expect(screen.getByText(loadedTask.description)).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getAllByText('Completed')).toHaveLength(2);
    expect(screen.getByText('Sep 10, 2026')).toBeInTheDocument();
    expect(screen.getByText(/Sep 08, 2026 at 09:00 AM/)).toBeInTheDocument();
  });

  it('renders clear fallbacks for missing optional values', async () => {
    getTask.mockResolvedValue({
      ...loadedTask,
      description: null,
      due_date: null,
      is_completed: false,
    });

    renderDetailsPage();

    expect(await screen.findByText('No description provided')).toBeInTheDocument();
    expect(screen.getByText('No due date')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Not completed')).toBeInTheDocument();
  });

  it('navigates back to the task list', async () => {
    const user = userEvent.setup();
    getTask.mockResolvedValue(loadedTask);
    renderDetailsPage();

    await screen.findByRole('heading', { name: loadedTask.title });
    await user.click(screen.getByRole('link', { name: 'Back to tasks' }));

    expect(
      await screen.findByRole('heading', { name: 'Tasks list' }),
    ).toBeInTheDocument();
  });

  it('navigates to the current task edit route', async () => {
    const user = userEvent.setup();
    getTask.mockResolvedValue(loadedTask);
    renderDetailsPage();

    await screen.findByRole('heading', { name: loadedTask.title });
    await user.click(screen.getByRole('link', { name: 'Edit task' }));

    expect(
      await screen.findByRole('heading', { name: 'Task editor' }),
    ).toBeInTheDocument();
  });

  it('shows a specific not-found state for a 404 response', async () => {
    getTask.mockRejectedValue({ status: 404 });

    renderDetailsPage();

    expect(
      await screen.findByRole('heading', { name: 'Task not found' }),
    ).toBeInTheDocument();
    expect(screen.getByText('The requested task does not exist.')).toBeInTheDocument();
  });

  it('shows a retryable state for a general API error', async () => {
    getTask.mockRejectedValue(new Error('Unable to connect to the API.'));

    renderDetailsPage();

    expect(
      await screen.findByRole('heading', { name: 'Unable to load task' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Unable to connect to the API.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('retries loading after an API error', async () => {
    const user = userEvent.setup();
    getTask
      .mockRejectedValueOnce(new Error('Temporary API failure.'))
      .mockResolvedValueOnce(loadedTask);
    renderDetailsPage();

    await screen.findByText('Temporary API failure.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', { name: loadedTask.title }),
    ).toBeInTheDocument();
    expect(getTask).toHaveBeenCalledTimes(2);
  });

  it('aborts an obsolete request and ignores its late response', async () => {
    const user = userEvent.setup();
    const requests = new Map();
    getTask.mockImplementation(
      (taskId, { signal }) =>
        new Promise((resolve) => {
          requests.set(taskId, { resolve, signal });
        }),
    );
    renderDetailsPage({ includeSwitcher: true });

    await waitFor(() => expect(requests.has('42')).toBe(true));
    await user.click(screen.getByRole('button', { name: 'View task 43' }));
    await waitFor(() => expect(requests.has('43')).toBe(true));

    expect(requests.get('42').signal.aborted).toBe(true);

    await act(async () => {
      requests.get('43').resolve({
        ...loadedTask,
        id: 43,
        title: 'Current task',
      });
    });
    expect(
      await screen.findByRole('heading', { name: 'Current task' }),
    ).toBeInTheDocument();

    await act(async () => {
      requests.get('42').resolve({ ...loadedTask, title: 'Stale task' });
    });
    expect(screen.queryByText('Stale task')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Current task' })).toBeInTheDocument();
  });
});
