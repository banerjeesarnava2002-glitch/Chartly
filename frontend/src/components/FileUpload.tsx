import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

interface FileUploadProps {
  onUploadSuccess: (data: any) => void;
  onUploadError: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      onUploadError('Only CSV files are supported.');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Manual upload to show progress (simplification for now)
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onUploadSuccess(data);
    } catch (error) {
      onUploadError('Error uploading file. Please check if the server is running.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full p-10 border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
        ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-gray-300 hover:border-primary/50 bg-white/50'}
        ${isUploading ? 'pointer-events-none' : ''}`}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center animate-pulse">
          <Upload className="w-12 h-12 text-primary mb-4 animate-bounce" />
          <p className="text-lg font-medium">Uploading your dataset...</p>
        </div>
      ) : (
        <>
          <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Click or drag to upload CSV</h3>
          <p className="text-gray-500 text-sm">Analyze your data in seconds with natural language</p>
        </>
      )}
    </div>
  );
};
