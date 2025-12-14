import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Ship, Loader2, ArrowLeft, MapPin, Calendar, Clock, 
  CheckCircle2, Circle, Package, Anchor, Truck, FileCheck,
  Building2, ClipboardCheck, FileText, AlertCircle
} from 'lucide-react';

interface Milestone {
  id: number;
  milestone_key: string;
  milestone_label: string;
  milestone_order: number;
  status: 'pending' | 'in_progress' | 'completed';
  planned_date: string | null;
  actual_date: string | null;
  meta_data: Record<string, any>;
}

interface CargoDetail {
  id: number;
  ro_number: string;
  company_name: string;
  pol: string;
  pod: string;
  transport_type: string;
  status: string;
  status_display: string;
  cargo_description: string;
  vessel_name: string | null;
  voyage_number: string | null;
  container_number: string | null;
  bl_number: string | null;
  etd: string | null;
  eta: string | null;
  cut_off_documental: string | null;
  cut_off_fisico: string | null;
  cut_off_vgm: string | null;
  milestones: Milestone[];
  created_at: string;
}

const milestoneIcons: Record<string, typeof Ship> = {
  'SI_CONFIRMADA': FileCheck,
  'BOOKING_CONFIRMADO': ClipboardCheck,
  'EN_TRANSITO_ORIGEN': Truck,
  'INGRESO_BODEGA_ORIGEN': Building2,
  'DOCUMENTACION_LISTA': FileText,
  'CARGA_EN_PUERTO': Anchor,
  'ZARPE_BUQUE': Ship,
  'EN_TRANSITO_MARITIMO': Ship,
  'ARRIBO_PUERTO_DESTINO': Anchor,
  'LIBERACION_ADUANAS': FileCheck,
  'EN_TRANSITO_TERRESTRE': Truck,
  'ENTREGA_BODEGA_CLIENTE': Building2,
  'DOCUMENTOS_FINALES': FileText,
  'CIERRE_OPERACION': CheckCircle2,
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('es-EC', { 
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function CargoTrackingDetail() {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState<CargoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchCargoDetail();
  }, [id]);

  const fetchCargoDetail = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/sales/cargo-tracking/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Embarque no encontrado');
        }
        throw new Error('Error al cargar el embarque');
      }

      const data = await response.json();
      setCargo(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el embarque');
    } finally {
      setLoading(false);
    }
  };

  const transportIcons: Record<string, string> = {
    'AEREO': '✈️',
    'LCL': '📦',
    'FCL': '🚢',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00C9B7] animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando información del embarque...</p>
        </div>
      </div>
    );
  }

  if (error || !cargo) {
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
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-[#0A2540] mb-3">{error || 'Embarque no encontrado'}</h3>
            <button
              onClick={() => navigate('/portal/cargo-tracking')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00C9B7] text-white rounded-xl font-medium hover:bg-[#00a99d] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la lista
            </button>
          </div>
        </main>
      </div>
    );
  }

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
              Dashboard
            </Link>
            <button onClick={logout} className="text-sm text-gray-300 hover:text-white transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/portal/cargo-tracking')}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0A2540] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Volver a mis embarques</span>
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 px-8 py-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{transportIcons[cargo.transport_type] || '📦'}</span>
                <div>
                  <h1 className="text-2xl font-bold">{cargo.ro_number}</h1>
                  <p className="text-gray-300">{cargo.company_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl">
                <MapPin className="w-5 h-5 text-[#A4FF00]" />
                <span className="font-medium">{cargo.pol}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">{cargo.pod}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {cargo.vessel_name && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Buque</p>
                  <p className="font-semibold text-[#0A2540]">{cargo.vessel_name}</p>
                </div>
              )}
              {cargo.voyage_number && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Viaje</p>
                  <p className="font-semibold text-[#0A2540]">{cargo.voyage_number}</p>
                </div>
              )}
              {cargo.container_number && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Contenedor</p>
                  <p className="font-semibold text-[#0A2540]">{cargo.container_number}</p>
                </div>
              )}
              {cargo.bl_number && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">B/L</p>
                  <p className="font-semibold text-[#0A2540]">{cargo.bl_number}</p>
                </div>
              )}
              {cargo.etd && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">ETD</p>
                  <p className="font-semibold text-[#0A2540]">{formatDate(cargo.etd)}</p>
                </div>
              )}
              {cargo.eta && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">ETA</p>
                  <p className="font-semibold text-[#0A2540]">{formatDate(cargo.eta)}</p>
                </div>
              )}
            </div>

            {(cargo.cut_off_documental || cargo.cut_off_fisico || cargo.cut_off_vgm) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
                <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Cut-offs Importantes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cargo.cut_off_documental && (
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-600">Documental</p>
                        <p className="font-semibold text-amber-800">{formatDateTime(cargo.cut_off_documental)}</p>
                      </div>
                    </div>
                  )}
                  {cargo.cut_off_fisico && (
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-600">Físico</p>
                        <p className="font-semibold text-amber-800">{formatDateTime(cargo.cut_off_fisico)}</p>
                      </div>
                    </div>
                  )}
                  {cargo.cut_off_vgm && (
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-600">VGM</p>
                        <p className="font-semibold text-amber-800">{formatDateTime(cargo.cut_off_vgm)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {cargo.cargo_description && (
              <div className="mb-8">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Descripción de Carga</p>
                <p className="text-gray-700">{cargo.cargo_description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-[#0A2540] mb-8 flex items-center gap-3">
            <Ship className="w-6 h-6 text-[#00C9B7]" />
            Timeline de Seguimiento
          </h2>

          <div className="relative">
            {cargo.milestones.map((milestone, index) => {
              const Icon = milestoneIcons[milestone.milestone_key] || Circle;
              const isCompleted = milestone.status === 'completed';
              const isInProgress = milestone.status === 'in_progress';
              const isPending = milestone.status === 'pending';
              const isLast = index === cargo.milestones.length - 1;

              return (
                <div key={milestone.id} className="relative flex gap-6 pb-8">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${isCompleted ? 'bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] shadow-lg shadow-[#00C9B7]/30' : ''}
                        ${isInProgress ? 'bg-[#0A2540] ring-4 ring-[#00C9B7]/30 animate-pulse' : ''}
                        ${isPending ? 'bg-gray-100 border-2 border-gray-200' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isInProgress ? 'text-[#A4FF00]' : 'text-gray-400'}`} />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`
                          w-0.5 flex-1 mt-2 transition-all duration-500
                          ${isCompleted ? 'bg-gradient-to-b from-[#00C9B7] to-[#A4FF00]' : 'bg-gray-200'}
                        `}
                      />
                    )}
                  </div>

                  <div className={`flex-1 pb-4 ${isInProgress ? 'transform scale-[1.02]' : ''} transition-transform duration-300`}>
                    <div className={`
                      p-4 rounded-2xl border transition-all duration-300
                      ${isCompleted ? 'bg-green-50/50 border-green-100' : ''}
                      ${isInProgress ? 'bg-[#0A2540]/5 border-[#00C9B7] shadow-sm' : ''}
                      ${isPending ? 'bg-gray-50/50 border-gray-100' : ''}
                    `}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h4 className={`
                            font-bold transition-colors
                            ${isCompleted ? 'text-green-700' : ''}
                            ${isInProgress ? 'text-[#0A2540]' : ''}
                            ${isPending ? 'text-gray-400' : ''}
                          `}>
                            {milestone.milestone_label}
                          </h4>
                          {isInProgress && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#00C9B7] font-medium mt-1">
                              <span className="w-2 h-2 bg-[#00C9B7] rounded-full animate-pulse" />
                              En progreso
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          {milestone.planned_date && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Plan: {formatDate(milestone.planned_date)}</span>
                            </div>
                          )}
                          {milestone.actual_date && (
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatDate(milestone.actual_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {milestone.meta_data && Object.keys(milestone.meta_data).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(milestone.meta_data).map(([key, value]) => (
                              <span
                                key={key}
                                className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-100"
                              >
                                <span className="font-medium text-gray-500">{key}:</span> {String(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
