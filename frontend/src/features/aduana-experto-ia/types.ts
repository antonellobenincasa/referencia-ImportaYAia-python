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
  totalTributos: number;
}

export interface InsuranceCalculation {
  cfrValue: number;
  calculatedPremium: number;
  minimumPremium: number;
  appliedPremium: number;
  iva: number;
  total: number;
}

export interface LocalCostsDestino {
  blFee: number;
  thcDestino: number;
  otrosLocales: number;
  otrosLocalesIva: number;
  total: number;
}

export interface OtrosGastosLogisticos {
  isd: number;
  seguroIva: number;
  almacenajePuerto: number;
  agenciamientoAduanero: number;
  agenciamientoIva: number;
  transporteInterno: number;
  custodiaArmada: number;
  candadoSatelital: number;
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
  localCosts: LocalCostsDestino;
  otrosGastos: OtrosGastosLogisticos;
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
