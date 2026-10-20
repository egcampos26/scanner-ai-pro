import { PDFDocument } from 'pdf-lib';

/**
 * Service to inspect, split, and manipulate PDF documents
 */
export class PdfService {
  /**
   * Inspect basic PDF properties
   */
  static async inspectPdf(pdfBuffer: Uint8Array | Buffer) {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle() || '',
      author: pdfDoc.getAuthor() || '',
      creator: pdfDoc.getCreator() || '',
      producer: pdfDoc.getProducer() || '',
    };
  }

  /**
   * Extract a single page as a standalone PDF
   */
  static async extractSinglePage(pdfBuffer: Uint8Array | Buffer, pageIndex: number): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    if (pageIndex < 0 || pageIndex >= srcDoc.getPageCount()) {
      throw new Error(`Índice de página inválido: ${pageIndex}. O documento possui ${srcDoc.getPageCount()} páginas.`);
    }

    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(srcDoc, [pageIndex]);
    newDoc.addPage(copiedPage);
    return await newDoc.save();
  }

  /**
   * Split a PDF into an array of single-page PDFs
   */
  static async splitPdfIntoPages(pdfBuffer: Uint8Array | Buffer) {
    const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const pageCount = srcDoc.getPageCount();
    const pages: { pageNumber: number; base64: string }[] = [];

    for (let i = 0; i < pageCount; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);
      const pageBytes = await newDoc.save();
      pages.push({
        pageNumber: i + 1,
        base64: Buffer.from(pageBytes).toString('base64'),
      });
    }

    return {
      pageCount,
      pages,
    };
  }
}
