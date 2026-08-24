import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Wand2,
  Sliders,
  RotateCw,
  Crop,
  Layers,
  Sparkles,
  Download,
  Check,
  Split,
  Eye,
  FileText,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { CornerPoints, FilterPreset, ScanFlow } from '../types';
import {
  applyDocumentFilter,
  getDefaultCorners,
  rotateCanvas,
  warpPerspectiveCanvas,
} from '../utils/imageProcessing';

interface CamScannerStudioProps {
  originalImageSrc: string;
  initialFlow: ScanFlow;
  onProceedToOCR: (enhancedImageDataUrl: string, targetFlow: ScanFlow) => void;
  onCancel: () => void;
  isProcessingOCR: boolean;
}

export const CamScannerStudio: React.FC<CamScannerStudioProps> = ({
  originalImageSrc,
  initialFlow,
  onProceedToOCR,
  onCancel,
  isProcessingOCR,
}) => {
  const [filter, setFilter] = useState<FilterPreset>('magic_color');
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(10);
  const [rotation, setRotation] = useState<number>(0);
  const [targetFlow, setTargetFlow] = useState<ScanFlow>(initialFlow);
  const [isPerspectiveMode, setIsPerspectiveMode] = useState<boolean>(false);
  const [corners, setCorners] = useState<CornerPoints | null>(null);
  const [activeCorner, setActiveCorner] = useState<keyof CornerPoints | null>(null);
  const [showSplitCompare, setShowSplitCompare] = useState<boolean>(false);
  const [compareSliderPos, setCompareSliderPos] = useState<number>(50);

  const isPdf = originalImageSrc.startsWith('data:application/pdf');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isPdf && originalImageSrc) {
      try {
        const base64Data = originalImageSrc.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.error("Failed to create PDF blob URL", e);
      }
    }
  }, [isPdf, originalImageSrc]);

  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const warpedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Load original image and initialize corners
  useEffect(() => {
    if (isPdf) return; // Skip image logic for PDFs

    const img = new Image();
    img.onload = () => {
      imageObjRef.current = img;
      const initialCorners = getDefaultCorners(img.naturalWidth, img.naturalHeight, 0.04);
      setCorners(initialCorners);
      renderProcessedImage(img, initialCorners, filter, brightness, contrast, rotation);
    };
    img.src = originalImageSrc;
  }, [originalImageSrc]);

  // Re-render when parameters change
  useEffect(() => {
    if (imageObjRef.current && corners) {
      renderProcessedImage(imageObjRef.current, corners, filter, brightness, contrast, rotation);
    }
  }, [filter, brightness, contrast, rotation, corners]);

  const renderProcessedImage = useCallback(
    (
      img: HTMLImageElement,
      currentCorners: CornerPoints,
      currentFilter: FilterPreset,
      b: number,
      c: number,
      rot: number
    ) => {
      // 1. Perspective warp
      let warped: HTMLCanvasElement;
      if (isPerspectiveMode || !currentCorners) {
        warped = document.createElement('canvas');
        warped.width = img.naturalWidth;
        warped.height = img.naturalHeight;
        const ctx = warped.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      } else {
        // Flat rectilinear desk perspective
        warped = warpPerspectiveCanvas(img, currentCorners, 1000, 1414);
      }

      // 2. Rotation
      if (rot !== 0) {
        warped = rotateCanvas(warped, rot);
      }

      warpedCanvasRef.current = warped;

      // 3. Apply CamScanner filters (Magic Color, B&W, Grayscale)
      const displayCanvas = canvasRef.current;
      if (!displayCanvas) return;

      displayCanvas.width = warped.width;
      displayCanvas.height = warped.height;
      const ctx = displayCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(warped, 0, 0);
      applyDocumentFilter(ctx, displayCanvas.width, displayCanvas.height, currentFilter, {
        brightness: b,
        contrast: c,
      });
    },
    [isPerspectiveMode]
  );

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownloadEnhancedImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `documento_camscanner_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleConfirmAndScan = () => {
    if (isPdf) {
      onProceedToOCR(originalImageSrc, targetFlow);
      return;
    }
    
    if (!canvasRef.current) return;
    const enhancedDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
    onProceedToOCR(enhancedDataUrl, targetFlow);
  };

  // Draggable corners for perspective adjustment
  const handlePointerDownCorner = (cornerKey: keyof CornerPoints, e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveCorner(cornerKey);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeCorner || !containerRef.current || !corners || !imageObjRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yPct = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const imgW = imageObjRef.current.naturalWidth;
    const imgH = imageObjRef.current.naturalHeight;

    setCorners((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [activeCorner]: {
          x: Math.round(xPct * imgW),
          y: Math.round(yPct * imgH),
        },
      };
    });
  };

  const handlePointerUp = () => {
    setActiveCorner(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Studio Banner & Step Guide */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.15)]">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Estúdio de Digitalização CamScanner
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30">
                Filtro: {filter === 'magic_color' ? 'Magic Color' : filter}
              </span>
            </h2>
            <p className="text-xs text-white/50">
              Ajuste perspectiva, fundo branco #FFFFFF e contraste antes da extração de alta precisão.
            </p>
          </div>
        </div>

        {/* Target Format Switcher */}
        <div className="flex items-center gap-2 bg-[#181818] border border-white/10 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTargetFlow('auto')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              targetFlow === 'auto'
                ? 'bg-[#252525] text-white shadow-sm border border-white/15 font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            AUTO
          </button>
          <button
            type="button"
            onClick={() => setTargetFlow('word')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              targetFlow === 'word'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-white/60 hover:text-blue-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Word (.docx)
          </button>
          <button
            type="button"
            onClick={() => setTargetFlow('excel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              targetFlow === 'excel'
                ? 'bg-[#00FF88] text-black shadow-[0_0_12px_rgba(0,255,136,0.25)]'
                : 'text-white/60 hover:text-[#00FF88]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main: Visual Viewport Canvas */}
        <div className="lg:col-span-8 bg-[#0D0D0D] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden border border-white/10">
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative max-w-full w-full max-h-[580px] flex items-center justify-center select-none shadow-2xl"
          >
            {isPdf ? (
              <div className="w-full h-[560px] rounded-lg overflow-hidden border border-white/10 flex flex-col items-center justify-center bg-[#1A1A1A]">
                {pdfBlobUrl ? (
                  <object data={pdfBlobUrl} type="application/pdf" className="w-full h-full">
                    <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <FileText className="w-10 h-10 text-white/30" />
                      <p className="text-sm text-white/60">
                        Seu navegador não suporta a pré-visualização nativa de PDFs.<br />
                        Mas o arquivo foi carregado com sucesso e está pronto para extração!
                      </p>
                    </div>
                  </object>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-[#00FF88] rounded-full animate-spin" />
                    <span className="text-xs text-white/50 font-mono">Processando visualização...</span>
                  </div>
                )}
              </div>
            ) : showSplitCompare ? (
              <div className="relative overflow-hidden rounded-lg border border-white/15 max-h-[560px]">
                {/* Processed (Enhanced) Image */}
                <canvas ref={canvasRef} className="max-w-full max-h-[560px] object-contain block" />

                {/* Original Image Clipped Overlay */}
                <div
                  className="absolute inset-0 overflow-hidden border-r-2 border-[#00FF88]"
                  style={{ width: `${compareSliderPos}%` }}
                >
                  <img
                    src={originalImageSrc}
                    alt="Original"
                    className="max-w-none h-full object-contain"
                    style={{
                      width: canvasRef.current ? canvasRef.current.clientWidth : '100%',
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-black/80 text-white/90 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/20 backdrop-blur-xs">
                    ORIGINAL
                  </div>
                </div>

                <div className="absolute top-3 right-3 bg-[#00FF88] text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-sm">
                  CAMSCANNER MAGIC
                </div>

                {/* Draggable Split Handle */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={compareSliderPos}
                  onChange={(e) => setCompareSliderPos(Number(e.target.value))}
                  className="absolute inset-x-0 bottom-3 w-3/4 mx-auto opacity-80 cursor-ew-resize accent-[#00FF88]"
                />
              </div>
            ) : isPerspectiveMode && imageObjRef.current && corners ? (
              /* Interactive Perspective Corner Adjustment Mode */
              <div className="relative max-h-[560px]">
                <img
                  src={originalImageSrc}
                  alt="Original doc"
                  className="max-w-full max-h-[560px] object-contain block opacity-85"
                />

                {/* SVG Polygon overlay connecting the 4 corners */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {(() => {
                    const imgW = imageObjRef.current?.naturalWidth || 1;
                    const imgH = imageObjRef.current?.naturalHeight || 1;
                    const toPercent = (p: { x: number; y: number }) =>
                      `${(p.x / imgW) * 100}% ${(p.y / imgH) * 100}%`;
                    return (
                      <polygon
                        points={`${toPercent(corners.topLeft)}, ${toPercent(corners.topRight)}, ${toPercent(
                          corners.bottomRight
                        )}, ${toPercent(corners.bottomLeft)}`}
                        fill="rgba(0, 255, 136, 0.15)"
                        stroke="#00FF88"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    );
                  })()}
                </svg>

                {/* 4 Interactive Drag Handles */}
                {(['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as (keyof CornerPoints)[]).map(
                  (cornerKey) => {
                    const point = corners[cornerKey];
                    const imgW = imageObjRef.current?.naturalWidth || 1;
                    const imgH = imageObjRef.current?.naturalHeight || 1;
                    const leftPct = (point.x / imgW) * 100;
                    const topPct = (point.y / imgH) * 100;

                    return (
                      <div
                        key={cornerKey}
                        onPointerDown={(e) => handlePointerDownCorner(cornerKey, e)}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-black shadow-[0_0_10px_#00FF88] cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform hover:scale-125 z-20 ${
                          activeCorner === cornerKey ? 'bg-white scale-125' : 'bg-[#00FF88]'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full bg-black" />
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              /* Standard Filtered Canvas Preview */
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[560px] object-contain rounded-lg shadow-2xl border border-white/5"
              />
            )}
          </div>

          {/* Quick Floating Bar over Viewport */}
          {!isPdf && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 z-10">
              <button
                type="button"
                onClick={() => {
                setIsPerspectiveMode(!isPerspectiveMode);
                setShowSplitCompare(false);
              }}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                isPerspectiveMode
                  ? 'bg-[#00FF88] text-black font-bold'
                  : 'bg-[#1C1C1C] text-white/80 hover:bg-[#252525] hover:text-white border border-white/10'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{isPerspectiveMode ? 'Concluir Corte' : 'Ajustar 4 Cantos'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSplitCompare(!showSplitCompare);
                setIsPerspectiveMode(false);
              }}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                showSplitCompare
                  ? 'bg-[#00FF88] text-black font-bold'
                  : 'bg-[#1C1C1C] text-white/80 hover:bg-[#252525] hover:text-white border border-white/10'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>{showSplitCompare ? 'Fechar Comparação' : 'Comparar Antes/Depois'}</span>
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="px-3 py-1.5 text-xs font-mono font-medium bg-[#1C1C1C] text-white/80 hover:bg-[#252525] hover:text-white border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Girar 90°</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadEnhancedImage}
              className="px-3 py-1.5 text-xs font-mono font-medium bg-[#1C1C1C] text-white/80 hover:bg-[#252525] hover:text-white border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Baixar imagem processada em alta resolução"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Imagem</span>
            </button>
          </div>
          )}
        </div>

        {/* Right: Controls & Filters Panel */}
        <div className="lg:col-span-4 space-y-5">
          {!isPdf ? (
            <>
              {/* Preset Filters Box */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#00FF88]" />
                Filtros de Digitalização
              </h3>
              <span className="text-[10px] font-mono text-white/40">Estilo CamScanner</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilter('magic_color')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  filter === 'magic_color'
                    ? 'border-[#00FF88] bg-[#00FF88]/10 text-white font-semibold ring-1 ring-[#00FF88]/30'
                    : 'border-white/10 bg-[#161616] hover:bg-[#1D1D1D] text-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Magic Color</span>
                  {filter === 'magic_color' && <Check className="w-3.5 h-3.5 text-[#00FF88]" />}
                </div>
                <p className="text-[10px] text-white/50 font-normal leading-tight">
                  Scanner de mesa, fundo branco puro (#FFFFFF) e preservação de caneta/carimbos.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFilter('bw')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  filter === 'bw'
                    ? 'border-[#00FF88] bg-[#00FF88]/10 text-white font-semibold ring-1 ring-[#00FF88]/30'
                    : 'border-white/10 bg-[#161616] hover:bg-[#1D1D1D] text-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">P&B Nítido</span>
                  {filter === 'bw' && <Check className="w-3.5 h-3.5 text-[#00FF88]" />}
                </div>
                <p className="text-[10px] text-white/50 font-normal leading-tight">
                  Binarização pura de alto contraste otimizada para OCR de texto denso.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFilter('grayscale')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  filter === 'grayscale'
                    ? 'border-[#00FF88] bg-[#00FF88]/10 text-white font-semibold ring-1 ring-[#00FF88]/30'
                    : 'border-white/10 bg-[#161616] hover:bg-[#1D1D1D] text-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Cinza Neutro</span>
                  {filter === 'grayscale' && <Check className="w-3.5 h-3.5 text-[#00FF88]" />}
                </div>
                <p className="text-[10px] text-white/50 font-normal leading-tight">
                  Tons neutros com nivelamento suave de sombras e rugas de papel.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFilter('original')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  filter === 'original'
                    ? 'border-[#00FF88] bg-[#00FF88]/10 text-white font-semibold ring-1 ring-[#00FF88]/30'
                    : 'border-white/10 bg-[#161616] hover:bg-[#1D1D1D] text-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Original</span>
                  {filter === 'original' && <Check className="w-3.5 h-3.5 text-[#00FF88]" />}
                </div>
                <p className="text-[10px] text-white/50 font-normal leading-tight">
                  Mantém a fotografia original sem alterações cromáticas.
                </p>
              </button>
            </div>
          </div>

          {/* Manual Sliders Box */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#00FF88]" />
                Ajustes Finos de Imagem
              </h3>
              <button
                onClick={() => {
                  setBrightness(0);
                  setContrast(10);
                }}
                className="text-[10px] font-mono text-[#00FF88] hover:underline"
              >
                Resetar
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>Brilho / Nivelamento</span>
                <span className="font-mono text-[11px] text-[#00FF88]">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-[#00FF88]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>Contraste de Texto</span>
                <span className="font-mono text-[11px] text-[#00FF88]">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-[#00FF88]"
              />
            </div>
          </div>
            </>
          ) : (
            <div className="bg-[#111111] border border-[#00FF88]/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(0,255,136,0.05)] space-y-3">
               <h3 className="text-sm font-bold text-[#00FF88] flex items-center gap-2">
                 <FileText className="w-5 h-5" /> Arquivo PDF Detectado
               </h3>
               <p className="text-xs text-white/60 leading-relaxed">
                 O estúdio de ajustes de imagem é desativado para arquivos PDF. A IA avançada do DocScan lerá diretamente todas as páginas do seu documento original preservando a máxima fidelidade do texto.
               </p>
            </div>
          )}

          {/* Formato de Excel Toggle */}
          {targetFlow.startsWith('excel') && (
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white/80 mb-2">
                Modo de Extração Excel
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTargetFlow('excel')}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-mono font-medium border transition-colors ${
                    targetFlow === 'excel'
                      ? 'bg-[#00FF88]/10 border-[#00FF88] text-[#00FF88]'
                      : 'bg-[#181818] border-white/10 text-white/50 hover:bg-[#222222]'
                  }`}
                >
                  Dados Planos<br/><span className="text-[10px] opacity-70">(Para banco de dados)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetFlow('excel_visual')}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-mono font-medium border transition-colors ${
                    targetFlow === 'excel_visual'
                      ? 'bg-[#00FF88]/10 border-[#00FF88] text-[#00FF88]'
                      : 'bg-[#181818] border-white/10 text-white/50 hover:bg-[#222222]'
                  }`}
                >
                  Layout Visual<br/><span className="text-[10px] opacity-70">(Tabela original)</span>
                </button>
              </div>
            </div>
          )}

          {/* Primary Action Button: Proceed to Multimodal OCR */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={isProcessingOCR}
              onClick={handleConfirmAndScan}
              className="w-full py-3.5 px-4 bg-[#00FF88] hover:bg-[#00FF88]/90 active:scale-[0.99] disabled:opacity-50 text-black font-mono font-bold uppercase tracking-wider rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isProcessingOCR ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Processando OCR com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>
                    {targetFlow === 'word'
                      ? 'Extrair em Word (.docx)'
                      : targetFlow.startsWith('excel')
                      ? 'Extrair em Excel (.xlsx)'
                      : 'Extrair com IA (Auto)'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isProcessingOCR}
              onClick={onCancel}
              className="w-full py-2 px-3 text-xs font-mono uppercase text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Escolher outro documento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
