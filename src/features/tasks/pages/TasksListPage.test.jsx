import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteTask, getTasks } from '../api';
import TasksListPage from './TasksListPage';

vi.mock('../api', () => ({
  deleteTask: vi.fn(),
  getTasks: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const tasks = [
  {
    id: 1,
    title: 'Alpha task',
    description: 'First task',
    priority: 'high',
    due_date: '2026-10-10',
    is_completed: false,
    created_at: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 2,
    title: 'Beta task',
    description: 'Second task',
    priority: 'low',
    due_date: null,
    is_completed: false,
    created_at: '2026-09-02T08:00:00.000Z',
  },
];

function TaskDetailsTestPage() {
  const { taskId } = useParams();
  return <h1>Task {taskId}</h1>;
}

function PageSwitcher() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/outside')} type="button">
      Leave task list
    </button>
  );
}

function renderListPage(
  loadedTasks = tasks,
  { includeSwitcher = false, mockLoad = true } = {},
) {
  if (mockLoad) {
    getTasks.mockResolvedValue(loadedTasks);
  }

  render(
    <MemoryRouter initialEntries={['/tasks']}>
      {includeSwitcher ? <PageSwitcher /> : null}
      <Routes>
        <Route element={<TasksListPage />} path="/tasks" />
        <Route element={<TaskDetailsTestPage />} path="/tasks/:taskId" />
        <Route element={<h1>Other page</h1>} path="/outside" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TasksListPage loading and navigation', () => {
  it('shows a loading state while the collection request is pending', () => {
    getTasks.mockReturnValue(new Promise(() => {}));

    renderListPage(undefined, { mockLoad: false });

    expect(screen.getByRole('status')).toHaveTextContent('Loading tasks...');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders loaded tasks with priority and completion status', async () => {
    renderListPage();

    expect(
      await screen.findByRole('link', { name: 'Alpha task' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beta task' })).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Alpha task is not completed' }),
    ).not.toBeChecked();
  });

  it('renders the empty state for an empty collection', async () => {
    renderListPage([]);

    expect(
      await screen.findByRole('heading', { name: 'No tasks yet' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add your first task' })).toHaveAttribute(
      'href',
      '/tasks/new',
    );
  });

  it('shows a load error and retries the request', async () => {
    const user = userEvent.setup();
    getTasks
      .mockRejectedValueOnce(new Error('Unable to connect to the API.'))
      .mockResolvedValueOnce(tasks);
    renderListPage(undefined, { mockLoad: false });

    expect(
      await screen.findByText('Unable to connect to the API.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('link', { name: 'Alpha task' }),
    ).toBeInTheDocument();
    expect(getTasks).toHaveBeenCalledTimes(2);
  });

  it('filters tasks and reports when no task matches', async () => {
    const user = userEvent.setup();
    renderListPage();
    const searchInput = await screen.findByRole('searchbox', {
      name: 'Search tasks',
    });

    await user.type(searchInput, 'alpha');
    expect(screen.getByRole('link', { name: 'Alpha task' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Beta task' })).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'missing');
    expect(
      screen.getByRole('heading', { name: 'No matching tasks' }),
    ).toBeInTheDocument();
  });

  it('navigates to task details without a page reload', async () => {
    const user = userEvent.setup();
    renderListPage();

    await user.click(await screen.findByRole('link', { name: 'View Alpha task' }));

    expect(
      await screen.findByRole('heading', { name: 'Task 1' }),
    ).toBeInTheDocument();
  });

  it('aborts an obsolete collection request and ignores its late result', async () => {
    const user = userEvent.setup();
    let resolveTasks;
    let requestSignal;
    getTasks.mockImplementation(
      ({ signal }) =>
        new Promise((resolve) => {
          requestSignal = signal;
          resolveTasks = resolve;
        }),
    );
    renderListPage(undefined, { includeSwitcher: true, mockLoad: false });

    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Leave task list' }));
    expect(await screen.findByRole('heading', { name: 'Other page' })).toBeInTheDocument();
    expect(requestSignal.aborted).toBe(true);

    await act(async () => {
      resolveTasks(tasks);
    });
    expect(screen.getByRole('heading', { name: 'Other page' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Alpha task' })).not.toBeInTheDocument();
  });
});

describe('TasksListPage deletion', () => {
  it('opens the confirmation dialog for the selected task', async () => {
    const user = userEvent.setup();
    renderListPage();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Alpha task' }),
    );

    expect(
      screen.getByRole('dialog', { name: 'Delete task' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Delete "Alpha task"/)).toBeInTheDocument();
  });

  it('cancels without deleting the task', async () => {
    const user = userEvent.setup();
    renderListPage();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Alpha task' }),
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteTask).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Alpha task' })).toBeInTheDocument();
  });

  it('waits for success, prevents repeated requests, removes the task, and closes', async () => {
    const user = userEvent.setup();
    let resolveDelete;
    deleteTask.mockReturnValue(
      new Promise((resolve) => {
        resolveDelete = resolve;
      }),
    );
    renderListPage();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Alpha task' }),
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteTask).toHaveBeenCalledTimes(1);
    expect(deleteTask).toHaveBeenCalledWith(1);
    expect(screen.getByRole('link', { name: 'Alpha task' })).toBeInTheDocument();
    const pendingButton = screen.getByRole('button', { name: 'Deleting...' });
    expect(pendingButton).toBeDisabled();

    await user.click(pendingButton);
    expect(deleteTask).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveDelete(null);
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Alpha task' }),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beta task' })).toBeInTheDocument();
  });

  it('keeps the task and dialog visible when deletion fails', async () => {
    const user = userEvent.setup();
    deleteTask.mockRejectedValue(new Error('The deletion request failed.'));
    renderListPage();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Alpha task' }),
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByText('The deletion request failed.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alpha task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });

  it('preserves search and shows no matches after deleting its final visible task', async () => {
    const user = userEvent.setup();
    deleteTask.mockResolvedValue(null);
    renderListPage();

    const searchInput = await screen.findByRole('searchbox', {
      name: 'Search tasks',
    });
    await user.type(searchInput, 'Beta');
    await user.click(screen.getByRole('button', { name: 'Delete Beta task' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByRole('heading', { name: 'No matching tasks' }),
    ).toBeInTheDocument();
    expect(searchInput).toHaveValue('Beta');
    expect(deleteTask).toHaveBeenCalledWith(2);
    expect(getTasks).toHaveBeenCalledTimes(1);
  });
});
