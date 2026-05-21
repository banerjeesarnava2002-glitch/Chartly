import React, { useState, useRef, useEffect } from 'react';
import { Database, RefreshCcw, Settings2, MessageSquare, Send, Loader2, Sliders } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { DataPreview } from './components/DataPreview';
import { analyzeDataset } from './lib/api';
import { ChatFeed } from './components/ChatFeed';
import { TransformPanel } from './components/TransformPanel';

interface DatasetMetadata {
  id: number;
  filename: string;
  columns: string[];
  column_types: Record<string, string>;
  row_count: number;
  preview: any[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  query?: string;
  result?: any;
}

const SUGGESTION_PROMPTS = [
  'What insights can you give me?',
  'Give me a summary of this dataset',
  'Make a dashboard',
  'Generate a flowchart',
  'How many rows are there?',
];

function App() {
  const [dataset, setDataset] = useState<DatasetMetadata | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [columnAliases, setColumnAliases] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUploadSuccess = (data: DatasetMetadata) => {
    setDataset(data);
    setMessages([]);
    setError(null);
    setColumnAliases({});
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleAnalyze = async (q: string) => {
    if (!dataset || !q.trim() || isLoading) return;
    const currentQuery = q.trim();
    setQuery('');
    setIsLoading(true);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', query: currentQuery }]);
    try {
      const result = await analyzeDataset(dataset.id, currentQuery);
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', result }]);
      setError(null);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyze(query);
  };

  const handleRenameColumn = (original: string) => {
    const newName = prompt(`Rename column "${original}" to:`, columnAliases[original] || original);
    if (newName && newName !== original) {
      setColumnAliases(prev => ({ ...prev, [original]: newName }));
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: 'var(--font-primary)' }}>

      {/* ── Header ── */}
      <header style={{
        background: '#010120',
        color: '#fff',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #bdbbff, #010120)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={14} color="#bdbbff" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.3px', color: '#fff' }}>
            Dataset Playground
          </span>
          <span className="badge-dark" style={{ marginLeft: 4 }}>AI Analyst</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {dataset && (
            <>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05px', textTransform: 'uppercase' }}>
                {dataset.filename}
              </span>
              <button
                className="btn-glass"
                onClick={() => setDataset(null)}
                style={{ fontSize: '12px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCcw size={12} />
                New Report
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {!dataset ? (
          /* ── Upload Screen ── */
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }} className="animate-in">
              {/* Pastel decoration blob */}
              <div className="hero-gradient" style={{ borderRadius: '50%', width: 180, height: 180, margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={48} color="#bdbbff" />
              </div>

              <h1 className="type-heading" style={{ marginBottom: '12px' }}>
                Chat with your data
              </h1>
              <p className="type-caption" style={{ color: 'rgba(0,0,0,0.5)', marginBottom: '40px', lineHeight: 1.6 }}>
                Upload a CSV dataset and ask anything — get instant answers, charts, and dashboards powered by AI.
              </p>

              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(err) => setError(err)}
              />

              {error && (
                <div className="card-sharp animate-in" style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,44,193,0.04)', borderColor: 'rgba(239,44,193,0.15)', color: '#b91c1c', fontSize: '14px', textAlign: 'left' }}>
                  ⚠ {error}
                </div>
              )}
            </div>
          </main>
        ) : (
          <>
            {/* ── Sidebar ── */}
            <aside className="sidebar" style={{ width: 264, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', padding: '24px 0' }}>

              {/* Dataset card */}
              <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', marginBottom: 12 }}>Dataset</p>
                <div className="card-sharp" style={{ padding: '12px 14px', marginBottom: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '-0.13px', marginBottom: 8, wordBreak: 'break-all' }}>{dataset.filename}</p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)' }}>Rows</p>
                      <p style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '-0.4px', lineHeight: 1.2 }}>{dataset.row_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)' }}>Cols</p>
                      <p style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '-0.4px', lineHeight: 1.2 }}>{dataset.columns.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields list */}
              <div style={{ padding: '20px 20px 0', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)' }}>Fields</p>
                  <p style={{ fontSize: '10px', color: 'rgba(0,0,0,0.3)', fontFamily: 'var(--font-mono)' }}>click to rename</p>
                </div>
                <div className="card-sharp" style={{ overflow: 'hidden' }}>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {dataset.columns.map((col, i) => (
                      <div
                        key={col}
                        onClick={() => handleRenameColumn(col)}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                          transition: 'background 0.1s',
                          fontSize: '12px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: columnAliases[col] ? '#bdbbff' : 'rgba(0,0,0,0.15)', flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {columnAliases[col] ? (
                            <span>
                              <span style={{ color: '#010120', fontWeight: 500 }}>{columnAliases[col]}</span>
                              <span style={{ fontSize: '10px', color: 'rgba(0,0,0,0.35)', fontStyle: 'italic', marginLeft: 4 }}>({col})</span>
                            </span>
                          ) : col}
                        </span>
                        <Settings2 size={11} color="rgba(0,0,0,0.2)" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data preview */}
              <div style={{ padding: '20px 20px 0', borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 20 }}>
                <DataPreview
                  filename={dataset.filename}
                  rowCount={dataset.row_count}
                  columns={dataset.columns}
                  preview={dataset.preview}
                />
              </div>

              {/* Transform button */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 8 }}>
                <button
                  className="btn-outline"
                  onClick={() => setShowTransform(true)}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '8px 12px' }}
                >
                  <Sliders size={13} />
                  Transform Data
                </button>
              </div>
            </aside>

            {/* ── Chat area ── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fafafa', borderLeft: '1px solid rgba(0,0,0,0.06)' }}>

              {/* Scrollable messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
                <div style={{ maxWidth: 760, margin: '0 auto' }}>
                  {messages.length === 0 ? (
                    /* ── Empty state ── */
                    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 24 }}>
                      <div className="hero-gradient" style={{ borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={28} color="#010120" />
                      </div>
                      <div>
                        <p className="type-subheading" style={{ marginBottom: 6 }}>Ask anything about your data</p>
                        <p className="type-caption" style={{ color: 'rgba(0,0,0,0.45)' }}>
                          I can answer questions, generate charts, and build dashboards.
                        </p>
                      </div>
                      {/* Suggestion chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 520 }}>
                        {SUGGESTION_PROMPTS.map(s => (
                          <button
                            key={s}
                            onClick={() => handleAnalyze(s)}
                            className="btn-outline"
                            style={{ fontSize: '13px', padding: '6px 14px', letterSpacing: '-0.13px' }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ChatFeed
                      messages={messages}
                      allColumns={dataset.columns}
                      columnAliases={columnAliases}
                      datasetId={dataset.id}
                      rowCount={dataset.row_count}
                      filename={dataset.filename}
                    />
                  )}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="animate-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 16 }}>
                      <div style={{ width: 32, height: 32, background: '#010120', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Loader2 size={14} color="#bdbbff" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                      <div className="card-sharp" style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 20 }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{
                              width: 6, height: 6, borderRadius: '50%', background: '#bdbbff',
                              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              </div>

              {/* ── Sticky Chat Input ── */}
              <div style={{
                flexShrink: 0,
                borderTop: '1px solid rgba(0,0,0,0.08)',
                background: '#fff',
                padding: '16px 40px 20px',
              }}>
                <div style={{ maxWidth: 760, margin: '0 auto' }}>
                  {error && (
                    <div className="card-sharp animate-in" style={{ marginBottom: 10, padding: '8px 14px', background: 'rgba(239,44,193,0.04)', borderColor: 'rgba(239,44,193,0.12)', color: '#b91c1c', fontSize: '13px' }}>
                      ⚠ {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 0, boxShadow: 'rgba(1, 1, 32, 0.10) 0px 4px 10px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.10)' }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      disabled={isLoading}
                      placeholder="Ask anything — 'What is the average price?', 'Generate a flowchart', 'Make a dashboard'..."
                      style={{
                        flex: 1,
                        padding: '14px 18px',
                        border: 'none',
                        outline: 'none',
                        fontSize: '15px',
                        fontFamily: 'var(--font-primary)',
                        letterSpacing: '-0.16px',
                        background: '#fff',
                        color: '#000',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !query.trim()}
                      style={{
                        padding: '14px 22px',
                        background: '#010120',
                        color: '#fff',
                        border: 'none',
                        cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer',
                        opacity: isLoading || !query.trim() ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '14px',
                        fontFamily: 'var(--font-primary)',
                        fontWeight: 500,
                        letterSpacing: '-0.14px',
                        transition: 'opacity 0.15s',
                        flexShrink: 0,
                      }}
                    >
                      {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
                      Ask
                    </button>
                  </form>
                  <p className="mono-label" style={{ color: 'rgba(0,0,0,0.3)', marginTop: 8, textAlign: 'center' }}>
                    AI-powered · {dataset.filename} · {dataset.row_count.toLocaleString()} rows
                  </p>
                </div>
              </div>
            </main>
          </>
        )}
      </div>

      {/* Transform Panel overlay */}
      {showTransform && dataset && (
        <TransformPanel
          datasetId={dataset.id}
          columns={dataset.columns}
          columnTypes={dataset.column_types || {}}
          onClose={() => setShowTransform(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

export default App;
