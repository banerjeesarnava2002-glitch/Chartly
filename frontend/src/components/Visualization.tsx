import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import { PieChart, Pie } from 'recharts';

import { Settings2, X as CloseIcon } from 'lucide-react';

interface VisualizationProps {
  type: string;
  data: any[];
  xCol?: string;
  yCol?: string;
  title?: string;
  allColumns?: string[];
  columnAliases?: Record<string, string>;
}

const COLORS = ['#12239E', '#F2C811', '#118DFF', '#12239E', '#E66C37', '#6B007B'];

export const Visualization: React.FC<VisualizationProps> = ({ 
  type: initialType, 
  data, 
  xCol: initialX, 
  yCol: initialY, 
  title,
  allColumns = [],
  columnAliases = {}
}) => {
  const getDisplayName = (col: string | undefined) => {
    if (!col) return '';
    if (col === 'count') return 'Record Count';
    return columnAliases[col] || col;
  };
  const [isEditing, setIsEditing] = React.useState(false);
  const [type, setType] = React.useState(initialType);
  const [xCol, setXCol] = React.useState(initialX);
  const [yCol, setYCol] = React.useState(initialY);

  const renderChart = () => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400 text-xs">No data for visualization</div>;

    // Check if Y axis data is numeric for line/bar/scatter (exclude 'count' as it is always numeric)
    if (['line', 'bar', 'scatter'].includes(type) && yCol && yCol !== 'count') {
      const isNumeric = data.some(d => typeof d[yCol] === 'number');
      if (!isNumeric) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-amber-600 font-bold text-xs mb-2">Incompatible Data Type</p>
            <p className="text-gray-500 text-[10px]">
              The column <strong>"{yCol}"</strong> contains non-numeric data. 
              {isEditing ? ' Please select a numeric column for the Y-axis.' : ' Use the Edit tool to change it.'}
            </p>
          </div>
        );
      }
    }

    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xCol} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
            <Tooltip 
              contentStyle={{ borderRadius: '0px', border: '1px solid #E1DFDD', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey={yCol} fill="#12239E" />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xCol} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
            <Tooltip 
              contentStyle={{ borderRadius: '0px', border: '1px solid #E1DFDD', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Line type="monotone" dataKey={yCol} stroke="#12239E" strokeWidth={2} dot={{ r: 3, fill: '#12239E' }} activeDot={{ r: 5 }} />
          </LineChart>
        );
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis type="number" dataKey={xCol} name={xCol} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
            <YAxis type="number" dataKey={yCol} name={yCol} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Data" data={data} fill="#12239E" />
          </ScatterChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey={yCol}
              nameKey={xCol}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{fontSize: '10px'}} />
          </PieChart>
        );
      default:
        return <div className="h-full flex items-center justify-center text-gray-400 text-xs">Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] animate-in relative group flex flex-col">
      {/* Editor Toggle */}
      <button 
        onClick={() => setIsEditing(!isEditing)}
        className="absolute top-0 right-0 p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-[#010120] transition-all z-30 opacity-0 group-hover:opacity-100 shadow-sm"
        title="Manual Edit Visual"
      >
        {isEditing ? <CloseIcon className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
      </button>

      {isEditing && (
        <div className="bg-[#fafafa] border border-gray-200 p-3 z-20 animate-in grid grid-cols-3 gap-3 mb-3 rounded-md relative shadow-sm">
          <div>
            <label className="mono-label block mb-1 text-gray-400">Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-200 bg-white focus:outline-none focus:border-[#010120]"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="scatter">Scatter Plot</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>
          <div>
            <label className="mono-label block mb-1 text-gray-400">X-Axis</label>
            <select 
              value={xCol} 
              onChange={(e) => setXCol(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-200 bg-white focus:outline-none focus:border-[#010120]"
            >
              {allColumns.map(col => <option key={col} value={col}>{getDisplayName(col)}</option>)}
            </select>
          </div>
          <div>
            <label className="mono-label block mb-1 text-gray-400">Y-Axis</label>
            <select 
              value={yCol} 
              onChange={(e) => setYCol(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-200 bg-white focus:outline-none focus:border-[#010120]"
            >
              <option value="count">Record Count</option>
              {allColumns.map(col => <option key={col} value={col}>{getDisplayName(col)}</option>)}
            </select>
          </div>
        </div>
      )}


      {title && <h4 className="text-[10px] font-bold mb-4 text-gray-400 uppercase tracking-widest">{title}</h4>}
      <div className="w-full flex-1 min-h-[200px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );

};
