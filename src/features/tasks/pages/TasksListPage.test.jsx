import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTasks } from '../api';
import TasksListPage from './TasksListPage';

vi.mock('../api', () => ({
  getTasks: vi.fn(),
}));

const tasks = [
  {
    id: 1,
    title: 'Prepare API documentation',
    description: 'Document the temporary task API.',
    priority: 'high',
    due_date: '2026-09-10',
    is_completed: false,
    created_at: '2026-09-08T09:00:00.000Z',
  },
  {
    id: 2,
    title: 'Review task wireframes',
    description: null,
    priority: 'medium',
    due_date: null,
    is_completed: false,
    created_at: '2026-09-07T13:30:00.000Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <TasksListPage />
    </MemoryRouter>,
  );
}

function createDeferredPromise() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

describe('TasksListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while tasks are pending', () => {
    const pendingRequest = createDeferredPromise();
    getTasks.mockReturnValue(pendingRequest.promise);

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading tasks...');
  });

  it('renders tasks returned by the API', async () => {
    getTasks.mockResolvedValue(tasks);

    renderPage();

    expect(
      await screen.findByRole('link', { name: 'Prepare API documentation' }),
    ).toHaveAttribute('href', '/tasks/1');
    expect(screen.getByText('Review task wireframes')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('shows the API empty state when no tasks exist', async () => {
    getTasks.mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'No tasks yet' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add your first task' })).toHaveAttribute(
      'href',
      '/tasks/new',
    );
  });

  it('shows a search empty state when no task title matches', async () => {
    const user = userEvent.setup();
    getTasks.mockResolvedValue(tasks);
    renderPage();
    await screen.findByText('Prepare API documentation');

    await user.type(screen.getByRole('searchbox', { name: 'Search tasks' }), 'missing');

    expect(
      screen.getByRole('heading', { name: 'No matching tasks' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No tasks match “missing”/)).toBeInTheDocument();
  });

  it('filters tasks locally by title', async () => {
    const user = userEvent.setup();
    getTasks.mockResolvedValue(tasks);
    renderPage();
    await screen.findByText('Prepare API documentation');

    await user.type(screen.getByRole('searchbox', { name: 'Search tasks' }), 'WIRE');

    expect(screen.getByText('Review task wireframes')).toBeInTheDocument();
    expect(screen.queryByText('Prepare API documentation')).not.toBeInTheDocument();
    expect(getTasks).toHaveBeenCalledTimes(1);
  });

  it('shows a request error and retry control', async () => {
    getTasks.mockRejectedValue(new Error('The tasks service is unavailable.'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The tasks service is unavailable.',
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('loads tasks again when retry is selected', async () => {
    const user = userEvent.setup();
    getTasks
      .mockRejectedValueOnce(new Error('The tasks service is unavailable.'))
      .mockResolvedValueOnce(tasks);

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Prepare API documentation')).toBeInTheDocument();
    expect(getTasks).toHaveBeenCalledTimes(2);
  });
});
