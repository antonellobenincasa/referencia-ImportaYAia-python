import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { Lead, Opportunity, Quote } from '../types';
import { Users, Briefcase, FileText, TrendingUp, X } from 'lucide-react';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeadsFilter, setShowLeadsFilter] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const statuses = [
    { id: 'nuevo', label: 'Nuevo', color: 'bg-blue-100 text-blue-800', emoji: '🔵' },
    { id: 'prospecto', label: 'Prospecto', color: 'bg-yellow-100 text-yellow-800', emoji: '🟡' },
    { id: 'contacto_establecido', label: 'Contacto Establecido', color: 'bg-green-100 text-green-800', emoji: '🟢' },
    { id: 'proceso_cotizacion', label: 'Proceso Cotización', color: 'bg-purple-100 text-purple-800', emoji: '🟣' },
    { id: 'oferta_presentada', label: 'Oferta Presentada', color: 'bg-orange-100 text-orange-800', emoji: '🟠' },
    { id: 'negociacion', label: 'Negociación', color: 'bg-red-100 text-red-800', emoji: '🔴' },
    { id: 'cotizacion_aprobada', label: 'Cotización Aprobada', color: 'bg-emerald-100 text-emerald-800', emoji: '✅' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, oppsRes, quotesRes] = await Promise.all([
          apiClient.get('/api/sales/leads/'),
          apiClient.get('/api/sales/opportunities/'),
          apiClient.get('/api/sales/quotes/'),
        ]);
        setLeads(leadsRes.data.results || leadsRes.data || []);
        setOpportunities(oppsRes.data.results || oppsRes.data || []);
        setQuotes(quotesRes.data.results || quotesRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando datos...</div>
      </div>
    );
  }

  const filteredLeads = selectedStatus 
    ? leads.filter(lead => lead.status === selectedStatus)
    : leads;

  const getStatusColor = (status: string) => {
    const st = statuses.find(s => s.id === status);
    return st?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusEmoji = (status: string) => {
    const st = statuses.find(s => s.id === status);
    return st?.emoji || '•';
  };

  const stats = [
    {
      name: 'Total de Leads',
      value: selectedStatus ? filteredLeads.length : leads.length,
      icon: Users,
      color: 'bg-aqua-flow',
      clickable: true,
    },
    {
      name: 'Oportunidades',
      value: opportunities.length,
      icon: Briefcase,
      color: 'bg-velocity-green',
      clickable: false,
    },
    {
      name: 'Cotizaciones',
      value: quotes.length,
      icon: FileText,
      color: 'bg-deep-ocean',
      clickable: false,
    },
    {
      name: 'Tasa de Conversión',
      value: leads.length > 0 ? `${Math.round((opportunities.length / leads.length) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'bg-alert-orange',
      clickable: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter-heading text-deep-ocean">Panel de Control CRM</h1>
          <p className="text-sm text-gray-600 font-mono">Datos actualizados en tiempo real</p>
        </div>
        {selectedStatus && (
          <button
            onClick={() => setSelectedStatus(null)}
            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 font-medium"
          >
            Limpiar filtro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            onClick={() => stat.clickable && setShowLeadsFilter(true)}
            className={`bg-white rounded-lg shadow p-6 ${stat.clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className={`${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
              {stat.clickable && selectedStatus && (
                <div className="text-xs bg-aqua-flow text-white px-2 py-1 rounded-full">
                  Filtrado
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedStatus ? `Leads - ${statuses.find(s => s.id === selectedStatus)?.label}` : 'Últimos Leads'}
            </h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {filteredLeads.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay leads con este estado
              </div>
            ) : (
              filteredLeads.slice(0, selectedStatus ? 10 : 5).map((lead) => (
                <div key={lead.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {lead.company_name}
                      </p>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status || 'nuevo')}`}>
                      {getStatusEmoji(lead.status || 'nuevo')} {lead.status || 'nuevo'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cotizaciones Recientes</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {quotes.slice(0, 5).map((quote) => (
              <div key={quote.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{quote.quote_number}</p>
                    <p className="text-sm text-gray-500">USD {quote.final_price || quote.base_rate || '-'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    quote.status === 'borrador' ? 'bg-gray-100 text-gray-800' :
                    quote.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                    quote.status === 'aceptado' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quote.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showLeadsFilter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-deep-ocean">Filtrar Leads por Estado</h2>
              <button onClick={() => setShowLeadsFilter(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-2">
              {statuses.slice(1).map((status) => {
                const count = leads.filter(l => l.status === status.id).length;
                return (
                  <button
                    key={status.id}
                    onClick={() => {
                      setSelectedStatus(status.id);
                      setShowLeadsFilter(false);
                    }}
                    className={`w-full p-4 rounded-lg text-left font-medium transition-all ${
                      selectedStatus === status.id
                        ? `${status.color} border-2 border-current`
                        : `${status.color} hover:opacity-80`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{status.emoji} {status.label}</span>
                      <span className="text-sm opacity-75">({count})</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setSelectedStatus(null);
                setShowLeadsFilter(false);
              }}
              className="w-full mt-4 p-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Mostrar Todos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
