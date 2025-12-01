import { useTheme } from '../context/ThemeContext';
import { Palette, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface ColorInput {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

export default function CustomThemeCreator() {
  const { createCustomTheme, customTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [colors, setColors] = useState<ColorInput>({
    primary: customTheme?.primary || '#0A2540',
    secondary: customTheme?.secondary || '#00C9B7',
    accent: customTheme?.accent || '#A4FF00',
    bg: customTheme?.bg || '#F8FAFB',
    text: customTheme?.text || '#111827',
  });

  const handleColorChange = (key: keyof ColorInput, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    createCustomTheme(colors);
    setIsOpen(false);
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium tracking-ui text-white hover:text-velocity-green hover:bg-white/10 rounded-lg transition-all duration-200"
        title="Crear tu propia paleta de colores"
      >
        <Plus className="h-4 w-4 mr-2" />
        Personalizar
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <Palette className="h-5 w-5 text-velocity-green" />
            <h3 className="font-bold text-gray-900">Crear Paleta Personalizada</h3>
          </div>

          <p className="text-xs text-gray-600 mb-4">
            Selecciona 5 colores para crear tu propia paleta
          </p>

          {/* Color Inputs */}
          <div className="space-y-3 mb-4">
            {[
              { key: 'primary', label: 'Color Primario (Navegación)', desc: 'Azul marino, verde, etc.' },
              { key: 'secondary', label: 'Color Secundario', desc: 'Teal, Cian, etc.' },
              { key: 'accent', label: 'Color de Acento', desc: 'Verde lima, dorado, etc.' },
              { key: 'bg', label: 'Fondo de Página', desc: 'Blanco, gris claro, etc.' },
              { key: 'text', label: 'Color de Texto', desc: 'Negro, gris oscuro, etc.' },
            ].map((item) => (
              <div key={item.key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {item.label}
                </label>
                <p className="text-xs text-gray-500 mb-2">{item.desc}</p>
                <div className="flex gap-2">
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
          <div className="mb-4 p-3 rounded-lg border-2 border-gray-200" style={{ backgroundColor: colors.bg }}>
            <div className="flex gap-2">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: colors.primary }}
                title="Primario"
              />
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: colors.secondary }}
                title="Secundario"
              />
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: colors.accent }}
                title="Acento"
              />
            </div>
            <p className="text-xs mt-2" style={{ color: colors.text }}>
              Vista previa
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 px-3 py-2 bg-velocity-green text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Aplicar
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-sm flex items-center justify-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-2 px-3 py-2 text-gray-700 font-medium text-sm hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
