import PublicNav from '../components/PublicNav';
import { Link } from 'react-router-dom';

export default function Contacto() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicNav variant="light" />
      
      <main className="pt-20">
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C9B7]/10 rounded-full text-[#00C9B7] font-medium text-sm mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contacto
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2540] mb-4">
                Contáctanos
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Estamos listos para ayudarte con tu próxima importación. Nuestro equipo de expertos te atenderá de manera personalizada.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 sm:p-12">
                  <h2 className="text-2xl font-bold text-[#0A2540] mb-8">
                    Información de Contacto
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#00C9B7]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0A2540]">Teléfono / WhatsApp</h3>
                        <p className="text-gray-600 text-lg">+593 99 123 4567</p>
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
                        <h3 className="font-semibold text-[#0A2540]">Correo Electrónico</h3>
                        <p className="text-gray-600 text-lg">info@ics.app</p>
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
                        <p className="text-gray-600 text-lg">Guayaquil, Ecuador</p>
                        <p className="text-sm text-gray-500">Zona Portuaria</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#00C9B7]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0A2540]">Horario de Atención</h3>
                        <p className="text-gray-600">Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                        <p className="text-gray-600">Sábados: 9:00 AM - 1:00 PM</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h3 className="font-semibold text-[#0A2540] mb-4">Síguenos en Redes Sociales</h3>
                    <div className="flex gap-4">
                      <a href="#" className="w-10 h-10 bg-[#0A2540] rounded-lg flex items-center justify-center hover:bg-[#00C9B7] transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-[#0A2540] rounded-lg flex items-center justify-center hover:bg-[#00C9B7] transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-[#0A2540] rounded-lg flex items-center justify-center hover:bg-[#00C9B7] transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-[#0A2540] rounded-lg flex items-center justify-center hover:bg-[#00C9B7] transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-[#0A2540] to-[#0A2540]/95 p-8 sm:p-12 flex flex-col justify-center">
                  <div className="w-16 h-16 bg-[#A4FF00]/20 rounded-2xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-[#A4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Descarga Nuestra APP Gratis
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Gestiona tus importaciones desde cualquier lugar. Cotiza, rastrea y comunícate con nosotros directamente desde tu dispositivo móvil.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-white/80">
                      <svg className="w-5 h-5 text-[#A4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Cotizaciones en tiempo real</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <svg className="w-5 h-5 text-[#A4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Tracking de tus envíos</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <svg className="w-5 h-5 text-[#A4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Notificaciones instantáneas</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <svg className="w-5 h-5 text-[#A4FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Soporte directo por chat</span>
                    </div>
                  </div>
                  
                  <Link 
                    to="/descargar-app"
                    className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-[#A4FF00] hover:bg-[#A4FF00]/90 rounded-xl font-bold text-[#0A2540] transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#A4FF00]/30"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Ir a Página de Descarga
                  </Link>
                  
                  <p className="text-center text-white/50 text-sm mt-4">
                    Disponible para iOS, Android y Windows Desktop
                  </p>
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
                2025 ICS.APP - Servicio logístico integral, que impulsa tu negocio!
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
