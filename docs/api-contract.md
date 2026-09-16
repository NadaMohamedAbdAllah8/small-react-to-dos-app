# Tasks API contract

This document describes the temporary JSON Server API used during frontend development. The base URL for local development is `http://localhost:3001/api`.

Authentication is not implemented.

## Task representation

```json
{
  "id": 1,
  "title": "Prepare API documentation",
  "description": "Document the temporary task API before connecting the React application.",
  "priority": "high",
  "due_date": "2026-09-10",
  "is_completed": false,
  "created_at": "2026-09-08T09:00:00.000Z"
}
```

| Field | Type | Rules planned for the application |
| --- | --- | --- |
| `id` | number | Unique task identifier. JSON Server generates it when omitted during creation. |
| `title` | string | Required. |
| `description` | string or null | Nullable. |
| `priority` | string | One of `low`, `medium`, or `high`. |
| `due_date` | string or null | Nullable date in `YYYY-MM-DD` format. |
| `is_completed` | boolean | Indicates whether the task is complete. |
| `created_at` | string | ISO 8601 datetime. |

> JSON Server persists JSON but does not enforce the planned Laravel validation rules, required fields, allowed priority values, date formats, or data types. It also does not generate `created_at`, so mock clients must supply that value when creating a task. Laravel remains responsible for validation and server-managed timestamps in the real API.

## GET `/api/tasks`

Returns the task collection.

### Successful response

Status: `200 OK`

```json
[
  {
    "id": 1,
    "title": "Prepare API documentation",
    "description": "Document the temporary task API before connecting the React application.",
    "priority": "high",
    "due_date": "2026-09-10",
    "is_completed": false,
    "created_at": "2026-09-08T09:00:00.000Z"
  }
]
```

### Relevant status codes

- `200 OK`: The collection was returned. An empty collection is represented by `[]`.

## GET `/api/tasks/:id`

Returns one task identified by its numeric `id`.

### Successful response

Status: `200 OK`

```json
{
  "id": 1,
  "title": "Prepare API documentation",
  "description": "Document the temporary task API before connecting the React application.",
  "priority": "high",
  "due_date": "2026-09-10",
  "is_completed": false,
  "created_at": "2026-09-08T09:00:00.000Z"
}
```

### Relevant status codes

- `200 OK`: The task was found.
- `404 Not Found`: No task has the requested `id`.

## POST `/api/tasks`

Creates a task. Omit `id` so JSON Server can generate it. Supply `created_at` because JSON Server does not generate timestamps.

### Request body

```json
{
  "title": "Test the task form",
  "description": null,
  "priority": "medium",
  "due_date": "2026-09-15",
  "is_completed": false,
  "created_at": "2026-09-08T12:00:00.000Z"
}
```

### Successful response

Status: `201 Created`

```json
{
  "id": 4,
  "title": "Test the task form",
  "description": null,
  "priority": "medium",
  "due_date": "2026-09-15",
  "is_completed": false,
  "created_at": "2026-09-08T12:00:00.000Z"
}
```

### Relevant status codes

- `201 Created`: The supplied object was stored and returned with an `id`.
- `400 Bad Request`: The request contains malformed JSON.

## PATCH `/api/tasks/:id`

Updates only the supplied properties of an existing task.

### Request body

```json
{
  "is_completed": true
}
```

### Successful response

Status: `200 OK`

```json
{
  "id": 1,
  "title": "Prepare API documentation",
  "description": "Document the temporary task API before connecting the React application.",
  "priority": "high",
  "due_date": "2026-09-10",
  "is_completed": true,
  "created_at": "2026-09-08T09:00:00.000Z"
}
```

### Relevant status codes

- `200 OK`: The task was updated and the complete stored task was returned.
- `400 Bad Request`: The request contains malformed JSON.
- `404 Not Found`: No task has the requested `id`.

## DELETE `/api/tasks/:id`

Deletes one task identified by its numeric `id`.

### Successful response

Status: `200 OK`

```json
{}
```

### Relevant status codes

- `200 OK`: The task was deleted.
- `404 Not Found`: No task has the requested `id`.
