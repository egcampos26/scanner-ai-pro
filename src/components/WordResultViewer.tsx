import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  FileText,
  Download,
  Copy,
  Check,
  Edit3,
  Eye,
  Columns,
  AlertTriangle,
  FileCheck,
  Stamp,
  PenTool,
} from 'lucide-react';
import { ScanResultData } from '../types';
import { exportToWordDocx, exportToWordVisual } from '../utils/exportUtils';

interface WordResultViewerProps {
  result: ScanResultData;
  onUpdateContent: (newMarkdown: string) => void;
}

export const WordResultViewer: React.FC<WordResultViewerProps> = ({
  result,
  onUpdateContent,
}) => {
  const [markdown, setMarkdown] = useState<string>(result.markdownContent || '');
  const [viewMode, setViewMode] = useState<'rendered' | 'edit' | 'split'>('rendered');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);
  const incomprehensibleMatches = (markdown.match(/\[INCOMPREENSÍVEL\]/g) || []).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      await exportToWordDocx(markdown, result.documentTitle || 'Documento_Contrato', {
        classification: result.documentClassification,
        language: result.language,
        incomprehensibleCount: incomprehensibleMatches,
      });
    } catch (e) {
      console.error('Export docx error:', e);
      alert('Erro ao gerar arquivo Word (.docx).');
    } finally {
      setIsExporting(false);
    }
  };

  const isVisualMode = !!result.wordHtml;

  const handleChangeText = (newVal: string) => {
    if (isVisualMode) return; // Cannot edit raw HTML in simple text area safely
    setMarkdown(newVal);
    onUpdateContent(newVal);
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Action Bar */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {result.documentTitle || 'Documento de Texto'}
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Word (.doc{isVisualMode ? '' : 'x'})
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-white/50 mt-0.5">
              {!isVisualMode && (
                <>
                  <span>{wordCount} palavras</span>
                  <span>•</span>
                  <span>~{readingTime} min de leitura</span>
                  <span>•</span>
                </>
              )}
              <span>Precisão: <strong className="text-[#00FF88]">{result.confidenceScore}%</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View mode toggles */}
          {!isVisualMode && (
            <div className="bg-[#181818] border border-white/10 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('rendered')}
                className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                  viewMode === 'rendered'
                    ? 'bg-[#262626] text-white shadow-sm border border-white/15 font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Visualização Formatada"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visualizar</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                  viewMode === 'edit'
                    ? 'bg-[#262626] text-white shadow-sm border border-white/15 font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Editor Markdown"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                  viewMode === 'split'
                    ? 'bg-[#262626] text-white shadow-sm border border-white/15 font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Visualização Dividida"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dividido</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 text-xs font-mono font-medium text-white/80 bg-[#1A1A1A] border border-white/10 hover:bg-[#222222] hover:text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00FF88]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar MD'}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportDocx}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold text-black bg-[#00FF88] hover:bg-[#00FF88]/90 active:scale-[0.98] rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.25)] flex items-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>{isExporting ? 'Gerando...' : `Baixar Word (.doc${isVisualMode ? '' : 'x'})`}</span>
          </button>
        </div>
      </div>

      {/* Detection Badges Strip */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        {result.elementsDetected?.hasSignatures && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <PenTool className="w-3.5 h-3.5" />
            Assinaturas Detectadas ({result.elementsDetected.signaturesCount || 'Sim'})
          </span>
        )}

        {result.elementsDetected?.hasStamps && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Stamp className="w-3.5 h-3.5" />
            Carimbos/Selos Detectados ({result.elementsDetected.stampsCount || 'Sim'})
          </span>
        )}

        {incomprehensibleMatches > 0 ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/70 text-rose-300 border border-rose-500/40 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {incomprehensibleMatches} trecho(s) com [INCOMPREENSÍVEL] (Zero Alucinação)
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30">
            <FileCheck className="w-3.5 h-3.5" />
            Leitura 100% legível (Sem rasuras)
          </span>
        )}
      </div>

      {/* Document Viewport */}
      <div className="bg-[#0E0E0E] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {isVisualMode ? (
          <div className="p-8 sm:p-12 max-w-4xl mx-auto min-h-[550px] bg-white">
            <div 
              className="text-black"
              dangerouslySetInnerHTML={{ __html: result.wordHtml || '' }} 
            />
          </div>
        ) : viewMode === 'split' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 min-h-[500px]">
            {/* Editor Pane */}
            <div className="p-4 flex flex-col bg-[#111111]">
              <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Editor Markdown Puro</span>
                <span className="text-[#00FF88]">Live Sync</span>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => handleChangeText(e.target.value)}
                className="w-full flex-1 min-h-[460px] font-mono text-xs text-white bg-[#0A0A0A] p-3.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#00FF88]/50 focus:ring-1 focus:ring-[#00FF88]/50 resize-none leading-relaxed"
              />
            </div>

            {/* Formatted Preview Pane */}
            <div className="p-6 overflow-y-auto max-h-[600px] bg-[#0E0E0E]">
              <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-4">
                Visualização Formatada
              </div>
              <div className="prose prose-invert max-w-none text-sm text-white/90 leading-relaxed font-sans">
                <Markdown>{markdown}</Markdown>
              </div>
            </div>
          </div>
        ) : viewMode === 'edit' ? (
          <div className="p-4 bg-[#111111]">
            <textarea
              value={markdown}
              onChange={(e) => handleChangeText(e.target.value)}
              className="w-full min-h-[520px] font-mono text-xs text-white bg-[#0A0A0A] p-4 rounded-xl border border-white/10 focus:outline-none focus:border-[#00FF88]/50 focus:ring-1 focus:ring-[#00FF88]/50 resize-y leading-relaxed"
            />
          </div>
        ) : (
          /* Rendered Page View styled like a dark luxury doc */
          <div className="p-8 sm:p-12 max-w-3xl mx-auto min-h-[550px] bg-[#0E0E0E]">
            <div className="prose prose-invert max-w-none text-[#E8E8E8] leading-relaxed font-serif text-base">
              <Markdown>{markdown}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
