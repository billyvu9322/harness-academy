export type ChatRole = 'user' | 'assistant';

export interface HistoryTurn {
  role: ChatRole;
  content: string;
}

/**
 * Build the agent input from prior conversation turns + the new user message.
 * Shape ({ role, content }) is accepted by the SDK as AgentInputItem[].
 */
export function buildAgentInput(history: HistoryTurn[], message: string): HistoryTurn[] {
  const prior = history.filter((t) => t.content.trim().length > 0);
  return [...prior, { role: 'user', content: message }];
}
