import { describe, expect, test } from 'vitest';
import type { ChatMessage } from '@assistant/shared/chat';
import type { Citation } from '@assistant/shared/citations';
import { messagesToTurns } from '../../../src/features/chat/restore';

const citation: Citation = { title: 'Lecture 08', sourcePath: 'l8.md', route: '/lectures/08' };

const userMsg = (id: string, content: string): ChatMessage => ({
  id,
  role: 'user',
  content,
  citations: [],
  suggestions: [],
  createdAt: '2026-06-01T00:00:00.000Z',
});

const assistantMsg = (id: string, content: string, citations: Citation[] = []): ChatMessage => ({
  id,
  role: 'assistant',
  content,
  citations,
  suggestions: [],
  createdAt: '2026-06-01T00:00:01.000Z',
});

describe('messagesToTurns', () => {
  test('returns [] for an empty array', () => {
    expect(messagesToTurns([])).toEqual([]);
  });

  test('shapes a user message into a user turn', () => {
    const [turn] = messagesToTurns([userMsg('u1', 'hello')]);
    expect(turn).toEqual({ id: 'u1', role: 'user', text: 'hello' });
  });

  test('shapes an assistant message into an assistant turn with feedback enabled', () => {
    const [turn] = messagesToTurns([assistantMsg('a1', 'hi there', [citation])]);
    expect(turn).toEqual({
      id: 'a1',
      role: 'assistant',
      body: 'hi there',
      related: [citation],
      showFeedback: true,
      serverMessageId: 'a1',
    });
  });

  test('maps citations to related and sets serverMessageId to the message id', () => {
    const [turn] = messagesToTurns([assistantMsg('a2', 'body', [citation])]);
    if (!turn || turn.role !== 'assistant') throw new Error('expected assistant turn');
    expect(turn.related).toEqual([citation]);
    expect(turn.serverMessageId).toBe('a2');
  });

  test('leaves status undefined on restored assistant turns', () => {
    const [turn] = messagesToTurns([assistantMsg('a3', 'body')]);
    if (!turn || turn.role !== 'assistant') throw new Error('expected assistant turn');
    expect(turn.status).toBeUndefined();
  });

  test('preserves ordering across mixed roles', () => {
    const turns = messagesToTurns([
      userMsg('u1', 'first'),
      assistantMsg('a1', 'second'),
      userMsg('u2', 'third'),
      assistantMsg('a2', 'fourth'),
    ]);
    expect(turns.map((t) => t.id)).toEqual(['u1', 'a1', 'u2', 'a2']);
    expect(turns.map((t) => t.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
  });
});
