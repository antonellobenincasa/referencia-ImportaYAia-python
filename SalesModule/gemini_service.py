"""
Gemini AI Service for ImportaYa.ia
Uses google-genai SDK with user's GEMINI_API_KEY
"""
import os
import json
import logging

logger = logging.getLogger(__name__)

GEMINI_AVAILABLE = False
client = None

try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        GEMINI_AVAILABLE = True
        logger.info("Gemini AI client initialized successfully")
    else:
        logger.warning("GEMINI_API_KEY not found, using fallback HS code classification")
except Exception as e:
    logger.error(f"Failed to initialize Gemini client: {e}")


HS_KEYWORD_MAPPING = {
    'laptop': ('8471.30.00', 85, 'Equipos de procesamiento de datos portatiles', 'Electronicos'),
    'computadora': ('8471.30.00', 85, 'Equipos de procesamiento de datos', 'Electronicos'),
    'telefono': ('8517.12.00', 90, 'Telefonos moviles', 'Electronicos'),
    'celular': ('8517.12.00', 90, 'Telefonos moviles', 'Electronicos'),
    'iphone': ('8517.12.00', 90, 'Telefonos moviles Apple', 'Electronicos'),
    'samsung': ('8517.12.00', 85, 'Telefonos moviles Samsung', 'Electronicos'),
    'ropa': ('6109.10.00', 75, 'Prendas de vestir de algodon', 'Textiles'),
    'camiseta': ('6109.10.00', 80, 'Camisetas de algodon', 'Textiles'),
    'zapato': ('6403.99.00', 70, 'Calzado con suela de caucho', 'Calzado'),
    'maquinaria': ('8479.89.00', 60, 'Maquinas y aparatos mecanicos', 'Maquinaria'),
    'repuesto': ('8708.99.00', 65, 'Partes y accesorios de vehiculos', 'Automotriz'),
    'auto': ('8708.99.00', 65, 'Partes de automoviles', 'Automotriz'),
    'quimico': ('3824.99.00', 55, 'Productos quimicos', 'Quimicos'),
    'plastico': ('3926.90.00', 70, 'Articulos de plastico', 'Plasticos'),
    'electronico': ('8543.70.00', 75, 'Aparatos electricos', 'Electronicos'),
    'juguete': ('9503.00.00', 80, 'Juguetes diversos', 'Juguetes'),
    'mueble': ('9403.60.00', 70, 'Muebles de madera', 'Muebles'),
    'cosmetico': ('3304.99.00', 75, 'Productos cosmeticos', 'Cosmeticos'),
    'medicina': ('3004.90.00', 70, 'Medicamentos', 'Farmaceuticos'),
    'alimento': ('2106.90.00', 65, 'Preparaciones alimenticias', 'Alimentos'),
}


def _fallback_hs_suggestion(product_description: str) -> dict:
    """Keyword-based fallback when Gemini is unavailable"""
    description = product_description.lower()
    
    for keyword, (hs_code, confidence, reasoning, category) in HS_KEYWORD_MAPPING.items():
        if keyword in description:
            return {
                'suggested_hs_code': hs_code,
                'confidence': confidence,
                'reasoning': f'Clasificacion basada en palabra clave "{keyword}": {reasoning}',
                'category': category,
                'notes': '',
                'ai_status': 'fallback_keyword'
            }
    
    return {
        'suggested_hs_code': '9999.00.00',
        'confidence': 30,
        'reasoning': 'No se encontro coincidencia automatica. Se requiere clasificacion manual.',
        'category': 'Sin clasificar',
        'notes': '',
        'ai_status': 'fallback_no_match'
    }


def suggest_hs_code(product_description: str, origin_country: str = "", fob_value: float = 0) -> dict:
    """
    Use Gemini AI to suggest an HS code for a product description.
    Falls back to keyword matching if Gemini is unavailable.
    Returns: dict with suggested_hs_code, confidence, reasoning
    """
    if not GEMINI_AVAILABLE or client is None:
        logger.info("Using fallback HS code suggestion (Gemini unavailable)")
        return _fallback_hs_suggestion(product_description)
    
    try:
        from google.genai import types
        
        system_prompt = """Eres un experto en clasificacion arancelaria del Sistema Armonizado (HS) para Ecuador y la SENAE.
Tu tarea es analizar la descripcion de un producto y sugerir el codigo HS mas apropiado.

Responde SOLO en formato JSON con esta estructura exacta:
{
    "hs_code": "XXXX.XX.XX",
    "confidence": 85,
    "reasoning": "Explicacion breve de por que este codigo es apropiado",
    "category": "Nombre de la categoria general",
    "notes": "Notas adicionales sobre impuestos especiales si aplican"
}

Reglas:
- El codigo HS debe tener formato XXXX.XX.XX (10 digitos con puntos)
- La confianza debe ser un numero entre 0 y 100
- Si no puedes determinar el codigo, usa 9999.00.00 con baja confianza
- Considera productos comunes de importacion a Ecuador desde China, USA, Europa"""

        user_prompt = f"""Producto: {product_description}
Pais de origen: {origin_country or 'No especificado'}
Valor FOB aproximado: ${fob_value:,.2f} USD

Por favor sugiere el codigo HS mas apropiado para este producto."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(role="user", parts=[types.Part(text=user_prompt)])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
            ),
        )

        raw_json = response.text
        logger.info(f"Gemini HS Code Response: {raw_json}")

        if raw_json:
            try:
                data = json.loads(raw_json)
            except json.JSONDecodeError:
                logger.warning(f"Gemini returned non-JSON response, using fallback")
                result = _fallback_hs_suggestion(product_description)
                result['ai_status'] = 'fallback_json_error'
                return result
            
            confidence_raw = data.get('confidence', 50)
            try:
                confidence = min(max(int(confidence_raw), 0), 100)
            except (ValueError, TypeError):
                confidence = 50
            
            return {
                'suggested_hs_code': str(data.get('hs_code', '9999.00.00') or '9999.00.00'),
                'confidence': confidence,
                'reasoning': str(data.get('reasoning', '') or 'Clasificacion por IA Gemini'),
                'category': str(data.get('category', '') or ''),
                'notes': str(data.get('notes', '') or ''),
                'ai_status': 'success'
            }
        else:
            raise ValueError("Empty response from Gemini")

    except Exception as e:
        logger.error(f"Gemini HS code suggestion failed: {e}")
        fallback = _fallback_hs_suggestion(product_description)
        fallback['ai_status'] = 'fallback_error'
        return fallback


def analyze_product_for_customs(product_description: str) -> dict:
    """
    Analyze a product description for customs-related information.
    Returns: dict with risk_level, special_requirements, ai_status, etc.
    """
    default_response = {
        'risk_level': 'medio',
        'requires_permits': False,
        'permit_types': [],
        'special_taxes': [],
        'documentation_needed': ['Factura comercial', 'Packing list', 'BL/AWB'],
        'customs_notes': 'Analisis automatico no disponible',
        'ai_status': 'fallback_unavailable'
    }
    
    if not GEMINI_AVAILABLE or client is None:
        return default_response
    
    try:
        from google.genai import types
        
        system_prompt = """Eres un experto en aduanas de Ecuador (SENAE).
Analiza la descripcion del producto y proporciona informacion relevante para importacion.

Responde SOLO en formato JSON:
{
    "risk_level": "bajo|medio|alto",
    "requires_permits": true/false,
    "permit_types": ["lista de permisos necesarios si aplica"],
    "special_taxes": ["ICE", "salvaguardia", etc si aplican],
    "documentation_needed": ["lista de documentos adicionales"],
    "customs_notes": "Notas importantes para el agente aduanal"
}"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(role="user", parts=[types.Part(text=f"Producto a importar: {product_description}")])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
            ),
        )

        if response.text:
            try:
                data = json.loads(response.text)
                data['ai_status'] = 'success'
                return data
            except json.JSONDecodeError:
                default_response['ai_status'] = 'fallback_json_error'
                return default_response
        default_response['ai_status'] = 'fallback_empty_response'
        return default_response

    except Exception as e:
        logger.error(f"Gemini customs analysis failed: {e}")
        default_response['ai_status'] = 'fallback_error'
        return default_response
