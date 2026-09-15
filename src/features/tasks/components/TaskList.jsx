import TaskListItem from './TaskListItem';

function TaskList({ tasks }) {
  return (
    <div className="task-list-wrapper">
      <table className="task-list">
        <caption className="visually-hidden">Tasks</caption>
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col">Priority</th>
            <th scope="col">Created</th>
            <th scope="col">Due</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TaskList;
