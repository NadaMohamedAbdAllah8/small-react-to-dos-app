const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status = null, data = null, cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.cause = cause;
  }
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new ApiError('The API returned an invalid JSON response.', {
      status: response.status,
      cause: error,
    });
  }
}

export async function request(path, { body, headers, ...options } = {}) {
  if (!apiBaseUrl) {
    throw new ApiError('VITE_API_BASE_URL is not configured.');
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError('Unable to connect to the API.', { cause: error });
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && typeof data.message === 'string'
        ? data.message
        : `The API request failed with status ${response.status}.`;

    throw new ApiError(message, { status: response.status, data });
  }

  return data;
}
