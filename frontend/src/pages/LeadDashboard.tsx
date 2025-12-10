import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const steps = [
  {
    number: 1,
    title: 'Solicitar Cotización',
    description: 'Completa el formulario con los datos de tu importación',
    icon: '📋',
    link: '/portal/cotizar',
    color: 'from-[#00C9B7] to-[#00a99d]',
  },
  {
    number: 2,
    title: 'Revisar y Aprobar',
    description: 'Visualiza tu cotización y apruébala para continuar',
    icon: '✅',
    link: '/portal/mis-cotizaciones',
    color: 'from-[#A4FF00] to-[#84CC16]',
  },
  {
    number: 3,
    title: 'Tracking en Tiempo Real',
    description: 'Sigue el estado de tu mercancía hasta la entrega',
    icon: '🚢',
    link: '/portal/tracking',
    color: 'from-[#0A2540] to-[#1a3f5c]',
  },
];

export default function LeadDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0A2540] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
              <span className="text-[#0A2540] font-black text-sm">IA</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
            </div>
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

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 rounded-full mb-4">
            <span className="w-2 h-2 bg-[#00C9B7] rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-[#0A2540]">Portal del Importador</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A2540] mb-3">
            ¡Bienvenido a ImportaYa<span className="text-[#00C9B7]">.ia</span>!
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            <strong className="text-[#0A2540]">La logística de carga integral, ahora es Inteligente!</strong> Gestiona tus importaciones de manera simple y guiada.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {steps.map((step) => (
            <Link
              key={step.number}
              to={step.link}
              className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#00C9B7] transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white font-bold`}>
                  {step.number}
                </div>
                <span className="text-3xl">{step.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-[#0A2540] mb-2 group-hover:text-[#00C9B7] transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {step.description}
              </p>
              <div className="inline-flex items-center gap-2 text-[#00C9B7] font-medium text-sm">
                <span>Ir al paso</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/portal/servicios"
            className="group bg-gradient-to-br from-[#0A2540] to-[#0A2540]/90 rounded-3xl p-8 hover:shadow-xl transition-all"
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#A4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Explorar Servicios
            </h3>
            <p className="text-gray-300 mb-4">
              Conoce todos nuestros servicios logísticos inteligentes: aéreo, marítimo, terrestre y aduanas.
            </p>
            <div className="inline-flex items-center gap-2 text-[#A4FF00] font-medium">
              <span>Ver Servicios</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </Link>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#0A2540] mb-4">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestro equipo está disponible 24/7 para asistirte
            </p>
            <div className="space-y-3">
              <a
                href="https://wa.me/593999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-[#25D366]/10 text-[#25D366] rounded-xl font-medium hover:bg-[#25D366]/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp: +593 999 999 999
              </a>
              <a
                href="mailto:soporte@importaya.ia"
                className="flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                soporte@importaya.ia
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#00C9B7] to-[#00a99d] rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">
            ¿Primera vez importando?
          </h3>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            No te preocupes, te guiamos paso a paso con nuestra plataforma inteligente. Solicita tu primera cotización y nuestro equipo te contactará.
          </p>
          <Link
            to="/portal/cotizar"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#A4FF00] text-[#0A2540] rounded-xl font-bold text-lg hover:bg-white transition-colors"
          >
            Comenzar Ahora
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-gray-100 mt-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2024 ImportaYa.ia - La logística de carga integral, ahora es Inteligente!
          </p>
        </div>
      </footer>
    </div>
  );
}
