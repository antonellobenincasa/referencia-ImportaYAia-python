import { useState } from 'react';
import { Phone, FileText, Mail, Users, Target, Rocket, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface Actividad {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

const actividades: Actividad[] = [
  {
    id: 'llamadas',
    nombre: 'Llamadas de Prospección',
    descripcion: 'Contactar nuevos prospectos por teléfono',
    icono: <Phone className="h-8 w-8" />,
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'seguimiento',
    nombre: 'Seguimiento de Cotizaciones',
    descripcion: 'Dar seguimiento a cotizaciones enviadas',
    icono: <FileText className="h-8 w-8" />,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'emails',
    nombre: 'Envío de Emails',
    descripcion: 'Campañas de email marketing',
    icono: <Mail className="h-8 w-8" />,
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'reuniones',
    nombre: 'Reuniones con Clientes',
    descripcion: 'Presentaciones y cierres de ventas',
    icono: <Users className="h-8 w-8" />,
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'prospeccion',
    nombre: 'Prospección Digital',
    descripcion: 'Búsqueda de leads en redes sociales',
    icono: <Target className="h-8 w-8" />,
    color: 'from-cyan-500 to-blue-600'
  }
];

export default function FollowUpGestionComercial() {
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const [mostrarMensaje, setMostrarMensaje] = useState(false);

  const seleccionarActividad = (actividad: Actividad) => {
    setActividadSeleccionada(actividad);
    setMostrarMensaje(true);
  };

  const reiniciar = () => {
    setActividadSeleccionada(null);
    setMostrarMensaje(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {!mostrarMensaje ? (
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-6 shadow-lg shadow-blue-500/30">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-4">
              Follow Up - Gestión Comercial
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              ¿Qué actividad comercial deseas ejecutar?
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Selecciona una tarea para potenciar tu gestión de ventas
            </p>
          </div>

          {/* Grid de Actividades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actividades.map((actividad) => (
              <button
                key={actividad.id}
                onClick={() => seleccionarActividad(actividad)}
                className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-left hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 h-full flex flex-col"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${actividad.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${actividad.color} rounded-xl mb-6 text-white shadow-lg`}>
                  {actividad.icono}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                  {actividad.nombre}
                </h3>
                
                <p className="text-slate-400 text-base mb-6 flex-grow">
                  {actividad.descripcion}
                </p>

                <div className="inline-flex items-center text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Comenzar</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Mensaje Motivacional */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-400/10 to-transparent rounded-3xl blur-3xl" />
            
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 md:p-12 shadow-2xl">
              {/* Icono de éxito */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full shadow-lg">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Actividad seleccionada */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full mb-4">
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-400 font-semibold">Actividad Seleccionada</span>
                </div>
                <h2 className={`text-2xl md:text-3xl font-extrabold bg-gradient-to-r ${actividadSeleccionada?.color} bg-clip-text text-transparent`}>
                  {actividadSeleccionada?.nombre}
                </h2>
              </div>

              {/* Mensaje motivacional */}
              <div className="space-y-6 text-center">
                <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                  Excelente elección.
                </p>
                
                <p className="text-lg text-slate-300 leading-relaxed">
                  Al iniciar <span className="text-blue-300 font-bold">{actividadSeleccionada?.nombre}</span>, recuerda:
                </p>

                <blockquote className="relative">
                  <div className="absolute -left-4 top-0 text-6xl text-blue-500/20 font-serif">"</div>
                  <p className="text-xl md:text-2xl text-cyan-300 font-medium italic leading-relaxed pl-8">
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
                  <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    ¡Sal ahí afuera y haz que suceda!
                  </p>
                </div>
              </div>

              {/* Botón para volver */}
              <div className="mt-10 flex justify-center">
                <button
                  onClick={reiniciar}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-500/90 hover:to-cyan-600/90 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                >
                  <Rocket className="h-5 w-5" />
                  Elegir Otra Actividad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Zap } from 'lucide-react';
