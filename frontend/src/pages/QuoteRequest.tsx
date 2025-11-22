import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { InlandTransportRate } from '../types';
import { Ship, Plane, Package, CheckCircle } from 'lucide-react';

export default function QuoteRequest() {
  const [formData, setFormData] = useState({
    landing_page: 1,
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    ruc: '',
    transport_type: 'ocean_fcl' as 'air' | 'ocean_lcl' | 'ocean_fcl',
    origin_country: '',
    destination_port: 'Guayaquil',
    container_type: '40hc',
    cargo_type: 'general' as 'general' | 'dg',
    estimated_weight_kg: 0,
    incoterm: 'FOB',
    servicio_integral_customs: false,
    servicio_integral_insurance: false,
    servicio_integral_insurance_cif_value: 0,
    servicio_integral_transport: false,
    servicio_integral_transport_city: '',
    servicio_integral_transport_address: '',
  });

  const [cities, setCities] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.getInlandTransportRates();
        const rates = (res.data.results || res.data) as InlandTransportRate[];
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
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 mb-6">
            Hemos recibido su solicitud de cotización. Nuestro equipo de ventas se pondrá en contacto con usted en breve.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                ...formData,
                full_name: '',
                email: '',
                phone: '',
                company_name: '',
                ruc: '',
              });
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Cotización</h1>
        <p className="text-gray-600 mb-8">Complete el formulario para recibir una cotización de transporte internacional</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RUC
              </label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

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
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <type.icon className="h-8 w-8 mb-2" />
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País de Origen *
              </label>
              <input
                type="text"
                required
                value={formData.origin_country}
                onChange={(e) => setFormData({ ...formData, origin_country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="China"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puerto de Destino *
              </label>
              <select
                required
                value={formData.destination_port}
                onChange={(e) => setFormData({ ...formData, destination_port: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Guayaquil">Guayaquil</option>
                <option value="Manta">Manta</option>
              </select>
            </div>

            {formData.transport_type === 'ocean_fcl' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contenedor *
                </label>
                <select
                  required
                  value={formData.container_type}
                  onChange={(e) => setFormData({ ...formData, container_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="20gp">20GP</option>
                  <option value="40gp">40GP</option>
                  <option value="40hc">40HC</option>
                  <option value="40nor">40NOR</option>
                  <option value="40rf">40RF</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso Estimado (kg) *
              </label>
              <input
                type="number"
                required
                value={formData.estimated_weight_kg}
                onChange={(e) => setFormData({ ...formData, estimated_weight_kg: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="FOB">FOB</option>
                <option value="CIF">CIF</option>
                <option value="EXW">EXW</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicio Integral (Opcional)</h3>
            
            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.servicio_integral_customs}
                  onChange={(e) => setFormData({ ...formData, servicio_integral_customs: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="block font-medium text-gray-900">Desaduanización</span>
                  <span className="block text-sm text-gray-500">USD 339.25 (USD 295 + 15% IVA)</span>
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.servicio_integral_insurance}
                  onChange={(e) => setFormData({ ...formData, servicio_integral_insurance: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="block font-medium text-gray-900">Seguro</span>
                  <span className="block text-sm text-gray-500">0.35% del valor CIF (mínimo USD 50 + 15% IVA)</span>
                </span>
              </label>

              {formData.servicio_integral_insurance && (
                <div className="ml-7">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor CIF (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.servicio_integral_insurance_cif_value}
                    onChange={(e) => setFormData({ ...formData, servicio_integral_insurance_cif_value: parseFloat(e.target.value) })}
                    className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.servicio_integral_transport}
                  onChange={(e) => setFormData({ ...formData, servicio_integral_transport: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="block font-medium text-gray-900">Transporte Terrestre</span>
                  <span className="block text-sm text-gray-500">A ciudad de destino en Ecuador</span>
                </span>
              </label>

              {formData.servicio_integral_transport && (
                <div className="ml-7 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de Destino *
                    </label>
                    <select
                      required
                      value={formData.servicio_integral_transport_city}
                      onChange={(e) => setFormData({ ...formData, servicio_integral_transport_city: e.target.value })}
                      className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione ciudad...</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección Completa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.servicio_integral_transport_address}
                      onChange={(e) => setFormData({ ...formData, servicio_integral_transport_address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Av. Amazonas N34-45, Quito"
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
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Solicitar Cotización'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
