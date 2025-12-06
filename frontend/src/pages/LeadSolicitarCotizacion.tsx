import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function LeadSolicitarCotizacion() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    tipo_carga: 'aerea',
    origen_pais: '',
    origen_ciudad: '',
    destino_ciudad: 'Guayaquil',
    descripcion_mercancia: '',
    peso_kg: '',
    volumen_cbm: '',
    valor_mercancia_usd: '',
    incoterm: 'FOB',
    requiere_seguro: false,
    requiere_transporte_interno: false,
    notas_adicionales: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/api/sales/lead-cotizaciones/', formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/lead/mis-cotizaciones');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const paisesOrigen = [
    'China', 'Estados Unidos', 'Alemania', 'Japón', 'Corea del Sur',
    'Italia', 'Francia', 'España', 'México', 'Colombia', 'Perú', 'Chile', 'Brasil', 'Otro'
  ];

  const ciudadesEcuador = [
    'Guayaquil', 'Quito', 'Cuenca', 'Manta', 'Machala', 'Ambato',
    'Loja', 'Ibarra', 'Riobamba', 'Esmeraldas', 'Santo Domingo'
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 shadow-sm max-w-md text-center">
          <div className="w-20 h-20 bg-[#A4FF00] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0A2540] mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 mb-6">
            Tu cotización está siendo procesada. Recibirás una respuesta en minutos.
          </p>
          <p className="text-sm text-gray-400">Redirigiendo a tus cotizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0A2540] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/lead" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xl font-bold">ICS.APP</span>
          </Link>
          <Link to="/lead" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0A2540] mb-2">
            Solicitar Cotización de Importación
          </h1>
          <p className="text-gray-600">
            Completa los datos de tu carga y recibirás una cotización automática
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-3">
                Tipo de Carga *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'aerea', label: 'Aérea', icon: '✈️' },
                  { value: 'maritima', label: 'Marítima', icon: '🚢' },
                  { value: 'terrestre', label: 'Terrestre', icon: '🚛' },
                ].map((tipo) => (
                  <label
                    key={tipo.value}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.tipo_carga === tipo.value
                        ? 'border-[#00C9B7] bg-[#00C9B7]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo_carga"
                      value={tipo.value}
                      checked={formData.tipo_carga === tipo.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-2">{tipo.icon}</span>
                    <span className="font-medium text-[#0A2540]">{tipo.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0A2540] mb-2">
                  País de Origen *
                </label>
                <select
                  name="origen_pais"
                  value={formData.origen_pais}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                >
                  <option value="">Seleccionar país</option>
                  {paisesOrigen.map((pais) => (
                    <option key={pais} value={pais}>{pais}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0A2540] mb-2">
                  Ciudad de Origen
                </label>
                <input
                  type="text"
                  name="origen_ciudad"
                  value={formData.origen_ciudad}
                  onChange={handleChange}
                  placeholder="Ej: Shanghai, Los Angeles"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-2">
                Ciudad de Destino en Ecuador *
              </label>
              <select
                name="destino_ciudad"
                value={formData.destino_ciudad}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              >
                {ciudadesEcuador.map((ciudad) => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-2">
                Descripción de la Mercancía *
              </label>
              <textarea
                name="descripcion_mercancia"
                value={formData.descripcion_mercancia}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Describe el tipo de mercancía, materiales, uso, etc."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0A2540] mb-2">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  name="peso_kg"
                  value={formData.peso_kg}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0A2540] mb-2">
                  Volumen (m³)
                </label>
                <input
                  type="number"
                  name="volumen_cbm"
                  value={formData.volumen_cbm}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0A2540] mb-2">
                  Valor (USD) *
                </label>
                <input
                  type="number"
                  name="valor_mercancia_usd"
                  value={formData.valor_mercancia_usd}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-2">
                Incoterm *
              </label>
              <select
                name="incoterm"
                value={formData.incoterm}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              >
                <option value="EXW">EXW - Ex Works</option>
                <option value="FOB">FOB - Free On Board</option>
                <option value="CIF">CIF - Cost, Insurance & Freight</option>
                <option value="CFR">CFR - Cost & Freight</option>
                <option value="DDP">DDP - Delivered Duty Paid</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#00C9B7] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="requiere_seguro"
                  checked={formData.requiere_seguro}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-[#00C9B7] focus:ring-[#00C9B7]"
                />
                <div>
                  <span className="font-medium text-[#0A2540]">Requiero Seguro de Carga</span>
                  <p className="text-sm text-gray-500">Protege tu mercancía durante el transporte</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#00C9B7] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="requiere_transporte_interno"
                  checked={formData.requiere_transporte_interno}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-[#00C9B7] focus:ring-[#00C9B7]"
                />
                <div>
                  <span className="font-medium text-[#0A2540]">Requiero Transporte Interno</span>
                  <p className="text-sm text-gray-500">Entrega puerta a puerta en Ecuador</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-2">
                Notas Adicionales
              </label>
              <textarea
                name="notas_adicionales"
                value={formData.notas_adicionales}
                onChange={handleChange}
                rows={2}
                placeholder="Información adicional relevante para tu cotización"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Link
              to="/lead"
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-[#A4FF00] text-[#0A2540] rounded-xl font-bold hover:bg-[#A4FF00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enviando...' : 'Solicitar Cotización'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
