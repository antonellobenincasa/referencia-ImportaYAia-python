import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const servicios = [
  {
    id: 'aereo',
    icon: '✈️',
    title: 'Transporte Aéreo',
    description: 'Entrega rápida de 2-5 días desde cualquier parte del mundo.',
    features: ['Consolidación desde China, USA y Europa', 'Tracking en tiempo real', 'Manejo de carga peligrosa'],
    color: 'from-[#0A2540] to-[#1a3f5c]',
  },
  {
    id: 'maritimo',
    icon: '🚢',
    title: 'Transporte Marítimo',
    description: 'Solución económica para grandes volúmenes en 15-30 días.',
    features: ['Contenedores FCL 20\' y 40\'', 'Carga consolidada LCL', 'Puertos: Guayaquil y Manta'],
    color: 'from-[#00C9B7] to-[#00a99d]',
  },
  {
    id: 'terrestre',
    icon: '🚛',
    title: 'Transporte Terrestre',
    description: 'Distribución nacional con cobertura en todo Ecuador.',
    features: ['Entrega puerta a puerta', 'Tarifas por ciudad', 'Servicio exento de IVA'],
    color: 'from-[#A4FF00] to-[#84CC16]',
  },
  {
    id: 'aduanas',
    icon: '📋',
    title: 'Agenciamiento Aduanero',
    description: 'Gestión profesional con agentes certificados por SENAE.',
    features: ['Clasificación arancelaria', 'Permisos y certificados', 'Aforo físico y documental'],
    color: 'from-purple-500 to-purple-600',
  },
];

const serviciosAdicionales = [
  { icon: '🛡️', title: 'Seguro de Carga', description: 'Protección completa de tu mercancía' },
  { icon: '🏢', title: 'Almacenaje', description: 'Bodega en zona de libre comercio' },
  { icon: '📄', title: 'Asesoría Importación', description: 'Guía completa para importadores novatos' },
  { icon: '💳', title: 'Facilidades de Pago', description: 'Opciones de financiamiento disponibles' },
];

export default function LeadServicios() {
  const { user, logout } = useAuth();

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
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-300">
              Hola, <span className="text-white font-medium">{user?.first_name || 'Usuario'}</span>
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/portal" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540]">
              Nuestros Servicios
            </h1>
            <p className="text-gray-600">
              Soluciones logísticas integrales para tu importación
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {servicios.map((servicio) => (
            <div
              key={servicio.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all"
            >
              <div className={`bg-gradient-to-r ${servicio.color} p-6`}>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4 text-3xl">
                  {servicio.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{servicio.title}</h3>
                <p className="text-white/80">{servicio.description}</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {servicio.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/portal/cotizar"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-[#0A2540] rounded-xl font-medium hover:bg-[#00C9B7] hover:text-white transition-colors"
                >
                  Cotizar {servicio.title}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#0A2540] rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Servicios Adicionales
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviciosAdicionales.map((servicio, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center hover:bg-white/20 transition-colors"
              >
                <div className="text-4xl mb-4">{servicio.icon}</div>
                <h4 className="font-semibold text-white mb-2">{servicio.title}</h4>
                <p className="text-sm text-gray-300">{servicio.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#00C9B7] to-[#00a99d] rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            ¿Listo para comenzar tu importación?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Solicita una cotización ahora y recibe respuesta en minutos. Nuestro equipo te guiará en cada paso del proceso.
          </p>
          <Link
            to="/portal/cotizar"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#A4FF00] text-[#0A2540] rounded-xl font-bold text-lg hover:bg-[#A4FF00]/90 transition-colors"
          >
            Solicitar Cotización
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
