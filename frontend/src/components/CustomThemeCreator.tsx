import { useTheme } from '../context/ThemeContext';
import { Palette, RotateCcw, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ColorInput {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

interface CustomThemeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomThemeCreator({ isOpen, onClose }: CustomThemeCreatorProps) {
  const { createCustomTheme, customTheme } = useTheme();
  const [colors, setColors] = useState<ColorInput>({
    primary: customTheme?.primary || '#0A2540',
    secondary: customTheme?.secondary || '#00C9B7',
    accent: customTheme?.accent || '#A4FF00',
    bg: customTheme?.bg || '#F8FAFB',
    text: customTheme?.text || '#111827',
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleColorChange = (key: keyof ColorInput, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    createCustomTheme(colors);
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleReset = () => {
    setColors({
      primary: '#0A2540',
      secondary: '#00C9B7',
      accent: '#A4FF00',
      bg: '#F8FAFB',
      text: '#111827',
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-velocity-green" />
            <h2 className="font-bold text-gray-900 text-lg">Crear Paleta Personalizada</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona 5 colores para crear tu propia paleta personalizada
          </p>

          {/* Color Inputs */}
          <div className="space-y-4">
            {[
              { key: 'primary', label: 'Color Primario', desc: 'Para navegación y elementos principales', number: '1️⃣' },
              { key: 'secondary', label: 'Color Secundario', desc: 'Para acentos secundarios', number: '2️⃣' },
              { key: 'accent', label: 'Color de Acento', desc: 'Para botones y destacados', number: '3️⃣' },
              { key: 'bg', label: 'Fondo de Página', desc: 'Color de fondo general', number: '4️⃣' },
              { key: 'text', label: 'Color de Texto', desc: 'Color del texto principal', number: '5️⃣' },
            ].map((item) => (
              <div key={item.key} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{item.number}</span>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">
                      {item.label}
                    </label>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="color"
                    value={colors[item.key as keyof ColorInput]}
                    onChange={(e) => handleColorChange(item.key as keyof ColorInput, e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={colors[item.key as keyof ColorInput]}
                    onChange={(e) => handleColorChange(item.key as keyof ColorInput, e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs font-mono text-gray-700"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 rounded-lg border-2" style={{ backgroundColor: colors.bg, borderColor: colors.primary }}>
            <p className="text-xs font-semibold" style={{ color: colors.text }}>Vista previa:</p>
            <div className="flex gap-2 mt-2">
              <div
                className="flex-1 p-3 rounded text-white text-xs font-semibold text-center"
                style={{ backgroundColor: colors.primary }}
              >
                Primario
              </div>
              <div
                className="flex-1 p-3 rounded text-white text-xs font-semibold text-center"
                style={{ backgroundColor: colors.secondary }}
              >
                Secundario
              </div>
              <div
                className="flex-1 p-3 rounded text-gray-900 text-xs font-semibold text-center"
                style={{ backgroundColor: colors.accent }}
              >
                Acento
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-3 bg-velocity-green text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Aplicar Paleta
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
