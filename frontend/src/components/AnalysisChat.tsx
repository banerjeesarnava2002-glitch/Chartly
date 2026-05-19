import React, { useState } from 'react';
import { Send, Sparkles, Loader2, History } from 'lucide-react';

interface AnalysisChatProps {
  onAnalyze: (query: string) => Promise<any>;
}

export const AnalysisChat: React.FC<AnalysisChatProps> = ({ onAnalyze }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const currentQuery = query.trim();
    setIsLoading(true);
    try {
      await onAnalyze(currentQuery);
      setHistory(prev => [currentQuery, ...prev].slice(0, 5));
      setQuery('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Sparkles className="w-5 h-5 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about your data — 'What is the average price?', 'Show a bar chart', 'Make a dashboard'..."
          className="w-full pl-12 pr-24 py-3.5 bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
          disabled={isLoading}
        />
        <div className="absolute inset-y-2 right-2 flex items-center">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="h-full px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Analyze</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
      
      {history.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center px-2">
          <div className="flex items-center gap-1 text-xs text-gray-400 mr-2">
            <History className="w-3 h-3" />
            <span>Recent queries:</span>
          </div>
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => setQuery(h)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
            >
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
