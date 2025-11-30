import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { FileText, Eye, Filter, X } from 'lucide-react';

interface Quote {
  id: number;
  quote_number: string;
  opportunity: {
    id: number;
    opportunity_name: string;
    lead: {
      id: number;
      company_name: string;
      email: string;
      status: string;
    };
  };
  cargo_type: string;
  origin: string;
  destination: string;
  base_rate: number;
  final_price: number;
  status: string;
  sent_at: string;
  created_at: string;
}

const LEAD_STATUS_FILTERS = [
  { id: 'oferta_presentada', label: 'Oferta Presentada', color: 'bg-orange-100 text-orange-800', emoji: '🟠' },
  { id: 'negociacion', label: 'Negociación', color: 'bg-red-100 text-red-800', emoji: '🔴' },
  { id: 'cotizacion_aprobada', label: 'Cotización Aprobada', color: 'bg-emerald-100 text-emerald-800', emoji: '✅' },
];

export default function Quotations() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<Quote | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await apiClient.get('/api/sales/quotes/');
        const allQuotes = response.data.results || response.data || [];
        // Filter only quotes where lead status is in the target statuses
        const filtered = allQuotes.filter((q: any) => {
          const leadStatus = q.opportunity?.lead?.status;
          return ['oferta_presentada', 'negociacion', 'cotizacion_aprobada'].includes(leadStatus);
        });
        setQuotes(filtered);
      } catch (error) {
        console.error('Error fetching quotes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  const filteredQuotes = selectedStatus
    ? quotes.filter(q => q.opportunity?.lead?.status === selectedStatus)
    : quotes;

  const getStatusColor = (status: string) => {
    const st = LEAD_STATUS_FILTERS.find(s => s.id === status);
    return st?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusEmoji = (status: string) => {
    const st = LEAD_STATUS_FILTERS.find(s => s.id === status);
    return st?.emoji || '•';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando cotizaciones...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter-heading text-deep-ocean">Cotizaciones</h1>
          <p className="text-sm text-gray-600 font-mono">Gestiona cotizaciones enviadas a leads</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-aqua-flow text-white rounded-lg hover:bg-aqua-flow-700 font-medium"
          >
            <Filter className="h-4 w-4" />
            Filtrar por Estado
          </button>
          {selectedStatus && (
            <button
              onClick={() => setSelectedStatus(null)}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 font-medium"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {LEAD_STATUS_FILTERS.map((filter) => {
          const count = quotes.filter(q => q.opportunity?.lead?.status === filter.id).length;
          return (
            <div key={filter.id} className={`${filter.color} rounded-lg p-4 text-center cursor-pointer hover:shadow-lg transition-shadow`} onClick={() => { setSelectedStatus(filter.id); setFilterOpen(false); }}>
              <div className="text-2xl mb-2">{filter.emoji}</div>
              <p className="font-semibold">{filter.label}</p>
              <p className="text-lg font-bold mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Listado de Cotizaciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {selectedStatus ? 'No hay cotizaciones con este estado' : 'No hay cotizaciones disponibles'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nro. Cotización</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ruta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Monto USD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{quote.quote_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{quote.opportunity.lead.company_name}</p>
                        <p className="text-sm text-gray-500">{quote.opportunity.lead.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {quote.origin} → {quote.destination}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      USD {parseFloat(quote.final_price?.toString() || quote.base_rate?.toString() || '0').toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.opportunity.lead.status)}`}>
                        {getStatusEmoji(quote.opportunity.lead.status)} {quote.opportunity.lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(quote.created_at).toLocaleDateString('es-EC')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setShowPreview(quote)}
                        className="inline-flex items-center gap-1 text-aqua-flow hover:text-aqua-flow-700 font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Previa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-deep-ocean">Filtrar por Estado</h2>
              <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3">
              {LEAD_STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setSelectedStatus(filter.id);
                    setFilterOpen(false);
                  }}
                  className={`w-full p-4 rounded-lg text-left font-medium transition-all ${filter.color} hover:opacity-80`}
                >
                  <div className="flex items-center justify-between">
                    <span>{filter.emoji} {filter.label}</span>
                    <span className="text-sm opacity-75">({quotes.filter(q => q.opportunity?.lead?.status === filter.id).length})</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-deep-ocean">Vista Previa de Cotización</h2>
              <button onClick={() => setShowPreview(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Número de Cotización</label>
                <p className="text-lg font-bold text-gray-900">{showPreview.quote_number}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Estado</label>
                <p className="text-lg font-bold text-gray-900 capitalize">{showPreview.status}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Empresa</label>
                <p className="text-lg font-bold text-gray-900">{showPreview.opportunity.lead.company_name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <p className="text-lg font-bold text-gray-900">{showPreview.opportunity.lead.email}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Origen</label>
                  <p className="text-gray-900 font-medium">{showPreview.origin}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Destino</label>
                  <p className="text-gray-900 font-medium">{showPreview.destination}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tipo de Carga</label>
                  <p className="text-gray-900 font-medium">{showPreview.cargo_type}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tarifa Base</label>
                  <p className="text-gray-900 font-medium">USD {parseFloat(showPreview.base_rate?.toString() || '0').toFixed(2)}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 uppercase">PRECIO FINAL</label>
                  <p className="text-2xl font-bold text-aqua-flow">USD {parseFloat(showPreview.final_price?.toString() || showPreview.base_rate?.toString() || '0').toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-6">
              Creada: {new Date(showPreview.created_at).toLocaleDateString('es-EC')} {new Date(showPreview.created_at).toLocaleTimeString('es-EC')}
              {showPreview.sent_at && (
                <><br />Enviada: {new Date(showPreview.sent_at).toLocaleDateString('es-EC')} {new Date(showPreview.sent_at).toLocaleTimeString('es-EC')}</>
              )}
            </div>

            <button
              onClick={() => setShowPreview(null)}
              className="w-full bg-aqua-flow text-white py-2 rounded-lg hover:bg-aqua-flow-700 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
