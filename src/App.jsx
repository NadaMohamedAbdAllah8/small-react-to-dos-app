import { Navigate, Route, Routes } from 'react-router-dom';
import NotFoundPage from './components/NotFoundPage';
import TaskCreatePage from './features/tasks/pages/TaskCreatePage';
import TaskDetailsPage from './features/tasks/pages/TaskDetailsPage';
import TaskEditPage from './features/tasks/pages/TaskEditPage';
import TasksListPage from './features/tasks/pages/TasksListPage';

function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/tasks" />} path="/" />
      <Route element={<TasksListPage />} path="/tasks" />
      <Route element={<TaskCreatePage />} path="/tasks/new" />
      <Route element={<TaskEditPage />} path="/tasks/:taskId/edit" />
      <Route element={<TaskDetailsPage />} path="/tasks/:taskId" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}

export default App;
