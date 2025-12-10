import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

interface Shipment {
  id: number;
  ro_number: string;
  origin: string;
  destination: string;
  status: string;
  transport_type: string;
  eta: string;
  created_at: string;
}

export default function LeadTracking() {
  const { user, logout } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await apiClient.get('/api/sales/quote-submissions/');
      const submissions = response.data.results || response.data || [];
      const inTransit = submissions.filter((s: any) => 
        s.status === 'ro_generado' || s.status === 'en_transito' || s.status === 'completada'
      ).map((s: any) => ({
        id: s.id,
        ro_number: s.ro_number || `RO-${s.id}`,
        origin: s.origin || '',
        destination: s.city || s.destination || '',
        status: s.status,
        transport_type: s.transport_type || 'FCL',
        eta: s.fecha_embarque_estimada || '',
        created_at: s.created_at,
      }));
      setShipments(inTransit);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
      'ro_generado': { label: 'RO Generado', color: 'bg-purple-100 text-purple-800', icon: '📋' },
      'en_transito': { label: 'En Tránsito', color: 'bg-blue-100 text-blue-800', icon: '🚢' },
      'completada': { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: '✅' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: '📦' };
  };

  const filteredShipments = shipments.filter(s => 
    s.ro_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0A2540] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
              <span className="text-[#0A2540] font-black text-sm">IA</span>
            </div>
            <span className="text-lg font-bold">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-300">
              Hola, <span className="text-white font-medium">{user?.first_name || 'Usuario'}</span>
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/portal" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540]">
              Tracking de Embarques
            </h1>
            <p className="text-gray-600">
              Sigue el estado de tus importaciones en tiempo real
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por número RO, origen o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00C9B7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando embarques...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0A2540] mb-2">No tienes embarques activos</h3>
            <p className="text-gray-600 mb-6">Cuando apruebes una cotización y envíes la instrucción de embarque, podrás hacer seguimiento aquí</p>
            <Link
              to="/portal/cotizar"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00C9B7] text-white rounded-xl font-medium hover:bg-[#00C9B7]/90 transition-colors"
            >
              Solicitar Cotización
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShipments.map((shipment) => {
              const statusInfo = getStatusInfo(shipment.status);
              return (
                <div
                  key={shipment.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[#00C9B7] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-[#0A2540] rounded-xl flex items-center justify-center text-2xl">
                        {statusInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-[#0A2540]">
                            {shipment.ro_number}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">{shipment.origin}</span>
                          <svg className="w-4 h-4 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span className="font-medium">{shipment.destination}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Tipo: {shipment.transport_type}</p>
                      {shipment.eta && (
                        <p className="text-sm text-[#00C9B7] font-medium">
                          ETA: {new Date(shipment.eta).toLocaleDateString('es-EC')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <div className={`w-3 h-3 rounded-full ${shipment.status === 'ro_generado' || shipment.status === 'en_transito' || shipment.status === 'completada' ? 'bg-[#00C9B7]' : 'bg-gray-200'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${shipment.status === 'en_transito' || shipment.status === 'completada' ? 'bg-[#00C9B7]' : 'bg-gray-200'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${shipment.status === 'completada' ? 'bg-[#00C9B7]' : 'bg-gray-200'}`}></div>
                      </div>
                      <button className="text-sm text-[#00C9B7] font-medium hover:underline">
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
