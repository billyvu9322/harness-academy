import type { StreamEvent } from '@assistant/shared/events';

export function serializeSseEvent(event: StreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export function placeholderRetrievalStatus() {
  return {
    enabled: false,
  } as const;
}
