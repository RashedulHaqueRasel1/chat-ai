import apiClient from '@/lib/api';
import { SampleItem, CreateSampleDTO } from '../types';

export const sampleApi = {
  getSamples: async (): Promise<SampleItem[]> => {
    const res = await apiClient.get<SampleItem[]>('/api/samples');
    return res.data;
  },

  createSample: async (data: CreateSampleDTO): Promise<SampleItem> => {
    const res = await apiClient.post<SampleItem>('/api/samples', data);
    return res.data;
  },
};
