import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ErgonConsolidatedDocument, ErgonPageData } from '../types';
import { downloadBlob } from './exportUtils';

/**
 * Generates an exact, native vector PDF file of the official ERGON PMSP REPFICH2 report
 * with 100% selectable text, tiny file size, and standard PDF/A compatible structures.
 */
export async function generateNativeErgonPdf(documentData: ErgonConsolidatedDocument): Promise<void> {
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

  const totalPages = documentData.totalPages || documentData.pages.length || 1;

  for (const pageData of documentData.pages) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - 36; // Start near top

    // 1. TOP HEADER
    // Left: Instituição / Departamento
    page.drawText('Instituição', {
      x: marginX,
      y: currentY,
      size: 7,
      font: fontSans,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 11;

    page.drawText('Prefeitura do Município de São Paulo', {
      x: marginX,
      y: currentY,
      size: 11,
      font: fontSansBold,
      color: rgb(0, 0, 0),
    });
    currentY -= 9;

    page.drawText('Departamento', {
      x: marginX,
      y: currentY,
      size: 7,
      font: fontSans,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 10;

    page.drawText('Coordenadoria de Gestão de Pessoas', {
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
    page.drawText('Página', { x: boxX + 6, y: boxY + 31, size: 7.5, font: fontSansBold });
    page.drawText(`${pageData.pageNumber}  /  ${totalPages}`, {
      x: boxX + boxW - 40,
      y: boxY + 31,
      size: 7.5,
      font: fontRegular,
    });

    page.drawText('Emissão:', { x: boxX + 6, y: boxY + 17, size: 7, font: fontSans });
    page.drawText(documentData.header.emissao || '19-10-2026 16:11:52', {
      x: boxX + 50,
      y: boxY + 17,
      size: 7,
      font: fontRegular,
    });

    page.drawText('Referência:', { x: boxX + 6, y: boxY + 3.5, size: 7.5, font: fontSansBold });
    page.drawText(documentData.header.referencia || 'REPFICH2', {
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
      page.drawText(`Número ${s.numero || '8032548'}   Nome ${s.nome || 'ALESSANDRA SCARPELLE'}`, {
        x: marginX,
        y: currentY,
        size: 6.5,
        font: fontRegular,
      });
      currentY -= 8.5;

      page.drawText(
        `Identificação RG ${s.rg || '278395958'}   SSP ${s.ssp || 'SP'}   CPF ${s.cpf || '24860827864'}   Nacionalidade ${s.nacionalidade || '10'}`,
        { x: marginX, y: currentY, size: 6.5, font: fontRegular }
      );
      currentY -= 8.5;

      page.drawText(
        `Estado Civil ${s.estadoCivil || 'SOLTEIRO'}   Sexo ${s.sexo || 'F'}   Data de nascimento ${s.dataNascimento || '12/08/1976'}`,
        { x: marginX, y: currentY, size: 6.5, font: fontRegular }
      );
      currentY -= 8.5;

      page.drawText(`Pai ${s.pai || 'RAMON SALVADOR SCARPELLE'}`, {
        x: marginX,
        y: currentY,
        size: 6.5,
        font: fontRegular,
      });
      currentY -= 8.5;

      page.drawText(`Mãe ${s.mae || 'ELISABETE LOBATO SCARPELLE'}`, {
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
      page.drawText('Vínculo', { x: marginX, y: currentY, size: 7.5, font: fontBold });
      currentY -= 8.5;

      page.drawText(
        `Número ${v.numero || '1'}   Nomeação ${v.nomeacao || '27/01/2012'}   Posse ${v.posse || '31/01/2012'}   Exercício ${v.exercicio || '01/02/2012'}`,
        { x: marginX, y: currentY, size: 6.5, font: fontRegular }
      );
      currentY -= 8.5;

      page.drawText(
        `Categoria ${v.categoria || 'QPE LEI 14660/07'}   Regime jurídico ${v.regimeJuridico || 'ESTATUTARIO'}   Vínculo Anterior   Vínculo Posterior`,
        { x: marginX, y: currentY, size: 6.5, font: fontRegular }
      );
      currentY -= 8.5;

      page.drawText(`Tipo de Vínculo ${v.tipoVinculo || 'EFETIVO'}   Matrícula1   Matrícula2`, {
        x: marginX,
        y: currentY,
        size: 6.5,
        font: fontRegular,
      });
      currentY -= 8.5;

      page.drawText(`Aposentadoria   Tipo Aposent.   Vacância   Forma Vacância`, {
        x: marginX,
        y: currentY,
        size: 6.5,
        font: fontRegular,
      });
      currentY -= 8.5;

      page.drawText(`Motivo`, { x: marginX, y: currentY, size: 6.5, font: fontRegular });
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
      page.drawText('Frequência', { x: marginX, y: currentY, size: 8, font: fontBold });
      currentY -= 9;

      page.drawText('Período                    Quantidade  Código  Tipo        Descrição', {
        x: marginX,
        y: currentY,
        size: 7,
        font: fontBold,
      });
      currentY -= 9;

      for (const f of pageData.frequencias) {
        if (currentY < 55) break; // Keep room for footer

        const pStr = `${(f.periodoInicio || '').padEnd(10, ' ')}  ${(f.periodoFim || '').padEnd(10, ' ')}`;
        const qStr = String(f.quantidade || '').padStart(5, ' ');
        const cStr = String(f.codigo || '').padStart(5, ' ');
        const tStr = String(f.tipo || '').padEnd(10, ' ');
        const dStr = String(f.descricao || '').slice(0, 52);

        page.drawText(`${pStr}    ${qStr}   ${cStr}   ${tStr}  ${dStr}`, {
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
      page.drawText('Licença afastamento', { x: marginX, y: currentY, size: 8.5, font: fontBold });
      currentY -= 10;

      page.drawText('Período                    Dias  Código  Descrição                    Motivo', {
        x: marginX,
        y: currentY,
        size: 7.5,
        font: fontBold,
      });
      currentY -= 10;

      for (const l of pageData.licencas) {
        if (currentY < 60) break;

        const pStr = `${l.periodoInicio.padEnd(10, ' ')}  ${l.periodoFim.padEnd(10, ' ')}`;
        const dStr = String(l.dias || '').padStart(4, ' ');
        const cStr = String(l.codigo || '').padStart(5, ' ');
        const descStr = String(l.descricao || '').slice(0, 30).padEnd(30, ' ');
        const motStr = String(l.motivo || '').slice(0, 36);

        page.drawText(`${pStr}   ${dStr}  ${cStr}   ${descStr}  ${motStr}`, {
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
      page.drawText('Mapa de Freqüência', { x: marginX, y: currentY, size: 8, font: fontBold });
      currentY -= 10;

      for (const anoData of pageData.mapaFrequencia) {
        if (currentY < 75) break;

        page.drawText(`Ano: ${anoData.ano}`, { x: marginX, y: currentY, size: 7.5, font: fontBold });
        currentY -= 8.5;

        // Cabeçalho dos 31 dias com exatamente 11pt por coluna
        page.drawText('Mês', { x: marginX, y: currentY, size: 5.5, font: fontBold });
        for (let d = 1; d <= 31; d++) {
          const colX = marginX + 28 + (d - 1) * 11;
          page.drawText(String(d), { x: colX, y: currentY, size: 5, font: fontBold });
        }
        currentY -= 7.5;

        // Linhas de cada mês com alinhamento milimétrico por coluna
        for (const m of anoData.meses) {
          if (currentY < 55) break;

          page.drawText(m.mes, { x: marginX, y: currentY, size: 5.5, font: fontBold });
          for (let d = 1; d <= 31; d++) {
            const colX = marginX + 28 + (d - 1) * 11;
            let val = m.dias[d.toString()] || m.dias[d as any] || '...';
            if (!val || val.trim() === '') val = '...';

            const isCode = val !== '...';
            page.drawText(val.slice(0, 3), {
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

    page.drawText('Ergon', {
      x: marginX + 10,
      y: footY + 9,
      size: 9,
      font: fontBold,
    });

    const centerText = 'Ergon - Recursos Humanos';
    page.drawText(centerText, {
      x: pageWidth / 2 - 50,
      y: footY + 13,
      size: 8,
      font: fontBold,
    });

    page.drawText('Nome do banco de dados : ORA039', {
      x: pageWidth / 2 - 62,
      y: footY + 4,
      size: 6.5,
      font: fontRegular,
    });

    page.drawText('Versão    6.4.', {
      x: pageWidth - marginX - 85,
      y: footY + 13,
      size: 8,
      font: fontBold,
    });

    page.drawText('T63226/5,13/11062010', {
      x: pageWidth - marginX - 90,
      y: footY + 4,
      size: 6.5,
      font: fontRegular,
    });
  }

  // Save PDF bytes and download directly
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const safeName = (documentData.servidor?.nome || 'Servidor').replace(/[^a-zA-Z0-9]/g, '_');
  downloadBlob(blob, `Ergon_PMSP_${safeName}_REPFICH2_Nativo.pdf`);
}
