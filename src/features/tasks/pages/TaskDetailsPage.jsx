import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTask } from '../api';
import PriorityBadge from '../components/PriorityBadge';
import '../tasks.css';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

function formatDueDate(value) {
  if (!value) {
    return 'No due date';
  }

  const normalizedValue = value.length === 10 ? `${value}T00:00:00Z` : value;
  return dateFormatter.format(new Date(normalizedValue));
}

function formatCreatedDate(value) {
  const date = new Date(value);
  return `${dateFormatter.format(date)} at ${timeFormatter.format(date)}`;
}

function TaskDetailsPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadTask() {
      setTask(null);
      setIsLoading(true);
      setLoadError(null);
      setIsNotFound(false);

      try {
        const loadedTask = await getTask(taskId, {
          signal: abortController.signal,
        });

        if (!abortController.signal.aborted) {
          setTask(loadedTask);
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        if (error?.status === 404) {
          setIsNotFound(true);
        } else {
          setLoadError(error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadTask();

    return () => {
      abortController.abort();
    };
  }, [requestVersion, taskId]);

  function handleRetry() {
    setRequestVersion((currentVersion) => currentVersion + 1);
  }

  let content;

  if (isLoading) {
    content = (
      <section className="tasks-feedback" role="status">
        Loading task...
      </section>
    );
  } else if (isNotFound) {
    content = (
      <section className="tasks-feedback" role="status">
        <h1>Task not found</h1>
        <p>The requested task does not exist.</p>
        <Link className="button button--primary" to="/tasks">
          Back to tasks
        </Link>
      </section>
    );
  } else if (loadError) {
    content = (
      <section className="tasks-feedback tasks-feedback--error" role="alert">
        <h1>Unable to load task</h1>
        <p>{loadError.message || 'The task could not be loaded.'}</p>
        <button className="button" onClick={handleRetry} type="button">
          Retry
        </button>
      </section>
    );
  } else {
    const statusLabel = task.is_completed ? 'Completed' : 'In progress';
    const statusDescription = task.is_completed ? 'Completed' : 'Not completed';

    content = (
      <>
        <Link className="task-form-page__back" to="/tasks">
          <span aria-hidden="true">←</span> Back to tasks
        </Link>

        <header className="task-details__header">
          <div>
            <h1>{task.title}</h1>
            <span
              className={
                task.is_completed
                  ? 'task-status task-status--completed'
                  : 'task-status'
              }
            >
              {statusLabel}
            </span>
          </div>
          <div className="task-details__actions">
            <Link className="button" to={`/tasks/${taskId}/edit`}>
              Edit task
            </Link>
          </div>
        </header>

        <section className="task-details__description">
          <h2>Description</h2>
          <p>{task.description || 'No description provided'}</p>
        </section>

        <dl className="task-details__metadata">
          <div className="task-details__metadata-item">
            <dt>Priority</dt>
            <dd>
              <PriorityBadge priority={task.priority} />
            </dd>
          </div>
          <div className="task-details__metadata-item">
            <dt>Due date</dt>
            <dd>{formatDueDate(task.due_date)}</dd>
          </div>
          <div className="task-details__metadata-item">
            <dt>Created</dt>
            <dd>{formatCreatedDate(task.created_at)}</dd>
          </div>
          <div className="task-details__metadata-item">
            <dt>Status</dt>
            <dd>{statusDescription}</dd>
          </div>
        </dl>
      </>
    );
  }

  return (
    <main className="tasks-page">
      <div className="tasks-page__container tasks-page__container--form">
        {content}
      </div>
    </main>
  );
}

export default TaskDetailsPage;
