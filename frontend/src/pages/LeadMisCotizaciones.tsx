import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  tipo_carga: string;
  origen_pais: string;
  destino_ciudad: string;
  descripcion_mercancia: string;
  peso_kg: number;
  valor_mercancia_usd: number;
  total_usd: number;
  estado: string;
  fecha_creacion: string;
  ro_number?: string;
  // Fields from QuoteSubmission model
  submission_number?: string;
  transport_type?: string;
  origin?: string;
  destination?: string;
  city?: string;
  cargo_description?: string;
  weight_kg?: number;
  cargo_value_usd?: number;
  final_price?: number;
  status?: string;
  created_at?: string;
}

export default function LeadMisCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEmbarqueModal, setShowEmbarqueModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    try {
      // Fetch from quote-submissions where LEAD quote requests are stored
      const response = await apiClient.get('/api/sales/quote-submissions/');
      const submissions = response.data.results || response.data || [];
      
      // Map QuoteSubmission fields to the interface expected by this component
      const mapped = submissions.map((s: any) => ({
        id: s.id,
        numero_cotizacion: s.submission_number || `QS-${s.id}`,
        tipo_carga: s.transport_type || 'maritima',
        origen_pais: s.origin || '',
        destino_ciudad: s.city || s.destination || '',
        descripcion_mercancia: s.cargo_description || '',
        peso_kg: s.weight_kg || 0,
        valor_mercancia_usd: s.cargo_value_usd || 0,
        total_usd: s.final_price || 0,
        estado: mapStatus(s.status),
        fecha_creacion: s.created_at || new Date().toISOString(),
        ro_number: s.ro_number || null,
      }));
      
      setCotizaciones(mapped);
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Map QuoteSubmission status to display status
  const mapStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'validacion_pendiente': 'pendiente',
      'procesando_costos': 'pendiente',
      'cotizacion_generada': 'cotizado',
      'enviada': 'cotizado',
      'aprobada': 'aprobada',
      'ro_generado': 'ro_generado',
      'en_transito': 'en_transito',
      'completada': 'completada',
      'cancelada': 'cancelada',
    };
    return statusMap[status] || status;
  };

  const handleApprove = async () => {
    if (!selectedCotizacion) return;
    setIsProcessing(true);
    try {
      // Update the quote submission status to approved
      await apiClient.patch(`/api/sales/quote-submissions/${selectedCotizacion.id}/`, {
        status: 'aprobada'
      });
      await fetchCotizaciones();
      setShowApproveModal(false);
      setSelectedCotizacion(null);
    } catch (error) {
      console.error('Error approving cotizacion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmbarque = async (embarqueData: any) => {
    if (!selectedCotizacion) return;
    setIsProcessing(true);
    try {
      // Generate RO number and update status
      const roNumber = `RO-${new Date().getFullYear()}-${String(selectedCotizacion.id).padStart(5, '0')}`;
      await apiClient.patch(`/api/sales/quote-submissions/${selectedCotizacion.id}/`, {
        status: 'ro_generado',
        ro_number: roNumber,
        shipper_name: embarqueData.shipper_name,
        shipper_address: embarqueData.shipper_address,
        consignee_name: embarqueData.consignee_name,
        consignee_address: embarqueData.consignee_address,
        notify_party: embarqueData.notify_party,
        notas: embarqueData.notas
      });
      await fetchCotizaciones();
      setShowEmbarqueModal(false);
      setSelectedCotizacion(null);
    } catch (error) {
      console.error('Error sending embarque:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: { [key: string]: { color: string; label: string } } = {
      pendiente: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      cotizado: { color: 'bg-blue-100 text-blue-800', label: 'Cotizado' },
      aprobada: { color: 'bg-green-100 text-green-800', label: 'Aprobada' },
      ro_generado: { color: 'bg-purple-100 text-purple-800', label: 'RO Generado' },
      en_transito: { color: 'bg-cyan-100 text-cyan-800', label: 'En Tránsito' },
      completada: { color: 'bg-gray-100 text-gray-800', label: 'Completada' },
    };
    const config = estados[estado] || { color: 'bg-gray-100 text-gray-800', label: estado };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTipoCargaIcon = (tipo: string) => {
    const iconos: { [key: string]: string } = {
      aerea: '✈️',
      maritima: '🚢',
      terrestre: '🚛',
    };
    return iconos[tipo] || '📦';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0A2540] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xl font-bold">ICS.APP</span>
          </Link>
          <Link to="/portal" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540] mb-2">
              Mis Cotizaciones
            </h1>
            <p className="text-gray-600">
              Visualiza, aprueba y gestiona todas tus cotizaciones
            </p>
          </div>
          <Link
            to="/portal/cotizar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#A4FF00] text-[#0A2540] rounded-xl font-bold hover:bg-[#A4FF00]/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Cotización
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00C9B7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando cotizaciones...</p>
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0A2540] mb-2">No tienes cotizaciones aún</h3>
            <p className="text-gray-600 mb-6">Solicita tu primera cotización y comienza a importar</p>
            <Link
              to="/portal/cotizar"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00C9B7] text-white rounded-xl font-medium hover:bg-[#00C9B7]/90 transition-colors"
            >
              Solicitar Primera Cotización
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cotizaciones.map((cotizacion) => (
              <div
                key={cotizacion.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[#00C9B7] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#0A2540] rounded-xl flex items-center justify-center text-2xl">
                      {getTipoCargaIcon(cotizacion.tipo_carga)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-[#0A2540]">
                          {cotizacion.numero_cotizacion}
                        </h3>
                        {getEstadoBadge(cotizacion.estado)}
                        {cotizacion.ro_number && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#A4FF00] text-[#0A2540]">
                            RO: {cotizacion.ro_number}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {cotizacion.origen_pais} → {cotizacion.destino_ciudad}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {cotizacion.descripcion_mercancia?.substring(0, 100)}
                        {cotizacion.descripcion_mercancia?.length > 100 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#0A2540]">
                      ${cotizacion.total_usd?.toLocaleString() || '---'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(cotizacion.fecha_creacion).toLocaleDateString('es-EC')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Peso: {cotizacion.peso_kg} kg</span>
                    <span>Valor: ${cotizacion.valor_mercancia_usd?.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    {cotizacion.estado === 'cotizado' && (
                      <button
                        onClick={() => {
                          setSelectedCotizacion(cotizacion);
                          setShowApproveModal(true);
                        }}
                        className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg font-medium hover:bg-[#00C9B7]/90 transition-colors text-sm"
                      >
                        Aprobar Cotización
                      </button>
                    )}
                    {cotizacion.estado === 'aprobada' && (
                      <button
                        onClick={() => {
                          setSelectedCotizacion(cotizacion);
                          setShowEmbarqueModal(true);
                        }}
                        className="px-4 py-2 bg-[#A4FF00] text-[#0A2540] rounded-lg font-medium hover:bg-[#A4FF00]/90 transition-colors text-sm"
                      >
                        Enviar Instrucción de Embarque
                      </button>
                    )}
                    {cotizacion.estado === 'ro_generado' && (
                      <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium text-sm">
                        RO: {cotizacion.ro_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showApproveModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#0A2540] mb-4">
              Aprobar Cotización
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de aprobar la cotización <strong>{selectedCotizacion.numero_cotizacion}</strong> por <strong>${selectedCotizacion.total_usd?.toLocaleString()}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Al aprobar, podrás enviar la instrucción de embarque y se generará un número de RO (Routing Order) único.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-[#00C9B7] text-white rounded-xl font-bold hover:bg-[#00C9B7]/90 disabled:opacity-50"
              >
                {isProcessing ? 'Procesando...' : 'Aprobar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmbarqueModal && selectedCotizacion && (
        <EmbarqueModal
          cotizacion={selectedCotizacion}
          onClose={() => setShowEmbarqueModal(false)}
          onSubmit={handleSendEmbarque}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}

function EmbarqueModal({ cotizacion, onClose, onSubmit, isProcessing }: {
  cotizacion: Cotizacion;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
}) {
  const [formData, setFormData] = useState({
    shipper_name: '',
    shipper_address: '',
    consignee_name: '',
    consignee_address: '',
    notify_party: '',
    fecha_embarque_estimada: '',
    notas: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full my-8">
        <h3 className="text-xl font-bold text-[#0A2540] mb-2">
          Instrucción de Embarque
        </h3>
        <p className="text-gray-600 mb-6">
          Cotización: {cotizacion.numero_cotizacion}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-2">
                Nombre del Shipper (Exportador) *
              </label>
              <input
                type="text"
                name="shipper_name"
                value={formData.shipper_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-2">
                Dirección del Shipper *
              </label>
              <input
                type="text"
                name="shipper_address"
                value={formData.shipper_address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-2">
                Nombre del Consignatario *
              </label>
              <input
                type="text"
                name="consignee_name"
                value={formData.consignee_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-2">
                Dirección del Consignatario *
              </label>
              <input
                type="text"
                name="consignee_address"
                value={formData.consignee_address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0A2540] mb-2">
              Notify Party
            </label>
            <input
              type="text"
              name="notify_party"
              value={formData.notify_party}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0A2540] mb-2">
              Fecha Estimada de Embarque *
            </label>
            <input
              type="date"
              name="fecha_embarque_estimada"
              value={formData.fecha_embarque_estimada}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0A2540] mb-2">
              Notas Adicionales
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-[#A4FF00] text-[#0A2540] rounded-xl font-bold hover:bg-[#A4FF00]/90 disabled:opacity-50"
            >
              {isProcessing ? 'Enviando...' : 'Enviar y Generar RO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
