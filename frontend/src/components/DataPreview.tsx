import React from 'react';
import { Table } from 'lucide-react';

interface DataPreviewProps {
  filename: string;
  rowCount: number;
  columns: string[];
  preview: any[];
}

export const DataPreview: React.FC<DataPreviewProps> = ({ filename, rowCount, columns, preview }) => {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-800">{filename}</h3>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
          {rowCount} rows
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/30">
              {columns.map((col) => (
                <th key={col} className="px-6 py-3 font-medium text-gray-500 border-b border-gray-100 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {preview.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-6 py-4 text-gray-700">
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {preview.length === 0 && (
        <div className="p-10 text-center text-gray-400">
          No data preview available
        </div>
      )}
      
      <div className="px-6 py-3 bg-gray-50/30 border-t border-gray-100 text-xs text-gray-400 italic">
        Showing first {preview.length} rows
      </div>
    </div>
  );
};
