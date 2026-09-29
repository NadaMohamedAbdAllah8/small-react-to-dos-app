import { Navigate, Route, Routes } from 'react-router-dom';
import TaskCreatePage from './features/tasks/pages/TaskCreatePage';
import TaskFeatureUnavailablePage from './features/tasks/pages/TaskFeatureUnavailablePage';
import TasksListPage from './features/tasks/pages/TasksListPage';

function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/tasks" />} path="/" />
      <Route element={<TasksListPage />} path="/tasks" />
      <Route element={<TaskCreatePage />} path="/tasks/new" />
      <Route element={<TaskFeatureUnavailablePage />} path="/tasks/:taskId" />
    </Routes>
  );
}

export default App;
