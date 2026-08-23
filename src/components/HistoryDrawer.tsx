import React from 'react';
import { History, FileText, FileSpreadsheet, Trash2, Clock } from 'lucide-react';
import { ScannedDocumentHistory } from '../types';

interface HistoryDrawerProps {
  history: ScannedDocumentHistory[];
  onSelectHistory: (item: ScannedDocumentHistory) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#00FF88]" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Digitalizações Recentes ({history.length})
          </h4>
        </div>
        <button
          onClick={onClearHistory}
          className="text-[11px] font-mono text-white/40 hover:text-rose-400 flex items-center gap-1 transition-colors uppercase"
        >
          <Trash2 className="w-3 h-3" />
          <span>Limpar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectHistory(item)}
            className="flex items-center gap-2.5 p-2 rounded-xl border border-white/10 bg-[#161616] hover:border-[#00FF88]/50 hover:bg-[#1C1C1C] cursor-pointer transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-lg bg-[#0A0A0A] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
              ) : item.type === 'excel' ? (
                <FileSpreadsheet className="w-5 h-5 text-[#00FF88]" />
              ) : (
                <FileText className="w-5 h-5 text-blue-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-mono font-bold text-white truncate group-hover:text-[#00FF88] transition-colors">
                {item.title}
              </h5>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 mt-0.5">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span
                  className={`font-semibold px-1 rounded ${
                    item.type === 'excel' ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {item.type.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
