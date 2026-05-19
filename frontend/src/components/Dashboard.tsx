import React, { useState, useEffect } from 'react';
import { Visualization } from './Visualization';
import { LayoutGrid, Info, Download, BarChart3, Workflow, X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { DiagramVisualizer } from './DiagramVisualizer';
import { API_BASE_URL } from '../lib/api';

interface DashboardProps {
  tiles: any[];
  explanation: string;
  rowCount: number;
  filename: string;
  datasetId: number;
  allColumns?: string[];
  columnAliases?: Record<string, string>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tiles: initialTiles, explanation, rowCount, datasetId, allColumns = [], columnAliases = {}
}) => {
  const [tiles, setTiles] = useState(initialTiles);
  const [tileSettings, setTileSettings] = useState<Record<number, { span: '1' | '2' }>>({});

  useEffect(() => {
    setTiles(initialTiles);
    setTileSettings({});
  }, [initialTiles]);

  const handleRemoveTile = (index: number) => {
    setTiles(prev => prev.filter((_, i) => i !== index));
    // Re-adjust settings map
    setTileSettings(prev => {
      const newSettings: Record<number, { span: '1' | '2' }> = {};
      let offset = 0;
      for (let i = 0; i <= tiles.length; i++) {
        if (i === index) { offset = -1; continue; }
        if (prev[i]) newSettings[i + offset] = prev[i];
      }
      return newSettings;
    });
  };

  const handleMoveTile = (index: number, direction: 'left' | 'right') => {
    setTiles(prev => {
      const newTiles = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newTiles.length) {
        const temp = newTiles[index];
        newTiles[index] = newTiles[targetIndex];
        newTiles[targetIndex] = temp;
      }
      return newTiles;
    });
    setTileSettings(prev => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= tiles.length) return prev;
      const newSettings = { ...prev };
      const temp1 = newSettings[index];
      const temp2 = newSettings[targetIndex];
      
      if (temp2) newSettings[index] = temp2;
      else delete newSettings[index];
      
      if (temp1) newSettings[targetIndex] = temp1;
      else delete newSettings[targetIndex];
      
      return newSettings;
    });
  };

  const handleToggleSpan = (index: number) => {
    setTileSettings(prev => ({
      ...prev,
      [index]: { span: prev[index]?.span === '2' ? '1' : '2' }
    }));
  };

  const handleDownload = () => {
    window.open(`${API_BASE_URL}/api/download/${datasetId}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 8 }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Record Count', value: rowCount.toLocaleString() },
          { label: 'Visuals', value: tiles.length },
          { label: 'Status', value: 'Ready' },
          { label: 'BI Ready', value: 'Yes' },
        ].map(kpi => (
          <div key={kpi.label} className="card-sharp" style={{ padding: '14px 16px' }}>
            <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>{kpi.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.48px', lineHeight: 1.1 }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Explanation banner */}
      {explanation && (
        <div style={{
          background: '#010120',
          borderRadius: '4px',
          padding: '16px 20px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <Info size={15} color="#bdbbff" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="mono-label" style={{ color: '#bdbbff', marginBottom: 6 }}>Executive Summary</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, letterSpacing: '-0.13px', margin: 0 }}>{explanation}</p>
          </div>
        </div>
      )}

      {/* Tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {tiles.map((tile, index) => (
          <div key={index} className="card" style={{ 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column',
            gridColumn: tileSettings[index]?.span === '2' ? '1 / -1' : 'auto'
          }}>
            {/* Tile header */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {tile.type === 'chart' ? <BarChart3 size={12} color="#010120" /> : tile.type === 'diagram' ? <Workflow size={12} color="#010120" /> : <LayoutGrid size={12} color="#010120" />}
                <span className="mono-label" style={{ color: 'rgba(0,0,0,0.45)' }}>
                  {tile.type === 'chart' ? `${tile.chart_type} · ${tile.x_col} vs ${tile.y_col}` : tile.type === 'diagram' ? `${tile.diagram_type} Diagram` : 'Summary Data'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button 
                  onClick={() => handleToggleSpan(index)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 4 }}
                  title={tileSettings[index]?.span === '2' ? "Collapse width" : "Expand width"}
                >
                  {tileSettings[index]?.span === '2' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button 
                  onClick={() => handleMoveTile(index, 'left')}
                  disabled={index === 0}
                  style={{ background: 'transparent', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.2 : 0.5, padding: 4 }}
                  title="Move left"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => handleMoveTile(index, 'right')}
                  disabled={index === tiles.length - 1}
                  style={{ background: 'transparent', border: 'none', cursor: index === tiles.length - 1 ? 'not-allowed' : 'pointer', opacity: index === tiles.length - 1 ? 0.2 : 0.5, padding: 4 }}
                  title="Move right"
                >
                  <ChevronRight size={14} />
                </button>
                <div style={{ width: 1, height: 12, background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />
                <button 
                  onClick={() => handleRemoveTile(index)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 4 }}
                  title="Remove tile"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Tile body */}
            <div style={{ padding: '12px', flex: 1 }}>
              {tile.type === 'chart' ? (
                <div style={{ height: 280 }}>
                  <Visualization
                    type={tile.chart_type}
                    data={tile.data}
                    xCol={tile.x_col}
                    yCol={tile.y_col}
                    allColumns={allColumns}
                    columnAliases={columnAliases}
                  />
                </div>
              ) : tile.type === 'table' ? (
                <div style={{ overflowX: 'auto', maxHeight: 300 }}>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                        {Object.keys(tile.data[0] || {}).map((k: string) => (
                          <th key={k} style={{ padding: '6px 10px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05px', color: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(0,0,0,0.05)', whiteSpace: 'nowrap' }}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tile.data.slice(0, 15).map((row: any, i: number) => (
                        <tr key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                          {Object.values(row).map((v: any, j: number) => (
                            <td key={j} style={{ padding: '5px 10px', borderRight: '1px solid rgba(0,0,0,0.03)', color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
                              {String(v ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : tile.type === 'diagram' ? (
                <div style={{ overflowX: 'auto', maxHeight: 400 }}>
                  <DiagramVisualizer
                    type={tile.diagram_type}
                    nodes={tile.nodes || []}
                    edges={tile.edges || []}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Download section */}
      <div className="no-print" style={{
        marginTop: 8,
        padding: '20px 24px',
        background: '#fafafa',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.3px', marginBottom: 4 }}>Export Dashboard</p>
          <p className="type-caption" style={{ color: 'rgba(0,0,0,0.45)', margin: 0 }}>
            Save the dashboard directly as a PDF or download the Power BI package.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => window.print()}
            className="btn-outline"
          >
            Save as PDF
          </button>
          <button
            onClick={handleDownload}
            className="btn-primary"
          >
            <Download size={15} />
            Download ZIP
          </button>
        </div>
      </div>
    </div>
  );
};
