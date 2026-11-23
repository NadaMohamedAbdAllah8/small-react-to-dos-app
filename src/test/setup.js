import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { AUTH_STORAGE_KEY } from '../features/auth/session';
import { authSessionFixture } from './fixtures/auth';
import { server } from './mocks/server';

function formatConsoleArguments(argumentsList) {
  return argumentsList
    .map((argument) =>
      typeof argument === 'string' ? argument : JSON.stringify(argument),
    )
    .join(' ');
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(authSessionFixture),
  );
  vi.spyOn(console, 'error').mockImplementation((...argumentsList) => {
    throw new Error(
      `Unexpected console.error: ${formatConsoleArguments(argumentsList)}`,
    );
  });
  vi.spyOn(console, 'warn').mockImplementation((...argumentsList) => {
    throw new Error(
      `Unexpected console.warn: ${formatConsoleArguments(argumentsList)}`,
    );
  });
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});
