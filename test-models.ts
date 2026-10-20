import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const ai = new GoogleGenAI();
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-3.0-flash', 'gemini-3.5-flash', 'gemini-3.6-flash'];
  
  for (const m of models) {
    try {
      await ai.models.generateContent({ model: m, contents: 'Hi' });
      console.log(`[SUCCESS] ${m}`);
    } catch (e: any) {
      console.log(`[FAILED] ${m}: ${e.message}`);
    }
  }
}
run();
