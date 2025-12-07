import PublicNav from '../components/PublicNav';
import { Link } from 'react-router-dom';

export default function Contacto() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicNav variant="light" />
      
      <main className="pt-20">
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 rounded-full text-[#00C9B7] font-medium text-sm mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contacto
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2540] mb-4">
                Nuestros Servicios
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                ICS.APP ofrece soluciones logisticas integrales para importadores y asesores comerciales en Ecuador. 
                Conoce todos nuestros servicios y como podemos impulsar tu negocio.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 p-6">
                  <div className="w-14 h-14 bg-[#00C9B7]/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Transporte Aereo</h2>
                  <p className="text-gray-300">Entrega rapida de 2-5 dias</p>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-600">
                    Servicio de carga aerea para importaciones urgentes desde cualquier parte del mundo hacia Ecuador.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Consolidacion de carga desde China, USA y Europa</span>
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
                      <span className="text-gray-700">Manejo de carga peligrosa con documentacion MSDS</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#00C9B7] to-[#00C9B7]/90 p-6">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#0A2540] mb-2">Transporte Maritimo</h2>
                  <p className="text-[#0A2540]/70">Carga FCL y LCL en 15-30 dias</p>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-600">
                    Transporte maritimo economico para grandes volumenes de mercancia con origen en cualquier puerto del mundo.
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
                      <span className="text-gray-700">Carga consolidada (LCL) para volumenes menores</span>
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

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#A4FF00] to-[#84CC16] p-6">
                  <div className="w-14 h-14 bg-[#0A2540]/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#0A2540] mb-2">Transporte Terrestre</h2>
                  <p className="text-[#0A2540]/70">Entrega nacional en 1-3 dias</p>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-600">
                    Distribucion terrestre a nivel nacional con cobertura en todas las provincias del Ecuador.
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

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#0A2540] via-[#0A2540]/95 to-[#00C9B7]/50 p-6">
                  <div className="w-14 h-14 bg-[#00C9B7]/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Agenciamiento Aduanero</h2>
                  <p className="text-gray-300">Despacho 100% legal y seguro</p>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-600">
                    Gestion aduanera profesional con agentes certificados por el SENAE para el correcto tramite de tus importaciones.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Clasificacion arancelaria correcta</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Tramite de permisos y certificados</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Aforo fisico y documental</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0A2540] to-[#0A2540]/95 rounded-3xl p-8 sm:p-12 mb-16">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    Servicios Complementarios
                  </h2>
                  <p className="text-gray-300 mb-6">
                    ICS.APP ofrece un servicio logistico integral que incluye todos los elementos necesarios para que tu importacion llegue sin contratiempos.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                      <div className="w-12 h-12 bg-[#00C9B7]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Seguro de Carga</h3>
                        <p className="text-sm text-gray-400">Proteccion completa de tu mercancia (IVA 12%)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                      <div className="w-12 h-12 bg-[#A4FF00]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#A4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Almacenaje</h3>
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
                        <h3 className="font-semibold text-white">Honorarios Aduaneros</h3>
                        <p className="text-sm text-gray-400">Gestion profesional con IVA incluido</p>
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
                    <p className="text-sm text-gray-300">Paises de origen</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-[#00C9B7] mb-2">100%</div>
                    <p className="text-sm text-gray-300">Legal y transparente</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 sm:p-12">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2540] mb-4">
                    Contactanos
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Estamos listos para ayudarte con tu proxima importacion. Nuestro equipo de expertos te atendera de manera personalizada.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#00C9B7]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0A2540]">Telefono / WhatsApp</h3>
                        <p className="text-gray-600">+593 99 123 4567</p>
                        <p className="text-sm text-gray-500">Lunes a Viernes: 8:00 - 18:00</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#00C9B7]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0A2540]">Correo Electronico</h3>
                        <p className="text-gray-600">info@ics.app</p>
                        <p className="text-sm text-gray-500">Respondemos en menos de 24 horas</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#00C9B7]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0A2540]">Oficina Principal</h3>
                        <p className="text-gray-600">Guayaquil, Ecuador</p>
                        <p className="text-sm text-gray-500">Zona Portuaria</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-[#0A2540] to-[#0A2540]/95 p-8 sm:p-12 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Comienza tu importacion hoy
                  </h3>
                  <p className="text-gray-300 mb-8">
                    Registrate gratis y obtén tu primera cotizacion en menos de 1 hora.
                  </p>
                  
                  <div className="space-y-4">
                    <Link 
                      to="/register?role=lead"
                      className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-[#00C9B7] hover:bg-[#00C9B7]/90 rounded-xl font-bold text-[#0A2540] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Soy Importador
                    </Link>
                    <Link 
                      to="/register?role=asesor"
                      className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-[#A4FF00] to-[#84CC16] hover:shadow-lg hover:shadow-[#A4FF00]/30 rounded-xl font-bold text-[#0A2540] transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Soy Asesor Comercial
                    </Link>
                    <Link 
                      to="/login"
                      className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-colors"
                    >
                      Ya tengo cuenta
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-[#0A2540] py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#00C9B7]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="font-bold text-white">IntegralCargoSolutions<span className="text-[#00C9B7]">.APP</span></span>
              </div>
              <p className="text-gray-400 text-sm">
                2025 ICS.APP - Servicio logistico integral, que impulsa tu negocio!
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
