import { queryOptions } from '@tanstack/react-query';
import { listConversations } from './chatApi';

export const conversationListQuery = queryOptions({
  queryKey: ['conversations'],
  queryFn: listConversations,
});
