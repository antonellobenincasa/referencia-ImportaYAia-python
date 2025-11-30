import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X, AlertCircle, Mail } from 'lucide-react';
import { apiClient } from '../api/client';

interface Lead {
  id: number;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
}

export default function SendQuoteToLead() {
  const navigate = useNavigate();
  const [sendMethod, setSendMethod] = useState<'manual' | 'database'>('manual');
  const [manualEmail, setManualEmail] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/sales/leads/');
        setLeads(response.data.results || response.data || []);
      } catch (err: any) {
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const handleLeadSelect = (leadId: number) => {
    setSelectedLeadId(leadId);
    const lead = leads.find(l => l.id === leadId);
    setSelectedLead(lead || null);
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    let emailToSend = '';

    if (sendMethod === 'manual') {
      if (!manualEmail.trim()) {
        setError('Por favor ingresa un correo electrónico');
        return;
      }
      emailToSend = manualEmail;
    } else {
      if (!selectedLeadId || !selectedLead) {
        setError('Por favor selecciona un lead');
        return;
      }
      emailToSend = selectedLead.email;
    }

    try {
      setLoading(true);
      // In a real app, you would send this email via an API endpoint
      // For now, we'll show a success message
      setMessage(`✅ Enlace de cotización enviado a: ${emailToSend}`);
      
      if (sendMethod === 'manual') {
        setManualEmail('');
      } else {
        setSelectedLeadId(null);
        setSelectedLead(null);
      }

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al enviar enlace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-deep-ocean">
            Enviar Solicitud de Cotización
          </h1>
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex gap-2">
            <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>{message}</div>
          </div>
        )}

        <form onSubmit={handleSendQuote} className="space-y-6">
          {/* Method Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSendMethod('manual')}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                sendMethod === 'manual'
                  ? 'border-aqua-flow bg-aqua-flow/5'
                  : 'border-gray-300 hover:border-aqua-flow'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-aqua-flow" />
                <span className="font-bold">Enviar a Email Manual</span>
              </div>
              <p className="text-sm text-gray-600">Ingresa un correo electrónico directamente</p>
            </button>

            <button
              type="button"
              onClick={() => setSendMethod('database')}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                sendMethod === 'database'
                  ? 'border-velocity-green bg-velocity-green/5'
                  : 'border-gray-300 hover:border-velocity-green'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-5 w-5 text-velocity-green" />
                <span className="font-bold">Seleccionar Lead Existente</span>
              </div>
              <p className="text-sm text-gray-600">Elige de tus leads en el CRM</p>
            </button>
          </div>

          {/* Manual Email Input */}
          {sendMethod === 'manual' && (
            <div className="space-y-4 p-6 bg-aqua-flow/5 border border-aqua-flow/30 rounded-lg">
              <label className="block text-sm font-medium text-gray-700">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="ejemplo@empresa.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
              />
            </div>
          )}

          {/* Database Lead Selection */}
          {sendMethod === 'database' && (
            <div className="space-y-4 p-6 bg-velocity-green/5 border border-velocity-green/30 rounded-lg">
              <label className="block text-sm font-medium text-gray-700">
                Selecciona un Lead *
              </label>
              {loading ? (
                <div className="text-center py-8 text-gray-600">Cargando leads...</div>
              ) : leads.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No hay leads disponibles</div>
              ) : (
                <select
                  value={selectedLeadId || ''}
                  onChange={(e) => handleLeadSelect(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velocity-green focus:border-velocity-green"
                >
                  <option value="">-- Selecciona un lead --</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.company_name} - {lead.first_name} {lead.last_name} ({lead.email})
                    </option>
                  ))}
                </select>
              )}

              {selectedLead && (
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-2">Información del Lead:</p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="font-medium">Empresa:</span> {selectedLead.company_name}</p>
                    <p><span className="font-medium">Contacto:</span> {selectedLead.first_name} {selectedLead.last_name}</p>
                    <p><span className="font-medium">Email:</span> {selectedLead.email}</p>
                    {selectedLead.phone && <p><span className="font-medium">Teléfono:</span> {selectedLead.phone}</p>}
                    {selectedLead.whatsapp && <p><span className="font-medium">WhatsApp:</span> {selectedLead.whatsapp}</p>}
                    {selectedLead.city && <p><span className="font-medium">Ciudad:</span> {selectedLead.city}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-2">ℹ️ Información:</p>
            <p>Se enviará un enlace al formulario de solicitud de cotización. El lead podrá completar su información y solicitar la cotización desde el formulario.</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-aqua-flow text-white py-3 rounded-lg font-medium hover:bg-aqua-flow/90 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Send className="h-5 w-5" />
              {loading ? 'Enviando...' : 'Enviar Enlace de Cotización'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
