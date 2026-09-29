import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTask, updateTask } from '../api';
import TaskForm from '../components/TaskForm';
import { normalizeTaskValidationErrors } from '../errors';
import '../tasks.css';

function TaskEditPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [serverErrors, setServerErrors] = useState({});
  const mutationControllerRef = useRef(null);

  useEffect(
    () => () => {
      mutationControllerRef.current?.abort();
    },
    [],
  );

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

  async function handleUpdate(taskPayload) {
    if (isSubmitting) {
      return;
    }

    const abortController = new AbortController();
    mutationControllerRef.current = abortController;
    setIsSubmitting(true);
    setRequestError('');
    setServerErrors({});

    try {
      await updateTask(taskId, taskPayload, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      navigate(`/tasks/${taskId}`);
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      const validationErrors = normalizeTaskValidationErrors(error);

      if (Object.keys(validationErrors).length > 0) {
        setServerErrors(validationErrors);
      } else {
        setRequestError(
          error?.message || 'The task could not be updated. Please try again.',
        );
      }
    } finally {
      if (
        mutationControllerRef.current === abortController &&
        !abortController.signal.aborted
      ) {
        mutationControllerRef.current = null;
        setIsSubmitting(false);
      }
    }
  }

  function handleCancel() {
    navigate(`/tasks/${taskId}`);
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
    content = (
      <>
        <Link className="task-form-page__back" to={`/tasks/${taskId}`}>
          <span aria-hidden="true">←</span> Task details
        </Link>

        <header className="task-form-page__header">
          <h1>Edit task</h1>
          <p>Update the task details and save your changes.</p>
        </header>

        {requestError ? (
          <div className="task-form__request-error" role="alert">
            {requestError}
          </div>
        ) : null}

        <TaskForm
          initialValues={task}
          isSubmitting={isSubmitting}
          key={task.id}
          onCancel={handleCancel}
          onSubmit={handleUpdate}
          serverErrors={serverErrors}
          submitLabel="Update task"
        />
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

export default TaskEditPage;
