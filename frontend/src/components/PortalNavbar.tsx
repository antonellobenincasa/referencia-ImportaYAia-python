import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { label: 'Dashboard', link: '/portal', icon: '🏠' },
  { label: 'Solicitar Cotizacion', link: '/portal/cotizar', icon: '📦' },
  { label: 'Mis Cotizaciones', link: '/portal/mis-cotizaciones', icon: '📋' },
  { label: 'Pre-Liquidacion SENAE', link: '/portal/pre-liquidacion-senae', icon: '🏛️' },
  { label: 'AduanaExpertoIA', link: '/portal/aduana-experto-ia', icon: '🤖' },
  { label: 'Cargo Tracking', link: '/portal/cargo-tracking', icon: '🗺️' },
  { label: 'Mi Cuenta', link: '/portal/mi-cuenta', icon: '👤' },
];

export default function PortalNavbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#0A2540] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link to="/portal" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
            <span className="text-[#0A2540] font-black text-xs sm:text-sm">IA</span>
          </div>
          <span className="text-base sm:text-lg font-bold">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
        </Link>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <Link to="/portal/mi-cuenta" className="hidden sm:block text-sm text-gray-300 hover:text-white transition-colors">
            Mi Cuenta
          </Link>
          <span className="hidden sm:block text-sm text-gray-300">
            Hola, <span className="text-white font-medium">{user?.first_name || 'Usuario'}</span>
          </span>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              aria-label="Menu"
            >
              <span className="hidden sm:inline text-sm font-medium">Menu</span>
              <svg 
                className={`w-6 h-6 transition-transform duration-200 ${menuOpen ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-gray-300 py-2 z-50" style={{backgroundColor: '#ffffff'}}>
                <div className="px-4 py-3 border-b-2 border-gray-200" style={{backgroundColor: '#f3f4f6'}}>
                  <p style={{color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'}}>Sesion activa</p>
                  <p style={{color: '#0A2540', fontSize: '16px', fontWeight: 700}}>{user?.first_name} {user?.last_name}</p>
                  <p style={{color: '#4b5563', fontSize: '13px'}}>{user?.email}</p>
                </div>
                
                <div className="py-2">
                  {menuItems.map((item) => (
                    <Link
                      key={item.link}
                      to={item.link}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-teal-100 transition-colors"
                      style={{color: '#1f2937'}}
                    >
                      <span style={{fontSize: '20px'}}>{item.icon}</span>
                      <span style={{color: '#111827', fontWeight: 600, fontSize: '14px'}}>{item.label}</span>
                    </Link>
                  ))}
                </div>
                
                <div className="border-t-2 border-gray-200 pt-2 mt-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-100 transition-colors w-full"
                    style={{color: '#dc2626'}}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span style={{color: '#dc2626', fontWeight: 700, fontSize: '14px'}}>Cerrar Sesion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
