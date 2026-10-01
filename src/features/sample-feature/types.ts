export interface SampleItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface CreateSampleDTO {
  title: string;
  description: string;
}
