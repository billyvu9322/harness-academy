import { queryOptions } from '@tanstack/react-query';
import { getConversationMessages, listConversations } from './chatApi';

export const conversationListQuery = queryOptions({
  queryKey: ['conversations'],
  queryFn: listConversations,
});

export const conversationMessagesQuery = (conversationId: string) =>
  queryOptions({
    queryKey: ['conversation', conversationId, 'messages'],
    queryFn: () => getConversationMessages(conversationId),
  });
