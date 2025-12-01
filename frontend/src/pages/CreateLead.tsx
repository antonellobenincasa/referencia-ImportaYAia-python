import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, AlertCircle, CheckCircle, ArrowRight, User, Building2 } from 'lucide-react';
import { apiClient } from '../api/client';

export default function CreateLead() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setDuplicateWarning] = useState('');
  const [step, setStep] = useState<'importer_question' | 'ruc_input' | 'legal_type' | 'lead_form'>('importer_question');
  const [rucError, setRucError] = useState('');
  const [ruc, setRuc] = useState('');
  
  const ecuadorCities = [
    'Guayaquil',
    'Quito',
    'Santo Domingo',
    'Cuenca',
    'Ambato',
    'Portoviejo',
    'Machala',
    'Riobamba',
    'Manta',
    'Durán',
    'Loja',
    'Esmeraldas',
    'Quevedo',
    'Milagro',
    'Ibarra',
    'Latacunga',
    'La Libertad',
    'Babahoyo',
    'Tulcán',
    'Huaquillas',
    'Nueva Loja',
    'Santa Rosa',
    'Guaranda'
  ];

  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    country: 'Ecuador',
    city: '',
    source: 'manual_entry',
    notes: '',
    is_active_importer: false,
    ruc: '',
    legal_type: 'juridica',
  });

  const handleImporterChoice = (choice: boolean) => {
    if (choice) {
      setStep('ruc_input');
      setFormData(prev => ({ ...prev, is_active_importer: true }));
    } else {
      setStep('legal_type');
      setFormData(prev => ({ ...prev, is_active_importer: false }));
    }
  };

  const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setRuc(value);
    
    if (value.length > 0 && value.length !== 13) {
      setRucError(`El RUC debe contener exactamente 13 dígitos (actual: ${value.length})`);
    } else {
      setRucError('');
    }
  };

  const handleProceedWithRuc = () => {
    if (ruc.length !== 13) {
      setRucError('El RUC debe contener exactamente 13 dígitos numéricos');
      return;
    }
    setFormData(prev => ({ ...prev, ruc: ruc }));
    setStep('legal_type');
  };

  const handleLegalTypeChoice = (type: 'natural' | 'juridica') => {
    setFormData(prev => ({ ...prev, legal_type: type }));
    setStep('lead_form');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const checkForDuplicates = async () => {
    try {
      const response = await apiClient.get('/api/sales/leads/');
      const existingLeads = response.data.results || [];
      
      const duplicate = existingLeads.find(
        (lead: any) =>
          lead.company_name?.toLowerCase() === formData.company_name.toLowerCase() &&
          lead.ruc === formData.ruc && formData.ruc
      );
      
      if (duplicate) {
        setDuplicateWarning(`⚠️ DUPLICADO DETECTADO: Ya existe un Lead "${duplicate.company_name}" con RUC "${duplicate.ruc}" (${duplicate.lead_number})`);
        return false;
      }
      
      setDuplicateWarning('');
      return true;
    } catch (err) {
      console.error('Error verificando duplicados:', err);
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDuplicateWarning('');

    // Validar que al menos telefono o whatsapp estén llenos
    if (!formData.phone && !formData.whatsapp) {
      setError('Por favor ingresa al menos un teléfono o número de WhatsApp');
      setLoading(false);
      return;
    }

    // Verificar duplicados ANTES de crear
    const isNotDuplicate = await checkForDuplicates();
    if (!isNotDuplicate) {
      setLoading(false);
      return;
    }

    try {
      await apiClient.post('/api/sales/leads/', formData);
      alert('✅ Lead creado exitosamente con número único asignado');
      
      if (!formData.is_active_importer) {
        alert('📧 Se ha enviado notificación al departamento de aduanas para ofrecer servicio de RUC');
      }
      
      setFormData({
        company_name: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        whatsapp: '',
        country: 'Ecuador',
        city: '',
        source: 'manual_entry',
        notes: '',
        is_active_importer: false,
        ruc: '',
        legal_type: 'juridica',
      });
      setRuc('');
      setStep('importer_question');
      navigate('/');
    } catch (err: any) {
      const duplicateError = err.response?.data?.duplicate;
      if (duplicateError) {
        setDuplicateWarning(duplicateError);
      } else {
        setError(err.response?.data?.detail || 'Error al crear el lead');
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Importer Question
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

              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: RUC Input (only for importers)
  if (step === 'ruc_input') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-extrabold text-deep-ocean">Ingrese RUC del Importador</h1>
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

          <form onSubmit={(e) => { e.preventDefault(); handleProceedWithRuc(); }} className="space-y-6">
            <div className="p-6 bg-aqua-flow/10 border border-aqua-flow/30 rounded-lg">
              <label className="block text-lg font-bold text-deep-ocean mb-4">
                Número de RUC * (13 dígitos numéricos)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={ruc}
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

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={ruc.length !== 13}
                className="flex-1 bg-aqua-flow text-white py-3 rounded-lg font-medium hover:bg-aqua-flow/90 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-5 w-5" />
                Continuar
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('importer_question');
                  setRuc('');
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

  // STEP 3: Legal Type Selection
  if (step === 'legal_type') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cloud-white to-aqua-flow/5 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-2xl p-12">
            <h1 className="text-3xl font-extrabold text-deep-ocean mb-2">Tipo de Lead</h1>
            <p className="text-gray-600 mb-8">¿Es Persona Natural o Persona Jurídica?</p>

            <div className="space-y-6">
              <div className="p-6 bg-blue-50 border-l-4 border-aqua-flow rounded-lg">
                <p className="text-lg font-semibold text-gray-900 mb-6">
                  Seleccione el tipo de lead
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleLegalTypeChoice('natural')}
                    className="p-6 bg-white border-2 border-gray-300 rounded-lg hover:border-aqua-flow hover:bg-aqua-flow/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-6 w-6 text-aqua-flow" />
                      <span className="font-bold text-gray-900">Persona Natural</span>
                    </div>
                    <p className="text-sm text-gray-600">Nombres y Apellidos</p>
                  </button>

                  <button
                    onClick={() => handleLegalTypeChoice('juridica')}
                    className="p-6 bg-white border-2 border-gray-300 rounded-lg hover:border-velocity-green hover:bg-velocity-green/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-6 w-6 text-velocity-green" />
                      <span className="font-bold text-gray-900">Persona Jurídica</span>
                    </div>
                    <p className="text-sm text-gray-600">Razón Social de Empresa</p>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (formData.is_active_importer) {
                    setStep('ruc_input');
                  } else {
                    setStep('importer_question');
                  }
                }}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400"
              >
                Atrás
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: Lead Information Form
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-deep-ocean">
            Información del Lead
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.legal_type === 'natural' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ej: Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ej: García López"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de Empresa
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required={formData.is_active_importer}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ej: Mi Empresa"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ej: Empresa Logística XYZ S.A."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ej: Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ej: García López"
                  />
                </div>
              </>
            )}

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
                Teléfono {!formData.phone && formData.whatsapp ? '' : '(O WhatsApp)'}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-aqua-flow ${
                  !formData.phone && !formData.whatsapp ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-aqua-flow'
                }`}
                placeholder="+593 2 1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp {!formData.whatsapp && formData.phone ? '' : '(O Teléfono)'}
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-aqua-flow ${
                  !formData.phone && !formData.whatsapp ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-aqua-flow'
                }`}
                placeholder="+593 99 1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
                Ecuador
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad *
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
              >
                <option value="">Selecciona una ciudad...</option>
                {ecuadorCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
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

          {formData.is_active_importer && (
            <div className="p-4 bg-aqua-flow/10 border border-aqua-flow/30 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">📋 RUC Ingresado:</span> {formData.ruc}
              </p>
            </div>
          )}

          {!formData.is_active_importer && (
            <div className="p-4 bg-velocity-green/10 border border-velocity-green/30 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">📧 Nota:</span> Se enviará automáticamente una notificación al departamento de aduanas para ofrecerle servicio de registro de RUC ante la SENAE.
              </p>
            </div>
          )}

          {!formData.phone && !formData.whatsapp && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                <span className="font-semibold">⚠️ Requerido:</span> Debes ingresar al menos un teléfono o número de WhatsApp para continuar.
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading || (!formData.phone && !formData.whatsapp)}
              className="flex-1 bg-aqua-flow text-white py-3 rounded-lg font-medium hover:bg-aqua-flow/90 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {loading ? 'Creando...' : 'Crear Lead'}
            </button>
            <button
              type="button"
              onClick={() => setStep('legal_type')}
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
