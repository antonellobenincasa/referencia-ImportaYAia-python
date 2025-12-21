import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PortalNavbar from '../components/PortalNavbar';
import { Package, MapPin, Ship, Loader2, ArrowRight, Clock, CheckCircle2, List, LayoutGrid, Rows3 } from 'lucide-react';

type ViewMode = 'cards' | 'list' | 'details';

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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('cargo_tracking_view_mode');
    return (saved as ViewMode) || 'cards';
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('cargo_tracking_view_mode', mode);
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
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

            {cargos.length > 0 && (
              <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                <button
                  onClick={() => handleViewModeChange('cards')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-[#00C9B7] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Vista Tarjetas"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Tarjetas</span>
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-[#00C9B7] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Vista Lista"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Lista</span>
                </button>
                <button
                  onClick={() => handleViewModeChange('details')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'details'
                      ? 'bg-[#00C9B7] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Vista Detalles"
                >
                  <Rows3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Detalles</span>
                </button>
              </div>
            )}
          </div>
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
          <>
            {viewMode === 'cards' && (
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

            {viewMode === 'list' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RO</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ruta</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Progreso</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cargos.map((cargo) => {
                        const colors = statusColors[cargo.status] || statusColors['ro_generated'];
                        const progress = getProgressPercentage(cargo.milestone_progress);
                        
                        return (
                          <tr key={cargo.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <Link to={`/portal/cargo-tracking/${cargo.id}`} className="font-bold text-[#0A2540] hover:text-[#00C9B7]">
                                {cargo.ro_number}
                              </Link>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">{cargo.company_name}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <span>{cargo.pol}</span>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                <span>{cargo.pod}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-lg">{transportIcons[cargo.transport_type] || '📦'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {cargo.status_display}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-600">{progress}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <Link
                                to={`/portal/cargo-tracking/${cargo.id}`}
                                className="text-[#00C9B7] hover:text-[#00a99d] text-sm font-medium"
                              >
                                Ver detalles
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'details' && (
              <div className="grid gap-6 md:grid-cols-2">
                {cargos.map((cargo) => {
                  const colors = statusColors[cargo.status] || statusColors['ro_generated'];
                  const progress = getProgressPercentage(cargo.milestone_progress);
                  
                  return (
                    <Link
                      key={cargo.id}
                      to={`/portal/cargo-tracking/${cargo.id}`}
                      className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#00C9B7] transition-all group"
                    >
                      <div className="bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{transportIcons[cargo.transport_type] || '📦'}</span>
                            <div>
                              <h3 className="text-lg font-bold text-white">{cargo.ro_number}</h3>
                              <p className="text-sm text-gray-300">{cargo.company_name}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {cargo.status_display}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="text-center flex-1">
                            <p className="text-xs text-gray-500 mb-1">Origen</p>
                            <p className="font-semibold text-[#0A2540] text-sm">{cargo.pol}</p>
                          </div>
                          <div className="px-4">
                            <div className="w-16 h-0.5 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] relative">
                              <ArrowRight className="w-4 h-4 text-[#00C9B7] absolute -right-2 -top-2" />
                            </div>
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-xs text-gray-500 mb-1">Destino</p>
                            <p className="font-semibold text-[#0A2540] text-sm">{cargo.pod}</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-500">Progreso del envio</span>
                            <span className="font-bold text-[#0A2540]">{progress}%</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          {cargo.milestone_progress.current_milestone_label && (
                            <p className="text-xs text-gray-500 mt-2">
                              Estado actual: <span className="font-medium text-[#0A2540]">{cargo.milestone_progress.current_milestone_label}</span>
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {new Date(cargo.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[#00C9B7] text-sm font-medium group-hover:underline">
                            Ver timeline completo →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
