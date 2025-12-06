import { Link } from 'react-router-dom';

export default function LandingPage() {
  const services = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3l14 9-14 9V3z" />
        </svg>
      ),
      title: 'Carga Aérea',
      description: 'Envíos express con tiempos de tránsito reducidos para mercancías urgentes.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Marítimo LCL/FCL',
      description: 'Consolidados y contenedores completos con las mejores tarifas del mercado.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      title: 'Transporte Terrestre',
      description: 'Distribución nacional puerta a puerta en todo Ecuador.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Agenciamiento Aduanero',
      description: 'Gestión integral de trámites aduaneros con agentes certificados.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-[#0A2540] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#0A2540]">ICS</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-gray-600 hover:text-[#0A2540] transition-colors text-sm font-medium">Servicios</a>
            <a href="#nosotros" className="text-gray-600 hover:text-[#0A2540] transition-colors text-sm font-medium">Nosotros</a>
            <a href="#contacto" className="text-gray-600 hover:text-[#0A2540] transition-colors text-sm font-medium">Contacto</a>
          </div>
          <Link 
            to="/login" 
            className="text-sm font-medium text-[#0A2540] hover:text-[#00C9B7] transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 rounded-full">
                <span className="w-2 h-2 bg-[#00C9B7] rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-[#0A2540]">Logística Internacional Ecuador</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-[#0A2540] leading-tight">
                Servicio logístico integral,{' '}
                <span className="text-[#00C9B7]">que impulsa tu negocio!</span>
              </h1>
              
              <div className="space-y-4 max-w-xl">
                <p className="text-xl text-[#0A2540] font-semibold">
                  ¿Quieres importar con IntegralCargoSolutions.APP?
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  ICS.APP somos soluciones reales, ágiles, ajustadas a lograr tus objetivos al coordinar tus importaciones. Conectamos al mundo con Ecuador, ¡a través de servicios logísticos integrales para importación de carga aérea, marítima y terrestre!
                </p>
                <p className="text-xl text-[#0A2540] font-semibold">
                  ¿Eres Asesor Comercial y quieres incrementar tus ventas? ¿Qué esperas, descarga nuestra APP y vende con IntegralCargoSolutions.APP desde tu casa o Home Office?
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Plataforma avanzada de automatización de ventas y marketing enfocada a logística de carga integral de importaciones hacia el Ecuador.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register"
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#A4FF00] text-[#0A2540] rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#A4FF00]/30"
                >
                  <span className="relative z-10">DESCARGA NUESTRA APP GRATIS !</span>
                  <svg className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#A4FF00] to-[#00C9B7] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
                
                <Link 
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#0A2540] text-[#0A2540] rounded-2xl font-semibold hover:bg-[#0A2540] hover:text-white transition-all"
                >
                  Ya tengo cuenta
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#0A2540]">15+</div>
                  <div className="text-sm text-gray-500">Años de experiencia</div>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#0A2540]">500+</div>
                  <div className="text-sm text-gray-500">Clientes activos</div>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#0A2540]">24/7</div>
                  <div className="text-sm text-gray-500">Soporte</div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#00C9B7]/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#A4FF00]/20 rounded-full blur-3xl"></div>
              
              <div className="relative bg-gradient-to-br from-[#0A2540] to-[#0A2540]/90 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 bg-[#00C9B7] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                      </svg>
                    </div>
                    <div className="text-white font-semibold">Aéreo</div>
                    <div className="text-white/60 text-sm">2-5 días</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 bg-[#00C9B7] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="text-white font-semibold">Marítimo</div>
                    <div className="text-white/60 text-sm">15-30 días</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 bg-[#A4FF00] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="text-white font-semibold">Terrestre</div>
                    <div className="text-white/60 text-sm">1-3 días</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 bg-[#A4FF00] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="text-white font-semibold">Aduanas</div>
                    <div className="text-white/60 text-sm">100% legal</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between text-white/80 text-sm">
                    <span>Rutas activas</span>
                    <span className="text-[#A4FF00] font-semibold">China - Ecuador</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#0A2540] mb-4">Nuestros Servicios</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ofrecemos soluciones integrales de logística internacional adaptadas a las necesidades de tu negocio.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div 
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="w-14 h-14 bg-[#0A2540] rounded-xl flex items-center justify-center text-[#00C9B7] mb-4 group-hover:bg-[#00C9B7] group-hover:text-white transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#0A2540] mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#0A2540]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Comienza a automatizar tu logística hoy
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Únete a cientos de empresas ecuatorianas que ya confían en IntegralCargoSolutions para sus operaciones de comercio internacional.
          </p>
          <Link 
            to="/register"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#A4FF00] text-[#0A2540] rounded-2xl font-bold text-xl hover:scale-105 hover:shadow-xl hover:shadow-[#A4FF00]/30 transition-all"
          >
            DESCARGA NUESTRA APP GRATIS !
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </Link>
        </div>
      </section>

      <footer id="contacto" className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0A2540] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-[#0A2540]">IntegralCargoSolutions</span>
                <p className="text-sm text-gray-500">Guayaquil, Ecuador</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>contacto@ics.com.ec</span>
              <span>+593 4 123 4567</span>
            </div>
            <p className="text-sm text-gray-400">
              2025 ICS. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
