/**
 * Harness blueprint scaffold (B8). A deterministic skeleton of the core harness primitives
 * the assistant fills — grounded from the corpus — when the user is in `harness-design` mode.
 * The tool that exposes this is gated by mode via `isEnabled` (see tools.ts), so it never
 * fires during plain Q&A.
 */

export const BLUEPRINT_SECTION_KEYS = [
  'goals',
  'feature_list',
  'tools',
  'verification_gates',
  'loops',
  'sub_agents',
  'clean_state',
] as const;

export type BlueprintSectionKey = (typeof BLUEPRINT_SECTION_KEYS)[number];

export interface BlueprintSection {
  key: BlueprintSectionKey;
  title: string;
  /** Guidance for what the agent should fill in for this section, scoped to the workflow. */
  prompt: string;
}

export interface HarnessBlueprint {
  workflow: string;
  sections: BlueprintSection[];
}

const TITLES: Record<BlueprintSectionKey, string> = {
  goals: 'Mục tiêu & phạm vi',
  feature_list: 'Feature list (primitive)',
  tools: 'Tools / khả năng',
  verification_gates: 'Verification gates',
  loops: 'Vòng lặp (heartbeat / query loop)',
  sub_agents: 'Orchestrator & sub-agents',
  clean_state: 'Clean state mỗi session',
};

const GUIDANCE: Record<BlueprintSectionKey, string> = {
  goals: 'Nêu mục tiêu rõ ràng và phạm vi của harness cho',
  feature_list: 'Liệt kê feature list (đơn vị nguyên thủy để theo dõi scope) cho',
  tools: 'Xác định các tool / khả năng agent cần để thực thi',
  verification_gates: 'Định nghĩa các verification gate bắt buộc để xác nhận hoàn thành cho',
  loops: 'Thiết kế vòng lặp heartbeat/query loop giữ continuity cho',
  sub_agents: 'Phân vai orchestrator điều phối và các sub-agent thực thi cho',
  clean_state: 'Quy định cách khởi tạo clean state mỗi session cho',
};

/** Build the (empty) harness blueprint skeleton for a workflow. Throws on an empty workflow. */
export function buildHarnessBlueprint(workflow: string): HarnessBlueprint {
  const trimmed = workflow.trim();
  if (trimmed.length === 0) throw new Error('workflow must not be empty');
  return {
    workflow: trimmed,
    sections: BLUEPRINT_SECTION_KEYS.map((key) => ({
      key,
      title: TITLES[key],
      prompt: `${GUIDANCE[key]}: "${trimmed}". Dựa trên tài liệu nội bộ, không bịa.`,
    })),
  };
}
