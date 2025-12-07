import { useState, useEffect } from 'react';
import { Lock, Unlock, RotateCcw, Zap, Check, ArrowUpDown } from 'lucide-react';
import {
  Briefcase, FileText, Settings, Plus, Eye, ZapIcon, Clock, TrendingUp, BookOpen,
  Users, Rocket, FileCheck
} from 'lucide-react';

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  iconoKey: string;
  color: string;
  categoria: string;
}

const iconMap = {
  briefcase: Briefcase,
  filetext: FileText,
  settings: Settings,
  plus: Plus,
  eye: Eye,
  zap: ZapIcon,
  clock: Clock,
  trendingup: TrendingUp,
  bookopen: BookOpen,
  users: Users,
  rocket: Rocket,
  filecheck: FileCheck,
};

export default function CotizadorManual() {
  const tareasDefault: Tarea[] = [
    { id: '1', nombre: 'Nueva Cotización', descripcion: 'Crear cotización manual rápidamente', iconoKey: 'plus', color: 'from-orange-500 to-red-600', categoria: 'Cotizaciones' },
    { id: '2', nombre: 'Consulta Tarifas', descripcion: 'Acceso a estructura de precios', iconoKey: 'clock', color: 'from-red-500 to-pink-600', categoria: 'Tarifas' },
    { id: '3', nombre: 'Administrar Cotizaciones', descripcion: 'Seguimiento de todas las cotizaciones', iconoKey: 'settings', color: 'from-purple-500 to-pink-600', categoria: 'Cotizaciones' },
    { id: '4', nombre: 'Asignación de Embarques', descripcion: 'Asignar cotización a RO', iconoKey: 'trendingup', color: 'from-cyan-500 to-blue-600', categoria: 'Logística' },
    { id: '5', nombre: 'Instrucción de Embarque', descripcion: 'Shipping instructions automatizadas', iconoKey: 'filecheck', color: 'from-sky-500 to-cyan-600', categoria: 'Documentos' },
    { id: '6', nombre: 'Ofertas Masivas', descripcion: 'Envío masivo de propuestas', iconoKey: 'zap', color: 'from-yellow-500 to-orange-600', categoria: 'Ofertas' },
    { id: '7', nombre: 'Consultar Prospectos', descripcion: 'Base de datos de leads', iconoKey: 'rocket', color: 'from-emerald-500 to-teal-600', categoria: 'Base de Datos' },
    { id: '8', nombre: 'Consulta Ofertas', descripcion: 'Ver y modificar ofertas', iconoKey: 'eye', color: 'from-indigo-500 to-blue-600', categoria: 'Ofertas' },
    { id: '9', nombre: 'Consulta Tarifas Históricas', descripcion: 'Análisis de evolución de precios', iconoKey: 'bookopen', color: 'from-teal-500 to-green-600', categoria: 'Análisis' },
    { id: '10', nombre: 'Prospectos', descripcion: 'Gestión de leads y calificación', iconoKey: 'briefcase', color: 'from-blue-500 to-cyan-600', categoria: 'Prospección' },
    { id: '11', nombre: 'Plantillas', descripcion: 'Cotizaciones según incoterms', iconoKey: 'filetext', color: 'from-green-500 to-emerald-600', categoria: 'Documentación' },
    { id: '12', nombre: 'Crear Grupos Personas', descripcion: 'Segmentación y roles', iconoKey: 'users', color: 'from-violet-500 to-purple-600', categoria: 'Gestión' }
  ];

  const [tareas, setTareas] = useState<Tarea[]>(tareasDefault);
  const [isLocked, setIsLocked] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cotizadorTareas');
    const locked = localStorage.getItem('cotizadorLocked');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTareas(parsed);
      } catch {
        setTareas(tareasDefault);
      }
    }
    if (locked) {
      try {
        setIsLocked(JSON.parse(locked));
      } catch {
        setIsLocked(false);
      }
    }
  }, []);

  const handleCardClick = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLocked) return;

    if (selectedItem === null) {
      setSelectedItem(id);
    } else if (selectedItem === id) {
      setSelectedItem(null);
    } else {
      const selectedIndex = tareas.findIndex(t => t.id === selectedItem);
      const targetIndex = tareas.findIndex(t => t.id === id);

      if (selectedIndex !== targetIndex) {
        const newTareas = [...tareas];
        const temp = newTareas[selectedIndex];
        newTareas[selectedIndex] = newTareas[targetIndex];
        newTareas[targetIndex] = temp;
        setTareas(newTareas);
        localStorage.setItem('cotizadorTareas', JSON.stringify(newTareas));
      }
      setSelectedItem(null);
    }
  };

  const toggleLocked = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    setSelectedItem(null);
    localStorage.setItem('cotizadorLocked', JSON.stringify(newLocked));
    localStorage.setItem('cotizadorTareas', JSON.stringify(tareas));
  };

  const resetearOrden = () => {
    setTareas(tareasDefault);
    setIsLocked(false);
    setSelectedItem(null);
    localStorage.removeItem('cotizadorTareas');
    localStorage.removeItem('cotizadorLocked');
  };

  const getIcon = (iconoKey: string, size: string = "h-5 w-5") => {
    const Icon = iconMap[iconoKey as keyof typeof iconMap] || Briefcase;
    return <Icon className={size} />;
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isLocked 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-100 to-gray-200'
    }`}>
      {/* HEADER ANCLADO */}
      {isLocked && (
        <div className="bg-slate-800 shadow-lg border-b-2 border-lime-500 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-3 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-lime-400" />
                <h1 className="text-xl font-bold text-white">Tareas Personalizadas</h1>
                <span className="text-lime-400 text-sm">🔒 Anclado</span>
              </div>
              <button
                onClick={toggleLocked}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-lime-500 text-slate-900 rounded-lg font-semibold text-sm hover:bg-lime-400 transition-all shadow"
              >
                <Unlock className="h-4 w-4" />
                Desanclar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <div className={`max-w-7xl mx-auto px-3 transition-all duration-300 ${isLocked ? 'py-4' : 'py-6'}`}>
        
        {/* HEADER NO ANCLADO */}
        {!isLocked && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cotizador Manual</h1>
                <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                  <ArrowUpDown className="h-4 w-4" />
                  Toca una tarjeta para seleccionar, luego toca otra para intercambiar
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleLocked}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow bg-lime-500 text-slate-900 hover:bg-lime-400"
                >
                  <Lock className="h-4 w-4" />
                  Anclar
                </button>

                <button
                  onClick={resetearOrden}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-400 transition-all shadow"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetear
                </button>
              </div>
            </div>

            {selectedItem && (
              <div className="bg-lime-100 border border-lime-400 rounded-lg p-3 mb-4">
                <p className="text-lime-800 font-medium text-sm flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Tarjeta seleccionada. Toca otra tarjeta para intercambiar posiciones.
                </p>
              </div>
            )}
          </div>
        )}

        {/* GRID DE TAREAS - Compacto */}
        <div className={`grid gap-2 sm:gap-3 ${
          isLocked 
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' 
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}>
          {tareas.map((tarea, index) => {
            const isSelected = selectedItem === tarea.id;
            
            return (
              <div
                key={tarea.id}
                onClick={(e) => handleCardClick(e, tarea.id)}
                onTouchEnd={(e) => handleCardClick(e, tarea.id)}
                style={{ touchAction: 'manipulation' }}
                className={`relative overflow-hidden rounded-xl transition-all duration-200 select-none ${
                  isLocked
                    ? 'bg-slate-700/80 border border-slate-600 p-3 cursor-default hover:bg-slate-700'
                    : `bg-white border-2 p-3 shadow cursor-pointer active:scale-95 ${
                        isSelected 
                          ? 'border-lime-500 ring-2 ring-lime-400 ring-offset-2 scale-[1.02] shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`
                }`}
              >
                {/* NÚMERO DE ORDEN */}
                <div className={`absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  isLocked 
                    ? 'bg-lime-500 text-slate-900' 
                    : isSelected 
                      ? 'bg-lime-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-9 h-9 bg-gradient-to-br ${tarea.color} rounded-lg mb-2 text-white shadow-sm`}>
                  {getIcon(tarea.iconoKey)}
                </div>

                <h3 className={`font-semibold text-sm leading-tight mb-1 pr-5 ${
                  isLocked ? 'text-white' : 'text-gray-900'
                }`}>
                  {tarea.nombre}
                </h3>
                
                <p className={`text-xs leading-snug line-clamp-2 ${
                  isLocked ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {tarea.descripcion}
                </p>

                <span className={`inline-block mt-2 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                  isLocked 
                    ? 'bg-slate-600 text-gray-300' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tarea.categoria}
                </span>

                {/* Selected indicator */}
                {isSelected && !isLocked && (
                  <div className="absolute inset-0 border-2 border-lime-500 rounded-xl pointer-events-none">
                    <div className="absolute -top-1 -left-1 bg-lime-500 text-white p-0.5 rounded-br-lg">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className={`mt-6 p-4 rounded-lg ${
          isLocked 
            ? 'bg-slate-800 border border-slate-700' 
            : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Total:</span> {tareas.length} tareas | 
              <span className="font-medium ml-1">Estado:</span> {isLocked ? '🔒 Anclado' : '✏️ Editable'}
            </p>
            
            {isLocked && (
              <button
                onClick={resetearOrden}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Resetear orden
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
