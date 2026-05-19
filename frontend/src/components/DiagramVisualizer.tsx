import React from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

interface DiagramVisualizerProps {
  type: 'flowchart' | 'mindmap' | 'timeline' | 'venn' | 'process' | string;
  nodes: Node[];
  edges: Edge[];
}

const colorMap: Record<string, string> = {
  blue: '#E0E7FF',
  lavender: '#EDE9FE',
  magenta: '#FCE7F3',
  orange: '#FFEDD5',
  green: '#DCFCE7',
  default: '#F3F4F6'
};

const borderColorMap: Record<string, string> = {
  blue: '#818CF8',
  lavender: '#A78BFA',
  magenta: '#F472B6',
  orange: '#FB923C',
  green: '#4ADE80',
  default: '#9CA3AF'
};

const textColorMap: Record<string, string> = {
  blue: '#3730A3',
  lavender: '#4C1D95',
  magenta: '#831843',
  orange: '#7C2D12',
  green: '#14532D',
  default: '#111827'
};

export const DiagramVisualizer: React.FC<DiagramVisualizerProps> = ({ type, nodes, edges }) => {
  const renderNode = (node: Node, style: React.CSSProperties = {}) => {
    const bg = colorMap[node.color || 'default'] || colorMap.default;
    const border = borderColorMap[node.color || 'default'] || borderColorMap.default;
    const text = textColorMap[node.color || 'default'] || textColorMap.default;

    return (
      <div
        key={node.id}
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: '8px',
          padding: '12px 16px',
          minWidth: '140px',
          maxWidth: '200px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          ...style
        }}
      >
        <span style={{ color: text, fontWeight: 600, fontSize: '13px', marginBottom: node.description ? '4px' : '0' }}>
          {node.label}
        </span>
        {node.description && (
          <span style={{ color: text, opacity: 0.8, fontSize: '11px', lineHeight: 1.3 }}>
            {node.description}
          </span>
        )}
      </div>
    );
  };

  if (type === 'timeline' || type === 'process' || type === 'flowchart') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', padding: '24px' }}>
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            {renderNode(node)}
            {index < nodes.length - 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9CA3AF' }}>
                <ArrowRight size={20} />
                {edges.find(e => e.from === node.id)?.label && (
                  <span style={{ fontSize: '10px', marginTop: '4px' }}>
                    {edges.find(e => e.from === node.id)?.label}
                  </span>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (type === 'mindmap') {
    const centerNode = nodes[0];
    const childNodes = nodes.slice(1);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', gap: '32px' }}>
        {centerNode && renderNode(centerNode, { transform: 'scale(1.1)' })}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {childNodes.map(node => (
            <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <ArrowDown size={20} color="#9CA3AF" />
              {renderNode(node)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'venn') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', position: 'relative', height: '240px' }}>
        {nodes.map((node, index) => {
          const bg = colorMap[node.color || 'default'] || colorMap.default;
          const text = textColorMap[node.color || 'default'] || textColorMap.default;
          return (
            <div
              key={node.id}
              style={{
                background: bg,
                opacity: 0.85,
                borderRadius: '50%',
                width: '180px',
                height: '180px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                position: 'absolute',
                left: index === 0 ? 'calc(50% - 110px)' : 'calc(50% - 10px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                mixBlendMode: 'multiply'
              }}
            >
              <span style={{ color: text, fontWeight: 700, fontSize: '14px', zIndex: 10 }}>{node.label}</span>
              {node.description && <span style={{ color: text, fontSize: '11px', marginTop: '4px', padding: '0 10px', zIndex: 10 }}>{node.description}</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '24px' }}>
      {nodes.map(node => renderNode(node))}
    </div>
  );
};
