import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTasks } from '../api';
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
    taskContent = <TaskList tasks={filteredTasks} />;
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
      </div>
    </main>
  );
}

export default TasksListPage;
