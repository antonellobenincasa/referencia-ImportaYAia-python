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
                <span className="text-sm font-medium text-[#0A2540]">Logística Inteligente Ecuador</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-[#0A2540] leading-tight">
                Importa fácil,{' '}
                <span className="text-[#00C9B7]">sin complicaciones!</span>
              </h1>
              
              <div className="space-y-4 max-w-xl">
                <p className="text-xl text-gray-600 leading-relaxed">
                  <strong className="text-[#0A2540]">La logística de carga integral, ahora es Inteligente!</strong> Somos tu aliado para importar desde cualquier parte del mundo hacia Ecuador.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link 
                    to="/register"
                    className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#A4FF00] text-[#0A2540] rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#A4FF00]/30"
                  >
                    <span className="relative z-10">COTIZA AHORA</span>
                    <svg className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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

      <section className="py-20 px-6 bg-[#0A2540]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">¿Cómo funciona?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              Importar es más fácil de lo que piensas. Te guiamos paso a paso con nuestra plataforma inteligente.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Cotiza', desc: 'Solicita tu cotización inteligente en 2 minutos', icon: '📋' },
              { step: 2, title: 'Aprueba', desc: 'Revisa y aprueba tu cotización', icon: '✅' },
              { step: 3, title: 'Embarca', desc: 'Tu mercancía viaja segura hacia Ecuador', icon: '🚢' },
              { step: 4, title: 'Recibe', desc: 'Entrega en tu puerta con tracking 24/7', icon: '📦' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">
                  {item.icon}
                </div>
                <div className="w-10 h-10 bg-[#A4FF00] rounded-full flex items-center justify-center mx-auto mb-4 text-[#0A2540] font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#A4FF00] text-[#0A2540] rounded-xl font-bold text-lg hover:bg-white transition-colors"
            >
              Comenzar Ahora
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section id="servicios" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 rounded-full text-[#00C9B7] font-medium text-sm mb-4">
              Servicios Logísticos Inteligentes
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2540] mb-4">Nuestros Servicios</h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Soluciones integrales de logística internacional adaptadas a tu negocio, potenciadas con tecnología inteligente.
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
                  Servicio de carga aérea para importaciones urgentes desde cualquier parte del mundo.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Consolidación desde China, USA y Europa</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Tracking inteligente en tiempo real</span>
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
                  Transporte marítimo económico para grandes volúmenes de mercancía.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Contenedores FCL 20' y 40'</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00C9B7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Carga consolidada LCL</span>
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
                  Distribución terrestre con cobertura en todas las provincias del Ecuador.
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
                    <span className="text-gray-700">Servicio exento de IVA</span>
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
                  Gestión aduanera profesional con agentes certificados por el SENAE.
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
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-r from-[#00C9B7] to-[#00a99d]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            ¿Listo para importar de forma inteligente?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Únete a más de 500 importadores que confían en ImportaYa.ia. Cotiza ahora y recibe respuesta en minutos.
          </p>
          <Link 
            to="/register"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#A4FF00] text-[#0A2540] rounded-2xl font-bold text-xl hover:bg-white transition-colors"
          >
            Cotiza Ahora - Es Gratis
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      <footer className="bg-[#0A2540] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
                  <span className="text-[#0A2540] font-black text-lg">IA</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                La logística de carga integral, ahora es Inteligente!
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Servicios</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Transporte Aéreo</li>
                <li>Transporte Marítimo</li>
                <li>Transporte Terrestre</li>
                <li>Agenciamiento Aduanero</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Enlaces</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/nosotros" className="text-gray-400 hover:text-white">Nosotros</Link></li>
                <li><Link to="/contacto" className="text-gray-400 hover:text-white">Contacto</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white">Iniciar Sesión</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white">Registrarse</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>+593 999 999 999</li>
                <li>info@importaya.ia</li>
                <li>Guayaquil, Ecuador</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 ImportaYa.ia. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
