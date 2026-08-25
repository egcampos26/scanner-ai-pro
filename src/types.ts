export type ScanFlow = 'word' | 'excel' | 'auto' | 'excel_visual' | 'word_visual';
export type AppMode = 'scanner' | 'ocr' | null;

export type FilterPreset = 'magic_color' | 'bw' | 'grayscale' | 'original' | 'sharp';

export interface Point {
  x: number;
  y: number;
}

export interface CornerPoints {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export interface DetectedElements {
  hasSignatures: boolean;
  hasStamps: boolean;
  hasLogos: boolean;
  hasBarcodes: boolean;
  signaturesCount: number;
  stampsCount: number;
}

export interface TableRowData {
  [columnName: string]: string | number;
}

export interface DocumentTable {
  titulo: string;
  colunas: string[];
  linhas: TableRowData[];
  htmlContent?: string;
}

export interface TableDataWrapper {
  tabelas: DocumentTable[];
}

export interface ScanResultData {
  detectedType: 'word' | 'excel' | 'mixed';
  documentClassification: string;
  documentTitle: string;
  language: string;
  confidenceScore: number;
  perspectiveQuality: 'good' | 'skewed_corrected' | 'distorted';
  elementsDetected: DetectedElements;
  incomprehensibleCount: number;
  markdownContent?: string;
  wordHtml?: string;
  tableData?: TableDataWrapper;
  summary: string;
  suggestedFileName: string;
}

export interface ScannedDocumentHistory {
  id: string;
  title: string;
  type: 'word' | 'excel' | 'mixed';
  timestamp: number;
  thumbnail: string;
  result: ScanResultData;
  originalImage: string;
  enhancedImage: string;
}

export interface SampleDoc {
  id: string;
  title: string;
  category: 'word' | 'excel';
  badge: string;
  description: string;
  previewUrl: string;
  generateImage: () => string; // returns base64 canvas data
}
