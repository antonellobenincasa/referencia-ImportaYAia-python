import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';

export default function CreateLead() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'importer_question' | 'lead_form'>('importer_question');
  const [rucError, setRucError] = useState('');
  
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    country: 'Ecuador',
    city: '',
    source: 'manual_entry',
    notes: '',
    is_active_importer: false,
    ruc: '',
  });

  const handleImporterChoice = (choice: boolean) => {
    setFormData(prev => ({ ...prev, is_active_importer: choice }));
    setStep('lead_form');
  };

  const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, ruc: value }));
    
    if (value.length > 0 && value.length !== 13) {
      setRucError(`El RUC debe contener exactamente 13 dígitos (actual: ${value.length})`);
    } else {
      setRucError('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.is_active_importer && formData.ruc.length !== 13) {
      setError('El RUC debe contener exactamente 13 dígitos numéricos');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post('/api/sales/leads/', formData);
      alert('✅ Lead creado exitosamente');
      
      if (!formData.is_active_importer) {
        alert('📧 Se ha enviado notificación al departamento de aduanas para ofrecer servicio de RUC');
      }
      
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        whatsapp: '',
        country: 'Ecuador',
        city: '',
        source: 'manual_entry',
        notes: '',
        is_active_importer: false,
        ruc: '',
      });
      setStep('importer_question');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el lead');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'importer_question') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cloud-white to-aqua-flow/5 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-2xl p-12">
            <h1 className="text-3xl font-extrabold text-deep-ocean mb-2">Crear Nuevo Lead</h1>
            <p className="text-gray-600 mb-8">Por favor, responda la siguiente pregunta para continuar</p>

            <div className="space-y-6">
              <div className="p-6 bg-blue-50 border-l-4 border-aqua-flow rounded-lg">
                <p className="text-lg font-semibold text-gray-900 mb-6">
                  ¿El lead es actualmente un IMPORTADOR?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleImporterChoice(true)}
                    className="p-6 bg-white border-2 border-gray-300 rounded-lg hover:border-aqua-flow hover:bg-aqua-flow/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-6 w-6 text-status-green" />
                      <span className="font-bold text-gray-900">Sí, es importador</span>
                    </div>
                    <p className="text-sm text-gray-600">Ingresaré su número de RUC</p>
                  </button>

                  <button
                    onClick={() => handleImporterChoice(false)}
                    className="p-6 bg-white border-2 border-gray-300 rounded-lg hover:border-velocity-green hover:bg-velocity-green/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-6 w-6 text-alert-orange" />
                      <span className="font-bold text-gray-900">No, no es importador</span>
                    </div>
                    <p className="text-sm text-gray-600">Ingresaré su información de contacto</p>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-deep-ocean">
            {formData.is_active_importer ? 'Ingrese RUC del Importador' : 'Información del Lead'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {formData.is_active_importer ? (
            // RUC Field for Active Importers
            <div className="p-6 bg-aqua-flow/10 border border-aqua-flow/30 rounded-lg">
              <label className="block text-lg font-bold text-deep-ocean mb-4">
                Número de RUC * (13 dígitos numéricos)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.ruc}
                onChange={handleRucChange}
                maxLength={13}
                placeholder="Ej: 1234567890123"
                className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-mono tracking-widest ${
                  rucError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-aqua-flow focus:border-aqua-flow'
                } focus:ring-2`}
              />
              {rucError && (
                <p className="mt-2 text-sm text-red-600 font-medium">{rucError}</p>
              )}
              <p className="mt-2 text-xs text-gray-600">Solo se aceptan números. Total de 13 dígitos.</p>
            </div>
          ) : (
            // Lead Information Fields for Non-Importers
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ej: Empresa Logística XYZ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Contacto *
                  </label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ej: Juan García"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="juan@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="+593 2 1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="+593 99 1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ecuador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Quito"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuente
                  </label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  >
                    <option value="manual_entry">Entrada Manual</option>
                    <option value="landing_page">Landing Page</option>
                    <option value="facebook">Facebook</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="referral">Referencia</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  placeholder="Información adicional sobre el lead..."
                />
              </div>

              <div className="p-4 bg-velocity-green/10 border border-velocity-green/30 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">📧 Nota:</span> Se enviará automáticamente una notificación al departamento de aduanas para ofrecerle servicio de registro de RUC ante la SENAE.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading || (formData.is_active_importer && formData.ruc.length !== 13)}
              className="flex-1 bg-aqua-flow text-white py-3 rounded-lg font-medium hover:bg-aqua-flow/90 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {loading ? 'Creando...' : 'Crear Lead'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('importer_question');
                setRucError('');
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400"
            >
              Atrás
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
