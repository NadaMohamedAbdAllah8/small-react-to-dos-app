export const TASK_PRIORITIES = ['low', 'medium', 'high'];

function isValidDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= daysInMonth[month - 1];
}

export function validateTask(values) {
  const errors = {};

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (!TASK_PRIORITIES.includes(values.priority)) {
    errors.priority = 'Choose a valid priority.';
  }

  if (values.due_date && !isValidDate(values.due_date)) {
    errors.due_date = 'Enter a valid due date.';
  }

  return errors;
}

export function normalizeTaskPayload(values) {
  const description = values.description.trim();

  return {
    title: values.title.trim(),
    description: description || null,
    priority: values.priority,
    due_date: values.due_date || null,
    is_completed: values.is_completed,
  };
}
