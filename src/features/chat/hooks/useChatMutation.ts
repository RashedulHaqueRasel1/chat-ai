'use client';

import { useMutation } from '@tanstack/react-query';
import { chatApi } from '../api/chat.api';
import { SendMessagePayload, ChatResponse } from '../types';

export function useChatMutation() {
  return useMutation<ChatResponse, Error, SendMessagePayload>({
    mutationFn: (payload: SendMessagePayload) => chatApi.sendMessage(payload),
  });
}
