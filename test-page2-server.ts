import dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { PdfService } from './pdfService.js';

dotenv.config();

async function testPage2Server() {
  const pdfPath = 'C:/Users/DU/.gemini/antigravity-ide/brain/930d15ed-d737-44d9-b816-cb0ee1108a65/.user_uploaded/media_1792549701504.pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);
  const split = await PdfService.splitPdfIntoPages(pdfBuffer);
  const page2 = split.pages[1];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const pagePrompt = `Você está analisando a PÁGINA 2 de um total de 7 páginas.
RETORNE EXCLUSIVAMENTE UM OBJETO JSON VÁLIDO no seguinte formato:
{
  "pageNumber": 2,
  "totalPages": 7,
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
  }
}`;

  const res = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: page2.base64, mimeType: 'application/pdf' } },
          { text: pagePrompt }
        ]
      }
    ],
    config: { responseMimeType: 'application/json', temperature: 0.0 }
  });

  console.log('PAGE 2 JSON:\n', res.text);
}
testPage2Server();
