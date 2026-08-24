import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Copy,
  Check,
  FileCode,
  FileText,
  AlertTriangle,
  FileCheck,
  Calculator,
} from 'lucide-react';
import { DocumentTable, ScanResultData, TableDataWrapper } from '../types';
import { exportToCsv, exportToExcelXlsx, exportToJson } from '../utils/exportUtils';

interface ExcelResultViewerProps {
  result: ScanResultData;
  onUpdateTableData: (newTableData: TableDataWrapper) => void;
}

export const ExcelResultViewer: React.FC<ExcelResultViewerProps> = ({
  result,
  onUpdateTableData,
}) => {
  const [tableData, setTableData] = useState<TableDataWrapper>(
    result.tableData || {
      tabelas: [
        {
          titulo: result.documentTitle || 'Tabela_1',
          colunas: ['Item', 'Descricao', 'Valor'],
          linhas: [{ Item: '01', Descricao: 'Registro Exemplo', Valor: 'R$ 100,00' }],
        },
      ],
    }
  );

  const [activeTableIndex, setActiveTableIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);

  const currentTable: DocumentTable =
    tableData.tabelas[activeTableIndex] || tableData.tabelas[0] || { titulo: 'Nenhuma Tabela', colunas: [], linhas: [] };
  const columns = currentTable.colunas || Object.keys(currentTable.linhas[0] || {});

  // Calculate totals and incomprehensibles
  let incomprehensibleCount = 0;
  tableData.tabelas.forEach((tab) => {
    tab.linhas.forEach((row) => {
      Object.values(row).forEach((val) => {
        if (String(val).includes('[INCOMPREENSÍVEL]')) {
          incomprehensibleCount++;
        }
      });
    });
  });

  const handleCellChange = (rowIndex: number, colKey: string, value: string) => {
    const updatedTables = [...tableData.tabelas];
    const targetTable = { ...updatedTables[activeTableIndex] };
    const updatedRows = [...targetTable.linhas];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [colKey]: value,
    };
    targetTable.linhas = updatedRows;
    updatedTables[activeTableIndex] = targetTable;

    const newWrapper = { tabelas: updatedTables };
    setTableData(newWrapper);
    onUpdateTableData(newWrapper);
  };

  const handleAddRow = () => {
    const updatedTables = [...tableData.tabelas];
    const targetTable = { ...updatedTables[activeTableIndex] };
    const newRow: Record<string, string> = {};
    columns.forEach((col) => {
      newRow[col] = '';
    });
    targetTable.linhas = [...targetTable.linhas, newRow];
    updatedTables[activeTableIndex] = targetTable;

    const newWrapper = { tabelas: updatedTables };
    setTableData(newWrapper);
    onUpdateTableData(newWrapper);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const updatedTables = [...tableData.tabelas];
    const targetTable = { ...updatedTables[activeTableIndex] };
    targetTable.linhas = targetTable.linhas.filter((_, idx) => idx !== rowIndex);
    updatedTables[activeTableIndex] = targetTable;

    const newWrapper = { tabelas: updatedTables };
    setTableData(newWrapper);
    onUpdateTableData(newWrapper);
  };

  const handleExportXlsx = () => {
    exportToExcelXlsx(tableData, result.documentTitle || 'Planilha_Extraida');
  };

  const handleExportCsv = () => {
    exportToCsv(tableData, result.documentTitle || 'Dados_CSV');
  };

  const handleExportJson = () => {
    exportToJson(tableData, result.documentTitle || 'Dados_JSON');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(tableData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Action Bar */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-[#00FF88]">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {result.documentTitle || 'Planilha Financeira'}
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30">
                Excel (.xlsx / JSON)
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-white/50 mt-0.5">
              <span>{tableData.tabelas.length} tabela(s)</span>
              <span>•</span>
              <span>{currentTable.linhas.length} linhas de dados</span>
              <span>•</span>
              <span>Precisão Numérica: <strong className="text-[#00FF88]">{result.confidenceScore}%</strong></span>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3 py-2 text-xs font-mono font-medium text-white/80 bg-[#1A1A1A] border border-white/10 hover:bg-[#222222] hover:text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00FF88]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-mono font-medium text-white/80 bg-[#1A1A1A] border border-white/10 hover:bg-[#222222] hover:text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#00FF88]" />
            <span>Baixar CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2 text-xs font-mono font-medium text-white/80 bg-[#1A1A1A] border border-white/10 hover:bg-[#222222] hover:text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Baixar JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportXlsx}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold text-black bg-[#00FF88] hover:bg-[#00FF88]/90 active:scale-[0.98] rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.25)] flex items-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Baixar Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Detection Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        {incomprehensibleCount > 0 ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/70 text-rose-300 border border-rose-500/40 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {incomprehensibleCount} campo(s) rasurado(s) marcados como [INCOMPREENSÍVEL]
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30">
            <FileCheck className="w-3.5 h-3.5" />
            Tabelas e valores numéricos 100% íntegros
          </span>
        )}

        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] text-white/60 border border-white/10">
          <Calculator className="w-3.5 h-3.5 text-[#00FF88]" />
          Edição interativa de células habilitada
        </span>
      </div>

      {/* Multi-table Tabs (if multiple tables detected) */}
      {tableData.tabelas.length > 1 && (
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          {tableData.tabelas.map((tab, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTableIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTableIndex === idx
                  ? 'bg-[#00FF88] text-black font-bold shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                  : 'bg-[#181818] text-white/60 hover:text-white border border-white/10'
              }`}
            >
              {tab.titulo || `Tabela ${idx + 1}`} ({tab.linhas.length})
            </button>
          ))}
        </div>
      )}

      {/* Spreadsheet Grid Container */}
      <div className="bg-[#0E0E0E] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3 bg-[#141414] border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF88]" />
            {currentTable.titulo || `Tabela ${activeTableIndex + 1}`}
          </span>
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1 bg-[#1F1F1F] hover:bg-[#282828] border border-white/15 rounded-lg text-xs font-mono font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#00FF88]" />
            <span>Adicionar Linha</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#181818] text-white/70 border-b border-white/10 sticky top-0 z-10 font-mono">
                <th className="py-2.5 px-3 w-12 text-center text-white/30 text-[11px]">#</th>
                {columns.map((col, cIdx) => (
                  <th key={cIdx} className="py-2.5 px-4 font-bold text-[#00FF88] border-r border-white/10 uppercase tracking-wider text-[11px]">
                    {col}
                  </th>
                ))}
                <th className="py-2.5 px-3 w-12 text-center text-white/50">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0E0E0E] font-mono text-[12px]">
              {currentTable.linhas.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#161616] transition-colors">
                  <td className="py-2 px-3 text-center text-white/40 text-[11px] bg-[#111111]/80">
                    {rIdx + 1}
                  </td>
                  {columns.map((col, cIdx) => {
                    const rawVal = row[col] !== undefined ? String(row[col]) : '';
                    const isIncomprehensible = rawVal.includes('[INCOMPREENSÍVEL]');

                    return (
                      <td
                        key={cIdx}
                        className="py-1.5 px-3 border-r border-white/5 relative focus-within:ring-1 focus-within:ring-[#00FF88] focus-within:bg-[#1A1A1A]"
                      >
                        {isIncomprehensible ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-rose-950 text-rose-300 rounded font-bold text-[10px] border border-rose-500/40">
                              [INCOMPREENSÍVEL]
                            </span>
                            <input
                              type="text"
                              value={rawVal}
                              onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                              className="w-full bg-transparent focus:outline-none text-white"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={rawVal}
                            onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                            className="w-full bg-transparent focus:outline-none text-white hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors"
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="py-1.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rIdx)}
                      className="p-1 text-white/30 hover:text-rose-400 rounded hover:bg-rose-950/40 transition-colors"
                      title="Excluir linha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
