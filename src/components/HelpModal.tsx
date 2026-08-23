import React from 'react';
import { X, CheckCircle2, ShieldCheck, Wand2, FileSpreadsheet, FileText, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111111] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl p-6 space-y-6 text-[#E0E0E0]">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-[#00FF88] border border-white/10 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold font-mono text-white text-base">Diretrizes do Sistema & Como Funciona</h3>
              <p className="text-xs font-mono text-white/50">DocScan AI • Multimodal Document Scanner & Converter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-white/70 leading-relaxed font-sans">
          {/* Section 1 */}
          <div className="p-3.5 rounded-xl bg-[#161616] border border-white/10">
            <h4 className="font-bold text-[#00FF88] text-xs flex items-center gap-2 mb-1.5 font-mono uppercase">
              <Wand2 className="w-4 h-4 text-[#00FF88]" />
              1. Processamento de Imagem & Modo CamScanner
            </h4>
            <p className="text-white/80">
              O motor simula aprimoramentos de visão computacional:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-white/70">
              <li><strong className="text-white">Correção de Perspectiva:</strong> Retifica documentos inclinados para uma folha retangular plana.</li>
              <li><strong className="text-white">Filtro 'Magic Color' / Scanner de Mesa:</strong> Remove sombras e amarelados, transformando o fundo em branco puro (#FFFFFF) e maximizando a nitidez dos textos.</li>
              <li><strong className="text-white">Preservação de Elementos:</strong> Mantém assinaturas de caneta azul/preta, carimbos de cartório e logotipos intactos.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#161616] border border-white/10">
              <h4 className="font-bold text-blue-400 text-xs flex items-center gap-1.5 mb-1 font-mono uppercase">
                <FileText className="w-4 h-4 text-blue-400" />
                Fluxo A: Word (.docx)
              </h4>
              <p className="text-white/50 mb-2 font-mono text-[11px]">
                Contratos, relatórios, termos e petições.
              </p>
              <ul className="list-disc list-inside space-y-1 text-white/70 text-[11px]">
                <li>Markdown puro e estruturado</li>
                <li>Títulos (#, ##, ###) e marcadores</li>
                <li>Exportação direta para Word (.docx)</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161616] border border-white/10">
              <h4 className="font-bold text-[#00FF88] text-xs flex items-center gap-1.5 mb-1 font-mono uppercase">
                <FileSpreadsheet className="w-4 h-4 text-[#00FF88]" />
                Fluxo B: Excel (.xlsx)
              </h4>
              <p className="text-white/50 mb-2 font-mono text-[11px]">
                Notas fiscais, faturas e extratos.
              </p>
              <ul className="list-disc list-inside space-y-1 text-white/70 text-[11px]">
                <li>JSON estruturado e CSV puro</li>
                <li>Preservação de decimais e moedas (R$)</li>
                <li>Exportação direta para Excel (.xlsx)</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
            <h4 className="font-bold text-rose-300 text-xs flex items-center gap-1.5 mb-1 font-mono uppercase">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              Diretriz de Zero Alucinação
            </h4>
            <p className="text-rose-200 text-[11px]">
              Se qualquer caractere, carimbo sobreposto ou número estiver rasurado ou ilegível, o modelo marca estritamente com a tag <code className="bg-black/60 px-1.5 py-0.5 rounded text-rose-400 font-bold border border-rose-500/40">[INCOMPREENSÍVEL]</code> no local exato em vez de inventar informações.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00FF88] text-black text-xs font-mono font-bold uppercase rounded-lg hover:bg-[#00FF88]/90 transition-colors shadow-[0_0_10px_rgba(0,255,136,0.2)]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
