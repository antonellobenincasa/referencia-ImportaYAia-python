import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalNavbar from '../components/PortalNavbar';
import { useAuth } from '../context/AuthContext';
import { 
  ChatWindow, 
  MessageInput, 
  CostSimulator, 
  geminiService 
} from '../features/aduana-experto-ia';
import type { Message, ViewMode } from '../features/aduana-experto-ia';

export default function AduanaExpertoIA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isRucApproved = Boolean(
    user?.ruc_status === 'approved' || 
    user?.ruc_approved === true
  );
  
  const hasCompletedQuote = Boolean(
    user?.has_approved_quote === true || 
    (typeof user?.quote_count === 'number' && user?.quote_count > 0) ||
    user?.has_quotes === true
  );

  const canAccess = isRucApproved && hasCompletedQuote;

  const handleSendMessage = useCallback(async (content: string, attachments: File[]) => {
    if (!content.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      attachments: attachments.map((file, i) => ({
        id: `attachment-${Date.now()}-${i}`,
        name: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : 'image',
      })),
    };

    setMessages(prev => [...prev, userMessage]);
    geminiService.addToHistory(userMessage);
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(content, attachments);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      geminiService.addToHistory(assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalNavbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-[#0A2540] mb-4">
              Acceso a AduanaExpertoIA
            </h2>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left max-w-lg mx-auto">
              <p className="text-gray-700 mb-4">
                Te recordamos que para acceder a nuestro asistente aduanero inteligente necesitas:
              </p>
              <div className="space-y-3">
                <div className={`flex items-start gap-3 ${isRucApproved ? 'text-green-600' : 'text-gray-500'}`}>
                  {isRucApproved ? (
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="font-medium">Tu RUC debe estar registrado, enlazado a tu usuario y aprobado por la APP</span>
                </div>
                <div className={`flex items-start gap-3 ${hasCompletedQuote ? 'text-green-600' : 'text-gray-500'}`}>
                  {hasCompletedQuote ? (
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="font-medium">Haber solicitado tu primera cotizacion via APP, aprobarla y enviar las Instrucciones de Embarque (RO generado)</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6 max-w-lg mx-auto">
              <p className="text-sm text-blue-800">
                Si ya cuentas con tu primer RO de la APP y no puedes visualizar o hacer uso de nuestro <strong>AduanaExpertoIA</strong>,{' '}
                <button 
                  onClick={() => window.open('mailto:soporte@importaya.ia?subject=Soporte%20AduanaExpertoIA', '_blank')}
                  className="text-[#00C9B7] hover:underline font-semibold"
                >
                  contactar al Administrador de la APP aqui
                </button>.
              </p>
            </div>
            
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto italic">
              Gracias y disfruta de la nueva Logistica de Carga Integral Inteligente con ImportaYA.ia
            </p>
            
            <button
              onClick={() => navigate('/portal/cotizar')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              Solicitar Cotizacion
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PortalNavbar />

      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-lg flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <h1 className="text-xl font-bold text-[#0A2540]">
                AduanaExperto<span className="text-[#00C9B7]">IA</span>
              </h1>
              <span className="px-2 py-0.5 bg-[#A4FF00] text-[#0A2540] text-xs font-bold rounded-full">
                24/7
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Chat Inteligente Aduanero + Simulador de Costos de Importacion
            </p>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'chat'
                  ? 'bg-[#0A2540] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline">Chat IA</span>
            </button>
            <button
              onClick={() => setViewMode('simulator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'simulator'
                  ? 'bg-[#0A2540] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Simulador</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {viewMode === 'chat' ? (
          <div className="flex-1 flex flex-col bg-white rounded-b-3xl shadow-sm border-x border-b border-gray-100 overflow-hidden">
            <ChatWindow messages={messages} isLoading={isLoading} />
            <MessageInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-b-3xl shadow-sm border-x border-b border-gray-100 overflow-hidden">
            <CostSimulator onBack={() => setViewMode('chat')} />
          </div>
        )}
      </div>

      <footer className="py-4 px-6 text-center">
        <p className="text-gray-400 text-xs">
          AduanaExpertoIA - Powered by ImportaYa.ia
        </p>
      </footer>
    </div>
  );
}
