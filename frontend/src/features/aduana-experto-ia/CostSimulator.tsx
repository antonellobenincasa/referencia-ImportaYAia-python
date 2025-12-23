import { useState } from 'react';
import type { Incoterm, TaxCalculation, InsuranceCalculation, LocalCostsDestino, OtrosGastosLogisticos } from './types';
import { 
  INCOTERMS, 
  INSURANCE_RATE,
  INSURANCE_MINIMUM,
  LOCAL_COSTS_LCL, 
  LOCAL_COSTS_FCL, 
  TRANSPORT_RATES, 
  SECURITY_SERVICES,
  COMMON_HS_CODES,
  IVA_RATE,
  FODINFA_RATE,
  ISD_RATE,
  ALMACENAJE_PUERTO_ARRIBO,
  AGENCIAMIENTO_ADUANERO
} from './constants';

interface CostSimulatorProps {
  onBack?: () => void;
}

type CargoType = 'LCL' | 'FCL';
type ContainerType = '20ft' | '40ft' | '40hc' | '40nor';

export default function CostSimulator({ onBack }: CostSimulatorProps) {
  const [cargoType, setCargoType] = useState<CargoType>('LCL');
  const [containerType, setContainerType] = useState<ContainerType>('20ft');
  const [containerQty, setContainerQty] = useState<number>(1);
  const [incoterm, setIncoterm] = useState<Incoterm>('FOB');
  const [fobValue, setFobValue] = useState<number>(0);
  const [freightCost, setFreightCost] = useState<number>(0);
  const [hsCode, setHsCode] = useState<string>('');
  const [adValoremRate, setAdValoremRate] = useState<number>(0);
  const [iceRate, setIceRate] = useState<number>(0);
  const [destinationCity, setDestinationCity] = useState<string>('Quito');
  const [includeArmedCustody, setIncludeArmedCustody] = useState(false);
  const [includeSatelliteLock, setIncludeSatelliteLock] = useState(false);
  const [productDescription, setProductDescription] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [includeISD, setIncludeISD] = useState(true);

  const calculateInsurance = (): InsuranceCalculation => {
    const cfrValue = fobValue + freightCost;
    const calculatedPremium = cfrValue * INSURANCE_RATE;
    const minimumPremium = INSURANCE_MINIMUM;
    const appliedPremium = Math.max(calculatedPremium, minimumPremium);
    const iva = appliedPremium * IVA_RATE;
    const total = appliedPremium + iva;

    return {
      cfrValue,
      calculatedPremium,
      minimumPremium,
      appliedPremium,
      iva,
      total,
    };
  };

  const calculateTaxes = (cifValue: number): TaxCalculation => {
    const adValorem = cifValue * (adValoremRate / 100);
    const fodinfa = cifValue * FODINFA_RATE;
    const baseICE = cifValue + adValorem + fodinfa;
    const ice = baseICE * (iceRate / 100);
    const baseIVA = cifValue + adValorem + fodinfa + ice;
    const iva = baseIVA * IVA_RATE;
    const totalTributos = adValorem + fodinfa + ice + iva;

    return {
      adValorem,
      adValoremRate,
      fodinfa,
      iva,
      ice,
      iceRate,
      totalTributos,
    };
  };

  const calculateLocalCostsDestino = (): LocalCostsDestino => {
    const costs = cargoType === 'FCL' ? LOCAL_COSTS_FCL : LOCAL_COSTS_LCL;
    const qty = cargoType === 'FCL' ? containerQty : 1;
    
    const blFee = costs.blFee;
    const thcDestino = costs.thcDestino * qty;
    const otrosLocales = costs.otrosLocalesPorCntr * qty;
    const otrosLocalesIva = otrosLocales * IVA_RATE;
    const total = blFee + thcDestino + otrosLocales + otrosLocalesIva;

    return {
      blFee,
      thcDestino,
      otrosLocales,
      otrosLocalesIva,
      total,
    };
  };

  const calculateOtrosGastosLogisticos = (seguroIva: number): OtrosGastosLogisticos => {
    const isd = includeISD ? (fobValue + freightCost) * ISD_RATE : 0;
    const qty = cargoType === 'FCL' ? containerQty : 1;
    const almacenajePuerto = ALMACENAJE_PUERTO_ARRIBO * qty;
    const agenciamientoAduanero = AGENCIAMIENTO_ADUANERO;
    const agenciamientoIva = agenciamientoAduanero * IVA_RATE;
    
    let transporteInterno = 0;
    let custodiaArmada = 0;
    let candadoSatelital = 0;

    if (cargoType === 'FCL') {
      const cityRates = TRANSPORT_RATES[destinationCity];
      if (cityRates) {
        transporteInterno = (cityRates[containerType] || 0) * containerQty;
      }

      const citySecurityRates = SECURITY_SERVICES[destinationCity];
      if (citySecurityRates) {
        if (includeArmedCustody) {
          custodiaArmada = (citySecurityRates.armedCustody[containerType] || 0) * containerQty;
        }
        if (includeSatelliteLock) {
          candadoSatelital = citySecurityRates.satelliteLock.daily * citySecurityRates.satelliteLock.minimum * containerQty;
        }
      }
    }

    const total = isd + seguroIva + almacenajePuerto + agenciamientoAduanero + agenciamientoIva + 
                  transporteInterno + custodiaArmada + candadoSatelital;

    return {
      isd,
      seguroIva,
      almacenajePuerto,
      agenciamientoAduanero,
      agenciamientoIva,
      transporteInterno,
      custodiaArmada,
      candadoSatelital,
      total,
    };
  };

  const calculateTotals = () => {
    const insurance = calculateInsurance();
    const cifValue = fobValue + freightCost + insurance.appliedPremium;
    const taxes = calculateTaxes(cifValue);
    const localCosts = calculateLocalCostsDestino();
    const otrosGastos = calculateOtrosGastosLogisticos(insurance.iva);

    const totalLanded = cifValue + taxes.totalTributos + localCosts.total + otrosGastos.total;

    return {
      fobValue,
      freightCost,
      insurance,
      cifValue,
      taxes,
      localCosts,
      otrosGastos,
      totalLanded,
    };
  };

  const handleHsCodeSelect = (code: typeof COMMON_HS_CODES[0]) => {
    setHsCode(code.code);
    setAdValoremRate(code.adValorem);
    setIceRate(code.ice);
    setProductDescription(code.description);
  };

  const handleCalculate = () => {
    setShowResults(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const results = calculateTotals();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-[#00C9B7] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Volver al Chat</span>
            </button>
          )}
          <h2 className="text-lg font-bold text-[#0A2540]">Simulador de Costos</h2>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!showResults ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#0A2540] mb-4">Tipo de Carga</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['LCL', 'FCL'] as CargoType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setCargoType(type)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      cargoType === type
                        ? 'border-[#00C9B7] bg-[#00C9B7]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{type === 'LCL' ? '📦' : '🚢'}</span>
                    <span className="font-medium text-[#0A2540]">{type}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {type === 'LCL' ? 'Carga suelta' : 'Contenedor completo'}
                    </p>
                  </button>
                ))}
              </div>

              {cargoType === 'FCL' && (
                <>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Contenedor</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['20ft', '40ft', '40hc', '40nor'] as ContainerType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setContainerType(type)}
                          className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                            containerType === type
                              ? 'border-[#00C9B7] bg-[#00C9B7] text-white'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {type === '40nor' ? '40NOR' : type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de Contenedores</label>
                    <input
                      type="number"
                      min="1"
                      value={containerQty}
                      onChange={(e) => setContainerQty(Math.max(1, Number(e.target.value)))}
                      className="w-24 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#0A2540] mb-4">Incoterm</h3>
              <select
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value as Incoterm)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              >
                {Object.entries(INCOTERMS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {key} - {value.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                {INCOTERMS[incoterm].description}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#0A2540] mb-4">Valor FOB y Flete</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor FOB (USD)</label>
                  <input
                    type="number"
                    value={fobValue || ''}
                    onChange={(e) => setFobValue(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flete (USD)</label>
                  <input
                    type="number"
                    value={freightCost || ''}
                    onChange={(e) => setFreightCost(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeISD}
                    onChange={(e) => setIncludeISD(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#00C9B7] focus:ring-[#00C9B7]"
                  />
                  <div>
                    <span className="font-medium text-[#0A2540]">Incluir ISD (5%)</span>
                    <p className="text-xs text-gray-500">Impuesto a la Salida de Divisas sobre pagos al exterior</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#0A2540] mb-4">Clasificación Arancelaria</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                <input
                  type="text"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe tu producto..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                />
              </div>
              
              <p className="text-sm text-gray-500 mb-3">O selecciona una categoría común:</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {COMMON_HS_CODES.slice(0, 10).map((code) => (
                  <button
                    key={code.code}
                    onClick={() => handleHsCodeSelect(code)}
                    className={`p-2 text-left rounded-lg border text-sm transition-all ${
                      hsCode === code.code
                        ? 'border-[#00C9B7] bg-[#00C9B7]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-[#0A2540]">{code.code}</span>
                    <p className="text-xs text-gray-500 truncate">{code.description}</p>
                    <span className="text-xs text-[#00C9B7]">Ad-Val: {code.adValorem}%</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código HS</label>
                  <input
                    type="text"
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    placeholder="0000.00"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad-Valorem (%)</label>
                  <input
                    type="number"
                    value={adValoremRate || ''}
                    onChange={(e) => setAdValoremRate(Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {cargoType === 'FCL' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#0A2540] mb-4">Transporte Interno</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad Destino</label>
                  <select
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  >
                    {Object.keys(TRANSPORT_RATES).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeArmedCustody}
                      onChange={(e) => setIncludeArmedCustody(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-[#00C9B7] focus:ring-[#00C9B7]"
                    />
                    <div>
                      <span className="font-medium text-[#0A2540]">Custodia Armada</span>
                      <p className="text-xs text-gray-500">+{formatCurrency((SECURITY_SERVICES[destinationCity]?.armedCustody[containerType] || 0) * containerQty)}</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSatelliteLock}
                      onChange={(e) => setIncludeSatelliteLock(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-[#00C9B7] focus:ring-[#00C9B7]"
                    />
                    <div>
                      <span className="font-medium text-[#0A2540]">Candado Satelital</span>
                      <p className="text-xs text-gray-500">+{formatCurrency((SECURITY_SERVICES[destinationCity]?.satelliteLock.daily || 0) * (SECURITY_SERVICES[destinationCity]?.satelliteLock.minimum || 3) * containerQty)} (min. {SECURITY_SERVICES[destinationCity]?.satelliteLock.minimum || 3} días)</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={fobValue <= 0}
              className="w-full py-4 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Calcular Costos de Importación
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <button
              onClick={() => setShowResults(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-[#00C9B7] transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Modificar datos</span>
            </button>

            <div className="bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Costo Total Estimado</h3>
              <p className="text-4xl font-bold text-[#A4FF00]">{formatCurrency(results.totalLanded)}</p>
              <p className="text-sm text-gray-300 mt-1">Costo total puesto en destino</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#0A2540] mb-4">Desglose de Costos</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Valor FOB</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.fobValue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Flete Internacional</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.freightCost)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">
                    Seguro de Carga 
                    <span className="text-xs text-gray-400 ml-1">
                      ({results.insurance.calculatedPremium < results.insurance.minimumPremium ? 'mínimo $70' : '0.35%'})
                    </span>
                  </span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.insurance.appliedPremium)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-gray-50 px-2 rounded">
                  <span className="font-medium text-[#0A2540]">Valor CIF</span>
                  <span className="font-bold text-[#0A2540]">{formatCurrency(results.cifValue)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#0A2540] mb-4">Tributos Aduaneros</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Ad-Valorem ({adValoremRate}%)</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.taxes.adValorem)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">FODINFA (0.5%)</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.taxes.fodinfa)}</span>
                </div>
                {results.taxes.ice > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">ICE ({iceRate}%)</span>
                    <span className="font-medium text-[#0A2540]">{formatCurrency(results.taxes.ice)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">IVA (15%)</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.taxes.iva)}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-red-50 px-2 rounded">
                  <span className="font-medium text-red-700">Total Tributos</span>
                  <span className="font-bold text-red-700">{formatCurrency(results.taxes.totalTributos)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#0A2540] mb-4">Gastos Locales Destino</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">B/L Fee</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.localCosts.blFee)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">THC Destino {cargoType === 'FCL' && containerQty > 1 ? `(x${containerQty} cntr)` : ''}</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.localCosts.thcDestino)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Otros Locales Destino {cargoType === 'FCL' && containerQty > 1 ? `(x${containerQty} cntr)` : ''}</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.localCosts.otrosLocales)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">IVA Otros Locales (15%)</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.localCosts.otrosLocalesIva)}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-blue-50 px-2 rounded">
                  <span className="font-medium text-blue-700">Total Gastos Locales</span>
                  <span className="font-bold text-blue-700">{formatCurrency(results.localCosts.total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#0A2540] mb-4">Otros Gastos Logísticos</h3>
              
              <div className="space-y-3">
                {results.otrosGastos.isd > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">ISD (5% sobre FOB + Flete)</span>
                    <span className="font-medium text-[#0A2540]">{formatCurrency(results.otrosGastos.isd)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">IVA Seguro de Carga (15%)</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.otrosGastos.seguroIva)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Almacenaje Puerto Arribo {(cargoType === 'FCL' && containerQty > 1) ? `(x${containerQty} cntr)` : ''}</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.otrosGastos.almacenajePuerto)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Honorario Agenciamiento Aduanero</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.otrosGastos.agenciamientoAduanero)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">IVA Agenciamiento (15%)</span>
                  <span className="font-medium text-[#0A2540]">{formatCurrency(results.otrosGastos.agenciamientoIva)}</span>
                </div>
                {cargoType === 'FCL' && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Flete a {destinationCity} {containerQty > 1 ? `(x${containerQty} cntr)` : ''}</span>
                      <span className="font-medium text-[#0A2540]">{formatCurrency(results.otrosGastos.transporteInterno)}</span>
                    </div>
                    {results.otrosGastos.custodiaArmada > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Custodia Armada</span>
                        <span className="font-medium text-[#0A2540]">{formatCurrency(results.otrosGastos.custodiaArmada)}</span>
                      </div>
                    )}
                    {results.otrosGastos.candadoSatelital > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Candado Satelital</span>
                        <span className="font-medium text-[#0A2540]">{formatCurrency(results.otrosGastos.candadoSatelital)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center py-2 bg-amber-50 px-2 rounded">
                  <span className="font-medium text-amber-700">Total Otros Gastos</span>
                  <span className="font-bold text-amber-700">{formatCurrency(results.otrosGastos.total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 rounded-2xl p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">TOTAL LANDED</h3>
                  <p className="text-sm text-gray-300">Costo total puesto en destino</p>
                </div>
                <p className="text-4xl font-bold text-[#A4FF00]">{formatCurrency(results.totalLanded)}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              * Los valores son estimados y pueden variar según condiciones específicas de la importación. Consulte con un agente aduanero para una cotización definitiva.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
