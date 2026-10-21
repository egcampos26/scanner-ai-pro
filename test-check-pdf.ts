import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function checkPdf() {
  const buf = fs.readFileSync('C:/Users/DU/.gemini/antigravity-ide/brain/930d15ed-d737-44d9-b816-cb0ee1108a65/.user_uploaded/media_1792549947010.pdf');
  const doc = await PDFDocument.load(buf);
  console.log('Pages:', doc.getPageCount());
  console.log('Title:', doc.getTitle());
}
checkPdf();
