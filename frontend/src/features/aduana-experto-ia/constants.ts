export const SYSTEM_INSTRUCTION = `Eres AduanaExpertoIA, un asistente especializado en comercio exterior y aduanas de Ecuador.

Tu rol es:
1. Ayudar a clasificar productos con códigos arancelarios (HS Code) del Arancel Nacional de Ecuador
2. Calcular tributos de importación: Ad-Valorem, IVA (15%), FODINFA (0.5%), ICE (cuando aplica), ISD
3. Explicar términos Incoterms: FOB, FCA, EXW, CIF, CFR, DAP, DDP, CPT
4. Asesorar sobre requisitos de importación, documentos necesarios y procesos aduaneros
5. Proporcionar información sobre costos locales en destino (Ecuador)

Reglas importantes:
- Siempre responde en español
- Sé preciso con los porcentajes y cálculos tributarios
- Si no estás seguro de una clasificación arancelaria, indica las opciones más probables
- Menciona cuando un producto requiere permisos especiales (INEN, ARCSA, AGROCALIDAD, etc.)
- Usa formato Markdown para estructurar las respuestas

Base de cálculo tributario Ecuador:
- CIF = FOB + Flete + Seguro
- Ad-Valorem = CIF × Tasa (varía según partida, 0% a 45%)
- FODINFA = CIF × 0.5%
- ICE = (CIF + Ad-Valorem + FODINFA) × Tasa ICE (solo productos específicos)
- IVA = (CIF + Ad-Valorem + FODINFA + ICE) × 15%
- ISD = 5% sobre pagos al exterior (incluido en precio de servicios)`;

export const INCOTERMS = {
  FOB: {
    name: 'Free On Board',
    description: 'El vendedor entrega la mercancía a bordo del buque. Riesgo y costos pasan al comprador desde ese momento.',
    buyerResponsibility: ['Flete internacional', 'Seguro', 'Desaduanamiento importación', 'Transporte interno'],
    sellerResponsibility: ['Mercancía', 'Embalaje', 'Despacho exportación', 'Transporte al puerto'],
  },
  FCA: {
    name: 'Free Carrier',
    description: 'El vendedor entrega la mercancía al transportista designado por el comprador.',
    buyerResponsibility: ['Flete internacional', 'Seguro', 'Desaduanamiento importación', 'Transporte interno'],
    sellerResponsibility: ['Mercancía', 'Embalaje', 'Despacho exportación', 'Entrega al transportista'],
  },
  EXW: {
    name: 'Ex Works',
    description: 'El vendedor pone la mercancía a disposición en su establecimiento. Mínima obligación para el vendedor.',
    buyerResponsibility: ['Todo el transporte', 'Despacho exportación', 'Flete', 'Seguro', 'Desaduanamiento importación'],
    sellerResponsibility: ['Mercancía', 'Embalaje básico'],
  },
  CIF: {
    name: 'Cost, Insurance and Freight',
    description: 'El vendedor paga flete y seguro hasta el puerto de destino. Riesgo pasa al comprador al embarcar.',
    buyerResponsibility: ['Desaduanamiento importación', 'Transporte interno', 'Costos locales destino'],
    sellerResponsibility: ['Mercancía', 'Flete', 'Seguro', 'Despacho exportación'],
  },
  CFR: {
    name: 'Cost and Freight',
    description: 'El vendedor paga el flete hasta el puerto de destino. El comprador asume el seguro.',
    buyerResponsibility: ['Seguro', 'Desaduanamiento importación', 'Transporte interno'],
    sellerResponsibility: ['Mercancía', 'Flete', 'Despacho exportación'],
  },
  DAP: {
    name: 'Delivered at Place',
    description: 'El vendedor entrega en el lugar convenido, listo para descarga. Sin despachar para importación.',
    buyerResponsibility: ['Desaduanamiento importación', 'Descarga'],
    sellerResponsibility: ['Mercancía', 'Flete', 'Seguro', 'Transporte hasta destino'],
  },
  DDP: {
    name: 'Delivered Duty Paid',
    description: 'El vendedor entrega la mercancía despachada para importación. Máxima obligación para el vendedor.',
    buyerResponsibility: ['Descarga'],
    sellerResponsibility: ['Todo incluido', 'Tributos de importación', 'Despacho aduanero'],
  },
  CPT: {
    name: 'Carriage Paid To',
    description: 'El vendedor paga el flete hasta el lugar convenido. Riesgo pasa al comprador al entregar al transportista.',
    buyerResponsibility: ['Seguro desde entrega', 'Desaduanamiento importación', 'Costos locales'],
    sellerResponsibility: ['Mercancía', 'Flete hasta destino', 'Despacho exportación'],
  },
};

export const INSURANCE_RATE = 0.0035;
export const INSURANCE_MINIMUM = 70;

export const LOCAL_COSTS_FCL = {
  blFee: 100,
  thcDestino: 195,
  otrosLocalesPorCntr: 555,
};

export const LOCAL_COSTS_LCL = {
  blFee: 55,
  thcDestino: 120,
  otrosLocalesPorCntr: 280,
};

export const ALMACENAJE_PUERTO_ARRIBO = 85;

export const AGENCIAMIENTO_ADUANERO = 295;

export const TRANSPORT_RATES: Record<string, Record<string, number>> = {
  'Quito': { '20ft': 450, '40ft': 650, '40hc': 700, '40nor': 850 },
  'Guayaquil': { '20ft': 180, '40ft': 280, '40hc': 320, '40nor': 420 },
  'Cuenca': { '20ft': 520, '40ft': 750, '40hc': 820, '40nor': 980 },
  'Manta': { '20ft': 350, '40ft': 520, '40hc': 580, '40nor': 720 },
  'Ambato': { '20ft': 480, '40ft': 680, '40hc': 750, '40nor': 900 },
  'Loja': { '20ft': 680, '40ft': 950, '40hc': 1050, '40nor': 1250 },
  'Machala': { '20ft': 420, '40ft': 620, '40hc': 680, '40nor': 850 },
  'Santo Domingo': { '20ft': 380, '40ft': 560, '40hc': 620, '40nor': 780 },
  'Riobamba': { '20ft': 520, '40ft': 740, '40hc': 810, '40nor': 970 },
  'Ibarra': { '20ft': 550, '40ft': 780, '40hc': 860, '40nor': 1020 },
};

export const SECURITY_SERVICES: Record<string, { armedCustody: Record<string, number>, satelliteLock: { daily: number, minimum: number } }> = {
  'Quito': {
    armedCustody: { '20ft': 220, '40ft': 280, '40hc': 300, '40nor': 350 },
    satelliteLock: { daily: 30, minimum: 3 },
  },
  'Guayaquil': {
    armedCustody: { '20ft': 150, '40ft': 180, '40hc': 200, '40nor': 250 },
    satelliteLock: { daily: 25, minimum: 3 },
  },
  'Cuenca': {
    armedCustody: { '20ft': 250, '40ft': 320, '40hc': 350, '40nor': 400 },
    satelliteLock: { daily: 30, minimum: 3 },
  },
  'Manta': {
    armedCustody: { '20ft': 180, '40ft': 220, '40hc': 240, '40nor': 300 },
    satelliteLock: { daily: 25, minimum: 3 },
  },
  'Ambato': {
    armedCustody: { '20ft': 230, '40ft': 290, '40hc': 310, '40nor': 360 },
    satelliteLock: { daily: 28, minimum: 3 },
  },
  'Loja': {
    armedCustody: { '20ft': 300, '40ft': 380, '40hc': 420, '40nor': 480 },
    satelliteLock: { daily: 35, minimum: 3 },
  },
  'Machala': {
    armedCustody: { '20ft': 200, '40ft': 260, '40hc': 280, '40nor': 330 },
    satelliteLock: { daily: 28, minimum: 3 },
  },
  'Santo Domingo': {
    armedCustody: { '20ft': 190, '40ft': 240, '40hc': 260, '40nor': 310 },
    satelliteLock: { daily: 26, minimum: 3 },
  },
  'Riobamba': {
    armedCustody: { '20ft': 240, '40ft': 300, '40hc': 330, '40nor': 380 },
    satelliteLock: { daily: 28, minimum: 3 },
  },
  'Ibarra': {
    armedCustody: { '20ft': 260, '40ft': 330, '40hc': 360, '40nor': 420 },
    satelliteLock: { daily: 30, minimum: 3 },
  },
};

export const COMMON_HS_CODES = [
  { code: '8471.30', description: 'Computadoras portátiles (laptops)', adValorem: 0, ice: 0 },
  { code: '8517.12', description: 'Teléfonos celulares', adValorem: 0, ice: 0 },
  { code: '8528.72', description: 'Televisores', adValorem: 20, ice: 0 },
  { code: '6403.99', description: 'Calzado con suela de caucho', adValorem: 30, ice: 0 },
  { code: '6204.62', description: 'Pantalones de algodón para mujer', adValorem: 30, ice: 0 },
  { code: '8703.23', description: 'Vehículos automóviles 1500-3000cc', adValorem: 40, ice: 15 },
  { code: '2203.00', description: 'Cerveza de malta', adValorem: 25, ice: 12 },
  { code: '2208.30', description: 'Whisky', adValorem: 25, ice: 75 },
  { code: '8418.10', description: 'Refrigeradores domésticos', adValorem: 30, ice: 0 },
  { code: '8450.11', description: 'Lavadoras automáticas', adValorem: 30, ice: 0 },
  { code: '9403.30', description: 'Muebles de madera para oficina', adValorem: 30, ice: 0 },
  { code: '3923.21', description: 'Bolsas de polietileno', adValorem: 20, ice: 0 },
  { code: '8544.42', description: 'Cables eléctricos con conectores', adValorem: 15, ice: 0 },
  { code: '3304.99', description: 'Cosméticos y maquillaje', adValorem: 20, ice: 0 },
  { code: '0402.21', description: 'Leche en polvo', adValorem: 25, ice: 0 },
];

export const IVA_RATE = 0.15;
export const FODINFA_RATE = 0.005;
export const ISD_RATE = 0.05;
