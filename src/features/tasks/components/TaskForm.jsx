import { useRef, useState } from 'react';
import {
  normalizeTaskPayload,
  TASK_PRIORITIES,
  validateTask,
} from '../validation';

const validatedFieldOrder = ['title', 'priority', 'due_date'];

function createTaskDraft(initialValues) {
  return {
    title: initialValues.title ?? '',
    description: initialValues.description ?? '',
    priority: initialValues.priority ?? 'medium',
    due_date: initialValues.due_date ?? '',
    is_completed: initialValues.is_completed === true,
  };
}

function TaskForm({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  serverErrors = {},
  submitLabel = 'Save task',
  onCancel,
}) {
  const [values, setValues] = useState(() => createTaskDraft(initialValues));
  const [clientErrors, setClientErrors] = useState({});
  const fieldRefs = useRef({});

  function getErrorDescriptionIds(fieldName) {
    const ids = [];

    if (clientErrors[fieldName]) {
      ids.push(`${fieldName}-client-error`);
    }

    if (serverErrors[fieldName]) {
      ids.push(`${fieldName}-server-error`);
    }

    return ids.length > 0 ? ids.join(' ') : undefined;
  }

  function handleFieldChange(event) {
    const { checked, name, type, value } = event.target;
    const nextValues = {
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    };

    setValues(nextValues);
    setClientErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextError = validateTask(nextValues)[name];

      if (nextError) {
        return { ...currentErrors, [name]: nextError };
      }

      return Object.fromEntries(
        Object.entries(currentErrors).filter(([fieldName]) => fieldName !== name),
      );
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateTask(values);
    setClientErrors(validationErrors);

    const firstInvalidField = validatedFieldOrder.find(
      (fieldName) => validationErrors[fieldName],
    );

    if (firstInvalidField) {
      fieldRefs.current[firstInvalidField]?.focus();
      return;
    }

    onSubmit(normalizeTaskPayload(values));
  }

  function renderErrors(fieldName) {
    return (
      <>
        {clientErrors[fieldName] ? (
          <p
            className="task-form__error"
            id={`${fieldName}-client-error`}
            role="alert"
          >
            {clientErrors[fieldName]}
          </p>
        ) : null}
        {serverErrors[fieldName] ? (
          <p
            className="task-form__error"
            id={`${fieldName}-server-error`}
            role="alert"
          >
            {serverErrors[fieldName]}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <form className="task-form" noValidate onSubmit={handleSubmit}>
      <div className="task-form__field">
        <label htmlFor="task-title">Title *</label>
        <input
          aria-describedby={getErrorDescriptionIds('title')}
          aria-invalid={Boolean(clientErrors.title || serverErrors.title)}
          id="task-title"
          name="title"
          onChange={handleFieldChange}
          ref={(element) => {
            fieldRefs.current.title = element;
          }}
          required
          type="text"
          value={values.title}
        />
        {renderErrors('title')}
      </div>

      <div className="task-form__field">
        <label htmlFor="task-description">Description</label>
        <textarea
          aria-describedby={getErrorDescriptionIds('description')}
          aria-invalid={Boolean(serverErrors.description)}
          id="task-description"
          name="description"
          onChange={handleFieldChange}
          rows="5"
          value={values.description}
        />
        {renderErrors('description')}
      </div>

      <div className="task-form__row">
        <div className="task-form__field">
          <label htmlFor="task-priority">Priority</label>
          <select
            aria-describedby={getErrorDescriptionIds('priority')}
            aria-invalid={Boolean(clientErrors.priority || serverErrors.priority)}
            id="task-priority"
            name="priority"
            onChange={handleFieldChange}
            ref={(element) => {
              fieldRefs.current.priority = element;
            }}
            value={values.priority}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
          {renderErrors('priority')}
        </div>

        <div className="task-form__field">
          <label htmlFor="task-due-date">Due date</label>
          <input
            aria-describedby={getErrorDescriptionIds('due_date')}
            aria-invalid={Boolean(clientErrors.due_date || serverErrors.due_date)}
            id="task-due-date"
            name="due_date"
            onChange={handleFieldChange}
            ref={(element) => {
              fieldRefs.current.due_date = element;
            }}
            type="date"
            value={values.due_date}
          />
          {renderErrors('due_date')}
        </div>
      </div>

      <div className="task-form__field task-form__field--checkbox">
        <input
          aria-describedby={getErrorDescriptionIds('is_completed')}
          aria-invalid={Boolean(serverErrors.is_completed)}
          checked={values.is_completed}
          id="task-is-completed"
          name="is_completed"
          onChange={handleFieldChange}
          type="checkbox"
        />
        <label htmlFor="task-is-completed">Completed</label>
        {renderErrors('is_completed')}
      </div>

      <div className="task-form__actions">
        <button
          className="button"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="button button--primary"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
