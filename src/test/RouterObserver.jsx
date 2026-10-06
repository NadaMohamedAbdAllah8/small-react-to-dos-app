import { useLocation, useNavigate } from 'react-router-dom';

function RouterObserver({ includeBackControl }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <span aria-label="Current route">{location.pathname}</span>
      {includeBackControl ? (
        <button onClick={() => navigate(-1)} type="button">
          Go back in history
        </button>
      ) : null}
    </>
  );
}

export default RouterObserver;
