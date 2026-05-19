import React from 'react';
import { Bot, User, BarChart3, LayoutGrid, Sparkles } from 'lucide-react';
import { Visualization } from './Visualization';
import { Dashboard } from './Dashboard';
import { DiagramVisualizer } from './DiagramVisualizer';
import { Workflow } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  query?: string;
  result?: any;
}

interface ChatFeedProps {
  messages: Message[];
  allColumns: string[];
  columnAliases: Record<string, string>;
  datasetId: number;
  rowCount: number;
  filename: string;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages, allColumns, columnAliases, datasetId, rowCount, filename
}) => {
  if (messages.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {messages.map((msg) => (
        <div key={msg.id} className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* ── User bubble ── */}
          {msg.role === 'user' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                maxWidth: 560,
                background: '#010120',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: 1.5,
                letterSpacing: '-0.14px',
              }}>
                {msg.query}
              </div>
              <div style={{
                width: 32, height: 32,
                background: '#010120',
                borderRadius: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={14} color="#bdbbff" />
              </div>
            </div>
          )}

          {/* ── Assistant bubble ── */}
          {msg.role === 'assistant' && msg.result && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* AI avatar */}
              <div style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, #bdbbff 0%, #010120 100%)',
                borderRadius: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Bot size={14} color="#fff" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Text Answer */}
                {msg.result.type === 'answer' && (
                  <div className="card" style={{ padding: '16px 20px', maxWidth: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <Sparkles size={12} color="#bdbbff" />
                      <span className="mono-label" style={{ color: 'rgba(0,0,0,0.4)' }}>AI Answer</span>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.65, letterSpacing: '-0.14px', color: '#111', whiteSpace: 'pre-wrap', margin: 0 }}>
                      {msg.result.parsed_operation?.message || 'No response.'}
                    </p>
                  </div>
                )}

                {/* Chart */}
                {msg.result.type === 'chart' && (
                  <div className="card" style={{ overflow: 'hidden', maxWidth: 640 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BarChart3 size={13} color="#010120" />
                      <span className="mono-label" style={{ color: 'rgba(0,0,0,0.5)' }}>
                        {msg.result.data?.chart_type} · {msg.result.data?.x_col} vs {msg.result.data?.y_col}
                      </span>
                    </div>
                    {msg.result.parsed_operation?.explanation && (
                      <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px', color: 'rgba(0,0,0,0.5)', fontStyle: 'italic' }}>
                        {msg.result.parsed_operation.explanation}
                      </div>
                    )}
                    <div style={{ padding: '12px', height: 320 }}>
                      <Visualization
                        type={msg.result.data?.chart_type}
                        data={msg.result.data?.data}
                        xCol={msg.result.data?.x_col}
                        yCol={msg.result.data?.y_col}
                        allColumns={allColumns}
                        columnAliases={columnAliases}
                      />
                    </div>
                  </div>
                )}

                {/* Summary Table */}
                {msg.result.type === 'table' && (
                  <div className="card" style={{ overflow: 'hidden', maxWidth: 700 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LayoutGrid size={13} color="#010120" />
                      <span className="mono-label" style={{ color: 'rgba(0,0,0,0.5)' }}>Statistical Summary</span>
                    </div>
                    <div style={{ overflowX: 'auto', maxHeight: 380 }}>
                      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'rgba(0,0,0,0.03)', position: 'sticky', top: 0 }}>
                          <tr>
                            {Object.keys((msg.result.data || [])[0] || {}).map((k: string) => (
                              <th key={k} style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid rgba(0,0,0,0.05)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.05px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', fontWeight: 500, whiteSpace: 'nowrap' }}>{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(msg.result.data || []).map((row: any, i: number) => (
                            <tr key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                              {Object.values(row).map((v: any, j: number) => (
                                <td key={j} style={{ padding: '7px 12px', borderRight: '1px solid rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>
                                  {v === null || v === undefined ? '—' : String(v)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Dashboard */}
                {msg.result.type === 'dashboard' && (
                  <div style={{ width: '100%' }}>
                    <Dashboard
                      tiles={msg.result.data || []}
                      explanation={msg.result.parsed_operation?.explanation || ''}
                      rowCount={rowCount}
                      filename={filename}
                      datasetId={datasetId}
                      allColumns={allColumns}
                      columnAliases={columnAliases}
                    />
                  </div>
                )}

                {/* Diagram (Napkin AI style) */}
                {msg.result.type === 'diagram' && msg.result.data && (
                  <div className="card" style={{ overflow: 'hidden', maxWidth: 800 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Workflow size={13} color="#010120" />
                      <span className="mono-label" style={{ color: 'rgba(0,0,0,0.5)', textTransform: 'capitalize' }}>
                        {msg.result.data.diagram_type} Diagram
                      </span>
                    </div>
                    {msg.result.data.explanation && (
                      <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px', color: 'rgba(0,0,0,0.5)', fontStyle: 'italic' }}>
                        {msg.result.data.explanation}
                      </div>
                    )}
                    <DiagramVisualizer
                      type={msg.result.data.diagram_type}
                      nodes={msg.result.data.nodes || []}
                      edges={msg.result.data.edges || []}
                    />
                  </div>
                )}

                {/* Error */}
                {msg.result.type === 'error' && (
                  <div className="card-sharp" style={{ padding: '12px 16px', background: 'rgba(239,44,193,0.04)', borderColor: 'rgba(239,44,193,0.15)', maxWidth: 480, fontSize: '13px', color: '#b91c1c' }}>
                    ⚠ {msg.result.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
