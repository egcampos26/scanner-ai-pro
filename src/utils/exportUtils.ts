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
import { TableDataWrapper, ErgonConsolidatedDocument } from '../types';

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
 * Exports visual HTML to a .doc Microsoft Word file
 */
export function exportToWordVisual(
  htmlContent: string,
  title: string = 'Documento_Visual'
) {
  let allHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Calibri, Arial, sans-serif; }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
  
  const blob = new Blob([allHtml], { type: 'application/msword' });
  const cleanName = sanitizeFilename(title) || 'documento_visual';
  downloadBlob(blob, `${cleanName}.doc`);
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

  // Se houver conteúdo HTML (Modo Layout Visual), exportamos como .xls estruturado
  const isVisualMode = tableData.tabelas.some(t => t.htmlContent);

  if (isVisualMode) {
    let allHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 800px; margin: 0 auto 20px auto; font-family: Calibri, Arial, sans-serif; font-size: 12px; }
          td, th { padding: 4px; border: 1px solid #000; }
          h1, h2, h3, h4, h5, div, span, p { font-family: Calibri, Arial, sans-serif; }
        </style>
      </head>
      <body>
    `;
    
    tableData.tabelas.forEach((tab, index) => {
      if (tab.htmlContent) {
        allHtml += `${tab.htmlContent}\n<br/><br/>`;
      }
    });
    
    allHtml += `</body></html>`;
    
    // Exportamos como .xls clássico que o Excel interpreta com toda a formatação nativa!
    const blob = new Blob([allHtml], { type: 'application/vnd.ms-excel' });
    const cleanName = sanitizeFilename(title) || 'planilha_visual';
    downloadBlob(blob, `${cleanName}.xls`);
    return;
  }

  // Modo Dados Planos: exporta como .xlsx limpo para banco de dados
  const workbook = XLSX.utils.book_new();

  tableData.tabelas.forEach((tab, index) => {
    let sheetName = (tab.titulo || `Tabela ${index + 1}`).replace(/[\\/*?:[\]]/g, '').slice(0, 31);
    if (!sheetName.trim()) sheetName = `Planilha_${index + 1}`;

    let worksheet: XLSX.WorkSheet;

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

/**
 * Exports consolidated ERGON document to Microsoft Word (.docx)
 */
export async function exportErgonToWordDocx(docData: ErgonConsolidatedDocument) {
  const s = docData.servidor || {};
  const v = docData.vinculo || {};
  const paragraphs: (Paragraph | Table)[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      text: 'PREFEITURA DO MUNICÍPIO DE SÃO PAULO',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: 'COORDENADORIA DE GESTÃO DE PESSOAS - SISTEMA ERGON (REPFICH2)',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Servidor
  paragraphs.push(
    new Paragraph({
      text: 'DADOS DO SERVIDOR',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Nome: ', bold: true }),
        new TextRun(s.nome || ''),
        new TextRun({ text: ' | RF/Número: ', bold: true }),
        new TextRun(s.numero || ''),
        new TextRun({ text: ' | CPF: ', bold: true }),
        new TextRun(s.cpf || ''),
        new TextRun({ text: ' | RG: ', bold: true }),
        new TextRun(`${s.rg || ''} ${s.ssp || ''}`),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Nascimento: ', bold: true }),
        new TextRun(s.dataNascimento || ''),
        new TextRun({ text: ' | Estado Civil: ', bold: true }),
        new TextRun(s.estadoCivil || ''),
        new TextRun({ text: ' | Sexo: ', bold: true }),
        new TextRun(s.sexo || ''),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Filiação: ', bold: true }),
        new TextRun(`${s.pai || ''} e ${s.mae || ''}`),
      ],
      spacing: { after: 200 },
    })
  );

  // Vínculo
  paragraphs.push(
    new Paragraph({
      text: 'DADOS DO VÍNCULO',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Vínculo Nº: ', bold: true }),
        new TextRun(v.numero || ''),
        new TextRun({ text: ' | Nomeação: ', bold: true }),
        new TextRun(v.nomeacao || ''),
        new TextRun({ text: ' | Posse: ', bold: true }),
        new TextRun(v.posse || ''),
        new TextRun({ text: ' | Exercício: ', bold: true }),
        new TextRun(v.exercicio || ''),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Categoria: ', bold: true }),
        new TextRun(v.categoria || ''),
        new TextRun({ text: ' | Regime: ', bold: true }),
        new TextRun(v.regimeJuridico || ''),
        new TextRun({ text: ' | Tipo: ', bold: true }),
        new TextRun(v.tipoVinculo || ''),
      ],
      spacing: { after: 200 },
    })
  );

  // Frequência Table
  const allFreq = docData.frequencias || [];
  if (allFreq.length > 0) {
    paragraphs.push(
      new Paragraph({
        text: `HISTÓRICO COMPLETO DE FREQUÊNCIA (${allFreq.length} REGISTROS)`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      })
    );

    const freqTableRows: TableRow[] = [
      new TableRow({
        children: ['Período', 'Qtd', 'Cód', 'Tipo', 'Descrição'].map(
          (h) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
              shading: { fill: 'EEEEEE' },
            })
        ),
      }),
    ];

    allFreq.forEach((f) => {
      freqTableRows.push(
        new TableRow({
          children: [
            `${f.periodoInicio} a ${f.periodoFim}`,
            String(f.quantidade || ''),
            String(f.codigo || ''),
            String(f.tipo || ''),
            String(f.descricao || ''),
          ].map(
            (c) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: c, size: 18 })] })],
              })
          ),
        })
      );
    });

    paragraphs.push(new Table({ rows: freqTableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  }

  // Licença Table
  const allLic = docData.licencas || [];
  if (allLic.length > 0) {
    paragraphs.push(
      new Paragraph({
        text: `LICENÇAS E AFASTAMENTOS (${allLic.length} REGISTROS)`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      })
    );

    const licTableRows: TableRow[] = [
      new TableRow({
        children: ['Período', 'Dias', 'Cód', 'Descrição', 'Motivo'].map(
          (h) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
              shading: { fill: 'EEEEEE' },
            })
        ),
      }),
    ];

    allLic.forEach((l) => {
      licTableRows.push(
        new TableRow({
          children: [
            `${l.periodoInicio} a ${l.periodoFim}`,
            String(l.dias || ''),
            String(l.codigo || ''),
            String(l.descricao || ''),
            String(l.motivo || ''),
          ].map(
            (c) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: c, size: 18 })] })],
              })
          ),
        })
      );
    });

    paragraphs.push(new Table({ rows: licTableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (s.nome || 'Servidor').replace(/[^a-zA-Z0-9]/g, '_');
  downloadBlob(blob, `Ergon_PMSP_${safeName}_REPFICH2.docx`);
}
