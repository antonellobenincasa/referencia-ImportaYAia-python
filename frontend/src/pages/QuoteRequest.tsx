import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { InlandTransportRate } from '../types';
import { Ship, Plane, Package, CheckCircle, Upload, X, FileText, AlertTriangle, Info } from 'lucide-react';
import SmartLocationSelector from '../components/SmartLocationSelector';
import MultiPOLSelector from '../components/MultiPOLSelector';

interface SelectedPOL {
  name: string;
  country: string;
  code?: string;
  display_name: string;
}

export default function QuoteRequest() {
  const { user } = useAuth();
  const isLeadUser = user?.role === 'lead';
  const containerTypeOptions = [
    { value: '20GP', label: '20\' GP (Standard)', maxWeight: 27000 },
    { value: '40GP', label: '40\' GP (Standard)', maxWeight: 27000 },
    { value: '40HC', label: '40\' HC (High Cube)', maxWeight: 27000 },
    { value: '40NOR', label: '40\' NOR', maxWeight: 27000 },
    { value: '20REEFER', label: '20\' Reefer', maxWeight: 27000 },
    { value: '40REEFER', label: '40\' Reefer', maxWeight: 27000 },
    { value: '40OTHC', label: '40\' OT HC (Open Top)', maxWeight: 27000 },
    { value: '20FR', label: '20\' Flat Rack', maxWeight: 27000 },
    { value: '40FR', label: '40\' Flat Rack', maxWeight: 27000 },
    { value: '40OT', label: '40\' Open Top', maxWeight: 27000 },
    { value: '20OT', label: '20\' Open Top', maxWeight: 27000 },
  ];

  interface ContainerSelection {
    type: string;
    quantity: number;
    weight_kg: string;
  }

  const incoterms = [
    'FOB',
    'FCA',
    'EXW',
    'CIF',
    'CFR',
    'DAP',
    'DDP',
    'DPU',
    'FAS',
    'CPT',
    'CIP',
    'DAT',
  ];

  const productOriginCountries = [
    'China',
    'Estados Unidos',
    'Alemania',
    'Japón',
    'Corea del Sur',
    'India',
    'Italia',
    'Francia',
    'Reino Unido',
    'España',
    'México',
    'Brasil',
    'Taiwán',
    'Vietnam',
    'Tailandia',
    'Malasia',
    'Indonesia',
    'Turquía',
    'Países Bajos',
    'Bélgica',
    'Canadá',
    'Australia',
    'Singapur',
    'Suiza',
    'Polonia',
    'República Checa',
    'Emiratos Árabes Unidos',
    'Arabia Saudita',
    'Argentina',
    'Colombia',
    'Chile',
    'Perú',
    'Otro',
  ];

  const documentTypes = [
    { value: 'factura_comercial', label: 'Factura Comercial' },
    { value: 'packing_list', label: 'Packing List' },
    { value: 'permiso_arcsa', label: 'Permiso ARCSA' },
    { value: 'permiso_agrocalidad', label: 'Permiso Agrocalidad' },
    { value: 'certificado_inen', label: 'Certificado INEN' },
    { value: 'msds', label: 'MSDS (Hoja de Seguridad)' },
    { value: 'ficha_tecnica', label: 'Ficha Técnica' },
    { value: 'otro', label: 'Otro Documento' },
  ];

  const [formData, setFormData] = useState({
    landing_page: 1,
    first_name: isLeadUser && user ? user.first_name : '',
    last_name: isLeadUser && user ? user.last_name : '',
    email: isLeadUser && user ? user.email : '',
    phone: isLeadUser && user ? user.phone : '',
    is_company: isLeadUser && user?.company_name ? true : false,
    company_name: isLeadUser && user ? user.company_name : '',
    company_ruc: isLeadUser && user?.ruc ? user.ruc : '',
    transport_type: 'ocean_fcl' as 'air' | 'ocean_lcl' | 'ocean_fcl',
    pol_port_of_lading: '',
    pod_port_of_discharge: '',
    airport_origin: '',
    airport_destination: '',
    container_type: '1x40HC',
    incoterm: 'FOB',
    pickup_address: '',
    gross_weight_kg: '',
    pieces_quantity: 1,
    length: '',
    width: '',
    height: '',
    dimension_unit: 'cm' as 'cm' | 'inches',
    total_cbm: '',
    is_stackable: '' as '' | true | false,
    is_dg_cargo: false,
    is_general_cargo: true,
    needs_customs_clearance: false,
    needs_insurance: false,
    cargo_cif_value_usd: '',
    needs_inland_transport: false,
    inland_transport_city: '',
    inland_transport_street: '',
    inland_transport_street_number: '',
    inland_transport_zip_code: '',
    inland_transport_references: '',
    inland_transport_full_address: '',
    lead_comments: '',
    product_description: '',
    product_origin_country: '',
    fob_value_usd: '',
    hs_code_known: '',
    is_oce_registered: true,
  });

  const [showOceModal, setShowOceModal] = useState(false);
  
  const [containers, setContainers] = useState<ContainerSelection[]>([
    { type: '40HC', quantity: 1, weight_kg: '10000' }
  ]);
  
  const [selectedPOLs, setSelectedPOLs] = useState<SelectedPOL[]>([]);
  const [selectedPODs, setSelectedPODs] = useState<string[]>(['GYE']);
  
  const podOptions = [
    { code: 'GYE', name: 'Guayaquil', fullName: 'Puerto de Guayaquil, Ecuador' },
    { code: 'PSJ', name: 'Posorja', fullName: 'Puerto de Posorja, Ecuador' },
  ];
  
  const isMultiPortQuote = selectedPOLs.length > 1 || selectedPODs.length > 1;
  
  const togglePOD = (code: string) => {
    if (selectedPODs.includes(code)) {
      if (selectedPODs.length > 1) {
        setSelectedPODs(selectedPODs.filter(p => p !== code));
      }
    } else {
      setSelectedPODs([...selectedPODs, code]);
    }
  };
  
  const [cbmOverride, setCbmOverride] = useState(false);
  const [calculatedCbm, setCalculatedCbm] = useState('');
  const [containerWeightErrors, setContainerWeightErrors] = useState<Record<number, string>>({});

  interface UploadedDocument {
    file: File;
    type: string;
    description: string;
  }

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('factura_comercial');

  const [cities, setCities] = useState<string[]>([]);
  const [inlandRates, setInlandRates] = useState<InlandTransportRate[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dgDocuments, setDgDocuments] = useState<File[]>([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.getInlandTransportRates();
        const rates = (res.data.results || res.data) as InlandTransportRate[];
        setInlandRates(rates);
        const uniqueCities = Array.from(new Set(rates.map((r) => r.city)));
        setCities(uniqueCities);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (isLeadUser && user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        is_company: !!user.company_name,
        company_name: user.company_name || '',
        company_ruc: user.ruc || '',
      }));
    }
  }, [user, isLeadUser]);

  useEffect(() => {
    if (formData.transport_type !== 'ocean_fcl' && !cbmOverride) {
      const length = parseFloat(formData.length) || 0;
      const width = parseFloat(formData.width) || 0;
      const height = parseFloat(formData.height) || 0;
      const qty = formData.pieces_quantity || 1;
      
      if (length > 0 && width > 0 && height > 0) {
        let cbm: number;
        if (formData.dimension_unit === 'cm') {
          cbm = (length * width * height * qty) / 1000000;
        } else {
          const lengthCm = length * 2.54;
          const widthCm = width * 2.54;
          const heightCm = height * 2.54;
          cbm = (lengthCm * widthCm * heightCm * qty) / 1000000;
        }
        const cbmFormatted = cbm.toFixed(4);
        setCalculatedCbm(cbmFormatted);
        setFormData(prev => ({ ...prev, total_cbm: cbmFormatted }));
      }
    }
  }, [formData.length, formData.width, formData.height, formData.dimension_unit, formData.pieces_quantity, formData.transport_type, cbmOverride]);

  useEffect(() => {
    const errors: Record<number, string> = {};
    containers.forEach((container, index) => {
      const weight = parseFloat(container.weight_kg) || 0;
      const containerConfig = containerTypeOptions.find(c => c.value === container.type);
      const maxWeight = containerConfig?.maxWeight || 27000;
      
      if (weight > maxWeight) {
        errors[index] = `Peso excede ${maxWeight.toLocaleString()} kg por contenedor`;
      }
    });
    setContainerWeightErrors(errors);
  }, [containers]);

  useEffect(() => {
    if (formData.needs_insurance && formData.fob_value_usd && !formData.cargo_cif_value_usd) {
      setFormData(prev => ({ ...prev, cargo_cif_value_usd: prev.fob_value_usd }));
    }
  }, [formData.needs_insurance, formData.fob_value_usd]);

  const [oceModalConfirmed, setOceModalConfirmed] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rucRegex = /^\d{13}$/;
    if (!formData.company_ruc || !rucRegex.test(formData.company_ruc)) {
      alert('El RUC es obligatorio y debe tener exactamente 13 dígitos numéricos para solicitar una cotización.');
      return;
    }
    
    if (!formData.is_oce_registered && !oceModalConfirmed) {
      setShowOceModal(true);
      return;
    }
    
    if (formData.transport_type === 'ocean_fcl' && Object.keys(containerWeightErrors).length > 0) {
      alert('Por favor corrija los errores de peso en los contenedores antes de enviar.');
      return;
    }
    
    setLoading(true);
    try {
      const transportTypeMap: Record<string, string> = {
        ocean_fcl: 'FCL',
        ocean_lcl: 'LCL',
        air: 'AEREO'
      };

      const containerSummary = containers.map(c => {
        const typeLabel = containerTypeOptions.find(opt => opt.value === c.type)?.label || c.type;
        return `${c.quantity}x${typeLabel}`;
      }).join(' + ');
      
      const totalContainerWeight = containers.reduce((sum, c) => sum + (parseFloat(c.weight_kg) || 0) * c.quantity, 0);
      const totalContainerQty = containers.reduce((sum, c) => sum + c.quantity, 0);

      const isAir = formData.transport_type === 'air';
      const polList = isAir ? [formData.airport_origin || 'Shanghai'] : selectedPOLs.map(p => p.name);
      const podList = isAir ? [formData.airport_destination || 'Guayaquil'] : selectedPODs.map(code => {
        const pod = podOptions.find(p => p.code === code);
        return pod?.name || code;
      });
      const isMultiPort = polList.length > 1 || podList.length > 1;

      const submissionData = {
        company_name: formData.is_company ? formData.company_name : `${formData.first_name} ${formData.last_name}`,
        contact_name: `${formData.first_name} ${formData.last_name}`,
        contact_email: formData.email,
        contact_phone: formData.phone,
        contact_whatsapp: formData.phone,
        city: formData.inland_transport_city || 'Quito',
        
        origin: polList.join(' | '),
        destination: podList.join(' | '),
        transport_type: transportTypeMap[formData.transport_type] || 'FCL',
        
        is_multi_port_quote: isMultiPort,
        origin_ports: JSON.stringify(polList),
        destination_ports: JSON.stringify(podList),
        
        cargo_description: formData.product_description || (formData.is_general_cargo ? 'Carga General' : (formData.is_dg_cargo ? 'Carga Peligrosa' : 'Otro')),
        cargo_weight_kg: formData.transport_type === 'ocean_fcl' ? totalContainerWeight : (parseFloat(formData.gross_weight_kg) || 0),
        cargo_volume_cbm: parseFloat(formData.total_cbm) || 0,
        
        incoterm: formData.incoterm || 'FOB',
        quantity: formData.transport_type === 'ocean_fcl' ? totalContainerQty : (formData.pieces_quantity || 1),
        
        container_type: formData.transport_type === 'ocean_fcl' ? containerSummary : null,
        containers_detail: formData.transport_type === 'ocean_fcl' ? JSON.stringify(containers) : null,
        
        product_description: formData.product_description,
        product_origin_country: formData.product_origin_country,
        fob_value_usd: formData.fob_value_usd ? parseFloat(formData.fob_value_usd) : null,
        hs_code_known: formData.hs_code_known || null,
        
        company_ruc: formData.company_ruc,
        is_oce_registered: formData.is_oce_registered,
        
        profit_markup: 100.00,
        cost_rate_source: 'api'
      };

      const response = await api.submitQuoteRequest(submissionData);
      const quoteSubmissionId = response.data?.id;
      
      if (uploadedDocuments.length > 0 && quoteSubmissionId) {
        for (const doc of uploadedDocuments) {
          const formDataUpload = new FormData();
          formDataUpload.append('quote_submission', quoteSubmissionId.toString());
          formDataUpload.append('document_type', doc.type);
          formDataUpload.append('file', doc.file);
          formDataUpload.append('file_name', doc.file.name);
          formDataUpload.append('file_size', doc.file.size.toString());
          formDataUpload.append('description', doc.description);
          
          try {
            await api.uploadQuoteDocument(formDataUpload);
          } catch (docError) {
            console.error('Error uploading document:', docError);
          }
        }
      }
      
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting quote request:', error);
      alert('Error al enviar la solicitud. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-status-green mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 mb-6">
            Hemos recibido su solicitud de cotización. Nuestro equipo de ventas se pondrá en contacto con usted en breve.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                landing_page: 1,
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                is_company: false,
                company_name: '',
                company_ruc: '',
                transport_type: 'ocean_fcl',
                pol_port_of_lading: '',
                pod_port_of_discharge: '',
                airport_origin: '',
                airport_destination: '',
                container_type: '1x40HC',
                incoterm: 'FOB',
                pickup_address: '',
                gross_weight_kg: '',
                pieces_quantity: 1,
                length: '',
                width: '',
                height: '',
                dimension_unit: 'cm',
                total_cbm: '',
                is_stackable: '',
                is_dg_cargo: false,
                is_general_cargo: true,
                needs_customs_clearance: false,
                needs_insurance: false,
                cargo_cif_value_usd: '',
                needs_inland_transport: false,
                inland_transport_city: '',
                inland_transport_street: '',
                inland_transport_street_number: '',
                inland_transport_zip_code: '',
                inland_transport_references: '',
                inland_transport_full_address: '',
                lead_comments: '',
                product_description: '',
                product_origin_country: '',
                fob_value_usd: '',
                hs_code_known: '',
                is_oce_registered: true,
              } as any);
              setShowOceModal(false);
              setDgDocuments([]);
              setUploadedDocuments([]);
            }}
            className="bg-aqua-flow text-white px-6 py-3 rounded-lg hover:bg-aqua-flow-600 transition-colors duration-200 font-semibold"
          >
            Enviar Otra Solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-extrabold tracking-tighter-heading text-deep-ocean mb-2">Solicitar Cotización</h1>
        <p className="text-data-gray mb-8 font-mono tracking-ui text-sm">Complete el formulario para cotización en tiempo real</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isLeadUser && (
            <div className="bg-gradient-to-r from-[#00C9B7]/10 to-[#A4FF00]/10 border border-[#00C9B7]/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00C9B7] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#0A2540]">Datos de contacto pre-llenados</p>
                  <p className="text-sm text-gray-600">Tu información ya está registrada. Solo completa los datos de tu embarque.</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombres *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellidos *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_company}
                  onChange={(e) => setFormData({ ...formData, is_company: e.target.checked })}
                  className="h-5 w-5 text-aqua-flow border-gray-300 rounded cursor-pointer"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">¿Es una Empresa?</span>
              </label>
            </div>
          </div>

          {formData.is_company && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                />
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-[#0A2540]/5 to-[#00C9B7]/5 border border-[#0A2540]/20 rounded-xl p-6 mb-2">
            <h3 className="text-lg font-semibold text-[#0A2540] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#00C9B7]" />
              Información de Importador SENAE
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              ImportaYa.ia es una plataforma exclusiva para Importadores Registrados ante la SENAE. 
              Por favor proporcione su RUC y confirme su registro como Operador de Comercio Exterior (OCE).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUC (13 dígitos) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={13}
                  placeholder="Ej: 0992123456001"
                  value={formData.company_ruc}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                    setFormData({ ...formData, company_ruc: value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                />
                {formData.company_ruc && formData.company_ruc.length > 0 && (
                  <div className="mt-1">
                    {formData.company_ruc.length !== 13 ? (
                      <p className="text-xs text-red-500">El RUC debe tener exactamente 13 dígitos ({formData.company_ruc.length}/13)</p>
                    ) : !formData.company_ruc.endsWith('001') ? (
                      <p className="text-xs text-amber-500">Nota: RUC de empresa debe terminar en 001</p>
                    ) : (
                      <p className="text-xs text-green-600">RUC válido</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_oce_registered}
                    onChange={(e) => setFormData({ ...formData, is_oce_registered: e.target.checked })}
                    className="h-5 w-5 text-aqua-flow border-gray-300 rounded cursor-pointer mt-0.5"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Soy OCE Registrado ante SENAE</span>
                    <br />
                    <span className="text-xs text-gray-500">Operador de Comercio Exterior con RUC habilitado para importar</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Transporte</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'ocean_fcl', icon: Package, label: 'Marítimo FCL' },
                { value: 'ocean_lcl', icon: Ship, label: 'Marítimo LCL' },
                { value: 'air', icon: Plane, label: 'Aéreo' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, transport_type: type.value as any })}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center ${
                    formData.transport_type === type.value
                      ? 'border-aqua-flow bg-aqua-flow-50'
                      : 'border-gray-300 hover:border-aqua-flow-300'
                  }`}
                >
                  <type.icon className="h-8 w-8 mb-2" />
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.transport_type === 'air' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SmartLocationSelector
                type="airport"
                value={formData.airport_origin}
                onChange={(value) => setFormData({ ...formData, airport_origin: value })}
                label="AOL Aeropuerto de Origen"
                placeholder="Buscar aeropuerto (ej: Miami, Shanghai)..."
                required
              />
              <SmartLocationSelector
                type="airport"
                value={formData.airport_destination}
                onChange={(value) => setFormData({ ...formData, airport_destination: value })}
                label="AOD Aeropuerto de Destino"
                placeholder="Buscar aeropuerto Ecuador..."
                required
              />
            </div>
          )}

          {formData.transport_type !== 'air' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#0A2540]/5 to-[#00C9B7]/5 border border-[#0A2540]/20 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-5 h-5 text-[#00C9B7] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#0A2540]">Cotización Multi-Puerto</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Puede seleccionar múltiples puertos de origen (POL) para recibir un comparativo de tarifas. 
                      {isMultiPortQuote && (
                        <span className="text-[#00C9B7] font-medium"> Se generará un tarifario comparativo sin totalizar.</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MultiPOLSelector
                    selectedPOLs={selectedPOLs}
                    onChange={setSelectedPOLs}
                    label="POL Puertos de Origen"
                    required
                    maxSelections={10}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      POD Puertos de Destino (Ecuador) *
                      <span className="text-xs text-gray-500 font-normal ml-2">(Máximo 2 puertos)</span>
                    </label>
                    <div className="space-y-3">
                      {podOptions.map((pod) => (
                        <label
                          key={pod.code}
                          className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedPODs.includes(pod.code)
                              ? 'border-[#00C9B7] bg-gradient-to-r from-[#00C9B7]/10 to-[#A4FF00]/10'
                              : 'border-gray-200 hover:border-[#00C9B7]/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPODs.includes(pod.code)}
                            onChange={() => togglePOD(pod.code)}
                            className="w-5 h-5 text-[#00C9B7] border-gray-300 rounded focus:ring-[#00C9B7]"
                          />
                          <Ship className={`w-5 h-5 ${selectedPODs.includes(pod.code) ? 'text-[#00C9B7]' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <span className="font-medium text-[#0A2540]">{pod.name}</span>
                            <span className="text-xs text-gray-500 font-mono ml-2">({pod.code})</span>
                            <p className="text-xs text-gray-500">{pod.fullName}</p>
                          </div>
                          {selectedPODs.includes(pod.code) && (
                            <CheckCircle className="w-5 h-5 text-[#00C9B7]" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {isMultiPortQuote && (
                  <div className="mt-4 p-3 bg-[#A4FF00]/20 border border-[#A4FF00]/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="w-4 h-4 text-[#0A2540]" />
                      <span className="font-medium text-[#0A2540]">
                        Modo Tarifario Multi-Puerto: {selectedPOLs.length} POL × {selectedPODs.length} POD = {selectedPOLs.length * selectedPODs.length} combinaciones
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 ml-6">
                      Recibirá una tabla comparativa con todas las rutas sin totalizar, incluyendo gastos locales en destino.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.transport_type === 'ocean_fcl' && (
            <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-[#0A2540]/5 to-[#00C9B7]/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#0A2540] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#00C9B7]" />
                  Configuración de Contenedores FCL
                </h3>
                <button
                  type="button"
                  onClick={() => setContainers([...containers, { type: '40HC', quantity: 1, weight_kg: '10000' }])}
                  className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00b3a3] transition-colors text-sm font-medium"
                >
                  + Agregar Contenedor
                </button>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Límite de peso:</span> Máximo 27,000 KG por contenedor. Si su carga excede este límite, debe distribuirla en múltiples contenedores.
                </p>
              </div>

              <div className="space-y-4">
                {containers.map((container, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Contenedor #{index + 1}</span>
                      {containers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setContainers(containers.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tipo de Contenedor *
                        </label>
                        <select
                          required
                          value={container.type}
                          onChange={(e) => {
                            const updated = [...containers];
                            updated[index].type = e.target.value;
                            setContainers(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7] text-sm"
                        >
                          {containerTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="50"
                          value={container.quantity}
                          onChange={(e) => {
                            const updated = [...containers];
                            updated[index].quantity = parseInt(e.target.value) || 1;
                            setContainers(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Peso por Contenedor (KG) *
                        </label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          max="27000"
                          value={container.weight_kg}
                          onChange={(e) => {
                            const updated = [...containers];
                            updated[index].weight_kg = e.target.value;
                            setContainers(updated);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7] text-sm ${
                            containerWeightErrors[index] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Max 27,000"
                        />
                        {containerWeightErrors[index] && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {containerWeightErrors[index]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-[#0A2540]/10 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#0A2540]">Total Contenedores:</span>
                  <span className="font-bold text-[#00C9B7]">
                    {containers.reduce((sum, c) => sum + c.quantity, 0)} unidades
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="font-medium text-[#0A2540]">Peso Total Estimado:</span>
                  <span className="font-bold text-[#00C9B7]">
                    {containers.reduce((sum, c) => sum + (parseFloat(c.weight_kg) || 0) * c.quantity, 0).toLocaleString()} KG
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.transport_type !== 'ocean_fcl' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso Bruto estimado (KG) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.gross_weight_kg}
                  onChange={(e) => setFormData({ ...formData, gross_weight_kg: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  placeholder="Ingrese el peso bruto en KG"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incoterm *
              </label>
              <select
                required
                value={formData.incoterm}
                onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
              >
                {incoterms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(formData.incoterm === 'EXW' || formData.incoterm === 'FCA') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Exacta de Recogida en Origen {formData.incoterm === 'EXW' && '*'}
              </label>
              <textarea
                required={formData.incoterm === 'EXW'}
                value={formData.pickup_address}
                onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                placeholder="Ingrese la dirección exacta de recogida, calle, número, ciudad, código postal, referencias, etc."
                rows={3}
              />
              <p className="text-sm text-amber-700 mt-2">
                <span className="font-semibold">Importante:</span> Para incoterm EXW, obligatorio detallar dirección de recogida, para FCA solo en caso de que el shipper no entregue la carga en aeropuerto y nos toque recoger igual la carga.
              </p>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Producto</h3>
            <div className="bg-gradient-to-r from-[#00C9B7]/5 to-[#A4FF00]/5 border border-[#00C9B7]/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#0A2540]">Clasificación IA:</span> Nuestra inteligencia artificial analizará la descripción del producto para sugerir el código arancelario (HS Code) y calcular los tributos de importación de forma automática.
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Producto *
                </label>
                <textarea
                  required
                  value={formData.product_description}
                  onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  placeholder="Describa detalladamente el producto que desea importar: nombre comercial, material, uso/función, marca, modelo, características principales..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ej: "Zapatos deportivos para hombre, marca Nike, modelo Air Max, suela de goma, parte superior de tela sintética, para uso casual"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País de Origen/Fabricación *
                  </label>
                  <select
                    required
                    value={formData.product_origin_country}
                    onChange={(e) => setFormData({ ...formData, product_origin_country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  >
                    <option value="">Seleccione país de origen...</option>
                    {productOriginCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor FOB Aproximado (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.fob_value_usd}
                    onChange={(e) => setFormData({ ...formData, fob_value_usd: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    placeholder="Ej: 15000.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor de la mercancía sin incluir flete ni seguro
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código HS (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.hs_code_known}
                  onChange={(e) => setFormData({ ...formData, hs_code_known: e.target.value })}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  placeholder="Ej: 6403.99.90"
                  maxLength={15}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si conoce el código arancelario de su producto, ingréselo aquí. De lo contrario, nuestra IA lo clasificará automáticamente.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Adjuntos (Opcional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adjunte documentos relevantes como Factura Comercial, Packing List, permisos o fichas técnicas para agilizar el proceso de cotización.
            </p>
            
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  >
                    {documentTypes.map((doc) => (
                      <option key={doc.value} value={doc.value}>
                        {doc.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="doc-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedDocuments(prev => [...prev, {
                            file,
                            type: selectedDocType,
                            description: documentTypes.find(d => d.value === selectedDocType)?.label || selectedDocType
                          }]);
                          e.target.value = '';
                        }
                      }}
                    />
                    <label
                      htmlFor="doc-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-aqua-flow hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Seleccionar archivo</span>
                    </label>
                  </div>
                </div>
              </div>

              {uploadedDocuments.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Documentos adjuntos ({uploadedDocuments.length})</p>
                  <div className="space-y-2">
                    {uploadedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-aqua-flow" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.file.name}</p>
                            <p className="text-xs text-gray-500">{doc.description} - {(doc.file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedDocuments(prev => prev.filter((_, i) => i !== index))}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Carga</h3>
            
            {formData.transport_type !== 'ocean_fcl' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Largo *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                      placeholder="Ej: 100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ancho *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                      placeholder="Ej: 50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Altura *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                      placeholder="Ej: 80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida *
                    </label>
                    <select
                      required
                      value={formData.dimension_unit}
                      onChange={(e) => setFormData({ ...formData, dimension_unit: e.target.value as 'cm' | 'inches' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    >
                      <option value="cm">Centímetros (CM)</option>
                      <option value="inches">Pulgadas (Inches)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad de Bultos *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.pieces_quantity}
                      onChange={(e) => setFormData({ ...formData, pieces_quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                      placeholder="Ej: 10"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Total CBM *
                      </label>
                      <label className="flex items-center text-xs text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cbmOverride}
                          onChange={(e) => setCbmOverride(e.target.checked)}
                          className="mr-1 h-3 w-3"
                        />
                        Manual
                      </label>
                    </div>
                    <input
                      type="number"
                      required
                      step="0.0001"
                      value={formData.total_cbm}
                      onChange={(e) => setFormData({ ...formData, total_cbm: e.target.value })}
                      disabled={!cbmOverride}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow ${
                        cbmOverride ? 'border-gray-300 bg-white' : 'border-[#00C9B7] bg-[#00C9B7]/10'
                      }`}
                      placeholder="Calculado automáticamente"
                    />
                    {!cbmOverride && calculatedCbm && (
                      <p className="text-xs text-[#00C9B7] mt-1 font-medium">
                        Calculado: {calculatedCbm} m³
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿La carga es APILABLE? *
                  </label>
                  <select
                    required
                    value={formData.is_stackable.toString()}
                    onChange={(e) => setFormData({ ...formData, is_stackable: e.target.value === 'true' ? true : false })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  >
                    <option value="">Seleccione una opción...</option>
                    <option value="true">Sí, es apilable</option>
                    <option value="false">No, no es apilable</option>
                  </select>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Es carga PELIGROSA/DG CARGO/IMO? *
                </label>
                <select
                  required
                  value={formData.is_dg_cargo.toString()}
                  onChange={(e) => setFormData({ ...formData, is_dg_cargo: e.target.value === 'true', is_general_cargo: e.target.value === 'false' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                >
                  <option value="false">Carga General</option>
                  <option value="true">Carga Peligrosa - DG Cargo IMO</option>
                </select>
              </div>
            </div>

            {formData.is_dg_cargo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 mb-4">
                  <span className="font-semibold">Cargas Peligrosas:</span> Por favor adjunte documentos como MSDS (Hoja de Datos de Seguridad) y otros documentos relacionados con la carga peligrosa.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjuntar Documentos (MSDS, etc.) - Opcional
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setDgDocuments(Array.from(e.target.files || []))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  {dgDocuments.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {dgDocuments.length} archivo(s) seleccionado(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios Adicionales (Opcional)
              </label>
              <textarea
                value={formData.lead_comments}
                onChange={(e) => setFormData({ ...formData, lead_comments: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                placeholder="Ingrese cualquier comentario adicional sobre la carga..."
                rows={4}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicio Integral (Opcional)</h3>
            
            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.needs_customs_clearance}
                  onChange={(e) => setFormData({ ...formData, needs_customs_clearance: e.target.checked })}
                  className="mt-1 h-4 w-4 text-aqua-flow border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="block font-medium text-gray-900">Honorarios Agenciamiento Aduanero</span>
                  <span className="block text-sm text-gray-500">USD 339.25 (USD 295 + 15% IVA)</span>
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.needs_insurance}
                  onChange={(e) => setFormData({ ...formData, needs_insurance: e.target.checked })}
                  className="mt-1 h-4 w-4 text-aqua-flow border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="block font-medium text-gray-900">Seguro con cobertura TODO riesgo SIN deducible</span>
                  <span className="block text-sm text-gray-500">0.35% del valor CIF (mínimo USD 50 + 15% IVA)</span>
                </span>
              </label>

              {formData.needs_insurance && (
                <div className="ml-7">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor CIF (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.cargo_cif_value_usd}
                    onChange={(e) => setFormData({ ...formData, cargo_cif_value_usd: e.target.value })}
                    className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  />
                </div>
              )}

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.needs_inland_transport}
                  onChange={(e) => setFormData({ ...formData, needs_inland_transport: e.target.checked })}
                  className="mt-1 h-4 w-4 text-aqua-flow border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="block font-medium text-gray-900">Transporte Terrestre</span>
                  <span className="block text-sm text-gray-500">
                    {formData.transport_type === 'ocean_fcl' 
                      ? 'Favor escoger ciudad de destino en Ecuador'
                      : 'Detalle la dirección de entrega de su carga'}
                  </span>
                </span>
              </label>

              {formData.needs_inland_transport && formData.transport_type === 'ocean_fcl' && (
                <div className="ml-7 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Nota:</span> El servicio de Transporte Terrestre NO está sujeto a IVA local 15%.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de Destino *
                    </label>
                    <select
                      required
                      value={formData.inland_transport_city}
                      onChange={(e) => setFormData({ ...formData, inland_transport_city: e.target.value })}
                      className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                    >
                      <option value="">Seleccione ciudad...</option>
                      {cities.map((city) => {
                        const rateForCity = inlandRates.find((r) => r.city === city);
                        const rateText = rateForCity ? ` - USD ${rateForCity.rate_usd}` : '';
                        return (
                          <option key={city} value={city}>
                            {city}{rateText}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección Completa de Entrega *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.inland_transport_full_address}
                      onChange={(e) => setFormData({ ...formData, inland_transport_full_address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                      placeholder="Av. Amazonas N34-45, Quito"
                    />
                  </div>
                </div>
              )}

              {formData.needs_inland_transport && (formData.transport_type === 'air' || formData.transport_type === 'ocean_lcl') && (
                <div className="ml-7 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección Completa de Entrega *
                    </label>
                    <textarea
                      required
                      value={formData.inland_transport_full_address}
                      onChange={(e) => setFormData({ ...formData, inland_transport_full_address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                      placeholder="Detalle la dirección completa de entrega de su carga, ciudad, referencias, etc."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-aqua-flow text-white py-3 px-6 rounded-lg font-semibold hover:bg-aqua-flow-600 focus:ring-2 focus:ring-aqua-flow focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Solicitar Cotización'}
            </button>
          </div>
        </form>
      </div>

      {showOceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 relative">
            <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-center text-[#0A2540] mb-4">
              Registro OCE Requerido
            </h2>
            <p className="text-gray-600 text-center mb-6">
              <strong>IMPORTAYAIA.COM</strong> es una herramienta para <strong>Importadores Registrados ante la SENAE</strong>. 
            </p>
            <div className="bg-[#00C9B7]/10 border border-[#00C9B7]/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 text-center">
                Hemos enviado una alerta automática a nuestro <strong>Ejecutivo de Aduanas</strong> para asistirte con tu registro de RUC y OCE antes de operar.
              </p>
            </div>
            <p className="text-sm text-gray-500 text-center mb-6">
              Un especialista se pondrá en contacto contigo para guiarte en el proceso de habilitación como Operador de Comercio Exterior.
            </p>
            <button
              onClick={() => {
                setOceModalConfirmed(true);
                setShowOceModal(false);
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
              }}
              className="w-full bg-[#0A2540] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0A2540]/90 transition-colors"
            >
              Entendido, Continuar con Solicitud
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
