import { useState, useEffect } from 'react';
import { Grip, Lock, Unlock, RotateCcw } from 'lucide-react';
import {
  Briefcase, FileText, Settings, Plus, Eye, Zap, Clock, TrendingUp, BookOpen,
  Users, Rocket, FileCheck
} from 'lucide-react';

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
  categoria: string;
}

export default function CotizadorManual() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Tareas por defecto
  const tareasDefault: Tarea[] = [
    {
      id: '1',
      nombre: 'Prospectos',
      descripcion: 'Gestión de leads y calificación',
      icono: <Briefcase className="h-8 w-8" />,
      color: 'from-blue-500 to-cyan-600',
      categoria: 'Prospección'
    },
    {
      id: '2',
      nombre: 'Plantillas',
      descripcion: 'Cotizaciones según incoterms',
      icono: <FileText className="h-8 w-8" />,
      color: 'from-green-500 to-emerald-600',
      categoria: 'Documentación'
    },
    {
      id: '3',
      nombre: 'Administrar Cotizaciones',
      descripcion: 'Seguimiento de todas las cotizaciones',
      icono: <Settings className="h-8 w-8" />,
      color: 'from-purple-500 to-pink-600',
      categoria: 'Cotizaciones'
    },
    {
      id: '4',
      nombre: 'Nueva Cotización',
      descripcion: 'Crear cotización manual rápidamente',
      icono: <Plus className="h-8 w-8" />,
      color: 'from-orange-500 to-red-600',
      categoria: 'Cotizaciones'
    },
    {
      id: '5',
      nombre: 'Consulta Ofertas',
      descripcion: 'Ver y modificar ofertas',
      icono: <Eye className="h-8 w-8" />,
      color: 'from-indigo-500 to-blue-600',
      categoria: 'Ofertas'
    },
    {
      id: '6',
      nombre: 'Ofertas Masivas',
      descripcion: 'Envío masivo de propuestas',
      icono: <Zap className="h-8 w-8" />,
      color: 'from-yellow-500 to-orange-600',
      categoria: 'Ofertas'
    },
    {
      id: '7',
      nombre: 'Consulta Tarifas',
      descripcion: 'Acceso a estructura de precios',
      icono: <Clock className="h-8 w-8" />,
      color: 'from-red-500 to-pink-600',
      categoria: 'Tarifas'
    },
    {
      id: '8',
      nombre: 'Asignación de Embarques',
      descripcion: 'Asignar cotización a RO',
      icono: <TrendingUp className="h-8 w-8" />,
      color: 'from-cyan-500 to-blue-600',
      categoria: 'Logística'
    },
    {
      id: '9',
      nombre: 'Consulta Tarifas Históricas',
      descripcion: 'Análisis de evolución de precios',
      icono: <BookOpen className="h-8 w-8" />,
      color: 'from-teal-500 to-green-600',
      categoria: 'Análisis'
    },
    {
      id: '10',
      nombre: 'Crear Grupos Personas',
      descripcion: 'Segmentación y roles',
      icono: <Users className="h-8 w-8" />,
      color: 'from-violet-500 to-purple-600',
      categoria: 'Gestión'
    },
    {
      id: '11',
      nombre: 'Consultar Prospectos',
      descripcion: 'Base de datos de leads',
      icono: <Rocket className="h-8 w-8" />,
      color: 'from-emerald-500 to-teal-600',
      categoria: 'Base de Datos'
    },
    {
      id: '12',
      nombre: 'Instrucción de Embarque',
      descripcion: 'Shipping instructions automatizadas',
      icono: <FileCheck className="h-8 w-8" />,
      color: 'from-sky-500 to-cyan-600',
      categoria: 'Documentos'
    }
  ];

  // Cargar tareas desde localStorage
  useEffect(() => {
    const savedTareas = localStorage.getItem('cotizadorTareas');
    const savedLocked = localStorage.getItem('cotizadorLocked');

    if (savedTareas) {
      try {
        setTareas(JSON.parse(savedTareas));
      } catch {
        setTareas(tareasDefault);
      }
    } else {
      setTareas(tareasDefault);
    }

    setIsLocked(savedLocked === 'true');
  }, []);

  // Guardar tareas cuando cambian (si están ancladas)
  const guardarTareas = (nuevoOrden: Tarea[]) => {
    setTareas(nuevoOrden);
    if (isLocked) {
      localStorage.setItem('cotizadorTareas', JSON.stringify(nuevoOrden));
    }
  };

  // Toggle Anclar/Desanclar
  const toggleLocked = () => {
    const nuevoEstado = !isLocked;
    setIsLocked(nuevoEstado);
    
    if (nuevoEstado) {
      localStorage.setItem('cotizadorLocked', 'true');
      localStorage.setItem('cotizadorTareas', JSON.stringify(tareas));
    } else {
      localStorage.setItem('cotizadorLocked', 'false');
    }
  };

  // Resetear al orden por defecto
  const resetearOrden = () => {
    setTareas(tareasDefault);
    localStorage.removeItem('cotizadorTareas');
    localStorage.removeItem('cotizadorLocked');
    setIsLocked(false);
  };

  // Manejar drag start
  const handleDragStart = (id: string) => {
    if (isLocked) return;
    setDraggedId(id);
  };

  // Manejar drag over
  const handleDragOver = (id: string) => {
    if (isLocked || !draggedId) return;
    setDragOverId(id);
  };

  // Manejar drop
  const handleDrop = (targetId: string) => {
    if (isLocked || !draggedId) return;

    const draggedIndex = tareas.findIndex(t => t.id === draggedId);
    const targetIndex = tareas.findIndex(t => t.id === targetId);

    if (draggedIndex !== targetIndex) {
      const nuevoOrden = [...tareas];
      [nuevoOrden[draggedIndex], nuevoOrden[targetIndex]] = [
        nuevoOrden[targetIndex],
        nuevoOrden[draggedIndex]
      ];
      guardarTareas(nuevoOrden);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  // Manejar drag end
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header con controles */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">Cotizador Manual</h1>
              <p className="text-gray-600 mt-2">
                {isLocked ? '🔒 Orden ANCLADO - No se puede modificar' : '🔓 Orden PERSONALIZABLE - Arrastra las tareas para reordenar'}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={toggleLocked}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg ${
                  isLocked
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-velocity-green text-white hover:bg-velocity-green/90'
                }`}
              >
                {isLocked ? (
                  <>
                    <Unlock className="h-5 w-5" />
                    Desanclar Orden
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Anclar Orden
                  </>
                )}
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

          {!isLocked && (
            <div className="bg-blue-50 border-l-4 border-aqua-flow rounded-lg p-4">
              <p className="text-blue-900 font-medium">
                💡 <strong>Tip:</strong> Arrastra cualquier tarea para cambiar su posición. Una vez ordenadas, haz clic en <strong>"Anclar Orden"</strong> para guardar tu personalización.
              </p>
            </div>
          )}
        </div>

        {/* Grid de Tareas Arrastrable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tareas.map((tarea) => (
            <div
              key={tarea.id}
              draggable={!isLocked}
              onDragStart={() => handleDragStart(tarea.id)}
              onDragOver={() => handleDragOver(tarea.id)}
              onDrop={() => handleDrop(tarea.id)}
              onDragEnd={handleDragEnd}
              className={`group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-move border-2 border-transparent ${
                draggedId === tarea.id
                  ? 'opacity-50 border-velocity-green scale-95'
                  : dragOverId === tarea.id
                  ? 'border-dashed border-velocity-green bg-velocity-green/5 scale-105'
                  : isLocked
                  ? 'cursor-default'
                  : 'hover:scale-105 hover:border-velocity-green/50'
              } ${
                isLocked ? 'opacity-100' : ''
              }`}
            >
              {/* Indicador de arrastre */}
              {!isLocked && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Grip className="h-5 w-5 text-gray-400" />
                </div>
              )}

              {/* Ícono y Contenido */}
              <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${tarea.color} rounded-xl mb-4 text-white shadow-md`}>
                {tarea.icono}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{tarea.nombre}</h3>
              <p className="text-gray-600 text-sm mb-4">{tarea.descripcion}</p>

              {/* Categoría */}
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                {tarea.categoria}
              </span>
            </div>
          ))}
        </div>

        {/* Indicador de tareas */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <p className="text-gray-700">
            <strong>Total de tareas:</strong> {tareas.length} | <strong>Estado:</strong> {isLocked ? '✅ ANCLADO' : '⏳ PERSONALIZABLE'}
          </p>
        </div>
      </div>
    </div>
  );
}
