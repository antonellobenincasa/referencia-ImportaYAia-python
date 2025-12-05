import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export default function AuthLayout({ children, title, subtitle, icon }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">IntegralCargoSolutions</span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="relative">
              <div className="absolute -left-4 top-0 w-1 h-full bg-lime-400 rounded-full"></div>
              <h2 className="text-4xl font-bold text-white leading-tight">
                Servicio logístico integral,<br />
                <span className="text-lime-400">que impulsa tu negocio!</span>
              </h2>
            </div>
            
            <p className="text-white/80 text-lg max-w-md">
              Plataforma de hiperautomatización de ventas y marketing para logística de carga internacional en Ecuador.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-white/70 text-sm">Automatizado</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-white/70 text-sm">Disponible</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-lime-400">EC</div>
                <div className="text-white/70 text-sm">Ecuador</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-white/60 text-sm">
            <span>Aéreo</span>
            <span className="w-1 h-1 bg-white/40 rounded-full"></span>
            <span>Marítimo LCL</span>
            <span className="w-1 h-1 bg-white/40 rounded-full"></span>
            <span>Marítimo FCL</span>
            <span className="w-1 h-1 bg-white/40 rounded-full"></span>
            <span>Terrestre</span>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-lime-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-teal-400/30 rounded-full blur-2xl"></div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 lg:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">IntegralCargoSolutions</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
            <div className="text-center mb-8">
              {icon && (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 mb-4 shadow-lg shadow-teal-500/30">
                  {icon}
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-500 mt-2">{subtitle}</p>
            </div>

            {children}
          </div>

          <p className="text-center mt-6 text-sm text-gray-400 lg:hidden">
            Servicio logístico integral, que impulsa tu negocio!
          </p>
        </div>
      </div>
    </div>
  );
}
