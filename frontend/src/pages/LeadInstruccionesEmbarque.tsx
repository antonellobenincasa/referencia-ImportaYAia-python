import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  estado: string;
  origen_pais: string;
  destino_ciudad: string;
  descripcion_mercaderia: string;
  total_usd: string;
  routing_order_number: string | null;
  created_at: string;
}

export default function LeadInstruccionesEmbarque() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    shipper_name: '',
    shipper_address: '',
    shipper_contact: '',
    pickup_date: '',
    special_instructions: '',
  });

  useEffect(() => {
    fetchApprovedCotizaciones();
  }, []);

  const fetchApprovedCotizaciones = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/sales/lead-cotizaciones/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al cargar cotizaciones');

      const data = await response.json();
      const approved = data.results?.filter((c: Cotizacion) => c.estado === 'aprobada') || 
                       data.filter?.((c: Cotizacion) => c.estado === 'aprobada') || [];
      setCotizaciones(approved);
      
      if (approved.length === 0) {
        setRedirecting(true);
        setTimeout(() => {
          navigate('/portal/mis-cotizaciones', { 
            state: { message: 'Debes aprobar una cotizacion antes de enviar instrucciones de embarque' }
          });
        }, 3000);
      }
    } catch (err) {
      setError('Error al cargar las cotizaciones aprobadas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCotizacion) return;

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/sales/lead-cotizaciones/${selectedCotizacion.id}/submit-shipping-instruction/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipper_name: formData.shipper_name,
          shipper_address: formData.shipper_address,
          shipper_contact: formData.shipper_contact,
          pickup_date: formData.pickup_date,
          special_instructions: formData.special_instructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar instrucciones');
      }

      const data = await response.json();
      setSuccessMessage(`Routing Order generado exitosamente: ${data.routing_order_number}`);
      setSelectedCotizacion(null);
      setFormData({
        shipper_name: '',
        shipper_address: '',
        shipper_contact: '',
        pickup_date: '',
        special_instructions: '',
      });
      fetchApprovedCotizaciones();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0A2540] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
              <span className="text-[#0A2540] font-black text-sm">IA</span>
            </div>
            <span className="text-lg font-bold">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/portal" className="text-sm text-gray-300 hover:text-white transition-colors">
              Volver al Dashboard
            </Link>
            <button onClick={logout} className="text-sm text-gray-300 hover:text-white transition-colors">
              Cerrar Sesion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0A2540] mb-2">
            Panel de Instrucciones de Embarque
          </h1>
          <p className="text-gray-600">
            Envia las instrucciones de embarque para generar tu Routing Order (RO)
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-green-800">{successMessage}</p>
                <p className="text-sm text-green-600">Puedes rastrear tu embarque en la seccion de Tracking</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C9B7] mx-auto"></div>
            <p className="mt-4 text-gray-500">Cargando cotizaciones aprobadas...</p>
          </div>
        ) : cotizaciones.length === 0 || redirecting ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {redirecting ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C9B7]"></div>
              ) : (
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#0A2540] mb-2">No tienes cotizaciones aprobadas</h3>
            <p className="text-gray-600 mb-4">
              Para enviar instrucciones de embarque, primero debes aprobar una cotizacion de transporte.
            </p>
            {redirecting ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-700 text-sm font-medium">
                  Redireccionando al Administrador de Cotizaciones...
                </p>
              </div>
            ) : (
              <Link
                to="/portal/mis-cotizaciones"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00C9B7] text-white rounded-xl font-medium hover:bg-[#00a99d] transition-colors"
              >
                Ir al Administrador de Cotizaciones
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}
          </div>
        ) : !selectedCotizacion ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0A2540]">Selecciona una cotizacion aprobada:</h2>
            {cotizaciones.map((cot) => (
              <div
                key={cot.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[#00C9B7] transition-all cursor-pointer"
                onClick={() => setSelectedCotizacion(cot)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-[#0A2540]">{cot.numero_cotizacion}</p>
                    <p className="text-gray-600 text-sm">{cot.descripcion_mercaderia}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {cot.origen_pais} → {cot.destino_ciudad}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#00C9B7]">${parseFloat(cot.total_usd || '0').toLocaleString()}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      APROBADA
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0A2540]">Instrucciones de Embarque</h2>
                <p className="text-gray-600 text-sm">Cotizacion: {selectedCotizacion.numero_cotizacion}</p>
              </div>
              <button
                onClick={() => setSelectedCotizacion(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitInstructions} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Shipper (Proveedor en Origen)
                </label>
                <input
                  type="text"
                  value={formData.shipper_name}
                  onChange={(e) => setFormData({ ...formData, shipper_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direccion del Shipper
                </label>
                <textarea
                  value={formData.shipper_address}
                  onChange={(e) => setFormData({ ...formData, shipper_address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto del Shipper (Email/Telefono)
                </label>
                <input
                  type="text"
                  value={formData.shipper_contact}
                  onChange={(e) => setFormData({ ...formData, shipper_contact: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Estimada de Pickup
                </label>
                <input
                  type="date"
                  value={formData.pickup_date}
                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrucciones Especiales (Opcional)
                </label>
                <textarea
                  value={formData.special_instructions}
                  onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent"
                  rows={3}
                  placeholder="Ej: Mercaderia fragil, requiere temperatura controlada, etc."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? 'Procesando...' : 'Generar Routing Order (RO)'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
