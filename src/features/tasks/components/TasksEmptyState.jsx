import { Link } from 'react-router-dom';

function TasksEmptyState({ searchValue = '' }) {
  const hasSearchValue = searchValue.trim().length > 0;

  if (hasSearchValue) {
    return (
      <section className="tasks-empty-state" role="status">
        <h2>No matching tasks</h2>
        <p>No tasks match “{searchValue.trim()}”. Try a different search.</p>
      </section>
    );
  }

  return (
    <section className="tasks-empty-state" role="status">
      <h2>No tasks yet</h2>
      <p>Create your first task to start tracking your work.</p>
      <Link className="button button--primary" to="/tasks/new">
        Add your first task
      </Link>
    </section>
  );
}

export default TasksEmptyState;
