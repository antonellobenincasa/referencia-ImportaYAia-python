import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Lead, Opportunity, Quote } from '../types';
import { Users, Briefcase, FileText, TrendingUp } from 'lucide-react';

export default function Dashboard() {
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
        setLeads(leadsRes.data);
        setOpportunities(oppsRes.data);
        setQuotes(quotesRes.data);
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
      color: 'bg-blue-500',
    },
    {
      name: 'Oportunidades',
      value: opportunities.length,
      icon: Briefcase,
      color: 'bg-green-500',
    },
    {
      name: 'Cotizaciones',
      value: quotes.length,
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      name: 'Tasa de Conversión',
      value: leads.length > 0 ? `${Math.round((opportunities.length / leads.length) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard CRM</h1>

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
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lead.status === 'nuevo' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'contactado' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
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
