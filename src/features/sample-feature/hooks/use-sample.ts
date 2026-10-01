'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sampleApi } from '../api/sample.api';
import { CreateSampleDTO } from '../types';

export function useSamples() {
  return useQuery({
    queryKey: ['samples'],
    queryFn: sampleApi.getSamples,
  });
}

export function useCreateSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSampleDTO) => sampleApi.createSample(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
    },
  });
}
