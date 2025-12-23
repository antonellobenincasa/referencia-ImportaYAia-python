export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url?: string;
  data?: string;
}

export interface ProductItem {
  id: string;
  description: string;
  hsCode: string;
  fobValue: number;
  quantity: number;
  weight: number;
  unit: 'kg' | 'lb';
}

export interface TaxCalculation {
  adValorem: number;
  adValoremRate: number;
  fodinfa: number;
  iva: number;
  ice: number;
  iceRate: number;
  isd: number;
  totalTributos: number;
}

export interface InsuranceCalculation {
  fobValue: number;
  rate: number;
  premium: number;
  fixedFee: number;
  iva: number;
  total: number;
}

export interface LocalCosts {
  handling: number;
  storage: number;
  documentation: number;
  thc: number;
  blFee: number;
  customs: number;
  inspection: number;
  total: number;
}

export interface TransportCost {
  city: string;
  containerType: '20ft' | '40ft' | '40hc' | '40nor';
  baseCost: number;
  armedCustody: number;
  satelliteLock: number;
  total: number;
}

export interface CostSimulationResult {
  products: ProductItem[];
  incoterm: Incoterm;
  freight: number;
  insurance: InsuranceCalculation;
  taxes: TaxCalculation;
  localCosts: LocalCosts;
  transport?: TransportCost;
  totalCIF: number;
  totalLanded: number;
}

export type Incoterm = 'FOB' | 'FCA' | 'EXW' | 'CIF' | 'CFR' | 'DAP' | 'DDP' | 'CPT';

export type ViewMode = 'chat' | 'simulator';

export interface HSCodeResult {
  code: string;
  description: string;
  adValoremRate: number;
  iceRate: number;
  unit: string;
  notes?: string;
}
