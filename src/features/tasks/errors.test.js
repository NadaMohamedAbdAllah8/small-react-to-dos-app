import { describe, expect, it } from 'vitest';
import { normalizeTaskValidationErrors } from './errors';

describe('normalizeTaskValidationErrors', () => {
  it.each([
    null,
    new Error('Network failure'),
    { status: 400, data: { errors: { title: ['Invalid'] } } },
    { status: 422 },
    { status: 422, data: { errors: [] } },
  ])('returns no field errors for an unsupported error shape', (error) => {
    expect(normalizeTaskValidationErrors(error)).toEqual({});
  });

  it('keeps only the first non-blank message for known task fields', () => {
    expect(
      normalizeTaskValidationErrors({
        status: 422,
        data: {
          errors: {
            title: ['', 42, 'The title is invalid.', 'Another message'],
            description: 'Not an array',
            priority: [null, '   '],
            due_date: ['The due date is invalid.'],
            unknown: ['Ignore this field.'],
          },
        },
      }),
    ).toEqual({
      title: 'The title is invalid.',
      due_date: 'The due date is invalid.',
    });
  });
});
