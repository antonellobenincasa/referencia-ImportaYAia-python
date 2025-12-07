import { Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav variant="light" />

      <section className="pt-24 pb-20 px-6">
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
                
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link 
                    to="/descargar-app"
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

                <p className="text-xl text-[#0A2540] font-semibold pt-4">
                  ¿Eres Asesor Comercial y quieres incrementar tus ventas? ¿Qué esperas, descarga nuestra APP y vende con IntegralCargoSolutions.APP desde tu casa o Home Office?
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Plataforma avanzada de automatización de ventas y marketing enfocada a logística de carga integral de importaciones hacia el Ecuador.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link 
                    to="/descargar-app"
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
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 rounded-full text-[#00C9B7] font-medium text-sm mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Servicios Logísticos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2540] mb-4">Nuestros Servicios</h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Ofrecemos soluciones integrales de logística internacional adaptadas a las necesidades de tu negocio. Conoce todos nuestros servicios y cómo podemos impulsar tu negocio.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 p-6">
                <div className="w-14 h-14 bg-[#00C9B7]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Transporte Aéreo</h3>
                <p className="text-gray-300">Entrega rápida de 2-5 días</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-600">
                  Servicio de carga aérea para importaciones urgentes desde cualquier parte del mundo hacia Ecuador.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Consolidación de carga desde China, USA y Europa</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Tracking en tiempo real de tu carga</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Manejo de carga peligrosa con documentación MSDS</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-[#00C9B7] to-[#00C9B7]/90 p-6">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#0A2540] mb-2">Transporte Marítimo</h3>
                <p className="text-[#0A2540]/70">Carga FCL y LCL en 15-30 días</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-600">
                  Transporte marítimo económico para grandes volúmenes de mercancía con origen en cualquier puerto del mundo.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Contenedores completos (FCL) 20' y 40'</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Carga consolidada (LCL) para volúmenes menores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Puertos de destino: Guayaquil y Manta</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-[#A4FF00] to-[#84CC16] p-6">
                <div className="w-14 h-14 bg-[#0A2540]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#0A2540] mb-2">Transporte Terrestre</h3>
                <p className="text-[#0A2540]/70">Entrega nacional en 1-3 días</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-600">
                  Distribución terrestre a nivel nacional con cobertura en todas las provincias del Ecuador.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Entrega puerta a puerta en todo Ecuador</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Tarifas preferenciales por ciudad destino</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Servicio exento de IVA en transporte interno</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-[#0A2540] via-[#0A2540]/95 to-[#00C9B7]/50 p-6">
                <div className="w-14 h-14 bg-[#00C9B7]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Agenciamiento Aduanero</h3>
                <p className="text-gray-300">Despacho 100% legal y seguro</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-600">
                  Gestión aduanera profesional con agentes certificados por el SENAE para el correcto trámite de tus importaciones.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Clasificación arancelaria correcta</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Trámite de permisos y certificados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Aforo físico y documental</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0A2540] to-[#0A2540]/95 rounded-3xl p-8 sm:p-12">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Servicios Complementarios
                </h3>
                <p className="text-gray-300 mb-6">
                  ICS.APP ofrece un servicio logístico integral que incluye todos los elementos necesarios para que tu importación llegue sin contratiempos.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                    <div className="w-12 h-12 bg-[#00C9B7]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Seguro de Carga</h4>
                      <p className="text-sm text-gray-400">Protección completa de tu mercancía (IVA 12%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                    <div className="w-12 h-12 bg-[#A4FF00]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#A4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Almacenaje</h4>
                      <p className="text-sm text-gray-400">Bodega en zona de libre comercio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                    <div className="w-12 h-12 bg-[#00C9B7]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Honorarios Aduaneros</h4>
                      <p className="text-sm text-gray-400">Gestión profesional con IVA incluido</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-[#00C9B7] mb-2">500+</div>
                  <p className="text-sm text-gray-300">Importaciones exitosas</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-[#A4FF00] mb-2">24/7</div>
                  <p className="text-sm text-gray-300">Soporte disponible</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">15+</div>
                  <p className="text-sm text-gray-300">Países de origen</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-[#00C9B7] mb-2">100%</div>
                  <p className="text-sm text-gray-300">Legal y transparente</p>
                </div>
              </div>
            </div>
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
            to="/descargar-app"
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
