import { Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';

export default function Nosotros() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav variant="light" />

      <section className="pt-24 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 rounded-full mb-6">
              <span className="text-2xl">🚢</span>
              <span className="text-sm font-medium text-[#0A2540]">ImportaYa.ia</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0A2540] leading-tight mb-6">
              Logística de Carga Integral,{' '}
              <span className="text-[#00C9B7]">ahora es Inteligente!</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              En ImportaYa.ia, transformamos la forma en que gestionas tu carga y tu negocio. 
              Ofrecemos soluciones digitales potentes para importadores.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
                <span className="text-[#0A2540] font-black text-lg">IA</span>
              </div>
              <div>
                <p className="text-sm text-[#00C9B7] font-medium">Plataforma Inteligente para Importadores</p>
                <h2 className="text-2xl font-bold text-[#0A2540]">Cotiza y Embarca en Segundos</h2>
              </div>
            </div>

            <p className="text-gray-500 mb-6 italic">
              Para importadores nuevos o experimentados que buscan eficiencia, transparencia y las mejores tarifas.
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
                  <p className="text-gray-600">Regístrate y accede sin costo a nuestra plataforma inteligente.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#00C9B7]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540]">Cotizaciones Inteligentes 24/7</h4>
                  <p className="text-gray-600">Olvídate de esperar horas. Solicita tu cotización en cualquier momento y recibe tarifas altamente competitivas generadas automáticamente por nuestro sistema inteligente.</p>
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
                  <p className="text-gray-600">Una vez que apruebes la tarifa, nuestra plataforma generará automáticamente un RO (Routing Order) único. Utiliza este RO para enviar tu instrucción de embarque de forma inmediata.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#00C9B7]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540]">Tracking Inteligente</h4>
                  <p className="text-gray-600">Sigue tu mercancía en tiempo real desde el origen hasta la entrega final en Ecuador.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#A4FF00]/10 rounded-2xl p-6 mb-8">
              <p className="text-[#0A2540] font-semibold">
                El Valor Clave: <span className="font-normal">Ahorro de Tiempo y Dinero. Accede a las mejores tarifas del mercado y convierte las horas de espera en minutos de acción.</span>
              </p>
            </div>

            <Link 
              to="/register"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#A4FF00] text-[#0A2540] rounded-2xl font-bold text-lg hover:scale-105 transition-transform"
            >
              Comienza a Importar con ImportaYa.ia
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0A2540] rounded-3xl p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#00C9B7] rounded-xl flex items-center justify-center">
                <span className="text-2xl">🌍</span>
              </div>
              <div>
                <p className="text-sm text-[#A4FF00] font-medium">Nuestros Servicios</p>
                <h2 className="text-2xl font-bold text-white">Logística Integral hacia Ecuador</h2>
              </div>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Conectamos al mundo con Ecuador a través de servicios logísticos inteligentes y personalizados.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <div className="text-3xl mb-3">✈️</div>
                <h4 className="font-semibold text-white mb-2">Transporte Aéreo</h4>
                <p className="text-gray-300 text-sm">Entrega rápida en 2-5 días desde cualquier parte del mundo.</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <div className="text-3xl mb-3">🚢</div>
                <h4 className="font-semibold text-white mb-2">Transporte Marítimo</h4>
                <p className="text-gray-300 text-sm">FCL y LCL con tiempos de tránsito de 15-30 días.</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <div className="text-3xl mb-3">🚛</div>
                <h4 className="font-semibold text-white mb-2">Transporte Terrestre</h4>
                <p className="text-gray-300 text-sm">Distribución nacional con cobertura en todo Ecuador.</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <div className="text-3xl mb-3">📋</div>
                <h4 className="font-semibold text-white mb-2">Agenciamiento Aduanero</h4>
                <p className="text-gray-300 text-sm">Gestión profesional con agentes certificados por el SENAE.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#A4FF00] text-[#0A2540] rounded-2xl font-bold hover:scale-105 transition-transform"
              >
                Cotizar Ahora
              </Link>
              <Link 
                to="/contacto"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#00C9B7] text-[#00C9B7] rounded-2xl font-semibold hover:bg-[#00C9B7] hover:text-[#0A2540] transition-all"
              >
                Contactar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
              <span className="text-[#0A2540] font-black">IA</span>
            </div>
            <span className="font-bold text-[#0A2540]">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
          </Link>
          <p className="text-gray-500 text-sm">
            © 2024 ImportaYa.ia - La logística de carga integral, ahora es Inteligente!
          </p>
        </div>
      </footer>
    </div>
  );
}
