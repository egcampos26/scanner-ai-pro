import React, { useRef } from 'react';
import { Camera, FileText, Upload, Layers, Sparkles } from 'lucide-react';
import { AppMode } from '../types';

interface HomeMenuProps {
  onSelectMode: (mode: AppMode, files: File[]) => void;
  onOpenCamera: () => void;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({ onSelectMode, onOpenCamera }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedModeRef = useRef<AppMode>('scanner');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onSelectMode(selectedModeRef.current, files);
    }
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModeClick = (mode: AppMode) => {
    selectedModeRef.current = mode;
    if (fileInputRef.current) {
      fileInputRef.current.multiple = mode === 'reconstruct_pdf';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={
          selectedModeRef.current === 'scanner'
            ? 'image/*'
            : selectedModeRef.current === 'reconstruct_pdf'
            ? 'application/pdf'
            : 'image/*,application/pdf'
        }
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] rounded-full border border-white/10 text-[11px] font-mono text-[#00FF88] mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]" />
          FERRAMENTAS DE ALTA PRECISÃO
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Digitalizador Inteligente de Documentos & OCR
        </h1>
        <p className="text-base text-white/50 leading-relaxed max-w-lg mx-auto">
          Escolha uma ferramenta abaixo. Transforme fotos, extraia dados editáveis ou reconstrua relatórios oficiais completos sem perda de dados.
        </p>
      </div>

      {/* Three Action Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-0">
        
        {/* BUTTON 1: SCANNER */}
        <button
          onClick={() => handleModeClick('scanner')}
          className="group relative flex flex-col items-center justify-between p-8 rounded-3xl bg-[#111111] border border-white/10 hover:border-[#00FF88]/50 hover:bg-[#161616] transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(0,255,136,0.15)] text-center overflow-hidden min-h-[380px]"
        >
          {/* Neon Glow Accent */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00FF88]/20 blur-3xl rounded-full pointer-events-none group-hover:bg-[#00FF88]/30 transition-colors" />

          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-white/10 text-[#00FF88] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
            <Camera className="w-8 h-8" />
          </div>
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-xl font-bold text-white tracking-wide">
              Scanner de Fotos
            </h2>
            <p className="text-xs text-white/50 leading-relaxed max-w-[220px] mx-auto">
              Ajuste perspectiva e remova sombras de fotos de papel. Baixe uma imagem plana perfeita.
            </p>
          </div>
          
          <div className="flex items-center gap-2 mt-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#00FF88]/10 text-[#00FF88] font-mono text-xs font-bold rounded-lg border border-[#00FF88]/20 uppercase tracking-wider group-hover:bg-[#00FF88] group-hover:text-black transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Galeria
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCamera();
              }}
              className="inline-flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors"
              title="Abrir Câmera"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </button>

        {/* BUTTON 2: OCR (Word / Excel) */}
        <button
          onClick={() => handleModeClick('ocr')}
          className="group relative flex flex-col items-center justify-between p-8 rounded-3xl bg-[#111111] border border-white/10 hover:border-blue-500/50 hover:bg-[#161616] transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] text-center overflow-hidden min-h-[380px]"
        >
          {/* Blue Glow Accent */}
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-blue-500/30 transition-colors" />

          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-white/10 text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-8 h-8" />
          </div>
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-xl font-bold text-white tracking-wide">
              Conversor OCR
            </h2>
            <p className="text-xs text-white/50 leading-relaxed max-w-[220px] mx-auto">
              Extraia textos e tabelas avulsas de documentos e notas para Word (.docx) ou Excel (.xlsx).
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mt-2 bg-blue-500/10 text-blue-400 font-mono text-xs font-bold rounded-lg border border-blue-500/20 uppercase tracking-wider group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Abrir Arquivo
          </div>
        </button>

        {/* BUTTON 3: RECONSTRUTOR FIEL DE PDF (ERGON / PMSP) */}
        <button
          onClick={() => handleModeClick('reconstruct_pdf')}
          className="group relative flex flex-col items-center justify-between p-8 rounded-3xl bg-[#111111] border border-amber-500/30 hover:border-amber-400 hover:bg-[#161616] transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] text-center overflow-hidden min-h-[380px]"
        >
          {/* Amber Glow Accent */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-500/30 transition-colors" />

          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
            <Layers className="w-8 h-8" />
          </div>
          
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold uppercase mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Multi-Páginas & Lote
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Reconstrutor de PDF
            </h2>
            <p className="text-xs text-white/50 leading-relaxed max-w-[220px] mx-auto">
              Reconstrua relatórios do ERGON com layout idêntico. Selecione 1 ou vários PDFs para fila em lote e download automático.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mt-2 bg-amber-500/10 text-amber-400 font-mono text-xs font-bold rounded-lg border border-amber-500/30 uppercase tracking-wider group-hover:bg-amber-500 group-hover:text-black transition-colors">
            <Upload className="w-3.5 h-3.5" />
            PDFs do Windows (1 ou Vários)
          </div>
        </button>

      </div>
    </div>
  );
};
