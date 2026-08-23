import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, FileSpreadsheet, Sparkles, CheckCircle2, ArrowRight, ShieldAlert, Cpu, Layers } from 'lucide-react';
import { ScanFlow, SampleDoc } from '../types';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';

interface ScannerUploaderProps {
  onImageSelected: (imageDataUrl: string, targetFlow: ScanFlow, sampleInfo?: SampleDoc) => void;
  onOpenCamera: () => void;
  isLoading: boolean;
}

export const ScannerUploader: React.FC<ScannerUploaderProps> = ({
  onImageSelected,
  onOpenCamera,
  isLoading,
}) => {
  const [selectedFlow, setSelectedFlow] = useState<ScanFlow>('auto');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onImageSelected(dataUrl, selectedFlow);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSelectSample = (sample: SampleDoc) => {
    const sampleDataUrl = sample.generateImage();
    const flow: ScanFlow = sample.category === 'excel' ? 'excel' : 'word';
    onImageSelected(sampleDataUrl, flow, sample);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Target Flow Selection Tabs */}
      <div className="bg-[#121212] p-1.5 rounded-xl border border-white/10 flex flex-wrap sm:flex-nowrap gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedFlow('auto')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            selectedFlow === 'auto'
              ? 'bg-[#222222] text-white shadow-sm border border-white/15 font-semibold'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#00FF88]" />
          <span>Auto-Detectar Tipo</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFlow('word')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            selectedFlow === 'word'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-white/60 hover:text-blue-400 hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Fluxo A: Word (.docx)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFlow('excel')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            selectedFlow === 'excel'
              ? 'bg-[#00FF88] text-black shadow-sm font-bold shadow-[0_0_12px_rgba(0,255,136,0.25)]'
              : 'text-white/60 hover:text-[#00FF88] hover:bg-white/5'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Fluxo B: Excel (.xlsx)</span>
        </button>
      </div>

      {/* Main Upload Dropzone with HUD Brackets */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 bg-[#0D0D0D] overflow-hidden ${
          isDragging
            ? 'border-[#00FF88] bg-[#00FF88]/5 scale-[1.005]'
            : 'border-white/15 hover:border-[#00FF88]/50 hover:bg-[#111111]'
        }`}
      >
        {/* Futuristic HUD Corner Accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#00FF88]/40 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#00FF88]/40 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#00FF88]/40 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#00FF88]/40 pointer-events-none" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#181818] border border-white/10 flex items-center justify-center text-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.1)]">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Arraste seu documento ou clique para selecionar
            </h3>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              Suporta fotos de celular, digitalizações de mesa, faturas, contratos e notas fiscais (JPG, PNG, WEBP)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-5 py-2.5 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black text-xs sm:text-sm font-bold font-mono uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all active:scale-95"
            >
              Procurar Arquivo
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCamera();
              }}
              className="px-5 py-2.5 bg-[#1C1C1C] hover:bg-[#252525] text-white text-xs sm:text-sm font-medium rounded-lg border border-white/10 shadow-sm flex items-center gap-2 transition-colors font-mono uppercase text-[12px]"
            >
              <Camera className="w-4 h-4 text-[#00FF88]" />
              <span>Usar Câmera</span>
            </button>
          </div>
        </div>

        {/* System Capabilities Badges */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#141414] border border-white/5">
            <Layers className="w-4 h-4 text-[#00FF88] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-white font-mono uppercase">Modo CamScanner</div>
              <div className="text-[11px] text-white/40">Perspectiva plana, fundo #FFFFFF e contraste de mesa</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#141414] border border-white/5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-white font-mono uppercase">Zero Alucinação</div>
              <div className="text-[11px] text-white/40">Rasuras e ilegíveis marcados como [INCOMPREENSÍVEL]</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#141414] border border-white/5">
            <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-white font-mono uppercase">Exportação Direta</div>
              <div className="text-[11px] text-white/40">Word (.docx / Markdown) e Excel (.xlsx / JSON)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Sample Documents Section */}
      <div className="bg-[#0E0E0E] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white/70">
              Documentos de Demonstração Rápidos
            </h4>
            <p className="text-xs text-white/40">
              Teste o scanner, filtros de perspectiva e extração com 1 clique:
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#00FF88]/10 text-[#00FF88] rounded border border-[#00FF88]/30 uppercase tracking-widest">
            Prontos para Teste
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="group bg-[#151515] hover:bg-[#1A1A1A] border border-white/10 hover:border-[#00FF88]/40 rounded-xl p-3.5 text-left cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(0,255,136,0.08)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      sample.category === 'excel'
                        ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {sample.badge}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-[#00FF88] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <h5 className="text-xs font-bold text-white group-hover:text-[#00FF88] transition-colors">
                  {sample.title}
                </h5>
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40 group-hover:text-white/70">
                <span className="font-mono text-[10px]">1-CLICK LOAD</span>
                <span className="font-bold text-[#00FF88] font-mono text-[11px]">SCAN &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

