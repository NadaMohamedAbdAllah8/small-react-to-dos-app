import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from './client';

function createResponse({ body = '', status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(body),
  };
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('request', () => {
  it('requests the configured API URL and parses JSON success data', async () => {
    fetch.mockResolvedValue(
      createResponse({ body: JSON.stringify([{ id: 1, title: 'Task' }]) }),
    );

    const result = await request('/tasks');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/tasks',
      expect.objectContaining({
        body: undefined,
        headers: expect.any(Headers),
      }),
    );
    expect(result).toEqual([{ id: 1, title: 'Task' }]);
  });

  it('serializes JSON bodies, enforces JSON headers, and forwards options', async () => {
    const abortController = new AbortController();
    fetch.mockResolvedValue(
      createResponse({ body: JSON.stringify({ id: 1 }) }),
    );

    await request('/tasks', {
      method: 'POST',
      signal: abortController.signal,
      headers: { Authorization: 'Bearer token', Accept: 'text/plain' },
      body: { title: 'Task' },
    });

    const [, options] = fetch.mock.calls[0];
    expect(options).toMatchObject({
      method: 'POST',
      signal: abortController.signal,
      body: JSON.stringify({ title: 'Task' }),
    });
    expect(options.headers.get('Accept')).toBe('application/json');
    expect(options.headers.get('Content-Type')).toBe('application/json');
    expect(options.headers.get('Authorization')).toBe('Bearer token');
  });

  it('does not add a content type or body to requests without a body', async () => {
    fetch.mockResolvedValue(createResponse());

    await request('/tasks', { method: 'GET' });

    const [, options] = fetch.mock.calls[0];
    expect(options.body).toBeUndefined();
    expect(options.headers.has('Content-Type')).toBe(false);
  });

  it('preserves JSON HTTP error details and status', async () => {
    const errorData = {
      message: 'The given data was invalid.',
      errors: { title: ['The title is required.'] },
    };
    fetch.mockResolvedValue(
      createResponse({ body: JSON.stringify(errorData), status: 422 }),
    );

    const error = await request('/tasks', {
      method: 'POST',
      body: { title: '' },
    }).catch((requestError) => requestError);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('The given data was invalid.');
    expect(error.status).toBe(422);
    expect(error.data).toEqual(errorData);
  });

  it.each([
    ['an empty successful body', createResponse(), 200],
    ['a 204 response', createResponse({ status: 204 }), 204],
  ])('returns null for %s', async (_label, response, expectedStatus) => {
    fetch.mockResolvedValue(response);

    await expect(request('/tasks')).resolves.toBeNull();
    expect(response.status).toBe(expectedStatus);
  });

  it('does not read the body of a 204 response', async () => {
    const response = createResponse({ status: 204 });
    fetch.mockResolvedValue(response);

    await request('/tasks');

    expect(response.text).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON from a successful response', async () => {
    fetch.mockResolvedValue(createResponse({ body: '<html>not json</html>' }));

    const error = await request('/tasks').catch(
      (requestError) => requestError,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('The API returned an invalid JSON response.');
    expect(error.status).toBe(200);
    expect(error.cause).toBeInstanceOf(SyntaxError);
  });

  it('reports HTTP status instead of a JSON error for malformed error bodies', async () => {
    fetch.mockResolvedValue(
      createResponse({ body: '<html>server error</html>', status: 502 }),
    );

    const error = await request('/tasks').catch(
      (requestError) => requestError,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('The API request failed with status 502.');
    expect(error.status).toBe(502);
    expect(error.data).toBeNull();
    expect(error.cause).toBeInstanceOf(SyntaxError);
  });

  it.each([
    ['', null],
    [JSON.stringify({ message: 42 }), { message: 42 }],
  ])('uses the status fallback for an HTTP error without a string message', async (body, data) => {
    fetch.mockResolvedValue(createResponse({ body, status: 500 }));

    const error = await request('/tasks').catch(
      (requestError) => requestError,
    );

    expect(error).toMatchObject({
      message: 'The API request failed with status 500.',
      status: 500,
      data,
    });
  });

  it('trims trailing slashes from the configured base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001/api///');
    vi.resetModules();
    const { request: requestWithTrailingBaseUrl } = await import('./client');
    fetch.mockResolvedValue(createResponse());

    await requestWithTrailingBaseUrl('/tasks');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/tasks',
      expect.any(Object),
    );
  });

  it('rejects before fetching when the base URL is not configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.resetModules();
    const { request: unconfiguredRequest } = await import('./client');

    await expect(unconfiguredRequest('/tasks')).rejects.toMatchObject({
      message: 'VITE_API_BASE_URL is not configured.',
      status: null,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('normalizes network failures', async () => {
    const networkError = new TypeError('Network failed');
    fetch.mockRejectedValue(networkError);

    const error = await request('/tasks').catch(
      (requestError) => requestError,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Unable to connect to the API.');
    expect(error.status).toBeNull();
    expect(error.cause).toBe(networkError);
  });

  it('preserves abort errors', async () => {
    const abortError = Object.assign(new Error('The request was aborted.'), {
      name: 'AbortError',
    });
    fetch.mockRejectedValue(abortError);

    await expect(request('/tasks')).rejects.toBe(abortError);
  });
});
