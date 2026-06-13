import { beforeEach, describe, expect, it, vi } from 'vitest';

const runMessage = vi.fn();

vi.mock('../../src/agent/runtime', () => ({
  assistant: {
    runMessage,
  },
}));

describe('AssistantPromptfooProvider', () => {
  beforeEach(() => {
    runMessage.mockReset();
    runMessage.mockResolvedValue({
      answer: 'ok',
      citations: [],
      latencyMs: 12,
      regenerated: false,
      context: {
        toolCalls: [],
        reads: [],
        loadedSkills: [],
      },
    });
  });

  it('uses the rendered prompt when it differs from vars.question', async () => {
    const { default: AssistantPromptfooProvider } = await import('../../evals/promptfoo/provider');
    const provider = new AssistantPromptfooProvider();

    await provider.callApi('Answer only from corpus. How does tracing work?', {
      vars: {
        question: 'How does tracing work?',
      },
      metadata: {
        language: 'English',
        mode: 'qa',
      },
    });

    expect(runMessage).toHaveBeenCalledWith(
      'Answer only from corpus. How does tracing work?',
      expect.objectContaining({
        userLanguage: 'English',
        mode: 'qa',
      }),
    );
  });
});
