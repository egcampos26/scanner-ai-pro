import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const ai = new GoogleGenAI();
  const models = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-pro-latest', 'gemini-3.1-pro-preview'];
  const largeString = 'a'.repeat(2 * 1024 * 1024); // 2MB string
  
  for (const m of models) {
    try {
      await ai.models.generateContent({ model: m, contents: largeString });
      console.log(`[SUCCESS] ${m}`);
    } catch (e: any) {
      console.log(`[FAILED] ${m}: ${e.message}`);
    }
  }
}
run();
