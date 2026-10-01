import apiClient from '@/lib/api';
import { SendMessagePayload, ChatResponse } from '../types';

export interface StreamMessageOptions {
  payload: SendMessagePayload;
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
  onReasoningDelta?: (chunk: string) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
}

export const chatApi = {
  sendMessage: async (payload: SendMessagePayload): Promise<ChatResponse> => {
    try {
      const res = await apiClient.post<ChatResponse>('/api/chat', { ...payload, stream: false });
      return res.data;
    } catch (error: any) {
      // If server route body is too large (413), fallback to direct Hugging Face Router call from browser
      if (error?.response?.status === 413 || error?.message?.includes('413')) {
        return await chatApi.sendDirectHuggingFace(payload);
      }
      throw error;
    }
  },

  streamMessage: async ({
    payload,
    signal,
    onDelta,
    onReasoningDelta,
    onDone,
    onError,
  }: StreamMessageOptions): Promise<void> => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, stream: true }),
        signal,
      });

      // If server returned 413 payload too large, stream directly from browser
      if (res.status === 413) {
        return await chatApi.streamDirectHuggingFace({
          payload,
          signal,
          onDelta,
          onReasoningDelta,
          onDone,
          onError,
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Response body is null');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            onDone?.();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta || {};
            if (delta.content) {
              onDelta(delta.content);
            }
            if (delta.reasoning_content && onReasoningDelta) {
              onReasoningDelta(delta.reasoning_content);
            }
          } catch {
            // Partial JSON chunk, wait for more data
          }
        }
      }

      onDone?.();
    } catch (err: any) {
      if (signal?.aborted || err.name === 'AbortError') {
        onDone?.();
        return;
      }
      onError?.(err);
    }
  },

  streamDirectHuggingFace: async ({
    payload,
    signal,
    onDelta,
    onReasoningDelta,
    onDone,
    onError,
  }: StreamMessageOptions): Promise<void> => {
    try {
      const formattedMessages = payload.messages.map((m) => {
        if (m.images && Array.isArray(m.images) && m.images.length > 0) {
          return {
            role: m.role,
            content: [
              { type: 'text', text: m.content },
              ...m.images.map((img) => ({
                type: 'image_url',
                image_url: { url: img },
              })),
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

      const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${payload.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: payload.model,
          messages: formattedMessages,
          max_tokens: 2048,
          temperature: 0.7,
          stream: true,
        }),
        signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || err.message || `API Error ${res.status}`);
      }

      if (!res.body) throw new Error('Response body is null');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            onDone?.();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta || {};
            if (delta.content) {
              onDelta(delta.content);
            }
            if (delta.reasoning_content && onReasoningDelta) {
              onReasoningDelta(delta.reasoning_content);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      onDone?.();
    } catch (err: any) {
      if (signal?.aborted || err.name === 'AbortError') {
        onDone?.();
        return;
      }
      onError?.(err);
    }
  },

  sendDirectHuggingFace: async (payload: SendMessagePayload): Promise<ChatResponse> => {
    const formattedMessages = payload.messages.map((m) => {
      if (m.images && Array.isArray(m.images) && m.images.length > 0) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content },
            ...m.images.map((img) => ({
              type: 'image_url',
              image_url: { url: img },
            })),
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${payload.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: payload.model,
        messages: formattedMessages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || `API Error ${res.status}`);
    }

    const data = await res.json();
    return {
      content: data.choices[0]?.message?.content || '',
      reasoning: data.choices[0]?.message?.reasoning_content || null,
    };
  },
};
