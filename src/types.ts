export type ScanFlow = 'word' | 'excel' | 'auto' | 'excel_visual' | 'word_visual';
export type AppMode = 'scanner' | 'ocr' | 'reconstruct_pdf' | null;

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

// ERGON PMSP Official Document Types
export interface ErgonPersonalData {
  numero?: string;
  nome?: string;
  rg?: string;
  ssp?: string;
  cpf?: string;
  nacionalidade?: string;
  estadoCivil?: string;
  sexo?: string;
  dataNascimento?: string;
  pai?: string;
  mae?: string;
}

export interface ErgonVinculoData {
  numero?: string;
  nomeacao?: string;
  posse?: string;
  exercicio?: string;
  categoria?: string;
  regimeJuridico?: string;
  vinculoAnterior?: string;
  vinculoPosterior?: string;
  tipoVinculo?: string;
  matricula1?: string;
  matricula2?: string;
  aposentadoria?: string;
  tipoAposent?: string;
  vacancia?: string;
  formaVacancia?: string;
  motivo?: string;
}

export interface ErgonFrequenciaRow {
  periodoInicio: string;
  periodoFim: string;
  quantidade?: string | number;
  codigo?: string | number;
  tipo?: string;
  descricao?: string;
}

export interface ErgonLicencaRow {
  periodoInicio: string;
  periodoFim: string;
  dias?: string | number;
  codigo?: string | number;
  descricao?: string;
  motivo?: string;
}

export interface ErgonMapaMes {
  mes: string;
  dias: Record<string, string>;
}

export interface ErgonMapaAno {
  ano: string | number;
  meses: ErgonMapaMes[];
}

export interface ErgonPageData {
  pageNumber: number;
  totalPages: number;
  header?: {
    instituicao?: string;
    departamento?: string;
    emissao?: string;
    referencia?: string;
  };
  hasServidor?: boolean;
  servidor?: ErgonPersonalData;
  hasVinculo?: boolean;
  vinculo?: ErgonVinculoData;
  frequencias?: ErgonFrequenciaRow[];
  licencas?: ErgonLicencaRow[];
  mapaFrequencia?: ErgonMapaAno[];
  footer?: {
    sistema?: string;
    modulo?: string;
    versao?: string;
    banco?: string;
  };
}

export interface ErgonConsolidatedDocument {
  totalPages: number;
  header: {
    instituicao: string;
    departamento: string;
    emissao: string;
    referencia: string;
  };
  servidor: ErgonPersonalData;
  vinculo: ErgonVinculoData;
  frequencias: ErgonFrequenciaRow[];
  licencas: ErgonLicencaRow[];
  mapaFrequencia: ErgonMapaAno[];
  pages: ErgonPageData[];
  footer: {
    sistema: string;
    modulo: string;
    versao: string;
    banco: string;
  };
}
