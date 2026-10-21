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

interface MultiPageProcessorModalProps {
  isOpen: boolean;
  pdfDataUrl: string;
  onClose: () => void;
  onComplete: (consolidatedDocument: ErgonConsolidatedDocument) => void;
}

export const MultiPageProcessorModal: React.FC<MultiPageProcessorModalProps> = ({
  isOpen,
  pdfDataUrl,
  onClose,
  onComplete,
}) => {
  const [stage, setStage] = useState<'splitting' | 'extracting' | 'complete' | 'error'>('splitting');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [completedPages, setCompletedPages] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const isCancelledRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen || !pdfDataUrl) return;

    isCancelledRef.current = false;
    setStage('splitting');
    setErrorMessage(null);
    setCompletedPages([]);
    setCurrentPageIndex(0);

    const processWorkflow = async () => {
      try {
        // Step 1: Split the PDF
        const splitResponse = await fetch('/api/pdf/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64: pdfDataUrl }),
        });

        if (!splitResponse.ok) {
          const errData = await splitResponse.json();
          throw new Error(errData.error || 'Falha ao dividir o PDF.');
        }

        const splitResult = await splitResponse.json();
        const pages: { pageNumber: number; base64: string }[] = splitResult.pages || [];
        const count = splitResult.pageCount || pages.length;

        if (count === 0) {
          throw new Error('Nenhuma página encontrada no PDF.');
        }

        setTotalPages(count);
        setStage('extracting');

        // Step 2: Extract each page sequentially with high precision
        const extractedPages: ErgonPageData[] = [];
        let servidorConsolidado: ErgonPersonalData = {};
        let vinculoConsolidado: ErgonVinculoData = {};
        const todasFrequencias: ErgonFrequenciaRow[] = [];
        const todasLicencas: ErgonLicencaRow[] = [];
        const todosMapas: ErgonMapaAno[] = [];

        for (let i = 0; i < pages.length; i++) {
          if (isCancelledRef.current) return;

          // Ajuste 1: Intervalo seguro de 3.5 segundos entre cada página para garantir zero rate-limit (429)
          if (i > 0) {
            setStatusNotice(`Pausa segura anti-cota (3.5s) antes da Página ${pages[i].pageNumber}...`);
            await new Promise((r) => setTimeout(r, 3500));
            setStatusNotice(null);
          }

          const p = pages[i];
          setCurrentPageIndex(i + 1);

          let pageData: ErgonPageData;
          let retryCount = 0;
          let pageSuccess = false;

          // Retenta até 6 vezes com espera progressiva - NUNCA gera página em branco falsa
          while (!pageSuccess && retryCount < 6) {
            try {
              const pageRes = await fetch('/api/pdf/extract-page-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  pageBase64: p.base64,
                  pageNumber: p.pageNumber,
                  totalPages: count,
                }),
              });

              if (!pageRes.ok) {
                const pageErr = await pageRes.json();
                throw new Error(pageErr.error || `Erro na página ${p.pageNumber}`);
              }

              const resJson = await pageRes.json();
              pageData = resJson.data;
              pageSuccess = true;
              extractedPages.push(pageData);

              // Consolidate data
              if (pageData.servidor && Object.keys(pageData.servidor).length > 0) {
                servidorConsolidado = { ...servidorConsolidado, ...pageData.servidor };
              }
              if (pageData.vinculo && Object.keys(pageData.vinculo).length > 0) {
                vinculoConsolidado = { ...vinculoConsolidado, ...pageData.vinculo };
              }
              if (pageData.frequencias && pageData.frequencias.length > 0) {
                todasFrequencias.push(...pageData.frequencias);
              }
              if (pageData.licencas && pageData.licencas.length > 0) {
                todasLicencas.push(...pageData.licencas);
              }
              if (pageData.mapaFrequencia && pageData.mapaFrequencia.length > 0) {
                todosMapas.push(...pageData.mapaFrequencia);
              }

              setCompletedPages((prev) => [...prev, p.pageNumber]);
              setStatusNotice(null);
              setErrorMessage(null);
            } catch (err: any) {
              retryCount++;
              if (retryCount >= 6) {
                console.error(`Página ${p.pageNumber} falhou após 6 tentativas:`, err);
                throw new Error(`Falha definitiva ao ler a Página ${p.pageNumber}: ${err.message}. Verifique sua conexão com a API e tente novamente.`);
              } else {
                const waitMs = 4000 * retryCount;
                setStatusNotice(`Cota temporária da IA em espera. Retomando Página ${p.pageNumber} em ${waitMs / 1000}s (Tentativa ${retryCount}/6)...`);
                await new Promise((r) => setTimeout(r, waitMs));
                setStatusNotice(null);
              }
            }
          }
        }

        if (isCancelledRef.current) return;

        // Step 3: Complete consolidation
        const consolidatedDoc: ErgonConsolidatedDocument = {
          totalPages: count,
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

        setStage('complete');
        setTimeout(() => {
          onComplete(consolidatedDoc);
        }, 600);
      } catch (err: any) {
        if (!isCancelledRef.current) {
          console.error('Workflow error:', err);
          setErrorMessage(err.message || 'Erro durante o processamento do PDF.');
          setStage('error');
        }
      }
    };

    processWorkflow();

    return () => {
      isCancelledRef.current = true;
    };
  }, [isOpen, pdfDataUrl, onComplete]);

  if (!isOpen) return null;

  const percent =
    totalPages > 0 ? Math.round((completedPages.length / totalPages) * 100) : stage === 'splitting' ? 10 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.2)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Reconstrução Fiel de PDF Multi-Páginas
              </h3>
              <p className="text-xs text-white/50 font-mono">
                {stage === 'splitting'
                  ? 'Fatiando documento em páginas isoladas...'
                  : stage === 'extracting'
                  ? `Extraindo dados: Página ${currentPageIndex} de ${totalPages}...`
                  : stage === 'complete'
                  ? 'Processamento concluído com sucesso!'
                  : 'Falha no processamento'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              isCancelledRef.current = true;
              onClose();
            }}
            className="p-2 text-white/40 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/60">
              {stage === 'splitting' ? 'Preparando páginas...' : `${completedPages.length} de ${totalPages} páginas concluídas`}
            </span>
            <span className="text-[#00FF88] font-bold">{percent}%</span>
          </div>
          <div className="w-full h-3 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#00FF88]/70 to-[#00FF88] transition-all duration-300 shadow-[0_0_12px_#00FF88]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Page Grid Indicator */}
        {totalPages > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/40">
              Status das Páginas:
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto p-2 bg-[#0A0A0A] rounded-2xl border border-white/5">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => {
                const isDone = completedPages.includes(pNum);
                const isCurrent = currentPageIndex === pNum && !isDone;

                return (
                  <div
                    key={pNum}
                    className={`flex items-center justify-center p-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                      isDone
                        ? 'bg-[#00FF88]/10 border-[#00FF88]/40 text-[#00FF88]'
                        : isCurrent
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 animate-pulse'
                        : 'bg-white/5 border-white/5 text-white/30'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-[#00FF88]" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 inline mr-1 animate-spin text-blue-400" />
                    ) : null}
                    <span>{pNum}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Notice (Aguardando liberação cota gratuita - Opção A) */}
        {statusNotice && stage !== 'error' && (
          <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs animate-pulse">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-amber-300">Fila Inteligente (Modo Gratuito): </span>
              <span>{statusNotice}</span>
            </div>
          </div>
        )}

        {/* Real Error State */}
        {stage === 'error' && errorMessage && (
          <div className="bg-rose-950/70 border border-rose-500/40 text-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-rose-300 uppercase">Erro no Processamento</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Bottom Status / Tip */}
        <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 text-xs text-white/60">
          <Layers className="w-4 h-4 text-[#00FF88] shrink-0" />
          <span>
            Cada página é processada isoladamente com Inteligência Artificial para garantir que 100% das linhas de frequência, licenças e matrizes sejam recuperadas sem cortes.
          </span>
        </div>
      </div>
    </div>
  );
};
