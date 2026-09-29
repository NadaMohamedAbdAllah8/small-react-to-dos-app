const taskFieldNames = [
  'title',
  'description',
  'priority',
  'due_date',
  'is_completed',
];

export function normalizeTaskValidationErrors(error) {
  if (
    error?.status !== 422 ||
    !error.data?.errors ||
    typeof error.data.errors !== 'object' ||
    Array.isArray(error.data.errors)
  ) {
    return {};
  }

  return taskFieldNames.reduce((normalizedErrors, fieldName) => {
    const messages = error.data.errors[fieldName];

    if (!Array.isArray(messages)) {
      return normalizedErrors;
    }

    const firstMessage = messages.find(
      (message) => typeof message === 'string' && message.trim(),
    );

    if (!firstMessage) {
      return normalizedErrors;
    }

    return { ...normalizedErrors, [fieldName]: firstMessage };
  }, {});
}
