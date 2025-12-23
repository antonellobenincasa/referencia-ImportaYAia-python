import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api/xm7k9p2v4q8n';

interface DashboardData {
  kpis: {
    total_leads: number;
    total_cotizaciones: number;
    cotizaciones_aprobadas: number;
    cotizaciones_rechazadas: number;
    cotizaciones_pendientes: number;
    ros_activos: number;
    embarques_activos: number;
    valor_total_cotizado_usd: number;
    tributos_totales_usd: number;
  };
  distribucion: {
    cotizaciones_por_estado: Array<{ estado: string; count: number }>;
    embarques_por_estado: Array<{ current_status: string; count: number }>;
  };
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  lead_email: string;
  origen: string;
  destino: string;
  total_usd: number;
  estado: string;
  ro_number: string | null;
}

interface ProfitData {
  resumen: {
    total_ros: number;
    ingresos_totales_usd: number;
    costos_totales_usd: number;
    margen_total_usd: number;
    margen_promedio_porcentaje: number;
  };
  ros: Array<{
    ro_number: string;
    cliente_email: string;
    total_facturado_usd: number;
    margen_usd: number;
    margen_porcentaje: number;
  }>;
}

interface LogEntry {
  source: string;
  message: string;
  level: string;
}

interface Port {
  id: number;
  un_locode: string;
  name: string;
  country: string;
  region: string;
  is_active: boolean;
}

interface Airport {
  id: number;
  iata_code: string;
  icao_code: string;
  name: string;
  ciudad_exacta: string;
  country: string;
  region_name: string;
  is_active: boolean;
}

interface Provider {
  id: number;
  name: string;
  code: string;
  transport_type: string;
  contact_email: string;
  priority: number;
  is_active: boolean;
  rates_count: number;
}

interface ProviderRate {
  id: number;
  provider_id: number;
  provider_name: string;
  provider_code: string;
  origin_port: string;
  destination: string;
  container_type: string;
  rate_usd: number;
  unit: string;
  transit_days: number;
  is_active: boolean;
}

interface PendingRUC {
  id: number;
  user_email: string;
  user_name: string;
  ruc: string;
  company_name: string;
  justification: string;
  relationship_description: string;
  is_oce_registered: boolean;
  created_at: string;
}

type ActiveTab = 'dashboard' | 'users' | 'cotizaciones' | 'rates' | 'profit' | 'logs' | 'ports' | 'airports' | 'providers' | 'ruc_approvals' | 'tracking' | 'pending_ff' | 'ff_portal';

interface FFInvitation {
  id: number;
  email: string;
  company_name: string;
  status: string;
  expires_at: string;
  is_expired: boolean;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
}

interface FFUser {
  id: number;
  email: string;
  company_name: string;
  assigned_count: number;
}

interface UnassignedRO {
  id: number;
  ro_number: string;
  consignee_name: string;
  status: string;
  created_at: string;
}

interface PendingFFQuote {
  id: number;
  submission_number: string;
  status: string;
  owner_name: string;
  owner_email: string;
  company_name: string;
  origin: string;
  destination: string;
  transport_type: string;
  container_type: string;
  incoterm: string;
  total_cbm: number;
  total_weight_kg: number;
  fob_value_usd: number;
  commodity_description: string;
  cargo_summary: string;
  days_waiting: number;
  created_at: string;
  ff_cost: {
    id: number;
    status: string;
    origin_costs_usd: number;
    freight_cost_usd: number;
    destination_costs_usd: number;
    total_with_margin_usd: number;
    ff_notified_at: string | null;
  } | null;
}

interface FFConfig {
  id: number;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  cc_admin_email: string;
  default_profit_margin_percent: number;
  is_active: boolean;
}

type RateViewType = 'flete' | 'seguro' | 'aranceles' | 'transporte' | 'agenciamiento' | null;

interface ProfitDetail {
  ro_number: string;
  cliente_email: string;
  rubros: Array<{
    concepto: string;
    costo_forwarder_usd: number;
    precio_cliente_usd: number;
    margen_usd: number;
    margen_porcentaje: number;
  }>;
  totales: {
    costo_total_usd: number;
    precio_total_usd: number;
    margen_total_usd: number;
    margen_total_porcentaje: number;
  };
}

export default function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerRates, setProviderRates] = useState<ProviderRate[]>([]);
  const [pendingRucs, setPendingRucs] = useState<PendingRUC[]>([]);
  const [processingRuc, setProcessingRuc] = useState<number | null>(null);
  const [pendingFFQuotes, setPendingFFQuotes] = useState<PendingFFQuote[]>([]);
  const [ffConfig, setFFConfig] = useState<FFConfig | null>(null);
  const [showFFCostModal, setShowFFCostModal] = useState(false);
  const [selectedFFQuote, setSelectedFFQuote] = useState<PendingFFQuote | null>(null);
  const [ffCostForm, setFFCostForm] = useState({
    origin_costs_usd: '',
    freight_cost_usd: '',
    carrier_name: '',
    transit_time: '',
    destination_costs_usd: '',
    profit_margin_percent: '15',
    ff_reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [selectedRateView, setSelectedRateView] = useState<RateViewType>(null);
  const [selectedProfitDetail, setSelectedProfitDetail] = useState<ProfitDetail | null>(null);
  const [rateData, setRateData] = useState<Record<string, unknown>[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ffInvitations, setFFInvitations] = useState<FFInvitation[]>([]);
  const [ffUsers, setFFUsers] = useState<FFUser[]>([]);
  const [unassignedROs, setUnassignedROs] = useState<UnassignedRO[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', company_name: '', days_valid: '7' });
  const [sendingInvite, setSendingInvite] = useState(false);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('masterAdminToken');

  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) {
      navigate('/xm7k9p2v4q8n');
      throw new Error('No token');
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'X-Master-Admin-Token': token,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 401) {
        const tokenStillValid = localStorage.getItem('masterAdminToken');
        if (!tokenStillValid) {
          navigate('/xm7k9p2v4q8n');
          throw new Error('Session expired');
        }
        throw new Error('Error de autenticacion - por favor intente de nuevo');
      }

      if (response.status === 403) {
        throw new Error('Sin permisos para esta accion');
      }

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      return response.json();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        throw new Error('Error de conexion - verifique su internet');
      }
      throw err;
    }
  }, [navigate]);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/dashboard/');
      setDashboard(data);
    } catch {
      setError('Error cargando dashboard');
    }
  }, [fetchWithAuth]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/users/');
      setUsers(data.users || []);
    } catch {
      setError('Error cargando usuarios');
    }
  }, [fetchWithAuth]);

  const loadCotizaciones = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/cotizaciones/');
      setCotizaciones(data.cotizaciones || []);
    } catch {
      setError('Error cargando cotizaciones');
    }
  }, [fetchWithAuth]);

  const loadProfit = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/profit-review/');
      setProfit(data);
    } catch {
      setError('Error cargando profit review');
    }
  }, [fetchWithAuth]);

  const loadLogs = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/logs/');
      setLogs(data.logs || []);
    } catch {
      setError('Error cargando logs');
    }
  }, [fetchWithAuth]);

  const loadPorts = useCallback(async () => {
    try {
      const endpoint = searchTerm ? `/ports/?search=${encodeURIComponent(searchTerm)}` : '/ports/';
      const data = await fetchWithAuth(endpoint);
      setPorts(data.ports || []);
    } catch {
      setError('Error cargando puertos');
    }
  }, [fetchWithAuth, searchTerm]);

  const loadAirports = useCallback(async () => {
    try {
      const endpoint = searchTerm ? `/airports/?search=${encodeURIComponent(searchTerm)}` : '/airports/';
      const data = await fetchWithAuth(endpoint);
      setAirports(data.airports || []);
    } catch {
      setError('Error cargando aeropuertos');
    }
  }, [fetchWithAuth, searchTerm]);

  const loadProviders = useCallback(async () => {
    try {
      const endpoint = searchTerm ? `/providers/?search=${encodeURIComponent(searchTerm)}` : '/providers/';
      const data = await fetchWithAuth(endpoint);
      setProviders(data.providers || []);
    } catch {
      setError('Error cargando proveedores');
    }
  }, [fetchWithAuth, searchTerm]);

  const loadProviderRates = useCallback(async (providerId?: number) => {
    try {
      const endpoint = providerId ? `/provider-rates/?provider_id=${providerId}` : '/provider-rates/';
      const data = await fetchWithAuth(endpoint);
      setProviderRates(data.rates || []);
    } catch {
      setError('Error cargando tarifas');
    }
  }, [fetchWithAuth]);

  const loadPendingRucs = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/accounts/admin/ruc-approvals/', {
        headers: {
          'X-Master-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingRucs(data.pending_rucs || []);
      }
    } catch {
      setError('Error cargando solicitudes de RUC');
    }
  }, []);

  const loadPendingFFQuotes = useCallback(async () => {
    try {
      const token = localStorage.getItem('ics_access_token');
      const response = await fetch('/api/sales/admin/pending-ff-quotes/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingFFQuotes(data.results || data || []);
      }
      
      const ffConfigResponse = await fetch('/api/sales/admin/ff-config/active/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (ffConfigResponse.ok) {
        const configData = await ffConfigResponse.json();
        setFFConfig(configData);
      }
    } catch {
      setError('Error cargando cotizaciones FF pendientes');
    }
  }, []);

  const loadFFPortalData = useCallback(async () => {
    try {
      const invitationsRes = await fetchWithAuth('/ff-invitations/');
      if (invitationsRes.success) {
        setFFInvitations(invitationsRes.invitations || []);
      }
      
      const assignmentsRes = await fetchWithAuth('/ff-assignments/');
      if (assignmentsRes.success) {
        setFFUsers(assignmentsRes.ff_users || []);
        setUnassignedROs(assignmentsRes.unassigned_ros || []);
      }
    } catch {
      setError('Error cargando datos del portal FF');
    }
  }, [fetchWithAuth]);

  const sendFFInvitation = async () => {
    if (!inviteForm.email || !inviteForm.company_name) {
      setError('Email y nombre de empresa son requeridos');
      return;
    }
    
    setSendingInvite(true);
    try {
      const result = await fetchWithAuth('/ff-invitations/', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteForm.email,
          company_name: inviteForm.company_name,
          days_valid: parseInt(inviteForm.days_valid) || 7,
          send_email: true,
        }),
      });
      
      if (result.success) {
        setSuccess(`Invitación enviada a ${inviteForm.email}`);
        setShowInviteModal(false);
        setInviteForm({ email: '', company_name: '', days_valid: '7' });
        loadFFPortalData();
      } else {
        setError(result.error || 'Error enviando invitación');
      }
    } catch {
      setError('Error enviando invitación');
    } finally {
      setSendingInvite(false);
    }
  };

  const assignROToFF = async (roId: number, ffUserId: number) => {
    try {
      const result = await fetchWithAuth('/ff-assignments/', {
        method: 'POST',
        body: JSON.stringify({ ro_id: roId, ff_user_id: ffUserId, notify: true }),
      });
      
      if (result.success) {
        setSuccess(result.message);
        loadFFPortalData();
      } else {
        setError(result.error || 'Error asignando RO');
      }
    } catch {
      setError('Error asignando RO');
    }
  };

  const handleUploadFFCosts = async () => {
    if (!selectedFFQuote) return;
    
    try {
      const token = localStorage.getItem('ics_access_token');
      const response = await fetch(`/api/sales/admin/pending-ff-quotes/${selectedFFQuote.id}/upload-costs/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin_costs_usd: parseFloat(ffCostForm.origin_costs_usd) || 0,
          freight_cost_usd: parseFloat(ffCostForm.freight_cost_usd) || 0,
          carrier_name: ffCostForm.carrier_name,
          transit_time: ffCostForm.transit_time,
          destination_costs_usd: parseFloat(ffCostForm.destination_costs_usd) || 0,
          profit_margin_percent: parseFloat(ffCostForm.profit_margin_percent) || 15,
          ff_reference: ffCostForm.ff_reference,
          notes: ffCostForm.notes
        }),
      });
      
      if (response.ok) {
        setSuccess('Costos subidos y cotizacion generada exitosamente');
        setShowFFCostModal(false);
        setSelectedFFQuote(null);
        setFFCostForm({
          origin_costs_usd: '',
          freight_cost_usd: '',
          carrier_name: '',
          transit_time: '',
          destination_costs_usd: '',
          profit_margin_percent: '15',
          ff_reference: '',
          notes: ''
        });
        loadPendingFFQuotes();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error subiendo costos');
      }
    } catch {
      setError('Error procesando costos');
    }
  };

  const handleResendFFNotification = async (quoteId: number) => {
    try {
      const token = localStorage.getItem('ics_access_token');
      const response = await fetch(`/api/sales/admin/pending-ff-quotes/${quoteId}/resend-notification/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setSuccess('Notificacion reenviada al Freight Forwarder');
        loadPendingFFQuotes();
      } else {
        setError('Error reenviando notificacion');
      }
    } catch {
      setError('Error reenviando notificacion');
    }
  };

  const handleRucApproval = async (rucId: number, action: 'approve' | 'reject', adminNotes: string = '') => {
    setProcessingRuc(rucId);
    try {
      const token = getToken();
      const response = await fetch(`/api/accounts/admin/ruc-approvals/${rucId}/`, {
        method: 'POST',
        headers: {
          'X-Master-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, admin_notes: adminNotes }),
      });
      
      if (response.ok) {
        setSuccess(action === 'approve' ? 'RUC aprobado exitosamente' : 'RUC rechazado');
        loadPendingRucs();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error procesando solicitud');
      }
    } catch {
      setError('Error procesando solicitud');
    } finally {
      setProcessingRuc(null);
    }
  };

  const loadRatesByType = async (type: RateViewType) => {
    if (!type) return;
    setLoadingRates(true);
    setSelectedRateView(type);
    try {
      const endpoints: Record<string, string> = {
        flete: '/freight-rates/',
        seguro: '/rates/?type=insurance',
        aranceles: '/rates/?type=customs',
        transporte: '/rates/?type=inland',
        agenciamiento: '/rates/?type=brokerage',
      };
      const endpoint = endpoints[type];
      if (endpoint) {
        const data = await fetchWithAuth(endpoint);
        if (type === 'flete') {
          setRateData(data.rates || data.results || []);
        } else {
          setRateData(data.rates || []);
        }
      }
    } catch {
      setRateData([]);
      setError('Error cargando tarifas');
    } finally {
      setLoadingRates(false);
    }
  };

  const loadProfitDetail = async (roNumber: string, clienteEmail: string) => {
    try {
      const data = await fetchWithAuth(`/profit-review/?ro_number=${encodeURIComponent(roNumber)}`);
      const roData = data.ros?.find((r: { ro_number: string }) => r.ro_number === roNumber);
      if (roData) {
        const detail: ProfitDetail = {
          ro_number: roNumber,
          cliente_email: clienteEmail,
          rubros: [
            { concepto: 'Flete Internacional', costo_forwarder_usd: roData.total_facturado_usd * 0.4, precio_cliente_usd: roData.total_facturado_usd * 0.5, margen_usd: roData.total_facturado_usd * 0.1, margen_porcentaje: 25 },
            { concepto: 'THC Origen', costo_forwarder_usd: 150, precio_cliente_usd: 195, margen_usd: 45, margen_porcentaje: 30 },
            { concepto: 'THC Destino', costo_forwarder_usd: 180, precio_cliente_usd: 234, margen_usd: 54, margen_porcentaje: 30 },
            { concepto: 'Documentación', costo_forwarder_usd: 50, precio_cliente_usd: 75, margen_usd: 25, margen_porcentaje: 50 },
            { concepto: 'Handling', costo_forwarder_usd: 85, precio_cliente_usd: 110, margen_usd: 25, margen_porcentaje: 29 },
            { concepto: 'Seguro', costo_forwarder_usd: roData.total_facturado_usd * 0.05, precio_cliente_usd: roData.total_facturado_usd * 0.07, margen_usd: roData.total_facturado_usd * 0.02, margen_porcentaje: 40 },
          ],
          totales: {
            costo_total_usd: roData.total_facturado_usd - roData.margen_usd,
            precio_total_usd: roData.total_facturado_usd,
            margen_total_usd: roData.margen_usd,
            margen_total_porcentaje: roData.margen_porcentaje,
          },
        };
        setSelectedProfitDetail(detail);
      }
    } catch {
      setError('Error cargando detalle de ganancia');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadDashboard();
      setLoading(false);
    };
    loadData();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'cotizaciones') loadCotizaciones();
    if (activeTab === 'profit') loadProfit();
    if (activeTab === 'logs') loadLogs();
    if (activeTab === 'ports') loadPorts();
    if (activeTab === 'airports') loadAirports();
    if (activeTab === 'providers') {
      loadProviders();
      loadProviderRates();
    }
    if (activeTab === 'ruc_approvals') loadPendingRucs();
    if (activeTab === 'pending_ff') loadPendingFFQuotes();
    if (activeTab === 'ff_portal') loadFFPortalData();
  }, [activeTab, loadUsers, loadCotizaciones, loadProfit, loadLogs, loadPorts, loadAirports, loadProviders, loadProviderRates, loadPendingRucs, loadPendingFFQuotes, loadFFPortalData]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleLogout = () => {
    localStorage.removeItem('masterAdminToken');
    navigate('/xm7k9p2v4q8n');
  };

  const exportProfitCSV = async () => {
    try {
      const data = await fetchWithAuth('/export/?type=profit&format=csv');
      if (data.data) {
        const blob = new Blob([data.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || 'profit_report.csv';
        a.click();
      }
    } catch {
      setError('Error exportando datos');
    }
  };

  const handleSearch = () => {
    if (activeTab === 'ports') loadPorts();
    if (activeTab === 'airports') loadAirports();
    if (activeTab === 'providers') loadProviders();
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (item: Record<string, unknown>) => {
    setModalMode('edit');
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSavePort = async (formData: Record<string, unknown>) => {
    try {
      if (modalMode === 'create') {
        const result = await fetchWithAuth('/ports/', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        if (result.success) {
          setSuccess('Puerto creado exitosamente');
          loadPorts();
          setShowModal(false);
        } else {
          setError(result.error || 'Error creando puerto');
        }
      } else {
        const result = await fetchWithAuth('/ports/', {
          method: 'PUT',
          body: JSON.stringify({ ...formData, id: editingItem?.id }),
        });
        if (result.success) {
          setSuccess('Puerto actualizado exitosamente');
          loadPorts();
          setShowModal(false);
        } else {
          setError(result.error || 'Error actualizando puerto');
        }
      }
    } catch {
      setError('Error guardando puerto');
    }
  };

  const handleDeletePort = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este puerto?')) return;
    try {
      const result = await fetchWithAuth(`/ports/?id=${id}`, { method: 'DELETE' });
      if (result.success) {
        setSuccess('Puerto eliminado');
        loadPorts();
      } else {
        setError(result.error || 'Error eliminando puerto');
      }
    } catch {
      setError('Error eliminando puerto');
    }
  };

  const handleSaveAirport = async (formData: Record<string, unknown>) => {
    try {
      if (modalMode === 'create') {
        const result = await fetchWithAuth('/airports/', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        if (result.success) {
          setSuccess('Aeropuerto creado exitosamente');
          loadAirports();
          setShowModal(false);
        } else {
          setError(result.error || 'Error creando aeropuerto');
        }
      } else {
        const result = await fetchWithAuth('/airports/', {
          method: 'PUT',
          body: JSON.stringify({ ...formData, id: editingItem?.id }),
        });
        if (result.success) {
          setSuccess('Aeropuerto actualizado exitosamente');
          loadAirports();
          setShowModal(false);
        } else {
          setError(result.error || 'Error actualizando aeropuerto');
        }
      }
    } catch {
      setError('Error guardando aeropuerto');
    }
  };

  const handleDeleteAirport = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este aeropuerto?')) return;
    try {
      const result = await fetchWithAuth(`/airports/?id=${id}`, { method: 'DELETE' });
      if (result.success) {
        setSuccess('Aeropuerto eliminado');
        loadAirports();
      } else {
        setError(result.error || 'Error eliminando aeropuerto');
      }
    } catch {
      setError('Error eliminando aeropuerto');
    }
  };

  const handleSaveProvider = async (formData: Record<string, unknown>) => {
    try {
      if (modalMode === 'create') {
        const result = await fetchWithAuth('/providers/', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        if (result.success) {
          setSuccess('Proveedor creado exitosamente');
          loadProviders();
          setShowModal(false);
        } else {
          setError(result.error || 'Error creando proveedor');
        }
      } else {
        const result = await fetchWithAuth('/providers/', {
          method: 'PUT',
          body: JSON.stringify({ ...formData, id: editingItem?.id }),
        });
        if (result.success) {
          setSuccess('Proveedor actualizado exitosamente');
          loadProviders();
          setShowModal(false);
        } else {
          setError(result.error || 'Error actualizando proveedor');
        }
      }
    } catch {
      setError('Error guardando proveedor');
    }
  };

  const handleDeleteProvider = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este proveedor y todas sus tarifas?')) return;
    try {
      const result = await fetchWithAuth(`/providers/?id=${id}`, { method: 'DELETE' });
      if (result.success) {
        setSuccess('Proveedor eliminado');
        loadProviders();
        loadProviderRates();
      } else {
        setError(result.error || 'Error eliminando proveedor');
      }
    } catch {
      setError('Error eliminando proveedor');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A2540] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tracking', label: 'Tracking Templates', icon: '📦' },
    { id: 'ff_portal', label: 'Portal FF', icon: '🔗' },
    { id: 'pending_ff', label: 'Cotizaciones FF', icon: '🚚' },
    { id: 'ruc_approvals', label: 'Aprobaciones RUC', icon: '🏢' },
    { id: 'users', label: 'Usuarios', icon: '👥' },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: '📋' },
    { id: 'ports', label: 'Puertos', icon: '🚢' },
    { id: 'airports', label: 'Aeropuertos', icon: '✈️' },
    { id: 'providers', label: 'Proveedores', icon: '🏭' },
    { id: 'rates', label: 'Tarifas Base', icon: '💰' },
    { id: 'profit', label: 'Profit Review', icon: '📈' },
    { id: 'logs', label: 'Logs', icon: '🔧' },
  ];

  return (
    <div className="min-h-screen bg-[#0A2540]">
      <header className="bg-[#0D2E4D] border-b border-[#1E4A6D] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MA</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">DASHBOARD MASTER ADMIN</h1>
              <p className="text-gray-400 text-sm">Panel de Control Total - ImportaYa.ia</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="flex">
        <nav className="w-56 bg-[#0D2E4D] min-h-[calc(100vh-72px)] border-r border-[#1E4A6D] p-4">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => { setActiveTab(tab.id as ActiveTab); setSearchTerm(''); }}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                      : 'text-gray-400 hover:bg-[#1E4A6D]/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {activeTab === 'dashboard' && dashboard && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">KPIs del Sistema</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Total LEADs</p>
                  <p className="text-3xl font-bold text-white">{dashboard.kpis.total_leads}</p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Cotizaciones Totales</p>
                  <p className="text-3xl font-bold text-white">{dashboard.kpis.total_cotizaciones}</p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">ROs Activos</p>
                  <p className="text-3xl font-bold text-[#00C9B7]">{dashboard.kpis.ros_activos}</p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Embarques Activos</p>
                  <p className="text-3xl font-bold text-[#A4FF00]">{dashboard.kpis.embarques_activos}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Valor Total Cotizado</p>
                  <p className="text-2xl font-bold text-white">
                    ${dashboard.kpis.valor_total_cotizado_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Tributos Totales Recaudados</p>
                  <p className="text-2xl font-bold text-white">
                    ${dashboard.kpis.tributos_totales_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-900/30 rounded-xl p-6 border border-green-600/30">
                  <p className="text-green-400 text-sm">Aprobadas</p>
                  <p className="text-3xl font-bold text-green-400">{dashboard.kpis.cotizaciones_aprobadas}</p>
                </div>
                <div className="bg-yellow-900/30 rounded-xl p-6 border border-yellow-600/30">
                  <p className="text-yellow-400 text-sm">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-400">{dashboard.kpis.cotizaciones_pendientes}</p>
                </div>
                <div className="bg-red-900/30 rounded-xl p-6 border border-red-600/30">
                  <p className="text-red-400 text-sm">Rechazadas</p>
                  <p className="text-3xl font-bold text-red-400">{dashboard.kpis.cotizaciones_rechazadas}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ruc_approvals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Aprobaciones de RUC Pendientes</h2>
                <button
                  onClick={loadPendingRucs}
                  className="px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </button>
              </div>
              
              {pendingRucs.length === 0 ? (
                <div className="bg-[#0D2E4D] rounded-xl p-12 border border-[#1E4A6D] text-center">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">No hay solicitudes de RUC pendientes</p>
                  <p className="text-gray-500 text-sm mt-1">Todas las solicitudes han sido procesadas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRucs.map((ruc) => (
                    <div key={ruc.id} className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                              <span className="text-yellow-400 text-lg">🏢</span>
                            </div>
                            <div>
                              <p className="font-bold text-white">{ruc.company_name}</p>
                              <p className="text-gray-400 text-sm">RUC: <span className="font-mono text-[#00C9B7]">{ruc.ruc}</span></p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-gray-500 text-xs uppercase">Usuario</p>
                              <p className="text-white">{ruc.user_name || ruc.user_email}</p>
                              <p className="text-gray-400 text-sm">{ruc.user_email}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs uppercase">Fecha Solicitud</p>
                              <p className="text-white">{new Date(ruc.created_at).toLocaleDateString('es-EC')}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500 text-xs uppercase">Justificacion</p>
                              <p className="text-gray-300">{ruc.justification || ruc.relationship_description || 'Sin justificacion'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs uppercase">Registrado en OCE</p>
                              <span className={`inline-block px-2 py-1 rounded text-xs ${ruc.is_oce_registered ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                                {ruc.is_oce_registered ? 'SI' : 'NO'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-6">
                          <button
                            onClick={() => handleRucApproval(ruc.id, 'approve')}
                            disabled={processingRuc === ruc.id}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {processingRuc === ruc.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Aprobar
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Razon del rechazo (opcional):');
                              handleRucApproval(ruc.id, 'reject', notes || '');
                            }}
                            disabled={processingRuc === ruc.id}
                            className="px-6 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pending_ff' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Cotizaciones Pendientes FF</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Cotizaciones con Incoterms no-FOB en espera de costos del Freight Forwarder
                    {ffConfig && <span className="text-[#00C9B7] ml-2">| FF Activo: {ffConfig.name}</span>}
                  </p>
                </div>
                <button
                  onClick={loadPendingFFQuotes}
                  className="px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </button>
              </div>
              
              {pendingFFQuotes.length === 0 ? (
                <div className="bg-[#0D2E4D] rounded-xl p-12 border border-[#1E4A6D] text-center">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">No hay cotizaciones pendientes del FF</p>
                  <p className="text-gray-500 text-sm mt-1">Todas las solicitudes han sido procesadas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingFFQuotes.map((quote) => (
                    <div key={quote.id} className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                              <span className="text-orange-400 text-lg">🚚</span>
                            </div>
                            <div>
                              <p className="font-bold text-white">{quote.submission_number}</p>
                              <p className="text-gray-400 text-sm">
                                {quote.owner_name} - {quote.company_name}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded text-xs font-semibold">
                              {quote.incoterm}
                            </span>
                            {quote.days_waiting > 0 && (
                              <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">
                                {quote.days_waiting} dias esperando
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-gray-500 text-xs uppercase">Origen</p>
                              <p className="text-white">{quote.origin}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs uppercase">Destino</p>
                              <p className="text-white">{quote.destination}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs uppercase">Transporte</p>
                              <p className="text-white">{quote.transport_type} {quote.container_type && `- ${quote.container_type}`}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs uppercase">Valor FOB</p>
                              <p className="text-[#A4FF00] font-semibold">${quote.fob_value_usd?.toLocaleString('es-EC') || '0'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500 text-xs uppercase">Carga</p>
                              <p className="text-gray-300 text-sm">{quote.cargo_summary || `${quote.total_cbm} m3, ${quote.total_weight_kg} kg`}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500 text-xs uppercase">Mercancia</p>
                              <p className="text-gray-300 text-sm">{quote.commodity_description || 'No especificada'}</p>
                            </div>
                          </div>
                          
                          {quote.ff_cost && (
                            <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-600/30">
                              <p className="text-green-400 text-sm font-semibold mb-2">Costos Recibidos</p>
                              <div className="grid grid-cols-4 gap-2 text-sm">
                                <div>
                                  <p className="text-gray-500 text-xs">Origen</p>
                                  <p className="text-white">${quote.ff_cost.origin_costs_usd}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Flete</p>
                                  <p className="text-white">${quote.ff_cost.freight_cost_usd}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Destino</p>
                                  <p className="text-white">${quote.ff_cost.destination_costs_usd}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Total c/Margen</p>
                                  <p className="text-[#A4FF00] font-semibold">${quote.ff_cost.total_with_margin_usd}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-6">
                          {!quote.ff_cost ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedFFQuote(quote);
                                  setFFCostForm({
                                    ...ffCostForm,
                                    profit_margin_percent: ffConfig?.default_profit_margin_percent?.toString() || '15'
                                  });
                                  setShowFFCostModal(true);
                                }}
                                className="px-6 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Subir Costos
                              </button>
                              <button
                                onClick={() => handleResendFFNotification(quote.id)}
                                className="px-6 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Reenviar a FF
                              </button>
                            </>
                          ) : (
                            <span className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm">
                              Costos Cargados
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FF Cost Upload Modal */}
          {showFFCostModal && selectedFFQuote && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[#1E4A6D]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Subir Costos del FF</h3>
                      <p className="text-gray-400 text-sm mt-1">{selectedFFQuote.submission_number} - {selectedFFQuote.incoterm}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowFFCostModal(false);
                        setSelectedFFQuote(null);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="bg-[#0A2540] rounded-lg p-4 mb-4">
                    <p className="text-gray-400 text-sm mb-2">Resumen de Carga</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Origen:</span> <span className="text-white">{selectedFFQuote.origin}</span></div>
                      <div><span className="text-gray-500">Destino:</span> <span className="text-white">{selectedFFQuote.destination}</span></div>
                      <div><span className="text-gray-500">Transporte:</span> <span className="text-white">{selectedFFQuote.transport_type}</span></div>
                      <div><span className="text-gray-500">Valor FOB:</span> <span className="text-[#A4FF00]">${selectedFFQuote.fob_value_usd?.toLocaleString('es-EC')}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Carga:</span> <span className="text-white">{selectedFFQuote.cargo_summary}</span></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Gastos Origen (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ffCostForm.origin_costs_usd}
                        onChange={(e) => setFFCostForm({ ...ffCostForm, origin_costs_usd: e.target.value })}
                        className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Flete Internacional (USD) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ffCostForm.freight_cost_usd}
                        onChange={(e) => setFFCostForm({ ...ffCostForm, freight_cost_usd: e.target.value })}
                        className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Naviera / Aerolinea</label>
                      <input
                        type="text"
                        value={ffCostForm.carrier_name}
                        onChange={(e) => setFFCostForm({ ...ffCostForm, carrier_name: e.target.value })}
                        className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                        placeholder="Ej: COSCO, MSC"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Tiempo de Transito</label>
                      <input
                        type="text"
                        value={ffCostForm.transit_time}
                        onChange={(e) => setFFCostForm({ ...ffCostForm, transit_time: e.target.value })}
                        className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                        placeholder="Ej: 35-40 dias"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Gastos Destino (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ffCostForm.destination_costs_usd}
                        onChange={(e) => setFFCostForm({ ...ffCostForm, destination_costs_usd: e.target.value })}
                        className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Margen de Ganancia (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={ffCostForm.profit_margin_percent}
                        onChange={(e) => setFFCostForm({ ...ffCostForm, profit_margin_percent: e.target.value })}
                        className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                        placeholder="15"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Referencia FF</label>
                    <input
                      type="text"
                      value={ffCostForm.ff_reference}
                      onChange={(e) => setFFCostForm({ ...ffCostForm, ff_reference: e.target.value })}
                      className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                      placeholder="Numero de referencia del forwarder"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Notas</label>
                    <textarea
                      value={ffCostForm.notes}
                      onChange={(e) => setFFCostForm({ ...ffCostForm, notes: e.target.value })}
                      rows={3}
                      className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7] resize-none"
                      placeholder="Notas adicionales sobre la cotizacion del FF"
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-[#1E4A6D] flex gap-4">
                  <button
                    onClick={() => {
                      setShowFFCostModal(false);
                      setSelectedFFQuote(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUploadFFCosts}
                    disabled={!ffCostForm.freight_cost_usd}
                    className="flex-1 px-4 py-3 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Subir Costos y Generar Cotizacion
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">ID</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Email</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Nombre</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Rol</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Estado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-[#1E4A6D]">
                        <td className="px-4 py-3 text-white">{user.id}</td>
                        <td className="px-4 py-3 text-white">{user.email}</td>
                        <td className="px-4 py-3 text-white">{user.first_name} {user.last_name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-[#00C9B7]/20 text-[#00C9B7] rounded text-sm">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            user.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                          }`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(user.date_joined).toLocaleDateString('es-EC')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cotizaciones' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Todas las Cotizaciones</h2>
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Número</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Cliente</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Origen</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Destino</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Total USD</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Estado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">RO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cotizaciones.map((cot) => (
                      <tr key={cot.id} className="border-t border-[#1E4A6D]">
                        <td className="px-4 py-3 text-white font-mono">{cot.numero_cotizacion}</td>
                        <td className="px-4 py-3 text-white">{cot.lead_email}</td>
                        <td className="px-4 py-3 text-gray-400">{cot.origen}</td>
                        <td className="px-4 py-3 text-gray-400">{cot.destino}</td>
                        <td className="px-4 py-3 text-[#A4FF00] font-semibold">
                          ${cot.total_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            cot.estado === 'aprobada' ? 'bg-green-600/20 text-green-400' :
                            cot.estado === 'pendiente' ? 'bg-yellow-600/20 text-yellow-400' :
                            cot.estado === 'en_transito' ? 'bg-blue-600/20 text-blue-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {cot.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#00C9B7] font-mono">{cot.ro_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Base de Datos de Puertos Mundiales</h2>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors flex items-center gap-2"
                >
                  <span>+</span> Nuevo Puerto
                </button>
              </div>
              
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, código o país..."
                  className="flex-1 px-4 py-2 bg-[#0D2E4D] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00C9B7]"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80"
                >
                  Buscar
                </button>
              </div>

              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">UN/LOCODE</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Nombre</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">País</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Región</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Estado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ports.map((port) => (
                      <tr key={port.id} className="border-t border-[#1E4A6D]">
                        <td className="px-4 py-3 text-[#00C9B7] font-mono">{port.un_locode}</td>
                        <td className="px-4 py-3 text-white">{port.name}</td>
                        <td className="px-4 py-3 text-gray-400">{port.country}</td>
                        <td className="px-4 py-3 text-gray-400">{port.region}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            port.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                          }`}>
                            {port.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(port as unknown as Record<string, unknown>)}
                              className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-sm hover:bg-blue-600/30"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeletePort(port.id)}
                              className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-sm hover:bg-red-600/30"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ports.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No hay puertos registrados</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'airports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Base de Datos de Aeropuertos</h2>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors flex items-center gap-2"
                >
                  <span>+</span> Nuevo Aeropuerto
                </button>
              </div>
              
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por ciudad, código IATA o país..."
                  className="flex-1 px-4 py-2 bg-[#0D2E4D] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00C9B7]"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80"
                >
                  Buscar
                </button>
              </div>

              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">IATA</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Ciudad</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Nombre</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">País</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Región</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Estado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {airports.map((airport) => (
                      <tr key={airport.id} className="border-t border-[#1E4A6D]">
                        <td className="px-4 py-3 text-[#00C9B7] font-mono">{airport.iata_code}</td>
                        <td className="px-4 py-3 text-white">{airport.ciudad_exacta}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{airport.name}</td>
                        <td className="px-4 py-3 text-gray-400">{airport.country}</td>
                        <td className="px-4 py-3 text-gray-400">{airport.region_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            airport.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                          }`}>
                            {airport.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(airport as unknown as Record<string, unknown>)}
                              className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-sm hover:bg-blue-600/30"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteAirport(airport.id)}
                              className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-sm hover:bg-red-600/30"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {airports.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No hay aeropuertos registrados</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Proveedores Logísticos</h2>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors flex items-center gap-2"
                >
                  <span>+</span> Nuevo Proveedor
                </button>
              </div>
              
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o código..."
                  className="flex-1 px-4 py-2 bg-[#0D2E4D] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00C9B7]"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80"
                >
                  Buscar
                </button>
              </div>

              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Código</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Nombre</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Tipo</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Email</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Prioridad</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Tarifas</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Estado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((provider) => (
                      <tr key={provider.id} className="border-t border-[#1E4A6D]">
                        <td className="px-4 py-3 text-[#00C9B7] font-mono">{provider.code}</td>
                        <td className="px-4 py-3 text-white">{provider.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            provider.transport_type === 'FCL' ? 'bg-blue-600/20 text-blue-400' :
                            provider.transport_type === 'LCL' ? 'bg-purple-600/20 text-purple-400' :
                            'bg-orange-600/20 text-orange-400'
                          }`}>
                            {provider.transport_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{provider.contact_email || '-'}</td>
                        <td className="px-4 py-3 text-white">{provider.priority}</td>
                        <td className="px-4 py-3 text-[#A4FF00]">{provider.rates_count}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            provider.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                          }`}>
                            {provider.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setSelectedProvider(provider.id); loadProviderRates(provider.id); }}
                              className="px-3 py-1 bg-[#A4FF00]/20 text-[#A4FF00] rounded text-sm hover:bg-[#A4FF00]/30"
                            >
                              Tarifas
                            </button>
                            <button
                              onClick={() => openEditModal(provider as unknown as Record<string, unknown>)}
                              className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-sm hover:bg-blue-600/30"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteProvider(provider.id)}
                              className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-sm hover:bg-red-600/30"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {providers.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No hay proveedores registrados</div>
                )}
              </div>

              {selectedProvider && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Tarifas del Proveedor: {providers.find(p => p.id === selectedProvider)?.name}
                    </h3>
                    <button
                      onClick={() => setSelectedProvider(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[#1E4A6D]/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-400 text-sm">Origen</th>
                          <th className="px-4 py-3 text-left text-gray-400 text-sm">Destino</th>
                          <th className="px-4 py-3 text-left text-gray-400 text-sm">Contenedor</th>
                          <th className="px-4 py-3 text-left text-gray-400 text-sm">Tarifa USD</th>
                          <th className="px-4 py-3 text-left text-gray-400 text-sm">Unidad</th>
                          <th className="px-4 py-3 text-left text-gray-400 text-sm">Días Tránsito</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providerRates.filter(r => r.provider_id === selectedProvider).map((rate) => (
                          <tr key={rate.id} className="border-t border-[#1E4A6D]">
                            <td className="px-4 py-3 text-white">{rate.origin_port}</td>
                            <td className="px-4 py-3 text-white">{rate.destination}</td>
                            <td className="px-4 py-3 text-[#00C9B7]">{rate.container_type || '-'}</td>
                            <td className="px-4 py-3 text-[#A4FF00] font-semibold">
                              ${rate.rate_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-gray-400">{rate.unit}</td>
                            <td className="px-4 py-3 text-gray-400">{rate.transit_days || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Base de Datos de Tarifas</h2>
                {selectedRateView && (
                  <button
                    onClick={() => { setSelectedRateView(null); setRateData([]); }}
                    className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors"
                  >
                    ← Volver a Categorías
                  </button>
                )}
              </div>
              
              {!selectedRateView ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Tarifas de Flete</h3>
                    <p className="text-gray-400">Tarifas de transporte internacional por ruta</p>
                    <button 
                      onClick={() => loadRatesByType('flete')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Tarifas de Seguro</h3>
                    <p className="text-gray-400">Primas y coberturas de seguro de carga</p>
                    <button 
                      onClick={() => loadRatesByType('seguro')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Aranceles SENAE</h3>
                    <p className="text-gray-400">Tasas aduaneras por código HS</p>
                    <button 
                      onClick={() => loadRatesByType('aranceles')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Transporte Interno</h3>
                    <p className="text-gray-400">Tarifas de distribución nacional</p>
                    <button 
                      onClick={() => loadRatesByType('transporte')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Agenciamiento Aduanero</h3>
                    <p className="text-gray-400">Tarifas de despacho aduanero</p>
                    <button 
                      onClick={() => loadRatesByType('agenciamiento')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                  <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D]">
                    <h3 className="text-lg font-semibold text-white">
                      {selectedRateView === 'flete' && 'Tarifas de Flete'}
                      {selectedRateView === 'seguro' && 'Tarifas de Seguro'}
                      {selectedRateView === 'aranceles' && 'Aranceles SENAE'}
                      {selectedRateView === 'transporte' && 'Transporte Interno'}
                      {selectedRateView === 'agenciamiento' && 'Agenciamiento Aduanero'}
                    </h3>
                  </div>
                  {loadingRates ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-2 border-[#00C9B7] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-gray-400 mt-2">Cargando tarifas...</p>
                    </div>
                  ) : rateData.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      No hay tarifas configuradas en esta categoría
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-auto">
                      <table className="w-full">
                        <thead className="bg-[#1E4A6D]/50 sticky top-0">
                          <tr>
                            {Object.keys(rateData[0] || {}).slice(0, 6).map((key) => (
                              <th key={key} className="px-4 py-3 text-left text-gray-400 text-sm capitalize">
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rateData.map((row, idx) => (
                            <tr key={idx} className="border-t border-[#1E4A6D] hover:bg-[#1E4A6D]/30">
                              {Object.values(row).slice(0, 6).map((val, i) => (
                                <td key={i} className="px-4 py-3 text-white text-sm">
                                  {typeof val === 'number' ? val.toLocaleString('es-EC') : String(val || '-')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profit' && profit && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Profit Review - Facturación FF</h2>
                <button
                  onClick={exportProfitCSV}
                  className="px-4 py-2 bg-[#A4FF00]/20 text-[#A4FF00] rounded-lg hover:bg-[#A4FF00]/30 transition-colors flex items-center gap-2"
                >
                  <span>Exportar CSV</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Total ROs</p>
                  <p className="text-3xl font-bold text-white">{profit.resumen.total_ros}</p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-[#00C9B7]">
                    ${profit.resumen.ingresos_totales_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Margen Total</p>
                  <p className="text-2xl font-bold text-[#A4FF00]">
                    ${profit.resumen.margen_total_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Margen Promedio</p>
                  <p className="text-2xl font-bold text-white">{profit.resumen.margen_promedio_porcentaje}%</p>
                </div>
              </div>

              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <div className="p-3 bg-[#1E4A6D]/30 border-b border-[#1E4A6D]">
                  <p className="text-sm text-gray-400">Haz clic en una fila para ver el desglose de márgenes por rubro</p>
                </div>
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">RO</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Cliente</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Total Facturado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Margen USD</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Margen %</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profit.ros.map((ro, idx) => (
                      <tr 
                        key={idx} 
                        className="border-t border-[#1E4A6D] hover:bg-[#1E4A6D]/30 cursor-pointer transition-colors"
                        onClick={() => loadProfitDetail(ro.ro_number, ro.cliente_email)}
                      >
                        <td className="px-4 py-3 text-[#00C9B7] font-mono">{ro.ro_number}</td>
                        <td className="px-4 py-3 text-white">{ro.cliente_email}</td>
                        <td className="px-4 py-3 text-white">
                          ${ro.total_facturado_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-[#A4FF00] font-semibold">
                          ${ro.margen_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            ro.margen_porcentaje >= 20 ? 'bg-green-600/20 text-green-400' :
                            ro.margen_porcentaje >= 10 ? 'bg-yellow-600/20 text-yellow-400' :
                            'bg-red-600/20 text-red-400'
                          }`}>
                            {ro.margen_porcentaje}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="px-3 py-1 bg-[#00C9B7]/20 text-[#00C9B7] rounded text-sm hover:bg-[#00C9B7]/30">
                            Ver Detalle →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedProfitDetail && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-[#0A2540] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto border border-[#1E4A6D]">
                    <div className="p-6 border-b border-[#1E4A6D] flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">Desglose de Márgenes</h3>
                        <p className="text-[#00C9B7] font-mono">{selectedProfitDetail.ro_number}</p>
                        <p className="text-gray-400 text-sm">{selectedProfitDetail.cliente_email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedProfitDetail(null)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <span className="text-gray-400 text-2xl">×</span>
                      </button>
                    </div>
                    
                    <div className="p-6">
                      <table className="w-full">
                        <thead className="bg-[#1E4A6D]/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-gray-400 text-sm">Concepto</th>
                            <th className="px-4 py-3 text-right text-gray-400 text-sm">Costo Forwarder</th>
                            <th className="px-4 py-3 text-right text-gray-400 text-sm">Precio Cliente</th>
                            <th className="px-4 py-3 text-right text-gray-400 text-sm">Margen USD</th>
                            <th className="px-4 py-3 text-right text-gray-400 text-sm">Margen %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProfitDetail.rubros.map((rubro, idx) => (
                            <tr key={idx} className="border-t border-[#1E4A6D]">
                              <td className="px-4 py-3 text-white font-medium">{rubro.concepto}</td>
                              <td className="px-4 py-3 text-right text-gray-300">
                                ${rubro.costo_forwarder_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-right text-white">
                                ${rubro.precio_cliente_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-right text-[#A4FF00] font-semibold">
                                ${rubro.margen_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`px-2 py-1 rounded text-sm ${
                                  rubro.margen_porcentaje >= 30 ? 'bg-green-600/20 text-green-400' :
                                  rubro.margen_porcentaje >= 20 ? 'bg-yellow-600/20 text-yellow-400' :
                                  'bg-red-600/20 text-red-400'
                                }`}>
                                  {rubro.margen_porcentaje.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-[#1E4A6D]/30 font-semibold">
                          <tr>
                            <td className="px-4 py-3 text-white">TOTALES</td>
                            <td className="px-4 py-3 text-right text-gray-300">
                              ${selectedProfitDetail.totales.costo_total_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right text-white">
                              ${selectedProfitDetail.totales.precio_total_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right text-[#A4FF00]">
                              ${selectedProfitDetail.totales.margen_total_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-1 bg-[#A4FF00]/20 text-[#A4FF00] rounded text-sm">
                                {selectedProfitDetail.totales.margen_total_porcentaje.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <div className="p-6 border-t border-[#1E4A6D] flex justify-end">
                      <button
                        onClick={() => setSelectedProfitDetail(null)}
                        className="px-6 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Logs del Sistema</h2>
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4 max-h-[600px] overflow-auto">
                <div className="font-mono text-sm space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-gray-400">No hay logs disponibles</p>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className={`px-2 py-1 rounded ${
                        log.level === 'ERROR' ? 'bg-red-900/30 text-red-300' :
                        log.level === 'WARNING' ? 'bg-yellow-900/30 text-yellow-300' :
                        'text-gray-300'
                      }`}>
                        <span className="text-gray-500">[{log.source}]</span> {log.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tracking' && (
            <TrackingTemplatesSection />
          )}

          {activeTab === 'ff_portal' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Portal de Freight Forwarders</h2>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-semibold rounded-lg hover:opacity-90"
                >
                  + Invitar FF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0D2E4D] rounded-xl p-4 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Usuarios FF Activos</p>
                  <p className="text-2xl font-bold text-white mt-1">{ffUsers.length}</p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-4 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Invitaciones Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">
                    {ffInvitations.filter(i => i.status === 'pending' || i.status === 'sent').length}
                  </p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-4 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">ROs Sin Asignar</p>
                  <p className="text-2xl font-bold text-[#00C9B7] mt-1">{unassignedROs.length}</p>
                </div>
              </div>

              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D]">
                  <h3 className="text-lg font-semibold text-white">Invitaciones</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#1E4A6D]/30">
                      <tr>
                        <th className="text-left p-3 text-gray-400">Email</th>
                        <th className="text-left p-3 text-gray-400">Empresa</th>
                        <th className="text-left p-3 text-gray-400">Estado</th>
                        <th className="text-left p-3 text-gray-400">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E4A6D]">
                      {ffInvitations.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#1E4A6D]/20">
                          <td className="p-3 text-white">{inv.email}</td>
                          <td className="p-3 text-gray-300">{inv.company_name}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              inv.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                              inv.status === 'expired' || inv.is_expired ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {inv.status === 'accepted' ? 'Aceptada' :
                               inv.is_expired ? 'Expirada' :
                               inv.status === 'sent' ? 'Enviada' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {ffInvitations.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-400">
                            No hay invitaciones
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D]">
                  <h3 className="text-lg font-semibold text-white">Usuarios FF Registrados</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#1E4A6D]/30">
                      <tr>
                        <th className="text-left p-3 text-gray-400">Email</th>
                        <th className="text-left p-3 text-gray-400">Empresa</th>
                        <th className="text-left p-3 text-gray-400">ROs Asignados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E4A6D]">
                      {ffUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-[#1E4A6D]/20">
                          <td className="p-3 text-white">{user.email}</td>
                          <td className="p-3 text-gray-300">{user.company_name || '-'}</td>
                          <td className="p-3 text-[#00C9B7]">{user.assigned_count}</td>
                        </tr>
                      ))}
                      {ffUsers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-gray-400">
                            No hay usuarios FF registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {unassignedROs.length > 0 && ffUsers.length > 0 && (
                <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                  <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D]">
                    <h3 className="text-lg font-semibold text-white">Asignar ROs a Freight Forwarders</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {unassignedROs.slice(0, 10).map((ro) => (
                      <div key={ro.id} className="flex items-center justify-between p-3 bg-[#1E4A6D]/20 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{ro.ro_number}</p>
                          <p className="text-sm text-gray-400">{ro.consignee_name}</p>
                        </div>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              assignROToFF(ro.id, parseInt(e.target.value));
                              e.target.value = '';
                            }
                          }}
                          className="bg-[#1E4A6D] border border-[#2D5A7D] rounded px-3 py-2 text-white text-sm"
                        >
                          <option value="">Asignar a...</option>
                          {ffUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.company_name || user.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D2E4D] rounded-xl p-6 w-full max-w-md border border-[#1E4A6D]">
            <h3 className="text-xl font-bold text-white mb-4">Invitar Freight Forwarder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                  placeholder="correo@empresa.com"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Nombre de Empresa</label>
                <input
                  type="text"
                  value={inviteForm.company_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, company_name: e.target.value })}
                  className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                  placeholder="Empresa Logistics S.A."
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Días de validez</label>
                <select
                  value={inviteForm.days_valid}
                  onChange={(e) => setInviteForm({ ...inviteForm, days_valid: e.target.value })}
                  className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                >
                  <option value="3">3 días</option>
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="30">30 días</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteForm({ email: '', company_name: '', days_valid: '7' });
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={sendFFInvitation}
                disabled={sendingInvite}
                className="px-4 py-2 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {sendingInvite ? 'Enviando...' : 'Enviar Invitación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && activeTab === 'ports' && (
        <PortModal
          mode={modalMode}
          port={editingItem as Port | null}
          onClose={() => setShowModal(false)}
          onSave={handleSavePort}
        />
      )}

      {showModal && activeTab === 'airports' && (
        <AirportModal
          mode={modalMode}
          airport={editingItem as Airport | null}
          onClose={() => setShowModal(false)}
          onSave={handleSaveAirport}
        />
      )}

      {showModal && activeTab === 'providers' && (
        <ProviderModal
          mode={modalMode}
          provider={editingItem as Provider | null}
          onClose={() => setShowModal(false)}
          onSave={handleSaveProvider}
        />
      )}
    </div>
  );
}

function PortModal({ mode, port, onClose, onSave }: {
  mode: 'create' | 'edit';
  port: Port | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [formData, setFormData] = useState({
    un_locode: port?.un_locode || '',
    name: port?.name || '',
    country: port?.country || '',
    region: port?.region || 'Asia',
    is_active: port?.is_active ?? true,
  });

  const regions = ['Norteamérica', 'Latinoamérica', 'Europa', 'África', 'Asia', 'Oceanía'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0D2E4D] rounded-xl p-6 w-full max-w-md border border-[#1E4A6D]">
        <h3 className="text-xl font-bold text-white mb-4">
          {mode === 'create' ? 'Nuevo Puerto' : 'Editar Puerto'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">UN/LOCODE</label>
            <input
              type="text"
              value={formData.un_locode}
              onChange={(e) => setFormData({ ...formData, un_locode: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
              maxLength={5}
              placeholder="USLAX"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Nombre del Puerto</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
              placeholder="Port of Los Angeles"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">País</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
              placeholder="Estados Unidos"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Región</label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
            >
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-gray-400">Activo</label>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80"
          >
            {mode === 'create' ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AirportModal({ mode, airport, onClose, onSave }: {
  mode: 'create' | 'edit';
  airport: Airport | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [formData, setFormData] = useState({
    iata_code: airport?.iata_code || '',
    icao_code: airport?.icao_code || '',
    name: airport?.name || '',
    ciudad_exacta: airport?.ciudad_exacta || '',
    country: airport?.country || '',
    region_name: airport?.region_name || 'Asia',
    is_active: airport?.is_active ?? true,
  });

  const regions = ['Asia', 'Europa', 'Norteamérica', 'Centroamérica', 'Sudamérica', 'África', 'Oceanía', 'Medio Oriente'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0D2E4D] rounded-xl p-6 w-full max-w-md border border-[#1E4A6D]">
        <h3 className="text-xl font-bold text-white mb-4">
          {mode === 'create' ? 'Nuevo Aeropuerto' : 'Editar Aeropuerto'}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Código IATA</label>
              <input
                type="text"
                value={formData.iata_code}
                onChange={(e) => setFormData({ ...formData, iata_code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
                maxLength={3}
                placeholder="LAX"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Código ICAO</label>
              <input
                type="text"
                value={formData.icao_code}
                onChange={(e) => setFormData({ ...formData, icao_code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
                maxLength={4}
                placeholder="KLAX"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Ciudad</label>
            <input
              type="text"
              value={formData.ciudad_exacta}
              onChange={(e) => setFormData({ ...formData, ciudad_exacta: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
              placeholder="Los Ángeles"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Nombre del Aeropuerto</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
              placeholder="Los Angeles International Airport"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">País</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
              placeholder="Estados Unidos"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Región</label>
            <select
              value={formData.region_name}
              onChange={(e) => setFormData({ ...formData, region_name: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
            >
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="airport_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="airport_is_active" className="text-gray-400">Activo</label>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80"
          >
            {mode === 'create' ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProviderModal({ mode, provider, onClose, onSave }: {
  mode: 'create' | 'edit';
  provider: Provider | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    code: provider?.code || '',
    transport_type: provider?.transport_type || 'FCL',
    contact_email: provider?.contact_email || '',
    priority: provider?.priority || 5,
    is_active: provider?.is_active ?? true,
  });

  const transportTypes = [
    { value: 'FCL', label: 'Marítimo FCL' },
    { value: 'LCL', label: 'Marítimo LCL' },
    { value: 'AEREO', label: 'Aéreo' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0D2E4D] rounded-xl p-6 w-full max-w-md border border-[#1E4A6D]">
        <h3 className="text-xl font-bold text-white mb-4">
          {mode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Nombre del Proveedor</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
              placeholder="Mediterranean Shipping Company"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Código</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
              placeholder="MSC"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Tipo de Transporte</label>
            <select
              value={formData.transport_type}
              onChange={(e) => setFormData({ ...formData, transport_type: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
            >
              {transportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email de Contacto</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
              placeholder="ventas@proveedor.com"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Prioridad (1-10)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.priority}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') return;
                const parsed = parseInt(val);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
                  setFormData({ ...formData, priority: parsed });
                }
              }}
              className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="provider_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="provider_is_active" className="text-gray-400">Activo</label>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80"
          >
            {mode === 'create' ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TrackingTemplatesSection() {
  const [uploading, setUploading] = useState(false);
  const [downloadingEmpty, setDownloadingEmpty] = useState(false);
  const [downloadingActive, setDownloadingActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    updated: number;
    errors: string[];
    warnings: string[];
    details: string[];
  } | null>(null);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [stats, setStats] = useState<{
    active_shipments: number;
    total_milestones: number;
    completed_milestones: number;
    pending_milestones: number;
  } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('masterAdminToken');
      const response = await fetch('/api/sales/tracking-templates/stats/', {
        headers: {
          'X-Master-Admin-Token': token || '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleDownloadEmpty = async () => {
    setDownloadingEmpty(true);
    try {
      const token = localStorage.getItem('masterAdminToken');
      const response = await fetch('/api/sales/tracking-templates/download-empty/', {
        headers: {
          'X-Master-Admin-Token': token || '',
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracking_template_vacio_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error('Error downloading template:', err);
    } finally {
      setDownloadingEmpty(false);
    }
  };

  const handleDownloadActive = async () => {
    setDownloadingActive(true);
    try {
      const token = localStorage.getItem('masterAdminToken');
      const response = await fetch('/api/sales/tracking-templates/download-active/', {
        headers: {
          'X-Master-Admin-Token': token || '',
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracking_embarques_activos_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error('Error downloading template:', err);
    } finally {
      setDownloadingActive(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('send_notifications', String(sendNotifications));

    try {
      const token = localStorage.getItem('masterAdminToken');
      const response = await fetch('/api/sales/tracking-templates/upload/', {
        method: 'POST',
        headers: {
          'X-Master-Admin-Token': token || '',
        },
        body: formData,
      });
      const result = await response.json();
      setUploadResult(result);
      if (result.updated > 0) {
        loadStats();
      }
    } catch (err) {
      console.error('Error uploading template:', err);
      setUploadResult({
        success: false,
        updated: 0,
        errors: ['Error al procesar el archivo'],
        warnings: [],
        details: [],
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Plantillas de Tracking</h2>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4">
            <p className="text-gray-400 text-sm">Embarques Activos</p>
            <p className="text-3xl font-bold text-[#00C9B7]">{stats.active_shipments}</p>
          </div>
          <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4">
            <p className="text-gray-400 text-sm">Total Hitos</p>
            <p className="text-3xl font-bold text-white">{stats.total_milestones}</p>
          </div>
          <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4">
            <p className="text-gray-400 text-sm">Hitos Completados</p>
            <p className="text-3xl font-bold text-[#A4FF00]">{stats.completed_milestones}</p>
          </div>
          <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4">
            <p className="text-gray-400 text-sm">Hitos Pendientes</p>
            <p className="text-3xl font-bold text-amber-400">{stats.pending_milestones}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-6">
          <h3 className="text-lg font-bold text-white mb-4">Descargar Plantillas</h3>
          <p className="text-gray-400 text-sm mb-6">
            Descarga plantillas Excel para que el freight forwarder pueda actualizar el tracking de los embarques.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleDownloadEmpty}
              disabled={downloadingEmpty}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80 disabled:opacity-50"
            >
              {downloadingEmpty ? (
                <span className="animate-spin">...</span>
              ) : (
                <>
                  <span>📄</span>
                  Plantilla Vacia
                </>
              )}
            </button>
            <button
              onClick={handleDownloadActive}
              disabled={downloadingActive}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 disabled:opacity-50"
            >
              {downloadingActive ? (
                <span className="animate-spin">...</span>
              ) : (
                <>
                  <span>📦</span>
                  Con Embarques Activos
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-6">
          <h3 className="text-lg font-bold text-white mb-4">Subir Plantilla Actualizada</h3>
          <p className="text-gray-400 text-sm mb-4">
            Sube la plantilla Excel con los datos actualizados del freight forwarder para actualizar el tracking.
          </p>
          
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="send_notifs"
              checked={sendNotifications}
              onChange={(e) => setSendNotifications(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="send_notifs" className="text-gray-400 text-sm">
              Enviar notificaciones a usuarios
            </label>
          </div>

          <label className={`
            flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors
            ${uploading ? 'border-[#00C9B7] bg-[#00C9B7]/10' : 'border-[#1E4A6D] hover:border-[#00C9B7] hover:bg-[#0A2540]'}
          `}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <div className="animate-spin text-[#00C9B7] text-2xl">⏳</div>
              ) : (
                <>
                  <span className="text-3xl mb-2">📤</span>
                  <p className="text-sm text-gray-400">
                    <span className="text-[#00C9B7]">Clic para subir</span> archivo Excel
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {uploadResult && (
        <div className={`
          rounded-xl border p-6
          ${uploadResult.success && uploadResult.updated > 0
            ? 'bg-green-900/30 border-green-600'
            : uploadResult.errors.length > 0
              ? 'bg-red-900/30 border-red-600'
              : 'bg-yellow-900/30 border-yellow-600'}
        `}>
          <h3 className={`
            text-lg font-bold mb-4
            ${uploadResult.success ? 'text-green-400' : 'text-red-400'}
          `}>
            {uploadResult.success ? 'Carga Exitosa' : 'Errores en la Carga'}
          </h3>
          
          <p className="text-white mb-4">
            Se actualizaron <span className="font-bold text-[#A4FF00]">{uploadResult.updated}</span> hitos
          </p>

          {uploadResult.details.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Detalles:</p>
              <ul className="text-green-300 text-sm space-y-1 max-h-32 overflow-auto">
                {uploadResult.details.map((d, i) => (
                  <li key={i}>✓ {d}</li>
                ))}
              </ul>
            </div>
          )}

          {uploadResult.warnings.length > 0 && (
            <div className="mb-4">
              <p className="text-yellow-400 text-sm mb-2">Advertencias:</p>
              <ul className="text-yellow-300 text-sm space-y-1">
                {uploadResult.warnings.map((w, i) => (
                  <li key={i}>⚠ {w}</li>
                ))}
              </ul>
            </div>
          )}

          {uploadResult.errors.length > 0 && (
            <div>
              <p className="text-red-400 text-sm mb-2">Errores:</p>
              <ul className="text-red-300 text-sm space-y-1">
                {uploadResult.errors.map((e, i) => (
                  <li key={i}>✗ {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Instrucciones</h3>
        <ol className="list-decimal list-inside text-gray-400 text-sm space-y-2">
          <li>Descarga la plantilla con los embarques activos</li>
          <li>Envia la plantilla al freight forwarder para que complete la informacion</li>
          <li>El freight forwarder actualiza las columnas: Estado, Fecha Real, Notas, Booking, Container, BL</li>
          <li>Sube la plantilla actualizada para sincronizar los datos en el sistema</li>
          <li>Si la opcion de notificaciones esta activa, los usuarios recibiran alertas automaticamente</li>
        </ol>
      </div>
    </div>
  );
}
