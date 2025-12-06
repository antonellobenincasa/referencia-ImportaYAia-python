import { Link } from 'react-router-dom';

export default function Nosotros() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-[#0A2540] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#0A2540]">ICS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#servicios" className="text-gray-600 hover:text-[#0A2540] transition-colors text-sm font-medium">Servicios</Link>
            <Link to="/nosotros" className="text-[#00C9B7] font-medium text-sm">Nosotros</Link>
            <Link to="/#contacto" className="text-gray-600 hover:text-[#0A2540] transition-colors text-sm font-medium">Contacto</Link>
          </div>
          <Link 
            to="/login" 
            className="text-sm font-medium text-[#0A2540] hover:text-[#00C9B7] transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 rounded-full mb-6">
              <span className="text-2xl">🚢</span>
              <span className="text-sm font-medium text-[#0A2540]">IntegralCargo Solutions</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0A2540] leading-tight mb-6">
              Nuestros Servicios: Logística Inteligente y{' '}
              <span className="text-[#00C9B7]">Ventas Automatizadas</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              En IntegralCargo Solutions, transformamos la forma en que gestionas tu carga y tu negocio. 
              Ofrecemos soluciones digitales potentes para Importadores y Asesores Comerciales.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#0A2540] rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <p className="text-sm text-[#00C9B7] font-medium">Servicio para Importadores</p>
                <h2 className="text-2xl font-bold text-[#0A2540]">Cotiza y Embarca en Segundos</h2>
              </div>
            </div>

            <p className="text-gray-500 mb-6 italic">
              Audiencia: Importadores nuevos o experimentados que buscan eficiencia, transparencia y las mejores tarifas.
            </p>

            <h3 className="text-xl font-bold text-[#0A2540] mb-4">
              Tu Importación, Automatizada. Cotiza, Reserva y Gestiona 24/7.
            </h3>

            <p className="text-gray-600 mb-6 leading-relaxed">
              Ya sea que estés dando tus primeros pasos en la importación o seas un experto en volumen, 
              nuestra aplicación está diseñada para eliminar la fricción y la espera.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#00C9B7]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540]">Registro Gratuito e Inmediato</h4>
                  <p className="text-gray-600">Descarga la APP y accede sin costo a nuestra plataforma.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#00C9B7]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540]">Cotizaciones Instantáneas 24/7</h4>
                  <p className="text-gray-600">Olvídate de esperar horas. Solicita tu cotización en cualquier momento y recibe tarifas altamente competitivas generadas automáticamente por nuestro sistema.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#00C9B7]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540]">Gestión con un Clic</h4>
                  <p className="text-gray-600">Una vez que apruebes la tarifa, nuestra APP generará automáticamente un RO (Routing Order) único. Utiliza este RO para enviar tu instrucción de embarque de forma inmediata, directamente desde tu dispositivo.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#A4FF00]/10 rounded-2xl p-6 mb-8">
              <p className="text-[#0A2540] font-semibold">
                💡 El Valor Clave: <span className="font-normal">Ahorro de Tiempo y Dinero. Accede a las mejores tarifas del mercado y convierte las horas de espera en minutos de acción.</span>
              </p>
            </div>

            <Link 
              to="/register"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#A4FF00] text-[#0A2540] rounded-2xl font-bold text-lg hover:scale-105 transition-transform"
            >
              <span>🚀</span>
              ¡Empieza a Importar Fácil! Descarga IntegralCargoSolutions.app Gratis
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0A2540] rounded-3xl p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#00C9B7] rounded-xl flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <p className="text-sm text-[#A4FF00] font-medium">Servicio para Asesores Comerciales</p>
                <h2 className="text-2xl font-bold text-white">Potencia tus Ventas en Logística</h2>
              </div>
            </div>

            <p className="text-gray-400 mb-6 italic">
              Audiencia: Asesores Comerciales en logística internacional de carga que buscan escalar sus ingresos.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">
              Escala tus Ventas Logísticas. Automatización Avanzada para Asesores.
            </h3>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Deleita a tus clientes con la inmediatez y eficiencia de nuestra plataforma mientras tú te concentras en cerrar tratos.
            </p>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Hemos desarrollado la Plataforma Avanzada de Automatización de Ventas y Marketing pensada exclusivamente para la logística de carga integral hacia el Ecuador.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#00C9B7]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Automatización Completa</h4>
                  <p className="text-gray-300">Genera cotizaciones y gestiona documentación sin intervención manual, liberando tu tiempo.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#00C9B7]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Crecimiento Sostenible</h4>
                  <p className="text-gray-300">Incrementa tu cartera de clientes y la recurrencia de ventas al ofrecer un servicio digital, rápido y profesional.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#00C9B7]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Enfoque de Nicho</h4>
                  <p className="text-gray-300">Herramientas y estrategias de marketing especializadas en la captación de importadores ecuatorianos.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#A4FF00]/20 rounded-2xl p-6 mb-8">
              <p className="text-white font-semibold">
                💡 El Valor Clave: <span className="font-normal text-gray-200">Convierte tu Tiempo en Ingresos. Deja que nuestra tecnología haga el trabajo operativo pesado para que tú te enfoques en las relaciones y el crecimiento.</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#00C9B7] text-[#0A2540] rounded-2xl font-bold hover:scale-105 transition-transform"
              >
                Quiero Aumentar mis Ventas
              </Link>
              <Link 
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#00C9B7] text-[#00C9B7] rounded-2xl font-semibold hover:bg-[#00C9B7] hover:text-[#0A2540] transition-all"
              >
                Solicitar Demostración de la Plataforma
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#0A2540] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-bold text-[#0A2540]">IntegralCargoSolutions</span>
          </Link>
          <p className="text-gray-500 text-sm">
            © 2024 IntegralCargoSolutions. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
