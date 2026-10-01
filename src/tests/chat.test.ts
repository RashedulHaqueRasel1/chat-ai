import { AVAILABLE_MODELS } from '@/config/models';

describe('Chat Configuration and Models', () => {
  it('should have default vision model configured', () => {
    const visionModel = AVAILABLE_MODELS.find((m) => m.isVision);
    expect(visionModel).toBeDefined();
    expect(visionModel?.id).toBe('Qwen/Qwen2.5-VL-72B-Instruct');
  });

  it('should include top flagship chat models', () => {
    const qwenModel = AVAILABLE_MODELS.find((m) => m.id === 'Qwen/Qwen2.5-72B-Instruct');
    const deepSeekModel = AVAILABLE_MODELS.find((m) => m.id === 'deepseek-ai/DeepSeek-V3');
    const deepSeekR1 = AVAILABLE_MODELS.find((m) => m.id === 'deepseek-ai/DeepSeek-R1');

    expect(qwenModel).toBeDefined();
    expect(deepSeekModel).toBeDefined();
    expect(deepSeekR1).toBeDefined();
  });
});
