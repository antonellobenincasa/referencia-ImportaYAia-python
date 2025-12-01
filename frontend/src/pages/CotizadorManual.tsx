import { useState } from 'react';
import { Rocket, Users, FileText, RefreshCw, Gift, Send, DollarSign, Truck, TrendingUp, Users2, Search, Paperclip, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
  categoria: string;
}

const tareas: Tarea[] = [
  {
    id: 'prospectos',
    nombre: 'PROSPECTOS',
    descripcion: 'Gestión de leads, seguimiento y calificación',
    icono: <Users className="h-8 w-8" />,
    color: 'from-emerald-500 to-teal-600',
    categoria: 'Prospección'
  },
  {
    id: 'plantillas',
    nombre: 'PLANTILLAS',
    descripcion: 'Plantillas de cotizaciones según incoterms',
    icono: <FileText className="h-8 w-8" />,
    color: 'from-blue-500 to-indigo-600',
    categoria: 'Documentación'
  },
  {
    id: 'administrar-cotizaciones',
    nombre: 'ADMINISTRAR COTIZACIONES',
    descripcion: 'Seguimiento y gestión de todas las cotizaciones',
    icono: <RefreshCw className="h-8 w-8" />,
    color: 'from-purple-500 to-pink-600',
    categoria: 'Cotizaciones'
  },
  {
    id: 'nueva-cotizacion',
    nombre: 'NUEVA COTIZACION',
    descripcion: 'Crear cotización manual rápidamente',
    icono: <FileText className="h-8 w-8" />,
    color: 'from-orange-500 to-red-600',
    categoria: 'Cotizaciones'
  },
  {
    id: 'consulta-ofertas',
    nombre: 'CONSULTA OFERTAS',
    descripcion: 'Ver, modificar, duplicar y clonar ofertas',
    icono: <Gift className="h-8 w-8" />,
    color: 'from-cyan-500 to-blue-600',
    categoria: 'Ofertas'
  },
  {
    id: 'ofertas-masivas',
    nombre: 'OFERTAS MASIVAS',
    descripcion: 'Envío de propuestas a múltiples prospectos',
    icono: <Send className="h-8 w-8" />,
    color: 'from-rose-500 to-pink-600',
    categoria: 'Estrategia Masiva'
  },
  {
    id: 'consulta-tarifas',
    nombre: 'CONSULTA TARIFAS',
    descripcion: 'Acceso a estructura de precios y costes',
    icono: <DollarSign className="h-8 w-8" />,
    color: 'from-amber-500 to-orange-600',
    categoria: 'Precios'
  },
  {
    id: 'asignacion-embarques',
    nombre: 'ASIGNACIÓN DE EMBARQUES',
    descripcion: 'Asignar cotización a un RO (Routing Order)',
    icono: <Truck className="h-8 w-8" />,
    color: 'from-green-500 to-emerald-600',
    categoria: 'Logística y Operaciones'
  },
  {
    id: 'tarifas-historicas',
    nombre: 'CONSULTA TARIFAS HISTÓRICAS',
    descripcion: 'Análisis de evolución de precios',
    icono: <TrendingUp className="h-8 w-8" />,
    color: 'from-indigo-500 to-purple-600',
    categoria: 'Precios y Finanzas'
  },
  {
    id: 'crear-grupos',
    nombre: 'CREAR GRUPOS PERSONAS',
    descripcion: 'Segmentación y gestión de roles',
    icono: <Users2 className="h-8 w-8" />,
    color: 'from-violet-500 to-purple-600',
    categoria: 'Gestión de Usuarios'
  },
  {
    id: 'consultar-prospectos',
    nombre: 'CONSULTAR PROSPECTOS',
    descripcion: 'Base de datos de leads en distintas etapas',
    icono: <Search className="h-8 w-8" />,
    color: 'from-fuchsia-500 to-pink-600',
    categoria: 'Prospección y CRM'
  },
  {
    id: 'instruccion-embarque',
    nombre: 'INSTRUCCIÓN DE EMBARQUE',
    descripcion: 'Shipping instructions con envío automatizado',
    icono: <Paperclip className="h-8 w-8" />,
    color: 'from-lime-500 to-green-600',
    categoria: 'Documentación y Aduanas'
  }
];

export default function CotizadorManual() {
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [mostrarMensaje, setMostrarMensaje] = useState(false);

  const seleccionarTarea = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setMostrarMensaje(true);
  };

  const reiniciar = () => {
    setTareaSeleccionada(null);
    setMostrarMensaje(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {!mostrarMensaje ? (
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-velocity-green to-aqua-flow rounded-full mb-6 shadow-lg shadow-velocity-green/30">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-4">
              Cotizador Manual
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              ¿Qué tarea deseas realizar hoy?
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Selecciona una actividad para comenzar tu jornada de ventas
            </p>
          </div>

          {/* Grid de Tareas - 4 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tareas.map((tarea) => (
              <button
                key={tarea.id}
                onClick={() => seleccionarTarea(tarea)}
                className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 text-left hover:border-velocity-green/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-velocity-green/10 h-full flex flex-col"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tarea.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${tarea.color} rounded-lg mb-3 text-white shadow-lg flex-shrink-0`}>
                  {tarea.icono}
                </div>
                
                <h3 className="text-sm font-bold text-white mb-1 group-hover:text-velocity-green transition-colors line-clamp-2">
                  {tarea.nombre}
                </h3>
                
                <p className="text-slate-400 text-xs mb-3 flex-grow">
                  {tarea.descripcion}
                </p>

                <div className="inline-flex items-center gap-1 text-velocity-green opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium">Iniciar</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Mensaje Motivacional */}
          <div className="relative">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-velocity-green/20 via-aqua-flow/10 to-transparent rounded-3xl blur-3xl" />
            
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-velocity-green/30 rounded-3xl p-8 md:p-12 shadow-2xl">
              {/* Icono de éxito */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-velocity-green/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-velocity-green to-emerald-600 rounded-full shadow-lg">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Tarea seleccionada */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-velocity-green/20 border border-velocity-green/30 rounded-full mb-4">
                  <CheckCircle2 className="h-5 w-5 text-velocity-green" />
                  <span className="text-velocity-green font-semibold">Tarea Seleccionada</span>
                </div>
                <h2 className={`text-2xl md:text-3xl font-extrabold bg-gradient-to-r ${tareaSeleccionada?.color} bg-clip-text text-transparent`}>
                  {tareaSeleccionada?.nombre}
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  {tareaSeleccionada?.categoria}
                </p>
              </div>

              {/* Mensaje motivacional */}
              <div className="space-y-6 text-center">
                <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                  Excelente elección.
                </p>
                
                <p className="text-lg text-slate-300 leading-relaxed">
                  Al iniciar <span className="text-velocity-green font-bold">{tareaSeleccionada?.nombre}</span>, recuerda:
                </p>

                <blockquote className="relative">
                  <div className="absolute -left-4 top-0 text-6xl text-velocity-green/20 font-serif">"</div>
                  <p className="text-xl md:text-2xl text-aqua-flow font-medium italic leading-relaxed pl-8">
                    Tú no persigues clientes, tú ofreces soluciones que ellos necesitan desesperadamente.
                  </p>
                </blockquote>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                  <p className="text-slate-300 leading-relaxed text-lg">
                    Antes de empezar, <span className="text-white font-semibold">respira profundo</span> y visualiza el resultado final: ese momento exacto en que el cliente te da las gracias por haberlo llamado.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 my-8">
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-400 font-bold text-lg">Tu voz</p>
                    <p className="text-slate-400">tiene autoridad</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-400 font-bold text-lg">Tu mente</p>
                    <p className="text-slate-400">está afilada</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4">
                    <p className="text-purple-400 font-bold text-lg">Tu energía</p>
                    <p className="text-slate-400">es contagiosa</p>
                  </div>
                </div>

                <p className="text-xl text-white font-semibold">
                  Tienes la herramienta, tienes el talento y el mercado te está esperando.
                </p>

                <div className="pt-6">
                  <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-velocity-green via-aqua-flow to-emerald-400 bg-clip-text text-transparent">
                    ¡Sal ahí afuera y haz que suceda!
                  </p>
                </div>
              </div>

              {/* Botón para volver */}
              <div className="mt-10 flex justify-center">
                <button
                  onClick={reiniciar}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-velocity-green to-emerald-600 text-white font-bold rounded-xl hover:from-velocity-green/90 hover:to-emerald-600/90 transition-all duration-300 shadow-lg shadow-velocity-green/30 hover:shadow-velocity-green/50 hover:scale-105"
                >
                  <Rocket className="h-5 w-5" />
                  Elegir Otra Tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
