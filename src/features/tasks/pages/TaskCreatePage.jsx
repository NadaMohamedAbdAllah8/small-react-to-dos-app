import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createTask } from '../api';
import TaskForm from '../components/TaskForm';
import { normalizeTaskValidationErrors } from '../errors';
import '../tasks.css';

const creationDefaults = {
  title: '',
  description: '',
  priority: 'medium',
  due_date: '',
  is_completed: false,
};

function TaskCreatePage() {
  const navigate = useNavigate();
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

  async function handleCreate(taskPayload) {
    if (isSubmitting) {
      return;
    }

    const abortController = new AbortController();
    mutationControllerRef.current = abortController;
    setIsSubmitting(true);
    setRequestError('');
    setServerErrors({});

    try {
      const createdTask = await createTask(taskPayload, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      navigate(`/tasks/${createdTask.id}`);
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      const validationErrors = normalizeTaskValidationErrors(error);

      if (Object.keys(validationErrors).length > 0) {
        setServerErrors(validationErrors);
      } else {
        setRequestError(
          error?.message || 'The task could not be created. Please try again.',
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
    navigate('/tasks');
  }

  return (
    <main className="tasks-page">
      <div className="tasks-page__container tasks-page__container--form">
        <Link className="task-form-page__back" to="/tasks">
          <span aria-hidden="true">←</span> Tasks
        </Link>

        <header className="task-form-page__header">
          <h1>Create task</h1>
          <p>Add a task and choose when it should be completed.</p>
        </header>

        {requestError ? (
          <div className="task-form__request-error" role="alert">
            {requestError}
          </div>
        ) : null}

        <TaskForm
          initialValues={creationDefaults}
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          onSubmit={handleCreate}
          serverErrors={serverErrors}
          submitLabel="Save task"
        />
      </div>
    </main>
  );
}

export default TaskCreatePage;
