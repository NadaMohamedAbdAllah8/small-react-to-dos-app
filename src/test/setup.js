import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

function formatConsoleArguments(argumentsList) {
  return argumentsList
    .map((argument) =>
      typeof argument === 'string' ? argument : JSON.stringify(argument),
    )
    .join(' ');
}

beforeEach(() => {
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

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
