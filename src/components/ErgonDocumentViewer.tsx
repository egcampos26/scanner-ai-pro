import React, { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  Search,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Copy,
  Sparkles,
  FileDown,
  Calendar,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { ErgonConsolidatedDocument, ErgonPageData } from '../types';
import { generateNativeErgonPdf } from '../utils/ergonPdfGenerator';
import { exportErgonToWordDocx, exportErgonToExcel } from '../utils/exportUtils';
import * as XLSX from 'xlsx';

interface ErgonDocumentViewerProps {
  documentData: ErgonConsolidatedDocument;
  onBack?: () => void;
}

export const ErgonDocumentViewer: React.FC<ErgonDocumentViewerProps> = ({
  documentData,
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState<boolean>(false);

  const totalPages = documentData.totalPages || documentData.pages.length || 1;

  // Active page data
  const activePageData = useMemo(() => {
    return (
      documentData.pages.find((p) => p.pageNumber === currentPage) ||
      documentData.pages[0] ||
      ({} as ErgonPageData)
    );
  }, [documentData, currentPage]);

  // Statistics
  const totalFrequencias = useMemo(() => {
    let count = 0;
    documentData.pages.forEach((p) => {
      count += (p.frequencias || []).length;
    });
    return count;
  }, [documentData]);

  const totalLicencas = useMemo(() => {
    let count = 0;
    documentData.pages.forEach((p) => {
      count += (p.licencas || []).length;
    });
    return count;
  }, [documentData]);

  // Direct Native PDF generator
  const handleDownloadDirectPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateNativeErgonPdf(documentData);
    } catch (e: any) {
      console.error('Failed to generate native PDF:', e);
      alert('Ocorreu um erro ao gerar o PDF direto. Você também pode usar a opção "Imprimir / Salvar".');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct Word DOCX generator
  const handleDownloadWord = async () => {
    try {
      setIsGeneratingWord(true);
      await exportErgonToWordDocx(documentData);
    } catch (e: any) {
      console.error('Failed to generate Word document:', e);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  // Export to Excel function
  const handleExportExcel = () => {
    exportErgonToExcel(documentData);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let fullText = `PREFEITURA DO MUNICÍPIO DE SÃO PAULO\nCOORDENADORIA DE GESTÃO DE PESSOAS\nRELATÓRIO ERGON REPFICH2\n\n`;
    if (documentData.servidor?.nome) {
      fullText += `SERVIDOR: ${documentData.servidor.nome} (RF: ${documentData.servidor.numero})\nCPF: ${documentData.servidor.cpf} | RG: ${documentData.servidor.rg}\n\n`;
    }

    documentData.pages.forEach((p) => {
      fullText += `--- PÁGINA ${p.pageNumber} DE ${totalPages} ---\n`;
      if (p.frequencias && p.frequencias.length > 0) {
        fullText += `FREQUÊNCIA:\n`;
        p.frequencias.forEach((f) => {
          fullText += `${f.periodoInicio} a ${f.periodoFim} | Qtd: ${f.quantidade || '-'} | Cód: ${f.codigo} | Tipo: ${f.tipo} | ${f.descricao}\n`;
        });
      }
      if (p.licencas && p.licencas.length > 0) {
        fullText += `LICENÇAS / AFASTAMENTOS:\n`;
        p.licencas.forEach((l) => {
          fullText += `${l.periodoInicio} a ${l.periodoFim} | Dias: ${l.dias} | Cód: ${l.codigo} | ${l.descricao} | Motivo: ${l.motivo}\n`;
        });
      }
      fullText += `\n`;
    });

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSinglePageContent = (page: ErgonPageData) => {
    const isFirstPage = page.pageNumber === 1;

    return (
      <div
        key={`page-${page.pageNumber}`}
        className="ergon-a4-page bg-white text-black p-8 sm:p-10 shadow-2xl rounded-sm font-mono text-[11px] sm:text-[12px] leading-snug border border-gray-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full min-h-[1100px] flex flex-col justify-between mb-8"
      >
        <div>
          {/* HEADER PMSP (Exact ERGON replica) */}
          <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-3">
            <div className="flex items-start gap-3">
              {/* Brasão PMSP Vector */}
              <div className="w-12 h-14 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 120" className="w-full h-full text-black fill-current">
                  <path d="M 20,25 L 30,25 L 30,15 L 40,15 L 40,25 L 50,25 L 50,15 L 60,15 L 60,25 L 70,25 L 70,15 L 80,15 L 80,25 L 90,25 L 85,35 L 15,35 Z" fill="#222" />
                  <path d="M 15,35 L 85,35 L 85,75 C 85,100 50,115 50,115 C 50,115 15,100 15,75 Z" fill="none" stroke="#000" strokeWidth="4" />
                  <path d="M 46,45 L 54,45 L 54,60 L 70,60 L 70,68 L 54,68 L 54,95 L 46,95 L 46,68 L 30,68 L 30,60 L 46,60 Z" fill="#333" />
                </svg>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-wider text-gray-600">Instituição</div>
                <div className="font-bold text-[14px] leading-tight">Prefeitura do Município de São Paulo</div>
                <div className="text-[9px] uppercase tracking-wider text-gray-600 mt-1">Departamento</div>
                <div className="font-bold text-[12px]">Coordenadoria de Gestão de Pessoas</div>
              </div>
            </div>

            {/* Top Right Box */}
            <div className="border border-black text-[10px] divide-y divide-black text-center min-w-[150px]">
              <div className="py-0.5 px-2 font-bold flex justify-between">
                <span>Página</span>
                <span>
                  {page.pageNumber} &nbsp;/&nbsp; {totalPages}
                </span>
              </div>
              <div className="py-0.5 px-2 flex justify-between">
                <span>Emissão:</span>
                <span className="font-semibold">{page.header?.emissao || documentData.header.emissao || '19-10-2026 16:11:52'}</span>
              </div>
              <div className="py-0.5 px-2 flex justify-between font-bold">
                <span>Referência:</span>
                <span>{page.header?.referencia || documentData.header.referencia || 'REPFICH2'}</span>
              </div>
            </div>
          </div>

          {/* PAGE 1 ONLY: Servidor & Vínculo (Compacto Oficial 6.5pt) */}
          {isFirstPage && (
            <div className="space-y-1 mb-2.5 text-[6.5pt] leading-[8.5pt]">
              {/* Servidor Info */}
              <div className="space-y-0.5">
                <div className="flex flex-wrap gap-x-6">
                  <span>
                    <strong>Número</strong> &nbsp;{documentData.servidor.numero || ''}
                  </span>
                  <span>
                    <strong>Nome</strong> &nbsp;
                    <span className="font-bold">{documentData.servidor.nome || ''}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6">
                  <span>
                    <strong>Identificação RG</strong> &nbsp;{documentData.servidor.rg || ''}
                  </span>
                  <span>
                    <strong>SSP</strong> &nbsp;{documentData.servidor.ssp || ''}
                  </span>
                  <span>
                    <strong>CPF</strong> &nbsp;{documentData.servidor.cpf || ''}
                  </span>
                  <span>
                    <strong>Nacionalidade</strong> &nbsp;{documentData.servidor.nacionalidade || ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6">
                  <span>
                    <strong>Estado Civil</strong> &nbsp;{documentData.servidor.estadoCivil || ''}
                  </span>
                  <span>
                    <strong>Sexo</strong> &nbsp;{documentData.servidor.sexo || ''}
                  </span>
                  <span>
                    <strong>Data de nascimento</strong> &nbsp;{documentData.servidor.dataNascimento || ''}
                  </span>
                </div>

                <div>
                  <strong>Pai</strong> &nbsp;{documentData.servidor.pai || ''}
                </div>
                <div>
                  <strong>Mãe</strong> &nbsp;{documentData.servidor.mae || ''}
                </div>
              </div>

              {/* Black Line */}
              <hr className="border-t border-black my-1" />

              {/* Vínculo */}
              <div className="space-y-0.5">
                <div className="font-bold underline text-[7.5pt] mb-0.5">Vínculo</div>

                <div className="flex flex-wrap gap-x-6">
                  <span>
                    <strong>Número</strong> &nbsp;{documentData.vinculo.numero || ''}
                  </span>
                  <span>
                    <strong>Nomeação</strong> &nbsp;{documentData.vinculo.nomeacao || ''}
                  </span>
                  <span>
                    <strong>Posse</strong> &nbsp;{documentData.vinculo.posse || ''}
                  </span>
                  <span>
                    <strong>Exercício</strong> &nbsp;{documentData.vinculo.exercicio || ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6">
                  <span>
                    <strong>Categoria</strong> &nbsp;{documentData.vinculo.categoria || ''}
                  </span>
                  <span>
                    <strong>Regime jurídico</strong> &nbsp;{documentData.vinculo.regimeJuridico || ''}
                  </span>
                  <span>
                    <strong>Vínculo Anterior</strong> &nbsp;{documentData.vinculo.vinculoAnterior || ''}
                  </span>
                  <span>
                    <strong>Vínculo Posterior</strong> &nbsp;{documentData.vinculo.vinculoPosterior || ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6">
                  <span>
                    <strong>Tipo de Vínculo</strong> &nbsp;{documentData.vinculo.tipoVinculo || ''}
                  </span>
                  <span>
                    <strong>Matrícula1</strong> &nbsp;{documentData.vinculo.matricula1 || ''}
                  </span>
                  <span>
                    <strong>Matrícula2</strong> &nbsp;{documentData.vinculo.matricula2 || ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6">
                  <span>
                    <strong>Aposentadoria</strong> &nbsp;{documentData.vinculo.aposentadoria || ''}
                  </span>
                  <span>
                    <strong>Tipo Aposent.</strong> &nbsp;{documentData.vinculo.tipoAposent || ''}
                  </span>
                  <span>
                    <strong>Vacância</strong> &nbsp;{documentData.vinculo.vacancia || ''}
                  </span>
                  <span>
                    <strong>Forma Vacância</strong> &nbsp;{documentData.vinculo.formaVacancia || ''}
                  </span>
                </div>

                <div>
                  <strong>Motivo</strong> &nbsp;{documentData.vinculo.motivo || ''}
                </div>
              </div>

              {/* Black Line */}
              <hr className="border-t border-black my-1" />
            </div>
          )}

          {/* SECTION: Frequência */}
          {page.frequencias && page.frequencias.length > 0 && (
            <div className="mb-4">
              <div className="font-bold underline text-[12px] mb-2">Frequência</div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black text-[10px] text-gray-800">
                    <th className="py-1 w-[220px]">Período</th>
                    <th className="py-1 w-[80px] text-right pr-4">Quantidade</th>
                    <th className="py-1 w-[60px] text-right pr-4">Código</th>
                    <th className="py-1 w-[120px]">Tipo</th>
                    <th className="py-1">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {page.frequencias.map((f, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-yellow-50/50 ${
                        searchQuery &&
                        (f.descricao?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.tipo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.periodoInicio?.includes(searchQuery))
                          ? 'bg-yellow-100 font-bold'
                          : ''
                      }`}
                    >
                      <td className="py-0.5 whitespace-nowrap">
                        {f.periodoInicio} &nbsp;{f.periodoFim}
                      </td>
                      <td className="py-0.5 text-right pr-4">{f.quantidade || ''}</td>
                      <td className="py-0.5 text-right pr-4">{f.codigo || ''}</td>
                      <td className="py-0.5 whitespace-nowrap">{f.tipo || ''}</td>
                      <td className="py-0.5">{f.descricao || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION: Licença Afastamento */}
          {page.licencas && page.licencas.length > 0 && (
            <div className="mb-4">
              <div className="font-bold underline text-[12px] mb-2">Licença afastamento</div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black text-[10px] text-gray-800">
                    <th className="py-1 w-[220px]">Período</th>
                    <th className="py-1 w-[60px] text-right pr-4">Dias</th>
                    <th className="py-1 w-[60px] text-right pr-4">Código</th>
                    <th className="py-1 w-[280px]">Descrição</th>
                    <th className="py-1">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {page.licencas.map((l, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-yellow-50/50 ${
                        searchQuery &&
                        (l.descricao?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.motivo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.periodoInicio?.includes(searchQuery))
                          ? 'bg-yellow-100 font-bold'
                          : ''
                      }`}
                    >
                      <td className="py-0.5 whitespace-nowrap">
                        {l.periodoInicio} &nbsp;{l.periodoFim}
                      </td>
                      <td className="py-0.5 text-right pr-4">{l.dias || ''}</td>
                      <td className="py-0.5 text-right pr-4">{l.codigo || ''}</td>
                      <td className="py-0.5">{l.descricao || ''}</td>
                      <td className="py-0.5">{l.motivo || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION: Mapa de Frequência */}
          {page.mapaFrequencia && page.mapaFrequencia.length > 0 && (
            <div className="mb-4">
              <div className="font-bold underline text-[12px] mb-2">Mapa de Freqüência</div>
              {page.mapaFrequencia.map((anoData, aIdx) => (
                <div key={aIdx} className="mb-4">
                  <div className="font-bold text-[11px] mb-1">{anoData.ano}</div>
                  <div className="overflow-x-auto pb-1">
                    <table className="table-fixed border border-black border-collapse text-center">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black">
                          <th className="py-0.5 px-0.5 border-r border-black w-[34px] min-w-[34px] text-[7pt]">Mês</th>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <th key={d} className="py-0.5 px-0 border-r border-gray-300 last:border-none w-[11pt] min-w-[11pt] max-w-[11pt] text-[5.5pt] font-mono">
                              {d}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {anoData.meses.map((m, mIdx) => (
                          <tr key={mIdx} className="border-b border-gray-200 hover:bg-yellow-50/50">
                            <td className="font-bold py-0.5 px-0.5 border-r border-black bg-gray-50 text-left text-[6.5pt] w-[34px] min-w-[34px]">{m.mes}</td>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                              const val = m.dias[d.toString()] || m.dias[d as any] || '...';
                              const hasCode = val && val !== '...';
                              return (
                                <td
                                  key={d}
                                  className={`py-0.5 px-0 border-r border-gray-200 last:border-none font-mono text-[5.5pt] w-[11pt] min-w-[11pt] max-w-[11pt] overflow-hidden whitespace-nowrap ${
                                    hasCode ? 'font-bold text-blue-700 bg-blue-50/70' : 'text-gray-400'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER (Exact ERGON replica) */}
        <div className="border border-black text-[10px] mt-6 p-1.5 flex items-center justify-between">
          <div className="font-bold">Ergon</div>
          <div className="text-center">
            <div className="font-bold">Ergon - Recursos Humanos</div>
            <div className="text-[9px] text-gray-700">Nome do banco de dados : ORA039</div>
          </div>
          <div className="text-right">
            <div className="font-bold">Versão &nbsp; 6.4.</div>
            <div className="text-[8px] text-gray-500">T63226/5,13/11062010</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Floating Control Bar */}
      <div className="bg-[#121212] border border-white/10 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 sticky top-4 z-40 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors text-xs font-mono uppercase"
              title="Voltar"
            >
              <ChevronLeft className="w-4 h-4 inline" /> Voltar
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00FF88]/20 border border-[#00FF88]/40 flex items-center justify-center text-[#00FF88]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Reconstrução Fiel ERGON PMSP
              </div>
              <div className="text-[11px] text-white/50">
                {totalPages} Páginas Reconstruídas • Texto 100% Pesquisável
              </div>
            </div>
          </div>
        </div>

        {/* Search inside PDF */}
        <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-[#00FF88]/50">
          <Search className="w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Pesquisar termo (Ctrl+F)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-44 sm:w-56"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-white/40 hover:text-white font-mono"
            >
              LIMPAR
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
              viewMode === 'all' ? 'bg-[#252525] text-white border border-white/15' : 'text-white/60 hover:text-white'
            }`}
          >
            Todas ({totalPages})
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
              viewMode === 'single' ? 'bg-[#252525] text-white border border-white/15' : 'text-white/60 hover:text-white'
            }`}
          >
            Página por Página
          </button>
        </div>

        {/* Action Buttons: Native PDF, Excel, Word, Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Download Native PDF */}
          <button
            onClick={handleDownloadDirectPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.25)] transition-all disabled:opacity-50"
            title="Baixar arquivo PDF nativo vetorial diretamente"
          >
            <FileDown className="w-4 h-4 text-black" />
            <span>{isGeneratingPdf ? 'Gerando...' : 'Baixar PDF (.pdf)'}</span>
          </button>

          {/* Download Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#00FF88]/10 hover:bg-[#00FF88]/20 text-[#00FF88] text-xs font-mono font-bold rounded-xl border border-[#00FF88]/30 transition-colors"
            title="Exportar todas as 21 páginas para planilha Excel com abas"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Download Word */}
          <button
            onClick={handleDownloadWord}
            disabled={isGeneratingWord}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-mono font-bold rounded-xl border border-blue-500/30 transition-colors disabled:opacity-50"
            title="Exportar dados e tabelas para Microsoft Word"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Word (.docx)</span>
          </button>

          {/* Print dialog */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold rounded-xl border border-white/10 transition-colors"
            title="Imprimir ou Salvar como PDF via Navegador"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          {/* Copy Text */}
          <button
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono rounded-xl border border-white/10 transition-colors"
            title="Copiar texto consolidado"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Summary Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-white/40">Servidor Ativo</div>
            <div className="font-bold text-white text-xs truncate max-w-[150px]">
              {documentData.servidor?.nome || 'Servidor'}
            </div>
            <div className="text-[10px] text-white/50 font-mono">RF: {documentData.servidor?.numero || '-'}</div>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/20 flex items-center justify-center text-[#00FF88]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-white/40">Total de Frequências</div>
            <div className="font-bold text-white text-sm">{totalFrequencias} registros</div>
            <div className="text-[10px] text-white/50 font-mono">JEX, TEX, Faltas, Horas</div>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-white/40">Licenças & Afastamentos</div>
            <div className="font-bold text-white text-sm">{totalLicencas} registros</div>
            <div className="text-[10px] text-white/50 font-mono">Médica, Teletrabalho, Perícia</div>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-white/40">Documento Reconstruído</div>
            <div className="font-bold text-white text-sm">{totalPages} Páginas</div>
            <div className="text-[10px] text-[#00FF88] font-mono font-bold">100% Pesquisável</div>
          </div>
        </div>
      </div>

      {/* Pagination controls if in single-page mode */}
      {viewMode === 'single' && (
        <div className="flex items-center justify-center gap-4 bg-[#111111] border border-white/10 p-2.5 rounded-xl max-w-sm mx-auto print:hidden">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold text-white">
            Página {currentPage} de {totalPages}
          </span>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Printable / Rendered Pages Area */}
      <div className="flex flex-col items-center justify-center w-full">
        {viewMode === 'all'
          ? documentData.pages.map((p) => renderSinglePageContent(p))
          : renderSinglePageContent(activePageData)}
      </div>

      {/* Print CSS styles */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          nav, header, button, .print\\:hidden {
            display: none !important;
          }
          .ergon-a4-page {
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 20mm !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};
