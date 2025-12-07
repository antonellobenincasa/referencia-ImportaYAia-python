import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface PublicNavProps {
  variant?: 'light' | 'dark';
}

export default function PublicNav({ variant = 'light' }: PublicNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navBg = variant === 'light' 
    ? 'bg-white/95 backdrop-blur-md border-b border-gray-100' 
    : 'bg-[#0A2540]/95 backdrop-blur-md border-b border-white/10';

  const textColor = variant === 'light' ? 'text-[#0A2540]' : 'text-white';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#0A2540] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className={`text-sm sm:text-base font-bold ${textColor}`}>
                  <span className="sm:hidden">ICS</span>
                  <span className="hidden sm:inline">IntegralCargoSolutions</span>
                </span>
                <span className="text-[#00C9B7] font-bold text-sm sm:text-base">.APP</span>
              </div>
              <span className={`text-[10px] sm:text-xs ${variant === 'light' ? 'text-gray-500' : 'text-gray-400'} hidden sm:block`}>
                Servicio logístico integral, que impulsa tu negocio!
              </span>
            </div>
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2.5 rounded-xl ${variant === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'} transition-colors`}
            aria-label="Abrir menú"
          >
            <svg className={`w-6 h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0A2540] shadow-2xl border-t border-white/10 py-4 px-4">
          <div className="max-w-7xl mx-auto space-y-2">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-semibold text-white">Inicio</span>
            </a>
            
            <Link 
              to="/nosotros" 
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${isActive('/nosotros') ? 'bg-[#00C9B7] text-[#0A2540]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              <svg className={`w-5 h-5 ${isActive('/nosotros') ? 'text-[#0A2540]' : 'text-[#00C9B7]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-semibold">Nosotros</span>
            </Link>
            
            <Link 
              to="/descargar-app" 
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${isActive('/descargar-app') ? 'bg-[#00C9B7] text-[#0A2540]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              <svg className={`w-5 h-5 ${isActive('/descargar-app') ? 'text-[#0A2540]' : 'text-[#00C9B7]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="font-semibold">Descarga la App Gratis</span>
            </Link>
            
            <a 
              href="#contacto" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-[#00C9B7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-white">Contacto</span>
            </a>
            
            <div className="py-2">
              <div className="border-t border-white/20"></div>
            </div>
            
            <Link 
              to="/register?role=lead" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-4 rounded-xl bg-[#00C9B7] hover:bg-[#00C9B7]/90 transition-colors shadow-lg"
            >
              <svg className="w-6 h-6 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="font-bold text-[#0A2540] text-lg">QUIERO IMPORTAR CON ICS.APP</span>
            </Link>
            
            <Link 
              to="/register?role=asesor" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-4 rounded-xl bg-gradient-to-r from-[#A4FF00] to-[#84CC16] hover:shadow-lg hover:shadow-[#A4FF00]/30 transition-all shadow-lg"
            >
              <svg className="w-6 h-6 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="font-bold text-[#0A2540] text-lg">QUIERO INCREMENTAR MIS VENTAS</span>
            </Link>
            
            <div className="py-2">
              <div className="border-t border-white/20"></div>
            </div>
            
            <Link 
              to="/login" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-white hover:bg-gray-100 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="font-bold text-[#0A2540]">Iniciar Sesión</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
