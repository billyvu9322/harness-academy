import { tool } from '@openai/agents';
import { z } from 'zod';
import type { AssistantContext } from '../context';
import type { SkillRegistry } from './loader';

export type LoadSkillResult =
  | { found: true; name: string; body: string }
  | { found: false; available: string[] };

/** Pure resolver — looked up by name, records the load on context. Unit-tested directly. */
export function resolveLoadSkill(
  registry: SkillRegistry,
  name: string,
  context: AssistantContext | undefined,
): LoadSkillResult {
  const skill = registry.get(name);
  if (!skill) return { found: false, available: [...registry.keys()] };
  context?.loadedSkills?.push(skill.name);
  return { found: true, name: skill.name, body: skill.body };
}

/** Build the SDK tool over a registry. */
export function createLoadSkillTool(registry: SkillRegistry) {
  return tool({
    name: 'load_skill',
    description:
      'Nạp hướng dẫn chi tiết của một skill theo tên (tên lấy từ danh sách KỸ NĂNG trong system prompt). Gọi TRƯỚC khi trả lời khi câu hỏi khớp một skill.',
    parameters: z.object({
      name: z.string().describe('Tên skill cần nạp, đúng như trong danh sách KỸ NĂNG.'),
    }),
    execute: async ({ name }, runContext) =>
      resolveLoadSkill(registry, name, runContext?.context as AssistantContext | undefined),
  });
}
