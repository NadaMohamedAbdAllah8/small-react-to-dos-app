import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <main className="tasks-page">
      <div className="tasks-page__container">
        <section className="tasks-feedback" role="status">
          <h1>Page not found</h1>
          <p>The page you requested does not exist.</p>
          <Link className="button button--primary" to="/tasks">
            Back to tasks
          </Link>
        </section>
      </div>
    </main>
  );
}

export default NotFoundPage;
