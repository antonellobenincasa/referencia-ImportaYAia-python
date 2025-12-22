import type { Message, HSCodeResult } from './types';
import { SYSTEM_INSTRUCTION, COMMON_HS_CODES } from './constants';

const API_BASE = '/api/ai';

export class GeminiService {
  private conversationHistory: Message[] = [];

  async sendMessage(content: string, attachments?: File[]): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('message', content);
      formData.append('system_instruction', SYSTEM_INSTRUCTION);
      formData.append('conversation_history', JSON.stringify(
        this.conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        }))
      ));

      if (attachments && attachments.length > 0) {
        attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      }

      const token = localStorage.getItem('ics_access_token');
      const response = await fetch(`${API_BASE}/aduana-chat/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con el asistente IA');
      }

      const data = await response.json();
      return data.response || data.message || 'No se recibió respuesta del asistente.';
    } catch (error) {
      console.error('Gemini service error:', error);
      return this.getFallbackResponse(content);
    }
  }

  private getFallbackResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('iva') || lowerQuery.includes('impuesto')) {
      return `**Impuestos de Importación en Ecuador**

Los principales tributos aduaneros son:

1. **Ad-Valorem**: Varía según la partida arancelaria (0% a 45%)
2. **FODINFA**: 0.5% sobre el valor CIF
3. **IVA**: 15% sobre (CIF + Ad-Valorem + FODINFA + ICE)
4. **ICE**: Solo para productos específicos (bebidas alcohólicas, vehículos, etc.)
5. **ISD**: 5% sobre pagos al exterior

¿Necesitas calcular los tributos para un producto específico?`;
    }

    if (lowerQuery.includes('incoterm') || lowerQuery.includes('fob') || lowerQuery.includes('cif')) {
      return `**Incoterms más usados en importación a Ecuador**

- **FOB (Free On Board)**: El vendedor entrega en el puerto de origen. El comprador paga flete y seguro.
- **CIF (Cost, Insurance, Freight)**: El vendedor incluye flete y seguro hasta el puerto de destino.
- **EXW (Ex Works)**: El comprador asume todos los costos desde la fábrica del vendedor.
- **DDP (Delivered Duty Paid)**: El vendedor entrega con todos los tributos pagados.

¿Qué Incoterm te interesa conocer en detalle?`;
    }

    if (lowerQuery.includes('clasificar') || lowerQuery.includes('partida') || lowerQuery.includes('hs code')) {
      return `**Clasificación Arancelaria**

Para clasificar tu producto necesito conocer:
1. Descripción detallada del producto
2. Material de fabricación
3. Uso o función principal
4. Si es nuevo o usado

Ejemplos de partidas comunes:
- 8471.30: Computadoras portátiles (0% Ad-Valorem)
- 8517.12: Teléfonos celulares (0% Ad-Valorem)
- 6403.99: Calzado (30% Ad-Valorem)

¿Qué producto deseas clasificar?`;
    }

    return `Soy **AduanaExpertoIA**, tu asistente especializado en comercio exterior y aduanas de Ecuador.

Puedo ayudarte con:
- 📦 Clasificación arancelaria de productos
- 💰 Cálculo de tributos de importación
- 📋 Información sobre Incoterms
- 🚢 Costos de importación estimados
- 📄 Requisitos y documentos necesarios

¿En qué puedo asistirte hoy?`;
  }

  async classifyProduct(description: string): Promise<HSCodeResult | null> {
    const lowerDesc = description.toLowerCase();
    
    for (const code of COMMON_HS_CODES) {
      const keywords = code.description.toLowerCase().split(' ');
      const matches = keywords.filter(kw => kw.length > 3 && lowerDesc.includes(kw));
      if (matches.length >= 2) {
        return {
          code: code.code,
          description: code.description,
          adValoremRate: code.adValorem,
          iceRate: code.ice,
          unit: 'kg',
        };
      }
    }

    try {
      const token = localStorage.getItem('ics_access_token');
      const response = await fetch(`${API_BASE}/classify-product/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.classification || null;
      }
    } catch (error) {
      console.error('Classification error:', error);
    }

    return null;
  }

  addToHistory(message: Message) {
    this.conversationHistory.push(message);
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory(): Message[] {
    return [...this.conversationHistory];
  }
}

export const geminiService = new GeminiService();
