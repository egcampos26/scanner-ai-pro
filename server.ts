import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { PdfService } from './pdfService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser with 50mb limit for high-res document scans
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy Google GenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Requests requiring AI will return an error.');
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inspect PDF endpoint
app.post('/api/pdf/inspect', async (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF fornecido.' });
    }
    const cleanBase64 = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const info = await PdfService.inspectPdf(buffer);
    res.json({ success: true, info });
  } catch (error: any) {
    console.error('PDF Inspect Error:', error);
    res.status(500).json({ error: error.message || 'Falha ao inspecionar PDF.' });
  }
});

// Split PDF into individual pages endpoint
app.post('/api/pdf/split', async (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF fornecido.' });
    }
    const cleanBase64 = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const result = await PdfService.splitPdfIntoPages(buffer);
    res.json({ success: true, pageCount: result.pageCount, pages: result.pages });
  } catch (error: any) {
    console.error('PDF Split Error:', error);
    res.status(500).json({ error: error.message || 'Falha ao dividir páginas do PDF.' });
  }
});

// Extract single page data (tuned for Ergon PMSP & general multi-page municipal docs)
app.post('/api/pdf/extract-page-data', async (req, res) => {
  try {
    const { pageBase64, pageNumber, totalPages } = req.body;
    if (!pageBase64) {
      return res.status(400).json({ error: 'Nenhum dado de página fornecido.' });
    }

    const ai = getGenAI();
    const cleanBase64 = pageBase64.includes('base64,') ? pageBase64.split('base64,')[1] : pageBase64;

    const pagePrompt = `Você é um extrator de alta precisão especializado em relatórios de Recursos Humanos da Prefeitura de São Paulo (Sistema ERGON - REPFICH2) e documentos públicos.
Você está analisando a PÁGINA ${pageNumber} de um total de ${totalPages} páginas.

SUA MISSÃO:
Extrair absolutamente TODOS os dados contidos nesta página específica com 100% de fidelidade, sem omitir nenhuma linha de tabela e sem resumir nada.

DIRETRIZES ESPECÍFICAS PARA CADA SEÇÃO:

1. DADOS CADASTRAIS DO SERVIDOR (comum na Página 1):
   - Extraia com exatidão: Número/RF, Nome completo, RG, Órgão Emissor, UF, CPF, Nacionalidade, Estado Civil, Sexo, Data de Nascimento, Nome do Pai, Nome da Mãe.

2. DADOS DO VÍNCULO (comum na Página 1):
   - Número do vínculo, Data de Nomeação, Data de Posse, Data de Exercício, Categoria (ex: QPE LEI 14660/07), Regime Jurídico (ex: ESTATUTARIO), Tipo de Vínculo, Matrícula1, Matrícula2, Aposentadoria, Vacância.

3. TABELA DE FREQUÊNCIA (ATENÇÃO: EXISTE NA PÁGINA 1 E CONTINUA ATÉ A PÁGINA 11):
   - ATENÇÃO CRÍTICA PÁGINA 1: Na Página 1, logo abaixo do bloco 'Vínculo', HÁ UMA TABELA DE FREQUÊNCIA com 10 ou mais linhas! Você OBRIGATORIAMENTE deve extrair todas as linhas de frequência presentes no final da Página 1 para o array 'frequencias'!
   - Extraia TODAS as linhas de frequência sem exceção.
   - Colunas:
     * periodoInicio (DD/MM/AAAA)
     * periodoFim (DD/MM/AAAA)
     * quantidade (número ou vazio)
     * codigo (ex: 1, 96, 101, 102, 103, 198)
     * tipo (ex: JEX, TEX, PADRAO, GRAT SERV NOTURNO, AUX REFEICAO EVENT)
     * descricao (ex: "Jornada Especial Hora Aula Excedente", "Falta Abonada - Docentes", "Horas Aulas não Dadas", "Falta Parcial Justificada", "Estorno de Auxílio Refeição", "Requisição Justiça Eleitoral Folga Compensatória")

4. TABELA DE LICENÇA AFASTAMENTO (comum nas Páginas 11 e 12):
   - Extraia TODAS as linhas da tabela de licenças/afastamentos.
   - Colunas:
     * periodoInicio (DD/MM/AAAA)
     * periodoFim (DD/MM/AAAA)
     * dias (número)
     * codigo (ex: 11, 12, 166, 175, 187)
     * descricao (ex: "Licença Médica do Servidor por Concessão da Chefia da Unidad", "Licença Médica Pericial", "DEC 59283 - TELETRABALHO", "Licença para o próprio servidor")
     * motivo (ex: "PUBLICAÇÃO EM D.O.M 09/04/14 PAG. 42", número de laudo, etc.)

5. MAPA DE FREQUÊNCIA (comum nas Páginas 13 a 21):
   - Cada página contém uma grade mensal (JAN a DEZ) com dias de 1 a 31 para um ou mais anos (ex: 2014, 2015, etc.).
   - Extraia para cada ano e mês visível os dias que contêm códigos de frequência (ex: FER, FDA, HAN, FDJ, LMU, TTB, LMP, FJE, FAA, etc.). Os dias sem ocorrência (pontinhos ...) podem ser ignorados ou marcados como "...".

6. CABEÇALHO E RODAPÉ DA PÁGINA:
   - Extraia a página (ex: "1 / 21"), data/hora de emissão e código de referência (ex: "REPFICH2").
   - Extraia o rodapé (ex: Ergon - Recursos Humanos, Versão 6.4, Nome do banco: ORA039).

RETORNE EXCLUSIVAMENTE UM OBJETO JSON VÁLIDO no seguinte formato:
{
  "pageNumber": ${pageNumber},
  "totalPages": ${totalPages},
  "header": {
    "instituicao": "Prefeitura do Município de São Paulo",
    "departamento": "Coordenadoria de Gestão de Pessoas",
    "emissao": "string",
    "referencia": "REPFICH2"
  },
  "hasServidor": boolean,
  "servidor": {
    "numero": "string",
    "nome": "string",
    "rg": "string",
    "ssp": "string",
    "cpf": "string",
    "nacionalidade": "string",
    "estadoCivil": "string",
    "sexo": "string",
    "dataNascimento": "string",
    "pai": "string",
    "mae": "string"
  },
  "hasVinculo": boolean,
  "vinculo": {
    "numero": "string",
    "nomeacao": "string",
    "posse": "string",
    "exercicio": "string",
    "categoria": "string",
    "regimeJuridico": "string",
    "tipoVinculo": "string",
    "matricula1": "string",
    "matricula2": "string"
  },
  "frequencias": [
    {
      "periodoInicio": "DD/MM/AAAA",
      "periodoFim": "DD/MM/AAAA",
      "quantidade": "string ou number",
      "codigo": "string ou number",
      "tipo": "string",
      "descricao": "string"
    }
  ],
  "licencas": [
    {
      "periodoInicio": "DD/MM/AAAA",
      "periodoFim": "DD/MM/AAAA",
      "dias": "string ou number",
      "codigo": "string ou number",
      "descricao": "string",
      "motivo": "string"
    }
  ],
  "mapaFrequencia": [
    {
      "ano": "string ou number",
      "meses": [
        {
          "mes": "JAN",
          "dias": { "1": "FER", "2": "FER" }
        }
      ]
    }
  ],
  "footer": {
    "sistema": "Ergon",
    "modulo": "Ergon - Recursos Humanos",
    "versao": "6.4",
    "banco": "ORA039"
  }
}`;

    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash'];
    let pageResponse: any = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
      if (pageResponse) break;
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          pageResponse = await ai.models.generateContent({
            model: model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: cleanBase64,
                      mimeType: 'application/pdf',
                    },
                  },
                  {
                    text: pagePrompt,
                  },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.0,
            },
          });
          break;
        } catch (err: any) {
          attempts++;
          lastError = err;
          const isNotFound =
            err?.status === 404 ||
            err?.message?.includes('404') ||
            err?.message?.includes('NOT_FOUND') ||
            err?.message?.includes('no longer available');
          if (isNotFound) {
            console.warn(`[Page ${pageNumber}] ${model} não disponível (404). Pulando para próximo modelo.`);
            break;
          }
          const isRateLimit =
            err?.message?.includes('429') ||
            err?.message?.includes('quota') ||
            err?.message?.includes('RESOURCE_EXHAUSTED') ||
            err?.message?.includes('fetch failed');
          const waitTime = isRateLimit ? 3000 * attempts : 1500;
          console.warn(`[Page ${pageNumber}] ${model} tentativa ${attempts} falhou (${err.message}). Aguardando ${waitTime}ms...`);
          if (attempts < maxAttempts) {
            await new Promise((r) => setTimeout(r, waitTime));
          }
        }
      }
    }

    if (!pageResponse) {
      throw new Error(`Falha ao extrair página ${pageNumber}: ${lastError?.message || 'Desconhecido'}`);
    }

    let cleaned = pageResponse.text || '{}';
    cleaned = cleaned.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    const parsedData = JSON.parse(cleaned);

    res.json({
      success: true,
      pageNumber,
      data: parsedData,
    });
  } catch (error: any) {
    console.error(`Page Extract Error (Page ${req.body?.pageNumber}):`, error);
    res.status(500).json({ error: error.message || 'Falha ao processar página do documento.' });
  }
});

// Document Scan & Multimodal OCR Endpoint
app.post('/api/scan', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg', targetFlow = 'auto', customInstructions = '' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Nenhuma imagem foi fornecida para digitalização.' });
    }

    const ai = getGenAI();

    // Clean base64 string
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
    const cleanMimeType = image.includes('data:') ? image.split(';')[0].replace('data:', '') : mimeType;

    const systemInstruction = `Você é o motor de Inteligência Artificial e Processamento de Documentos de um aplicativo avançado de digitalização e OCR (Multimodal Document Converter & Scanner AI).
Sua função é receber imagens ou PDFs de documentos, aplicar melhorias visuais virtuais (estilo CamScanner/Scanner de Mesa) e extrair os dados textuais ou tabulares de forma ultra-precisa para conversão em Microsoft Excel (.xlsx) ou Microsoft Word (.docx).

ETAPA 1: PROCESSAMENTO DE IMAGEM & MELHORIA VISUAL (MODO CAMSCANNER)
- Correção de Perspectiva: Identifique os 4 cantos do papel e processe o texto assumindo um alinhamento perfeitamente plano e retangular.
- Filtro 'Magic Color' / Scanner de Mesa: Ignore sombras de celular, fundos amarelados, cinzentos ou amassados. Trate o fundo como branco puro (#FFFFFF) e maximize o contraste de textos e tabelas.
- Preservação de Elementos: Mantenha visíveis logos, carimbos e assinaturas à caneta (azul/preta), separando-os do ruído.

ETAPA 2: EXTRAÇÃO DE DADOS & OCR INTELIGENTE (OUTPUT)
Dependendo da requisição do usuário ou da natureza do documento:

FLUXO A: DOCUMENTOS DE TEXTO (Para conversão em WORD)
- Alvo: Contratos, relatórios, cartas, petições, termos, documentos com parágrafos longos.
- Formato: Markdown puro e bem formatado.
- Mantenha títulos e subtítulos (#, ##, ###), parágrafos, listas com marcadores (-) ou numeradas, negrito (**) e itálico (*).

FLUXO B: TABELAS E DADOS FINANCEIROS (Para conversão em EXCEL)
- Alvo: Notas fiscais, faturas, extratos bancários, planilhas impressas, relatórios financeiros.
- Formato: JSON estruturado contendo a lista de tabelas com objetos de linhas e colunas.
- Preserve números, pontos e vírgulas originais de moedas.

DIRETRIZES DE PRECISÃO:
1. Zero Alucinação: Se um caractere ou valor estiver ilegível por rasura, carimbo sobreposto ou borrão profundo, use a tag [INCOMPREENSÍVEL] no local exato em vez de adivinhar.
2. Preservação de Idioma: Mantenha o idioma original do documento. Não traduza sem solicitação.
3. Formatação Estrita: Output limpo, sem conversas extras fora da estrutura.`;

    let userPrompt = '';
    if (targetFlow === 'word') {
      userPrompt = `Analise este documento no FLUXO A (Documento de Texto para WORD - PLANO).
Extraia todo o conteúdo textual em Markdown formatado (# títulos, **negrito**, listas, etc.).
Se houver pequenas tabelas secundárias, formate-as como tabelas Markdown.
Caso haja trechos ilegíveis, marque como [INCOMPREENSÍVEL].
${customInstructions ? `Instruções adicionais do usuário: ${customInstructions}` : ''}`;
    } else if (targetFlow === 'word_visual') {
      userPrompt = `Analise este documento no FLUXO D (Documento com Layout Visual/Original para WORD).
Você deve gerar o código HTML completo preservando *exatamente* o design visual, tipografia e a estrutura original do documento inteiro.
Regras estritas:
1. Inclua todos os textos, cabeçalhos, títulos e parágrafos estruturados de forma idêntica ao original.
2. Para tabelas, use marcação <table> com todas as células mescladas originais (rowspan, colspan).
3. Use ESTILOS INLINE rigorosos para cores exatas, bordas e alinhamentos. O Word lê CSS inline perfeitamente (ex: style="background-color: #e0e0e0; text-align: center; border: 1px solid black;").
4. Mantenha as larguras em porcentagem ou pixels para garantir que a tabela não quebre no Word.

A sua resposta para o campo "wordHtml" deve conter uma string com o HTML completo gerado, por exemplo: "<div style='font-family: Arial, sans-serif;'>...</div>".
Lembre-se de fechar corretamente as tags. Use [INCOMPREENSÍVEL] para trechos ilegíveis.
${customInstructions ? `Instruções adicionais do usuário: ${customInstructions}` : ''}`;
    } else if (targetFlow === 'excel') {
      userPrompt = `Analise este documento no FLUXO B (Tabelas e Dados Financeiros para EXCEL - PLANO).
Extraia todas as tabelas e dados tabulares estritamente em formato JSON estruturado no formato:
{
  "tabelas": [
    {
      "titulo": "Nome da Tabela ou Seção",
      "colunas": ["Coluna 1", "Coluna 2", ...],
      "linhas": [
        {"Coluna 1": "Valor", "Coluna 2": "Valor", ...}
      ]
    }
  ]
}
Preserve valores numéricos e moedas exatos. Se algo for ilegível, use [INCOMPREENSÍVEL].
${customInstructions ? `Instruções adicionais do usuário: ${customInstructions}` : ''}`;
    } else if (targetFlow === 'excel_visual') {
      userPrompt = `Analise este documento no FLUXO C (Tabelas com Layout Visual/Original para EXCEL).
Você deve gerar o código HTML completo preservando *exatamente* o design visual e a estrutura original do documento inteiro, otimizado para o Microsoft Excel.
Regras estritas:
1. Inclua todos os textos, títulos, cabeçalhos do topo da página (ex: "PREFEITURA DO MUNICIPIO...") antes de abrir a tabela, formatados com <div> ou <h3> com style="text-align: center; font-family: Arial;".
2. Para tabelas, use marcação <table width="800" style="border-collapse: collapse; font-family: Arial;"> com todas as células mescladas originais (rowspan, colspan).
3. Use ESTILOS INLINE rigorosos para cores exatas. O Excel não interpreta bem classes. Use sempre style="background-color: #e0e0e0;" para fundos cinzas claros, ou #c0c0c0 para escuros. Não use "gray".
4. Defina LARGURAS FIXAS em pixels nas células <td> (ex: width="150" ou style="width: 150px;") para forçar o Excel a respeitar as proporções das colunas.
5. Use style="border: 1px solid #000;" em todas as células (td/th) que possuam bordas no documento original.

A sua resposta para "tableData.tabelas" deve ser um único array contendo um objeto com o HTML gerado na propriedade "htmlContent":
{
  "tabelas": [
    {
      "titulo": "Documento Completo",
      "colunas": [],
      "linhas": [],
      "htmlContent": "<div style='font-family: Arial, sans-serif; font-size: 12px;'>...[código html idêntico ao documento]...</div>"
    }
  ]
}
Lembre-se de fechar corretamente as tags. Use [INCOMPREENSÍVEL] para trechos ilegíveis.
${customInstructions ? `Instruções adicionais do usuário: ${customInstructions}` : ''}`;
    } else {
      // Auto detection
      userPrompt = `Analise a imagem deste documento.
1. Determine automaticamente se a natureza predominante é TEXTO (Word/Contrato/Relatório) ou TABELAS/DADOS FINANCEIROS (Excel/Nota Fiscal/Extrato/Planilha).
2. Se for TEXTO, forneça a extração em Markdown puro de alta qualidade.
3. Se for TABELA/FINANCEIRO, forneça a extração em JSON estruturado com colunas e linhas.
4. Se contiver tanto texto descritivo quanto tabelas financeiras, forneça uma estrutura combinada detalhada.
5. Identifique elementos detectados (assinaturas, carimbos, selos, logos, código de barras) e contagem de termos incompreensíveis.
${customInstructions ? `Instruções adicionais do usuário: ${customInstructions}` : ''}`;
    }

    // Structure the response format
    let extractionResponse;
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.6-flash'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      if (extractionResponse) break;
      
      let attempts = 0;
      const maxAttempts = 2; // Try each model up to 2 times

      while (attempts < maxAttempts) {
        try {
          console.log(`Tentando requisição com o modelo: ${model} (Tentativa ${attempts + 1}/${maxAttempts})`);
          extractionResponse = await ai.models.generateContent({
            model: model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType: cleanMimeType,
                    },
                  },
                  {
                    text: `${userPrompt}\n\nRetorne sua resposta final em um objeto JSON com as seguintes propriedades:
{
  "detectedType": "word" | "excel" | "mixed",
  "documentClassification": "Contrato" | "Nota Fiscal" | "Extrato Bancário" | "Recibo" | "Relatório" | "Petição" | "Outro",
  "documentTitle": "Título inferido do documento",
  "language": "pt-BR" | "en-US" | "es-ES" | "outro",
  "confidenceScore": number (0 a 100),
  "perspectiveQuality": "good" | "skewed_corrected" | "distorted",
  "elementsDetected": {
    "hasSignatures": true,
    "hasStamps": true,
    "hasLogos": true,
    "hasBarcodes": true,
    "signaturesCount": 0,
    "stampsCount": 0
  },
  "incomprehensibleCount": number,
  "markdownContent": "Conteúdo formatado em Markdown se o fluxo A (Word Simples) foi escolhido, senão omitir.",
  "wordHtml": "Código HTML completo se o fluxo D (Word Visual) foi escolhido, senão omitir.",
  "tableData": {
    "tabelas": [
      {
        "titulo": "string",
        "colunas": ["string"],
        "linhas": [ { "coluna": "valor" } ],
        "htmlContent": "String contendo a marcação HTML <table> se o FLUXO C (Visual) foi escolhido, senão nulo"
      }
    ]
  },
  "summary": "Resumo de 2 linhas sobre o documento digitalizado",
  "suggestedFileName": "nome_do_arquivo_sem_extensao"
}`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.1, // High precision, zero hallucination
            },
          });
          break; // Success with this model
        } catch (err: any) {
          attempts++;
          lastError = err;
          if (err.message && (err.message.includes('503') || err.message.includes('429') || err.message.includes('fetch failed')) && attempts < maxAttempts) {
            console.warn(`[${model}] Erro temporário da API (503/429/fetch). Retentando em ${2000 * attempts}ms...`);
            await new Promise((r) => setTimeout(r, 2000 * attempts));
          } else {
            console.warn(`[${model}] Erro definitivo (${err.message}). Avançando para o próximo modelo se disponível.`);
            break; // Move to the next model in modelsToTry
          }
        }
      }
    }

    if (!extractionResponse) {
      throw new Error(`Falha ao processar com todos os modelos de IA tentados. Último erro: ${lastError?.message || 'Desconhecido'}`);
    }

    let cleanedResponse = extractionResponse.text || '{}';
    cleanedResponse = cleanedResponse.trim();
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json|html)?/, '').replace(/```$/, '').trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', cleanedResponse);
      throw new Error('A Inteligência Artificial gerou um layout tão complexo que ocorreu um erro interno de formatação. Por favor, clique em "Extrair com IA" novamente.');
    }

    res.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('Scan API Error:', error);
    res.status(500).json({
      error: error?.message || 'Falha ao processar o documento com o modelo de IA.',
    });
  }
});

// Document Refinement / AI Assistant Endpoint
app.post('/api/refine', async (req, res) => {
  try {
    const { currentContent, instruction, formatType = 'word' } = req.body;
    if (!instruction) {
      return res.status(400).json({ error: 'Instrução não fornecida.' });
    }

    const ai = getGenAI();
    const prompt = `Você é o assistente de refinamento do DocScan AI.
O usuário tem o seguinte conteúdo extraído de um documento:

=== CONTEÚDO ATUAL (${formatType.toUpperCase()}) ===
${typeof currentContent === 'string' ? currentContent : JSON.stringify(currentContent, null, 2)}
================================

INSTRUÇÃO DO USUÁRIO:
"${instruction}"

REGRAS:
1. Aplique a modificação solicitada mantendo a mais alta fidelidade ao documento.
2. Se o formato for Word/Markdown, retorne o Markdown atualizado.
3. Se o formato for Excel/JSON, retorne a estrutura JSON atualizada.
4. Mantenha as tags [INCOMPREENSÍVEL] onde o dado original continuar ilegível.

Retorne JSON no formato:
{
  "updatedMarkdown": "...",
  "updatedTableData": { "tabelas": [...] },
  "explanation": "Breve explicação da alteração feita"
}`;

    let response;
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.6-flash'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      if (response) break;
      let refineAttempts = 0;
      const maxAttempts = 2;
      
      while (refineAttempts < maxAttempts) {
        try {
          console.log(`[Refine] Tentando modelo: ${model} (Tentativa ${refineAttempts + 1}/${maxAttempts})`);
          response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });
          break;
        } catch (err: any) {
          refineAttempts++;
          lastError = err;
          if (err.message && (err.message.includes('503') || err.message.includes('429') || err.message.includes('fetch failed')) && refineAttempts < maxAttempts) {
            await new Promise((r) => setTimeout(r, 1500 * refineAttempts));
          } else {
            break; // Move to next model
          }
        }
      }
    }
    
    if (!response) throw new Error(`Refinamento falhou em todos os modelos. Último erro: ${lastError?.message || 'Desconhecido'}`);

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Refine API Error:', error);
    res.status(500).json({ error: error?.message || 'Falha ao refinar o documento.' });
  }
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DocScan AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
