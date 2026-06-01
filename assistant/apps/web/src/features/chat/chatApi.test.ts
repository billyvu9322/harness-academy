import { afterEach, describe, expect, test, vi } from 'vitest';
import { postFeedback } from './chatApi';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('postFeedback', () => {
  test('POSTs the vote as JSON to the message feedback endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await postFeedback('msg-123', 'up');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://localhost:3001/api/messages/msg-123/feedback');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init?.body as string)).toEqual({ vote: 'up' });
  });

  test('throws when the response is not ok', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('bad vote', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(postFeedback('msg-123', 'down')).rejects.toThrow();
  });
});
