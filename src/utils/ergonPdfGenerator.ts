import { PDFDocument, rgb, StandardFonts, PDFPage, PDFPageDrawTextOptions } from 'pdf-lib';
import { ErgonConsolidatedDocument, ErgonPageData } from '../types';
import { downloadBlob } from './exportUtils';

/**
 * Helper to ensure page.drawText NEVER receives undefined or non-string values.
 * Guarantees zero runtime crashes from pdf-lib parameter assertions.
 */
function safeDrawText(
  page: PDFPage,
  text: any,
  options: PDFPageDrawTextOptions
) {
  const str = text !== undefined && text !== null ? String(text) : '';
  page.drawText(str, options);
}

/**
 * Generates an exact, native vector PDF file of the official ERGON PMSP REPFICH2 report
 * with 100% selectable text, tiny file size, and standard PDF/A compatible structures.
 */
export async function generateNativeErgonPdf(
  documentData: ErgonConsolidatedDocument,
  customFileName?: string
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  // Embed standard Courier & Helvetica fonts for crisp vector rendering
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 Dimensions in points (72 points per inch)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 36; // 0.5 inch margins
  const contentWidth = pageWidth - marginX * 2;

  const totalPages = documentData.totalPages || documentData.pages?.length || 1;
  const pagesList = documentData.pages || [];

  for (const pageData of pagesList) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - 36; // Start near top

    // 1. TOP HEADER
    // Left: Instituição / Departamento
    safeDrawText(page, 'Instituição', {
      x: marginX,
      y: currentY,
      size: 7,
      font: fontSans,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 11;

    safeDrawText(page, 'Prefeitura do Município de São Paulo', {
      x: marginX,
      y: currentY,
      size: 11,
      font: fontSansBold,
      color: rgb(0, 0, 0),
    });
    currentY -= 9;

    safeDrawText(page, 'Departamento', {
      x: marginX,
      y: currentY,
      size: 7,
      font: fontSans,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 10;

    safeDrawText(page, 'Coordenadoria de Gestão de Pessoas', {
      x: marginX,
      y: currentY,
      size: 9,
      font: fontSansBold,
      color: rgb(0, 0, 0),
    });

    // Right: Box with Page, Emissão, Referência
    const boxW = 145;
    const boxH = 42;
    const boxX = pageWidth - marginX - boxW;
    const boxY = pageHeight - 36 - boxH + 6;

    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.8,
    });

    // Subdividers
    page.drawLine({
      start: { x: boxX, y: boxY + 28 },
      end: { x: boxX + boxW, y: boxY + 28 },
      color: rgb(0, 0, 0),
      thickness: 0.5,
    });
    page.drawLine({
      start: { x: boxX, y: boxY + 14 },
      end: { x: boxX + boxW, y: boxY + 14 },
      color: rgb(0, 0, 0),
      thickness: 0.5,
    });

    // Box texts
    safeDrawText(page, 'Página', { x: boxX + 6, y: boxY + 31, size: 7.5, font: fontSansBold });
    safeDrawText(page, `${pageData.pageNumber || 1}  /  ${totalPages}`, {
      x: boxX + boxW - 40,
      y: boxY + 31,
      size: 7.5,
      font: fontRegular,
    });

    safeDrawText(page, 'Emissão:', { x: boxX + 6, y: boxY + 17, size: 7, font: fontSans });
    safeDrawText(page, documentData.header?.emissao || '19-10-2026 16:11:52', {
      x: boxX + 50,
      y: boxY + 17,
      size: 7,
      font: fontRegular,
    });

    safeDrawText(page, 'Referência:', { x: boxX + 6, y: boxY + 3.5, size: 7.5, font: fontSansBold });
    safeDrawText(page, documentData.header?.referencia || 'REPFICH2', {
      x: boxX + boxW - 55,
      y: boxY + 3.5,
      size: 8,
      font: fontBold,
    });

    currentY = boxY - 12;

    // Header divider line
    page.drawLine({
      start: { x: marginX, y: currentY },
      end: { x: pageWidth - marginX, y: currentY },
      color: rgb(0, 0, 0),
      thickness: 1,
    });
    currentY -= 12;

    // 2. PAGE 1 ONLY: Servidor & Vínculo (Tipografia Oficial Compacta 6.5pt)
    if (pageData.pageNumber === 1) {
      const s = documentData.servidor || {};
      const v = documentData.vinculo || {};

      // Servidor lines (6.5pt com entrelinha de 8.5pt)
      safeDrawText(page, `Número ${s.numero || ''}   Nome ${s.nome || ''}`, {
        x: marginX,
        y: currentY,
        size: 6.5,
        font: fontRegular,
      });
      currentY -= 8.5;

      safeDrawText(
        page,
        `Identificação RG ${s.rg || ''}   SSP ${s.ssp || ''}   CPF ${s.cpf || ''}   Nacionalidade ${s.nacionalidade || ''}`,
        { x: marginX, y: currentY, size: 6.5, font: fontRegular }
      );
      currentY -= 8.5;

      safeDrawText(
        page,
        `Estado Civil ${s.estadoCivil || ''}   Sexo ${s.sexo || ''}   Data de nascimento ${s.dataNascimento || ''}`,
        { x: marginX, y: currentY, size: 6.5, font: fontRegular }
      );
      currentY -= 8.5;

      safeDrawText(page, `Pai ${s.pai || ''}`, {
        x: marginX,
        y: currentY,
        size: 6.5,
        font: fontRegular,
      });
      currentY -= 8.5;

      safeDrawText(page, `Mãe ${s.mae || ''}`, {
        x: marginX,
        y: currentY,
        size: 6.5,
        font: fontRegular,
      });
      currentY -= 7.5;

      // Divider line
      page.drawLine({
        start: { x: marginX, y: currentY },
        end: { x: pageWidth - marginX, y: currentY },
        thickness: 0.5,
      });
      currentY -= 8.5;

      // Vínculo title
      safeDrawText(page, 'Vínculo', { x: marginX, y: currentY, size: 7.5, font: fontBold });
      currentY -= 8.5;

      safeDrawText(
        page,
        `Número ${v.numero || ''}   Nomeação ${v.nomeacao || ''}   Posse ${v.posse || ''}   Exercício ${v.exercicio || ''}`,
        { x: marginX, y: currentY, size: 6.5, font: fontRegular }
      );
      currentY -= 8.5;

      safeDrawText(
        page,
        `Categoria ${v.categoria || ''}   Regime jurídico ${v.regimeJuridico || ''}   Vínculo Anterior ${v.vinculoAnterior || ''}   Vínculo Posterior ${v.vinculoPosterior || ''}`,
        { x: marginX, y: currentY, size: 6.5, font: fontRegular }
      );
      currentY -= 8.5;

      safeDrawText(page, `Tipo de Vínculo ${v.tipoVinculo || ''}   Matrícula1 ${v.matricula1 || ''}   Matrícula2 ${v.matricula2 || ''}`, {
        x: marginX,
        y: currentY,
        size: 6.5,
        font: fontRegular,
      });
      currentY -= 8.5;

      safeDrawText(page, `Aposentadoria ${v.aposentadoria || ''}   Tipo Aposent. ${v.tipoAposent || ''}   Vacância ${v.vacancia || ''}   Forma Vacância ${v.formaVacancia || ''}`, {
        x: marginX,
        y: currentY,
        size: 6.5,
        font: fontRegular,
      });
      currentY -= 8.5;

      safeDrawText(page, `Motivo ${v.motivo || ''}`, { x: marginX, y: currentY, size: 6.5, font: fontRegular });
      currentY -= 7.5;

      // Divider line
      page.drawLine({
        start: { x: marginX, y: currentY },
        end: { x: pageWidth - marginX, y: currentY },
        thickness: 0.5,
      });
      currentY -= 9;
    }

    // 3. TABELA DE FREQUÊNCIA
    if (pageData.frequencias && pageData.frequencias.length > 0) {
      safeDrawText(page, 'Frequência', { x: marginX, y: currentY, size: 8, font: fontBold });
      currentY -= 9;

      safeDrawText(page, 'Período                    Quantidade  Código  Tipo        Descrição', {
        x: marginX,
        y: currentY,
        size: 7,
        font: fontBold,
      });
      currentY -= 9;

      for (const f of pageData.frequencias) {
        if (!f) continue;
        if (currentY < 55) break; // Keep room for footer

        const pStr = `${String(f.periodoInicio || '').padEnd(10, ' ')}  ${String(f.periodoFim || '').padEnd(10, ' ')}`;
        const qStr = String(f.quantidade ?? '').padStart(5, ' ');
        const cStr = String(f.codigo ?? '').padStart(5, ' ');
        const tStr = String(f.tipo || '').padEnd(10, ' ');
        const dStr = String(f.descricao || '').slice(0, 52);

        safeDrawText(page, `${pStr}    ${qStr}   ${cStr}   ${tStr}  ${dStr}`, {
          x: marginX,
          y: currentY,
          size: 7,
          font: fontRegular,
        });
        currentY -= 8.5;
      }
    }

    // 4. TABELA DE LICENÇA AFASTAMENTO
    if (pageData.licencas && pageData.licencas.length > 0) {
      currentY -= 6;
      safeDrawText(page, 'Licença afastamento', { x: marginX, y: currentY, size: 8.5, font: fontBold });
      currentY -= 10;

      safeDrawText(page, 'Período                    Dias  Código  Descrição                    Motivo', {
        x: marginX,
        y: currentY,
        size: 7.5,
        font: fontBold,
      });
      currentY -= 10;

      for (const l of pageData.licencas) {
        if (!l) continue;
        if (currentY < 60) break;

        const pStr = `${String(l.periodoInicio || '').padEnd(10, ' ')}  ${String(l.periodoFim || '').padEnd(10, ' ')}`;
        const dStr = String(l.dias ?? '').padStart(4, ' ');
        const cStr = String(l.codigo ?? '').padStart(5, ' ');
        const descStr = String(l.descricao || '').slice(0, 30).padEnd(30, ' ');
        const motStr = String(l.motivo || '').slice(0, 36);

        safeDrawText(page, `${pStr}   ${dStr}  ${cStr}   ${descStr}  ${motStr}`, {
          x: marginX,
          y: currentY,
          size: 7.5,
          font: fontRegular,
        });
        currentY -= 9.5;
      }
    }

    // 5. MAPA DE FREQUÊNCIA (Grade Milimétrica de 31 colunas x 11pt)
    if (pageData.mapaFrequencia && pageData.mapaFrequencia.length > 0) {
      safeDrawText(page, 'Mapa de Freqüência', { x: marginX, y: currentY, size: 8, font: fontBold });
      currentY -= 10;

      for (const anoData of pageData.mapaFrequencia) {
        if (!anoData) continue;
        if (currentY < 75) break;

        safeDrawText(page, `Ano: ${anoData.ano || ''}`, { x: marginX, y: currentY, size: 7.5, font: fontBold });
        currentY -= 8.5;

        // Cabeçalho dos 31 dias com exatamente 11pt por coluna
        safeDrawText(page, 'Mês', { x: marginX, y: currentY, size: 5.5, font: fontBold });
        for (let d = 1; d <= 31; d++) {
          const colX = marginX + 28 + (d - 1) * 11;
          safeDrawText(page, String(d), { x: colX, y: currentY, size: 5, font: fontBold });
        }
        currentY -= 7.5;

        // Linhas de cada mês com alinhamento milimétrico por coluna
        const mesesList = Array.isArray(anoData.meses) ? anoData.meses : [];
        for (const m of mesesList) {
          if (!m) continue;
          if (currentY < 55) break;

          const mesNome = String(m.mes || (m as any).nome || (m as any).month || '').trim();
          safeDrawText(page, mesNome, { x: marginX, y: currentY, size: 5.5, font: fontBold });
          for (let d = 1; d <= 31; d++) {
            const colX = marginX + 28 + (d - 1) * 11;
            let val = '...';
            if (m.dias && typeof m.dias === 'object') {
              const raw = m.dias[d.toString()] ?? m.dias[d as any];
              if (raw !== undefined && raw !== null) {
                val = String(raw).trim();
              }
            }
            if (!val || val === '') val = '...';

            const isCode = val !== '...';
            safeDrawText(page, val.slice(0, 3), {
              x: colX,
              y: currentY,
              size: 4.8,
              font: isCode ? fontBold : fontRegular,
              color: isCode ? rgb(0, 0, 0) : rgb(0.4, 0.4, 0.4),
            });
          }

          currentY -= 6.8;
        }
        currentY -= 6;
      }
    }

    // 6. BOTTOM FOOTER BOX (Exact ERGON replica)
    const footH = 26;
    const footY = 24;

    page.drawRectangle({
      x: marginX,
      y: footY,
      width: contentWidth,
      height: footH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.8,
    });

    safeDrawText(page, 'Ergon', {
      x: marginX + 10,
      y: footY + 9,
      size: 9,
      font: fontBold,
    });

    const centerText = 'Ergon - Recursos Humanos';
    safeDrawText(page, centerText, {
      x: pageWidth / 2 - 50,
      y: footY + 13,
      size: 8,
      font: fontBold,
    });

    safeDrawText(page, 'Nome do banco de dados : ORA039', {
      x: pageWidth / 2 - 62,
      y: footY + 4,
      size: 6.5,
      font: fontRegular,
    });

    safeDrawText(page, 'Versão    6.4.', {
      x: pageWidth - marginX - 85,
      y: footY + 13,
      size: 8,
      font: fontBold,
    });

    safeDrawText(page, 'T63226/5,13/11062010', {
      x: pageWidth - marginX - 90,
      y: footY + 4,
      size: 6.5,
      font: fontRegular,
    });
  }

  // Save PDF bytes and download directly
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  let finalFileName = customFileName;
  if (!finalFileName) {
    const rf = (documentData.servidor?.numero || '').trim();
    const vinculo = (documentData.vinculo?.numero || '1').trim();
    const nome = (documentData.servidor?.nome || 'Servidor').trim();
    const cleanNome = nome.replace(/[/\\?%*:|"<>]/g, '').trim();
    const cleanRf = rf.replace(/[/\\?%*:|"<>]/g, '').trim();
    const cleanVinculo = vinculo.replace(/[/\\?%*:|"<>]/g, '').trim();
    finalFileName = cleanRf
      ? `${cleanNome} - RF ${cleanRf} - Vinculo ${cleanVinculo} - REPFICH2.pdf`
      : `${cleanNome} - Vinculo ${cleanVinculo} - REPFICH2.pdf`;
  }

  downloadBlob(blob, finalFileName);
  return blob;
}
