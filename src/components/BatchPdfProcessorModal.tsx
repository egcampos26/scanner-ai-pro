import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  X,
  Layers,
  Download,
  FileSpreadsheet,
  Eye,
  Check,
  FolderDown,
  RotateCcw,
} from 'lucide-react';
import {
  ErgonConsolidatedDocument,
  ErgonPageData,
  ErgonPersonalData,
  ErgonVinculoData,
  ErgonFrequenciaRow,
  ErgonLicencaRow,
  ErgonMapaAno,
} from '../types';
import { generateNativeErgonPdf } from '../utils/ergonPdfGenerator';
import { exportErgonToExcel, buildErgonFileName } from '../utils/exportUtils';

export interface BatchItem {
  id: string;
  file: File;
  status: 'waiting' | 'reading' | 'splitting' | 'extracting' | 'done' | 'error';
  totalPages: number;
  currentPage: number;
  completedPages: number[];
  servidorNome?: string;
  servidorRf?: string;
  vinculoNumero?: string;
  downloadedFileName?: string;
  errorMessage?: string;
  documentData?: ErgonConsolidatedDocument;
}

interface BatchPdfProcessorModalProps {
  isOpen: boolean;
  files: File[];
  onClose: () => void;
  onViewDocument: (doc: ErgonConsolidatedDocument) => void;
}

export const BatchPdfProcessorModal: React.FC<BatchPdfProcessorModalProps> = ({
  isOpen,
  files,
  onClose,
  onViewDocument,
}) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [currentFileIdx, setCurrentFileIdx] = useState<number>(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [allFinished, setAllFinished] = useState<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);

  // Helper to read File as Data URL
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  // Initialize queue when files change
  useEffect(() => {
    if (!isOpen || files.length === 0) return;

    isCancelledRef.current = false;
    setAllFinished(false);
    setStatusNotice(null);
    setCurrentFileIdx(0);

    const initialItems: BatchItem[] = files.map((f, idx) => ({
      id: `${f.name}-${idx}-${Date.now()}`,
      file: f,
      status: 'waiting',
      totalPages: 0,
      currentPage: 0,
      completedPages: [],
    }));

    setItems(initialItems);

    const processBatchQueue = async () => {
      for (let fIdx = 0; fIdx < initialItems.length; fIdx++) {
        if (isCancelledRef.current) break;

        setCurrentFileIdx(fIdx);

        // Update item status: reading
        setItems((prev) =>
          prev.map((it, idx) => (idx === fIdx ? { ...it, status: 'reading' } : it))
        );

        let consolidatedDoc: ErgonConsolidatedDocument | null = null;
        try {
          const file = initialItems[fIdx].file;
          const dataUrl = await readFileAsDataUrl(file);

          if (isCancelledRef.current) break;

          // Step 1: Split
          setItems((prev) =>
            prev.map((it, idx) => (idx === fIdx ? { ...it, status: 'splitting' } : it))
          );

          const splitRes = await fetch('/api/pdf/split', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64: dataUrl }),
          });

          if (!splitRes.ok) {
            const errJson = await splitRes.json();
            throw new Error(errJson.error || 'Falha ao dividir o PDF em páginas.');
          }

          const splitData = await splitRes.json();
          const pages: { pageNumber: number; base64: string }[] = splitData.pages || [];
          const totalPagesCount = splitData.pageCount || pages.length;

          setItems((prev) =>
            prev.map((it, idx) =>
              idx === fIdx
                ? {
                    ...it,
                    status: 'extracting',
                    totalPages: totalPagesCount,
                    currentPage: 1,
                    completedPages: [],
                  }
                : it
            )
          );

          // Step 2: Extract each page
          const extractedPages: ErgonPageData[] = [];
          let servidorConsolidado: ErgonPersonalData = {};
          let vinculoConsolidado: ErgonVinculoData = {};
          const todasFrequencias: ErgonFrequenciaRow[] = [];
          const todasLicencas: ErgonLicencaRow[] = [];
          const todosMapas: ErgonMapaAno[] = [];

          for (let pIdx = 0; pIdx < pages.length; pIdx++) {
            if (isCancelledRef.current) break;

            const p = pages[pIdx];

            setItems((prev) =>
              prev.map((it, idx) =>
                idx === fIdx ? { ...it, currentPage: p.pageNumber } : it
              )
            );

            // Safe anti-rate-limit breath of 3.5s between pages
            if (pIdx > 0) {
              setStatusNotice(`Pausa segura anti-cota (3.5s) antes da Página ${p.pageNumber}...`);
              await new Promise((r) => setTimeout(r, 3500));
              setStatusNotice(null);
            }

            let pageSuccess = false;
            let retryCount = 0;
            let pageData: ErgonPageData | null = null;

            while (!pageSuccess && retryCount < 6) {
              try {
                const pageRes = await fetch('/api/pdf/extract-page-data', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    pageBase64: p.base64,
                    pageNumber: p.pageNumber,
                    totalPages: totalPagesCount,
                  }),
                });

                if (!pageRes.ok) {
                  const errBody = await pageRes.json();
                  throw new Error(errBody.error || `Erro na página ${p.pageNumber}`);
                }

                const resJson = await pageRes.json();
                pageData = resJson.data;
                pageSuccess = true;
                extractedPages.push(pageData!);

                if (pageData?.servidor) {
                  for (const [k, v] of Object.entries(pageData.servidor)) {
                    if (v && typeof v === 'string' && v.trim() !== '') {
                      (servidorConsolidado as any)[k] = v.trim();
                    }
                  }
                }
                if (pageData?.vinculo) {
                  for (const [k, v] of Object.entries(pageData.vinculo)) {
                    if (v && typeof v === 'string' && v.trim() !== '') {
                      (vinculoConsolidado as any)[k] = v.trim();
                    }
                  }
                }
                if (pageData?.frequencias && pageData.frequencias.length > 0) {
                  todasFrequencias.push(...pageData.frequencias);
                }
                if (pageData?.licencas && pageData.licencas.length > 0) {
                  todasLicencas.push(...pageData.licencas);
                }
                if (pageData?.mapaFrequencia && pageData.mapaFrequencia.length > 0) {
                  todosMapas.push(...pageData.mapaFrequencia);
                }

                setItems((prev) =>
                  prev.map((it, idx) =>
                    idx === fIdx
                      ? {
                          ...it,
                          completedPages: [...it.completedPages, p.pageNumber],
                        }
                      : it
                  )
                );
                setStatusNotice(null);
              } catch (err: any) {
                retryCount++;
                if (retryCount >= 6) {
                  throw new Error(
                    `Página ${p.pageNumber} falhou após 6 tentativas: ${err.message}`
                  );
                } else {
                  const waitMs = 4000 * retryCount;
                  setStatusNotice(
                    `Cota da IA em espera. Retomando Página ${p.pageNumber} em ${
                      waitMs / 1000
                    }s (Tentativa ${retryCount}/6)...`
                  );
                  await new Promise((r) => setTimeout(r, waitMs));
                  setStatusNotice(null);
                }
              }
            }
          }

          if (isCancelledRef.current) break;

          // Step 3: Consolidate Document
          consolidatedDoc = {
            totalPages: totalPagesCount,
            header: {
              instituicao: 'Prefeitura do Município de São Paulo',
              departamento: 'Coordenadoria de Gestão de Pessoas',
              emissao: extractedPages[0]?.header?.emissao || new Date().toLocaleString('pt-BR'),
              referencia: 'REPFICH2',
            },
            servidor: servidorConsolidado,
            vinculo: vinculoConsolidado,
            frequencias: todasFrequencias,
            licencas: todasLicencas,
            mapaFrequencia: todosMapas,
            pages: extractedPages,
            footer: {
              sistema: 'Ergon',
              modulo: 'Ergon - Recursos Humanos',
              versao: '6.4',
              banco: 'ORA039',
            },
          };

          // Step 4: Construct Safe Unique Filename with Nome, RF and Vínculo
          const rf = (consolidatedDoc.servidor?.numero || '').trim();
          const vinculo = (consolidatedDoc.vinculo?.numero || '1').trim();
          const nome = (
            consolidatedDoc.servidor?.nome || file.name.replace(/\.pdf$/i, '')
          ).trim();

          const cleanNome = nome.replace(/[/\\?%*:|"<>]/g, '').trim();
          const cleanRf = rf.replace(/[/\\?%*:|"<>]/g, '').trim();
          const cleanVinculo = vinculo.replace(/[/\\?%*:|"<>]/g, '').trim();

          const autoPdfFileName = cleanRf
            ? `${cleanNome} - RF ${cleanRf} - Vinculo ${cleanVinculo} - REPFICH2.pdf`
            : `${cleanNome} - Vinculo ${cleanVinculo} - REPFICH2.pdf`;

          // Step 5: Automatic Download of the Native PDF
          await generateNativeErgonPdf(consolidatedDoc, autoPdfFileName);

          // Update item to done
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === fIdx
                ? {
                    ...it,
                    status: 'done',
                    servidorNome: cleanNome,
                    servidorRf: cleanRf,
                    vinculoNumero: cleanVinculo,
                    downloadedFileName: autoPdfFileName,
                    documentData: consolidatedDoc,
                  }
                : it
            )
          );

          // If there are more files in the queue, pause 4s before the next file
          if (fIdx < initialItems.length - 1) {
            setStatusNotice(
              `Arquivo ${fIdx + 1} de ${
                initialItems.length
              } concluído e baixado! Aguardando 4s para o próximo arquivo...`
            );
            await new Promise((r) => setTimeout(r, 4000));
            setStatusNotice(null);
          }
        } catch (itemErr: any) {
          console.error(`Erro no arquivo ${initialItems[fIdx].file.name}:`, itemErr);
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === fIdx
                ? {
                    ...it,
                    status: 'error',
                    errorMessage: itemErr.message || 'Erro durante o processamento.',
                    documentData: consolidatedDoc || it.documentData,
                  }
                : it
            )
          );
        }
      }

      if (!isCancelledRef.current) {
        setAllFinished(true);
        setStatusNotice(null);
      }
    };

    processBatchQueue();

    return () => {
      isCancelledRef.current = true;
    };
  }, [isOpen, files]);

  const retryItem = async (itemId: string) => {
    const itemIdx = items.findIndex((it) => it.id === itemId);
    if (itemIdx === -1) return;

    const targetItem = items[itemIdx];
    setIsProcessing(true);
    isCancelledRef.current = false;
    setCurrentFileIdx(itemIdx);

    setItems((prev) =>
      prev.map((it, idx) =>
        idx === itemIdx ? { ...it, status: 'reading', errorMessage: undefined } : it
      )
    );

    let consolidatedDoc: ErgonConsolidatedDocument | null = null;
    try {
      const file = targetItem.file;
      const dataUrl = await readFileAsDataUrl(file);

      setItems((prev) =>
        prev.map((it, idx) => (idx === itemIdx ? { ...it, status: 'splitting' } : it))
      );

      const splitRes = await fetch('/api/pdf/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: dataUrl }),
      });

      if (!splitRes.ok) {
        const errJson = await splitRes.json();
        throw new Error(errJson.error || 'Falha ao dividir o PDF em páginas.');
      }

      const splitData = await splitRes.json();
      const pages: { pageNumber: number; base64: string }[] = splitData.pages || [];
      const totalPagesCount = splitData.pageCount || pages.length;

      setItems((prev) =>
        prev.map((it, idx) =>
          idx === itemIdx
            ? {
                ...it,
                status: 'extracting',
                totalPages: totalPagesCount,
                currentPage: 1,
                completedPages: [],
              }
            : it
        )
      );

      const extractedPages: ErgonPageData[] = [];
      let servidorConsolidado: ErgonPersonalData = {};
      let vinculoConsolidado: ErgonVinculoData = {};
      const todasFrequencias: ErgonFrequenciaRow[] = [];
      const todasLicencas: ErgonLicencaRow[] = [];
      const todosMapas: ErgonMapaAno[] = [];

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        if (isCancelledRef.current) break;
        const p = pages[pIdx];

        setItems((prev) =>
          prev.map((it, idx) => (idx === itemIdx ? { ...it, currentPage: p.pageNumber } : it))
        );

        if (pIdx > 0) {
          setStatusNotice(`Pausa segura anti-cota (3.5s) antes da Página ${p.pageNumber}...`);
          await new Promise((r) => setTimeout(r, 3500));
          setStatusNotice(null);
        }

        let pageSuccess = false;
        let retryCount = 0;
        let pageData: ErgonPageData | null = null;

        while (!pageSuccess && retryCount < 6) {
          try {
            const pageRes = await fetch('/api/pdf/extract-page-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pageBase64: p.base64,
                pageNumber: p.pageNumber,
                totalPages: totalPagesCount,
              }),
            });

            if (!pageRes.ok) {
              const errBody = await pageRes.json();
              throw new Error(errBody.error || `Erro na página ${p.pageNumber}`);
            }

            const resJson = await pageRes.json();
            pageData = resJson.data;
            pageSuccess = true;
            extractedPages.push(pageData!);

            if (pageData?.servidor) {
              for (const [k, v] of Object.entries(pageData.servidor)) {
                if (v && typeof v === 'string' && v.trim() !== '') {
                  (servidorConsolidado as any)[k] = v.trim();
                }
              }
            }
            if (pageData?.vinculo) {
              for (const [k, v] of Object.entries(pageData.vinculo)) {
                if (v && typeof v === 'string' && v.trim() !== '') {
                  (vinculoConsolidado as any)[k] = v.trim();
                }
              }
            }
            if (pageData?.frequencias && pageData.frequencias.length > 0) {
              todasFrequencias.push(...pageData.frequencias);
            }
            if (pageData?.licencas && pageData.licencas.length > 0) {
              todasLicencas.push(...pageData.licencas);
            }
            if (pageData?.mapaFrequencia && pageData.mapaFrequencia.length > 0) {
              todosMapas.push(...pageData.mapaFrequencia);
            }

            setItems((prev) =>
              prev.map((it, idx) =>
                idx === itemIdx
                  ? {
                      ...it,
                      completedPages: [...it.completedPages, p.pageNumber],
                    }
                  : it
              )
            );
            setStatusNotice(null);
          } catch (err: any) {
            retryCount++;
            if (retryCount >= 6) {
              throw new Error(
                `Página ${p.pageNumber} falhou após 6 tentativas: ${err.message}`
              );
            }
            const backoff = 4000 * retryCount;
            setStatusNotice(
              `Página ${p.pageNumber}: tentativa ${retryCount}/6 falhou (${err.message}). Aguardando ${backoff / 1000}s...`
            );
            await new Promise((r) => setTimeout(r, backoff));
            setStatusNotice(null);
          }
        }
      }

      if (isCancelledRef.current) return;

      consolidatedDoc = {
        totalPages: totalPagesCount,
        header: {
          instituicao: 'Prefeitura do Município de São Paulo',
          departamento: 'Coordenadoria de Gestão de Pessoas',
          emissao: extractedPages[0]?.header?.emissao || new Date().toLocaleString('pt-BR'),
          referencia: 'REPFICH2',
        },
        servidor: servidorConsolidado,
        vinculo: vinculoConsolidado,
        frequencias: todasFrequencias,
        licencas: todasLicencas,
        mapaFrequencia: todosMapas,
        pages: extractedPages,
        footer: {
          sistema: 'Ergon',
          modulo: 'Ergon - Recursos Humanos',
          versao: '6.4',
          banco: 'ORA039',
        },
      };

      const rf = (consolidatedDoc.servidor?.numero || '').trim();
      const vinculo = (consolidatedDoc.vinculo?.numero || '1').trim();
      const nome = (
        consolidatedDoc.servidor?.nome || file.name.replace(/\.pdf$/i, '')
      ).trim();

      const cleanNome = nome.replace(/[/\\?%*:|"<>]/g, '').trim();
      const cleanRf = rf.replace(/[/\\?%*:|"<>]/g, '').trim();
      const cleanVinculo = vinculo.replace(/[/\\?%*:|"<>]/g, '').trim();

      const autoPdfFileName = cleanRf
        ? `${cleanNome} - RF ${cleanRf} - Vinculo ${cleanVinculo} - REPFICH2.pdf`
        : `${cleanNome} - Vinculo ${cleanVinculo} - REPFICH2.pdf`;

      await generateNativeErgonPdf(consolidatedDoc, autoPdfFileName);

      setItems((prev) =>
        prev.map((it, idx) =>
          idx === itemIdx
            ? {
                ...it,
                status: 'done',
                servidorNome: cleanNome,
                servidorRf: cleanRf,
                vinculoNumero: cleanVinculo,
                downloadedFileName: autoPdfFileName,
                documentData: consolidatedDoc!,
                errorMessage: undefined,
              }
            : it
        )
      );
    } catch (err: any) {
      console.error(`Erro ao reprocessar:`, err);
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === itemIdx
            ? {
                ...it,
                status: 'error',
                errorMessage: err.message || 'Erro durante o reprocessamento.',
                documentData: consolidatedDoc || it.documentData,
              }
            : it
        )
      );
    } finally {
      setIsProcessing(false);
      setStatusNotice(null);
    }
  };

  if (!isOpen) return null;

  const completedCount = items.filter((it) => it.status === 'done').length;
  const currentItem = items[currentFileIdx];
  const overallPercent =
    items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Fila de Reconstrução em Lote (ERGON / PMSP)
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {completedCount} de {items.length} Concluídos
                </span>
              </h3>
              <p className="text-xs text-white/50">
                Cada documento é processado e baixado automaticamente com{' '}
                <strong className="text-white/80">Nome, RF e Vínculo</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              isCancelledRef.current = true;
              onClose();
            }}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/60">
              Progresso Geral do Lote:{' '}
              <strong className="text-white">
                {completedCount} de {items.length} arquivos
              </strong>
            </span>
            <span className="text-amber-400 font-bold">{overallPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-[#00FF88] transition-all duration-300 shadow-[0_0_12px_#00FF88]"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        {/* Status Notice (Aguardando liberação cota gratuita / Pausa entre arquivos) */}
        {statusNotice && (
          <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs animate-pulse">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-amber-300">Fila Inteligente: </span>
              <span>{statusNotice}</span>
            </div>
          </div>
        )}

        {/* File Queue List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[340px]">
          {items.map((item, idx) => {
            const isCurrent = currentFileIdx === idx && item.status !== 'done' && item.status !== 'error';
            const isDone = item.status === 'done';
            const isError = item.status === 'error';
            const isWaiting = item.status === 'waiting';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : isDone
                    ? 'bg-[#00FF88]/5 border-[#00FF88]/30'
                    : isError
                    ? 'bg-rose-950/30 border-rose-500/30'
                    : 'bg-[#151515] border-white/5 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isDone
                          ? 'bg-[#00FF88]/20 text-[#00FF88]'
                          : isCurrent
                          ? 'bg-amber-500/20 text-amber-400'
                          : isError
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-white/5 text-white/30'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[280px]">
                          {item.file.name}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">
                          ({(item.file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>

                      {isDone && item.downloadedFileName && (
                        <div className="text-[11px] text-[#00FF88] font-mono flex items-center gap-1 mt-0.5 truncate">
                          <Check className="w-3 h-3" />
                          <span>Baixado: {item.downloadedFileName}</span>
                        </div>
                      )}

                      {isCurrent && (
                        <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                          {item.status === 'reading' && 'Lendo arquivo...'}
                          {item.status === 'splitting' && 'Dividindo páginas...'}
                          {item.status === 'extracting' &&
                            `Página ${item.currentPage || 1} de ${item.totalPages || '?'}`}
                        </div>
                      )}

                      {isError && (
                        <div className="text-[11px] text-rose-400 font-mono mt-0.5">
                          Erro: {item.errorMessage}
                        </div>
                      )}

                      {isWaiting && (
                        <div className="text-[11px] text-white/40 font-mono mt-0.5">
                          Aguardando sua vez na fila...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for Done items or items with documentData */}
                  {item.documentData ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            await generateNativeErgonPdf(
                              item.documentData!,
                              item.downloadedFileName
                            );
                            setItems((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? { ...it, status: 'done', errorMessage: undefined }
                                  : it
                              )
                            );
                          } catch (e: any) {
                            alert('Erro ao gerar PDF: ' + e.message);
                          }
                        }}
                        title="Baixar PDF"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00FF88] border border-[#00FF88]/20 text-[11px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3 text-[#00FF88]" />
                        PDF
                      </button>

                      <button
                        onClick={() => exportErgonToExcel(item.documentData!)}
                        title="Baixar Planilha Excel"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                        Excel
                      </button>

                      <button
                        onClick={() => {
                          onViewDocument(item.documentData!);
                          onClose();
                        }}
                        title="Visualizar no App"
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[11px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3 text-blue-400" />
                        Ver
                      </button>
                    </div>
                  ) : isError ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => retryItem(item.id)}
                        disabled={isProcessing}
                        title="Tentar novamente"
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-mono flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reprocessar
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Micro page progress for current item */}
                {isCurrent && item.totalPages > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[10px] font-mono text-white/50 mb-1">
                      <span>Páginas: {item.completedPages.length} de {item.totalPages}</span>
                      <span>
                        {Math.round(
                          (item.completedPages.length / item.totalPages) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300"
                        style={{
                          width: `${(item.completedPages.length / item.totalPages) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-white/50 flex items-center gap-2">
            <FolderDown className="w-4 h-4 text-[#00FF88]" />
            <span>
              Os arquivos são salvos diretamente na sua pasta de Downloads.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {allFinished ? (
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00FF88] text-black font-bold text-xs hover:bg-[#00FF88]/90 transition-colors shadow-lg shadow-[#00FF88]/20"
              >
                Concluir Lote
              </button>
            ) : (
              <button
                onClick={() => {
                  isCancelledRef.current = true;
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs border border-white/10 transition-colors"
              >
                Parar Processamento
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
