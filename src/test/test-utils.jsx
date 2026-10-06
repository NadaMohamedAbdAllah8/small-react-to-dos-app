import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import RouterObserver from './RouterObserver';

export function renderApp({
  route = '/tasks',
  initialEntries = [route],
  initialIndex,
  includeBackControl = false,
} = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <App />
      <RouterObserver includeBackControl={includeBackControl} />
    </MemoryRouter>,
  );
}
