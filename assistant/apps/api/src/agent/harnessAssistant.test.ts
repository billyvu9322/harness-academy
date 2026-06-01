import { describe, expect, test } from 'vitest';
import { createAssistant } from './harnessAssistant';

describe('createAssistant', () => {
  const { orchestrator } = createAssistant(() => []);

  test('builds the HarnessOrchestrator agent', () => {
    expect(orchestrator.name).toBe('HarnessOrchestrator');
  });

  test('exposes the three docs tools', () => {
    const names = orchestrator.tools.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(['list_docs', 'grep_docs', 'read_doc_section']));
  });

  test('attaches an input guardrail (output grounding handled app-level via regenerate)', () => {
    expect(orchestrator.inputGuardrails.length).toBeGreaterThan(0);
  });

  test('exposes a runMessage function', () => {
    const assistant = createAssistant(() => []);
    expect(typeof assistant.runMessage).toBe('function');
  });
});
