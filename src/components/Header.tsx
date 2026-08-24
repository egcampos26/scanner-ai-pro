import React from 'react';
import { FileSpreadsheet, FileText, Sparkles, HelpCircle, RotateCcw, Cpu } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onOpenHelp }) => {
  return (
    <header className="border-b border-white/10 bg-[#111111]/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onReset}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#00FF88] rounded-lg flex items-center justify-center text-black font-bold shadow-[0_0_12px_rgba(0,255,136,0.35)] transition-transform hover:scale-105">
            <div className="w-4 h-4 border-2 border-black flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-black" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                SCANNER AI <span className="text-[#00FF88] font-black">PRO</span>
              </h1>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30">
                CamScanner & OCR
              </span>
            </div>
            <p className="text-[11px] text-white/40 hidden sm:block font-mono">
              Multimodal OCR Engine • Word (.docx) & Excel (.xlsx) • Zero Hallucination
            </p>
          </div>
        </div>

        {/* Mode Indicators & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Engine Active Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">
              Gemini Vision Engine Active
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161616] text-[11px] text-white/60 border border-white/10 font-mono">
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <FileText className="w-3.5 h-3.5" /> DOCX
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-[#00FF88] font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX
            </span>
          </div>

          <button
            onClick={onOpenHelp}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg border border-white/5 transition-colors"
            title="Diretrizes & Ajuda"
            aria-label="Ajuda e Diretrizes"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider text-black bg-[#00FF88] hover:bg-[#00FF88]/90 rounded-lg shadow-[0_0_12px_rgba(0,255,136,0.25)] transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">Novo Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
};

