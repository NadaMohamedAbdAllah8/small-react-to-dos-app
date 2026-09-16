import { Navigate, Route, Routes } from 'react-router-dom';
import TaskFeatureUnavailablePage from './features/tasks/pages/TaskFeatureUnavailablePage';
import TasksListPage from './features/tasks/pages/TasksListPage';

function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/tasks" />} path="/" />
      <Route element={<TasksListPage />} path="/tasks" />
      <Route element={<TaskFeatureUnavailablePage />} path="/tasks/new" />
      <Route element={<TaskFeatureUnavailablePage />} path="/tasks/:taskId" />
    </Routes>
  );
}

export default App;
