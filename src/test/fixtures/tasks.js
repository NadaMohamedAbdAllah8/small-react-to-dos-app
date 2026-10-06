export function createTaskFixture(overrides = {}) {
  return {
    id: 1,
    title: 'Prepare API documentation',
    description: 'Document the task endpoints and response shapes.',
    priority: 'high',
    due_date: '2026-10-10',
    is_completed: false,
    created_at: '2026-09-08T09:00:00.000Z',
    ...overrides,
  };
}

export const taskFixtures = [
  createTaskFixture(),
  createTaskFixture({
    id: 2,
    title: 'Review integration tests',
    description: null,
    priority: 'low',
    due_date: null,
    is_completed: true,
    created_at: '2026-09-09T10:30:00.000Z',
  }),
];
