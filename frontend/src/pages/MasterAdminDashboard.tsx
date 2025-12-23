import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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
  ruc_status: string | null;
}

interface UserFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  ruc_status: 'all' | 'approved' | 'pending' | 'rejected';
  date_from: string;
  date_to: string;
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

interface MonthlyProfit {
  month: string;
  profit: number;
  count: number;
}

interface TransportBreakdown {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ProfitData {
  resumen: {
    total_ros: number;
    ingresos_totales_usd: number;
    costos_totales_usd: number;
    margen_total_usd: number;
    margen_promedio_porcentaje: number;
    promedio_profit_por_cotizacion: number;
  };
  charts: {
    monthly_profits: MonthlyProfit[];
    transport_breakdown: TransportBreakdown[];
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
  id: number;
  action_type: string;
  action_type_display: string;
  level: string;
  message: string;
  user_id: number | null;
  user_email: string;
  ip_address: string | null;
  related_object_type: string;
  related_object_id: number | null;
  created_at: string | null;
}

interface LogFilters {
  search: string;
  action_type: string;
  level: string;
  date_from: string;
  date_to: string;
  user_id: string;
}

interface LogFilterOptions {
  action_types: Array<{ value: string; label: string }>;
  levels: Array<{ value: string; label: string }>;
}

interface LogsPagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
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

interface RUCApprovalHistoryItem {
  id: number;
  ruc_number: string;
  company_name: string;
  user_email: string;
  user_name: string;
  action: 'approved' | 'rejected';
  action_display: string;
  admin_notes: string;
  performed_at: string;
}

type ActiveTab = 'dashboard' | 'users' | 'cotizaciones' | 'rates' | 'profit' | 'logs' | 'ports' | 'airports' | 'providers' | 'ruc_approvals' | 'tracking' | 'pending_ff' | 'ff_portal' | 'ff_config' | 'arancel' | 'tracking_templates';

interface TrackingTemplateItem {
  id: number;
  transport_type: 'FCL' | 'LCL' | 'AIR';
  milestone_name: string;
  milestone_order: number;
  is_active: boolean;
  description: string;
  created_at: string | null;
  updated_at: string | null;
}

interface TrackingTemplatesData {
  templates: {
    FCL: TrackingTemplateItem[];
    LCL: TrackingTemplateItem[];
    AIR: TrackingTemplateItem[];
  };
  counts: {
    FCL: number;
    LCL: number;
    AIR: number;
    total: number;
  };
}

interface HSCodeEntry {
  id: number;
  hs_code: string;
  description: string;
  description_en: string;
  category: string;
  chapter: string;
  ad_valorem_rate: number;
  ice_rate: number;
  unit: string;
  requires_permit: boolean;
  permit_institution: string;
  permit_name: string;
  permit_processing_days: string;
  keywords: string;
  notes: string;
  is_active: boolean;
}

interface UserDetail {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    whatsapp: string;
    company_name: string;
    city: string;
    country: string;
    role: string;
    platform: string;
    is_active: boolean;
    is_email_verified: boolean;
    date_joined: string;
    last_login: string | null;
  };
  profile: Record<string, unknown> | null;
  rucs: Array<{
    id: number;
    ruc: string;
    company_name: string;
    is_primary: boolean;
    status: string;
    justification: string;
    is_oce_registered: boolean;
    created_at: string;
  }>;
  stats: {
    total_cotizaciones: number;
    cotizaciones_aprobadas: number;
    total_ros: number;
    total_shipments: number;
    shipments_arribados: number;
    total_preliquidations: number;
  };
  cotizaciones: Array<Record<string, unknown>>;
  shipping_instructions: Array<Record<string, unknown>>;
  routing_orders: Array<Record<string, unknown>>;
  shipments: Array<Record<string, unknown>>;
  preliquidations: Array<Record<string, unknown>>;
}

interface FFGlobalConfig {
  assignment_mode: 'single' | 'multi' | 'manual';
  assignment_mode_display: string;
  default_ff_id: number | null;
  default_ff_name: string | null;
  auto_assign_on_ro: boolean;
  notes: string;
  updated_at: string;
}

interface FFRouteAssignment {
  id: number;
  ff_id: number;
  ff_name: string;
  transport_type: string;
  transport_type_display: string;
  origin_country: string;
  origin_port: string;
  destination_city: string;
  carrier_name: string;
  priority: number;
  is_active: boolean;
  notes: string;
}

interface AvailableFF {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  is_verified: boolean;
}

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

interface AssignedRO {
  id: number;
  ro_number: string;
  consignee_name: string;
  status: string;
  created_at: string | null;
  assigned_ff_id: number;
  assigned_ff_email: string;
  assigned_ff_company: string;
  ff_assignment_date: string | null;
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

type RateApiType = 'freight' | 'insurance' | 'customs' | 'inland' | 'brokerage';

interface FreightRateData {
  id?: number;
  origin_country: string;
  origin_port: string;
  destination_country: string;
  destination_port: string;
  transport_type: string;
  transport_type_display?: string;
  rate_usd: number;
  unit: string;
  unit_display?: string;
  min_rate_usd: number | null;
  carrier_name: string;
  transit_days_min: number | null;
  transit_days_max: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string;
  created_at?: string;
}

interface InsuranceRateData {
  id?: number;
  name: string;
  coverage_type: string;
  coverage_type_display?: string;
  rate_percentage: number;
  min_premium_usd: number;
  deductible_percentage: number;
  insurance_company: string;
  policy_number: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string;
  created_at?: string;
}

interface CustomsRateData {
  id?: number;
  hs_code: string;
  description: string;
  ad_valorem_percentage: number;
  iva_percentage: number;
  fodinfa_percentage: number;
  ice_percentage: number;
  salvaguardia_percentage: number;
  specific_duty_usd: number;
  specific_duty_unit: string;
  requires_import_license: boolean;
  requires_phytosanitary: boolean;
  requires_inen_certification: boolean;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string;
  created_at?: string;
}

interface InlandRateData {
  id?: number;
  origin_city: string;
  destination_city: string;
  vehicle_type: string;
  vehicle_type_display?: string;
  rate_usd: number;
  rate_per_kg_usd: number | null;
  estimated_hours: number | null;
  distance_km: number | null;
  includes_loading: boolean;
  includes_unloading: boolean;
  carrier_name: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string;
  created_at?: string;
}

interface BrokerageRateData {
  id?: number;
  name: string;
  service_type: string;
  service_type_display?: string;
  fixed_rate_usd: number;
  percentage_rate: number;
  min_rate_usd: number;
  includes_aforo: boolean;
  includes_transmision: boolean;
  includes_almacenaje: boolean;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string;
  created_at?: string;
}

type RateData = FreightRateData | InsuranceRateData | CustomsRateData | InlandRateData | BrokerageRateData;

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

interface QuoteLineItem {
  id: number;
  categoria: string;
  categoria_display: string;
  descripcion: string;
  cantidad: number;
  precio_unitario_usd: number;
  subtotal_usd: number;
  es_estimado: boolean;
  notas: string;
}

interface QuoteScenario {
  id: number;
  nombre: string;
  tipo: string;
  tipo_transporte: string;
  total_usd: number;
  is_selected: boolean;
  lineas: QuoteLineItem[];
}

interface QuoteDocument {
  id: number;
  type: string;
  type_display: string;
  file_name: string;
  file_url: string | null;
  uploaded_at: string | null;
  source: string;
}

interface QuoteDetail {
  cotizacion: {
    id: number;
    numero_cotizacion: string;
    estado: string;
    tipo_carga: string;
    origen_pais: string;
    origen_ciudad: string;
    destino_ciudad: string;
    incoterm: string;
    descripcion_mercancia: string;
    peso_kg: number;
    volumen_cbm: number;
    valor_mercancia_usd: number;
    requiere_seguro: boolean;
    requiere_transporte_interno: boolean;
    notas_adicionales: string;
    ro_number: string | null;
    shipper_name: string;
    shipper_address: string;
    consignee_name: string;
    consignee_address: string;
    notify_party: string;
    fecha_embarque_estimada: string | null;
    fecha_creacion: string;
    fecha_actualizacion: string;
    fecha_aprobacion: string | null;
  };
  customer: {
    id: number | null;
    name: string;
    email: string;
    company: string;
    phone: string;
    city: string;
    country: string;
    ruc: string;
  };
  costs: {
    flete_usd: number;
    seguro_usd: number;
    aduana_usd: number;
    transporte_interno_usd: number;
    otros_usd: number;
    total_usd: number;
  };
  scenarios: QuoteScenario[];
  documents: QuoteDocument[];
}

export default function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userFilters, setUserFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    ruc_status: 'all',
    date_from: '',
    date_to: ''
  });
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilters, setLogFilters] = useState<LogFilters>({
    search: '',
    action_type: '',
    level: '',
    date_from: '',
    date_to: '',
    user_id: ''
  });
  const [logFilterOptions, setLogFilterOptions] = useState<LogFilterOptions>({
    action_types: [],
    levels: []
  });
  const [logsPagination, setLogsPagination] = useState<LogsPagination>({
    page: 1,
    page_size: 50,
    total_count: 0,
    total_pages: 1
  });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [ports, setPorts] = useState<Port[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerRates, setProviderRates] = useState<ProviderRate[]>([]);
  const [pendingRucs, setPendingRucs] = useState<PendingRUC[]>([]);
  const [processingRuc, setProcessingRuc] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deletingRuc, setDeletingRuc] = useState<number | null>(null);
  const [showRucHistoryModal, setShowRucHistoryModal] = useState(false);
  const [rucHistory, setRucHistory] = useState<RUCApprovalHistoryItem[]>([]);
  const [rucHistoryPage, setRucHistoryPage] = useState(1);
  const [rucHistoryTotalPages, setRucHistoryTotalPages] = useState(1);
  const [loadingRucHistory, setLoadingRucHistory] = useState(false);
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
  const [assignedROs, setAssignedROs] = useState<AssignedRO[]>([]);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedReassignRO, setSelectedReassignRO] = useState<AssignedRO | null>(null);
  const [reassignNotify, setReassignNotify] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', company_name: '', days_valid: '7' });
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailTab, setUserDetailTab] = useState<'info' | 'cotizaciones' | 'shipping' | 'ros' | 'shipments' | 'preliq'>('info');
  const [editingUser, setEditingUser] = useState(false);
  const [userEditForm, setUserEditForm] = useState<Record<string, string>>({});
  const [ffGlobalConfig, setFFGlobalConfig] = useState<FFGlobalConfig | null>(null);
  const [ffRouteAssignments, setFFRouteAssignments] = useState<FFRouteAssignment[]>([]);
  const [availableFFs, setAvailableFFs] = useState<AvailableFF[]>([]);
  const [loadingFFConfig, setLoadingFFConfig] = useState(false);
  const [showRouteAssignmentModal, setShowRouteAssignmentModal] = useState(false);
  const [editingRouteAssignment, setEditingRouteAssignment] = useState<FFRouteAssignment | null>(null);
  const [routeAssignmentForm, setRouteAssignmentForm] = useState({
    ff_id: '',
    transport_type: '',
    origin_country: '',
    origin_port: '',
    destination_city: '',
    carrier_name: '',
    priority: '1',
    notes: ''
  });
  const [savingFFConfig, setSavingFFConfig] = useState(false);
  const [hsCodes, setHsCodes] = useState<HSCodeEntry[]>([]);
  const [hsCodesPage, setHsCodesPage] = useState(1);
  const [hsCodesTotalPages, setHsCodesTotalPages] = useState(1);
  const [hsCodesSearch, setHsCodesSearch] = useState('');
  const [hsCategoryFilter, setHsCategoryFilter] = useState('');
  const [hsCategories, setHsCategories] = useState<string[]>([]);
  const [hsShowInactive, setHsShowInactive] = useState(false);
  const [showHsCodeModal, setShowHsCodeModal] = useState(false);
  const [hsCodeModalMode, setHsCodeModalMode] = useState<'create' | 'edit'>('create');
  const [editingHsCode, setEditingHsCode] = useState<HSCodeEntry | null>(null);
  const [showHsImportModal, setShowHsImportModal] = useState(false);
  const [hsImportUploading, setHsImportUploading] = useState(false);
  const [hsCodeForm, setHsCodeForm] = useState({
    hs_code: '',
    description: '',
    description_en: '',
    category: '',
    chapter: '',
    ad_valorem_rate: '',
    ice_rate: '',
    unit: 'kg',
    requires_permit: false,
    permit_institution: '',
    permit_name: '',
    permit_processing_days: '',
    keywords: '',
    notes: ''
  });
  const [trackingTemplatesData, setTrackingTemplatesData] = useState<TrackingTemplatesData | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<'create' | 'edit'>('create');
  const [editingTemplate, setEditingTemplate] = useState<TrackingTemplateItem | null>(null);
  const [templateForm, setTemplateForm] = useState({
    transport_type: 'FCL' as 'FCL' | 'LCL' | 'AIR',
    milestone_name: '',
    description: '',
    is_active: true
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateModalMode, setRateModalMode] = useState<'create' | 'edit'>('create');
  const [editingRate, setEditingRate] = useState<RateData | null>(null);
  const [savingRate, setSavingRate] = useState(false);
  const [rateSearch, setRateSearch] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetail | null>(null);
  const [loadingQuoteDetail, setLoadingQuoteDetail] = useState(false);
  const [quoteDetailTab, setQuoteDetailTab] = useState<'resumen' | 'lineas' | 'costos' | 'documentos'>('resumen');
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

  const loadUsers = useCallback(async (filters?: UserFilters) => {
    try {
      const params = new URLSearchParams();
      const f = filters || userFilters;
      
      if (f.search) params.append('search', f.search);
      if (f.status !== 'all') params.append('status', f.status);
      if (f.ruc_status !== 'all') params.append('ruc_status', f.ruc_status);
      if (f.date_from) params.append('date_from', f.date_from);
      if (f.date_to) params.append('date_to', f.date_to);
      
      const queryString = params.toString();
      const endpoint = queryString ? `/users/?${queryString}` : '/users/';
      const data = await fetchWithAuth(endpoint);
      setUsers(data.users || []);
    } catch {
      setError('Error cargando usuarios');
    }
  }, [fetchWithAuth, userFilters]);

  const loadCotizaciones = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/cotizaciones/');
      setCotizaciones(data.cotizaciones || []);
    } catch {
      setError('Error cargando cotizaciones');
    }
  }, [fetchWithAuth]);

  const loadQuoteDetail = async (quoteId: number) => {
    setLoadingQuoteDetail(true);
    setQuoteDetailTab('resumen');
    try {
      const data = await fetchWithAuth(`/cotizaciones/${quoteId}/`);
      if (data.success) {
        setSelectedQuote(data);
        setShowQuoteModal(true);
      } else {
        setError(data.error || 'Error cargando detalle de cotización');
      }
    } catch {
      setError('Error cargando detalle de cotización');
    } finally {
      setLoadingQuoteDetail(false);
    }
  };

  const loadProfit = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/profit-review/');
      setProfit(data);
    } catch {
      setError('Error cargando profit review');
    }
  }, [fetchWithAuth]);

  const loadLogs = useCallback(async (page: number = 1, filters?: LogFilters) => {
    setLoadingLogs(true);
    try {
      const f = filters || logFilters;
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (f.search) params.append('search', f.search);
      if (f.action_type) params.append('action_type', f.action_type);
      if (f.level) params.append('level', f.level);
      if (f.date_from) params.append('date_from', f.date_from);
      if (f.date_to) params.append('date_to', f.date_to);
      if (f.user_id) params.append('user_id', f.user_id);
      
      const data = await fetchWithAuth(`/logs/?${params.toString()}`);
      setLogs(data.logs || []);
      setLogsPagination(data.pagination || { page: 1, page_size: 50, total_count: 0, total_pages: 1 });
      if (data.filters) {
        setLogFilterOptions({
          action_types: data.filters.action_types || [],
          levels: data.filters.levels || []
        });
      }
    } catch {
      setError('Error cargando logs');
    } finally {
      setLoadingLogs(false);
    }
  }, [fetchWithAuth, logFilters]);

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

  const loadRucHistory = useCallback(async (page: number = 1) => {
    setLoadingRucHistory(true);
    try {
      const data = await fetchWithAuth(`/ruc-history/?page=${page}&page_size=10`);
      if (data.success) {
        setRucHistory(data.history || []);
        setRucHistoryTotalPages(data.total_pages || 1);
        setRucHistoryPage(page);
      }
    } catch {
      setError('Error cargando historial de aprobaciones RUC');
    } finally {
      setLoadingRucHistory(false);
    }
  }, [fetchWithAuth]);

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
        setAssignedROs(assignmentsRes.assigned_ros || []);
      }
    } catch {
      setError('Error cargando datos del portal FF');
    }
  }, [fetchWithAuth]);

  const loadUserDetail = useCallback(async (userId: number) => {
    setLoadingUserDetail(true);
    try {
      const data = await fetchWithAuth(`/users/${userId}/`);
      setSelectedUserDetail(data);
      setShowUserDetailModal(true);
      setUserDetailTab('info');
    } catch {
      setError('Error cargando detalles del usuario');
    } finally {
      setLoadingUserDetail(false);
    }
  }, [fetchWithAuth]);

  const loadFFConfigData = useCallback(async () => {
    setLoadingFFConfig(true);
    try {
      const data = await fetchWithAuth('/ff-config/');
      setFFGlobalConfig(data.global_config || null);
      setFFRouteAssignments(data.route_assignments || []);
      setAvailableFFs(data.available_ffs || []);
    } catch {
      setError('Error cargando configuración FF');
    } finally {
      setLoadingFFConfig(false);
    }
  }, [fetchWithAuth]);

  const loadHsCodes = useCallback(async (page = 1, search = '', category = '', includeInactive = false) => {
    try {
      let endpoint = `/hs-codes/?page=${page}`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;
      if (category) endpoint += `&category=${encodeURIComponent(category)}`;
      if (includeInactive) endpoint += `&include_inactive=true`;
      const data = await fetchWithAuth(endpoint);
      setHsCodes(data.entries || data.results || data.hs_codes || []);
      setHsCodesTotalPages(data.pages || data.total_pages || Math.ceil((data.total || data.count || 0) / 50) || 1);
      if (data.categories) {
        setHsCategories(data.categories);
      }
    } catch {
      setError('Error cargando partidas arancelarias');
    }
  }, [fetchWithAuth]);

  const loadTrackingTemplates = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/tracking-templates/');
      if (data.success) {
        setTrackingTemplatesData(data);
      }
    } catch {
      setError('Error cargando plantillas de tracking');
    }
  }, [fetchWithAuth]);

  const handleSaveTemplate = async () => {
    if (!templateForm.milestone_name) {
      setError('Nombre del hito es requerido');
      return;
    }
    setSavingTemplate(true);
    try {
      const body = {
        ...templateForm,
        ...(templateModalMode === 'edit' && editingTemplate ? { id: editingTemplate.id } : {})
      };
      const result = await fetchWithAuth('/tracking-templates/', {
        method: templateModalMode === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(body),
      });
      if (result.success) {
        setSuccess(templateModalMode === 'create' ? 'Hito creado exitosamente' : 'Hito actualizado exitosamente');
        setShowTemplateModal(false);
        setTemplateForm({ transport_type: 'FCL', milestone_name: '', description: '', is_active: true });
        setEditingTemplate(null);
        loadTrackingTemplates();
      } else {
        setError(result.error || 'Error guardando hito');
      }
    } catch {
      setError('Error guardando hito');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este hito?')) return;
    try {
      const result = await fetchWithAuth(`/tracking-templates/?id=${id}`, { method: 'DELETE' });
      if (result.success) {
        setSuccess('Hito eliminado');
        loadTrackingTemplates();
      } else {
        setError(result.error || 'Error eliminando hito');
      }
    } catch {
      setError('Error eliminando hito');
    }
  };

  const handleToggleTemplateActive = async (template: TrackingTemplateItem) => {
    try {
      const result = await fetchWithAuth('/tracking-templates/', {
        method: 'PUT',
        body: JSON.stringify({ id: template.id, is_active: !template.is_active }),
      });
      if (result.success) {
        loadTrackingTemplates();
      }
    } catch {
      setError('Error actualizando estado');
    }
  };

  const handleMoveTemplate = async (template: TrackingTemplateItem, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? template.milestone_order - 1 : template.milestone_order + 1;
    if (newOrder < 1) return;
    try {
      const result = await fetchWithAuth('/tracking-templates/', {
        method: 'PUT',
        body: JSON.stringify({ id: template.id, milestone_order: newOrder }),
      });
      if (result.success) {
        loadTrackingTemplates();
      }
    } catch {
      setError('Error reordenando hito');
    }
  };

  const openCreateTemplateModal = (transportType: 'FCL' | 'LCL' | 'AIR') => {
    setTemplateModalMode('create');
    setEditingTemplate(null);
    setTemplateForm({ transport_type: transportType, milestone_name: '', description: '', is_active: true });
    setShowTemplateModal(true);
  };

  const openEditTemplateModal = (template: TrackingTemplateItem) => {
    setTemplateModalMode('edit');
    setEditingTemplate(template);
    setTemplateForm({
      transport_type: template.transport_type,
      milestone_name: template.milestone_name,
      description: template.description || '',
      is_active: template.is_active
    });
    setShowTemplateModal(true);
  };

  const handleSaveHsCode = async () => {
    if (!hsCodeForm.hs_code || !hsCodeForm.description) {
      setError('Código HS y descripción son requeridos');
      return;
    }
    
    try {
      const body = {
        ...hsCodeForm,
        ad_valorem_rate: parseFloat(hsCodeForm.ad_valorem_rate) || 0,
        ice_rate: parseFloat(hsCodeForm.ice_rate) || 0,
        ...(hsCodeModalMode === 'edit' && editingHsCode ? { id: editingHsCode.id } : {})
      };
      
      const result = await fetchWithAuth('/hs-codes/', {
        method: hsCodeModalMode === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(body),
      });
      
      if (result.success) {
        setSuccess(hsCodeModalMode === 'create' ? 'Partida creada exitosamente' : 'Partida actualizada exitosamente');
        setShowHsCodeModal(false);
        resetHsCodeForm();
        loadHsCodes(hsCodesPage, hsCodesSearch, hsCategoryFilter, hsShowInactive);
      } else {
        setError(result.error || 'Error guardando partida');
      }
    } catch {
      setError('Error guardando partida');
    }
  };

  const handleDeleteHsCode = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta partida arancelaria?')) return;
    try {
      const result = await fetchWithAuth(`/hs-codes/?id=${id}`, { method: 'DELETE' });
      if (result.success) {
        setSuccess('Partida eliminada');
        loadHsCodes(hsCodesPage, hsCodesSearch, hsCategoryFilter, hsShowInactive);
      } else {
        setError(result.error || 'Error eliminando partida');
      }
    } catch {
      setError('Error eliminando partida');
    }
  };

  const handleHsCodeImport = async (file: File) => {
    setHsImportUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = getToken();
      const response = await fetch(`${API_BASE}/hs-codes/import/`, {
        method: 'POST',
        headers: {
          'X-Master-Admin-Token': token || '',
        },
        body: formData,
      });
      
      const result = await response.json();
      if (response.ok && result.success) {
        setSuccess(`Importación exitosa: ${result.imported || 0} partidas importadas`);
        setShowHsImportModal(false);
        loadHsCodes(1, '', '', hsShowInactive);
      } else {
        setError(result.error || 'Error en la importación');
      }
    } catch {
      setError('Error procesando archivo');
    } finally {
      setHsImportUploading(false);
    }
  };

  const resetHsCodeForm = () => {
    setHsCodeForm({
      hs_code: '',
      description: '',
      description_en: '',
      category: '',
      chapter: '',
      ad_valorem_rate: '',
      ice_rate: '',
      unit: 'kg',
      requires_permit: false,
      permit_institution: '',
      permit_name: '',
      permit_processing_days: '',
      keywords: '',
      notes: ''
    });
    setEditingHsCode(null);
  };

  const openHsCodeCreateModal = () => {
    resetHsCodeForm();
    setHsCodeModalMode('create');
    setShowHsCodeModal(true);
  };

  const openHsCodeEditModal = (entry: HSCodeEntry) => {
    setEditingHsCode(entry);
    setHsCodeForm({
      hs_code: entry.hs_code,
      description: entry.description,
      description_en: entry.description_en || '',
      category: entry.category || '',
      chapter: entry.chapter || '',
      ad_valorem_rate: String(entry.ad_valorem_rate || ''),
      ice_rate: String(entry.ice_rate || ''),
      unit: entry.unit || 'kg',
      requires_permit: entry.requires_permit || false,
      permit_institution: entry.permit_institution || '',
      permit_name: entry.permit_name || '',
      permit_processing_days: entry.permit_processing_days || '',
      keywords: entry.keywords || '',
      notes: entry.notes || ''
    });
    setHsCodeModalMode('edit');
    setShowHsCodeModal(true);
  };

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

  const revokeFFInvitation = async (invitationId: number, email: string) => {
    if (!confirm(`¿Está seguro que desea revocar la invitación para ${email}?`)) {
      return;
    }
    
    try {
      const result = await fetchWithAuth(`/ff-invitations/?id=${invitationId}`, {
        method: 'DELETE',
      });
      
      if (result.success) {
        setSuccess(result.message || `Invitación para ${email} revocada exitosamente`);
        loadFFPortalData();
      } else {
        setError(result.error || 'Error revocando invitación');
      }
    } catch {
      setError('Error revocando invitación');
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

  const reassignROToFF = async (roId: number, newFFUserId: number, notify: boolean) => {
    try {
      const result = await fetchWithAuth('/ff-assignments/', {
        method: 'PUT',
        body: JSON.stringify({ ro_id: roId, new_ff_user_id: newFFUserId, notify }),
      });
      
      if (result.success) {
        setSuccess(result.message);
        setShowReassignModal(false);
        setSelectedReassignRO(null);
        setReassignNotify(true);
        loadFFPortalData();
      } else {
        setError(result.error || 'Error reasignando RO');
      }
    } catch {
      setError('Error reasignando RO');
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

  const handleDeleteRuc = async (rucId: number, rucNumber: string, companyName: string) => {
    const confirmed = confirm(`¿Está seguro que desea ELIMINAR permanentemente el RUC ${rucNumber} de "${companyName}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmed) return;
    
    setDeletingRuc(rucId);
    try {
      const token = getToken();
      const response = await fetch(`/api/accounts/admin/ruc-approvals/${rucId}/`, {
        method: 'DELETE',
        headers: {
          'X-Master-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setSuccess('RUC eliminado permanentemente');
        loadPendingRucs();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error eliminando RUC');
      }
    } catch {
      setError('Error eliminando RUC');
    } finally {
      setDeletingRuc(null);
    }
  };

  const getRateApiType = (type: RateViewType): RateApiType | null => {
    const mapping: Record<string, RateApiType> = {
      flete: 'freight',
      seguro: 'insurance',
      aranceles: 'customs',
      transporte: 'inland',
      agenciamiento: 'brokerage',
    };
    return type ? mapping[type] || null : null;
  };

  const loadRatesByType = async (type: RateViewType, search?: string) => {
    if (!type) return;
    setLoadingRates(true);
    setSelectedRateView(type);
    try {
      const apiType = getRateApiType(type);
      let endpoint = `/rates/?type=${apiType}`;
      if (search) {
        endpoint += `&search=${encodeURIComponent(search)}`;
      }
      const data = await fetchWithAuth(endpoint);
      setRateData(data.rates || []);
    } catch {
      setRateData([]);
      setError('Error cargando tarifas');
    } finally {
      setLoadingRates(false);
    }
  };

  const getDefaultRateData = (type: RateViewType): RateData => {
    const apiType = getRateApiType(type);
    switch (apiType) {
      case 'freight':
        return {
          origin_country: '',
          origin_port: '',
          destination_country: 'Ecuador',
          destination_port: 'Guayaquil',
          transport_type: 'maritimo_fcl',
          rate_usd: 0,
          unit: 'contenedor_20',
          min_rate_usd: null,
          carrier_name: '',
          transit_days_min: null,
          transit_days_max: null,
          valid_from: null,
          valid_until: null,
          is_active: true,
          notes: '',
        } as FreightRateData;
      case 'insurance':
        return {
          name: '',
          coverage_type: 'basico',
          rate_percentage: 0.35,
          min_premium_usd: 25,
          deductible_percentage: 0,
          insurance_company: '',
          policy_number: '',
          valid_from: null,
          valid_until: null,
          is_active: true,
          notes: '',
        } as InsuranceRateData;
      case 'customs':
        return {
          hs_code: '',
          description: '',
          ad_valorem_percentage: 0,
          iva_percentage: 15,
          fodinfa_percentage: 0.5,
          ice_percentage: 0,
          salvaguardia_percentage: 0,
          specific_duty_usd: 0,
          specific_duty_unit: '',
          requires_import_license: false,
          requires_phytosanitary: false,
          requires_inen_certification: false,
          valid_from: null,
          valid_until: null,
          is_active: true,
          notes: '',
        } as CustomsRateData;
      case 'inland':
        return {
          origin_city: 'Guayaquil',
          destination_city: '',
          vehicle_type: 'camion_8t',
          rate_usd: 0,
          rate_per_kg_usd: null,
          estimated_hours: null,
          distance_km: null,
          includes_loading: false,
          includes_unloading: false,
          carrier_name: '',
          valid_from: null,
          valid_until: null,
          is_active: true,
          notes: '',
        } as InlandRateData;
      case 'brokerage':
        return {
          name: '',
          service_type: 'importacion_general',
          fixed_rate_usd: 150,
          percentage_rate: 0,
          min_rate_usd: 150,
          includes_aforo: true,
          includes_transmision: true,
          includes_almacenaje: false,
          valid_from: null,
          valid_until: null,
          is_active: true,
          notes: '',
        } as BrokerageRateData;
      default:
        return {} as RateData;
    }
  };

  const openCreateRateModal = () => {
    setRateModalMode('create');
    setEditingRate(getDefaultRateData(selectedRateView));
    setShowRateModal(true);
  };

  const openEditRateModal = (rate: RateData) => {
    setRateModalMode('edit');
    setEditingRate(rate);
    setShowRateModal(true);
  };

  const closeRateModal = () => {
    setShowRateModal(false);
    setEditingRate(null);
  };

  const handleSaveRate = async () => {
    if (!editingRate || !selectedRateView) return;
    setSavingRate(true);
    try {
      const apiType = getRateApiType(selectedRateView);
      const method = rateModalMode === 'create' ? 'POST' : 'PUT';
      const body: Record<string, unknown> = { type: apiType, data: editingRate };
      if (rateModalMode === 'edit' && editingRate.id) {
        body.id = editingRate.id;
      }
      
      await fetchWithAuth('/rates/', {
        method,
        body: JSON.stringify(body),
      });
      
      setSuccess(rateModalMode === 'create' ? 'Tarifa creada correctamente' : 'Tarifa actualizada correctamente');
      closeRateModal();
      loadRatesByType(selectedRateView);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando tarifa');
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeleteRate = async (rateId: number) => {
    if (!selectedRateView) return;
    const confirmed = confirm('¿Está seguro que desea eliminar esta tarifa? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    
    try {
      const apiType = getRateApiType(selectedRateView);
      await fetchWithAuth(`/rates/?type=${apiType}&id=${rateId}`, {
        method: 'DELETE',
      });
      setSuccess('Tarifa eliminada correctamente');
      loadRatesByType(selectedRateView);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando tarifa');
    }
  };

  const handleRateSearchSubmit = () => {
    if (selectedRateView) {
      loadRatesByType(selectedRateView, rateSearch);
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
    if (activeTab === 'logs') loadLogs(1, logFilters);
    if (activeTab === 'ports') loadPorts();
    if (activeTab === 'airports') loadAirports();
    if (activeTab === 'providers') {
      loadProviders();
      loadProviderRates();
    }
    if (activeTab === 'ruc_approvals') loadPendingRucs();
    if (activeTab === 'pending_ff') loadPendingFFQuotes();
    if (activeTab === 'ff_portal') loadFFPortalData();
    if (activeTab === 'ff_config') loadFFConfigData();
    if (activeTab === 'arancel') loadHsCodes(hsCodesPage, hsCodesSearch, hsCategoryFilter, hsShowInactive);
    if (activeTab === 'tracking_templates') loadTrackingTemplates();
  }, [activeTab, loadUsers, loadCotizaciones, loadProfit, loadLogs, loadPorts, loadAirports, loadProviders, loadProviderRates, loadPendingRucs, loadPendingFFQuotes, loadFFPortalData, loadFFConfigData, loadHsCodes, hsCodesPage, hsCodesSearch, hsCategoryFilter, hsShowInactive, loadTrackingTemplates]);

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

  const handleUpdateUser = async () => {
    if (!selectedUserDetail) return;
    try {
      const result = await fetchWithAuth(`/users/${selectedUserDetail.user.id}/`, {
        method: 'PUT',
        body: JSON.stringify(userEditForm),
      });
      if (result.success) {
        setSuccess('Usuario actualizado exitosamente');
        setEditingUser(false);
        loadUserDetail(selectedUserDetail.user.id);
        loadUsers();
      } else {
        setError(result.error || 'Error actualizando usuario');
      }
    } catch {
      setError('Error actualizando usuario');
    }
  };

  const handleDeactivateUser = async (userId: number, isActive: boolean) => {
    const action = isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro que desea ${action} este usuario?`)) return;
    try {
      const result = await fetchWithAuth(`/users/${userId}/`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (result.success) {
        setSuccess(`Usuario ${isActive ? 'desactivado' : 'activado'} exitosamente`);
        if (selectedUserDetail && selectedUserDetail.user.id === userId) {
          loadUserDetail(userId);
        }
        loadUsers();
      } else {
        setError(result.error || 'Error actualizando usuario');
      }
    } catch {
      setError('Error actualizando usuario');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('¿Está seguro que desea ELIMINAR permanentemente este usuario? Esta acción no se puede deshacer.')) return;
    try {
      const result = await fetchWithAuth(`/users/${userId}/`, { method: 'DELETE' });
      if (result.success) {
        setSuccess('Usuario eliminado permanentemente');
        setShowUserDetailModal(false);
        setSelectedUserDetail(null);
        loadUsers();
      } else {
        setError(result.error || 'Error eliminando usuario');
      }
    } catch {
      setError('Error eliminando usuario');
    }
  };

  const handleSaveFFConfig = async (configData: Partial<FFGlobalConfig>) => {
    setSavingFFConfig(true);
    try {
      const result = await fetchWithAuth('/ff-config/', {
        method: 'PUT',
        body: JSON.stringify(configData),
      });
      if (result.success) {
        setSuccess('Configuración FF guardada exitosamente');
        loadFFConfigData();
      } else {
        setError(result.error || 'Error guardando configuración');
      }
    } catch {
      setError('Error guardando configuración');
    } finally {
      setSavingFFConfig(false);
    }
  };

  const handleSaveRouteAssignment = async () => {
    try {
      const method = editingRouteAssignment ? 'PUT' : 'POST';
      const body = editingRouteAssignment 
        ? { ...routeAssignmentForm, id: editingRouteAssignment.id }
        : routeAssignmentForm;
      
      const result = await fetchWithAuth('/ff-config/', {
        method,
        body: JSON.stringify({ route_assignment: body }),
      });
      
      if (result.success) {
        setSuccess(editingRouteAssignment ? 'Asignación actualizada' : 'Asignación creada');
        setShowRouteAssignmentModal(false);
        setEditingRouteAssignment(null);
        setRouteAssignmentForm({
          ff_id: '',
          transport_type: '',
          origin_country: '',
          origin_port: '',
          destination_city: '',
          carrier_name: '',
          priority: '1',
          notes: ''
        });
        loadFFConfigData();
      } else {
        setError(result.error || 'Error guardando asignación');
      }
    } catch {
      setError('Error guardando asignación');
    }
  };

  const handleDeleteRouteAssignment = async (assignmentId: number) => {
    if (!confirm('¿Está seguro de eliminar esta asignación de ruta?')) return;
    try {
      const result = await fetchWithAuth(`/ff-config/?route_id=${assignmentId}`, { method: 'DELETE' });
      if (result.success) {
        setSuccess('Asignación eliminada');
        loadFFConfigData();
      } else {
        setError(result.error || 'Error eliminando asignación');
      }
    } catch {
      setError('Error eliminando asignación');
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
    { id: 'tracking_templates', label: 'Config Hitos', icon: '🎯' },
    { id: 'tracking', label: 'Tracking FF', icon: '📦' },
    { id: 'ff_portal', label: 'Portal FF', icon: '🔗' },
    { id: 'pending_ff', label: 'Cotizaciones FF', icon: '🚚' },
    { id: 'ff_config', label: 'Config FF', icon: '⚙️' },
    { id: 'arancel', label: 'Arancel', icon: '📋' },
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
      <header className="bg-[#0D2E4D] border-b border-[#1E4A6D] px-4 md:px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-[#1E4A6D] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MA</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-bold text-white">DASHBOARD MASTER ADMIN</h1>
              <p className="text-gray-400 text-xs md:text-sm">Panel de Control Total - ImportaYa.ia</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 md:px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm md:text-base"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex">
        <nav className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:relative
          top-[73px] md:top-0
          left-0
          w-56 
          bg-[#0D2E4D] 
          min-h-[calc(100vh-73px)] md:min-h-[calc(100vh-72px)]
          border-r border-[#1E4A6D] 
          p-4
          z-40
          transition-transform duration-300 ease-in-out
          overflow-y-auto
        `}>
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => { 
                    setActiveTab(tab.id as ActiveTab); 
                    setSearchTerm(''); 
                    setIsSidebarOpen(false);
                  }}
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

        <main className="flex-1 p-4 md:p-6 overflow-auto w-full">
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
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRucHistoryModal(true);
                      loadRucHistory(1);
                    }}
                    className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ver Historial
                  </button>
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
                        
                        <div className="flex flex-col gap-2 ml-4 md:ml-6">
                          <button
                            onClick={() => handleRucApproval(ruc.id, 'approve')}
                            disabled={processingRuc === ruc.id || deletingRuc === ruc.id}
                            className="px-4 md:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm md:text-base"
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
                            disabled={processingRuc === ruc.id || deletingRuc === ruc.id}
                            className="px-4 md:px-6 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm md:text-base"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleDeleteRuc(ruc.id, ruc.ruc, ruc.company_name)}
                            disabled={processingRuc === ruc.id || deletingRuc === ruc.id}
                            className="px-4 md:px-6 py-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm md:text-base border border-gray-600/30"
                          >
                            {deletingRuc === ruc.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                            Eliminar
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
              
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Buscar por nombre/email</label>
                    <input
                      type="text"
                      value={userFilters.search}
                      onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                      placeholder="Buscar..."
                      className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00C9B7]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Estado de Usuario</label>
                    <select
                      value={userFilters.status}
                      onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value as 'all' | 'active' | 'inactive' })}
                      className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white focus:outline-none focus:border-[#00C9B7]"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Activos</option>
                      <option value="inactive">Inactivos</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Estado de RUC</label>
                    <select
                      value={userFilters.ruc_status}
                      onChange={(e) => setUserFilters({ ...userFilters, ruc_status: e.target.value as 'all' | 'approved' | 'pending' | 'rejected' })}
                      className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white focus:outline-none focus:border-[#00C9B7]"
                    >
                      <option value="all">Todos</option>
                      <option value="approved">Aprobados</option>
                      <option value="pending">Pendientes</option>
                      <option value="rejected">Rechazados</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Fecha Registro Desde</label>
                    <input
                      type="date"
                      value={userFilters.date_from}
                      onChange={(e) => setUserFilters({ ...userFilters, date_from: e.target.value })}
                      className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white focus:outline-none focus:border-[#00C9B7]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Fecha Registro Hasta</label>
                    <input
                      type="date"
                      value={userFilters.date_to}
                      onChange={(e) => setUserFilters({ ...userFilters, date_to: e.target.value })}
                      className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white focus:outline-none focus:border-[#00C9B7]"
                    />
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => loadUsers(userFilters)}
                      className="flex-1 px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors font-semibold"
                    >
                      Filtrar
                    </button>
                    <button
                      onClick={() => {
                        const resetFilters: UserFilters = {
                          search: '',
                          status: 'all',
                          ruc_status: 'all',
                          date_from: '',
                          date_to: ''
                        };
                        setUserFilters(resetFilters);
                        loadUsers(resetFilters);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-600/30 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1E4A6D]/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">ID</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Email</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Nombre</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Rol</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Estado</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">RUC</th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        className="border-t border-[#1E4A6D] hover:bg-[#1E4A6D]/30 cursor-pointer transition-colors"
                        onClick={() => loadUserDetail(user.id)}
                      >
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
                        <td className="px-4 py-3">
                          {user.ruc_status ? (
                            <span className={`px-2 py-1 rounded text-sm ${
                              user.ruc_status === 'approved' ? 'bg-green-600/20 text-green-400' :
                              user.ruc_status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                              user.ruc_status === 'rejected' ? 'bg-red-600/20 text-red-400' :
                              'bg-gray-600/20 text-gray-400'
                            }`}>
                              {user.ruc_status === 'approved' ? 'Aprobado' :
                               user.ruc_status === 'pending' ? 'Pendiente' :
                               user.ruc_status === 'rejected' ? 'Rechazado' : user.ruc_status}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(user.date_joined).toLocaleDateString('es-EC')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No se encontraron usuarios con los filtros aplicados</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cotizaciones' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Todas las Cotizaciones</h2>
              <p className="text-gray-400 text-sm">Haz clic en una fila para ver los detalles completos</p>
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
                      <tr 
                        key={cot.id} 
                        className="border-t border-[#1E4A6D] hover:bg-[#1E4A6D]/30 cursor-pointer transition-colors"
                        onClick={() => loadQuoteDetail(cot.id)}
                      >
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
                            cot.estado === 'cotizado' ? 'bg-purple-600/20 text-purple-400' :
                            cot.estado === 'ro_generado' ? 'bg-cyan-600/20 text-cyan-400' :
                            cot.estado === 'completada' ? 'bg-emerald-600/20 text-emerald-400' :
                            cot.estado === 'cancelada' ? 'bg-red-600/20 text-red-400' :
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
                {cotizaciones.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No hay cotizaciones registradas</div>
                )}
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
                  <div className="flex gap-2">
                    <button
                      onClick={openCreateRateModal}
                      className="px-4 py-2 bg-[#A4FF00]/20 text-[#A4FF00] rounded-lg hover:bg-[#A4FF00]/30 transition-colors"
                    >
                      + Nueva Tarifa
                    </button>
                    <button
                      onClick={() => { setSelectedRateView(null); setRateData([]); setRateSearch(''); }}
                      className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors"
                    >
                      ← Volver
                    </button>
                  </div>
                )}
              </div>
              
              {!selectedRateView ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Tarifas de Flete</h3>
                    <p className="text-gray-400 text-sm">Tarifas de transporte internacional por ruta</p>
                    <button 
                      onClick={() => loadRatesByType('flete')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Tarifas de Seguro</h3>
                    <p className="text-gray-400 text-sm">Primas y coberturas de seguro de carga</p>
                    <button 
                      onClick={() => loadRatesByType('seguro')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Aranceles Aduaneros</h3>
                    <p className="text-gray-400 text-sm">Tasas aduaneras por código HS</p>
                    <button 
                      onClick={() => loadRatesByType('aranceles')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Transporte Interno</h3>
                    <p className="text-gray-400 text-sm">Tarifas de distribución nacional</p>
                    <button 
                      onClick={() => loadRatesByType('transporte')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D] hover:border-[#00C9B7] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-2">Agenciamiento Aduanero</h3>
                    <p className="text-gray-400 text-sm">Tarifas de despacho aduanero</p>
                    <button 
                      onClick={() => loadRatesByType('agenciamiento')}
                      className="mt-4 px-4 py-2 bg-[#00C9B7]/20 text-[#00C9B7] rounded-lg hover:bg-[#00C9B7]/30 transition-colors"
                    >
                      Ver Tarifas →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={rateSearch}
                      onChange={(e) => setRateSearch(e.target.value)}
                      placeholder="Buscar tarifas..."
                      className="flex-1 px-4 py-2 bg-[#0D2E4D] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00C9B7]"
                      onKeyDown={(e) => e.key === 'Enter' && handleRateSearchSubmit()}
                    />
                    <button
                      onClick={handleRateSearchSubmit}
                      className="px-6 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80"
                    >
                      Buscar
                    </button>
                  </div>
                  
                  <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                    <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D] flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedRateView === 'flete' && 'Tarifas de Flete'}
                        {selectedRateView === 'seguro' && 'Tarifas de Seguro'}
                        {selectedRateView === 'aranceles' && 'Aranceles Aduaneros'}
                        {selectedRateView === 'transporte' && 'Transporte Interno'}
                        {selectedRateView === 'agenciamiento' && 'Agenciamiento Aduanero'}
                      </h3>
                      <span className="text-gray-400 text-sm">{rateData.length} registros</span>
                    </div>
                    
                    {loadingRates ? (
                      <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-[#00C9B7] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-400 mt-2">Cargando tarifas...</p>
                      </div>
                    ) : rateData.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-400 mb-4">No hay tarifas configuradas en esta categoría</p>
                        <button
                          onClick={openCreateRateModal}
                          className="px-4 py-2 bg-[#A4FF00]/20 text-[#A4FF00] rounded-lg hover:bg-[#A4FF00]/30 transition-colors"
                        >
                          + Crear Primera Tarifa
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-auto">
                        <table className="w-full">
                          <thead className="bg-[#1E4A6D]/50 sticky top-0">
                            {selectedRateView === 'flete' && (
                              <tr>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Origen</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Destino</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Tipo</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">Tarifa USD</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Carrier</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Estado</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Acciones</th>
                              </tr>
                            )}
                            {selectedRateView === 'seguro' && (
                              <tr>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Nombre</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Tipo Cobertura</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">Tasa %</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">Prima Mín.</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Aseguradora</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Estado</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Acciones</th>
                              </tr>
                            )}
                            {selectedRateView === 'aranceles' && (
                              <tr>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Código HS</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Descripción</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">Ad Valorem</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">IVA</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">FODINFA</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Estado</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Acciones</th>
                              </tr>
                            )}
                            {selectedRateView === 'transporte' && (
                              <tr>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Origen</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Destino</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Vehículo</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">Tarifa USD</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Carrier</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Estado</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Acciones</th>
                              </tr>
                            )}
                            {selectedRateView === 'agenciamiento' && (
                              <tr>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Nombre</th>
                                <th className="px-3 py-2 text-left text-gray-400 text-xs">Tipo Servicio</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">Tarifa Fija</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">% Valor</th>
                                <th className="px-3 py-2 text-right text-gray-400 text-xs">Mínimo</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Estado</th>
                                <th className="px-3 py-2 text-center text-gray-400 text-xs">Acciones</th>
                              </tr>
                            )}
                          </thead>
                          <tbody>
                            {rateData.map((rate) => {
                              const r = rate as unknown as RateData;
                              return (
                                <tr key={r.id} className="border-t border-[#1E4A6D] hover:bg-[#1E4A6D]/30">
                                  {selectedRateView === 'flete' && (() => {
                                    const fr = r as FreightRateData;
                                    return (
                                      <>
                                        <td className="px-3 py-2 text-white text-xs">{fr.origin_port || fr.origin_country}</td>
                                        <td className="px-3 py-2 text-white text-xs">{fr.destination_port || fr.destination_country}</td>
                                        <td className="px-3 py-2 text-[#00C9B7] text-xs">{fr.transport_type_display || fr.transport_type}</td>
                                        <td className="px-3 py-2 text-[#A4FF00] text-xs text-right font-mono">${Number(fr.rate_usd || 0).toLocaleString('es-EC')}</td>
                                        <td className="px-3 py-2 text-gray-400 text-xs">{fr.carrier_name || '-'}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`px-2 py-0.5 rounded text-xs ${fr.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                                            {fr.is_active ? 'Activo' : 'Inactivo'}
                                          </span>
                                        </td>
                                      </>
                                    );
                                  })()}
                                  {selectedRateView === 'seguro' && (() => {
                                    const ir = r as InsuranceRateData;
                                    return (
                                      <>
                                        <td className="px-3 py-2 text-white text-xs">{ir.name}</td>
                                        <td className="px-3 py-2 text-[#00C9B7] text-xs">{ir.coverage_type_display || ir.coverage_type}</td>
                                        <td className="px-3 py-2 text-[#A4FF00] text-xs text-right font-mono">{Number(ir.rate_percentage).toFixed(2)}%</td>
                                        <td className="px-3 py-2 text-white text-xs text-right font-mono">${Number(ir.min_premium_usd).toLocaleString('es-EC')}</td>
                                        <td className="px-3 py-2 text-gray-400 text-xs">{ir.insurance_company || '-'}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`px-2 py-0.5 rounded text-xs ${ir.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                                            {ir.is_active ? 'Activo' : 'Inactivo'}
                                          </span>
                                        </td>
                                      </>
                                    );
                                  })()}
                                  {selectedRateView === 'aranceles' && (() => {
                                    const cr = r as CustomsRateData;
                                    return (
                                      <>
                                        <td className="px-3 py-2 text-[#00C9B7] text-xs font-mono">{cr.hs_code}</td>
                                        <td className="px-3 py-2 text-white text-xs max-w-[200px] truncate">{cr.description}</td>
                                        <td className="px-3 py-2 text-[#A4FF00] text-xs text-right font-mono">{Number(cr.ad_valorem_percentage).toFixed(1)}%</td>
                                        <td className="px-3 py-2 text-white text-xs text-right font-mono">{Number(cr.iva_percentage).toFixed(1)}%</td>
                                        <td className="px-3 py-2 text-white text-xs text-right font-mono">{Number(cr.fodinfa_percentage).toFixed(1)}%</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`px-2 py-0.5 rounded text-xs ${cr.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                                            {cr.is_active ? 'Activo' : 'Inactivo'}
                                          </span>
                                        </td>
                                      </>
                                    );
                                  })()}
                                  {selectedRateView === 'transporte' && (() => {
                                    const tr = r as InlandRateData;
                                    return (
                                      <>
                                        <td className="px-3 py-2 text-white text-xs">{tr.origin_city}</td>
                                        <td className="px-3 py-2 text-white text-xs">{tr.destination_city}</td>
                                        <td className="px-3 py-2 text-[#00C9B7] text-xs">{tr.vehicle_type_display || tr.vehicle_type}</td>
                                        <td className="px-3 py-2 text-[#A4FF00] text-xs text-right font-mono">${Number(tr.rate_usd).toLocaleString('es-EC')}</td>
                                        <td className="px-3 py-2 text-gray-400 text-xs">{tr.carrier_name || '-'}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`px-2 py-0.5 rounded text-xs ${tr.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                                            {tr.is_active ? 'Activo' : 'Inactivo'}
                                          </span>
                                        </td>
                                      </>
                                    );
                                  })()}
                                  {selectedRateView === 'agenciamiento' && (() => {
                                    const br = r as BrokerageRateData;
                                    return (
                                      <>
                                        <td className="px-3 py-2 text-white text-xs">{br.name}</td>
                                        <td className="px-3 py-2 text-[#00C9B7] text-xs">{br.service_type_display || br.service_type}</td>
                                        <td className="px-3 py-2 text-[#A4FF00] text-xs text-right font-mono">${Number(br.fixed_rate_usd).toLocaleString('es-EC')}</td>
                                        <td className="px-3 py-2 text-white text-xs text-right font-mono">{Number(br.percentage_rate).toFixed(2)}%</td>
                                        <td className="px-3 py-2 text-white text-xs text-right font-mono">${Number(br.min_rate_usd).toLocaleString('es-EC')}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`px-2 py-0.5 rounded text-xs ${br.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                                            {br.is_active ? 'Activo' : 'Inactivo'}
                                          </span>
                                        </td>
                                      </>
                                    );
                                  })()}
                                  <td className="px-3 py-2">
                                    <div className="flex justify-center gap-1">
                                      <button
                                        onClick={() => openEditRateModal(r)}
                                        className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => r.id && handleDeleteRate(r.id)}
                                        className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  <p className="text-gray-400 text-sm">Promedio por Cotización</p>
                  <p className="text-2xl font-bold text-[#00C9B7]">
                    ${profit.resumen.promedio_profit_por_cotizacion?.toLocaleString('es-EC', { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
                <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
                  <p className="text-gray-400 text-sm">Margen Promedio</p>
                  <p className="text-2xl font-bold text-white">{profit.resumen.margen_promedio_porcentaje}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Profit Mensual (Últimos 12 meses)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profit.charts?.monthly_profits || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E4A6D" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                          axisLine={{ stroke: '#1E4A6D' }}
                          tickLine={{ stroke: '#1E4A6D' }}
                        />
                        <YAxis 
                          tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                          axisLine={{ stroke: '#1E4A6D' }}
                          tickLine={{ stroke: '#1E4A6D' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0A2540', 
                            border: '1px solid #1E4A6D',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value) => [`$${Number(value || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`, 'Profit']}
                          labelStyle={{ color: '#9CA3AF' }}
                        />
                        <Bar dataKey="profit" fill="#00C9B7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Profit por Tipo de Transporte</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profit.charts?.transport_breakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          labelLine={{ stroke: '#9CA3AF' }}
                        >
                          {(profit.charts?.transport_breakdown || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#00C9B7', '#A4FF00', '#0A2540'][index % 3]} stroke="#0D2E4D" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0A2540', 
                            border: '1px solid #1E4A6D',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value) => [`$${Number(value || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`, 'Profit']}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          formatter={(value) => <span style={{ color: '#9CA3AF' }}>{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <div className="p-3 bg-[#1E4A6D]/30 border-b border-[#1E4A6D]">
                  <p className="text-sm text-gray-400">Haz clic en una fila para ver el desglose de márgenes por rubro</p>
                </div>
                <div className="overflow-x-auto">
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
              
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Buscar</label>
                    <input
                      type="text"
                      placeholder="Buscar en mensaje..."
                      value={logFilters.search}
                      onChange={(e) => setLogFilters({ ...logFilters, search: e.target.value })}
                      className="w-full bg-[#1E4A6D] text-white px-3 py-2 rounded-lg border border-[#2D5A7D] focus:outline-none focus:border-[#00C9B7]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Tipo de Evento</label>
                    <select
                      value={logFilters.action_type}
                      onChange={(e) => setLogFilters({ ...logFilters, action_type: e.target.value })}
                      className="w-full bg-[#1E4A6D] text-white px-3 py-2 rounded-lg border border-[#2D5A7D] focus:outline-none focus:border-[#00C9B7]"
                    >
                      <option value="">Todos los tipos</option>
                      {logFilterOptions.action_types.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Nivel</label>
                    <select
                      value={logFilters.level}
                      onChange={(e) => setLogFilters({ ...logFilters, level: e.target.value })}
                      className="w-full bg-[#1E4A6D] text-white px-3 py-2 rounded-lg border border-[#2D5A7D] focus:outline-none focus:border-[#00C9B7]"
                    >
                      <option value="">Todos los niveles</option>
                      {logFilterOptions.levels.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">ID Usuario</label>
                    <input
                      type="text"
                      placeholder="ID de usuario..."
                      value={logFilters.user_id}
                      onChange={(e) => setLogFilters({ ...logFilters, user_id: e.target.value })}
                      className="w-full bg-[#1E4A6D] text-white px-3 py-2 rounded-lg border border-[#2D5A7D] focus:outline-none focus:border-[#00C9B7]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Desde</label>
                    <input
                      type="date"
                      value={logFilters.date_from}
                      onChange={(e) => setLogFilters({ ...logFilters, date_from: e.target.value })}
                      className="w-full bg-[#1E4A6D] text-white px-3 py-2 rounded-lg border border-[#2D5A7D] focus:outline-none focus:border-[#00C9B7]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Hasta</label>
                    <input
                      type="date"
                      value={logFilters.date_to}
                      onChange={(e) => setLogFilters({ ...logFilters, date_to: e.target.value })}
                      className="w-full bg-[#1E4A6D] text-white px-3 py-2 rounded-lg border border-[#2D5A7D] focus:outline-none focus:border-[#00C9B7]"
                    />
                  </div>
                  <div className="flex items-end gap-2 lg:col-span-2">
                    <button
                      onClick={() => loadLogs(1, logFilters)}
                      disabled={loadingLogs}
                      className="px-6 py-2 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {loadingLogs ? 'Cargando...' : 'Filtrar'}
                    </button>
                    <button
                      onClick={() => {
                        const emptyFilters = { search: '', action_type: '', level: '', date_from: '', date_to: '', user_id: '' };
                        setLogFilters(emptyFilters);
                        loadLogs(1, emptyFilters);
                      }}
                      className="px-6 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#2D5A7D]"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400 mb-2">
                  {logsPagination.total_count} registros encontrados
                </div>
              </div>
              
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#1E4A6D]/50">
                      <tr>
                        <th className="text-left p-3 text-gray-400 font-medium">Fecha</th>
                        <th className="text-left p-3 text-gray-400 font-medium">Tipo</th>
                        <th className="text-left p-3 text-gray-400 font-medium">Nivel</th>
                        <th className="text-left p-3 text-gray-400 font-medium">Usuario</th>
                        <th className="text-left p-3 text-gray-400 font-medium">Mensaje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E4A6D]">
                      {loadingLogs ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400">
                            Cargando logs...
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400">
                            No hay logs disponibles
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#1E4A6D]/20">
                            <td className="p-3 text-gray-400 whitespace-nowrap">
                              {log.created_at ? new Date(log.created_at).toLocaleString('es-EC') : '-'}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-1 bg-[#1E4A6D] text-[#00C9B7] rounded text-xs">
                                {log.action_type_display || log.action_type}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                log.level === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                                log.level === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                                log.level === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {log.level}
                              </span>
                            </td>
                            <td className="p-3 text-white">
                              {log.user_email || (log.user_id ? `Usuario #${log.user_id}` : 'Sistema')}
                            </td>
                            <td className="p-3 text-gray-300 max-w-md truncate" title={log.message}>
                              {log.message}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {logsPagination.total_pages > 1 && (
                  <div className="p-4 border-t border-[#1E4A6D] flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Página {logsPagination.page} de {logsPagination.total_pages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadLogs(logsPagination.page - 1, logFilters)}
                        disabled={logsPagination.page <= 1 || loadingLogs}
                        className="px-3 py-1 bg-[#1E4A6D] text-white rounded hover:bg-[#2D5A7D] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => loadLogs(logsPagination.page + 1, logFilters)}
                        disabled={logsPagination.page >= logsPagination.total_pages || loadingLogs}
                        className="px-3 py-1 bg-[#1E4A6D] text-white rounded hover:bg-[#2D5A7D] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
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
                        <th className="text-left p-3 text-gray-400">Acciones</th>
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
                          <td className="p-3">
                            {(inv.status === 'pending' || inv.status === 'sent' || inv.is_expired) && inv.status !== 'accepted' && (
                              <button
                                onClick={() => revokeFFInvitation(inv.id, inv.email)}
                                className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded text-xs font-medium transition-colors"
                              >
                                Revocar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {ffInvitations.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400">
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

              {assignedROs.length > 0 && (
                <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                  <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D]">
                    <h3 className="text-lg font-semibold text-white">ROs Asignados a Freight Forwarders</h3>
                    <p className="text-gray-400 text-sm mt-1">Gestiona y reasigna ROs existentes</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#1E4A6D]/30">
                        <tr>
                          <th className="text-left p-3 text-gray-400">RO</th>
                          <th className="text-left p-3 text-gray-400">Consignatario</th>
                          <th className="text-left p-3 text-gray-400">FF Asignado</th>
                          <th className="text-left p-3 text-gray-400">Fecha Asignación</th>
                          <th className="text-left p-3 text-gray-400">Estado</th>
                          <th className="text-left p-3 text-gray-400">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E4A6D]">
                        {assignedROs.map((ro) => (
                          <tr key={ro.id} className="hover:bg-[#1E4A6D]/20">
                            <td className="p-3 text-white font-medium">{ro.ro_number}</td>
                            <td className="p-3 text-gray-300">{ro.consignee_name}</td>
                            <td className="p-3">
                              <div>
                                <span className="text-[#00C9B7]">{ro.assigned_ff_company || ro.assigned_ff_email}</span>
                                {ro.assigned_ff_company && (
                                  <p className="text-gray-500 text-xs">{ro.assigned_ff_email}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-gray-400">
                              {ro.ff_assignment_date ? new Date(ro.ff_assignment_date).toLocaleDateString('es-EC') : '-'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                ro.status === 'sent_to_forwarder' ? 'bg-blue-500/20 text-blue-400' :
                                ro.status === 'ro_generated' ? 'bg-green-500/20 text-green-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {ro.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => {
                                  setSelectedReassignRO(ro);
                                  setReassignNotify(true);
                                  setShowReassignModal(true);
                                }}
                                className="px-3 py-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded text-xs font-medium transition-colors"
                              >
                                Reasignar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {showReassignModal && selectedReassignRO && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] w-full max-w-md">
                <div className="p-6 border-b border-[#1E4A6D]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Reasignar FF</h3>
                      <p className="text-gray-400 text-sm mt-1">{selectedReassignRO.ro_number}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowReassignModal(false);
                        setSelectedReassignRO(null);
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
                  <div className="bg-[#0A2540] rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2">Asignación Actual</p>
                    <p className="text-white font-medium">{selectedReassignRO.assigned_ff_company || selectedReassignRO.assigned_ff_email}</p>
                    <p className="text-gray-500 text-xs">{selectedReassignRO.assigned_ff_email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Nuevo Freight Forwarder</label>
                    <select
                      id="newFFSelect"
                      className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00C9B7]"
                      defaultValue=""
                    >
                      <option value="">Seleccionar FF...</option>
                      {ffUsers
                        .filter(user => user.id !== selectedReassignRO.assigned_ff_id)
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.company_name || user.email}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="reassignNotify"
                      checked={reassignNotify}
                      onChange={(e) => setReassignNotify(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#1E4A6D] border-[#2D5A7D] accent-[#00C9B7]"
                    />
                    <label htmlFor="reassignNotify" className="text-gray-300">
                      Notificar al nuevo FF por email
                    </label>
                  </div>
                </div>
                
                <div className="p-6 border-t border-[#1E4A6D] flex gap-4">
                  <button
                    onClick={() => {
                      setShowReassignModal(false);
                      setSelectedReassignRO(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const selectEl = document.getElementById('newFFSelect') as HTMLSelectElement;
                      const newFFId = selectEl?.value;
                      if (newFFId && selectedReassignRO) {
                        reassignROToFF(selectedReassignRO.id, parseInt(newFFId), reassignNotify);
                      } else {
                        setError('Seleccione un nuevo FF');
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors font-semibold"
                  >
                    Reasignar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ff_config' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Configuración de Freight Forwarders</h2>

              {loadingFFConfig ? (
                <div className="text-center py-8 text-gray-400">Cargando configuración...</div>
              ) : (
                <>
                  <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Modo de Asignación Global</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {['single', 'multi', 'manual'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            if (ffGlobalConfig) {
                              handleSaveFFConfig({ assignment_mode: mode as 'single' | 'multi' | 'manual' });
                            }
                          }}
                          disabled={savingFFConfig}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            ffGlobalConfig?.assignment_mode === mode
                              ? 'border-[#00C9B7] bg-[#00C9B7]/10'
                              : 'border-[#1E4A6D] hover:border-[#2D5A7D]'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {mode === 'single' ? '🎯' : mode === 'multi' ? '🔀' : '✋'}
                            </span>
                            <span className="text-white font-semibold capitalize">{mode}</span>
                          </div>
                          <p className="text-gray-400 text-sm">
                            {mode === 'single' && 'Un único FF para todas las operaciones'}
                            {mode === 'multi' && 'Asignación automática según rutas'}
                            {mode === 'manual' && 'Asignación manual por cada RO'}
                          </p>
                        </button>
                      ))}
                    </div>

                    {ffGlobalConfig?.assignment_mode === 'single' && (
                      <div className="mt-4 p-4 bg-[#1E4A6D]/30 rounded-lg">
                        <label className="block text-gray-300 mb-2">FF Predeterminado</label>
                        <select
                          value={ffGlobalConfig.default_ff_id || ''}
                          onChange={(e) => handleSaveFFConfig({ default_ff_id: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                        >
                          <option value="">Seleccionar FF...</option>
                          {availableFFs.map((ff) => (
                            <option key={ff.id} value={ff.id}>
                              {ff.company_name} - {ff.contact_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="autoAssign"
                        checked={ffGlobalConfig?.auto_assign_on_ro || false}
                        onChange={(e) => handleSaveFFConfig({ auto_assign_on_ro: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#1E4A6D] border-[#2D5A7D]"
                      />
                      <label htmlFor="autoAssign" className="text-gray-300">
                        Asignar automáticamente al crear RO
                      </label>
                    </div>
                  </div>

                  {ffGlobalConfig?.assignment_mode === 'multi' && (
                    <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                      <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D] flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Asignaciones por Ruta</h3>
                        <button
                          onClick={() => {
                            setEditingRouteAssignment(null);
                            setRouteAssignmentForm({
                              ff_id: '',
                              transport_type: '',
                              origin_country: '',
                              origin_port: '',
                              destination_city: '',
                              carrier_name: '',
                              priority: '1',
                              notes: ''
                            });
                            setShowRouteAssignmentModal(true);
                          }}
                          className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 text-sm"
                        >
                          + Nueva Asignación
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[#1E4A6D]/30">
                            <tr>
                              <th className="text-left p-3 text-gray-400">FF</th>
                              <th className="text-left p-3 text-gray-400">Transporte</th>
                              <th className="text-left p-3 text-gray-400">Origen</th>
                              <th className="text-left p-3 text-gray-400">Destino</th>
                              <th className="text-left p-3 text-gray-400">Carrier</th>
                              <th className="text-left p-3 text-gray-400">Prioridad</th>
                              <th className="text-left p-3 text-gray-400">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E4A6D]">
                            {ffRouteAssignments.map((ra) => (
                              <tr key={ra.id} className="hover:bg-[#1E4A6D]/20">
                                <td className="p-3 text-white">{ra.ff_name}</td>
                                <td className="p-3 text-gray-300">{ra.transport_type_display || ra.transport_type}</td>
                                <td className="p-3 text-gray-300">{ra.origin_country} / {ra.origin_port || '*'}</td>
                                <td className="p-3 text-gray-300">{ra.destination_city || '*'}</td>
                                <td className="p-3 text-gray-300">{ra.carrier_name || '*'}</td>
                                <td className="p-3 text-[#00C9B7]">{ra.priority}</td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingRouteAssignment(ra);
                                        setRouteAssignmentForm({
                                          ff_id: ra.ff_id.toString(),
                                          transport_type: ra.transport_type,
                                          origin_country: ra.origin_country,
                                          origin_port: ra.origin_port,
                                          destination_city: ra.destination_city,
                                          carrier_name: ra.carrier_name,
                                          priority: ra.priority.toString(),
                                          notes: ra.notes || ''
                                        });
                                        setShowRouteAssignmentModal(true);
                                      }}
                                      className="text-[#00C9B7] hover:text-[#00C9B7]/80"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRouteAssignment(ra.id)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {ffRouteAssignments.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-4 text-center text-gray-400">
                                  No hay asignaciones de ruta configuradas
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">FFs Disponibles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableFFs.map((ff) => (
                        <div key={ff.id} className="p-4 bg-[#1E4A6D]/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${ff.is_verified ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                            <span className="text-white font-medium">{ff.company_name}</span>
                          </div>
                          <p className="text-gray-400 text-sm">{ff.contact_name}</p>
                          <p className="text-gray-500 text-xs">{ff.email}</p>
                        </div>
                      ))}
                      {availableFFs.length === 0 && (
                        <p className="text-gray-400 col-span-3">No hay FFs registrados</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'tracking_templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Configuración de Hitos de Tracking</h2>
                <p className="text-gray-400 text-sm">Define los hitos estándar para cada tipo de transporte</p>
              </div>

              {trackingTemplatesData && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4 text-center">
                    <p className="text-gray-400 text-sm">FCL</p>
                    <p className="text-3xl font-bold text-[#00C9B7]">{trackingTemplatesData.counts.FCL}</p>
                    <p className="text-gray-500 text-xs">hitos</p>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4 text-center">
                    <p className="text-gray-400 text-sm">LCL</p>
                    <p className="text-3xl font-bold text-[#A4FF00]">{trackingTemplatesData.counts.LCL}</p>
                    <p className="text-gray-500 text-xs">hitos</p>
                  </div>
                  <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-4 text-center">
                    <p className="text-gray-400 text-sm">AIR</p>
                    <p className="text-3xl font-bold text-amber-400">{trackingTemplatesData.counts.AIR}</p>
                    <p className="text-gray-500 text-xs">hitos</p>
                  </div>
                </div>
              )}

              {(['FCL', 'LCL', 'AIR'] as const).map((transportType) => (
                <div key={transportType} className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {transportType === 'FCL' && '🚢'}
                      {transportType === 'LCL' && '📦'}
                      {transportType === 'AIR' && '✈️'}
                      {transportType}
                      <span className="text-sm font-normal text-gray-400">
                        ({trackingTemplatesData?.templates[transportType]?.length || 0} hitos)
                      </span>
                    </h3>
                    <button
                      onClick={() => openCreateTemplateModal(transportType)}
                      className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors flex items-center gap-2"
                    >
                      <span>+</span> Agregar Hito
                    </button>
                  </div>

                  <div className="space-y-2">
                    {trackingTemplatesData?.templates[transportType]?.map((template, index) => (
                      <div
                        key={template.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          template.is_active
                            ? 'bg-[#1E4A6D]/30 border-[#1E4A6D]'
                            : 'bg-gray-800/30 border-gray-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveTemplate(template, 'up')}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveTemplate(template, 'down')}
                              disabled={index === (trackingTemplatesData?.templates[transportType]?.length || 0) - 1}
                              className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ▼
                            </button>
                          </div>
                          <div className="w-8 h-8 flex items-center justify-center bg-[#00C9B7]/20 rounded-full text-[#00C9B7] font-bold">
                            {template.milestone_order}
                          </div>
                          <div>
                            <p className="text-white font-medium">{template.milestone_name}</p>
                            {template.description && (
                              <p className="text-gray-400 text-sm">{template.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleTemplateActive(template)}
                            className={`px-3 py-1 rounded-full text-xs ${
                              template.is_active
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-gray-600/20 text-gray-400'
                            }`}
                          >
                            {template.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                          <button
                            onClick={() => openEditTemplateModal(template)}
                            className="p-2 text-gray-400 hover:text-[#00C9B7] hover:bg-[#00C9B7]/10 rounded-lg transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!trackingTemplatesData?.templates[transportType] || trackingTemplatesData.templates[transportType].length === 0) && (
                      <p className="text-gray-500 text-center py-8">
                        No hay hitos configurados para {transportType}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold text-white mb-4">
                      {templateModalMode === 'create' ? 'Nuevo Hito' : 'Editar Hito'}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tipo de Transporte</label>
                        <select
                          value={templateForm.transport_type}
                          onChange={(e) => setTemplateForm({ ...templateForm, transport_type: e.target.value as 'FCL' | 'LCL' | 'AIR' })}
                          disabled={templateModalMode === 'edit'}
                          className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white focus:outline-none focus:border-[#00C9B7] disabled:opacity-50"
                        >
                          <option value="FCL">FCL</option>
                          <option value="LCL">LCL</option>
                          <option value="AIR">AIR</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Nombre del Hito *</label>
                        <input
                          type="text"
                          value={templateForm.milestone_name}
                          onChange={(e) => setTemplateForm({ ...templateForm, milestone_name: e.target.value })}
                          placeholder="Ej: Booking Confirmado"
                          className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00C9B7]"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Descripción</label>
                        <textarea
                          value={templateForm.description}
                          onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                          placeholder="Descripción opcional del hito"
                          rows={3}
                          className="w-full px-4 py-2 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00C9B7]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="template_active"
                          checked={templateForm.is_active}
                          onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="template_active" className="text-gray-400">Activo</label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowTemplateModal(false);
                          setEditingTemplate(null);
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={savingTemplate}
                        className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors disabled:opacity-50"
                      >
                        {savingTemplate ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'arancel' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">Gestión de Arancel (HS Codes)</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const token = getToken();
                      const params = new URLSearchParams();
                      params.append('format', 'excel');
                      if (hsCodesSearch) params.append('search', hsCodesSearch);
                      if (hsCategoryFilter) params.append('category', hsCategoryFilter);
                      const url = `${API_BASE}/hs-codes/export/?${params.toString()}`;
                      fetch(url, {
                        headers: { 'X-Master-Admin-Token': token || '' }
                      })
                        .then(res => res.blob())
                        .then(blob => {
                          const downloadUrl = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = downloadUrl;
                          a.download = `hs_codes_${new Date().toISOString().slice(0,10)}.xlsx`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(downloadUrl);
                        })
                        .catch(() => setError('Error al exportar'));
                    }}
                    className="px-4 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80 transition-colors flex items-center gap-2"
                  >
                    <span>📤</span> Exportar
                  </button>
                  <button
                    onClick={() => setShowHsImportModal(true)}
                    className="px-4 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80 transition-colors flex items-center gap-2"
                  >
                    <span>📥</span> Importar CSV/Excel
                  </button>
                  <button
                    onClick={openHsCodeCreateModal}
                    className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors flex items-center gap-2"
                  >
                    <span>+</span> Nueva Partida
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={hsCodesSearch}
                    onChange={(e) => setHsCodesSearch(e.target.value)}
                    placeholder="Buscar por código HS, descripción o keywords..."
                    className="flex-1 px-4 py-2 bg-[#0D2E4D] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00C9B7]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setHsCodesPage(1);
                        loadHsCodes(1, hsCodesSearch, hsCategoryFilter, hsShowInactive);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setHsCodesPage(1);
                      loadHsCodes(1, hsCodesSearch, hsCategoryFilter, hsShowInactive);
                    }}
                    className="px-6 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80"
                  >
                    Buscar
                  </button>
                </div>
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hsShowInactive}
                    onChange={(e) => {
                      setHsShowInactive(e.target.checked);
                      setHsCodesPage(1);
                      loadHsCodes(1, hsCodesSearch, hsCategoryFilter, e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-[#1E4A6D] bg-[#0D2E4D] text-[#00C9B7] focus:ring-[#00C9B7]"
                  />
                  <span className="text-sm">Mostrar inactivos</span>
                </label>
                <select
                  value={hsCategoryFilter}
                  onChange={(e) => {
                    setHsCategoryFilter(e.target.value);
                    setHsCodesPage(1);
                    loadHsCodes(1, hsCodesSearch, e.target.value, hsShowInactive);
                  }}
                  className="px-4 py-2 bg-[#0D2E4D] border border-[#1E4A6D] rounded-lg text-white focus:outline-none focus:border-[#00C9B7]"
                >
                  <option value="">Todas las categorías</option>
                  {hsCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1E4A6D]/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-400 text-sm">Código HS</th>
                        <th className="px-4 py-3 text-left text-gray-400 text-sm">Descripción</th>
                        <th className="px-4 py-3 text-left text-gray-400 text-sm">Categoría</th>
                        <th className="px-4 py-3 text-left text-gray-400 text-sm">Ad Valorem %</th>
                        <th className="px-4 py-3 text-left text-gray-400 text-sm">Permiso</th>
                        {hsShowInactive && <th className="px-4 py-3 text-left text-gray-400 text-sm">Estado</th>}
                        <th className="px-4 py-3 text-left text-gray-400 text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hsCodes.map((entry) => (
                        <tr key={entry.id} className={`border-t border-[#1E4A6D] hover:bg-[#1E4A6D]/20 ${!entry.is_active ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 text-[#00C9B7] font-mono text-sm">{entry.hs_code}</td>
                          <td className="px-4 py-3 text-white text-sm max-w-xs">
                            <span title={entry.description}>
                              {entry.description.length > 60 ? entry.description.substring(0, 60) + '...' : entry.description}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">{entry.category || '-'}</td>
                          <td className="px-4 py-3 text-[#A4FF00] font-semibold text-sm">{entry.ad_valorem_rate}%</td>
                          <td className="px-4 py-3">
                            {entry.requires_permit ? (
                              <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">
                                {entry.permit_institution || 'Requiere'}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">No</span>
                            )}
                          </td>
                          {hsShowInactive && (
                            <td className="px-4 py-3">
                              {entry.is_active ? (
                                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Activo</span>
                              ) : (
                                <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">Inactivo</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openHsCodeEditModal(entry)}
                                className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-sm hover:bg-blue-600/30"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteHsCode(entry.id)}
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
                </div>
                {hsCodes.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No hay partidas arancelarias registradas</div>
                )}
              </div>

              {hsCodesTotalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, hsCodesPage - 1);
                      setHsCodesPage(newPage);
                      loadHsCodes(newPage, hsCodesSearch, hsCategoryFilter, hsShowInactive);
                    }}
                    disabled={hsCodesPage <= 1}
                    className="px-4 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-gray-400">
                    Página {hsCodesPage} de {hsCodesTotalPages}
                  </span>
                  <button
                    onClick={() => {
                      const newPage = Math.min(hsCodesTotalPages, hsCodesPage + 1);
                      setHsCodesPage(newPage);
                      loadHsCodes(newPage, hsCodesSearch, hsCategoryFilter, hsShowInactive);
                    }}
                    disabled={hsCodesPage >= hsCodesTotalPages}
                    className="px-4 py-2 bg-[#1E4A6D] text-white rounded-lg hover:bg-[#1E4A6D]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showHsCodeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1E4A6D]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {hsCodeModalMode === 'create' ? 'Nueva Partida Arancelaria' : 'Editar Partida Arancelaria'}
                </h3>
                <button
                  onClick={() => {
                    setShowHsCodeModal(false);
                    resetHsCodeForm();
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Código HS *</label>
                  <input
                    type="text"
                    value={hsCodeForm.hs_code}
                    onChange={(e) => setHsCodeForm({ ...hsCodeForm, hs_code: e.target.value })}
                    className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                    placeholder="0101.21.00.00"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Capítulo</label>
                  <input
                    type="text"
                    value={hsCodeForm.chapter}
                    onChange={(e) => setHsCodeForm({ ...hsCodeForm, chapter: e.target.value })}
                    className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                    placeholder="01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Descripción *</label>
                <textarea
                  value={hsCodeForm.description}
                  onChange={(e) => setHsCodeForm({ ...hsCodeForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7] resize-none"
                  placeholder="Descripción de la partida arancelaria"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Descripción (Inglés)</label>
                <textarea
                  value={hsCodeForm.description_en}
                  onChange={(e) => setHsCodeForm({ ...hsCodeForm, description_en: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7] resize-none"
                  placeholder="English description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Categoría</label>
                  <input
                    type="text"
                    value={hsCodeForm.category}
                    onChange={(e) => setHsCodeForm({ ...hsCodeForm, category: e.target.value })}
                    className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                    placeholder="Ej: Animales vivos"
                    list="hs-categories"
                  />
                  <datalist id="hs-categories">
                    {hsCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Unidad</label>
                  <input
                    type="text"
                    value={hsCodeForm.unit}
                    onChange={(e) => setHsCodeForm({ ...hsCodeForm, unit: e.target.value })}
                    className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                    placeholder="kg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Ad Valorem Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={hsCodeForm.ad_valorem_rate}
                    onChange={(e) => setHsCodeForm({ ...hsCodeForm, ad_valorem_rate: e.target.value })}
                    className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">ICE Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hsCodeForm.ice_rate}
                    onChange={(e) => setHsCodeForm({ ...hsCodeForm, ice_rate: e.target.value })}
                    className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="border-t border-[#1E4A6D] pt-4 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="requires_permit"
                    checked={hsCodeForm.requires_permit}
                    onChange={(e) => setHsCodeForm({ ...hsCodeForm, requires_permit: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="requires_permit" className="text-gray-300">Requiere Permiso Previo</label>
                </div>
                
                {hsCodeForm.requires_permit && (
                  <div className="grid grid-cols-2 gap-4 pl-7">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Institución</label>
                      <select
                        value={hsCodeForm.permit_institution}
                        onChange={(e) => setHsCodeForm({ ...hsCodeForm, permit_institution: e.target.value })}
                        className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="ARCSA">ARCSA</option>
                        <option value="AGROCALIDAD">AGROCALIDAD</option>
                        <option value="INEN">INEN</option>
                        <option value="CONSEP">CONSEP</option>
                        <option value="MAG">MAG</option>
                        <option value="DEFENSA">DEFENSA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Días de Trámite</label>
                      <input
                        type="text"
                        value={hsCodeForm.permit_processing_days}
                        onChange={(e) => setHsCodeForm({ ...hsCodeForm, permit_processing_days: e.target.value })}
                        className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                        placeholder="15-30"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-400 text-sm mb-1">Nombre del Permiso</label>
                      <input
                        type="text"
                        value={hsCodeForm.permit_name}
                        onChange={(e) => setHsCodeForm({ ...hsCodeForm, permit_name: e.target.value })}
                        className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                        placeholder="Registro Sanitario, Certificado Fitosanitario, etc."
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Keywords (separadas por coma)</label>
                <input
                  type="text"
                  value={hsCodeForm.keywords}
                  onChange={(e) => setHsCodeForm({ ...hsCodeForm, keywords: e.target.value })}
                  className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7]"
                  placeholder="caballo, equino, animal vivo"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Notas</label>
                <textarea
                  value={hsCodeForm.notes}
                  onChange={(e) => setHsCodeForm({ ...hsCodeForm, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00C9B7] resize-none"
                  placeholder="Notas adicionales"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-[#1E4A6D] flex gap-4">
              <button
                onClick={() => {
                  setShowHsCodeModal(false);
                  resetHsCodeForm();
                }}
                className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveHsCode}
                disabled={!hsCodeForm.hs_code || !hsCodeForm.description}
                className="flex-1 px-4 py-3 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {hsCodeModalMode === 'create' ? 'Crear Partida' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHsImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] w-full max-w-lg">
            <div className="p-6 border-b border-[#1E4A6D]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Importar Partidas Arancelarias</h3>
                <button
                  onClick={() => setShowHsImportModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[#0A2540] rounded-lg p-4 text-sm text-gray-400">
                <p className="mb-2">El archivo debe contener las siguientes columnas:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><span className="text-[#00C9B7]">hs_code</span> - Código HS (requerido)</li>
                  <li><span className="text-[#00C9B7]">description</span> - Descripción (requerido)</li>
                  <li>description_en, category, chapter, ad_valorem_rate, ice_rate, unit</li>
                  <li>requires_permit, permit_institution, permit_name, permit_processing_days</li>
                  <li>keywords, notes</li>
                </ul>
              </div>
              
              <label className={`
                flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                ${hsImportUploading ? 'border-[#00C9B7] bg-[#00C9B7]/10' : 'border-[#1E4A6D] hover:border-[#00C9B7] hover:bg-[#0A2540]'}
              `}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {hsImportUploading ? (
                    <div className="animate-spin text-[#00C9B7] text-3xl">⏳</div>
                  ) : (
                    <>
                      <span className="text-4xl mb-3">📤</span>
                      <p className="text-sm text-gray-400">
                        <span className="text-[#00C9B7]">Clic para subir</span> archivo CSV o Excel
                      </p>
                      <p className="text-xs text-gray-500 mt-1">.csv, .xlsx, .xls</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleHsCodeImport(file);
                    }
                  }}
                  disabled={hsImportUploading}
                />
              </label>
            </div>
            
            <div className="p-6 border-t border-[#1E4A6D]">
              <button
                onClick={() => setShowHsImportModal(false)}
                className="w-full px-4 py-3 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRateModal && editingRate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1E4A6D]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {rateModalMode === 'create' ? 'Nueva Tarifa' : 'Editar Tarifa'}
                  {selectedRateView === 'flete' && ' de Flete'}
                  {selectedRateView === 'seguro' && ' de Seguro'}
                  {selectedRateView === 'aranceles' && ' Aduanera'}
                  {selectedRateView === 'transporte' && ' de Transporte'}
                  {selectedRateView === 'agenciamiento' && ' de Agenciamiento'}
                </h3>
                <button onClick={closeRateModal} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {selectedRateView === 'flete' && (() => {
                const fr = editingRate as FreightRateData;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">País Origen</label>
                        <input type="text" value={fr.origin_country || ''} onChange={(e) => setEditingRate({ ...fr, origin_country: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="China" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Puerto Origen</label>
                        <input type="text" value={fr.origin_port || ''} onChange={(e) => setEditingRate({ ...fr, origin_port: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="Shanghai" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">País Destino</label>
                        <input type="text" value={fr.destination_country || 'Ecuador'} onChange={(e) => setEditingRate({ ...fr, destination_country: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="Ecuador" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Puerto Destino</label>
                        <input type="text" value={fr.destination_port || ''} onChange={(e) => setEditingRate({ ...fr, destination_port: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="Guayaquil" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tipo Transporte</label>
                        <select value={fr.transport_type || 'maritimo_fcl'} onChange={(e) => setEditingRate({ ...fr, transport_type: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white">
                          <option value="maritimo_fcl">Marítimo FCL</option>
                          <option value="maritimo_lcl">Marítimo LCL</option>
                          <option value="aereo">Aéreo</option>
                          <option value="terrestre">Terrestre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Unidad</label>
                        <select value={fr.unit || 'kg'} onChange={(e) => setEditingRate({ ...fr, unit: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white">
                          <option value="kg">Por Kg</option>
                          <option value="cbm">Por CBM</option>
                          <option value="contenedor_20">Contenedor 20'</option>
                          <option value="contenedor_40">Contenedor 40'</option>
                          <option value="contenedor_40hc">Contenedor 40HC</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tarifa USD *</label>
                        <input type="number" step="0.01" value={fr.rate_usd || ''} onChange={(e) => setEditingRate({ ...fr, rate_usd: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Mínimo USD</label>
                        <input type="number" step="0.01" value={fr.min_rate_usd || ''} onChange={(e) => setEditingRate({ ...fr, min_rate_usd: parseFloat(e.target.value) || null })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Carrier</label>
                        <input type="text" value={fr.carrier_name || ''} onChange={(e) => setEditingRate({ ...fr, carrier_name: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="MSC" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Días Tránsito Mín</label>
                        <input type="number" value={fr.transit_days_min || ''} onChange={(e) => setEditingRate({ ...fr, transit_days_min: parseInt(e.target.value) || null })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="25" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Días Tránsito Máx</label>
                        <input type="number" value={fr.transit_days_max || ''} onChange={(e) => setEditingRate({ ...fr, transit_days_max: parseInt(e.target.value) || null })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="30" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Notas</label>
                      <textarea value={fr.notes || ''} onChange={(e) => setEditingRate({ ...fr, notes: e.target.value })} rows={2} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white resize-none" placeholder="Notas adicionales" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="rate-active" checked={fr.is_active} onChange={(e) => setEditingRate({ ...fr, is_active: e.target.checked })} className="rounded border-[#1E4A6D]" />
                      <label htmlFor="rate-active" className="text-gray-400 text-sm">Activo</label>
                    </div>
                  </>
                );
              })()}

              {selectedRateView === 'seguro' && (() => {
                const ir = editingRate as InsuranceRateData;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Nombre *</label>
                        <input type="text" value={ir.name || ''} onChange={(e) => setEditingRate({ ...ir, name: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="Seguro Básico" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tipo Cobertura</label>
                        <select value={ir.coverage_type || 'basico'} onChange={(e) => setEditingRate({ ...ir, coverage_type: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white">
                          <option value="basico">Básico</option>
                          <option value="amplio">Amplio</option>
                          <option value="todo_riesgo">Todo Riesgo</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tasa % *</label>
                        <input type="number" step="0.01" value={ir.rate_percentage || ''} onChange={(e) => setEditingRate({ ...ir, rate_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0.35" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Prima Mínima USD</label>
                        <input type="number" step="0.01" value={ir.min_premium_usd || ''} onChange={(e) => setEditingRate({ ...ir, min_premium_usd: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="25" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Deducible %</label>
                        <input type="number" step="0.01" value={ir.deductible_percentage || ''} onChange={(e) => setEditingRate({ ...ir, deductible_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Aseguradora</label>
                        <input type="text" value={ir.insurance_company || ''} onChange={(e) => setEditingRate({ ...ir, insurance_company: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="AIG" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Número Póliza</label>
                        <input type="text" value={ir.policy_number || ''} onChange={(e) => setEditingRate({ ...ir, policy_number: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="POL-001" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Notas</label>
                      <textarea value={ir.notes || ''} onChange={(e) => setEditingRate({ ...ir, notes: e.target.value })} rows={2} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white resize-none" placeholder="Notas adicionales" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="rate-active" checked={ir.is_active} onChange={(e) => setEditingRate({ ...ir, is_active: e.target.checked })} className="rounded border-[#1E4A6D]" />
                      <label htmlFor="rate-active" className="text-gray-400 text-sm">Activo</label>
                    </div>
                  </>
                );
              })()}

              {selectedRateView === 'aranceles' && (() => {
                const cr = editingRate as CustomsRateData;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Código HS *</label>
                        <input type="text" value={cr.hs_code || ''} onChange={(e) => setEditingRate({ ...cr, hs_code: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0101.21.00" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Descripción *</label>
                        <input type="text" value={cr.description || ''} onChange={(e) => setEditingRate({ ...cr, description: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="Caballos reproductores de raza pura" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Ad Valorem %</label>
                        <input type="number" step="0.01" value={cr.ad_valorem_percentage || ''} onChange={(e) => setEditingRate({ ...cr, ad_valorem_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">IVA %</label>
                        <input type="number" step="0.01" value={cr.iva_percentage || ''} onChange={(e) => setEditingRate({ ...cr, iva_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="15" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">FODINFA %</label>
                        <input type="number" step="0.01" value={cr.fodinfa_percentage || ''} onChange={(e) => setEditingRate({ ...cr, fodinfa_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0.5" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">ICE %</label>
                        <input type="number" step="0.01" value={cr.ice_percentage || ''} onChange={(e) => setEditingRate({ ...cr, ice_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Salvaguardia %</label>
                        <input type="number" step="0.01" value={cr.salvaguardia_percentage || ''} onChange={(e) => setEditingRate({ ...cr, salvaguardia_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Arancel Específico USD</label>
                        <input type="number" step="0.01" value={cr.specific_duty_usd || ''} onChange={(e) => setEditingRate({ ...cr, specific_duty_usd: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0" />
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="req-license" checked={cr.requires_import_license} onChange={(e) => setEditingRate({ ...cr, requires_import_license: e.target.checked })} className="rounded border-[#1E4A6D]" />
                        <label htmlFor="req-license" className="text-gray-400 text-sm">Licencia Importación</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="req-phyto" checked={cr.requires_phytosanitary} onChange={(e) => setEditingRate({ ...cr, requires_phytosanitary: e.target.checked })} className="rounded border-[#1E4A6D]" />
                        <label htmlFor="req-phyto" className="text-gray-400 text-sm">Fitosanitario</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="req-inen" checked={cr.requires_inen_certification} onChange={(e) => setEditingRate({ ...cr, requires_inen_certification: e.target.checked })} className="rounded border-[#1E4A6D]" />
                        <label htmlFor="req-inen" className="text-gray-400 text-sm">INEN</label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Notas</label>
                      <textarea value={cr.notes || ''} onChange={(e) => setEditingRate({ ...cr, notes: e.target.value })} rows={2} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white resize-none" placeholder="Notas adicionales" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="rate-active" checked={cr.is_active} onChange={(e) => setEditingRate({ ...cr, is_active: e.target.checked })} className="rounded border-[#1E4A6D]" />
                      <label htmlFor="rate-active" className="text-gray-400 text-sm">Activo</label>
                    </div>
                  </>
                );
              })()}

              {selectedRateView === 'transporte' && (() => {
                const tr = editingRate as InlandRateData;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Ciudad Origen *</label>
                        <input type="text" value={tr.origin_city || ''} onChange={(e) => setEditingRate({ ...tr, origin_city: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="Guayaquil" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Ciudad Destino *</label>
                        <input type="text" value={tr.destination_city || ''} onChange={(e) => setEditingRate({ ...tr, destination_city: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="Quito" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tipo Vehículo</label>
                        <select value={tr.vehicle_type || 'camion_8t'} onChange={(e) => setEditingRate({ ...tr, vehicle_type: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white">
                          <option value="camion_8t">Camión 8T</option>
                          <option value="camion_12t">Camión 12T</option>
                          <option value="trailer">Trailer</option>
                          <option value="contenedor_20">Contenedor 20'</option>
                          <option value="contenedor_40">Contenedor 40'</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tarifa USD *</label>
                        <input type="number" step="0.01" value={tr.rate_usd || ''} onChange={(e) => setEditingRate({ ...tr, rate_usd: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tarifa por Kg</label>
                        <input type="number" step="0.01" value={tr.rate_per_kg_usd || ''} onChange={(e) => setEditingRate({ ...tr, rate_per_kg_usd: parseFloat(e.target.value) || null })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Horas Estimadas</label>
                        <input type="number" value={tr.estimated_hours || ''} onChange={(e) => setEditingRate({ ...tr, estimated_hours: parseInt(e.target.value) || null })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="8" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Distancia Km</label>
                        <input type="number" value={tr.distance_km || ''} onChange={(e) => setEditingRate({ ...tr, distance_km: parseInt(e.target.value) || null })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="450" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Transportista</label>
                      <input type="text" value={tr.carrier_name || ''} onChange={(e) => setEditingRate({ ...tr, carrier_name: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="Transportes ABC" />
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="inc-loading" checked={tr.includes_loading} onChange={(e) => setEditingRate({ ...tr, includes_loading: e.target.checked })} className="rounded border-[#1E4A6D]" />
                        <label htmlFor="inc-loading" className="text-gray-400 text-sm">Incluye Carga</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="inc-unloading" checked={tr.includes_unloading} onChange={(e) => setEditingRate({ ...tr, includes_unloading: e.target.checked })} className="rounded border-[#1E4A6D]" />
                        <label htmlFor="inc-unloading" className="text-gray-400 text-sm">Incluye Descarga</label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Notas</label>
                      <textarea value={tr.notes || ''} onChange={(e) => setEditingRate({ ...tr, notes: e.target.value })} rows={2} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white resize-none" placeholder="Notas adicionales" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="rate-active" checked={tr.is_active} onChange={(e) => setEditingRate({ ...tr, is_active: e.target.checked })} className="rounded border-[#1E4A6D]" />
                      <label htmlFor="rate-active" className="text-gray-400 text-sm">Activo</label>
                    </div>
                  </>
                );
              })()}

              {selectedRateView === 'agenciamiento' && (() => {
                const br = editingRate as BrokerageRateData;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Nombre *</label>
                        <input type="text" value={br.name || ''} onChange={(e) => setEditingRate({ ...br, name: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="Servicio Estándar" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tipo Servicio</label>
                        <select value={br.service_type || 'importacion_general'} onChange={(e) => setEditingRate({ ...br, service_type: e.target.value })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white">
                          <option value="importacion_general">Importación General</option>
                          <option value="importacion_simplificada">Importación Simplificada</option>
                          <option value="courier">Courier</option>
                          <option value="exportacion">Exportación</option>
                          <option value="transito">Tránsito</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Tarifa Fija USD *</label>
                        <input type="number" step="0.01" value={br.fixed_rate_usd || ''} onChange={(e) => setEditingRate({ ...br, fixed_rate_usd: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="150" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Porcentaje %</label>
                        <input type="number" step="0.01" value={br.percentage_rate || ''} onChange={(e) => setEditingRate({ ...br, percentage_rate: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Mínimo USD</label>
                        <input type="number" step="0.01" value={br.min_rate_usd || ''} onChange={(e) => setEditingRate({ ...br, min_rate_usd: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white" placeholder="150" />
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="inc-aforo" checked={br.includes_aforo} onChange={(e) => setEditingRate({ ...br, includes_aforo: e.target.checked })} className="rounded border-[#1E4A6D]" />
                        <label htmlFor="inc-aforo" className="text-gray-400 text-sm">Incluye Aforo</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="inc-trans" checked={br.includes_transmision} onChange={(e) => setEditingRate({ ...br, includes_transmision: e.target.checked })} className="rounded border-[#1E4A6D]" />
                        <label htmlFor="inc-trans" className="text-gray-400 text-sm">Incluye Transmisión</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="inc-almac" checked={br.includes_almacenaje} onChange={(e) => setEditingRate({ ...br, includes_almacenaje: e.target.checked })} className="rounded border-[#1E4A6D]" />
                        <label htmlFor="inc-almac" className="text-gray-400 text-sm">Incluye Almacenaje</label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Notas</label>
                      <textarea value={br.notes || ''} onChange={(e) => setEditingRate({ ...br, notes: e.target.value })} rows={2} className="w-full bg-[#0A2540] border border-[#1E4A6D] rounded-lg px-4 py-2 text-white resize-none" placeholder="Notas adicionales" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="rate-active" checked={br.is_active} onChange={(e) => setEditingRate({ ...br, is_active: e.target.checked })} className="rounded border-[#1E4A6D]" />
                      <label htmlFor="rate-active" className="text-gray-400 text-sm">Activo</label>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="p-6 border-t border-[#1E4A6D] flex gap-4">
              <button onClick={closeRateModal} className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveRate} disabled={savingRate} className="flex-1 px-4 py-3 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold">
                {savingRate ? 'Guardando...' : (rateModalMode === 'create' ? 'Crear Tarifa' : 'Guardar Cambios')}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {showRucHistoryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#0D2E4D] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#1E4A6D] flex flex-col">
            <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D] flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">Historial de Aprobaciones RUC</h3>
                <p className="text-gray-400 text-sm">Registro de todas las acciones de aprobación y rechazo</p>
              </div>
              <button
                onClick={() => setShowRucHistoryModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingRucHistory ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#00C9B7] border-t-transparent"></div>
                </div>
              ) : rucHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#1E4A6D]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-gray-500">📋</span>
                  </div>
                  <p className="text-gray-400">No hay registros de historial</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-[#1E4A6D]">
                        <th className="pb-3 px-2">Fecha</th>
                        <th className="pb-3 px-2">Usuario</th>
                        <th className="pb-3 px-2">RUC</th>
                        <th className="pb-3 px-2">Acción</th>
                        <th className="pb-3 px-2">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rucHistory.map((item) => (
                        <tr key={item.id} className="border-b border-[#1E4A6D]/50 hover:bg-[#1E4A6D]/20">
                          <td className="py-3 px-2 text-white text-sm">
                            {new Date(item.performed_at).toLocaleString('es-EC', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-2">
                            <p className="text-white text-sm">{item.user_name || 'N/A'}</p>
                            <p className="text-gray-400 text-xs">{item.user_email}</p>
                          </td>
                          <td className="py-3 px-2">
                            <p className="text-[#00C9B7] font-mono text-sm">{item.ruc_number}</p>
                            <p className="text-gray-400 text-xs">{item.company_name}</p>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              item.action === 'approved' 
                                ? 'bg-green-600/20 text-green-400' 
                                : 'bg-red-600/20 text-red-400'
                            }`}>
                              {item.action_display}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-gray-300 text-sm max-w-xs truncate">
                            {item.admin_notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {rucHistoryTotalPages > 1 && (
              <div className="p-4 border-t border-[#1E4A6D] flex justify-center items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => loadRucHistory(rucHistoryPage - 1)}
                  disabled={rucHistoryPage <= 1 || loadingRucHistory}
                  className="px-3 py-1 bg-[#1E4A6D] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2E5A7D] transition-colors"
                >
                  Anterior
                </button>
                <span className="text-gray-400 text-sm">
                  Página {rucHistoryPage} de {rucHistoryTotalPages}
                </span>
                <button
                  onClick={() => loadRucHistory(rucHistoryPage + 1)}
                  disabled={rucHistoryPage >= rucHistoryTotalPages || loadingRucHistory}
                  className="px-3 py-1 bg-[#1E4A6D] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2E5A7D] transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showQuoteModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#0D2E4D] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-[#1E4A6D] flex flex-col">
            <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D] flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Cotización {selectedQuote.cotizacion.numero_cotizacion}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedQuote.cotizacion.estado === 'aprobada' ? 'bg-green-600/20 text-green-400' :
                    selectedQuote.cotizacion.estado === 'pendiente' ? 'bg-yellow-600/20 text-yellow-400' :
                    selectedQuote.cotizacion.estado === 'en_transito' ? 'bg-blue-600/20 text-blue-400' :
                    selectedQuote.cotizacion.estado === 'cotizado' ? 'bg-purple-600/20 text-purple-400' :
                    selectedQuote.cotizacion.estado === 'ro_generado' ? 'bg-cyan-600/20 text-cyan-400' :
                    selectedQuote.cotizacion.estado === 'completada' ? 'bg-emerald-600/20 text-emerald-400' :
                    selectedQuote.cotizacion.estado === 'cancelada' ? 'bg-red-600/20 text-red-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>
                    {selectedQuote.cotizacion.estado.toUpperCase()}
                  </span>
                  {selectedQuote.cotizacion.ro_number && (
                    <span className="text-[#00C9B7] text-sm">RO: {selectedQuote.cotizacion.ro_number}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => alert('Exportar PDF - Funcionalidad próximamente')}
                  className="px-4 py-2 bg-[#A4FF00]/20 text-[#A4FF00] rounded-lg hover:bg-[#A4FF00]/30 transition-colors flex items-center gap-2 text-sm"
                >
                  <span>📄</span> Exportar PDF
                </button>
                <button
                  onClick={() => {
                    setShowQuoteModal(false);
                    setSelectedQuote(null);
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex border-b border-[#1E4A6D] flex-shrink-0 overflow-x-auto">
              {[
                { id: 'resumen', label: 'Resumen', icon: '📋' },
                { id: 'lineas', label: 'Líneas', icon: '📝' },
                { id: 'costos', label: 'Costos', icon: '💰' },
                { id: 'documentos', label: 'Documentos', icon: '📎' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQuoteDetailTab(tab.id as typeof quoteDetailTab)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    quoteDetailTab === tab.id
                      ? 'text-[#00C9B7] border-b-2 border-[#00C9B7]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {quoteDetailTab === 'resumen' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1E4A6D]/20 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Información del Cliente</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Nombre:</span>
                          <span className="text-white">{selectedQuote.customer.name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-white">{selectedQuote.customer.email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Empresa:</span>
                          <span className="text-white">{selectedQuote.customer.company || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">RUC:</span>
                          <span className="text-[#00C9B7] font-mono">{selectedQuote.customer.ruc || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Teléfono:</span>
                          <span className="text-white">{selectedQuote.customer.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ciudad:</span>
                          <span className="text-white">{selectedQuote.customer.city || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1E4A6D]/20 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Detalles de Carga</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tipo de Carga:</span>
                          <span className="text-white capitalize">{selectedQuote.cotizacion.tipo_carga}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Origen:</span>
                          <span className="text-white">{selectedQuote.cotizacion.origen_ciudad}, {selectedQuote.cotizacion.origen_pais}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Destino:</span>
                          <span className="text-white">{selectedQuote.cotizacion.destino_ciudad}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Incoterm:</span>
                          <span className="text-[#00C9B7]">{selectedQuote.cotizacion.incoterm}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Peso:</span>
                          <span className="text-white">{selectedQuote.cotizacion.peso_kg.toLocaleString('es-EC')} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Volumen:</span>
                          <span className="text-white">{selectedQuote.cotizacion.volumen_cbm?.toLocaleString('es-EC') || '-'} m³</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Valor Mercancía:</span>
                          <span className="text-[#A4FF00]">${selectedQuote.cotizacion.valor_mercancia_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })} USD</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1E4A6D]/20 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Descripción de Mercancía</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedQuote.cotizacion.descripcion_mercancia}</p>
                  </div>

                  {selectedQuote.cotizacion.notas_adicionales && (
                    <div className="bg-[#1E4A6D]/20 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Notas Adicionales</h4>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedQuote.cotizacion.notas_adicionales}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#1E4A6D]/30 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Creada</p>
                      <p className="text-white text-sm">{new Date(selectedQuote.cotizacion.fecha_creacion).toLocaleDateString('es-EC')}</p>
                    </div>
                    <div className="bg-[#1E4A6D]/30 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Actualizada</p>
                      <p className="text-white text-sm">{new Date(selectedQuote.cotizacion.fecha_actualizacion).toLocaleDateString('es-EC')}</p>
                    </div>
                    <div className="bg-[#1E4A6D]/30 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Requiere Seguro</p>
                      <p className={`text-sm ${selectedQuote.cotizacion.requiere_seguro ? 'text-green-400' : 'text-gray-500'}`}>
                        {selectedQuote.cotizacion.requiere_seguro ? 'Sí' : 'No'}
                      </p>
                    </div>
                    <div className="bg-[#1E4A6D]/30 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Transporte Interno</p>
                      <p className={`text-sm ${selectedQuote.cotizacion.requiere_transporte_interno ? 'text-green-400' : 'text-gray-500'}`}>
                        {selectedQuote.cotizacion.requiere_transporte_interno ? 'Sí' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {quoteDetailTab === 'lineas' && (
                <div className="space-y-6">
                  {selectedQuote.scenarios.length > 0 ? (
                    selectedQuote.scenarios.map((scenario) => (
                      <div key={scenario.id} className="bg-[#1E4A6D]/20 rounded-lg overflow-hidden">
                        <div className="p-4 bg-[#1E4A6D]/40 flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-semibold">{scenario.nombre}</h4>
                            <span className="text-gray-400 text-sm capitalize">{scenario.tipo} • {scenario.tipo_transporte}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {scenario.is_selected && (
                              <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Seleccionado</span>
                            )}
                            <span className="text-[#A4FF00] font-bold">${scenario.total_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        {scenario.lineas.length > 0 ? (
                          <table className="w-full">
                            <thead className="bg-[#0A2540]/50">
                              <tr>
                                <th className="px-4 py-2 text-left text-gray-400 text-xs">Categoría</th>
                                <th className="px-4 py-2 text-left text-gray-400 text-xs">Descripción</th>
                                <th className="px-4 py-2 text-right text-gray-400 text-xs">Cantidad</th>
                                <th className="px-4 py-2 text-right text-gray-400 text-xs">P.Unit USD</th>
                                <th className="px-4 py-2 text-right text-gray-400 text-xs">Subtotal USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {scenario.lineas.map((linea) => (
                                <tr key={linea.id} className="border-t border-[#1E4A6D]/50">
                                  <td className="px-4 py-2 text-sm">
                                    <span className="text-[#00C9B7]">{linea.categoria_display}</span>
                                    {linea.es_estimado && <span className="ml-1 text-yellow-400 text-xs">*</span>}
                                  </td>
                                  <td className="px-4 py-2 text-white text-sm">{linea.descripcion}</td>
                                  <td className="px-4 py-2 text-gray-400 text-sm text-right">{linea.cantidad}</td>
                                  <td className="px-4 py-2 text-gray-400 text-sm text-right">${linea.precio_unitario_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-2 text-white text-sm text-right font-medium">${linea.subtotal_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="p-4 text-gray-500 text-center">Sin líneas de detalle</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No hay escenarios de cotización disponibles</p>
                    </div>
                  )}
                </div>
              )}

              {quoteDetailTab === 'costos' && (
                <div className="space-y-6">
                  <div className="bg-[#1E4A6D]/20 rounded-lg overflow-hidden">
                    <div className="p-4 bg-[#1E4A6D]/40">
                      <h4 className="text-white font-semibold">Desglose de Costos</h4>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-[#1E4A6D]/50">
                        <span className="text-gray-400">Flete Internacional</span>
                        <span className="text-white font-medium">${selectedQuote.costs.flete_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#1E4A6D]/50">
                        <span className="text-gray-400">Seguro</span>
                        <span className="text-white font-medium">${selectedQuote.costs.seguro_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#1E4A6D]/50">
                        <span className="text-gray-400">Aduana / Agenciamiento</span>
                        <span className="text-white font-medium">${selectedQuote.costs.aduana_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#1E4A6D]/50">
                        <span className="text-gray-400">Transporte Interno</span>
                        <span className="text-white font-medium">${selectedQuote.costs.transporte_interno_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#1E4A6D]/50">
                        <span className="text-gray-400">Otros Gastos</span>
                        <span className="text-white font-medium">${selectedQuote.costs.otros_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-[#00C9B7]/10 rounded-lg px-3 mt-4">
                        <span className="text-[#00C9B7] font-semibold">Total Cotizado</span>
                        <span className="text-[#A4FF00] font-bold text-xl">${selectedQuote.costs.total_usd.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#1E4A6D]/20 rounded-lg p-4">
                      <h5 className="text-white font-medium mb-3">Shipper</h5>
                      <p className="text-gray-300 text-sm">{selectedQuote.cotizacion.shipper_name || 'No especificado'}</p>
                      {selectedQuote.cotizacion.shipper_address && (
                        <p className="text-gray-400 text-xs mt-1">{selectedQuote.cotizacion.shipper_address}</p>
                      )}
                    </div>
                    <div className="bg-[#1E4A6D]/20 rounded-lg p-4">
                      <h5 className="text-white font-medium mb-3">Consignatario</h5>
                      <p className="text-gray-300 text-sm">{selectedQuote.cotizacion.consignee_name || 'No especificado'}</p>
                      {selectedQuote.cotizacion.consignee_address && (
                        <p className="text-gray-400 text-xs mt-1">{selectedQuote.cotizacion.consignee_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {quoteDetailTab === 'documentos' && (
                <div className="space-y-4">
                  {selectedQuote.documents.length > 0 ? (
                    selectedQuote.documents.map((doc) => (
                      <div key={`${doc.source}-${doc.id}`} className="bg-[#1E4A6D]/20 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#00C9B7]/20 rounded-lg flex items-center justify-center">
                            <span className="text-[#00C9B7]">📄</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{doc.file_name}</p>
                            <p className="text-gray-400 text-xs">{doc.type_display} • {doc.source === 'shipping_instruction' ? 'Instrucción de Embarque' : 'Pre-liquidación'}</p>
                          </div>
                        </div>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#00C9B7]/20 text-[#00C9B7] rounded text-sm hover:bg-[#00C9B7]/30 transition-colors"
                          >
                            Ver
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#1E4A6D]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-gray-500">📎</span>
                      </div>
                      <p className="text-gray-400">No hay documentos adjuntos a esta cotización</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loadingQuoteDetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0D2E4D] rounded-xl p-8 border border-[#1E4A6D]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00C9B7] border-t-transparent mx-auto"></div>
            <p className="text-white mt-4">Cargando detalles...</p>
          </div>
        </div>
      )}

      {showUserDetailModal && selectedUserDetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#0D2E4D] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-[#1E4A6D] flex flex-col">
            <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D] flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedUserDetail.user.full_name}</h3>
                <p className="text-gray-400 text-sm">{selectedUserDetail.user.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserDetailModal(false);
                  setSelectedUserDetail(null);
                  setEditingUser(false);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex border-b border-[#1E4A6D] flex-shrink-0 overflow-x-auto">
              {[
                { id: 'info', label: 'Info', icon: '👤' },
                { id: 'cotizaciones', label: 'Cotizaciones', icon: '📋' },
                { id: 'shipping', label: 'Shipping', icon: '📦' },
                { id: 'ros', label: 'ROs', icon: '🔗' },
                { id: 'shipments', label: 'Shipments', icon: '🚢' },
                { id: 'preliq', label: 'Pre-liq', icon: '💵' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setUserDetailTab(tab.id as typeof userDetailTab)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    userDetailTab === tab.id
                      ? 'text-[#00C9B7] border-b-2 border-[#00C9B7]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {userDetailTab === 'info' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#1E4A6D]/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-[#00C9B7]">{selectedUserDetail.stats.total_cotizaciones}</p>
                      <p className="text-gray-400 text-sm">Cotizaciones</p>
                    </div>
                    <div className="bg-[#1E4A6D]/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-400">{selectedUserDetail.stats.cotizaciones_aprobadas}</p>
                      <p className="text-gray-400 text-sm">Aprobadas</p>
                    </div>
                    <div className="bg-[#1E4A6D]/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-400">{selectedUserDetail.stats.total_ros}</p>
                      <p className="text-gray-400 text-sm">ROs</p>
                    </div>
                    <div className="bg-[#1E4A6D]/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-400">{selectedUserDetail.stats.total_shipments}</p>
                      <p className="text-gray-400 text-sm">Shipments</p>
                    </div>
                  </div>

                  <div className="bg-[#1E4A6D]/20 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-white">Información del Usuario</h4>
                      {!editingUser ? (
                        <button
                          onClick={() => {
                            setEditingUser(true);
                            setUserEditForm({
                              first_name: selectedUserDetail.user.first_name,
                              last_name: selectedUserDetail.user.last_name,
                              phone: selectedUserDetail.user.phone || '',
                              company_name: selectedUserDetail.user.company_name || '',
                              city: selectedUserDetail.user.city || '',
                              country: selectedUserDetail.user.country || '',
                            });
                          }}
                          className="text-[#00C9B7] hover:text-[#00C9B7]/80 text-sm"
                        >
                          Editar
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingUser(false)}
                            className="text-gray-400 hover:text-white text-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleUpdateUser}
                            className="text-[#00C9B7] hover:text-[#00C9B7]/80 text-sm font-semibold"
                          >
                            Guardar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editingUser ? (
                        <>
                          <div>
                            <label className="block text-gray-400 text-sm mb-1">Nombre</label>
                            <input
                              type="text"
                              value={userEditForm.first_name || ''}
                              onChange={(e) => setUserEditForm({ ...userEditForm, first_name: e.target.value })}
                              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-sm mb-1">Apellido</label>
                            <input
                              type="text"
                              value={userEditForm.last_name || ''}
                              onChange={(e) => setUserEditForm({ ...userEditForm, last_name: e.target.value })}
                              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-sm mb-1">Teléfono</label>
                            <input
                              type="text"
                              value={userEditForm.phone || ''}
                              onChange={(e) => setUserEditForm({ ...userEditForm, phone: e.target.value })}
                              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-sm mb-1">Empresa</label>
                            <input
                              type="text"
                              value={userEditForm.company_name || ''}
                              onChange={(e) => setUserEditForm({ ...userEditForm, company_name: e.target.value })}
                              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded px-3 py-2 text-white"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div><span className="text-gray-400">Nombre:</span> <span className="text-white ml-2">{selectedUserDetail.user.first_name} {selectedUserDetail.user.last_name}</span></div>
                          <div><span className="text-gray-400">Email:</span> <span className="text-white ml-2">{selectedUserDetail.user.email}</span></div>
                          <div><span className="text-gray-400">Teléfono:</span> <span className="text-white ml-2">{selectedUserDetail.user.phone || '-'}</span></div>
                          <div><span className="text-gray-400">WhatsApp:</span> <span className="text-white ml-2">{selectedUserDetail.user.whatsapp || '-'}</span></div>
                          <div><span className="text-gray-400">Empresa:</span> <span className="text-white ml-2">{selectedUserDetail.user.company_name || '-'}</span></div>
                          <div><span className="text-gray-400">Ciudad:</span> <span className="text-white ml-2">{selectedUserDetail.user.city || '-'}</span></div>
                          <div><span className="text-gray-400">País:</span> <span className="text-white ml-2">{selectedUserDetail.user.country || '-'}</span></div>
                          <div><span className="text-gray-400">Rol:</span> <span className="px-2 py-1 bg-[#00C9B7]/20 text-[#00C9B7] rounded text-sm ml-2">{selectedUserDetail.user.role}</span></div>
                          <div><span className="text-gray-400">Estado:</span> <span className={`px-2 py-1 rounded text-sm ml-2 ${selectedUserDetail.user.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{selectedUserDetail.user.is_active ? 'Activo' : 'Inactivo'}</span></div>
                          <div><span className="text-gray-400">Email verificado:</span> <span className="text-white ml-2">{selectedUserDetail.user.is_email_verified ? 'Sí' : 'No'}</span></div>
                          <div><span className="text-gray-400">Registrado:</span> <span className="text-white ml-2">{new Date(selectedUserDetail.user.date_joined).toLocaleDateString('es-EC')}</span></div>
                          <div><span className="text-gray-400">Último login:</span> <span className="text-white ml-2">{selectedUserDetail.user.last_login ? new Date(selectedUserDetail.user.last_login).toLocaleDateString('es-EC') : 'Nunca'}</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedUserDetail.rucs.length > 0 && (
                    <div className="bg-[#1E4A6D]/20 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-4">RUCs Asociados</h4>
                      <div className="space-y-2">
                        {selectedUserDetail.rucs.map((ruc) => (
                          <div key={ruc.id} className="flex items-center justify-between p-3 bg-[#1E4A6D]/30 rounded-lg">
                            <div>
                              <p className="text-white font-mono">{ruc.ruc}</p>
                              <p className="text-gray-400 text-sm">{ruc.company_name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {ruc.is_primary && (
                                <span className="px-2 py-1 bg-[#00C9B7]/20 text-[#00C9B7] rounded text-xs">Principal</span>
                              )}
                              <span className={`px-2 py-1 rounded text-xs ${
                                ruc.status === 'approved' ? 'bg-green-600/20 text-green-400' :
                                ruc.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                                'bg-red-600/20 text-red-400'
                              }`}>
                                {ruc.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-[#1E4A6D]">
                    <button
                      onClick={() => handleDeactivateUser(selectedUserDetail.user.id, selectedUserDetail.user.is_active)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        selectedUserDetail.user.is_active
                          ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                          : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      }`}
                    >
                      {selectedUserDetail.user.is_active ? 'Desactivar Usuario' : 'Activar Usuario'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedUserDetail.user.id)}
                      className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 font-medium"
                    >
                      Eliminar Permanentemente
                    </button>
                  </div>
                </div>
              )}

              {userDetailTab === 'cotizaciones' && (
                <div className="space-y-2">
                  {selectedUserDetail.cotizaciones.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay cotizaciones</p>
                  ) : (
                    selectedUserDetail.cotizaciones.map((cot: Record<string, unknown>) => (
                      <div key={cot.id as number} className="p-3 bg-[#1E4A6D]/20 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-white font-mono">{cot.numero_cotizacion as string}</p>
                          <p className="text-gray-400 text-sm">{cot.origen as string} → {cot.destino as string}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#A4FF00] font-semibold">${((cot.total_usd as number) || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                          <span className={`px-2 py-1 rounded text-xs ${
                            cot.estado === 'aprobada' ? 'bg-green-600/20 text-green-400' :
                            cot.estado === 'pendiente' ? 'bg-yellow-600/20 text-yellow-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {cot.estado as string}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {userDetailTab === 'shipping' && (
                <div className="space-y-2">
                  {selectedUserDetail.shipping_instructions.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay instrucciones de embarque</p>
                  ) : (
                    selectedUserDetail.shipping_instructions.map((si: Record<string, unknown>) => (
                      <div key={si.id as number} className="p-3 bg-[#1E4A6D]/20 rounded-lg">
                        <p className="text-white font-mono">{si.reference as string || `SI-${si.id}`}</p>
                        <p className="text-gray-400 text-sm">{si.status as string}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {userDetailTab === 'ros' && (
                <div className="space-y-2">
                  {selectedUserDetail.routing_orders.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay routing orders</p>
                  ) : (
                    selectedUserDetail.routing_orders.map((ro: Record<string, unknown>) => (
                      <div key={ro.id as number} className="p-3 bg-[#1E4A6D]/20 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-white font-mono">{ro.ro_number as string}</p>
                          <p className="text-gray-400 text-sm">{ro.consignee_name as string}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          ro.status === 'completado' ? 'bg-green-600/20 text-green-400' :
                          ro.status === 'en_proceso' ? 'bg-blue-600/20 text-blue-400' :
                          'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {ro.status as string}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {userDetailTab === 'shipments' && (
                <div className="space-y-2">
                  {selectedUserDetail.shipments.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay shipments</p>
                  ) : (
                    selectedUserDetail.shipments.map((ship: Record<string, unknown>) => (
                      <div key={ship.id as number} className="p-3 bg-[#1E4A6D]/20 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-white font-mono">{ship.reference as string || `SHIP-${ship.id}`}</p>
                          <p className="text-gray-400 text-sm">{ship.tracking_status as string || 'Sin tracking'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          ship.status === 'arribado' ? 'bg-green-600/20 text-green-400' :
                          ship.status === 'en_transito' ? 'bg-blue-600/20 text-blue-400' :
                          'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {ship.status as string}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {userDetailTab === 'preliq' && (
                <div className="space-y-2">
                  {selectedUserDetail.preliquidations.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay pre-liquidaciones</p>
                  ) : (
                    selectedUserDetail.preliquidations.map((pl: Record<string, unknown>) => (
                      <div key={pl.id as number} className="p-3 bg-[#1E4A6D]/20 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-white font-mono">{pl.reference as string || `PL-${pl.id}`}</p>
                        </div>
                        <p className="text-[#A4FF00] font-semibold">${((pl.total as number) || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loadingUserDetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0D2E4D] rounded-xl p-8 border border-[#1E4A6D]">
            <p className="text-white">Cargando detalles del usuario...</p>
          </div>
        </div>
      )}

      {showRouteAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D2E4D] rounded-xl p-6 w-full max-w-lg border border-[#1E4A6D]">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingRouteAssignment ? 'Editar Asignación de Ruta' : 'Nueva Asignación de Ruta'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Freight Forwarder</label>
                <select
                  value={routeAssignmentForm.ff_id}
                  onChange={(e) => setRouteAssignmentForm({ ...routeAssignmentForm, ff_id: e.target.value })}
                  className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Seleccionar FF...</option>
                  {availableFFs.map((ff) => (
                    <option key={ff.id} value={ff.id}>{ff.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Tipo de Transporte</label>
                <select
                  value={routeAssignmentForm.transport_type}
                  onChange={(e) => setRouteAssignmentForm({ ...routeAssignmentForm, transport_type: e.target.value })}
                  className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Seleccionar...</option>
                  <option value="maritimo">Marítimo</option>
                  <option value="aereo">Aéreo</option>
                  <option value="terrestre">Terrestre</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">País Origen</label>
                  <input
                    type="text"
                    value={routeAssignmentForm.origin_country}
                    onChange={(e) => setRouteAssignmentForm({ ...routeAssignmentForm, origin_country: e.target.value })}
                    className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                    placeholder="China"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Puerto Origen</label>
                  <input
                    type="text"
                    value={routeAssignmentForm.origin_port}
                    onChange={(e) => setRouteAssignmentForm({ ...routeAssignmentForm, origin_port: e.target.value })}
                    className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                    placeholder="Shanghai (opcional)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">Ciudad Destino</label>
                  <input
                    type="text"
                    value={routeAssignmentForm.destination_city}
                    onChange={(e) => setRouteAssignmentForm({ ...routeAssignmentForm, destination_city: e.target.value })}
                    className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                    placeholder="Guayaquil (opcional)"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Carrier</label>
                  <input
                    type="text"
                    value={routeAssignmentForm.carrier_name}
                    onChange={(e) => setRouteAssignmentForm({ ...routeAssignmentForm, carrier_name: e.target.value })}
                    className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                    placeholder="MSC (opcional)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Prioridad (1=más alta)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={routeAssignmentForm.priority}
                  onChange={(e) => setRouteAssignmentForm({ ...routeAssignmentForm, priority: e.target.value })}
                  className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Notas</label>
                <textarea
                  value={routeAssignmentForm.notes}
                  onChange={(e) => setRouteAssignmentForm({ ...routeAssignmentForm, notes: e.target.value })}
                  className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-2 text-white h-20"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRouteAssignmentModal(false);
                  setEditingRouteAssignment(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRouteAssignment}
                disabled={!routeAssignmentForm.ff_id || !routeAssignmentForm.transport_type}
                className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00C9B7]/80 disabled:opacity-50"
              >
                {editingRouteAssignment ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
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
