import { streamEventSchema, type StreamEvent } from '@assistant/shared/events';

export function parseSseData(data: string): StreamEvent {
  return streamEventSchema.parse(JSON.parse(data));
}
