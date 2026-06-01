import type { StreamEvent } from '@assistant/shared/events';

/** Inline status shown while the agent is working but no answer text has streamed yet. */
export const STATUS_THINKING = 'Đang xử lý…';
/** Inline status shown once answer tokens start streaming. */
export const STATUS_ANSWERING = 'Đang soạn câu trả lời…';

const TOOL_LABELS: Record<string, string> = {
  list_docs: 'Đang xem danh mục tài liệu…',
  grep_docs: 'Đang tìm trong tài liệu…',
  read_doc_section: 'Đang đọc mục liên quan…',
  harness_blueprint: 'Đang dựng khung harness…',
};

/** Friendly Vietnamese label for an agent tool name (used in the live status line). */
export function toolStatusLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? `Đang dùng công cụ ${tool}…`;
}

/**
 * Reduce the inline agent status from the previous status and the next stream event.
 * Returns the new status string, or null when the turn is finished/cleared.
 */
export function nextStatus(prev: string | null, ev: StreamEvent): string | null {
  switch (ev.type) {
    case 'message.started':
      return STATUS_THINKING;
    case 'tool.started':
      return toolStatusLabel(ev.tool);
    case 'tool.completed':
    case 'retrieval.completed':
      return STATUS_THINKING;
    case 'message.delta':
      return STATUS_ANSWERING;
    case 'message.completed':
    case 'done':
    case 'error':
      return null;
    default:
      return prev;
  }
}
