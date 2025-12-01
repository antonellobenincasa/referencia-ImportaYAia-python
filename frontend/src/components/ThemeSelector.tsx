import { useTheme, themes } from '../context/ThemeContext';
import { Palette, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium tracking-ui text-white hover:text-aqua-flow hover:bg-white/10 rounded-lg transition-all duration-200"
        title="Cambiar tema de colores"
      >
        <Palette className="h-4 w-4 mr-2" />
        Tema
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100">
            Paletas de Colores
          </div>
          {Object.values(themes).map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setTheme(theme.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 hover:bg-gray-50 ${
                currentTheme.id === theme.id ? 'bg-gray-100 border-l-4' : 'border-l-4 border-transparent'
              }`}
              style={{
                borderLeftColor: currentTheme.id === theme.id ? theme.accent : 'transparent',
              }}
            >
              <div className="flex gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                  title="Color primario"
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.secondary }}
                  title="Color secundario"
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.accent }}
                  title="Color de acento"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{theme.name}</p>
              </div>
              {currentTheme.id === theme.id && (
                <div className="text-sm font-bold text-green-600">✓</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
