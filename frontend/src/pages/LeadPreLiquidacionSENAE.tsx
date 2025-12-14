import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  estado: string;
  origen_pais: string;
  destino_ciudad: string;
  descripcion_mercaderia: string;
  total_usd: string;
  flete_usd: string;
  seguro_usd: string;
}

interface PermitInfo {
  institucion: string;
  permiso: string;
  descripcion: string;
  tramite_previo: boolean;
  tiempo_estimado: string;
}

interface PreLiquidationResult {
  suggested_hs_code: string;
  hs_code_confidence: number;
  ai_reasoning: string;
  fob_value_usd: number;
  freight_usd: number;
  insurance_usd: number;
  cif_value_usd: number;
  ad_valorem_usd: number;
  fodinfa_usd: number;
  iva_usd: number;
  total_tributos_usd: number;
  requires_permit?: boolean;
  permit_info?: PermitInfo | null;
  special_taxes?: string[];
  ai_status?: string;
}

export default function LeadPreLiquidacionSENAE() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PreLiquidationResult | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    product_description: '',
    fob_value_usd: '',
  });

  useEffect(() => {
    fetchApprovedCotizaciones();
  }, []);

  const fetchApprovedCotizaciones = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/sales/quote-submissions/my-submissions/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al cargar cotizaciones');

      const data = await response.json();
      const submissions = data.results || data || [];
      
      const mapStatus = (status: string): string => {
        const statusMap: { [key: string]: string } = {
          'aprobada': 'aprobada',
          'ro_generado': 'ro_generado',
          'cotizacion_generada': 'cotizado',
          'enviada': 'cotizado',
        };
        return statusMap[status] || status;
      };
      
      const mapped = submissions.map((s: any) => ({
        id: s.id,
        numero_cotizacion: s.submission_number || `QS-${s.id}`,
        estado: mapStatus(s.status),
        origen_pais: s.origin || '',
        destino_ciudad: s.city || s.destination || '',
        descripcion_mercaderia: s.cargo_description || s.product_description || '',
        total_usd: String(parseFloat(s.final_price) || 0),
        flete_usd: String(parseFloat(s.freight_cost) || 0),
        seguro_usd: String(parseFloat(s.insurance_cost) || 0),
      }));
      
      const approved = mapped.filter((c: Cotizacion) => c.estado === 'aprobada' || c.estado === 'ro_generado');
      setCotizaciones(approved);
      
      if (approved.length === 0) {
        setRedirecting(true);
        setTimeout(() => {
          navigate('/portal/mis-cotizaciones', { 
            state: { message: 'Debes aprobar una cotizacion antes de solicitar Pre-Liquidacion SENAE' }
          });
        }, 3000);
      }
    } catch (err) {
      setError('Error al cargar las cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCotizacion) return;

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      const fobValue = parseFloat(formData.fob_value_usd);
      const freightValue = parseFloat(selectedCotizacion.flete_usd || '0');
      const insuranceValue = parseFloat(selectedCotizacion.seguro_usd || '0');

      const response = await fetch('/api/sales/pre-liquidations/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cotizacion: selectedCotizacion.id,
          product_description: formData.product_description,
          fob_value_usd: fobValue.toFixed(2),
          freight_usd: freightValue.toFixed(2),
          insurance_usd: insuranceValue.toFixed(2),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Error al calcular pre-liquidacion');
      }

      const data = await response.json();
      
      const requiredFields = ['cif_value_usd', 'ad_valorem_usd', 'fodinfa_usd', 'iva_usd', 'total_tributos_usd'];
      const missingFields = requiredFields.filter(field => 
        data[field] === undefined || data[field] === null || data[field] === ''
      );
      
      if (missingFields.length > 0) {
        throw new Error(`El servidor no pudo calcular todos los tributos. Por favor intente nuevamente o contacte soporte.`);
      }

      setResult({
        suggested_hs_code: data.suggested_hs_code || '9999.00.00',
        hs_code_confidence: parseFloat(data.hs_code_confidence) || 50,
        ai_reasoning: data.ai_reasoning || 'Clasificacion pendiente de revision',
        fob_value_usd: parseFloat(data.fob_value_usd),
        freight_usd: parseFloat(data.freight_usd),
        insurance_usd: parseFloat(data.insurance_usd),
        cif_value_usd: parseFloat(data.cif_value_usd),
        ad_valorem_usd: parseFloat(data.ad_valorem_usd),
        fodinfa_usd: parseFloat(data.fodinfa_usd),
        iva_usd: parseFloat(data.iva_usd),
        total_tributos_usd: parseFloat(data.total_tributos_usd),
        requires_permit: data.requires_permit || false,
        permit_info: data.permit_info || null,
        special_taxes: data.special_taxes || [],
        ai_status: data.ai_status || 'unknown',
      });
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0A2540] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
              <span className="text-[#0A2540] font-black text-sm">IA</span>
            </div>
            <span className="text-lg font-bold">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/portal" className="text-sm text-gray-300 hover:text-white transition-colors">
              Volver al Dashboard
            </Link>
            <button onClick={logout} className="text-sm text-gray-300 hover:text-white transition-colors">
              Cerrar Sesion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏛️</span>
            <h1 className="text-3xl font-bold text-[#0A2540]">
              Pre-Liquidacion de Impuestos SENAE
            </h1>
          </div>
          <p className="text-gray-600">
            Calcula los tributos aduaneros estimados para tu importacion con asistencia de Inteligencia Artificial
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C9B7] mx-auto"></div>
            <p className="mt-4 text-gray-500">Verificando cotizaciones aprobadas...</p>
          </div>
        ) : cotizaciones.length === 0 || redirecting ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {redirecting ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C9B7]"></div>
              ) : (
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#0A2540] mb-2">Cotizacion Aprobada Requerida</h3>
            <p className="text-gray-600 mb-4">
              Para solicitar una Pre-Liquidacion SENAE, primero debes tener al menos una cotizacion de transporte con estado <strong>APROBADA</strong>.
            </p>
            {redirecting ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-700 text-sm font-medium">
                  Redireccionando al Administrador de Cotizaciones...
                </p>
              </div>
            ) : (
              <Link
                to="/portal/mis-cotizaciones"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00C9B7] text-white rounded-xl font-medium hover:bg-[#00a99d] transition-colors"
              >
                Ir al Administrador de Cotizaciones
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}
          </div>
        ) : result ? (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[#0A2540] mb-6">Resultado de Pre-Liquidacion</h2>
              
              <div className="bg-gradient-to-r from-[#00C9B7]/10 to-[#A4FF00]/10 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="font-bold text-[#0A2540]">Sugerencia de Partida Arancelaria (IA)</p>
                    <p className="text-sm text-gray-600">Confianza: {result.hs_code_confidence}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-mono font-bold text-[#0A2540]">{result.suggested_hs_code}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Sugerido por IA</span>
                </div>
                <p className="mt-3 text-gray-600 text-sm">{result.ai_reasoning}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-[#0A2540]">Calculo de Base Imponible (CIF)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Valor FOB (Factura)</p>
                    <p className="text-xl font-bold text-[#0A2540]">{formatCurrency(result.fob_value_usd)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Flete Internacional</p>
                    <p className="text-xl font-bold text-[#0A2540]">{formatCurrency(result.freight_usd)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Seguro de Carga</p>
                    <p className="text-xl font-bold text-[#0A2540]">{formatCurrency(result.insurance_usd)}</p>
                  </div>
                  <div className="bg-[#00C9B7]/10 rounded-xl p-4 border-2 border-[#00C9B7]">
                    <p className="text-sm text-[#00C9B7] font-medium">VALOR CIF (Base Imponible)</p>
                    <p className="text-xl font-bold text-[#0A2540]">{formatCurrency(result.cif_value_usd)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-[#0A2540]">Tributos Aduaneros Estimados</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-700">Ad Valorem</p>
                      <p className="text-sm text-gray-500">Segun partida arancelaria (estimado 10%)</p>
                    </div>
                    <p className="font-bold text-[#0A2540]">{formatCurrency(result.ad_valorem_usd)}</p>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-700">FODINFA</p>
                      <p className="text-sm text-gray-500">Fondo de Desarrollo para la Infancia (0.50%)</p>
                    </div>
                    <p className="font-bold text-[#0A2540]">{formatCurrency(result.fodinfa_usd)}</p>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-700">IVA</p>
                      <p className="text-sm text-gray-500">Impuesto al Valor Agregado (15%)</p>
                    </div>
                    <p className="font-bold text-[#0A2540]">{formatCurrency(result.iva_usd)}</p>
                  </div>
                  <div className="flex justify-between items-center py-4 bg-[#0A2540] text-white rounded-xl px-4">
                    <p className="font-bold">TOTAL TRIBUTOS ESTIMADOS</p>
                    <p className="text-2xl font-bold">{formatCurrency(result.total_tributos_usd)}</p>
                  </div>
                </div>
              </div>
            </div>

            {result.requires_permit && result.permit_info && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-800 mb-2 text-lg flex items-center gap-2">
                      <span>⚠️ PERMISO PREVIO REQUERIDO</span>
                    </h4>
                    <div className="bg-white rounded-xl p-4 border border-red-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Institucion</p>
                          <p className="font-bold text-red-700">{result.permit_info.institucion}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Tipo de Permiso</p>
                          <p className="font-bold text-red-700">{result.permit_info.permiso}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 uppercase">Descripcion</p>
                          <p className="text-gray-700">{result.permit_info.descripcion}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Tiempo Estimado de Tramite</p>
                          <p className="font-medium text-gray-700">{result.permit_info.tiempo_estimado}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Tramite Previo al Embarque</p>
                          <p className={`font-bold ${result.permit_info.tramite_previo ? 'text-red-600' : 'text-yellow-600'}`}>
                            {result.permit_info.tramite_previo ? 'SI - Obligatorio antes de embarcar' : 'No - Se tramita al desaduanar'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-red-700 text-sm mt-3 font-medium">
                      Este producto requiere tramitar el permiso antes de proceder con la importacion. Contacta a nuestros asesores para mayor informacion.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result.special_taxes && result.special_taxes.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-800 mb-2">Impuestos Especiales Aplicables</h4>
                    <ul className="list-disc list-inside text-purple-700">
                      {result.special_taxes.map((tax, index) => (
                        <li key={index} className="font-medium">{tax}</li>
                      ))}
                    </ul>
                    <p className="text-purple-600 text-sm mt-2">
                      Estos impuestos adicionales (ICE, salvaguardia) no estan incluidos en el total estimado arriba.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-amber-800 mb-2">Aviso Legal Importante</h4>
                  <p className="text-amber-700 text-sm">
                    El resultado de la pre-liquidacion de impuestos son <strong>valores estimados</strong> que pueden variar segun la Aduana local (SENAE), sujetos a revision y ajustes finales del tramite por parte de los funcionarios aduaneros. Los valores definitivos seran determinados al momento del aforo aduanero. Tasas vigentes 2025: IVA 15%, FODINFA 0.5%.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setSelectedCotizacion(null);
                  setFormData({ product_description: '', fob_value_usd: '' });
                }}
                className="flex-1 py-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Nueva Consulta
              </button>
              <Link
                to="/portal"
                className="flex-1 py-4 bg-[#00C9B7] text-white font-bold rounded-xl hover:bg-[#00a99d] transition-colors text-center"
              >
                Volver al Dashboard
              </Link>
            </div>
          </div>
        ) : !selectedCotizacion ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0A2540]">Selecciona una cotizacion aprobada:</h2>
            {cotizaciones.map((cot) => (
              <div
                key={cot.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[#00C9B7] transition-all cursor-pointer"
                onClick={() => setSelectedCotizacion(cot)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-[#0A2540]">{cot.numero_cotizacion}</p>
                    <p className="text-gray-600 text-sm">{cot.descripcion_mercaderia}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {cot.origen_pais} → {cot.destino_ciudad}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      cot.estado === 'aprobada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {cot.estado.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0A2540]">Datos para Pre-Liquidacion</h2>
                <p className="text-gray-600 text-sm">Cotizacion: {selectedCotizacion.numero_cotizacion}</p>
              </div>
              <button
                onClick={() => setSelectedCotizacion(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripcion Detallada de la Mercaderia
                </label>
                <textarea
                  value={formData.product_description}
                  onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  rows={3}
                  placeholder="Ej: Laptops marca Dell modelo XPS 15, nuevas, para uso comercial"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta descripcion sera usada por nuestra IA para sugerir la partida arancelaria correcta
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Comercial FOB (USD) - Factura Proforma/Invoice
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fob_value_usd}
                    onChange={(e) => setFormData({ ...formData, fob_value_usd: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documentos de Soporte (Opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#00C9B7] transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600">Arrastra archivos aqui o <span className="text-[#00C9B7] font-medium">selecciona</span></p>
                    <p className="text-xs text-gray-500 mt-1">Facturas, proformas, fichas tecnicas (PDF, JPG, PNG)</p>
                  </label>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> El flete y seguro se tomaran automaticamente de tu cotizacion aprobada para calcular el valor CIF (Base Imponible = FOB + Flete + Seguro).
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? 'Calculando con IA...' : 'Calcular Pre-Liquidacion SENAE'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
