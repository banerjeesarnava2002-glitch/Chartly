import React, { useState } from 'react';
import { Filter, BarChart2, LayoutGrid, Plus, Trash2, Play, Download, X, ChevronDown } from 'lucide-react';
import { transformDataset } from '../lib/api';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Tab = 'filter' | 'aggregate' | 'pivot';

interface FilterRow {
  id: number;
  column: string;
  operator: string;
  value: string;
}

interface TransformResult {
  data: Record<string, unknown>[];
  row_count: number;
  col_count: number;
  columns: string[];
}

interface TransformPanelProps {
  datasetId: number;
  columns: string[];
  columnTypes: Record<string, string>;
  onClose: () => void;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const OPERATORS = [
  { value: 'eq',           label: '= equals' },
  { value: 'neq',          label: '≠ not equals' },
  { value: 'contains',     label: '⊃ contains' },
  { value: 'not_contains', label: '⊄ not contains' },
  { value: 'gt',           label: '> greater than' },
  { value: 'gte',          label: '≥ greater or equal' },
  { value: 'lt',           label: '< less than' },
  { value: 'lte',          label: '≤ less or equal' },
];

const AGG_FUNCS = [
  { value: 'sum',   label: 'Sum' },
  { value: 'mean',  label: 'Mean (avg)' },
  { value: 'count', label: 'Count' },
  { value: 'min',   label: 'Min' },
  { value: 'max',   label: 'Max' },
  { value: 'std',   label: 'Std Dev' },
];

const PIVOT_AGG_FUNCS = AGG_FUNCS.filter(f => f.value !== 'std');

let _rowId = 1;

function copyAsCsv(columns: string[], data: Record<string, unknown>[]) {
  const header = columns.join(',');
  const rows = data.map(r => columns.map(c => JSON.stringify(r[c] ?? '')).join(','));
  const csv = [header, ...rows].join('\n');
  navigator.clipboard.writeText(csv).catch(() => {});
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

const SelectBox: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  style?: React.CSSProperties;
}> = ({ value, onChange, options, placeholder, style }) => (
  <div style={{ position: 'relative', display: 'inline-block', ...style }}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        appearance: 'none',
        WebkitAppearance: 'none',
        width: '100%',
        padding: '7px 28px 7px 10px',
        fontSize: '13px',
        fontFamily: 'var(--font-primary)',
        letterSpacing: '-0.13px',
        border: '1px solid rgba(0,0,0,0.10)',
        borderRadius: '4px',
        background: '#fff',
        color: value ? '#000' : 'rgba(0,0,0,0.4)',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <ChevronDown
      size={12}
      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(0,0,0,0.4)' }}
    />
  </div>
);

const ResultTable: React.FC<{ columns: string[]; data: Record<string, unknown>[]; rowCount: number }> = ({
  columns, data, rowCount,
}) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span className="mono-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
        {rowCount.toLocaleString()} rows · {columns.length} columns
      </span>
      <button
        className="btn-outline"
        style={{ fontSize: '11px', padding: '4px 10px' }}
        onClick={() => copyAsCsv(columns, data)}
      >
        <Download size={11} /> Copy CSV
      </button>
    </div>
    <div style={{ overflowX: 'auto', maxHeight: 380, border: '1px solid rgba(0,0,0,0.08)', borderRadius: '4px' }}>
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: columns.length * 100 }}>
        <thead style={{ background: '#fafafa', position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            {columns.map(col => (
              <th
                key={col}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                  borderRight: '1px solid rgba(0,0,0,0.05)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.05px',
                  textTransform: 'uppercase',
                  color: 'rgba(0,0,0,0.5)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 200).map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              {columns.map((col, j) => (
                <td
                  key={j}
                  style={{
                    padding: '6px 12px',
                    borderRight: '1px solid rgba(0,0,0,0.04)',
                    color: 'rgba(0,0,0,0.75)',
                    whiteSpace: 'nowrap',
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {row[col] === null || row[col] === undefined ? '—' : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {data.length > 200 && (
      <p style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
        Showing 200 of {rowCount.toLocaleString()} rows. Copy CSV for full results.
      </p>
    )}
  </div>
);

/* ─── Filter Tab ─────────────────────────────────────────────────────────── */

const FilterTab: React.FC<{
  datasetId: number;
  columns: string[];
}> = ({ datasetId, columns }) => {
  const [rows, setRows] = useState<FilterRow[]>([{ id: _rowId++, column: '', operator: 'eq', value: '' }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => setRows(prev => [...prev, { id: _rowId++, column: '', operator: 'eq', value: '' }]);
  const removeRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));
  const updateRow = (id: number, patch: Partial<FilterRow>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const handleRun = async () => {
    const validFilters = rows.filter(r => r.column && r.value !== '');
    if (!validFilters.length) {
      setError('Add at least one filter condition with a column and value.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await transformDataset(datasetId, 'filter', {
        filters: validFilters.map(r => ({ column: r.column, operator: r.operator, value: r.value })),
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Filter failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const colOptions = columns.map(c => ({ value: c, label: c }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row, idx) => (
          <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
            {idx === 0 && (
              <>
                <span className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', gridColumn: '1' }}>Column</span>
                <span className="mono-label" style={{ color: 'rgba(0,0,0,0.4)' }}>Condition</span>
                <span className="mono-label" style={{ color: 'rgba(0,0,0,0.4)' }}>Value</span>
                <span />
              </>
            )}
            <SelectBox
              value={row.column}
              onChange={v => updateRow(row.id, { column: v })}
              options={colOptions}
              placeholder="Select column"
            />
            <SelectBox
              value={row.operator}
              onChange={v => updateRow(row.id, { operator: v })}
              options={OPERATORS}
            />
            <input
              type="text"
              value={row.value}
              onChange={e => updateRow(row.id, { value: e.target.value })}
              placeholder="Value…"
              style={{
                padding: '7px 10px',
                fontSize: '13px',
                fontFamily: 'var(--font-primary)',
                letterSpacing: '-0.13px',
                border: '1px solid rgba(0,0,0,0.10)',
                borderRadius: '4px',
                outline: 'none',
                width: '100%',
              }}
            />
            <button
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
                opacity: rows.length === 1 ? 0.2 : 0.5,
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              title="Remove condition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn-outline" style={{ fontSize: '13px', padding: '6px 12px' }} onClick={addRow}>
          <Plus size={13} /> Add condition
        </button>
        <button
          className="btn-primary"
          style={{ fontSize: '13px', padding: '7px 18px', marginLeft: 'auto' }}
          onClick={handleRun}
          disabled={loading}
        >
          <Play size={13} />
          {loading ? 'Filtering…' : 'Apply Filter'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: 'rgba(239,44,193,0.04)', border: '1px solid rgba(239,44,193,0.15)', borderRadius: '4px', fontSize: '12px', color: '#b91c1c' }}>
          ⚠ {error}
        </div>
      )}

      {result && (
        <ResultTable columns={result.columns} data={result.data} rowCount={result.row_count} />
      )}
    </div>
  );
};

/* ─── Aggregate Tab ──────────────────────────────────────────────────────── */

const AggregateTab: React.FC<{
  datasetId: number;
  columns: string[];
  columnTypes: Record<string, string>;
}> = ({ datasetId, columns, columnTypes }) => {
  const [groupBy, setGroupBy] = useState<string[]>([columns[0] || '']);
  const [aggCol, setAggCol] = useState('__count__');
  const [aggFunc, setAggFunc] = useState('sum');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const numericCols = columns.filter(c => {
    const t = (columnTypes[c] || '').toLowerCase();
    return t.includes('int') || t.includes('float') || t.includes('double');
  });

  const colOptions = columns.map(c => ({ value: c, label: c }));
  const aggColOptions = [
    { value: '__count__', label: '— Row count —' },
    ...numericCols.map(c => ({ value: c, label: c })),
  ];
  const currentAggFuncs = aggCol === '__count__'
    ? [{ value: 'count', label: 'Count' }]
    : AGG_FUNCS;

  const handleRun = async () => {
    const validGroupBy = groupBy.filter(Boolean);
    if (!validGroupBy.length) {
      setError('Select at least one Group By column.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await transformDataset(datasetId, 'aggregate', {
        group_by: validGroupBy,
        agg_col: aggCol,
        agg_func: aggCol === '__count__' ? 'count' : aggFunc,
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Aggregation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Group By */}
        <div>
          <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>Group By</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {groupBy.map((col, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <SelectBox
                  value={col}
                  onChange={v => {
                    const next = [...groupBy];
                    next[i] = v;
                    setGroupBy(next);
                  }}
                  options={colOptions}
                  placeholder="Select column"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => setGroupBy(prev => prev.filter((_, j) => j !== i))}
                  disabled={groupBy.length === 1}
                  style={{ background: 'transparent', border: 'none', cursor: groupBy.length === 1 ? 'not-allowed' : 'pointer', opacity: groupBy.length === 1 ? 0.2 : 0.5, padding: 4, display: 'flex' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {groupBy.length < 4 && (
              <button className="btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setGroupBy(prev => [...prev, ''])}>
                <Plus size={11} /> Add column
              </button>
            )}
          </div>
        </div>

        {/* Aggregate column */}
        <div>
          <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>Aggregate Column</p>
          <SelectBox value={aggCol} onChange={v => { setAggCol(v); if (v === '__count__') setAggFunc('count'); }} options={aggColOptions} style={{ width: '100%' }} />
        </div>

        {/* Function */}
        <div>
          <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>Function</p>
          <SelectBox value={aggFunc} onChange={setAggFunc} options={currentAggFuncs} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary" style={{ fontSize: '13px', padding: '7px 18px' }} onClick={handleRun} disabled={loading}>
          <Play size={13} />
          {loading ? 'Computing…' : 'Run Aggregation'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: 'rgba(239,44,193,0.04)', border: '1px solid rgba(239,44,193,0.15)', borderRadius: '4px', fontSize: '12px', color: '#b91c1c' }}>
          ⚠ {error}
        </div>
      )}

      {result && (
        <ResultTable columns={result.columns} data={result.data} rowCount={result.row_count} />
      )}
    </div>
  );
};

/* ─── Pivot Tab ──────────────────────────────────────────────────────────── */

const PivotTab: React.FC<{
  datasetId: number;
  columns: string[];
  columnTypes: Record<string, string>;
}> = ({ datasetId, columns, columnTypes }) => {
  const [indexCol, setIndexCol] = useState(columns[0] || '');
  const [columnsCol, setColumnsCol] = useState(columns[1] || '');
  const [valuesCol, setValuesCol] = useState('');
  const [aggFunc, setAggFunc] = useState('sum');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const numericCols = columns.filter(c => {
    const t = (columnTypes[c] || '').toLowerCase();
    return t.includes('int') || t.includes('float') || t.includes('double');
  });

  const colOptions = columns.map(c => ({ value: c, label: c }));
  const valueOptions = numericCols.map(c => ({ value: c, label: c }));

  const handleRun = async () => {
    if (!indexCol || !columnsCol || !valuesCol) {
      setError('Please select all three pivot fields: Index, Columns, and Values.');
      return;
    }
    if (indexCol === columnsCol) {
      setError('Index and Columns must be different fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await transformDataset(datasetId, 'pivot', {
        index: indexCol,
        columns: columnsCol,
        values: valuesCol,
        agg_func: aggFunc,
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Pivot failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Pivot Config */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        <div>
          <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>Row (Index)</p>
          <SelectBox value={indexCol} onChange={setIndexCol} options={colOptions} placeholder="Select column" style={{ width: '100%' }} />
        </div>
        <div>
          <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>Column Headers</p>
          <SelectBox value={columnsCol} onChange={setColumnsCol} options={colOptions} placeholder="Select column" style={{ width: '100%' }} />
        </div>
        <div>
          <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>Values</p>
          <SelectBox
            value={valuesCol}
            onChange={setValuesCol}
            options={valueOptions}
            placeholder={numericCols.length ? 'Select numeric col' : 'No numeric columns'}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <p className="mono-label" style={{ color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>Aggregate</p>
          <SelectBox value={aggFunc} onChange={setAggFunc} options={PIVOT_AGG_FUNCS} style={{ width: '100%' }} />
        </div>
      </div>

      {/* Hint */}
      <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.4)', fontFamily: 'var(--font-mono)', margin: 0 }}>
        Tip: Choose a low-cardinality column as "Column Headers" for best results (e.g. Region, Status, Category).
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary" style={{ fontSize: '13px', padding: '7px 18px' }} onClick={handleRun} disabled={loading}>
          <Play size={13} />
          {loading ? 'Pivoting…' : 'Generate Pivot'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: 'rgba(239,44,193,0.04)', border: '1px solid rgba(239,44,193,0.15)', borderRadius: '4px', fontSize: '12px', color: '#b91c1c' }}>
          ⚠ {error}
        </div>
      )}

      {result && (
        <ResultTable columns={result.columns} data={result.data} rowCount={result.row_count} />
      )}
    </div>
  );
};

/* ─── Main Panel ──────────────────────────────────────────────────────────── */

export const TransformPanel: React.FC<TransformPanelProps> = ({
  datasetId,
  columns,
  columnTypes,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('filter');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'filter',    label: 'Filter',    icon: <Filter size={13} /> },
    { id: 'aggregate', label: 'Aggregate', icon: <BarChart2 size={13} /> },
    { id: 'pivot',     label: 'Pivot',     icon: <LayoutGrid size={13} /> },
  ];

  return (
    /* Full-screen overlay */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-in"
        style={{
          width: '100%',
          maxWidth: '100%',
          maxHeight: '80vh',
          background: '#fff',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'rgba(1,1,32,0.25) 0px -8px 32px',
          overflow: 'hidden',
        }}
      >
        {/* Panel header */}
        <div style={{
          background: '#010120',
          color: '#fff',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <Filter size={16} color="#bdbbff" />
            <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.3px' }}>Data Transformation</span>
            <span className="badge-dark" style={{ marginLeft: 4 }}>β</span>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.08)', padding: 3, borderRadius: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-primary)',
                  fontWeight: activeTab === tab.id ? 500 : 400,
                  letterSpacing: '-0.12px',
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.55)',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 4, display: 'flex', marginLeft: 8 }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {activeTab === 'filter' && (
            <FilterTab datasetId={datasetId} columns={columns} />
          )}
          {activeTab === 'aggregate' && (
            <AggregateTab datasetId={datasetId} columns={columns} columnTypes={columnTypes} />
          )}
          {activeTab === 'pivot' && (
            <PivotTab datasetId={datasetId} columns={columns} columnTypes={columnTypes} />
          )}
        </div>
      </div>
    </div>
  );
};
