import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const ai = new GoogleGenAI();
  try {
    await ai.models.generateContent({ model: 'gemini-3.8-flash', contents: 'Hi' });
    console.log('[SUCCESS] gemini-3.8-flash');
  } catch (e: any) {
    console.log('[FAILED] gemini-3.8-flash:', e.message);
  }
}
run();
