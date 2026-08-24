import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';

interface DocumentRefinerProps {
  onRefine: (instruction: string) => Promise<void>;
  isLoading: boolean;
}

export const DocumentRefiner: React.FC<DocumentRefinerProps> = ({ onRefine, isLoading }) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isLoading) return;
    const prompt = instruction.trim();
    setInstruction('');
    await onRefine(prompt);
  };

  const quickPrompts = [
    'Padronizar todos os valores com R$ e 2 decimais',
    'Adicionar cabeçalho e rodapé formal',
    'Traduzir resumo para Inglês',
    'Reordenar tabela por data crescente',
  ];

  return (
    <div className="bg-[#111111] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00FF88]" />
          <h4 className="text-xs sm:text-sm font-bold font-mono tracking-tight text-white uppercase">
            Assistente de Refinamento com IA
          </h4>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1A1A1A] text-[#00FF88] border border-white/10">
          GEMINI 2.5 FLASH
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Ex: 'Padronizar todos os valores para R$', 'Destacar cláusula 3ª em negrito'..."
          className="w-full bg-[#181818] text-white placeholder-white/40 text-xs sm:text-sm py-2.5 pl-3.5 pr-24 rounded-xl border border-white/10 focus:outline-none focus:border-[#00FF88]/50 focus:ring-1 focus:ring-[#00FF88]/50 transition-all font-mono"
        />
        <button
          type="submit"
          disabled={!instruction.trim() || isLoading}
          className="absolute right-1.5 px-3.5 py-1.5 bg-[#00FF88] hover:bg-[#00FF88]/90 disabled:opacity-30 text-black text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,255,136,0.25)]"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <span>Aplicar</span>
              <Send className="w-3 h-3" />
            </>
          )}
        </button>
      </form>

      {/* Quick suggestions pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-mono text-white/40 mr-1 uppercase">Sugestões:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onRefine(p)}
            className="text-[11px] font-mono bg-[#181818] hover:bg-[#222222] hover:text-[#00FF88] text-white/70 px-2.5 py-1 rounded-lg border border-white/10 hover:border-[#00FF88]/40 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
