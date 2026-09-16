function PriorityBadge({ priority }) {
  return (
    <span className={`priority-badge priority-badge--${priority}`}>
      {priority.toUpperCase()}
    </span>
  );
}

export default PriorityBadge;
