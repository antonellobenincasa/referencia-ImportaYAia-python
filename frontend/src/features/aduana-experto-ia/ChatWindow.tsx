import { useEffect, useRef } from 'react';
import type { Message } from './types';
import ReactMarkdown from 'react-markdown';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-2xl flex items-center justify-center mb-4">
            <span className="text-4xl">🤖</span>
          </div>
          <h3 className="text-xl font-bold text-[#0A2540] mb-2">
            Bienvenido a AduanaExpertoIA
          </h3>
          <p className="text-gray-500 max-w-md mb-6">
            Soy tu asistente especializado en comercio exterior y aduanas de Ecuador. 
            Puedo ayudarte con clasificación arancelaria, cálculo de tributos y más.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              '¿Cómo calculo los tributos de importación?',
              '¿Qué es el Incoterm FOB?',
              'Clasificar producto electrónico',
            ].map((suggestion) => (
              <button
                key={suggestion}
                className="px-4 py-2 bg-white border border-[#00C9B7] text-[#00C9B7] rounded-xl text-sm hover:bg-[#00C9B7]/10 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
              message.role === 'user'
                ? 'bg-[#0A2540] text-white'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                <div className="w-6 h-6 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-lg flex items-center justify-center">
                  <span className="text-xs">🤖</span>
                </div>
                <span className="text-xs font-medium text-[#00C9B7]">AduanaExpertoIA</span>
              </div>
            )}
            
            {message.role === 'assistant' ? (
              <div className="prose prose-sm max-w-none prose-headings:text-[#0A2540] prose-strong:text-[#0A2540] prose-a:text-[#00C9B7]">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200/30 space-y-1">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={`flex items-center gap-2 text-xs ${
                      message.role === 'user' ? 'text-white/80' : 'text-gray-500'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span>{attachment.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
              {formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-xs">🤖</span>
              </div>
              <span className="text-xs font-medium text-[#00C9B7]">AduanaExpertoIA</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#00C9B7] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-[#00C9B7] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-[#00C9B7] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-sm text-gray-500">Analizando...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
