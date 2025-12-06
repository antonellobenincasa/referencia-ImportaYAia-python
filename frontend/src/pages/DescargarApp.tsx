import { Link } from 'react-router-dom';

export default function DescargarApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#0A2540]/90">
      <nav className="fixed top-0 left-0 right-0 bg-[#0A2540]/80 backdrop-blur-md z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">ICS</span>
          </Link>
          <Link 
            to="/login" 
            className="text-sm font-medium text-white hover:text-[#00C9B7] transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/20 rounded-full mb-8">
            <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-sm font-medium text-[#00C9B7]">Descarga Gratuita</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Descarga{' '}
            <span className="text-[#00C9B7]">IntegralCargoSolutions.APP</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            Selecciona tu plataforma para descargar la aplicación y comienza a gestionar tus importaciones de manera inteligente.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Link 
              to="/register?platform=ios"
              className="group bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/10 hover:border-[#00C9B7] hover:bg-white/20 transition-all"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">iOS</h3>
              <p className="text-gray-400 text-sm mb-4">iPhone y iPad</p>
              <div className="inline-flex items-center gap-2 text-[#00C9B7] font-medium">
                <span>Descargar</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>

            <Link 
              to="/register?platform=android"
              className="group bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/10 hover:border-[#A4FF00] hover:bg-white/20 transition-all"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Android</h3>
              <p className="text-gray-400 text-sm mb-4">Smartphones y Tablets</p>
              <div className="inline-flex items-center gap-2 text-[#A4FF00] font-medium">
                <span>Descargar</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>

            <Link 
              to="/register?platform=windows"
              className="group bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/10 hover:border-[#00C9B7] hover:bg-white/20 transition-all"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Windows</h3>
              <p className="text-gray-400 text-sm mb-4">Desktop PC y Laptops</p>
              <div className="inline-flex items-center gap-2 text-[#00C9B7] font-medium">
                <span>Descargar</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>
          </div>

          <div className="mt-16 p-8 bg-white/5 rounded-3xl border border-white/10 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Requisitos del Sistema</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <p className="text-[#00C9B7] font-medium mb-1">iOS</p>
                <p className="text-gray-400 text-sm">iOS 14.0 o superior</p>
              </div>
              <div>
                <p className="text-[#A4FF00] font-medium mb-1">Android</p>
                <p className="text-gray-400 text-sm">Android 8.0 o superior</p>
              </div>
              <div>
                <p className="text-[#00C9B7] font-medium mb-1">Windows</p>
                <p className="text-gray-400 text-sm">Windows 10/11 (64-bit)</p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2024 IntegralCargoSolutions. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
