import PortalNavbar from '../components/PortalNavbar';

export default function AduanaExpertoIA() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] rounded-full text-sm font-bold text-[#0A2540] mb-4">
            <span className="w-2 h-2 bg-[#0A2540] rounded-full animate-pulse"></span>
            IA ACTIVA 24/7
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A2540] mb-3">
            AduanaExperto<span className="text-[#00C9B7]">IA</span>
          </h1>
          <p className="text-lg sm:text-xl font-medium text-[#00C9B7] mb-2">
            CHAT INTELIGENTE ADUANERO + SIMULADOR DE COSTOS IMPORT
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto text-sm sm:text-base">
            Sin necesidad de solicitar cotizacion o contar con una cotizacion aprobada en la APP, podras rapidamente gracias a nuestra IA simular tus costos de importacion en pocos minutos. Sin necesidad de hablar con nadie, ni estar atras de nadie o esperando que te respondan tus llamadas o correos, nuestra IA te asiste, cotiza y coordina todo de manera AUTOMATIZADA, AGIL e INTELIGENTE!
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden min-h-[600px] relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                <span className="text-5xl">🤖</span>
              </div>
              <h2 className="text-2xl font-bold text-[#0A2540] mb-3">
                Chat IA en Preparacion
              </h2>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                El modulo de Chat Inteligente Aduanero sera integrado proximamente. Aqui podras simular tus costos de importacion con asistencia de IA en tiempo real.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 text-[#00C9B7] rounded-xl text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Simulador de Costos
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 text-[#00C9B7] rounded-xl text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Chat IA 24/7
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 text-[#00C9B7] rounded-xl text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Clasificacion Arancelaria
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-4">
            El futuro de la logistica de carga integral IA esta aqui y se llama
          </p>
          <a 
            href="https://importayaia.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#00C9B7] font-bold text-lg hover:text-[#A4FF00] transition-colors"
          >
            ImportaYAia.com
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-gray-100 mt-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            2024 ImportaYa.ia - La logistica de carga integral, ahora es Inteligente!
          </p>
        </div>
      </footer>
    </div>
  );
}
