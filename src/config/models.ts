import { ModelOption } from '@/types/chat';

export const DEFAULT_TOKEN = 
  process.env.NEXT_PUBLIC_HF_TOKEN || 
  process.env.HF_TOKEN || 
  "";
export const DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct";
export const VISION_MODEL = "Qwen/Qwen2.5-VL-72B-Instruct";

export const DEFAULT_SYSTEM_PROMPT = 
  "You are an advanced, intelligent AI assistant. You answer questions accurately, politely, and with clean markdown formatting. You are fluent in both English and Bengali. When analyzing images, provide insightful and thorough visual descriptions.";

export const AVAILABLE_MODELS: ModelOption[] = [
  // Fast & Flagship Chat
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    name: "Llama 3.3 70B",
    category: "chat",
    description: "Ultra-fast & smart flagship"
  },
  {
    id: "Qwen/Qwen2.5-72B-Instruct",
    name: "Qwen 2.5 72B",
    category: "chat",
    description: "Smart all-rounder & multilingual"
  },
  {
    id: "deepseek-ai/DeepSeek-V3",
    name: "DeepSeek V3",
    category: "chat",
    description: "Fast 671B MoE powerhouse"
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    name: "Llama 3.1 8B",
    category: "fast",
    description: "Lightning-fast instant answers"
  },
  {
    id: "microsoft/phi-4",
    name: "Phi-4 14B",
    category: "fast",
    description: "Compact & high performance"
  },

  // Any-to-Any & Vision (Multimodal)
  {
    id: "Qwen/Qwen2.5-VL-72B-Instruct",
    name: "Qwen 2.5 VL 72B",
    category: "vision",
    description: "Flagship any-to-any vision & text",
    isVision: true
  },
  {
    id: "meta-llama/Llama-3.2-11B-Vision-Instruct",
    name: "Llama 3.2 Vision",
    category: "vision",
    description: "Fast visual reasoning & image QA",
    isVision: true
  },
  {
    id: "CohereLabs/aya-vision-32b",
    name: "Aya Vision 32B",
    category: "vision",
    description: "Multilingual any-to-any vision",
    isVision: true
  },
  {
    id: "zai-org/GLM-4.6V-Flash",
    name: "GLM 4.6V Flash",
    category: "vision",
    description: "Ultra-fast multimodal vision",
    isVision: true
  },
  {
    id: "deepseek-ai/DeepSeek-V4-Flash-Vision-Exp",
    name: "DeepSeek Vision Flash",
    category: "vision",
    description: "Experimental multimodal vision",
    isVision: true
  },

  // Deep Reasoning & Logic
  {
    id: "deepseek-ai/DeepSeek-R1",
    name: "DeepSeek R1",
    category: "reasoning",
    description: "Deep reasoning & step-by-step logic"
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
    name: "DeepSeek R1 14B",
    category: "reasoning",
    description: "Fast distilled reasoning"
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
    name: "DeepSeek R1 8B",
    category: "reasoning",
    description: "Ultra-fast distilled logic"
  },

  // Coding Specialist
  {
    id: "Qwen/Qwen2.5-Coder-32B-Instruct",
    name: "Qwen 2.5 Coder 32B",
    category: "coding",
    description: "Advanced coding & software engineering"
  },
  {
    id: "Qwen/Qwen2.5-Coder-7B-Instruct",
    name: "Qwen 2.5 Coder 7B",
    category: "coding",
    description: "Fast lightweight coding assistant"
  }
];

