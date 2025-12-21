import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PortalNavbar from '../components/PortalNavbar';
import { Package, MapPin, Ship, Loader2, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

interface CargoItem {
  id: number;
  ro_number: string;
  company_name: string;
  pol: string;
  pod: string;
  transport_type: string;
  status: string;
  status_display: string;
  milestone_progress: {
    completed: number;
    total: number;
    current_milestone: string | null;
    current_milestone_label: string | null;
  };
  created_at: string;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  'ro_generated': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'sent_to_forwarder': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'confirmed': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'in_transit': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'delivered': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const transportIcons: Record<string, string> = {
  'AEREO': '✈️',
  'LCL': '📦',
  'FCL': '🚢',
};

export default function CargoTrackingList() {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetchCargos();
  }, []);

  const fetchCargos = async () => {
    try {
      const token = localStorage.getItem('ics_access_token');
      const response = await fetch('/api/sales/cargo-tracking/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al cargar embarques');

      const data = await response.json();
      const results = data.results || data || [];
      setCargos(results);

      if (results.length === 0) {
        setRedirecting(true);
        setTimeout(() => {
          navigate('/portal/instrucciones-embarque', {
            state: { message: 'Primero debes generar un Routing Order para rastrear tus embarques' }
          });
        }, 3000);
      }
    } catch (err) {
      setError('Error al cargar los embarques');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (progress: CargoItem['milestone_progress']) => {
    if (progress.total === 0) return 0;
    return Math.round((progress.completed / progress.total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 rounded-full mb-4">
            <Ship className="w-4 h-4 text-[#00C9B7]" />
            <span className="text-sm font-medium text-[#0A2540]">Cargo Tracking</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0A2540] mb-2">
            Seguimiento de Embarques
          </h1>
          <p className="text-gray-600">
            Rastrea tus embarques en tiempo real desde origen hasta destino final en Ecuador
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-[#00C9B7] animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Cargando embarques...</p>
          </div>
        ) : cargos.length === 0 || redirecting ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00C9B7]/20 to-[#A4FF00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {redirecting ? (
                <Loader2 className="w-10 h-10 text-[#00C9B7] animate-spin" />
              ) : (
                <Package className="w-10 h-10 text-[#00C9B7]" />
              )}
            </div>
            <h3 className="text-xl font-bold text-[#0A2540] mb-3">No tienes embarques activos</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Para rastrear tus embarques, primero debes generar un Routing Order (RO) desde las instrucciones de embarque.
            </p>
            {redirecting ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Redireccionando...</span>
              </div>
            ) : (
              <Link
                to="/portal/instrucciones-embarque"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00C9B7] text-white rounded-xl font-medium hover:bg-[#00a99d] transition-colors"
              >
                Ir a Instrucciones de Embarque
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {cargos.map((cargo) => {
              const colors = statusColors[cargo.status] || statusColors['ro_generated'];
              const progress = getProgressPercentage(cargo.milestone_progress);
              
              return (
                <Link
                  key={cargo.id}
                  to={`/portal/cargo-tracking/${cargo.id}`}
                  className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#00C9B7] transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{transportIcons[cargo.transport_type] || '📦'}</span>
                        <div>
                          <h3 className="text-lg font-bold text-[#0A2540] group-hover:text-[#00C9B7] transition-colors">
                            {cargo.ro_number}
                          </h3>
                          <p className="text-sm text-gray-500">{cargo.company_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 text-[#00C9B7]" />
                        <span className="text-sm font-medium">{cargo.pol}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{cargo.pod}</span>
                      </div>

                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {cargo.status === 'delivered' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {cargo.status_display}
                      </div>
                    </div>

                    <div className="md:w-64">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Progreso</span>
                        <span className="font-bold text-[#0A2540]">{progress}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {cargo.milestone_progress.current_milestone_label && (
                        <p className="text-xs text-gray-500 mt-2 truncate">
                          {cargo.milestone_progress.current_milestone_label}
                        </p>
                      )}
                    </div>

                    <div className="md:ml-4">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#00C9B7] transition-colors">
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
