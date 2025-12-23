import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const dashboardButtons = [
  {
    number: 1,
    title: 'Solicitar Cotizacion de Transporte',
    description: 'Genera tu cotizacion automatica con nuestra base de datos de costos inteligente',
    icon: '📦',
    link: '/portal/cotizar',
    color: 'from-[#00C9B7] to-[#00a99d]',
  },
  {
    number: 2,
    title: 'Administrador de Cotizaciones',
    description: 'Visualiza, revisa, aprueba o rechaza tus cotizaciones generadas',
    icon: '📋',
    link: '/portal/mis-cotizaciones',
    color: 'from-[#A4FF00] to-[#84CC16]',
  },
  {
    number: 3,
    title: 'Pre-Liquidacion de Impuestos SENAE',
    description: 'Calcula los tributos aduaneros estimados con asistencia de IA',
    icon: '🏛️',
    link: '/portal/pre-liquidacion-senae',
    color: 'from-[#DC2626] to-[#B91C1C]',
  },
];

export default function LeadDashboard() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isRucApproved = user?.ruc_status === 'approved' || user?.ruc_approved === true;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { label: 'Dashboard', link: '/portal', icon: '🏠' },
    { label: 'Solicitar Cotizacion', link: '/portal/cotizar', icon: '📦' },
    { label: 'Mis Cotizaciones', link: '/portal/mis-cotizaciones', icon: '📋' },
    { label: 'Pre-Liquidacion SENAE', link: '/portal/pre-liquidacion-senae', icon: '🏛️' },
    { label: 'AduanaExpertoIA', link: '/portal/aduana-experto-ia', icon: '🤖' },
    { label: 'Cargo Tracking', link: '/portal/cargo-tracking', icon: '🗺️' },
    { label: 'Mi Cuenta', link: '/portal/mi-cuenta', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0A2540] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-2 sm:gap-3 flex-shrink-0" onClick={(e) => { e.preventDefault(); window.location.href = '/portal'; }}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
              <span className="text-[#0A2540] font-black text-xs sm:text-sm">IA</span>
            </div>
            <span className="text-base sm:text-lg font-bold">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm">
            <Link 
              to="/portal/mi-cuenta" 
              className="text-[#00C9B7] hover:text-[#A4FF00] font-medium transition-colors whitespace-nowrap hidden sm:inline"
            >
              Mi Cuenta
            </Link>
            <span className="text-gray-300 hidden md:inline">
              Hola, <span className="text-white font-medium">{user?.first_name || 'Usuario'}</span>
            </span>
            
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-gray-300 py-2 z-50" style={{backgroundColor: '#ffffff'}}>
                  <div className="px-4 py-3 border-b-2 border-gray-200" style={{backgroundColor: '#f3f4f6'}}>
                    <p style={{color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'}}>Sesion activa</p>
                    <p style={{color: '#0A2540', fontSize: '16px', fontWeight: 700}}>{user?.first_name} {user?.last_name}</p>
                    <p style={{color: '#4b5563', fontSize: '13px'}}>{user?.email}</p>
                  </div>
                  
                  <div className="py-2">
                    {menuItems.map((item) => (
                      <Link
                        key={item.link}
                        to={item.link}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-teal-100 transition-colors"
                        style={{color: '#1f2937'}}
                      >
                        <span style={{fontSize: '20px'}}>{item.icon}</span>
                        <span style={{color: '#111827', fontWeight: 600, fontSize: '14px'}}>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                  
                  <div className="border-t-2 border-gray-200 pt-2 mt-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-red-100 transition-colors w-full"
                      style={{color: '#dc2626'}}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span style={{color: '#dc2626', fontWeight: 700, fontSize: '14px'}}>Cerrar Sesion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#00C9B7]/10 rounded-full mb-4">
            <span className="w-2 h-2 bg-[#00C9B7] rounded-full animate-pulse"></span>
            <span className="text-xs sm:text-sm font-medium text-[#0A2540]">Portal del Importador</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0A2540] mb-3 px-2">
            Bienvenido a ImportaYa<span className="text-[#00C9B7]">.ia</span>!
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-2">
            <strong className="text-[#0A2540]">La logistica de carga integral, ahora es Inteligente!</strong> Gestiona tus importaciones de manera simple y guiada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {dashboardButtons.map((button) => (
            <Link
              key={button.number}
              to={button.link}
              className="group bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#00C9B7] transition-all"
            >
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${button.color} rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0`}>
                  {button.number}
                </div>
                <span className="text-2xl sm:text-3xl">{button.icon}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0A2540] mb-2 group-hover:text-[#00C9B7] transition-colors">
                {button.title}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                {button.description}
              </p>
              <div className="inline-flex items-center gap-2 text-[#00C9B7] font-medium text-sm">
                <span>Acceder</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-8">
          <Link
            to="/portal/aduana-experto-ia"
            className="group block bg-gradient-to-br from-[#00C9B7] via-[#00B8A9] to-[#A4FF00] rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">🤖</span>
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white mb-1">
                    <span className="w-2 h-2 bg-[#A4FF00] rounded-full animate-pulse"></span>
                    NUEVO - IA ACTIVA 24/7
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    AduanaExpertoIA
                  </h3>
                </div>
              </div>
              <p className="text-sm sm:text-base font-medium text-white mb-2">
                CHAT INTELIGENTE ADUANERO + SIMULADOR DE COSTOS IMPORT
              </p>
              <p className="text-white/90 text-xs sm:text-sm mb-4 leading-relaxed">
                Sin necesidad de solicitar cotizacion o contar con una cotizacion aprobada en la APP, podras rapidamente gracias a nuestra IA simular tus costos de importacion en pocos minutos. Sin necesidad de hablar con nadie, ni estar atras de nadie o esperando que te respondan tus llamadas o correos, nuestra IA te asiste, cotiza y coordina todo de manera AUTOMATIZADA, AGIL e INTELIGENTE! El futuro de la logistica de carga integral IA esta aqui y se llama ImportaYAia.com
              </p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A2540] text-white rounded-xl font-bold text-sm hover:bg-[#0A2540]/90 transition-colors">
                <span>Iniciar Chat IA</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/portal/cargo-tracking"
            className="group bg-gradient-to-br from-[#0A2540] to-[#0A2540]/90 rounded-3xl p-8 hover:shadow-xl transition-all"
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#A4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Cargo Tracking
            </h3>
            <p className="text-gray-300 mb-4">
              Rastrea tus embarques con timeline animado de 14 hitos desde origen hasta destino.
            </p>
            <div className="inline-flex items-center gap-2 text-[#A4FF00] font-medium">
              <span>Ver Mis Embarques</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </Link>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#0A2540] mb-4">
              Necesitas ayuda?
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestro equipo esta disponible 24/7 para asistirte
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
            Primera vez importando?
          </h3>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            No te preocupes, te guiamos paso a paso con nuestra plataforma inteligente. Solicita tu primera cotizacion y nuestro equipo te contactara.
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
            2024 ImportaYa.ia - La logistica de carga integral, ahora es Inteligente!
          </p>
        </div>
      </footer>

      {!isRucApproved && (
        <div className="fixed inset-0 bg-[#0A2540]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-[#0A2540] mb-3">
              Registro de RUC Requerido
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Para acceder a todas las funcionalidades de <strong className="text-[#00C9B7]">ImportaYa.ia</strong>, primero debes registrar tu <strong>RUC (Registro Unico de Contribuyentes)</strong> y esperar la aprobacion de nuestro equipo.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-left">
                  <p className="font-semibold text-amber-800 mb-1">Estado de tu RUC:</p>
                  <p className="text-amber-700 text-sm">
                    {user?.ruc ? (
                      user?.ruc_status === 'pending' ? (
                        <>Tu RUC <strong>{user.ruc}</strong> esta pendiente de aprobacion por nuestro equipo.</>
                      ) : user?.ruc_status === 'rejected' ? (
                        <>Tu RUC fue rechazado. Por favor, verifica los datos e intenta nuevamente.</>
                      ) : (
                        <>Tu RUC no ha sido validado. Por favor, solicita la aprobacion.</>
                      )
                    ) : (
                      <>No tienes un RUC registrado. Registra tu RUC para continuar.</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/portal/mi-cuenta"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] rounded-xl font-bold text-lg hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Ir a Mi Cuenta - Registrar RUC
              </Link>
              
              <button
                onClick={logout}
                className="w-full px-6 py-3 text-gray-500 hover:text-red-500 font-medium transition-colors"
              >
                Cerrar Sesion
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              Una vez aprobado tu RUC, podras solicitar cotizaciones y acceder a todos los servicios de la plataforma.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
