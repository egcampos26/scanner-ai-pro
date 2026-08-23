/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScannerUploader } from './components/ScannerUploader';
import { CameraModal } from './components/CameraModal';
import { CamScannerStudio } from './components/CamScannerStudio';
import { WordResultViewer } from './components/WordResultViewer';
import { ExcelResultViewer } from './components/ExcelResultViewer';
import { DocumentRefiner } from './components/DocumentRefiner';
import { HelpModal } from './components/HelpModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import {
  ScanFlow,
  ScanResultData,
  ScannedDocumentHistory,
  SampleDoc,
  TableDataWrapper,
} from './types';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  Download,
} from 'lucide-react';

type AppStep = 'upload' | 'studio' | 'result';

export default function App() {
  const [step, setStep] = useState<AppStep>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [targetFlow, setTargetFlow] = useState<ScanFlow>('auto');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'word' | 'excel' | 'visual'>('word');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<ScannedDocumentHistory[]>([]);

  // Load history on start
  useEffect(() => {
    try {
      const saved = localStorage.getItem('docscan_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }
  }, []);

  const saveToHistory = (item: ScannedDocumentHistory) => {
    try {
      const updated = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 10);
      setHistory(updated);
      localStorage.setItem('docscan_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('docscan_history');
  };

  const handleImageSelected = (imageDataUrl: string, flow: ScanFlow, sampleInfo?: SampleDoc) => {
    setOriginalImage(imageDataUrl);
    setTargetFlow(flow);
    setErrorMessage(null);
    setStep('studio');
  };

  const handleProceedToOCR = async (enhancedImageDataUrl: string, flow: ScanFlow) => {
    setEnhancedImage(enhancedImageDataUrl);
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: enhancedImageDataUrl,
          targetFlow: flow,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao processar o documento com IA.');
      }

      const result: ScanResultData = resData.data;
      setScanResult(result);

      // Determine initial tab based on detected type or explicit flow
      if (flow === 'excel' || result.detectedType === 'excel') {
        setActiveResultTab('excel');
      } else {
        setActiveResultTab('word');
      }

      setStep('result');

      // Save to local history
      const historyItem: ScannedDocumentHistory = {
        id: `scan_${Date.now()}`,
        title: result.documentTitle || 'Documento Digitalizado',
        type: result.detectedType || (flow === 'excel' ? 'excel' : 'word'),
        timestamp: Date.now(),
        thumbnail: enhancedImageDataUrl,
        result: result,
        originalImage: originalImage || enhancedImageDataUrl,
        enhancedImage: enhancedImageDataUrl,
      };
      saveToHistory(historyItem);
    } catch (error: any) {
      console.error('Scan Error:', error);
      setErrorMessage(error?.message || 'Ocorreu um erro ao digitalizar o documento. Tente novamente.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRefineDocument = async (instruction: string) => {
    if (!scanResult) return;
    setIsRefining(true);
    setErrorMessage(null);

    try {
      const currentContent =
        activeResultTab === 'excel' ? scanResult.tableData : scanResult.markdownContent;

      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent,
          instruction,
          formatType: activeResultTab === 'excel' ? 'excel' : 'word',
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao refinar documento.');
      }

      const refined = resData.data;
      setScanResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          markdownContent: refined.updatedMarkdown || prev.markdownContent,
          tableData: refined.updatedTableData || prev.tableData,
        };
      });
    } catch (e: any) {
      console.error('Refine error:', e);
      setErrorMessage(e?.message || 'Falha ao refinar com IA.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSelectHistoryItem = (item: ScannedDocumentHistory) => {
    setOriginalImage(item.originalImage);
    setEnhancedImage(item.enhancedImage);
    setScanResult(item.result);
    setActiveResultTab(item.type === 'excel' ? 'excel' : 'word');
    setStep('result');
  };

  const handleReset = () => {
    setStep('upload');
    setOriginalImage(null);
    setEnhancedImage(null);
    setScanResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col font-sans selection:bg-[#00FF88] selection:text-black">
      {/* Top Navigation */}
      <Header onReset={handleReset} onOpenHelp={() => setIsHelpOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Error Alert Message */}
        {errorMessage && (
          <div className="bg-rose-950/70 border border-rose-500/40 text-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-lg backdrop-blur-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <div className="font-bold text-rose-300 font-mono uppercase text-xs">Erro no Processamento</div>
              <div>{errorMessage}</div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-mono font-bold text-rose-400 hover:text-rose-200 uppercase"
            >
              Fechar
            </button>
          </div>
        )}

        {/* STEP 1: Upload & Document Selector */}
        {step === 'upload' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] rounded-full border border-white/10 text-[11px] font-mono text-[#00FF88] mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]" />
                SCANNER & CONVERSOR MULTIMODAL
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Digitalizador Inteligente de Documentos & OCR
              </h1>
              <p className="text-sm text-white/50 leading-relaxed">
                Transforme fotos de documentos em arquivos limpos do <strong className="text-white">Microsoft Word (.docx)</strong> ou{' '}
                <strong className="text-white">Microsoft Excel (.xlsx)</strong> com melhoria visual CamScanner e zero alucinação.
              </p>
            </div>

            <ScannerUploader
              onImageSelected={handleImageSelected}
              onOpenCamera={() => setIsCameraOpen(true)}
              isLoading={isScanning}
            />

            {/* Recent Scans History */}
            <HistoryDrawer
              history={history}
              onSelectHistory={handleSelectHistoryItem}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}

        {/* STEP 2: CamScanner Desk Visual Studio */}
        {step === 'studio' && originalImage && (
          <div className="animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="flex items-center gap-1.5 text-xs font-mono uppercase text-white/70 hover:text-white bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 px-3.5 py-2 rounded-lg shadow-sm transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Upload</span>
              </button>
            </div>

            <CamScannerStudio
              originalImageSrc={originalImage}
              initialFlow={targetFlow}
              onProceedToOCR={handleProceedToOCR}
              onCancel={() => setStep('upload')}
              isProcessingOCR={isScanning}
            />
          </div>
        )}

        {/* STEP 3: Results, Word / Excel Exporters & Refiner */}
        {step === 'result' && scanResult && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Back and Flow Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('studio')}
                className="flex items-center gap-1.5 text-xs font-mono uppercase text-white/70 hover:text-white bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 px-3.5 py-2 rounded-lg shadow-sm transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Reajustar Filtros da Imagem</span>
              </button>

              {/* View Switcher Tabs */}
              <div className="bg-[#121212] border border-white/10 p-1 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveResultTab('word')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                    activeResultTab === 'word'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Fluxo A: Word (.docx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveResultTab('excel')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    activeResultTab === 'excel'
                      ? 'bg-[#00FF88] text-black shadow-[0_0_12px_rgba(0,255,136,0.25)]'
                      : 'text-white/60 hover:text-[#00FF88]'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Fluxo B: Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveResultTab('visual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                    activeResultTab === 'visual'
                      ? 'bg-[#252525] text-white border border-white/15'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Documento Escaneado</span>
                </button>
              </div>
            </div>

            {/* Document Classification & Intelligence Summary */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-white/10 text-[#00FF88] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(0,255,136,0.15)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{scanResult.documentTitle}</div>
                  <div className="text-white/50">{scanResult.summary}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-white/60">
                <div className="text-right">
                  <span className="font-bold text-white font-mono">{scanResult.documentClassification}</span>
                  <div className="text-[11px] text-white/40 font-mono">Idioma: {scanResult.language}</div>
                </div>
                <div className="px-2.5 py-1 bg-[#00FF88]/10 text-[#00FF88] rounded-lg font-mono font-bold border border-[#00FF88]/30">
                  {scanResult.confidenceScore}% Confiabilidade
                </div>
              </div>
            </div>

            {/* Tab 1: Word Flow (Markdown / Docx) */}
            {activeResultTab === 'word' && (
              <WordResultViewer
                result={scanResult}
                onUpdateContent={(newMarkdown) => {
                  setScanResult((prev) => (prev ? { ...prev, markdownContent: newMarkdown } : prev));
                }}
              />
            )}

            {/* Tab 2: Excel Flow (JSON / Spreadsheet Grid / Xlsx) */}
            {activeResultTab === 'excel' && (
              <ExcelResultViewer
                result={scanResult}
                onUpdateTableData={(newTableData: TableDataWrapper) => {
                  setScanResult((prev) => (prev ? { ...prev, tableData: newTableData } : prev));
                }}
              />
            )}

            {/* Tab 3: Visual Scanned Document Preview */}
            {activeResultTab === 'visual' && enhancedImage && (
              <div className="bg-[#0D0D0D] rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 border border-white/10">
                <img
                  src={enhancedImage}
                  alt="Scanned doc"
                  className="max-h-[600px] object-contain rounded-lg shadow-2xl bg-white border border-white/10"
                />
                <div className="flex items-center gap-3">
                  <a
                    href={enhancedImage}
                    download="documento_digitalizado.jpg"
                    className="px-5 py-2.5 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.3)] flex items-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4 text-black" />
                    <span>Baixar Imagem Aprimorada (JPG)</span>
                  </a>
                </div>
              </div>
            )}

            {/* Natural Language Refiner Bar */}
            <DocumentRefiner onRefine={handleRefineDocument} isLoading={isRefining} />
          </div>
        )}
      </main>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => handleImageSelected(dataUrl, targetFlow)}
      />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
