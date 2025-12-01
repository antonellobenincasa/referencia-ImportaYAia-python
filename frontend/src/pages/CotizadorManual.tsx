import { useState, useEffect } from 'react';
import { Grip, Lock, Unlock, RotateCcw, Zap } from 'lucide-react';
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
    { id: '1', nombre: 'Prospectos', descripcion: 'Gestión de leads y calificación', iconoKey: 'briefcase', color: 'from-blue-500 to-cyan-600', categoria: 'Prospección' },
    { id: '2', nombre: 'Plantillas', descripcion: 'Cotizaciones según incoterms', iconoKey: 'filetext', color: 'from-green-500 to-emerald-600', categoria: 'Documentación' },
    { id: '3', nombre: 'Administrar Cotizaciones', descripcion: 'Seguimiento de todas las cotizaciones', iconoKey: 'settings', color: 'from-purple-500 to-pink-600', categoria: 'Cotizaciones' },
    { id: '4', nombre: 'Nueva Cotización', descripcion: 'Crear cotización manual rápidamente', iconoKey: 'plus', color: 'from-orange-500 to-red-600', categoria: 'Cotizaciones' },
    { id: '5', nombre: 'Consulta Ofertas', descripcion: 'Ver y modificar ofertas', iconoKey: 'eye', color: 'from-indigo-500 to-blue-600', categoria: 'Ofertas' },
    { id: '6', nombre: 'Ofertas Masivas', descripcion: 'Envío masivo de propuestas', iconoKey: 'zap', color: 'from-yellow-500 to-orange-600', categoria: 'Ofertas' },
    { id: '7', nombre: 'Consulta Tarifas', descripcion: 'Acceso a estructura de precios', iconoKey: 'clock', color: 'from-red-500 to-pink-600', categoria: 'Tarifas' },
    { id: '8', nombre: 'Asignación de Embarques', descripcion: 'Asignar cotización a RO', iconoKey: 'trendingup', color: 'from-cyan-500 to-blue-600', categoria: 'Logística' },
    { id: '9', nombre: 'Consulta Tarifas Históricas', descripcion: 'Análisis de evolución de precios', iconoKey: 'bookopen', color: 'from-teal-500 to-green-600', categoria: 'Análisis' },
    { id: '10', nombre: 'Crear Grupos Personas', descripcion: 'Segmentación y roles', iconoKey: 'users', color: 'from-violet-500 to-purple-600', categoria: 'Gestión' },
    { id: '11', nombre: 'Consultar Prospectos', descripcion: 'Base de datos de leads', iconoKey: 'rocket', color: 'from-emerald-500 to-teal-600', categoria: 'Base de Datos' },
    { id: '12', nombre: 'Instrucción de Embarque', descripcion: 'Shipping instructions automatizadas', iconoKey: 'filecheck', color: 'from-sky-500 to-cyan-600', categoria: 'Documentos' }
  ];

  const [tareas, setTareas] = useState<Tarea[]>(tareasDefault);
  const [isLocked, setIsLocked] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || isLocked) return;

    const draggedIndex = tareas.findIndex(t => t.id === draggedItem);
    const targetIndex = tareas.findIndex(t => t.id === targetId);

    if (draggedIndex !== targetIndex) {
      const newTareas = [...tareas];
      const temp = newTareas[draggedIndex];
      newTareas[draggedIndex] = newTareas[targetIndex];
      newTareas[targetIndex] = temp;
      setTareas(newTareas);
      localStorage.setItem('cotizadorTareas', JSON.stringify(newTareas));
    }
    setDraggedItem(null);
  };

  const toggleLocked = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    localStorage.setItem('cotizadorLocked', JSON.stringify(newLocked));
    localStorage.setItem('cotizadorTareas', JSON.stringify(tareas));
  };

  const resetearOrden = () => {
    setTareas(tareasDefault);
    setIsLocked(false);
    localStorage.removeItem('cotizadorTareas');
    localStorage.removeItem('cotizadorLocked');
  };

  const getIcon = (iconoKey: string) => {
    const Icon = iconMap[iconoKey as keyof typeof iconMap] || Briefcase;
    return <Icon className="h-8 w-8" />;
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isLocked 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* HEADER ANCLADO - ESTILO MENÚ SUPERIOR */}
      {isLocked && (
        <div className="bg-deep-ocean shadow-lg border-b-4 border-velocity-green sticky top-0 z-40 mb-8">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                  <Zap className="h-8 w-8 text-velocity-green" />
                  Tareas Personalizadas
                </h1>
                <p className="text-aqua-flow-200 mt-1 text-sm">
                  🔒 Tu orden está ANCLADO y guardado
                </p>
              </div>
              <button
                onClick={toggleLocked}
                className="inline-flex items-center gap-2 px-5 py-2 bg-velocity-green text-white rounded-lg font-bold hover:bg-velocity-green/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Unlock className="h-5 w-5" />
                Desanclar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <div className={`max-w-7xl mx-auto px-4 transition-all duration-300 ${isLocked ? 'pb-8' : 'py-8'}`}>
        
        {/* HEADER NO ANCLADO */}
        {!isLocked && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900">Cotizador Manual</h1>
                <p className="text-gray-600 mt-2">
                  🔓 Orden PERSONALIZABLE - Arrastra las tareas para reordenar
                </p>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={toggleLocked}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg bg-velocity-green text-white hover:bg-velocity-green/90`}
                >
                  <>
                    <Lock className="h-5 w-5" />
                    Anclar Orden
                  </>
                </button>

                <button
                  onClick={resetearOrden}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <RotateCcw className="h-5 w-5" />
                  Resetear
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-aqua-flow rounded-lg p-4">
              <p className="text-blue-900 font-medium">
                💡 <strong>Tip:</strong> Arrastra cualquier tarjeta para cambiar su posición. Una vez ordenadas, haz clic en <strong>"Anclar Orden"</strong> para guardar tu personalización.
              </p>
            </div>
          </div>
        )}

        {/* GRID DE TAREAS */}
        <div className={`transition-all duration-300 ${
          isLocked 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3' 
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        }`}>
          {tareas.map((tarea, index) => (
            <div
              key={tarea.id}
              draggable={!isLocked}
              onDragStart={(e) => handleDragStart(e, tarea.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tarea.id)}
              className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                isLocked
                  ? `bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-velocity-green/30 p-4 shadow-lg hover:shadow-xl hover:border-velocity-green cursor-default`
                  : `bg-white border-2 p-6 shadow-lg hover:shadow-xl hover:scale-105 hover:border-velocity-green cursor-move ${!isLocked ? 'border-transparent' : ''}`
              } ${
                draggedItem === tarea.id ? 'opacity-50 scale-95 border-velocity-green' : ''
              }`}
            >
              {/* NÚMERO DE ORDEN - SOLO ANCLADO */}
              {isLocked && (
                <div className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 bg-velocity-green text-white rounded-full text-xs font-bold">
                  {index + 1}
                </div>
              )}

              {/* Grip Icon */}
              {!isLocked && (
                <div className="absolute top-3 right-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Grip className="h-5 w-5" />
                </div>
              )}

              {/* Icon and Content */}
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${tarea.color} rounded-xl mb-3 text-white shadow-md`}>
                {getIcon(tarea.iconoKey)}
              </div>

              <h3 className={`font-bold mb-2 ${isLocked ? 'text-white text-base' : 'text-gray-900 text-lg'}`}>
                {tarea.nombre}
              </h3>
              
              <p className={`text-sm mb-3 line-clamp-2 ${isLocked ? 'text-aqua-flow-200' : 'text-gray-600'}`}>
                {tarea.descripcion}
              </p>

              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                isLocked 
                  ? 'bg-velocity-green/20 text-velocity-green' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {tarea.categoria}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Info - SOLO NO ANCLADO */}
        {!isLocked && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <p className="text-gray-700">
              <strong>Total de tareas:</strong> {tareas.length} | <strong>Estado:</strong> ⏳ PERSONALIZABLE
            </p>
          </div>
        )}

        {/* Footer Info - ANCLADO */}
        {isLocked && (
          <div className="mt-8 p-6 bg-deep-ocean rounded-lg shadow-lg border-l-4 border-velocity-green">
            <p className="text-aqua-flow-200 font-medium">
              ✅ <strong>Total de tareas:</strong> {tareas.length} | <strong>Estado:</strong> 🔒 ANCLADO Y PERSONALIZADO
            </p>
            <button
              onClick={resetearOrden}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg font-semibold hover:bg-red-500/30 transition-all duration-200"
            >
              <RotateCcw className="h-4 w-4" />
              Resetear a Orden Original
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
