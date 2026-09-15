function TasksToolbar({ searchValue, onSearchChange }) {
  function handleSearchChange(event) {
    onSearchChange(event.target.value);
  }

  return (
    <div className="tasks-toolbar">
      <div className="tasks-toolbar__search">
        <label className="visually-hidden" htmlFor="task-search">
          Search tasks
        </label>
        <input
          id="task-search"
          onChange={handleSearchChange}
          placeholder="Search tasks..."
          type="search"
          value={searchValue}
        />
      </div>

      <label className="visually-hidden" htmlFor="task-status-filter">
        Filter tasks by status
      </label>
      <select disabled id="task-status-filter" value="all">
        <option value="all">Status: All</option>
      </select>

      <label className="visually-hidden" htmlFor="task-priority-filter">
        Filter tasks by priority
      </label>
      <select disabled id="task-priority-filter" value="all">
        <option value="all">Priority: All</option>
      </select>
    </div>
  );
}

export default TasksToolbar;
