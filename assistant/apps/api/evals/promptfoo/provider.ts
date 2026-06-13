type ProviderOptions = {
  id?: string;
};

type CallContext = {
  vars?: Record<string, unknown>;
};

function stringVar(vars: Record<string, unknown>, key: string, fallback: string): string {
  const value = vars[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export default class AssistantPromptfooProvider {
  private readonly providerId: string;

  constructor(options: ProviderOptions = {}) {
    this.providerId = options.id ?? 'harness-assistant';
  }

  id(): string {
    return this.providerId;
  }

  async callApi(prompt: string, context: CallContext = {}) {
    const vars = context.vars ?? {};
    
    const question = stringVar(vars, 'question', prompt);
    const language = stringVar(vars, 'language', 'Vietnamese');
    const requestedMode = stringVar(vars, 'mode', 'qa');
    
    const mode = requestedMode === 'harness-design' ? 'harness-design' : 'qa';

    const { assistant } = await import('../../src/agent/runtime');
    
    const result = await assistant.runMessage(question, {
      userLanguage: language,
      mode,
    });

    return {
      output: result.answer,
      metadata: {
        citations: result.citations,
        toolCalls: result.context.toolCalls,
        readDocIds: [...new Set(result.context.reads.map((read) => read.docId))],
        loadedSkills: result.context.loadedSkills,
        latencyMs: result.latencyMs,
        regenerated: result.regenerated,
      },
    };
  }
}
