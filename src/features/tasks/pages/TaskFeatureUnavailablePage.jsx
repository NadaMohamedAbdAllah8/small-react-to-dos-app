import { Link } from 'react-router-dom';
import '../tasks.css';

function TaskFeatureUnavailablePage() {
  return (
    <main className="tasks-page">
      <div className="tasks-page__container">
        <section className="tasks-feedback" role="status">
          <h1>Feature not available yet</h1>
          <p>Task creation and task details are not implemented yet.</p>
          <Link className="button button--primary" to="/tasks">
            Back to tasks
          </Link>
        </section>
      </div>
    </main>
  );
}

export default TaskFeatureUnavailablePage;
