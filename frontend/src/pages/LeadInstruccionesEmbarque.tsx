import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SmartUploader from '../components/SmartUploader';
import ShippingInstructionsForm from '../components/ShippingInstructionsForm';
import ROGenerator from '../components/ROGenerator';
import { FileText, Upload, Sparkles, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  estado: string;
  origen_pais: string;
  destino_ciudad: string;
  descripcion_mercaderia: string;
  total_usd: string;
  routing_order_number: string | null;
  created_at: string;
}

interface ShippingInstructionData {
  id: number;
  status: string;
  ro_number: string | null;
  ai_extracted_data: any;
}

type Step = 'select' | 'documents' | 'form' | 'ro';

export default function LeadInstruccionesEmbarque() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [shippingInstruction, setShippingInstruction] = useState<ShippingInstructionData | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [initializingSI, setInitializingSI] = useState(false);

  useEffect(() => {
    fetchApprovedCotizaciones();
  }, []);

  useEffect(() => {
    const cotId = searchParams.get('cotizacion');
    if (cotId && cotizaciones.length > 0) {
      const cot = cotizaciones.find(c => c.id === parseInt(cotId));
      if (cot) {
        handleSelectCotizacion(cot);
      }
    }
  }, [searchParams, cotizaciones]);

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
        routing_order_number: s.ro_number || null,
        created_at: s.created_at || new Date().toISOString(),
      }));
      
      const approved = mapped.filter((c: Cotizacion) => c.estado === 'aprobada');
      setCotizaciones(approved);
      
      if (approved.length === 0) {
        setRedirecting(true);
        setTimeout(() => {
          navigate('/portal/mis-cotizaciones', { 
            state: { message: 'Debes aprobar una cotización antes de enviar instrucciones de embarque' }
          });
        }, 3000);
      }
    } catch (err) {
      setError('Error al cargar las cotizaciones aprobadas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCotizacion = async (cot: Cotizacion) => {
    setSelectedCotizacion(cot);
    setInitializingSI(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('/api/sales/shipping-instructions/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lead_cotizacion_id: cot.id }),
      });

      if (response.ok) {
        const si = await response.json();
        setShippingInstruction(si);
        
        if (si.ro_number) {
          setCurrentStep('ro');
        } else if (si.status === 'finalized') {
          setCurrentStep('ro');
        } else if (si.status === 'ai_processed' || si.status === 'form_in_progress') {
          setCurrentStep('form');
        } else if (si.status === 'documents_uploaded') {
          setCurrentStep('form');
        } else {
          setCurrentStep('documents');
        }
      } else {
        const errorData = await response.json();
        if (errorData.error?.includes('escenario')) {
          setError('Esta cotización no tiene un escenario seleccionado. Por favor selecciona un escenario primero.');
        } else {
          setError(errorData.error || 'Error al inicializar instrucciones de embarque');
        }
        setSelectedCotizacion(null);
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      setSelectedCotizacion(null);
    } finally {
      setInitializingSI(false);
    }
  };

  const handleUploadComplete = () => {
    setCurrentStep('form');
  };

  const handleAIProcessed = async () => {
    if (shippingInstruction) {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/sales/shipping-instructions/${shippingInstruction.id}/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const updated = await response.json();
        setShippingInstruction(updated);
      }
    }
    setCurrentStep('form');
  };

  const handleFormFinalized = () => {
    setCurrentStep('ro');
    if (shippingInstruction) {
      setShippingInstruction({ ...shippingInstruction, status: 'finalized' });
    }
  };

  const handleROGenerated = (roNumber: string) => {
    if (shippingInstruction) {
      setShippingInstruction({ ...shippingInstruction, ro_number: roNumber, status: 'ro_generated' });
    }
  };

  const steps = [
    { id: 'documents', label: 'Documentos', icon: Upload },
    { id: 'form', label: 'Formulario', icon: FileText },
    { id: 'ro', label: 'Routing Order', icon: CheckCircle },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['documents', 'form', 'ro'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
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
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0A2540] mb-2">
            Instrucciones de Embarque Inteligentes
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00C9B7]" />
            Sube tus documentos y deja que la IA complete el formulario automáticamente
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-[#00C9B7] animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Cargando cotizaciones aprobadas...</p>
          </div>
        ) : cotizaciones.length === 0 || redirecting ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {redirecting ? (
                <Loader2 className="w-8 h-8 text-[#00C9B7] animate-spin" />
              ) : (
                <FileText className="w-8 h-8 text-yellow-500" />
              )}
            </div>
            <h3 className="text-xl font-bold text-[#0A2540] mb-2">No tienes cotizaciones aprobadas</h3>
            <p className="text-gray-600 mb-4">
              Para enviar instrucciones de embarque, primero debes aprobar una cotización de transporte.
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
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : !selectedCotizacion ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0A2540]">Selecciona una cotización aprobada:</h2>
            {cotizaciones.map((cot) => (
              <div
                key={cot.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[#00C9B7] transition-all cursor-pointer ${initializingSI ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => handleSelectCotizacion(cot)}
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
                    <p className="font-bold text-[#00C9B7]">${parseFloat(cot.total_usd || '0').toLocaleString()}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      APROBADA
                    </span>
                    {cot.routing_order_number && (
                      <p className="text-xs text-gray-500 mt-1">RO: {cot.routing_order_number}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {initializingSI && (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 text-[#00C9B7] animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Inicializando instrucciones...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-[#0A2540]">{selectedCotizacion.numero_cotizacion}</p>
                  <p className="text-sm text-gray-500">{selectedCotizacion.descripcion_mercaderia}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCotizacion(null);
                    setShippingInstruction(null);
                    setCurrentStep('select');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cambiar cotización
                </button>
              </div>

              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const status = getStepStatus(step.id);
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <button
                        onClick={() => {
                          if (status === 'completed' || status === 'current') {
                            setCurrentStep(step.id as Step);
                          }
                        }}
                        disabled={status === 'pending'}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                          ${status === 'current' ? 'bg-[#00C9B7] text-white' : ''}
                          ${status === 'completed' ? 'bg-green-100 text-green-700 cursor-pointer' : ''}
                          ${status === 'pending' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{step.label}</span>
                      </button>
                      {index < steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-300 mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {shippingInstruction && currentStep === 'documents' && (
              <SmartUploader
                shippingInstructionId={shippingInstruction.id}
                onUploadComplete={handleUploadComplete}
                onProcessAI={handleAIProcessed}
              />
            )}

            {shippingInstruction && currentStep === 'form' && (
              <ShippingInstructionsForm
                shippingInstructionId={shippingInstruction.id}
                aiExtractedData={shippingInstruction.ai_extracted_data}
                onFinalize={handleFormFinalized}
              />
            )}

            {shippingInstruction && currentStep === 'ro' && (
              <ROGenerator
                shippingInstructionId={shippingInstruction.id}
                roNumber={shippingInstruction.ro_number || undefined}
                status={shippingInstruction.status}
                onROGenerated={handleROGenerated}
              />
            )}

            {currentStep === 'documents' && (
              <div className="text-center">
                <button
                  onClick={() => setCurrentStep('form')}
                  className="text-[#00C9B7] hover:underline text-sm"
                >
                  Omitir y llenar formulario manualmente →
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
