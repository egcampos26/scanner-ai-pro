import { SampleDoc } from '../types';

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'sample-nfse',
    title: 'Nota Fiscal de Serviços (NFS-e)',
    category: 'excel',
    badge: 'Excel / Financeiro',
    description: 'Documento fiscal com tabela de itens, valores em R$, retenções e campo rasurado [INCOMPREENSÍVEL].',
    previewUrl: '',
    generateImage: () => generateInvoiceCanvas(),
  },
  {
    id: 'sample-contract',
    title: 'Contrato de Serviços & NDA',
    category: 'word',
    badge: 'Word / Jurídico',
    description: 'Contrato com 5 cláusulas formatadas, carimbo de autenticação em cartório e assinaturas em tinta azul.',
    previewUrl: '',
    generateImage: () => generateContractCanvas(),
  },
  {
    id: 'sample-statement',
    title: 'Extrato Bancário Corporativo',
    category: 'excel',
    badge: 'Excel / Contábil',
    description: 'Extrato financeiro detalhado com datas, débitos, créditos, saldos e totalizações.',
    previewUrl: '',
    generateImage: () => generateBankStatementCanvas(),
  },
];

/**
 * Generates an authentic canvas image of an Invoice / Nota Fiscal with realistic desk lighting & slight tilt
 */
function generateInvoiceCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1250;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background desk surface (slight warm desk tone)
  ctx.fillStyle = '#E5E0D8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Document paper with subtle tilt & shadow
  ctx.save();
  ctx.translate(450, 625);
  ctx.rotate(-0.018); // Slight realistic desk angle
  ctx.translate(-410, -580);

  // Soft shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 10;

  // Paper background
  ctx.fillStyle = '#FCFBF9';
  ctx.fillRect(0, 0, 820, 1160);
  ctx.shadowColor = 'transparent';

  // Border of document
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 20, 780, 1120);

  // Header Box
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(20, 20, 780, 70);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillText('PREFEITURA MUNICIPAL DE SÃO PAULO', 40, 50);
  ctx.font = '13px "Courier New", monospace';
  ctx.fillText('NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e  |  Nº 00048921', 40, 75);

  // Prestador Box
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 105, 760, 100);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText('PRESTADOR DE SERVIÇOS', 40, 125);
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('Razão Social: TECH CONSULTING & SOFTWARE LTDA', 40, 145);
  ctx.fillText('CNPJ: 14.829.301/0001-92  |  Inscrição Municipal: 8.921.340-1', 40, 165);
  ctx.fillText('Endereço: Av. Paulista, 1000, Cj 1402 - Bela Vista, São Paulo - SP', 40, 185);

  // Tomador Box
  ctx.strokeRect(30, 220, 760, 95);
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText('TOMADOR DE SERVIÇOS', 40, 240);
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('Razão Social: GLOBAL LOGISTICA & TRANSPORTES S/A', 40, 260);
  ctx.fillText('CNPJ: 03.119.842/0001-44  |  Data de Emissão: 18/08/2026', 40, 280);
  ctx.fillText('E-mail: financeiro@globallog.com.br', 40, 300);

  // Table Header
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(30, 335, 760, 32);
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(30, 335, 760, 32);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText('ITEM', 40, 355);
  ctx.fillText('DISCRIMINAÇÃO DOS SERVIÇOS', 90, 355);
  ctx.fillText('QTD', 440, 355);
  ctx.fillText('VALOR UNIT.', 510, 355);
  ctx.fillText('ALIQ.', 630, 355);
  ctx.fillText('TOTAL (R$)', 700, 355);

  // Table Rows
  const items = [
    { item: '01', desc: 'Desenvolvimento de Módulo Cloud API', qtd: '1', unit: 'R$ 8.500,00', aliq: '5%', tot: 'R$ 8.500,00' },
    { item: '02', desc: 'Suporte Técnico e Manutenção Mensal', qtd: '2', unit: 'R$ 1.250,00', aliq: '5%', tot: 'R$ 2.500,00' },
    { item: '03', desc: 'Consultoria de Segurança em Infraestrutura', qtd: '1', unit: 'R$ 4.200,00', aliq: '5%', tot: 'R$ 4.200,00' },
    { item: '04', desc: 'Treinamento de Equipe em Engenharia IA', qtd: '1', unit: 'R$ 3.800,00', aliq: '5%', tot: 'R$ 3.800,00' },
    { item: '05', desc: 'Licenciamento de Software Customizado', qtd: '1', unit: 'R$ 1.950,00', aliq: '2%', tot: 'R$ 1.950,00' },
  ];

  let currentY = 385;
  ctx.font = '12px "Courier New", monospace';

  items.forEach((it, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    ctx.fillRect(30, currentY - 17, 760, 26);
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(30, currentY - 17, 760, 26);

    ctx.fillStyle = '#0F172A';
    ctx.fillText(it.item, 45, currentY);
    ctx.fillText(it.desc, 90, currentY);
    ctx.fillText(it.qtd, 450, currentY);
    ctx.fillText(it.unit, 510, currentY);
    ctx.fillText(it.aliq, 635, currentY);
    ctx.fillText(it.tot, 700, currentY);

    currentY += 28;
  });

  // Intentional smudge / tear on the tax breakdown row to test [INCOMPREENSÍVEL]
  ctx.strokeRect(30, 540, 760, 110);
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText('TRIBUTOS & RETENÇÕES FEDERAIS', 40, 560);
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('Base de Cálculo: R$ 20.950,00  |  Valor do ISS: R$ 1.047,50', 40, 585);
  ctx.fillText('PIS: R$ 136,18  |  COFINS: R$ 628,50  |  CSLL: R$ 209,50', 40, 610);

  // Rasura visual simulation on IRRF
  ctx.fillText('IRRF Retido na Fonte:', 40, 635);
  // Coffee/ink stain over the IRRF number
  ctx.save();
  ctx.fillStyle = 'rgba(70, 45, 20, 0.75)';
  ctx.beginPath();
  ctx.ellipse(220, 632, 28, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Grand Total Box
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(480, 670, 310, 50);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillText('VALOR LÍQUIDO DA NFS-e', 495, 693);
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillText('R$ 20.950,00', 495, 712);

  // Stamp / Barcode at the bottom
  drawStamp(ctx, 100, 780, 'PREFEITURA MUNICIPAL', 'AUTENTICADO', '#1D4ED8');
  drawBarcode(ctx, 420, 760, 350, 45);

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Generates an authentic Contract document canvas with blue signatures and red stamp
 */
function generateContractCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1250;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background desk
  ctx.fillStyle = '#DDD7CD';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Paper
  ctx.save();
  ctx.translate(450, 625);
  ctx.rotate(0.012);
  ctx.translate(-410, -580);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 820, 1160);
  ctx.shadowColor = 'transparent';

  // Title
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 18px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA', 410, 70);
  ctx.fillText('E ACORDO DE CONFIDENCIALIDADE (NDA)', 410, 95);

  ctx.textAlign = 'left';
  ctx.font = '13px "Times New Roman", serif';
  let y = 145;

  const paragraphs = [
    'Pelo presente instrumento particular, de um lado **NEXUS SOLUÇÕES DIGITAIS LTDA**, pessoa jurídica de direito privado inscrita no CNPJ sob nº 28.190.441/0001-10, doravante denominada **CONTRATADA**, e de outro lado **AURORA INDÚSTRIA & COMÉRCIO S/A**, inscrita no CNPJ sob nº 05.882.110/0001-33, doravante denominada **CONTRATANTE**:',
    '',
    '## CLÁUSULA PRIMEIRA - DO OBJETO',
    'O presente contrato tem por objeto a prestação de serviços especializados em arquitetura de dados e desenvolvimento de pipelines de inteligência artificial pela CONTRATADA em favor da CONTRATANTE.',
    '',
    '## CLÁUSULA SEGUNDA - DO VALOR E CONDIÇÕES DE PAGAMENTO',
    'Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor global de **R$ 48.000,00** (quarenta e oito mil reais), divididos em 4 (quatro) parcelas mensais e consecutivas de **R$ 12.000,00**, com vencimento todo dia 10.',
    '',
    '## CLÁUSULA TERCEIRA - DO SIGILO E CONFIDENCIALIDADE',
    'As partes comprometem-se a manter em absoluto sigilo todas as Informações Confidenciais a que tiverem acesso em virtude deste contrato, não podendo divulgá-las a terceiros sem prévia autorização por escrito.',
    '',
    '## CLÁUSULA QUARTA - DO PRAZO E RESCISÃO',
    'O presente contrato vigorará pelo prazo determinado de 12 (doze) meses a contar da data de sua assinatura, podendo ser rescindido por qualquer das partes mediante aviso prévio por escrito de 30 (trinta) dias.',
    '',
    'São Paulo, 12 de Agosto de 2026.',
  ];

  paragraphs.forEach((p) => {
    if (p.startsWith('## ')) {
      ctx.font = 'bold 14px "Times New Roman", serif';
      ctx.fillText(p.replace('## ', ''), 60, y);
      y += 24;
    } else if (p === '') {
      y += 12;
    } else {
      ctx.font = '13px "Times New Roman", serif';
      wrapText(ctx, p.replace(/\*\*/g, ''), 60, y, 700, 20);
      y += 48;
    }
  });

  // Signatures Section
  y = 860;
  ctx.font = '12px "Times New Roman", serif';

  // Contratada Signature
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, y + 50);
  ctx.lineTo(340, y + 50);
  ctx.stroke();

  // Contratante Signature
  ctx.beginPath();
  ctx.moveTo(460, y + 50);
  ctx.lineTo(720, y + 50);
  ctx.stroke();

  // Simulated Blue Pen Signatures
  drawBlueSignature(ctx, 110, y + 40, 'Rodrigo M. Silva');
  drawBlueSignature(ctx, 490, y + 40, 'Camila Fernandes');

  ctx.fillText('NEXUS SOLUÇÕES DIGITAIS LTDA', 90, y + 70);
  ctx.fillText('Rodrigo M. Silva - Diretor Executivo', 90, y + 88);

  ctx.fillText('AURORA INDÚSTRIA & COMÉRCIO S/A', 470, y + 70);
  ctx.fillText('Camila Fernandes - Gerente Geral', 470, y + 88);

  // Red Notary Cartório Stamp
  drawStamp(ctx, 580, 990, '14º TABELIONATO DE NOTAS', 'RECONHEÇO POR SEMELHANÇA', '#DC2626');

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Generates an authentic Bank Statement canvas
 */
function generateBankStatementCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1250;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#E0DDD5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(450, 625);
  ctx.rotate(-0.01);
  ctx.translate(-410, -580);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 820, 1160);
  ctx.shadowColor = 'transparent';

  // Bank Header
  ctx.fillStyle = '#EC0000'; // Bank brand red
  ctx.fillRect(30, 30, 12, 40);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('BANCO NACIONAL S.A.', 52, 60);

  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('Extrato Mensal de Conta Corrente Empresarial', 52, 85);
  ctx.fillText('Período: 01/08/2026 a 20/08/2026  |  Agência: 3490  |  Conta: 0049210-8', 52, 105);
  ctx.fillText('Titular: TECH VENTURES SERVIÇOS DIGITAIS LTDA  |  CNPJ: 31.902.482/0001-09', 52, 125);

  // Balances summary box
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(30, 145, 760, 65);
  ctx.strokeStyle = '#CBD5E1';
  ctx.strokeRect(30, 145, 760, 65);

  ctx.fillStyle = '#475569';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText('Saldo Anterior: R$ 42.150,80', 50, 172);
  ctx.fillText('Total Créditos: R$ 38.400,00', 300, 172);
  ctx.fillText('Total Débitos: R$ 19.820,40', 550, 172);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('Saldo Disponível Atual: R$ 60.730,40', 50, 198);

  // Transactions Table Header
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(30, 230, 760, 32);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText('DATA', 45, 251);
  ctx.fillText('HISTÓRICO / DESCRIÇÃO', 120, 251);
  ctx.fillText('DOCUMENTO', 450, 251);
  ctx.fillText('VALOR (R$)', 590, 251);
  ctx.fillText('SALDO (R$)', 700, 251);

  const txs = [
    { data: '01/08/2026', desc: 'SALDO ANTERIOR', doc: '-', val: '-', saldo: '42.150,80' },
    { data: '03/08/2026', desc: 'PIX RECEBIDO - CLIENTE ACME', doc: 'E894210', val: '+ 15.000,00', saldo: '57.150,80' },
    { data: '05/08/2026', desc: 'PAGTO TED - HOSPEDAGEM AWS', doc: 'DOC4819', val: '- 3.420,50', saldo: '53.730,30' },
    { data: '08/08/2026', desc: 'FOLHA DE PAGAMENTO FUNCIONARIOS', doc: 'FOLHA08', val: '- 12.500,00', saldo: '41.230,30' },
    { data: '10/08/2026', desc: 'PIX RECEBIDO - CONTRATO AURORA', doc: 'E901238', val: '+ 12.000,00', saldo: '53.230,30' },
    { data: '12/08/2026', desc: 'PAGTO GUIA DAS SIMPLES NACIONAL', doc: 'DARF902', val: '- 2.100,00', saldo: '51.130,30' },
    { data: '15/08/2026', desc: 'RECEBIMENTO BOLETO Nº 4982', doc: 'BOL4982', val: '+ 11.400,00', saldo: '62.530,30' },
    { data: '18/08/2026', desc: 'TARIFAS BANCARIAS MENSAIS', doc: 'TARIF08', val: '- 199,90', saldo: '62.330,40' },
    { data: '20/08/2026', desc: 'PAGTO FORNECEDOR HARDWARE', doc: 'TED5921', val: '- 1.600,00', saldo: '60.730,40' },
  ];

  let yPos = 285;
  txs.forEach((t, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    ctx.fillRect(30, yPos - 18, 760, 26);
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(30, yPos - 18, 760, 26);

    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(t.data, 45, yPos);
    ctx.fillText(t.desc, 120, yPos);
    ctx.fillText(t.doc, 450, yPos);

    if (t.val.startsWith('+')) {
      ctx.fillStyle = '#16A34A';
    } else if (t.val.startsWith('-')) {
      ctx.fillStyle = '#DC2626';
    } else {
      ctx.fillStyle = '#475569';
    }
    ctx.fillText(t.val, 590, yPos);

    ctx.fillStyle = '#0F172A';
    ctx.fillText(t.saldo, 700, yPos);

    yPos += 28;
  });

  // Footer notes & authentic stamp
  drawStamp(ctx, 350, 780, 'BANCO NACIONAL', 'DOCUMENTO OFICIAL', '#1E40AF');

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Helper to draw text with line wrapping
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

/**
 * Simulates a realistic blue pen cursive signature
 */
function drawBlueSignature(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _name: string
) {
  ctx.save();
  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + 20, y - 25, x + 40, y + 10, x + 60, y - 15);
  ctx.bezierCurveTo(x + 80, y - 30, x + 100, y + 5, x + 120, y - 10);
  ctx.bezierCurveTo(x + 135, y - 20, x + 150, y + 15, x + 170, y - 5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 10, y + 8);
  ctx.bezierCurveTo(x + 50, y + 15, x + 120, y + 10, x + 180, y + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Simulates an official circular / rectangular rubber stamp
 */
function drawStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  topText: string,
  centerText: string,
  color: string = '#DC2626'
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.08); // slight realistic stamp rotation
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;

  // Double circle or oval
  ctx.beginPath();
  ctx.ellipse(0, 0, 75, 45, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, 68, 38, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(topText, 0, -18);

  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText(centerText, 0, 5);

  ctx.font = '8px Arial, sans-serif';
  ctx.fillText('VALIDADO DIGITALMENTE', 0, 22);

  ctx.restore();
}

/**
 * Draws a realistic barcode
 */
function drawBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.fillStyle = '#0F172A';
  let curX = x;
  const endX = x + width;

  while (curX < endX) {
    const barW = Math.floor(Math.random() * 4) + 1;
    const spaceW = Math.floor(Math.random() * 4) + 1;
    ctx.fillRect(curX, y, barW, height);
    curX += barW + spaceW;
  }

  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('34191.79001 01043.510047 91020.150008 5 91820000020950', x + width / 2, y + height + 14);
  ctx.restore();
}
