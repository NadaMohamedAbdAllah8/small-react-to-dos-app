import { Link } from 'react-router-dom';
import { formatTaskListDate } from '../formatters';
import PriorityBadge from './PriorityBadge';

function TaskListItem({ task, onDelete }) {
  const completionLabel = task.is_completed
    ? `${task.title} is completed`
    : `${task.title} is not completed`;

  return (
    <tr className={task.is_completed ? 'task-row task-row--completed' : 'task-row'}>
      <td className="task-row__task">
        <input
          aria-label={completionLabel}
          checked={task.is_completed}
          className="task-row__checkbox"
          disabled
          type="checkbox"
        />
        <div className="task-row__copy">
          <Link className="task-row__title" to={`/tasks/${task.id}`}>
            {task.title}
          </Link>
          {task.description ? (
            <p className="task-row__description">{task.description}</p>
          ) : null}
        </div>
      </td>
      <td data-label="Priority">
        <PriorityBadge priority={task.priority} />
      </td>
      <td data-label="Created">{formatTaskListDate(task.created_at)}</td>
      <td data-label="Due">{formatTaskListDate(task.due_date)}</td>
      <td className="task-row__actions" data-label="Actions">
        <Link
          aria-label={`View ${task.title}`}
          className="task-row__action-link"
          to={`/tasks/${task.id}`}
        >
          View
        </Link>
        <button
          aria-label={`Delete ${task.title}`}
          className="task-row__action-link task-row__action-link--danger"
          onClick={() => onDelete(task)}
          type="button"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default TaskListItem;
