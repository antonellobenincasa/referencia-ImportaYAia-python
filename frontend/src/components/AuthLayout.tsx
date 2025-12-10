import React from 'react';
import PublicNav from './PublicNav';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export default function AuthLayout({ children, title, subtitle, icon }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav variant="light" />
      <div className="flex-1 flex pt-16">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#0A2540]/90 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
                <span className="text-[#0A2540] font-black text-lg">IA</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="relative">
              <div className="absolute -left-4 top-0 w-1 h-full bg-[#A4FF00] rounded-full"></div>
              <h2 className="text-4xl font-bold text-white leading-tight">
                La logística de carga integral,<br />
                <span className="text-[#00C9B7]">ahora es Inteligente!</span>
              </h2>
            </div>
            
            <p className="text-white/80 text-lg max-w-md">
              Plataforma inteligente de logística internacional para importar desde cualquier parte del mundo hacia Ecuador.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-white/70 text-sm">Inteligente</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-white/70 text-sm">Disponible</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-[#A4FF00]">EC</div>
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

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00C9B7]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-[#A4FF00]/10 rounded-full blur-2xl"></div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
            <div className="text-center mb-8">
              {icon && (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] mb-4 shadow-lg shadow-[#00C9B7]/30">
                  {icon}
                </div>
              )}
              <h1 className="text-2xl font-bold text-[#0A2540]">{title}</h1>
              <p className="text-gray-500 mt-2">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
