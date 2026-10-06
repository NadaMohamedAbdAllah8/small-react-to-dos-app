import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { deleteTask, getTasks } from '../api';
import TaskList from '../components/TaskList';
import TasksEmptyState from '../components/TasksEmptyState';
import TasksToolbar from '../components/TasksToolbar';
import '../tasks.css';

function TasksListPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [requestVersion, setRequestVersion] = useState(0);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteControllerRef = useRef(null);

  useEffect(
    () => () => {
      deleteControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    const abortController = new AbortController();

    async function loadTasks() {
      setIsLoading(true);
      setRequestError(null);

      try {
        const loadedTasks = await getTasks({ signal: abortController.signal });

        if (!abortController.signal.aborted) {
          setTasks(loadedTasks);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setRequestError(error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      abortController.abort();
    };
  }, [requestVersion]);

  function handleRetry() {
    setRequestVersion((currentVersion) => currentVersion + 1);
  }

  function handleDeleteRequest(task) {
    setDeleteError('');
    setTaskToDelete(task);
  }

  function handleDeleteCancel() {
    if (isDeleting) {
      return;
    }

    setDeleteError('');
    setTaskToDelete(null);
  }

  async function handleDeleteConfirm() {
    if (!taskToDelete || isDeleting) {
      return;
    }

    const taskId = taskToDelete.id;
    const abortController = new AbortController();
    deleteControllerRef.current = abortController;
    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteTask(taskId, { signal: abortController.signal });

      if (abortController.signal.aborted) {
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
      setTaskToDelete(null);
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

  const normalizedSearchValue = searchValue.trim().toLocaleLowerCase();
  const filteredTasks = tasks.filter((task) =>
    task.title.toLocaleLowerCase().includes(normalizedSearchValue),
  );

  let taskContent;

  if (isLoading) {
    taskContent = (
      <div className="tasks-feedback" role="status">
        Loading tasks...
      </div>
    );
  } else if (requestError) {
    taskContent = (
      <div className="tasks-feedback tasks-feedback--error" role="alert">
        <p>{requestError.message || 'The tasks could not be loaded.'}</p>
        <button className="button" onClick={handleRetry} type="button">
          Retry
        </button>
      </div>
    );
  } else if (tasks.length === 0) {
    taskContent = <TasksEmptyState />;
  } else if (filteredTasks.length === 0) {
    taskContent = <TasksEmptyState searchValue={searchValue} />;
  } else {
    taskContent = (
      <TaskList onDelete={handleDeleteRequest} tasks={filteredTasks} />
    );
  }

  return (
    <main className="tasks-page">
      <div className="tasks-page__container">
        <header className="tasks-page__header">
          <div>
            <h1>Tasks</h1>
            <p>Organize and track your work.</p>
          </div>
          <Link className="button button--primary" to="/tasks/new">
            <span aria-hidden="true">＋</span> Add task
          </Link>
        </header>

        <TasksToolbar
          onSearchChange={setSearchValue}
          searchValue={searchValue}
        />

        {taskContent}

        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Delete"
          error={deleteError}
          isConfirming={isDeleting}
          isOpen={Boolean(taskToDelete)}
          message={
            taskToDelete
              ? `Delete "${taskToDelete.title}"? This action cannot be undone.`
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

export default TasksListPage;
