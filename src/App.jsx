import { Navigate, Route, Routes } from 'react-router-dom';
import TasksListPage from './features/tasks/pages/TasksListPage';

function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/tasks" />} path="/" />
      <Route element={<TasksListPage />} path="/tasks" />
    </Routes>
  );
}

export default App;
