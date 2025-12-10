import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api/xm7k9p2v4q8n';

interface DashboardData {
  kpis: {
    total_leads: number;
    total_cotizaciones: number;
    cotizaciones_aprobadas: number;
    cotizaciones_rechazadas: number;
    cotizaciones_pendientes: number;
    ros_activos: number;
    embarques_activos: number;
    valor_total_cotizado_usd: number;
    tributos_totales_usd: number;
  };
  distribucion: {
    cotizaciones_por_estado: Array<{ estado: string; count: number }>;
    embarques_por_estado: Array<{ current_status: string; count: number }>;
  };
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  lead_email: string;
  origen: string;
  destino: string;
  total_usd: number;
  estado: string;
  ro_number: string | null;
}

interface ProfitData {
  resumen: {
    total_ros: number;
    ingresos_totales_usd: number;
    costos_totales_usd: number;
    margen_total_usd: number;
    margen_promedio_porcentaje: number;
  };
  ros: Array<{
    ro_number: string;
    cliente_email: string;
    total_facturado_usd: number;
    margen_usd: number;
    margen_porcentaje: number;
  }>;
}

interface LogEntry {
  source: string;
  message: string;
  level: string;
}

type ActiveTab = 'dashboard' | 'users' | 'cotizaciones' | 'rates' | 'profit' | 'logs';

export default function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('masterAdminToken');

  const fetchWithAuth = useCallback(async (endpoint: string) => {
    const token = getToken();
    if (!token) {
      navigate('/xm7k9p2v4q8n');
      throw new Error('No token');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'X-Master-Admin-Token': token },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('masterAdminToken');
      navigate('/xm7k9p2v4q8n');
      throw new Error('Unauthorized');
    }

    return response.json();
  }, [navigate]);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/dashboard/');
      setDashboard(data);
    } catch {
      setError('Error cargando dashboard');
    }
  }, [fetchWithAuth]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/users/');
      setUsers(data.users || []);
    } catch {
      setError('Error cargando usuarios');
    }
  }, [fetchWithAuth]);

  const loadCotizaciones = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/cotizaciones/');
      setCotizaciones(data.cotizaciones || []);
    } catch {
      setError('Error cargando cotizaciones');
    }
  }, [fetchWithAuth]);

  const loadProfit = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/profit-review/');
      setProfit(data);
    } catch {
      setError('Error cargando profit review');
    }
  }, [fetchWithAuth]);

  const loadLogs = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/logs/');
      setLogs(data.logs || []);
    } catch {
      setError('Error cargando logs');
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadDashboard();
      setLoading(false);
    };
    loadData();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'cotizaciones') loadCotizaciones();
    if (activeTab === 'profit') loadProfit();
    if (activeTab === 'logs') loadLogs();
  }, [activeTab, loadUsers, loadCotizaciones, loadProfit, loadLogs]);

  const handleLogout = () => {
    localStorage.removeItem('masterAdminToken');
    navigate('/xm7k9p2v4q8n');
  };

  const exportProfitCSV = async () => {
    try {
      const data = await fetchWithAuth('/export/?type=profit&format=csv');
      if (data.data) {
        const blob = new Blob([data.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || 'profit_report.csv';
        a.click();
      }
    } catch {
      setError('Error exportando datos');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A2540] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Usuarios', icon: '👥' },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: '📋' },
    { id: 'rates', label: 'Tarifas', icon: '💰' },
    { id: 'profit', label: 'Profit Review', icon: '📈' },
    { id: 'logs', label: 'Logs', icon: '🔧' },
  ];

  return (
    <div className="min-h-screen bg-[#0A2540]">
      <header className="bg-[#0D2E4D] border-b border-[#1E4A6D] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MA</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MASTER ADMIN</h1>
              <p className="text-gray-400 text-sm">Panel de Control Total</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 bg-[#0D2E4D] min-h-[calc(100vh-72px)] border-r border-[#1E4A6D] p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                      : 'text-gray-400 hover:bg-[#1E4A6D]/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-6">
          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {activeTab === 'dashboard' && dashboard && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">KPIs del Sistema</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Total LEADs</p>
                  <p className="text-3xl font-bold text-white">{dashboard.kpis.total_leads}</p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Cotizaciones Totales</p>
                  <p className="text-3xl font-bold text-white">{dashboard.kpis.total_cotizaciones}</p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">ROs Activos</p>
                  <p className="text-3xl font-bold text-[#00C9B7]">{dashboard.kpis.ros_activos}</p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Embarques Activos</p>
                  <p className="text-3xl font-bold text-[#A4FF00]">{dashboard.kpis.embarques_activos}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Valor Total Cotizado</p>
                  <p className="text-2xl font-bold text-white">
                    ${dashboard.kpis.valor_total_cotizado_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Tributos Totales Recaudados</p>
                  <p className="text-2xl font-bold text-white">
                    ${dashboard.kpis.tributos_totales_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-900/30 rounded-xl p-6 border border-green-600/30">
                  <p className="text-green-400 text-sm">Aprobadas</p>
                  <p className="text-3xl font-bold text-green-400">{dashboard.kpis.cotizaciones_aprobadas}</p>
                </div>
                <div className="bg-yellow-900/30 rounded-xl p-6 border border-yellow-600/30">
                  <p className="text-yellow-400 text-sm">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-400">{dashboard.kpis.cotizaciones_pendientes}</p>
                </div>
                <div className="bg-red-900/30 rounded-xl p-6 border border-red-600/30">
                  <p className="text-red-400 text-sm">Rechazadas</p>
                  <p className="text-3xl font-bold text-red-400">{dashboard.kpis.cotizaciones_rechazadas}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">ID</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Email</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Nombre</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Rol</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Estado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-[#1E4A6D]">
                        <td className="px-4 py-3 text-white">{user.id}</td>
                        <td className="px-4 py-3 text-white">{user.email}</td>
                        <td className="px-4 py-3 text-white">{user.first_name} {user.last_name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-[#00C9B7]/20 text-[#00C9B7] rounded text-sm">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            user.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                          }`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(user.date_joined).toLocaleDateString('es-EC')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cotizaciones' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Todas las Cotizaciones</h2>
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Número</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Cliente</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Origen</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Destino</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Total USD</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Estado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">RO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cotizaciones.map((cot) => (
                      <tr key={cot.id} className="border-t border-[#1E4A6D]">
                        <td className="px-4 py-3 text-white font-mono">{cot.numero_cotizacion}</td>
                        <td className="px-4 py-3 text-white">{cot.lead_email}</td>
                        <td className="px-4 py-3 text-gray-400">{cot.origen}</td>
                        <td className="px-4 py-3 text-gray-400">{cot.destino}</td>
                        <td className="px-4 py-3 text-[#A4FF00] font-semibold">
                          ${cot.total_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            cot.estado === 'aprobada' ? 'bg-green-600/20 text-green-400' :
                            cot.estado === 'pendiente' ? 'bg-yellow-600/20 text-yellow-400' :
                            cot.estado === 'en_transito' ? 'bg-blue-600/20 text-blue-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {cot.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#00C9B7] font-mono">{cot.ro_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rates' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Base de Datos de Tarifas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <h3 className="text-lg font-semibold text-white mb-2">Tarifas de Flete</h3>
                  <p className="text-gray-400">Tarifas de transporte internacional por ruta</p>
                  <button className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors">
                    Ver Tarifas
                  </button>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <h3 className="text-lg font-semibold text-white mb-2">Tarifas de Seguro</h3>
                  <p className="text-gray-400">Primas y coberturas de seguro de carga</p>
                  <button className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors">
                    Ver Tarifas
                  </button>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <h3 className="text-lg font-semibold text-white mb-2">Aranceles SENAE</h3>
                  <p className="text-gray-400">Tasas aduaneras por código HS</p>
                  <button className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors">
                    Ver Tarifas
                  </button>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <h3 className="text-lg font-semibold text-white mb-2">Transporte Interno</h3>
                  <p className="text-gray-400">Tarifas de distribución nacional</p>
                  <button className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors">
                    Ver Tarifas
                  </button>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <h3 className="text-lg font-semibold text-white mb-2">Agenciamiento Aduanero</h3>
                  <p className="text-gray-400">Tarifas de despacho aduanero</p>
                  <button className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors">
                    Ver Tarifas
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profit' && profit && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Profit Review - Facturación FF</h2>
                <button
                  onClick={exportProfitCSV}
                  className="px-4 py-2 bg-[#A4FF00]/20 text-[#A4FF00] rounded-lg hover:bg-[#A4FF00]/30 transition-colors flex items-center gap-2"
                >
                  <span>📥</span> Exportar CSV
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Total ROs</p>
                  <p className="text-3xl font-bold text-white">{profit.resumen.total_ros}</p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-[#00C9B7]">
                    ${profit.resumen.ingresos_totales_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Margen Total</p>
                  <p className="text-2xl font-bold text-[#A4FF00]">
                    ${profit.resumen.margen_total_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Margen Promedio</p>
                  <p className="text-2xl font-bold text-white">{profit.resumen.margen_promedio_porcentaje}%</p>
                </div>
              </div>

              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">RO</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Cliente</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Total Facturado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Margen USD</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Margen %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profit.ros.map((ro, idx) => (
                      <tr key={idx} className="border-t border-[#1E4A6D]">
                        <td className="px-4 py-3 text-[#00C9B7] font-mono">{ro.ro_number}</td>
                        <td className="px-4 py-3 text-white">{ro.cliente_email}</td>
                        <td className="px-4 py-3 text-white">
                          ${ro.total_facturado_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-[#A4FF00] font-semibold">
                          ${ro.margen_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            ro.margen_porcentaje >= 20 ? 'bg-green-600/20 text-green-400' :
                            ro.margen_porcentaje >= 10 ? 'bg-yellow-600/20 text-yellow-400' :
                            'bg-red-600/20 text-red-400'
                          }`}>
                            {ro.margen_porcentaje}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Logs del Sistema</h2>
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4 max-h-[600px] overflow-auto">
                <div className="font-mono text-sm space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-gray-400">No hay logs disponibles</p>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className={`px-2 py-1 rounded ${
                        log.level === 'ERROR' ? 'bg-red-900/30 text-red-300' :
                        log.level === 'WARNING' ? 'bg-yellow-900/30 text-yellow-300' :
                        'text-gray-300'
                      }`}>
                        <span className="text-gray-500">[{log.source}]</span> {log.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
