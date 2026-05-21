import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadDataset = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const analyzeDataset = async (datasetId: number, query: string) => {
  const response = await api.post('/api/analyze', {
    dataset_id: datasetId,
    query: query,
  });
  return response.data;
};

export type TransformOperation = 'filter' | 'aggregate' | 'pivot';

export const transformDataset = async (
  datasetId: number,
  operation: TransformOperation,
  params: Record<string, unknown>
) => {
  const response = await api.post('/api/transform', {
    dataset_id: datasetId,
    operation,
    params,
  });
  return response.data;
};

export const getHistory = async (datasetId: number, limit = 50) => {
  const response = await api.get(`/api/history/${datasetId}`, { params: { limit } });
  return response.data;
};

export const deleteHistoryEntry = async (entryId: number) => {
  const response = await api.delete(`/api/history/${entryId}`);
  return response.data;
};

export default api;
