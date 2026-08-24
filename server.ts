import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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
      userPrompt = `Analise este documento no FLUXO A (Documento de Texto para WORD).
Extraia todo o conteúdo textual em Markdown formatado (# títulos, **negrito**, listas, etc.).
Se houver pequenas tabelas secundárias, formate-as como tabelas Markdown.
Caso haja trechos ilegíveis, marque como [INCOMPREENSÍVEL].
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
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        extractionResponse = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
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
    "hasSignatures": boolean,
    "hasStamps": boolean,
    "hasLogos": boolean,
    "hasBarcodes": boolean,
    "signaturesCount": number,
    "stampsCount": number
  },
  "incomprehensibleCount": number,
  "markdownContent": "Conteúdo formatado em Markdown se aplicável para Word",
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
        break; // Success
      } catch (err: any) {
        attempts++;
        if (err.message && err.message.includes('503') && attempts < maxAttempts) {
          console.warn(`Gemini 503 High Demand Error. Retrying attempt ${attempts} of ${maxAttempts}...`);
          await new Promise((r) => setTimeout(r, 2000 * attempts));
        } else {
          throw err;
        }
      }
    }

    if (!extractionResponse) {
      throw new Error('Falha ao obter resposta do modelo Gemini após várias tentativas.');
    }

    const responseText = extractionResponse.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      // Fallback object
      parsedResult = {
        detectedType: targetFlow === 'excel' ? 'excel' : 'word',
        documentClassification: 'Documento Digitalizado',
        documentTitle: 'Documento Digitalizado',
        language: 'pt-BR',
        confidenceScore: 85,
        elementsDetected: { hasSignatures: false, hasStamps: false, hasLogos: false, hasBarcodes: false, signaturesCount: 0, stampsCount: 0 },
        incomprehensibleCount: 0,
        markdownContent: responseText,
        tableData: { tabelas: [] },
        summary: 'Documento processado com sucesso.',
        suggestedFileName: 'documento_digitalizado',
      };
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
    let refineAttempts = 0;
    while (refineAttempts < 3) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        break;
      } catch (err: any) {
        refineAttempts++;
        if (err.message && err.message.includes('503') && refineAttempts < 3) {
          await new Promise((r) => setTimeout(r, 1500 * refineAttempts));
        } else {
          throw err;
        }
      }
    }
    
    if (!response) throw new Error('Refinamento falhou.');

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
