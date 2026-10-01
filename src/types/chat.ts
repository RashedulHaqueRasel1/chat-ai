export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  reasoning?: string;
  images?: string[]; // Array of base64 data URLs for multi-image vision support
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ModelOption {
  id: string;
  name: string;
  icon?: string;
  category: 'chat' | 'vision' | 'reasoning' | 'coding' | 'fast';
  description: string;
  isVision?: boolean;
}
