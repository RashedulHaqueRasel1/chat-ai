export * from '@/types/chat';

export interface SendMessagePayload {
  messages: Array<{
    role: string;
    content: string;
    images?: string[];
  }>;
  model: string;
  token: string;
}

export interface ChatResponse {
  content: string;
  reasoning?: string | null;
}
