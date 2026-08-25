import React, { useRef } from 'react';
import { Camera, FileText, Upload } from 'lucide-react';
import { AppMode } from '../types';

interface HomeMenuProps {
  onSelectMode: (mode: AppMode, file: File) => void;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({ onSelectMode }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedModeRef = useRef<AppMode>('scanner');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectMode(selectedModeRef.current, file);
    }
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModeClick = (mode: AppMode) => {
    selectedModeRef.current = mode;
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={selectedModeRef.current === 'scanner' ? 'image/*' : 'image/*,application/pdf'}
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
          Escolha uma ferramenta abaixo. Transforme fotos em arquivos limpos ou extraia texto editável com zero alucinação.
        </p>
      </div>

      {/* Two Big Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-0">
        
        {/* BUTTON 1: SCANNER */}
        <button
          onClick={() => handleModeClick('scanner')}
          className="group relative flex flex-col items-center justify-center gap-6 p-10 rounded-3xl bg-[#111111] border border-white/10 hover:border-[#00FF88]/50 hover:bg-[#161616] transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(0,255,136,0.15)] text-center overflow-hidden"
        >
          {/* Neon Glow Accent */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00FF88]/20 blur-3xl rounded-full pointer-events-none group-hover:bg-[#00FF88]/30 transition-colors" />

          <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] border border-white/10 text-[#00FF88] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
            <Camera className="w-10 h-10" />
          </div>
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Scanner de Fotos
            </h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-[250px] mx-auto">
              Ajuste perspectiva e remova sombras de fotos de papel. Baixe uma imagem plana perfeita.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-[#00FF88]/10 text-[#00FF88] font-mono text-xs font-bold rounded-lg border border-[#00FF88]/20 uppercase tracking-wider group-hover:bg-[#00FF88] group-hover:text-black transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Escolher Foto
          </div>
        </button>

        {/* BUTTON 2: OCR */}
        <button
          onClick={() => handleModeClick('ocr')}
          className="group relative flex flex-col items-center justify-center gap-6 p-10 rounded-3xl bg-[#111111] border border-white/10 hover:border-blue-500/50 hover:bg-[#161616] transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] text-center overflow-hidden"
        >
          {/* Blue Glow Accent */}
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-blue-500/30 transition-colors" />

          <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] border border-white/10 text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-10 h-10" />
          </div>
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Conversor OCR (Word/Excel)
            </h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-[250px] mx-auto">
              Extraia textos e tabelas de PDFs ou Imagens para documentos editáveis com IA.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-blue-500/10 text-blue-400 font-mono text-xs font-bold rounded-lg border border-blue-500/20 uppercase tracking-wider group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Abrir Arquivo
          </div>
        </button>

      </div>
    </div>
  );
};
