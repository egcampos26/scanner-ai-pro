import dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { PdfService } from './pdfService.js';

dotenv.config();

async function inspectAndre() {
  const pdfPath = 'C:/Users/DU/.gemini/antigravity-ide/brain/930d15ed-d737-44d9-b816-cb0ee1108a65/.user_uploaded/media_1792549701504.pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);
  const split = await PdfService.splitPdfIntoPages(pdfBuffer);
  console.log('Total pages in Andre PDF:', split.pageCount);
  const page1 = split.pages[0];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const pagePrompt = `Você é um especialista em OCR e estruturação de dados de alta precisão para documentos oficiais da Prefeitura do Município de São Paulo (PMSP).
Você está recebendo UMA ÚNICA PÁGINA (Página 1 de 7) do relatório oficial REPFICH2 (Ficha Funcional do Sistema ERGON).

Extraia com exatidão: Número/RF, Nome completo, RG, Órgão Emissor, UF, CPF, Nacionalidade, Estado Civil, Sexo, Data de Nascimento, Nome do Pai, Nome da Mãe.

RETORNE EXCLUSIVAMENTE UM OBJETO JSON VÁLIDO no seguinte formato:
{
  "pageNumber": 1,
  "totalPages": 7,
  "hasServidor": true,
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
  "hasVinculo": true,
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
  }
}`;

  const res = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: page1.base64, mimeType: 'application/pdf' } },
          { text: pagePrompt }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.0
    }
  });

  console.log('RESULTADO DA EXTRAÇÃO DA PÁGINA 1 DE ANDRE MARTINI:');
  console.log(res.text);
}

inspectAndre();
