"""
Gemini AI Service for ImportaYa.ia
Uses google-genai SDK with user's GEMINI_API_KEY
"""
import os
import json
import logging

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


def suggest_hs_code(product_description: str, origin_country: str = "", fob_value: float = 0) -> dict:
    """
    Use Gemini AI to suggest an HS code for a product description.
    Returns: dict with suggested_hs_code, confidence, reasoning
    """
    try:
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
            data = json.loads(raw_json)
            return {
                'suggested_hs_code': data.get('hs_code', '9999.00.00'),
                'confidence': min(max(int(data.get('confidence', 50)), 0), 100),
                'reasoning': data.get('reasoning', 'Clasificacion por IA'),
                'category': data.get('category', ''),
                'notes': data.get('notes', '')
            }
        else:
            raise ValueError("Empty response from Gemini")

    except Exception as e:
        logger.error(f"Gemini HS code suggestion failed: {e}")
        return {
            'suggested_hs_code': '9999.00.00',
            'confidence': 30,
            'reasoning': f'Clasificacion automatica no disponible. Error: {str(e)[:100]}',
            'category': 'Sin clasificar',
            'notes': 'Se requiere clasificacion manual'
        }


def analyze_product_for_customs(product_description: str) -> dict:
    """
    Analyze a product description for customs-related information.
    Returns: dict with risk_level, special_requirements, etc.
    """
    try:
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
            return json.loads(response.text)
        return {}

    except Exception as e:
        logger.error(f"Gemini customs analysis failed: {e}")
        return {
            'risk_level': 'medio',
            'requires_permits': False,
            'permit_types': [],
            'special_taxes': [],
            'documentation_needed': ['Factura comercial', 'Packing list', 'BL/AWB'],
            'customs_notes': 'Analisis automatico no disponible'
        }
