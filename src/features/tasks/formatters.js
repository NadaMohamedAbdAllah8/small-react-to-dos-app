const listDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

const detailsDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const detailsTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

function parseTaskDate(value) {
  if (typeof value !== 'string' || !value) {
    return null;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00Z` : value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (isDateOnly && date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return date;
}

export function formatTaskListDate(value) {
  if (!value) {
    return 'No date';
  }

  const date = parseTaskDate(value);
  return date ? listDateFormatter.format(date) : 'Invalid date';
}

export function formatTaskDueDate(value) {
  if (!value) {
    return 'No due date';
  }

  const date = parseTaskDate(value);
  return date ? detailsDateFormatter.format(date) : 'Invalid date';
}

export function formatTaskCreatedDate(value) {
  const date = parseTaskDate(value);

  if (!date) {
    return 'Invalid date';
  }

  return `${detailsDateFormatter.format(date)} at ${detailsTimeFormatter.format(date)}`;
}
