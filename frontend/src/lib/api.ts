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

export default api;
