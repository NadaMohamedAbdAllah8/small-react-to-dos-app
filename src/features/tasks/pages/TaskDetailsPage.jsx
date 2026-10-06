import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { deleteTask, getTask } from '../api';
import PriorityBadge from '../components/PriorityBadge';
import { formatTaskCreatedDate, formatTaskDueDate } from '../formatters';
import '../tasks.css';

function TaskDetailsPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteControllerRef = useRef(null);

  useEffect(
    () => () => {
      deleteControllerRef.current?.abort();
    },
    [taskId],
  );

  useEffect(() => {
    const abortController = new AbortController();

    async function loadTask() {
      setTask(null);
      setIsLoading(true);
      setLoadError(null);
      setIsNotFound(false);
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
      setDeleteError('');

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

  function handleDeleteRequest() {
    setDeleteError('');
    setIsDeleteDialogOpen(true);
  }

  function handleDeleteCancel() {
    if (isDeleting) {
      return;
    }

    setDeleteError('');
    setIsDeleteDialogOpen(false);
  }

  async function handleDeleteConfirm() {
    if (!task || isDeleting) {
      return;
    }

    const abortController = new AbortController();
    deleteControllerRef.current = abortController;
    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteTask(taskId, { signal: abortController.signal });

      if (abortController.signal.aborted) {
        return;
      }

      setIsDeleteDialogOpen(false);
      navigate('/tasks');
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      setDeleteError(
        error?.message || 'The task could not be deleted. Please try again.',
      );
    } finally {
      if (
        deleteControllerRef.current === abortController &&
        !abortController.signal.aborted
      ) {
        deleteControllerRef.current = null;
        setIsDeleting(false);
      }
    }
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
            <button
              className="button button--danger"
              onClick={handleDeleteRequest}
              type="button"
            >
              Delete
            </button>
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
            <dd>{formatTaskDueDate(task.due_date)}</dd>
          </div>
          <div className="task-details__metadata-item">
            <dt>Created</dt>
            <dd>{formatTaskCreatedDate(task.created_at)}</dd>
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
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Delete"
          error={deleteError}
          isConfirming={isDeleting}
          isOpen={isDeleteDialogOpen}
          message={
            task
              ? `Delete "${task.title}"? This action cannot be undone.`
              : ''
          }
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete task"
        />
      </div>
    </main>
  );
}

export default TaskDetailsPage;
