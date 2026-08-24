import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { TableDataWrapper } from '../types';

/**
 * Exports extracted document text / Markdown to Microsoft Word (.docx)
 */
export async function exportToWordDocx(
  markdownContent: string,
  title: string = 'Documento_Digitalizado',
  metadata?: {
    classification?: string;
    language?: string;
    incomprehensibleCount?: number;
  }
) {
  const lines = markdownContent.split('\n');
  const docParagraphs: (Paragraph | Table)[] = [];

  // Header Title
  docParagraphs.push(
    new Paragraph({
      text: title.toUpperCase(),
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      alignment: AlignmentType.CENTER,
    })
  );

  // Metadata subline
  if (metadata?.classification) {
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Tipo: ${metadata.classification} | Digitalizado via DocScan AI | Data: ${new Date().toLocaleDateString('pt-BR')}`,
            italics: true,
            size: 18,
            color: '666666',
          }),
        ],
        spacing: { after: 300 },
        alignment: AlignmentType.CENTER,
      })
    );
  }

  // Parse lines into Word paragraphs, headings, bullet lists, or tables
  let inTable = false;
  let tableRowsBuffer: string[] = [];

  function flushTableBuffer() {
    if (tableRowsBuffer.length === 0) return;

    // Filter out separator lines (|---|---|)
    const dataLines = tableRowsBuffer.filter(
      (line) => !line.trim().match(/^\|?[\s-:]+(\|[\s-:]+)+\|?$/)
    );

    if (dataLines.length > 0) {
      const docTableRows: TableRow[] = [];

      dataLines.forEach((line, rowIndex) => {
        const cells = line
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => (idx > 0 && idx < arr.length - 1) || arr.length <= 2);

        if (cells.length > 0) {
          const tableCells = cells.map(
            (cellText) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cellText,
                        bold: rowIndex === 0,
                      }),
                    ],
                  }),
                ],
                width: {
                  size: Math.floor(100 / Math.max(1, cells.length)),
                  type: WidthType.PERCENTAGE,
                },
                shading: rowIndex === 0 ? { fill: 'F3F4F6' } : undefined,
              })
          );

          docTableRows.push(new TableRow({ children: tableCells }));
        }
      });

      if (docTableRows.length > 0) {
        docParagraphs.push(
          new Table({
            rows: docTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
        docParagraphs.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      }
    }

    tableRowsBuffer = [];
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Table detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableRowsBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      flushTableBuffer();
    }

    if (!trimmed) {
      docParagraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      docParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      docParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      docParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 150, after: 80 },
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet list item
      const itemText = trimmed.replace(/^[-*]\s+/, '');
      docParagraphs.push(
        new Paragraph({
          children: parseInlineFormatting(itemText),
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    } else if (trimmed.match(/^\d+\.\s+/)) {
      // Numbered list
      const itemText = trimmed.replace(/^\d+\.\s+/, '');
      docParagraphs.push(
        new Paragraph({
          children: parseInlineFormatting(itemText),
          spacing: { after: 80 },
        })
      );
    } else {
      // Standard paragraph
      docParagraphs.push(
        new Paragraph({
          children: parseInlineFormatting(trimmed),
          spacing: { after: 140 },
          alignment: AlignmentType.BOTH,
        })
      );
    }
  }

  if (inTable) {
    flushTableBuffer();
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch / 2.54cm
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanName = sanitizeFilename(title) || 'documento_digitalizado';
  downloadBlob(blob, `${cleanName}.docx`);
}

/**
 * Parses bold, italic, and [INCOMPREENSÍVEL] tags into TextRun elements
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];

  // Match bold **text**, italic *text*, and [INCOMPREENSÍVEL]
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[INCOMPREENSÍVEL\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before match
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({
          text: text.substring(lastIndex, match.index),
          size: 22, // 11pt
        })
      );
    }

    const matchedStr = match[0];
    if (matchedStr === '[INCOMPREENSÍVEL]') {
      runs.push(
        new TextRun({
          text: '[INCOMPREENSÍVEL]',
          bold: true,
          color: 'DC2626', // Red
          highlight: 'yellow',
          size: 20,
        })
      );
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      runs.push(
        new TextRun({
          text: matchedStr.slice(2, -2),
          bold: true,
          size: 22,
        })
      );
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      runs.push(
        new TextRun({
          text: matchedStr.slice(1, -1),
          italics: true,
          size: 22,
        })
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(
      new TextRun({
        text: text.substring(lastIndex),
        size: 22,
      })
    );
  }

  return runs.length > 0 ? runs : [new TextRun({ text, size: 22 })];
}

/**
 * Exports extracted tables to Microsoft Excel (.xlsx)
 */
export function exportToExcelXlsx(
  tableData: TableDataWrapper | undefined,
  title: string = 'Planilha_Extraida'
) {
  if (!tableData || !tableData.tabelas || tableData.tabelas.length === 0) {
    alert('Nenhuma tabela encontrada para exportar.');
    return;
  }

  const workbook = XLSX.utils.book_new();

  tableData.tabelas.forEach((tab, index) => {
    let sheetName = (tab.titulo || `Tabela ${index + 1}`).replace(/[\\/*?:[\]]/g, '').slice(0, 31);
    if (!sheetName.trim()) sheetName = `Planilha_${index + 1}`;

    let worksheet: XLSX.WorkSheet;

    if (tab.htmlContent) {
      // Create a temporary DOM element to hold the HTML table
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = tab.htmlContent;
      const tableElement = tempDiv.querySelector('table');
      
      if (tableElement) {
        worksheet = XLSX.utils.table_to_sheet(tableElement, { raw: false });
      } else {
        // Fallback if no table tag is found
        worksheet = XLSX.utils.aoa_to_sheet([['Erro', 'Tabela HTML não encontrada no conteúdo']]);
      }
    } else {
      const headers = tab.colunas || Object.keys(tab.linhas[0] || {});
      const rows = tab.linhas.map((row) => {
        const rowArr: (string | number)[] = [];
        headers.forEach((h) => {
          rowArr.push(row[h] !== undefined ? row[h] : '');
        });
        return rowArr;
      });

      const worksheetData = [headers, ...rows];
      worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Auto-calculate column widths for standard mode
      const colWidths = headers.map((header, colIdx) => {
        let maxLen = header.length;
        rows.forEach((r) => {
          const val = String(r[colIdx] || '');
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(60, Math.max(12, maxLen + 3)) };
      });
      worksheet['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const cleanName = sanitizeFilename(title) || 'planilha_extraida';
  XLSX.writeFile(workbook, `${cleanName}.xlsx`);
}

/**
 * Exports table data to CSV format
 */
export function exportToCsv(tableData: TableDataWrapper | undefined, title: string = 'dados_extraidos') {
  if (!tableData || !tableData.tabelas || tableData.tabelas.length === 0) return;

  const firstTable = tableData.tabelas[0];
  const headers = firstTable.colunas || Object.keys(firstTable.linhas[0] || {});

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCsvCell).join(','));

  firstTable.linhas.forEach((row) => {
    const values = headers.map((h) => escapeCsvCell(row[h] !== undefined ? String(row[h]) : ''));
    csvRows.push(values.join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n'); // BOM for Excel UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${sanitizeFilename(title)}.csv`);
}

/**
 * Exports data to formatted JSON
 */
export function exportToJson(data: any, filename: string = 'dados_extraidos') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadBlob(blob, `${sanitizeFilename(filename)}.json`);
}

function escapeCsvCell(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 50);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
