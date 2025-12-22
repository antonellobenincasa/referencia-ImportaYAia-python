import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  hasImage?: boolean;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: 'Hola! Soy tu asistente de IA especializado en logistica internacional y aduanas de Ecuador. Puedo ayudarte con:\n\n- Consultas sobre aranceles y regulaciones SENAE\n- Analisis de documentos (facturas, B/L, AWB)\n- Procesos de importacion\n- Calculos de tributos\n\nEscribe tu pregunta o adjunta un documento para comenzar.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; type: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es muy grande. Maximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedImage({
        data: base64,
        type: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input || 'Analizar documento adjunto',
      hasImage: !!selectedImage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('ics_access_token');
      const response = await fetch('/api/sales/ai-assistant/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input || 'Analiza este documento y extrae la informacion relevante para importacion a Ecuador.',
          image_data: selectedImage?.data || null,
          image_mime_type: selectedImage?.type || null,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response || 'No se pudo procesar la solicitud.',
        mode: data.mode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Error de conexion. Por favor intenta nuevamente.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isAuthenticated = !!user;
  
  const isRucApproved = Boolean(
    user?.ruc_status === 'approved' || 
    user?.ruc_approved === true
  );
  
  const hasCompletedQuote = Boolean(
    user?.has_approved_quote === true || 
    (typeof user?.quote_count === 'number' && user?.quote_count > 0) ||
    user?.has_quotes === true
  );
  
  const canAccessAssistant = isAuthenticated && isRucApproved && hasCompletedQuote;
  
  if (!canAccessAssistant) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        title="Asistente IA"
      >
        {isOpen ? (
          <svg className="w-7 h-7 text-[#0A2540]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-8 h-8 text-[#0A2540]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#0A2540] rounded-full animate-pulse"></span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-[#0A2540] to-[#1a3f5c] text-white p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
                <span className="text-[#0A2540] font-black text-sm">IA</span>
              </div>
              <div>
                <h3 className="font-bold">Asistente ImportaYa.ia</h3>
                <p className="text-xs text-gray-300">Especialista en Aduanas Ecuador</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#00C9B7] to-[#00a99d] text-white'
                      : 'bg-white shadow-md border border-gray-100'
                  }`}
                >
                  {msg.hasImage && (
                    <div className="flex items-center gap-1 text-xs mb-2 opacity-80">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Documento adjunto
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  {msg.mode && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        msg.mode === 'document_analysis' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {msg.mode === 'document_analysis' ? 'Analisis de Documento' : 'Consulta'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white shadow-md border border-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00C9B7] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#00C9B7] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#00C9B7] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-sm text-gray-500 ml-2">Analizando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectedImage && (
            <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-[#00C9B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate max-w-[200px]">{selectedImage.name}</span>
                </div>
                <button
                  onClick={removeImage}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-[#00C9B7] hover:bg-gray-100 rounded-lg transition-colors"
                title="Adjuntar documento"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9B7] focus:border-transparent max-h-24"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="p-2 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
