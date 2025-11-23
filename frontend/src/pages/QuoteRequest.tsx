import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { InlandTransportRate } from '../types';
import { Ship, Plane, Package, CheckCircle } from 'lucide-react';

export default function QuoteRequest() {
  const originPortsFCL = [
    'Shanghai',
    'Ningbo',
    'Shenzhen',
    'Shekou',
    'Yantian',
    'DaChanBay',
    'Guangzhou',
    'Huangpu',
    'Qingdao',
    'Tianjin',
    'Xingang',
    'Hong Kong',
    'Xiamen',
    'Fuzhou',
    'Nansha',
    'Jiangmen',
    'Gaosha',
    'Foshan',
    'Nanjing',
    'Zhanjiang',
    'Zhangjiang',
    'Chongqing',
    'Bahrain',
    'Ahmedabad',
    'Anhui',
    'Bangalore',
    'Beihai',
    'Beijiao',
    'Beijing',
    'Beirut',
    'Belawan',
    'Calcutta',
    'Kolkatta',
    'Bintulu',
    'Chittagong',
    'Gaoming',
    'Singapur',
    'Busan',
    'Jebel Ali (Dubái)',
    'Port Klang, Tanjung Pelepas',
    'Jawaharlal Nehru Port (Mumbai)',
    'Mundra',
    'Chennai',
    'Tuticorin',
    'Tokio',
    'Nagoya',
    'Kobe',
    'Yokohama',
    'Kaohsiung',
    'Keelung',
    'Taichung',
    'Róterdam',
    'Amberes-Brujas',
    'Bremerhaven',
    'Hamburgo',
    'Algeciras',
    'Barcelona',
    'Valencia',
    'Southampton',
    'Londres',
    'Felixstowe',
    'Marsella',
    'Le Havre',
    'Génova',
    'Livorno',
    'La Spezia',
    'Gioia Tauro',
    'El Pireo',
    'Los Ángeles',
    'Long Beach',
    'Nueva York',
    'Nueva Jersey',
    'Savannah',
    'Houston',
    'Virginia',
    'Seattle',
    'Tacoma',
    'Miami',
    'PT Everglades',
    'Baltimore',
    'Lazaro Cardenas MX',
    'Veracruz MX',
    'Manzanillo MX',
    'Altamira MX',
    'Montreal',
    'Prince Rupert',
    'Vancouver',
    'Balboa (Pacífico)',
    'Colón/Manzanillo (Atlántico)',
    'Rodman',
    'Mumbai',
    'Paranaguá',
    'Rio Grande',
    'Pecem',
    'Itapoa',
    'Itajai',
    'Navegantes',
    'Imbituba',
    'Suape',
    'Rio de Janeiro',
    'Vitoria',
    'Salvador',
    'San Antonio',
    'Valparaíso',
    'Callao',
    'Chancay',
    'Cartagena',
    'Buenaventura',
    'Barranquilla',
    'Buenos Aires',
    'Rosario',
    'Montevideo',
    'Moín',
    'Tanger Med',
    'Puerto Said',
    'Durban',
    'Lagos (Apapa)',
    'Mombasa',
    'Port Hedland',
    'Tauranga, Auckland',
    'Bangkok',
    'Asuncion',
    'Alejandría',
    'Ciudad del Cabo',
    'Melbourne',
    'Sídney',
    'Port Botany'
  ];

  const originPortsLCL = [
    'Shanghai',
    'Ningbo',
    'Shenzhen',
    'Shekou',
    'Yantian',
    'DaChanBay',
    'Guangzhou',
    'Huangpu',
    'Qingdao',
    'Tianjin',
    'Xingang',
    'Hong Kong',
    'Xiamen',
    'Fuzhou',
    'Nansha',
    'Jiangmen',
    'Gaosha',
    'Foshan',
    'Nanjing',
    'Zhanjiang',
    'Zhangjiang',
    'Chongqing',
    'Bahrain',
    'Ahmedabad',
    'Anhui',
    'Bangalore',
    'Beihai',
    'Beijiao',
    'Beijing',
    'Beirut',
    'Belawan',
    'Calcutta',
    'Kolkatta',
    'Bintulu',
    'Chittagong',
    'Gaoming',
    'Singapur',
    'Busan',
    'Jebel Ali (Dubái)',
    'Port Klang, Tanjung Pelepas',
    'Jawaharlal Nehru Port (Mumbai)',
    'Mundra',
    'Chennai',
    'Tuticorin',
    'Tokio',
    'Nagoya',
    'Kobe',
    'Yokohama',
    'Kaohsiung',
    'Keelung',
    'Taichung',
    'Róterdam',
    'Amberes-Brujas',
    'Bremerhaven',
    'Hamburgo',
    'Algeciras',
    'Barcelona',
    'Valencia',
    'Southampton',
    'Londres',
    'Felixstowe',
    'Marsella',
    'Le Havre',
    'Génova',
    'Livorno',
    'La Spezia',
    'Gioia Tauro',
    'El Pireo',
    'Los Ángeles',
    'Long Beach',
    'Nueva York',
    'Nueva Jersey',
    'Savannah',
    'Houston',
    'Virginia',
    'Seattle',
    'Tacoma',
    'Miami',
    'PT Everglades',
    'Baltimore',
    'Lazaro Cardenas MX',
    'Veracruz MX',
    'Manzanillo MX',
    'Altamira MX',
    'Montreal',
    'Prince Rupert',
    'Vancouver',
    'Balboa (Pacífico)',
    'Colón/Manzanillo (Atlántico)',
    'Rodman',
    'Mumbai',
    'Paranaguá',
    'Rio Grande',
    'Pecem',
    'Itapoa',
    'Itajai',
    'Navegantes',
    'Imbituba',
    'Suape',
    'Rio de Janeiro',
    'Vitoria',
    'Salvador',
    'San Antonio',
    'Valparaíso',
    'Callao',
    'Chancay',
    'Cartagena',
    'Buenaventura',
    'Barranquilla',
    'Buenos Aires',
    'Rosario',
    'Montevideo',
    'Moín',
    'Tanger Med',
    'Puerto Said',
    'Durban',
    'Lagos (Apapa)',
    'Mombasa',
    'Port Hedland',
    'Tauranga, Auckland',
    'Bangkok',
    'Asuncion',
    'Alejandría',
    'Ciudad del Cabo',
    'Melbourne',
    'Sídney',
    'Port Botany'
  ];

  const originAirports = [
    'Aeropuerto Internacional de Hong Kong (HKG)',
    'Aeropuerto Internacional de Memphis (MEM)',
    'Aeropuerto Internacional de Shanghái Pudong (PVG)',
    'Aeropuerto Internacional Ted Stevens Anchorage (ANC)',
    'Aeropuerto Internacional de Incheon (ICN)',
    'Aeropuerto Internacional Muhammad Ali de Louisville (SDF)',
    'Aeropuerto Internacional de Miami (MIA)',
    'Aeropuerto Internacional Hamad de Doha (DOH)',
    'Aeropuerto de París-Charles de Gaulle (CDG)',
    'Aeropuerto Internacional de Fráncfort (FRA)',
    'Aeropuerto Internacional Taiwan Taoyuan (TPE)',
    'Aeropuerto de Londres-Heathrow (LHR)',
    'Aeropuerto Internacional de Los Ángeles (LAX)',
    'Aeropuerto de Ámsterdam-Schiphol (AMS)',
    'Aeropuerto Internacional de Sídney (SYD)',
  ];

  const containerTypes = [
    '1x20GP',
    '1x40GP',
    '1x40HC',
    '1x40NOR',
    '1x20 REEFER',
    '1x40 REEFER',
    '1x40 OT HC',
    '1x20 FLAT RACK',
    '1x40 FLAT RACK',
    '1x40 OPEN TOP',
    '1x20 OPEN TOP',
  ];

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

  const [formData, setFormData] = useState({
    landing_page: 1,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_company: false,
    company_name: '',
    company_ruc: '',
    transport_type: 'ocean_fcl' as 'air' | 'ocean_lcl' | 'ocean_fcl',
    pol_port_of_lading: '',
    pod_port_of_discharge: '',
    airport_origin: '',
    airport_destination: '',
    container_type: '1x40HC',
    incoterm: 'FOB',
    origin_pickup_address: '',
    gross_weight_kg: '',
    pieces_quantity: 1,
    packaging_type: 'piezas',
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
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitLandingPage(formData);
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
                origin_pickup_address: '',
                gross_weight_kg: '',
                pieces_quantity: 1,
                packaging_type: 'piezas',
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
              } as any);
              setDgDocuments([]);
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

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_company}
                  onChange={(e) => setFormData({ ...formData, is_company: e.target.checked })}
                  className="h-4 w-4 text-aqua-flow border-gray-300 rounded"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUC de Empresa
                </label>
                <input
                  type="text"
                  value={formData.company_ruc}
                  onChange={(e) => setFormData({ ...formData, company_ruc: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                />
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Transporte</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'air', icon: Plane, label: 'Aéreo' },
                { value: 'ocean_lcl', icon: Ship, label: 'Marítimo LCL' },
                { value: 'ocean_fcl', icon: Package, label: 'Marítimo FCL' },
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AOL Aeropuerto de Origen *
                </label>
                <select
                  required
                  value={formData.airport_origin}
                  onChange={(e) => setFormData({ ...formData, airport_origin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                >
                  <option value="">Seleccione aeropuerto de origen...</option>
                  {originAirports.map((airport) => (
                    <option key={airport} value={airport}>
                      {airport}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AOD Aeropuerto de destino *
                </label>
                <select
                  required
                  value={formData.airport_destination}
                  onChange={(e) => setFormData({ ...formData, airport_destination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                >
                  <option value="">Seleccione aeropuerto de destino...</option>
                  <option value="Guayaquil">Guayaquil</option>
                  <option value="Quito">Quito</option>
                </select>
              </div>
            </div>
          )}

          {formData.transport_type !== 'air' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  POL Puerto de Origen *
                </label>
                <select
                  required
                  value={formData.pol_port_of_lading}
                  onChange={(e) => setFormData({ ...formData, pol_port_of_lading: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                >
                  <option value="">Seleccione puerto de origen...</option>
                  {(formData.transport_type === 'ocean_lcl' ? originPortsLCL : originPortsFCL).map((port) => (
                    <option key={port} value={port}>
                      {port}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  POD Puerto de Destino *
                </label>
                <select
                  required
                  value={formData.pod_port_of_discharge}
                  onChange={(e) => setFormData({ ...formData, pod_port_of_discharge: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                >
                  <option value="">Seleccione puerto de destino...</option>
                  <option value="Guayaquil">Guayaquil</option>
                  <option value="Posorja">Posorja</option>
                  <option value="Manta">Manta</option>
                  <option value="Puerto Bolívar">Puerto Bolívar</option>
                  <option value="Esmeraldas">Esmeraldas</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.transport_type === 'ocean_fcl' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contenedor *
                </label>
                <select
                  required
                  value={formData.container_type}
                  onChange={(e) => setFormData({ ...formData, container_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                >
                  {containerTypes.map((container) => (
                    <option key={container} value={container}>
                      {container}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                value={formData.origin_pickup_address}
                onChange={(e) => setFormData({ ...formData, origin_pickup_address: e.target.value })}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Carga</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a Embarcar *
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Embalaje *
                </label>
                <select
                  required
                  value={formData.packaging_type}
                  onChange={(e) => setFormData({ ...formData, packaging_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                >
                  <option value="piezas">Piezas</option>
                  <option value="pallets">Pallets</option>
                  <option value="bultos">Bultos</option>
                  <option value="cajas de madera">Cajas de Madera</option>
                  <option value="cajas de carton">Cajas de Cartón</option>
                </select>
              </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  Total CBM *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.total_cbm}
                  onChange={(e) => setFormData({ ...formData, total_cbm: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                  placeholder="Ej: 0.40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
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
    </div>
  );
}
