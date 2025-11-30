import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Lead, Opportunity, Quote } from '../types';
import { Users, Briefcase, FileText, TrendingUp, Plus } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, oppsRes, quotesRes] = await Promise.all([
          api.getLeads(),
          api.getOpportunities(),
          api.getQuotes(),
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

  const stats = [
    {
      name: 'Total de Leads',
      value: leads.length,
      icon: Users,
      color: 'bg-aqua-flow',
    },
    {
      name: 'Oportunidades',
      value: opportunities.length,
      icon: Briefcase,
      color: 'bg-velocity-green',
    },
    {
      name: 'Cotizaciones',
      value: quotes.length,
      icon: FileText,
      color: 'bg-deep-ocean',
    },
    {
      name: 'Tasa de Conversión',
      value: leads.length > 0 ? `${Math.round((opportunities.length / leads.length) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'bg-alert-orange',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter-heading text-deep-ocean mb-2">Panel de Control CRM</h1>
          <p className="text-sm text-data-gray font-mono tracking-ui">Datos actualizados en tiempo real</p>
        </div>
        <button
          onClick={() => navigate('/crear-lead')}
          className="bg-aqua-flow text-white px-6 py-3 rounded-lg font-medium hover:bg-aqua-flow/90 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Lead
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-md p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Últimos Leads</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{lead.full_name}</p>
                    <p className="text-sm text-gray-500">{lead.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium font-mono rounded-full ${
                    lead.status === 'nuevo' ? 'bg-aqua-flow-100 text-aqua-flow-800' :
                    lead.status === 'contactado' ? 'bg-alert-orange/20 text-alert-orange' :
                    'bg-status-green/20 text-status-green'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cotizaciones Recientes</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {quotes.slice(0, 5).map((quote) => (
              <div key={quote.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{quote.quote_number}</p>
                    <p className="text-sm text-gray-500">USD {quote.total_amount}</p>
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
    </div>
  );
}
