import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import PortalNavbar from '../components/PortalNavbar';

interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  tipo_carga: string;
  origen_pais: string;
  destino_ciudad: string;
  descripcion_mercancia: string;
  peso_kg: number;
  volumen_cbm: number;
  valor_mercancia_usd: number;
  total_usd: number;
  estado: string;
  fecha_creacion: string;
  ro_number?: string;
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
  incoterm?: string;
  company_name?: string;
  contact_name?: string;
  contact_email?: string;
  ai_hs_code?: string;
  ai_category?: string;
  fob_value_usd?: number;
  cif_value_usd?: number;
  needs_insurance?: boolean;
  scenarios?: any[];
  is_oce_registered?: boolean;
  vendor_validation_status?: string;
  is_test_mode?: boolean;
}

type FilterStatus = 'todos' | 'pendiente' | 'en_espera_ff' | 'cotizado' | 'aprobada' | 'ro_generado' | 'rechazada';
type FilterTransport = 'todos' | 'FCL' | 'LCL' | 'AEREO';

export default function LeadMisCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [filteredCotizaciones, setFilteredCotizaciones] = useState<Cotizacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEmbarqueModal, setShowEmbarqueModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [filterTransport, setFilterTransport] = useState<FilterTransport>('todos');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cotizaciones, filterStatus, filterTransport, filterDateFrom, filterDateTo]);

  const applyFilters = () => {
    let filtered = [...cotizaciones];

    if (filterStatus !== 'todos') {
      filtered = filtered.filter(c => c.estado === filterStatus);
    }

    if (filterTransport !== 'todos') {
      filtered = filtered.filter(c => c.tipo_carga.toUpperCase() === filterTransport);
    }

    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(c => new Date(c.fecha_creacion) >= fromDate);
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => new Date(c.fecha_creacion) <= toDate);
    }

    setFilteredCotizaciones(filtered);
  };

  const fetchCotizaciones = async () => {
    try {
      const response = await apiClient.get('/api/sales/quote-submissions/my-submissions/');
      const submissions = response.data.results || response.data || [];
      
      const mapped = submissions.map((s: any) => ({
        id: s.id,
        numero_cotizacion: s.submission_number || `QS-${s.id}`,
        tipo_carga: s.transport_type || 'FCL',
        origen_pais: s.origin || '',
        destino_ciudad: s.destination || s.city || '',
        descripcion_mercancia: s.cargo_description || s.product_description || '',
        peso_kg: parseFloat(s.cargo_weight_kg) || 0,
        volumen_cbm: parseFloat(s.cargo_volume_cbm) || 0,
        valor_mercancia_usd: parseFloat(s.fob_value_usd) || parseFloat(s.cargo_value_usd) || 0,
        total_usd: parseFloat(s.final_price) || 0,
        estado: mapStatus(s.status),
        fecha_creacion: s.created_at || new Date().toISOString(),
        ro_number: s.ro_number || null,
        submission_number: s.submission_number,
        transport_type: s.transport_type,
        origin: s.origin,
        destination: s.destination,
        city: s.city,
        incoterm: s.incoterm,
        company_name: s.company_name,
        contact_name: s.contact_name,
        contact_email: s.contact_email,
        ai_hs_code: s.ai_hs_code,
        ai_category: s.ai_category,
        fob_value_usd: parseFloat(s.fob_value_usd) || 0,
        cif_value_usd: parseFloat(s.cif_value_usd) || 0,
        needs_insurance: s.needs_insurance,
        scenarios: s.scenarios || [],
        is_oce_registered: s.is_oce_registered,
        vendor_validation_status: s.vendor_validation_status,
        is_test_mode: s.vendor_validation_status === 'test_mode',
      }));
      
      setCotizaciones(mapped);
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
      try {
        const response = await apiClient.get('/api/sales/quote-submissions/');
        const submissions = response.data.results || response.data || [];
        
        const mapped = submissions.map((s: any) => ({
          id: s.id,
          numero_cotizacion: s.submission_number || `QS-${s.id}`,
          tipo_carga: s.transport_type || 'FCL',
          origen_pais: s.origin || '',
          destino_ciudad: s.destination || s.city || '',
          descripcion_mercancia: s.cargo_description || s.product_description || '',
          peso_kg: parseFloat(s.cargo_weight_kg) || 0,
          volumen_cbm: parseFloat(s.cargo_volume_cbm) || 0,
          valor_mercancia_usd: parseFloat(s.fob_value_usd) || parseFloat(s.cargo_value_usd) || 0,
          total_usd: parseFloat(s.final_price) || 0,
          estado: mapStatus(s.status),
          fecha_creacion: s.created_at || new Date().toISOString(),
          ro_number: s.ro_number || null,
          submission_number: s.submission_number,
          transport_type: s.transport_type,
          origin: s.origin,
          destination: s.destination,
          city: s.city,
          incoterm: s.incoterm,
          company_name: s.company_name,
          contact_name: s.contact_name,
          contact_email: s.contact_email,
          ai_hs_code: s.ai_hs_code,
          ai_category: s.ai_category,
          fob_value_usd: parseFloat(s.fob_value_usd) || 0,
          cif_value_usd: parseFloat(s.cif_value_usd) || 0,
          needs_insurance: s.needs_insurance,
          scenarios: s.scenarios || [],
          is_oce_registered: s.is_oce_registered,
          vendor_validation_status: s.vendor_validation_status,
          is_test_mode: s.vendor_validation_status === 'test_mode',
        }));
        
        setCotizaciones(mapped);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const mapStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'recibida': 'pendiente',
      'validacion_pendiente': 'pendiente',
      'procesando_costos': 'pendiente',
      'en_espera_ff': 'en_espera_ff',
      'cotizacion_generada': 'cotizado',
      'enviada': 'cotizado',
      'aprobada': 'aprobada',
      'ro_generado': 'ro_generado',
      'en_transito': 'en_transito',
      'completada': 'completada',
      'cancelada': 'rechazada',
      'rechazada': 'rechazada',
    };
    return statusMap[status] || status;
  };

  const handleApprove = async () => {
    if (!selectedCotizacion) return;
    setIsProcessing(true);
    try {
      await apiClient.post(`/api/sales/quote-submissions/${selectedCotizacion.id}/approve/`);
      await fetchCotizaciones();
      setShowApproveModal(false);
      setSelectedCotizacion(null);
    } catch (error) {
      console.error('Error approving cotizacion:', error);
      try {
        await apiClient.patch(`/api/sales/quote-submissions/${selectedCotizacion.id}/`, {
          status: 'aprobada'
        });
        await fetchCotizaciones();
        setShowApproveModal(false);
        setSelectedCotizacion(null);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCotizacion) return;
    setIsProcessing(true);
    try {
      await apiClient.post(`/api/sales/quote-submissions/${selectedCotizacion.id}/reject/`, {
        reason: rejectReason
      });
      await fetchCotizaciones();
      setShowRejectModal(false);
      setSelectedCotizacion(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting cotizacion:', error);
      try {
        await apiClient.patch(`/api/sales/quote-submissions/${selectedCotizacion.id}/`, {
          status: 'rechazada',
          notes: `Rechazada por cliente: ${rejectReason}`
        });
        await fetchCotizaciones();
        setShowRejectModal(false);
        setSelectedCotizacion(null);
        setRejectReason('');
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmbarque = async (embarqueData: any) => {
    if (!selectedCotizacion) return;
    setIsProcessing(true);
    try {
      await apiClient.post(`/api/sales/quote-submissions/${selectedCotizacion.id}/generate-ro/`, embarqueData);
      await fetchCotizaciones();
      setShowEmbarqueModal(false);
      setSelectedCotizacion(null);
    } catch (error) {
      console.error('Error sending embarque:', error);
      try {
        const roNumber = `RO-${new Date().getFullYear()}-${String(selectedCotizacion.id).padStart(5, '0')}`;
        await apiClient.patch(`/api/sales/quote-submissions/${selectedCotizacion.id}/`, {
          status: 'ro_generado',
          ro_number: roNumber,
          shipper_name: embarqueData.shipper_name,
          shipper_address: embarqueData.shipper_address,
          consignee_name: embarqueData.consignee_name,
          consignee_address: embarqueData.consignee_address,
          notify_party: embarqueData.notify_party,
          notes: embarqueData.notas
        });
        await fetchCotizaciones();
        setShowEmbarqueModal(false);
        setSelectedCotizacion(null);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const clearFilters = () => {
    setFilterStatus('todos');
    setFilterTransport('todos');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const getEstadoBadge = (estado: string) => {
    const estados: { [key: string]: { color: string; label: string; icon: string } } = {
      pendiente: { color: 'bg-amber-100 text-amber-800', label: 'Pendiente', icon: '⏳' },
      en_espera_ff: { color: 'bg-orange-100 text-orange-800', label: 'Espera FF', icon: '📤' },
      cotizado: { color: 'bg-blue-100 text-blue-800', label: 'Cotizado', icon: '📋' },
      aprobada: { color: 'bg-green-100 text-green-800', label: 'Aprobada', icon: '✓' },
      ro_generado: { color: 'bg-purple-100 text-purple-800', label: 'Con S/I y RO', icon: '📦' },
      en_transito: { color: 'bg-cyan-100 text-cyan-800', label: 'Tránsito', icon: '🚢' },
      completada: { color: 'bg-gray-100 text-gray-800', label: 'Completada', icon: '✔️' },
      rechazada: { color: 'bg-red-100 text-red-800', label: 'Rechazada', icon: '✕' },
    };
    const config = estados[estado] || { color: 'bg-gray-100 text-gray-800', label: estado, icon: '•' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${config.color}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getTipoCargaIcon = (tipo: string) => {
    const tipoUpper = tipo?.toUpperCase() || '';
    if (tipoUpper === 'AEREO' || tipoUpper === 'AEREA') return '✈️';
    if (tipoUpper === 'FCL' || tipoUpper === 'LCL' || tipoUpper === 'MARITIMA') return '🚢';
    if (tipoUpper === 'TERRESTRE') return '🚛';
    return '📦';
  };

  const getTipoCargaLabel = (tipo: string) => {
    const tipoUpper = tipo?.toUpperCase() || '';
    if (tipoUpper === 'AEREO') return 'Aéreo';
    if (tipoUpper === 'FCL') return 'Marítimo FCL';
    if (tipoUpper === 'LCL') return 'Marítimo LCL';
    if (tipoUpper === 'TERRESTRE') return 'Terrestre';
    return tipo;
  };

  const countByStatus = (status: string) => {
    return cotizaciones.filter(c => c.estado === status).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <PortalNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full box-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540] mb-2">
              Administrador de Cotizaciones
            </h1>
            <p className="text-gray-600">
              Gestiona tus solicitudes de cotización y cotizaciones recibidas
            </p>
          </div>
          <Link
            to="/portal/cotizar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#A4FF00] text-[#0A2540] rounded-xl font-bold hover:bg-[#A4FF00]/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Solicitud
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📊</span>
              <span className="text-sm text-gray-500">Total Solicitudes</span>
            </div>
            <p className="text-2xl font-bold text-[#0A2540]">{cotizaciones.length}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⏳</span>
              <span className="text-sm text-amber-700">En Espera</span>
            </div>
            <p className="text-2xl font-bold text-amber-800">
              {cotizaciones.filter(c => c.estado === 'pendiente' || c.estado === 'en_espera_ff').length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📋</span>
              <span className="text-sm text-blue-700">Cotizadas</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{countByStatus('cotizado')}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✓</span>
              <span className="text-sm text-green-700 text-xs">Aprobadas sin RO</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{countByStatus('aprobada')}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📦</span>
              <span className="text-sm text-purple-700 text-xs">Con S/I y RO</span>
            </div>
            <p className="text-2xl font-bold text-purple-800">{countByStatus('ro_generado')}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Procesando (IA)</option>
                <option value="en_espera_ff">En Espera (Freight Forwarder)</option>
                <option value="cotizado">Cotización Recibida</option>
                <option value="aprobada">Aprobada sin RO</option>
                <option value="ro_generado">Con S/I y RO</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Transporte</label>
              <select
                value={filterTransport}
                onChange={(e) => setFilterTransport(e.target.value as FilterTransport)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="FCL">Marítimo FCL</option>
                <option value="LCL">Marítimo LCL</option>
                <option value="AEREO">Aéreo</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00C9B7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando solicitudes...</p>
          </div>
        ) : filteredCotizaciones.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#0A2540] mb-1">
              {cotizaciones.length === 0 ? 'No tienes solicitudes aún' : 'No hay resultados para los filtros aplicados'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {cotizaciones.length === 0 ? 'Solicita tu primera cotización y comienza a importar' : 'Intenta ajustar los filtros de búsqueda'}
            </p>
            {cotizaciones.length === 0 && (
              <Link
                to="/portal/cotizar"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7] text-white rounded-lg font-medium hover:bg-[#00C9B7]/90 transition-colors text-sm"
              >
                Solicitar Primera Cotización
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <div className="col-span-3">Cotización</div>
              <div className="col-span-2">Ruta</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-3 text-right">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
            {filteredCotizaciones.map((cotizacion) => (
              <div
                key={cotizacion.id}
                className="px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-[#0A2540] rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                        {getTipoCargaIcon(cotizacion.tipo_carga)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#0A2540] text-sm">
                            {cotizacion.numero_cotizacion}
                          </span>
                          {cotizacion.is_test_mode && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded">TEST</span>
                          )}
                        </div>
                        {getEstadoBadge(cotizacion.estado)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {cotizacion.total_usd > 0 ? (
                        <>
                          <p className="text-lg font-bold text-[#0A2540]">
                            ${cotizacion.total_usd?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-gray-400">Total cotizado</p>
                        </>
                      ) : (
                        <p className="text-xs text-amber-600 font-medium">Pendiente</p>
                      )}
                      <p className="text-[10px] text-gray-400">
                        {new Date(cotizacion.fecha_creacion).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-2 pl-12">
                    <span className="truncate" title={cotizacion.origen_pais}>{cotizacion.origen_pais}</span>
                    <svg className="w-4 h-4 text-[#00C9B7] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-medium truncate">{cotizacion.destino_ciudad}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-auto flex-shrink-0">
                      {cotizacion.tipo_carga}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-3 pl-12 line-clamp-2">
                    {cotizacion.descripcion_mercancia}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 pl-12">
                    <span>⚖️ {cotizacion.peso_kg?.toLocaleString('es-EC')} kg</span>
                    <span className="text-gray-300">|</span>
                    <span>💵 FOB: ${cotizacion.valor_mercancia_usd?.toLocaleString('es-EC')}</span>
                  </div>
                  
                  {cotizacion.ro_number && (
                    <div className="mb-3 pl-12">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#A4FF00]/30 text-[#0A2540]">
                        📦 RO: {cotizacion.ro_number}
                      </span>
                    </div>
                  )}
                  
                  {/* Mobile Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap pl-12">
                    <button
                      onClick={() => { setSelectedCotizacion(cotizacion); setShowPreviewModal(true); }}
                      className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                      👁 Ver Detalle
                    </button>
                    {(cotizacion.estado === 'cotizado' || cotizacion.estado === 'aprobada' || cotizacion.estado === 'ro_generado') && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await apiClient.get(`/api/sales/quote-submissions/${cotizacion.id}/download-pdf/`, { responseType: 'blob' });
                            const blob = new Blob([response.data], { type: 'application/pdf' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `Cotizacion_${cotizacion.numero_cotizacion}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } catch (error) { console.error('Error downloading PDF:', error); }
                        }}
                        className="flex-1 px-3 py-2 border border-[#00C9B7] text-[#00C9B7] rounded-lg text-xs font-medium hover:bg-[#00C9B7]/10 flex items-center justify-center gap-1"
                      >
                        📄 Descargar PDF
                      </button>
                    )}
                  </div>
                  {cotizacion.estado === 'cotizado' && (
                    <div className="flex items-center gap-2 mt-2 pl-12">
                      <button
                        onClick={() => { setSelectedCotizacion(cotizacion); setShowRejectModal(true); }}
                        className="flex-1 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 flex items-center justify-center gap-1"
                      >
                        ✕ Rechazar
                      </button>
                      <button
                        onClick={() => { setSelectedCotizacion(cotizacion); setShowApproveModal(true); }}
                        className="flex-1 px-3 py-2 bg-[#00C9B7] text-white rounded-lg text-xs font-medium hover:bg-[#00C9B7]/90 flex items-center justify-center gap-1"
                      >
                        ✓ Aprobar
                      </button>
                    </div>
                  )}
                  {cotizacion.estado === 'aprobada' && (
                    <div className="mt-2 pl-12">
                      <button
                        onClick={() => { setSelectedCotizacion(cotizacion); setShowEmbarqueModal(true); }}
                        className="w-full px-3 py-2 bg-[#A4FF00] text-[#0A2540] rounded-lg text-xs font-bold hover:bg-[#A4FF00]/90 flex items-center justify-center gap-1"
                      >
                        📦 Generar Instrucción Embarque
                      </button>
                    </div>
                  )}
                  {(cotizacion.estado === 'ro_generado' || cotizacion.estado === 'en_transito') && (
                    <div className="mt-2 pl-12">
                      <Link
                        to={`/portal/tracking?ro=${cotizacion.ro_number}`}
                        className="w-full px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-purple-200"
                      >
                        🚢 Ver Tracking
                      </Link>
                    </div>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-2 md:items-center">
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#0A2540] rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                      {getTipoCargaIcon(cotizacion.tipo_carga)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[#0A2540] text-sm truncate">
                          {cotizacion.numero_cotizacion}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {cotizacion.tipo_carga}
                        </span>
                        {cotizacion.is_test_mode && (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded">TEST</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(cotizacion.fecha_creacion).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <span className="truncate max-w-[80px]" title={cotizacion.origen_pais}>{cotizacion.origen_pais}</span>
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="truncate max-w-[80px]" title={cotizacion.destino_ciudad}>{cotizacion.destino_ciudad}</span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex flex-col gap-1">
                      {getEstadoBadge(cotizacion.estado)}
                      {cotizacion.ro_number && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#A4FF00]/30 text-[#0A2540]">
                          RO: {cotizacion.ro_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 text-right">
                    {cotizacion.total_usd > 0 ? (
                      <p className="text-sm font-bold text-[#0A2540]">
                        ${cotizacion.total_usd?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600">Pendiente</p>
                    )}
                  </div>

                  <div className="col-span-3 flex items-center justify-end gap-1 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedCotizacion(cotizacion);
                        setShowPreviewModal(true);
                      }}
                      className="px-2 py-1 border border-gray-200 text-gray-600 rounded text-xs hover:bg-gray-100 transition-colors flex items-center gap-1"
                      title="Ver Detalle"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="hidden sm:inline">Detalle</span>
                    </button>

                    {(cotizacion.estado === 'cotizado' || cotizacion.estado === 'aprobada' || cotizacion.estado === 'ro_generado') && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await apiClient.get(`/api/sales/quote-submissions/${cotizacion.id}/download-pdf/`, {
                              responseType: 'blob'
                            });
                            const blob = new Blob([response.data], { type: 'application/pdf' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `Cotizacion_${cotizacion.numero_cotizacion}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Error downloading PDF:', error);
                            alert('Error al descargar el PDF.');
                          }
                        }}
                        className="px-2 py-1 border border-[#00C9B7] text-[#00C9B7] rounded text-xs hover:bg-[#00C9B7]/10 transition-colors flex items-center gap-1"
                        title="Descargar PDF"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                    )}
                    
                    {cotizacion.estado === 'cotizado' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCotizacion(cotizacion);
                            setShowRejectModal(true);
                          }}
                          className="px-2 py-1 border border-red-200 text-red-600 rounded text-xs hover:bg-red-50 transition-colors"
                          title="Rechazar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCotizacion(cotizacion);
                            setShowApproveModal(true);
                          }}
                          className="px-2 py-1 bg-[#00C9B7] text-white rounded text-xs hover:bg-[#00C9B7]/90 transition-colors flex items-center gap-1"
                          title="Aprobar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="hidden sm:inline">Aprobar</span>
                        </button>
                      </>
                    )}
                    {cotizacion.estado === 'aprobada' && (
                      <button
                        onClick={() => {
                          setSelectedCotizacion(cotizacion);
                          setShowEmbarqueModal(true);
                        }}
                        className="px-2 py-1 bg-[#A4FF00] text-[#0A2540] rounded text-xs font-semibold hover:bg-[#A4FF00]/90 transition-colors flex items-center gap-1"
                        title="Generar Instrucción de Embarque"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">Embarque</span>
                      </button>
                    )}
                    {(cotizacion.estado === 'ro_generado' || cotizacion.estado === 'en_transito') && (
                      <Link
                        to={`/portal/tracking?ro=${cotizacion.ro_number}`}
                        className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium flex items-center gap-1 hover:bg-purple-200 transition-colors"
                        title="Ver Tracking"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span className="hidden sm:inline">Tracking</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </main>

      {showPreviewModal && selectedCotizacion && (
        <PreviewModal
          cotizacion={selectedCotizacion}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedCotizacion(null);
          }}
          getEstadoBadge={getEstadoBadge}
          getTipoCargaLabel={getTipoCargaLabel}
          apiClient={apiClient}
          onApprove={async () => {
            await fetchCotizaciones();
          }}
        />
      )}

      {showApproveModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0A2540] mb-4 text-center">
              Aprobar Cotización
            </h3>
            <p className="text-gray-600 mb-4 text-center">
              ¿Deseas aprobar la cotización <strong>{selectedCotizacion.numero_cotizacion}</strong>?
            </p>
            {selectedCotizacion.total_usd > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total a pagar:</span>
                  <span className="text-2xl font-bold text-[#0A2540]">
                    ${selectedCotizacion.total_usd?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-6 text-center">
              Al aprobar, podrás generar la Instrucción de Embarque y se asignará un número de RO (Routing Order) único a tu envío.
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
                className="flex-1 px-4 py-3 bg-[#00C9B7] text-white rounded-xl font-bold hover:bg-[#00C9B7]/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  'Aprobar Cotización'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0A2540] mb-4 text-center">
              Rechazar Cotización
            </h3>
            <p className="text-gray-600 mb-4 text-center">
              ¿Estás seguro de rechazar la cotización <strong>{selectedCotizacion.numero_cotizacion}</strong>?
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo del rechazo (opcional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Indica el motivo por el cual rechazas esta cotización..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  'Rechazar Cotización'
                )}
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

function PreviewModal({ cotizacion, onClose, getEstadoBadge, getTipoCargaLabel, apiClient, onApprove }: {
  cotizacion: Cotizacion;
  onClose: () => void;
  getEstadoBadge: (estado: string) => React.ReactElement;
  getTipoCargaLabel: (tipo: string) => string;
  apiClient: any;
  onApprove?: (cotizacion: Cotizacion) => void;
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  
  useEffect(() => {
    if (cotizacion.scenarios && cotizacion.scenarios.length > 0) {
      const selectedScenario = cotizacion.scenarios.find((s: any) => s.is_selected || s.selected) || cotizacion.scenarios[0];
      setScenarioData(selectedScenario);
    } else {
      fetchScenarioData();
    }
  }, [cotizacion]);
  
  const fetchScenarioData = async () => {
    try {
      const response = await apiClient.get(`/api/sales/quote-submissions/${cotizacion.id}/`);
      const data = response.data;
      if (data.scenarios && data.scenarios.length > 0) {
        const selectedScenario = data.scenarios.find((s: any) => s.is_selected || s.selected) || data.scenarios[0];
        setScenarioData(selectedScenario);
      } else if (data.ai_response) {
        try {
          const aiData = typeof data.ai_response === 'string' ? JSON.parse(data.ai_response) : data.ai_response;
          if (aiData.escenarios && aiData.escenarios.length > 0) {
            const selectedScenario = aiData.escenarios.find((s: any) => s.is_selected || s.selected) || aiData.escenarios[0];
            setScenarioData(selectedScenario);
          }
        } catch (e) {
          console.error('Error parsing ai_response:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching scenario data:', error);
    }
  };
  
  const handleShowBreakdown = async () => {
    if (scenarioData) {
      setShowBreakdown(!showBreakdown);
      return;
    }
    setIsLoadingBreakdown(true);
    await fetchScenarioData();
    setShowBreakdown(true);
    setIsLoadingBreakdown(false);
  };
  
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await apiClient.post(`/api/sales/quote-submissions/${cotizacion.id}/approve/`);
      if (onApprove) onApprove(cotizacion);
      onClose();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Error al aprobar la cotización. Por favor intente nuevamente.');
    } finally {
      setIsApproving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-2xl w-full my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="min-w-0 flex-1 mr-2">
            <h3 className="text-lg sm:text-xl font-bold text-[#0A2540] truncate">
              Detalle de Solicitud
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm truncate">{cotizacion.numero_cotizacion}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {getEstadoBadge(cotizacion.estado)}
            <span className="text-sm text-gray-500">
              Creada el {new Date(cotizacion.fecha_creacion).toLocaleDateString('es-EC', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          <div className="bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
              <div className="text-center sm:text-left flex-1">
                <p className="text-xs sm:text-sm text-gray-300 mb-1">Origen</p>
                <p className="text-base sm:text-xl font-bold">
                  {cotizacion.origen_pais?.includes('|') || cotizacion.origen_pais?.includes(',') 
                    ? 'Tarifario Puertos Base Asia' 
                    : cotizacion.origen_pais}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <div className="h-px w-6 sm:w-12 bg-white/30 hidden sm:block"></div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-full flex items-center justify-center text-xl sm:text-2xl">
                  {cotizacion.tipo_carga?.toUpperCase() === 'AEREO' ? '✈️' : '🚢'}
                </div>
                <div className="h-px w-6 sm:w-12 bg-white/30 hidden sm:block"></div>
              </div>
              <div className="text-center sm:text-right flex-1">
                <p className="text-xs sm:text-sm text-gray-300 mb-1">Destino</p>
                <p className="text-base sm:text-xl font-bold">{cotizacion.destino_ciudad}</p>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20 flex justify-center">
              <span className="bg-white/20 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm">
                {getTipoCargaLabel(cotizacion.tipo_carga)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Peso</p>
              <p className="text-sm sm:text-lg font-bold text-[#0A2540]">{cotizacion.peso_kg?.toLocaleString()} kg</p>
            </div>
            
            {cotizacion.tipo_carga?.toUpperCase() === 'LCL' && cotizacion.volumen_cbm > 0 && (
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Volumen</p>
                <p className="text-sm sm:text-lg font-bold text-[#0A2540]">{cotizacion.volumen_cbm?.toLocaleString()} CBM</p>
              </div>
            )}
            
            {cotizacion.tipo_carga?.toUpperCase() === 'AEREO' && cotizacion.volumen_cbm > 0 && (
              <>
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Volumen</p>
                  <p className="text-sm sm:text-lg font-bold text-[#0A2540]">{cotizacion.volumen_cbm?.toLocaleString()} CBM</p>
                </div>
                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100">
                  <p className="text-xs sm:text-sm text-blue-600 mb-1">Peso Volumetrico</p>
                  <p className="text-sm sm:text-lg font-bold text-blue-800">
                    {((cotizacion.volumen_cbm || 0) * 167).toLocaleString('es-EC', { maximumFractionDigits: 2 })} kg VOL
                  </p>
                </div>
              </>
            )}
            
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Valor FOB</p>
              <p className="text-sm sm:text-lg font-bold text-[#0A2540]">${cotizacion.valor_mercancia_usd?.toLocaleString()}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Incoterm</p>
              <p className="text-sm sm:text-lg font-bold text-[#0A2540]">{cotizacion.incoterm || 'FOB'}</p>
            </div>
          </div>

          {cotizacion.descripcion_mercancia && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Descripción de la Mercancía</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700">{cotizacion.descripcion_mercancia}</p>
              </div>
            </div>
          )}

          {cotizacion.ai_hs_code && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 text-lg">🤖</span>
                <p className="text-sm font-medium text-blue-800">Clasificación IA</p>
              </div>
              <p className="text-lg font-bold text-[#0A2540]">HS: {cotizacion.ai_hs_code}</p>
              {cotizacion.ai_category && (
                <p className="text-sm text-gray-600 mt-1">{cotizacion.ai_category}</p>
              )}
            </div>
          )}

          {/* Cost Breakdown Section - Always show when we have cost data */}
          {(() => {
            const tipoCarga = cotizacion.tipo_carga?.toUpperCase() || '';
            const isLCL = tipoCarga === 'LCL';
            const isFCL = tipoCarga === 'FCL';
            const isAereo = tipoCarga === 'AEREO';
            
            const safeNumber = (val: any): number => {
              if (val === null || val === undefined || val === '') return 0;
              const parsed = Number(val);
              return isNaN(parsed) ? 0 : parsed;
            };
            
            const flete = safeNumber(scenarioData?.flete_base || scenarioData?.flete_usd || scenarioData?.flete_maritimo_usd || scenarioData?.flete_aereo_usd);
            const localCostsObj = scenarioData?.costos_locales || {};
            const localCostsTotal = typeof localCostsObj === 'object' 
              ? Object.values(localCostsObj).reduce((sum: number, val: any) => sum + safeNumber(val), 0)
              : safeNumber(localCostsObj);
            const gastosLocales = safeNumber(scenarioData?.gastos_locales) || localCostsTotal;
            const seguro = safeNumber(scenarioData?.seguro || scenarioData?.seguro_usd);
            const gastosOrigen = safeNumber(scenarioData?.gastos_origen || scenarioData?.gastos_origen_usd);
            
            const getFleteLabel = () => {
              if (isLCL) return 'Flete Marítimo LCL';
              if (isFCL) return 'Flete Marítimo FCL';
              if (isAereo) return 'Flete Aéreo';
              return 'Flete Internacional';
            };
            
            const getGastosLocalesLabel = () => {
              if (isLCL) return 'Gastos Locales LCL en Destino';
              if (isFCL) return 'Gastos Locales FCL en Destino';
              if (isAereo) return 'Gastos Locales Aéreo en Destino';
              return 'Gastos Locales Destino';
            };
            
            const getSeguroLabel = () => {
              if (isLCL) return 'Seguro de Carga LCL';
              if (isFCL) return 'Seguro de Carga FCL';
              if (isAereo) return 'Seguro de Carga Aéreo';
              return 'Seguro de Carga';
            };
            
            const hasBreakdown = flete > 0 || gastosLocales > 0 || seguro > 0 || gastosOrigen > 0;
            
            const localCostItems = typeof localCostsObj === 'object' && !Array.isArray(localCostsObj)
              ? Object.entries(localCostsObj).filter(([_, v]) => safeNumber(v) > 0)
              : [];
            
            const transporte = safeNumber(scenarioData?.transporte_interno || scenarioData?.transporte_interno_usd);
            const handling = safeNumber(scenarioData?.handling || scenarioData?.handling_usd);
            const docFee = safeNumber(scenarioData?.documentation_fee || scenarioData?.doc_fee);
            const almacenaje = safeNumber(scenarioData?.almacenaje || scenarioData?.storage_usd);
            const ivaAmount = safeNumber(scenarioData?.iva || scenarioData?.iva_total);
            
            const totalCotizado = safeNumber(cotizacion.total_usd) || safeNumber(scenarioData?.total || scenarioData?.grand_total_usd);
            
            if (hasBreakdown || scenarioData) {
              return (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Desglose de Costos
                  </p>
                  <div className="space-y-2 text-sm">
                    {flete > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{getFleteLabel()}</span>
                        <span className="font-medium">${flete.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {gastosOrigen > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gastos en Origen</span>
                        <span className="font-medium">${gastosOrigen.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {seguro > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{getSeguroLabel()}</span>
                        <span className="font-medium">${seguro.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    
                    {(gastosLocales > 0 || localCostItems.length > 0) && (
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <p className="text-xs font-medium text-gray-500 mb-2">{getGastosLocalesLabel()}</p>
                        {localCostItems.length > 0 ? (
                          <div className="space-y-1 pl-2 border-l-2 border-[#00C9B7]/30">
                            {localCostItems.map(([key, value]) => {
                              const formatLabel = (str: string) => {
                                const abbrevs: Record<string, string> = { 'iva': 'IVA', 'cif': 'CIF', 'fob': 'FOB', 'thc': 'THC', 'bl': 'B/L' };
                                return str.replace(/_/g, ' ').split(' ').map(word => 
                                  abbrevs[word.toLowerCase()] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                ).join(' ');
                              };
                              return (
                                <div key={key} className="flex justify-between text-xs">
                                  <span className="text-gray-500">{formatLabel(key)}</span>
                                  <span className="text-gray-700">${safeNumber(value).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex justify-between pl-2">
                            <span className="text-gray-500 text-xs">Total Gastos Locales</span>
                            <span className="text-gray-700">${gastosLocales.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {transporte > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transporte Interno Ecuador</span>
                        <span className="font-medium">${transporte.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {handling > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Handling</span>
                        <span className="font-medium">${handling.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {docFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Documentacion</span>
                        <span className="font-medium">${docFee.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {almacenaje > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Almacenaje</span>
                        <span className="font-medium">${almacenaje.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    
                    {ivaAmount > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>IVA (15%)</span>
                        <span>${ivaAmount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold">
                      <span className="text-[#0A2540]">Total Cotizado</span>
                      <span className="text-[#00C9B7]">${totalCotizado.toLocaleString('es-EC', { minimumFractionDigits: 2 })} USD</span>
                    </div>
                    <p className="text-xs text-gray-500 italic mt-2">
                      * Los valores están sujetos a IVA del 15% según corresponda.
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {cotizacion.total_usd > 0 && !scenarioData && (
            <div 
              onClick={handleShowBreakdown}
              className="bg-green-50 rounded-xl p-6 border border-green-100 cursor-pointer hover:bg-green-100 transition-colors group" 
              title="Haz clic para ver el desglose"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1 flex items-center gap-2">
                    Total Cotizado
                    <span className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {isLoadingBreakdown ? (
                        <span className="animate-pulse">Cargando...</span>
                      ) : (
                        '(Clic para ver desglose)'
                      )}
                    </span>
                  </p>
                  <p className="text-3xl font-bold text-green-800">
                    ${cotizacion.total_usd?.toLocaleString('es-EC', { minimumFractionDigits: 2 })} USD
                  </p>
                </div>
                {isLoadingBreakdown ? (
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6 text-green-600 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {cotizacion.ro_number && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-sm text-purple-700 mb-1">Número de Routing Order</p>
              <p className="text-xl font-bold text-purple-800">{cotizacion.ro_number}</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          {/* Approve button for quoted status */}
          {cotizacion.estado === 'cotizado' && onApprove && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="flex-1 px-4 py-3 bg-[#A4FF00] text-[#0A2540] rounded-xl font-bold hover:bg-[#A4FF00]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isApproving ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0A2540] border-t-transparent rounded-full animate-spin"></div>
                  Aprobando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aprobar Cotización
                </>
              )}
            </button>
          )}
          {(cotizacion.estado === 'cotizado' || cotizacion.estado === 'aprobada' || cotizacion.estado === 'ro_generado') && (
            <button
              onClick={async () => {
                try {
                  const response = await apiClient.get(`/api/sales/quote-submissions/${cotizacion.id}/download-pdf/`, {
                    responseType: 'blob'
                  });
                  const blob = new Blob([response.data], { type: 'application/pdf' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `Cotizacion_${cotizacion.numero_cotizacion}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Error downloading PDF:', error);
                  alert('Error al descargar el PDF. Por favor intente nuevamente.');
                }
              }}
              className="flex-1 px-4 py-3 bg-[#00C9B7] text-white rounded-xl font-medium hover:bg-[#00C9B7]/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar PDF
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
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
    consignee_name: cotizacion.company_name || '',
    consignee_address: '',
    notify_party: 'SAME AS CNEE',
    fecha_embarque_estimada: '',
    notas: '',
  });
  const [loadingAI, setLoadingAI] = useState(true);
  const [aiExtracted, setAiExtracted] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  useEffect(() => {
    const fetchAIData = async () => {
      try {
        const token = localStorage.getItem('ics_access_token');
        const response = await fetch('/api/sales/shipping-instructions/init/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            lead_cotizacion_id: cotizacion.id
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const suggestions = data.ai_suggestions || {};
          
          if (Object.keys(suggestions).length > 0) {
            setAiExtracted(true);
            setAiConfidence(suggestions.extraction_confidence || null);
          }
          
          setFormData(prev => ({
            ...prev,
            shipper_name: data.shipper_name || suggestions.shipper_name || '',
            shipper_address: data.shipper_address || suggestions.shipper_address || '',
            consignee_name: data.consignee_name || suggestions.consignee_name || cotizacion.company_name || '',
            consignee_address: data.consignee_address || suggestions.consignee_address || '',
            notify_party: data.notify_party_name || 'SAME AS CNEE',
          }));
        }
      } catch (error) {
        console.error('Error fetching AI data:', error);
      } finally {
        setLoadingAI(false);
      }
    };

    fetchAIData();
  }, [cotizacion.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-xl w-full my-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#A4FF00] rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0A2540]">
              Instrucción de Embarque
            </h3>
            <p className="text-gray-500 text-xs">
              Cotización: {cotizacion.numero_cotizacion}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
          <p className="text-xs text-blue-800">
            <strong>Importante:</strong> Al enviar esta instrucción se generará automáticamente un número de RO (Routing Order) único para tu embarque.
          </p>
        </div>

        {loadingAI ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-[#00C9B7] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-gray-600 font-medium">Analizando documentos con IA...</p>
            <p className="text-xs text-gray-500 mt-1">Extrayendo información de factura comercial y packing list</p>
          </div>
        ) : (
          <>
            {aiExtracted && (
              <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200 flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs text-green-800 font-medium">
                    IA ha extraído datos de tus documentos{aiConfidence ? ` (${aiConfidence}% confianza)` : ''}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Revisa y edita la información si es necesario antes de enviar.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#0A2540] mb-1">
                Nombre del Shipper (Exportador) *
              </label>
              <input
                type="text"
                name="shipper_name"
                value={formData.shipper_name}
                onChange={handleChange}
                required
                placeholder="Nombre de la empresa exportadora"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0A2540] mb-1">
                Dirección del Shipper *
              </label>
              <input
                type="text"
                name="shipper_address"
                value={formData.shipper_address}
                onChange={handleChange}
                required
                placeholder="Dirección completa del exportador"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#0A2540] mb-1">
                Nombre del Consignatario *
              </label>
              <input
                type="text"
                name="consignee_name"
                value={formData.consignee_name}
                onChange={handleChange}
                required
                placeholder="Nombre de la empresa importadora"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0A2540] mb-1">
                Dirección del Consignatario *
              </label>
              <input
                type="text"
                name="consignee_address"
                value={formData.consignee_address}
                onChange={handleChange}
                required
                placeholder="Dirección en Ecuador"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#0A2540] mb-1">
                Notify Party
              </label>
              <input
                type="text"
                name="notify_party"
                value={formData.notify_party}
                onChange={handleChange}
                placeholder="SAME AS CNEE"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0A2540] mb-1">
                Fecha Estimada de Embarque *
              </label>
              <input
                type="date"
                name="fecha_embarque_estimada"
                value={formData.fecha_embarque_estimada}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#0A2540] mb-1">
              Notas Adicionales
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={2}
              placeholder="Instrucciones especiales, requerimientos de documentación, etc."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 bg-[#A4FF00] text-[#0A2540] rounded-lg font-bold hover:bg-[#A4FF00]/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A2540] border-t-transparent rounded-full animate-spin"></div>
                  Generando RO...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enviar y Generar RO
                </>
              )}
            </button>
          </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
