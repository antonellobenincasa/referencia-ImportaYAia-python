"""
Gemini AI Service for ImportaYa.ia
Uses google-genai SDK with user's GEMINI_API_KEY
Enhanced with SENAE Ecuador 2025 regulations knowledge
"""
import os
import json
import logging
from decimal import Decimal

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


SENAE_TRIBUTOS_2025 = {
    'iva_rate': Decimal('0.15'),
    'fodinfa_rate': Decimal('0.005'),
    'ad_valorem_default': Decimal('0.10'),
}

PERMISOS_PREVIOS_MAPPING = {
    'alimento': {
        'institucion': 'ARCSA',
        'permiso': 'Notificacion Sanitaria Obligatoria (NSO)',
        'descripcion': 'Registro sanitario o notificacion sanitaria para alimentos procesados',
        'tramite_previo': True,
        'tiempo_estimado': '15-30 dias habiles'
    },
    'cosmetico': {
        'institucion': 'ARCSA',
        'permiso': 'Notificacion Sanitaria Obligatoria (NSO)',
        'descripcion': 'Notificacion sanitaria para cosmeticos e higiene personal',
        'tramite_previo': True,
        'tiempo_estimado': '15-30 dias habiles'
    },
    'medicina': {
        'institucion': 'ARCSA',
        'permiso': 'Registro Sanitario',
        'descripcion': 'Registro sanitario obligatorio para medicamentos y dispositivos medicos',
        'tramite_previo': True,
        'tiempo_estimado': '60-90 dias habiles'
    },
    'farmaceutico': {
        'institucion': 'ARCSA',
        'permiso': 'Registro Sanitario',
        'descripcion': 'Registro sanitario para productos farmaceuticos',
        'tramite_previo': True,
        'tiempo_estimado': '60-90 dias habiles'
    },
    'agropecuario': {
        'institucion': 'AGROCALIDAD',
        'permiso': 'Certificado Fitosanitario/Zoosanitario',
        'descripcion': 'Certificado fitosanitario o zoosanitario segun tipo de producto',
        'tramite_previo': True,
        'tiempo_estimado': '5-15 dias habiles'
    },
    'planta': {
        'institucion': 'AGROCALIDAD',
        'permiso': 'Certificado Fitosanitario',
        'descripcion': 'Permiso fitosanitario para plantas, semillas y productos vegetales',
        'tramite_previo': True,
        'tiempo_estimado': '5-15 dias habiles'
    },
    'animal': {
        'institucion': 'AGROCALIDAD',
        'permiso': 'Certificado Zoosanitario',
        'descripcion': 'Permiso zoosanitario para animales y productos de origen animal',
        'tramite_previo': True,
        'tiempo_estimado': '10-20 dias habiles'
    },
    'quimico': {
        'institucion': 'Ministerio del Interior / CONSEP',
        'permiso': 'Licencia Previa',
        'descripcion': 'Licencia para sustancias quimicas controladas',
        'tramite_previo': True,
        'tiempo_estimado': '30-45 dias habiles'
    },
    'arma': {
        'institucion': 'Ministerio de Defensa',
        'permiso': 'Autorizacion de Importacion',
        'descripcion': 'Permiso especial para armas y municiones',
        'tramite_previo': True,
        'tiempo_estimado': '60+ dias habiles'
    },
    'radiologico': {
        'institucion': 'ARCSA / SCAN',
        'permiso': 'Autorizacion de Importacion Radiologica',
        'descripcion': 'Permiso para equipos de rayos X y materiales radiactivos',
        'tramite_previo': True,
        'tiempo_estimado': '30-60 dias habiles'
    },
    'forestal': {
        'institucion': 'MAG / MAATE',
        'permiso': 'Certificado de Origen Forestal',
        'descripcion': 'Certificado para productos madereros y forestales',
        'tramite_previo': True,
        'tiempo_estimado': '10-20 dias habiles'
    },
    'textil': {
        'institucion': 'INEN',
        'permiso': 'Certificado INEN',
        'descripcion': 'Certificado de conformidad con normas tecnicas INEN',
        'tramite_previo': False,
        'tiempo_estimado': 'Previo al desaduanamiento'
    },
    'electrodomestico': {
        'institucion': 'INEN',
        'permiso': 'Certificado INEN',
        'descripcion': 'Certificado de conformidad para electrodomesticos',
        'tramite_previo': False,
        'tiempo_estimado': 'Previo al desaduanamiento'
    },
    'juguete': {
        'institucion': 'INEN',
        'permiso': 'Certificado INEN',
        'descripcion': 'Certificado de conformidad y seguridad para juguetes',
        'tramite_previo': False,
        'tiempo_estimado': 'Previo al desaduanamiento'
    },
}

HS_KEYWORD_MAPPING = {
    'laptop': ('8471.30.00', 85, 'Equipos de procesamiento de datos portatiles', 'Electronicos', None, Decimal('0.00')),
    'computadora': ('8471.30.00', 85, 'Equipos de procesamiento de datos', 'Electronicos', None, Decimal('0.00')),
    'telefono': ('8517.12.00', 90, 'Telefonos moviles', 'Electronicos', None, Decimal('0.00')),
    'celular': ('8517.12.00', 90, 'Telefonos moviles', 'Electronicos', None, Decimal('0.00')),
    'iphone': ('8517.12.00', 90, 'Telefonos moviles Apple', 'Electronicos', None, Decimal('0.00')),
    'samsung': ('8517.12.00', 85, 'Telefonos moviles Samsung', 'Electronicos', None, Decimal('0.00')),
    'ropa': ('6109.10.00', 75, 'Prendas de vestir de algodon', 'Textiles', 'textil', Decimal('0.20')),
    'camiseta': ('6109.10.00', 80, 'Camisetas de algodon', 'Textiles', 'textil', Decimal('0.20')),
    'zapato': ('6403.99.00', 70, 'Calzado con suela de caucho', 'Calzado', None, Decimal('0.20')),
    'maquinaria': ('8479.89.00', 60, 'Maquinas y aparatos mecanicos', 'Maquinaria', None, Decimal('0.00')),
    'repuesto': ('8708.99.00', 65, 'Partes y accesorios de vehiculos', 'Automotriz', None, Decimal('0.15')),
    'auto': ('8708.99.00', 65, 'Partes de automoviles', 'Automotriz', None, Decimal('0.15')),
    'quimico': ('3824.99.00', 55, 'Productos quimicos', 'Quimicos', 'quimico', Decimal('0.05')),
    'plastico': ('3926.90.00', 70, 'Articulos de plastico', 'Plasticos', None, Decimal('0.15')),
    'electronico': ('8543.70.00', 75, 'Aparatos electricos', 'Electronicos', None, Decimal('0.00')),
    'juguete': ('9503.00.00', 80, 'Juguetes diversos', 'Juguetes', 'juguete', Decimal('0.20')),
    'mueble': ('9403.60.00', 70, 'Muebles de madera', 'Muebles', 'forestal', Decimal('0.30')),
    'cosmetico': ('3304.99.00', 75, 'Productos cosmeticos', 'Cosmeticos', 'cosmetico', Decimal('0.20')),
    'medicina': ('3004.90.00', 70, 'Medicamentos', 'Farmaceuticos', 'medicina', Decimal('0.00')),
    'medicamento': ('3004.90.00', 70, 'Medicamentos', 'Farmaceuticos', 'medicina', Decimal('0.00')),
    'alimento': ('2106.90.00', 65, 'Preparaciones alimenticias', 'Alimentos', 'alimento', Decimal('0.20')),
    'comida': ('2106.90.00', 65, 'Preparaciones alimenticias', 'Alimentos', 'alimento', Decimal('0.20')),
    'bebida': ('2202.99.00', 70, 'Bebidas no alcoholicas', 'Bebidas', 'alimento', Decimal('0.25')),
    'licor': ('2208.90.00', 75, 'Bebidas alcoholicas', 'Bebidas', 'alimento', Decimal('0.25')),
    'vino': ('2204.21.00', 75, 'Vinos', 'Bebidas', 'alimento', Decimal('0.25')),
    'cerveza': ('2203.00.00', 80, 'Cerveza', 'Bebidas', 'alimento', Decimal('0.25')),
    'tabaco': ('2402.20.00', 85, 'Cigarrillos y tabaco', 'Tabaco', None, Decimal('0.30')),
    'perfume': ('3303.00.00', 75, 'Perfumes y aguas de tocador', 'Cosmeticos', 'cosmetico', Decimal('0.20')),
    'shampoo': ('3305.10.00', 75, 'Champu', 'Cosmeticos', 'cosmetico', Decimal('0.20')),
    'crema': ('3304.99.00', 70, 'Cremas cosmeticas', 'Cosmeticos', 'cosmetico', Decimal('0.20')),
    'semilla': ('1209.99.00', 70, 'Semillas para siembra', 'Agropecuario', 'planta', Decimal('0.00')),
    'fertilizante': ('3105.90.00', 65, 'Fertilizantes', 'Agropecuario', 'agropecuario', Decimal('0.00')),
    'pesticida': ('3808.91.00', 60, 'Pesticidas', 'Agropecuario', 'quimico', Decimal('0.05')),
    'tela': ('5407.61.00', 70, 'Telas y tejidos', 'Textiles', 'textil', Decimal('0.15')),
    'cuero': ('4107.99.00', 65, 'Cueros y pieles', 'Cueros', None, Decimal('0.15')),
    'madera': ('4407.99.00', 60, 'Madera aserrada', 'Forestal', 'forestal', Decimal('0.15')),
    'papel': ('4802.55.00', 70, 'Papel y carton', 'Papel', None, Decimal('0.10')),
    'acero': ('7208.51.00', 65, 'Productos de acero', 'Metales', None, Decimal('0.10')),
    'aluminio': ('7606.11.00', 65, 'Productos de aluminio', 'Metales', None, Decimal('0.10')),
    'vidrio': ('7005.29.00', 70, 'Vidrio plano', 'Vidrio', None, Decimal('0.15')),
    'ceramica': ('6910.10.00', 70, 'Articulos de ceramica', 'Ceramica', None, Decimal('0.20')),
    'televisor': ('8528.72.00', 85, 'Televisores', 'Electronicos', 'electrodomestico', Decimal('0.20')),
    'refrigerador': ('8418.10.00', 80, 'Refrigeradores', 'Electrodomesticos', 'electrodomestico', Decimal('0.20')),
    'lavadora': ('8450.11.00', 80, 'Lavadoras', 'Electrodomesticos', 'electrodomestico', Decimal('0.20')),
    'aire acondicionado': ('8415.10.00', 75, 'Aires acondicionados', 'Electrodomesticos', 'electrodomestico', Decimal('0.20')),
    'microondas': ('8516.50.00', 80, 'Hornos microondas', 'Electrodomesticos', 'electrodomestico', Decimal('0.20')),
    'motor': ('8407.34.00', 60, 'Motores de combustion', 'Maquinaria', None, Decimal('0.05')),
    'neumatico': ('4011.10.00', 75, 'Neumaticos', 'Automotriz', None, Decimal('0.15')),
    'llanta': ('4011.10.00', 75, 'Llantas', 'Automotriz', None, Decimal('0.15')),
    'bateria': ('8507.60.00', 70, 'Baterias', 'Electronicos', None, Decimal('0.10')),
    'carne': ('0201.30.00', 75, 'Carnes frescas o congeladas', 'Alimentos', 'animal', Decimal('0.25')),
    'pollo': ('0207.14.00', 75, 'Carne de aves', 'Alimentos', 'animal', Decimal('0.25')),
    'cerdo': ('0203.29.00', 75, 'Carne de cerdo', 'Alimentos', 'animal', Decimal('0.25')),
    'res': ('0201.30.00', 75, 'Carne de res', 'Alimentos', 'animal', Decimal('0.25')),
    'pescado': ('0303.89.00', 70, 'Pescado congelado', 'Alimentos', 'animal', Decimal('0.20')),
    'marisco': ('0306.17.00', 70, 'Mariscos', 'Alimentos', 'animal', Decimal('0.20')),
    'leche': ('0401.20.00', 80, 'Leche y productos lacteos', 'Lacteos', 'alimento', Decimal('0.25')),
    'queso': ('0406.90.00', 75, 'Quesos', 'Lacteos', 'alimento', Decimal('0.25')),
    'yogurt': ('0403.10.00', 75, 'Yogurt', 'Lacteos', 'alimento', Decimal('0.25')),
    'mantequilla': ('0405.10.00', 75, 'Mantequilla', 'Lacteos', 'alimento', Decimal('0.25')),
    'huevo': ('0407.21.00', 70, 'Huevos', 'Alimentos', 'animal', Decimal('0.20')),
    'dispositivo medico': ('9018.90.00', 70, 'Dispositivos medicos', 'Medico', 'medicina', Decimal('0.00')),
    'equipo medico': ('9018.90.00', 70, 'Equipos medicos', 'Medico', 'medicina', Decimal('0.00')),
    'instrumental': ('9018.49.00', 65, 'Instrumental medico', 'Medico', 'medicina', Decimal('0.00')),
    'jeringa': ('9018.31.00', 80, 'Jeringas', 'Medico', 'medicina', Decimal('0.00')),
    'mascarilla': ('6307.90.00', 75, 'Mascarillas y proteccion', 'Medico', 'medicina', Decimal('0.10')),
    'suplemento': ('2106.90.00', 70, 'Suplementos alimenticios', 'Alimentos', 'alimento', Decimal('0.20')),
    'vitamina': ('2936.29.00', 70, 'Vitaminas', 'Farmaceuticos', 'farmaceutico', Decimal('0.00')),
    'fruta': ('0810.90.00', 70, 'Frutas frescas', 'Alimentos', 'planta', Decimal('0.15')),
    'verdura': ('0709.99.00', 70, 'Verduras frescas', 'Alimentos', 'planta', Decimal('0.15')),
    'cereal': ('1104.29.00', 70, 'Cereales', 'Alimentos', 'alimento', Decimal('0.15')),
    'arroz': ('1006.30.00', 80, 'Arroz', 'Alimentos', 'alimento', Decimal('0.45')),
    'trigo': ('1001.99.00', 70, 'Trigo', 'Alimentos', 'alimento', Decimal('0.00')),
    'lacteo': ('0401.20.00', 80, 'Productos lacteos', 'Lacteos', 'alimento', Decimal('0.25')),
    'lacteos': ('0401.20.00', 80, 'Productos lacteos', 'Lacteos', 'alimento', Decimal('0.25')),
    'quesos': ('0406.90.00', 75, 'Quesos', 'Lacteos', 'alimento', Decimal('0.25')),
    'embutido': ('1601.00.00', 75, 'Embutidos y carnes procesadas', 'Alimentos', 'alimento', Decimal('0.25')),
    'salchicha': ('1601.00.00', 75, 'Salchichas y embutidos', 'Alimentos', 'alimento', Decimal('0.25')),
    'jamon': ('0210.19.00', 75, 'Jamon', 'Alimentos', 'animal', Decimal('0.25')),
    'monitor': ('9018.19.00', 70, 'Monitor de signos vitales', 'Medico', 'medicina', Decimal('0.00')),
    'respirador': ('9019.20.00', 70, 'Respiradores medicos', 'Medico', 'medicina', Decimal('0.00')),
    'guante': ('4015.19.00', 70, 'Guantes medicos', 'Medico', 'medicina', Decimal('0.00')),
    'quirurgico': ('9018.90.00', 70, 'Instrumental quirurgico', 'Medico', 'medicina', Decimal('0.00')),
    'bisturi': ('9018.90.00', 75, 'Bisturi quirurgico', 'Medico', 'medicina', Decimal('0.00')),
    'camilla': ('9402.90.00', 65, 'Camillas medicas', 'Medico', 'medicina', Decimal('0.00')),
    'estetoscopio': ('9018.90.00', 80, 'Estetoscopios', 'Medico', 'medicina', Decimal('0.00')),
    'termometro': ('9025.19.00', 75, 'Termometros medicos', 'Medico', 'medicina', Decimal('0.00')),
    'glucometro': ('9027.80.00', 75, 'Glucometros', 'Medico', 'medicina', Decimal('0.00')),
    'carne congelada': ('0202.30.00', 75, 'Carne congelada', 'Alimentos', 'animal', Decimal('0.25')),
    'mariscos': ('0306.17.00', 70, 'Mariscos', 'Alimentos', 'animal', Decimal('0.20')),
    'camaron': ('0306.17.00', 75, 'Camarones', 'Alimentos', 'animal', Decimal('0.20')),
    'atun': ('0303.42.00', 70, 'Atun', 'Alimentos', 'animal', Decimal('0.20')),
    'salmon': ('0304.81.00', 70, 'Salmon', 'Alimentos', 'animal', Decimal('0.20')),
    'farmaco': ('3004.90.00', 70, 'Farmacos', 'Farmaceuticos', 'farmaceutico', Decimal('0.00')),
    'antibiotico': ('3004.10.00', 75, 'Antibioticos', 'Farmaceuticos', 'farmaceutico', Decimal('0.00')),
    'vacuna': ('3002.20.00', 80, 'Vacunas', 'Farmaceuticos', 'farmaceutico', Decimal('0.00')),
    'insulina': ('3004.31.00', 80, 'Insulina', 'Farmaceuticos', 'farmaceutico', Decimal('0.00')),
    'galleta': ('1905.31.00', 75, 'Galletas', 'Alimentos', 'alimento', Decimal('0.20')),
    'chocolate': ('1806.90.00', 75, 'Chocolates', 'Alimentos', 'alimento', Decimal('0.20')),
    'dulce': ('1704.90.00', 70, 'Dulces y confiteria', 'Alimentos', 'alimento', Decimal('0.20')),
    'conserva': ('2005.99.00', 70, 'Conservas', 'Alimentos', 'alimento', Decimal('0.20')),
    'enlatado': ('2005.99.00', 70, 'Productos enlatados', 'Alimentos', 'alimento', Decimal('0.20')),
    'cafe': ('0901.21.00', 75, 'Cafe', 'Alimentos', 'alimento', Decimal('0.15')),
    'te': ('0902.30.00', 70, 'Te', 'Alimentos', 'alimento', Decimal('0.15')),
    'aceite': ('1515.90.00', 70, 'Aceites comestibles', 'Alimentos', 'alimento', Decimal('0.15')),
    'harina': ('1101.00.00', 70, 'Harina', 'Alimentos', 'alimento', Decimal('0.15')),
    'azucar': ('1701.99.00', 75, 'Azucar', 'Alimentos', 'alimento', Decimal('0.20')),
}


def _get_permit_info(permit_key: str) -> dict:
    """Get permit information from PERMISOS_PREVIOS_MAPPING"""
    if permit_key and permit_key in PERMISOS_PREVIOS_MAPPING:
        return PERMISOS_PREVIOS_MAPPING[permit_key]
    return None


def _normalize_text(text: str) -> str:
    """Normalize text by removing accents and converting to lowercase"""
    import unicodedata
    normalized = unicodedata.normalize('NFKD', text.lower())
    return ''.join(c for c in normalized if not unicodedata.combining(c))


def _fallback_hs_suggestion(product_description: str) -> dict:
    """Keyword-based fallback when Gemini is unavailable"""
    description = _normalize_text(product_description)
    
    for keyword, (hs_code, confidence, reasoning, category, permit_key, ad_valorem) in HS_KEYWORD_MAPPING.items():
        if keyword in description:
            permit_info = _get_permit_info(permit_key)
            
            result = {
                'suggested_hs_code': hs_code,
                'confidence': confidence,
                'reasoning': f'Clasificacion basada en palabra clave "{keyword}": {reasoning}',
                'category': category,
                'notes': '',
                'ai_status': 'fallback_keyword',
                'ad_valorem_rate': float(ad_valorem),
                'requires_permit': permit_info is not None,
                'permit_info': permit_info,
                'tributos_2025': {
                    'iva_rate': float(SENAE_TRIBUTOS_2025['iva_rate']),
                    'fodinfa_rate': float(SENAE_TRIBUTOS_2025['fodinfa_rate']),
                    'ad_valorem_rate': float(ad_valorem)
                }
            }
            return result
    
    return {
        'suggested_hs_code': '9999.00.00',
        'confidence': 30,
        'reasoning': 'No se encontro coincidencia automatica. Se requiere clasificacion manual.',
        'category': 'Sin clasificar',
        'notes': '',
        'ai_status': 'fallback_no_match',
        'ad_valorem_rate': float(SENAE_TRIBUTOS_2025['ad_valorem_default']),
        'requires_permit': False,
        'permit_info': None,
        'tributos_2025': {
            'iva_rate': float(SENAE_TRIBUTOS_2025['iva_rate']),
            'fodinfa_rate': float(SENAE_TRIBUTOS_2025['fodinfa_rate']),
            'ad_valorem_rate': float(SENAE_TRIBUTOS_2025['ad_valorem_default'])
        }
    }


def suggest_hs_code(product_description: str, origin_country: str = "", fob_value: float = 0) -> dict:
    """
    Use Gemini AI to suggest an HS code for a product description.
    Falls back to keyword matching if Gemini is unavailable.
    Returns: dict with suggested_hs_code, confidence, reasoning, permit info, tributos
    """
    if not GEMINI_AVAILABLE or client is None:
        logger.info("Using fallback HS code suggestion (Gemini unavailable)")
        return _fallback_hs_suggestion(product_description)
    
    try:
        from google.genai import types
        
        system_prompt = """Eres un experto clasificador arancelario del SENAE (Servicio Nacional de Aduana del Ecuador) con conocimiento actualizado a 2025.

Tu tarea es analizar productos para importacion a Ecuador y proporcionar:
1. Codigo HS (subpartida arancelaria de 10 digitos)
2. Tasa de Ad-Valorem aplicable
3. Si requiere permisos previos de importacion

INSTITUCIONES QUE EMITEN PERMISOS PREVIOS EN ECUADOR:
- ARCSA: Alimentos procesados, cosmeticos, medicamentos, dispositivos medicos, productos de higiene
- AGROCALIDAD: Productos agropecuarios, plantas, semillas, animales, productos de origen animal/vegetal
- INEN: Certificados de conformidad para textiles, electrodomesticos, juguetes, equipos electricos
- Ministerio del Interior/CONSEP: Sustancias quimicas controladas
- MAG/MAATE: Productos forestales y madereros
- Ministerio de Defensa: Armas, municiones, explosivos

TRIBUTOS VIGENTES 2025:
- IVA: 15% (sobre CIF + Ad-Valorem + FODINFA + ICE)
- FODINFA: 0.5% (sobre CIF)
- Ad-Valorem: Variable segun subpartida (0% a 45%)
- ICE: Aplica a bebidas alcoholicas, cigarrillos, vehiculos, perfumes importados

Responde SOLO en formato JSON:
{
    "hs_code": "XXXX.XX.XX",
    "confidence": 85,
    "reasoning": "Explicacion de clasificacion",
    "category": "Categoria general",
    "ad_valorem_rate": 0.15,
    "requires_permit": true,
    "permit_info": {
        "institucion": "ARCSA",
        "permiso": "Notificacion Sanitaria Obligatoria",
        "descripcion": "Descripcion del permiso requerido",
        "tramite_previo": true,
        "tiempo_estimado": "15-30 dias habiles"
    },
    "special_taxes": ["ICE 75%"],
    "notes": "Notas adicionales importantes"
}

Si no requiere permiso, usar "requires_permit": false y "permit_info": null"""

        user_prompt = f"""Producto a importar a Ecuador: {product_description}
Pais de origen: {origin_country or 'No especificado'}
Valor FOB aproximado: ${fob_value:,.2f} USD

Proporciona el codigo HS, tasa de Ad-Valorem, y si requiere permisos previos de ARCSA, AGROCALIDAD, INEN u otra institucion."""

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
            
            ad_valorem_raw = data.get('ad_valorem_rate', 0.10)
            try:
                ad_valorem_rate = float(ad_valorem_raw)
            except (ValueError, TypeError):
                ad_valorem_rate = 0.10
            
            permit_info = data.get('permit_info', None)
            if permit_info and not isinstance(permit_info, dict):
                permit_info = None
            
            return {
                'suggested_hs_code': str(data.get('hs_code', '9999.00.00') or '9999.00.00'),
                'confidence': confidence,
                'reasoning': str(data.get('reasoning', '') or 'Clasificacion por IA Gemini'),
                'category': str(data.get('category', '') or ''),
                'notes': str(data.get('notes', '') or ''),
                'ai_status': 'success',
                'ad_valorem_rate': ad_valorem_rate,
                'requires_permit': bool(data.get('requires_permit', False)),
                'permit_info': permit_info,
                'special_taxes': data.get('special_taxes', []),
                'tributos_2025': {
                    'iva_rate': float(SENAE_TRIBUTOS_2025['iva_rate']),
                    'fodinfa_rate': float(SENAE_TRIBUTOS_2025['fodinfa_rate']),
                    'ad_valorem_rate': ad_valorem_rate
                }
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


def ai_assistant_chat(message: str, image_data: str = None, image_mime_type: str = None) -> dict:
    """
    AI Assistant for ImportaYa.ia - Specialized in Ecuadorian customs and logistics.
    
    Mode A: Text queries about tariffs, regulations, processes
    Mode B: Document analysis (invoices, packing lists, B/L, AWB)
    
    Args:
        message: User's text message
        image_data: Base64 encoded image data (optional)
        image_mime_type: MIME type of the image (e.g., 'image/jpeg', 'image/png')
    
    Returns:
        dict with response and metadata
    """
    if not GEMINI_AVAILABLE or client is None:
        return {
            'response': 'El servicio de IA no esta disponible en este momento. Por favor contacte a soporte tecnico.',
            'mode': 'error',
            'ai_status': 'unavailable'
        }
    
    try:
        from google.genai import types
        import base64
        
        system_prompt = """ERES UN ASISTENTE DE IA AVANZADO ESPECIALIZADO EN LOGISTICA INTERNACIONAL Y ADUANAS DE IMPORTACION PARA ECUADOR.

Tu objetivo principal es asistir a los usuarios de la plataforma 'ImportaYA.ia'.

## Restricciones y Estilo
1. **Enfoque Unico:** Todas las respuestas y analisis deben estar contextualizados bajo la normativa, aranceles y procesos de la SENAE (Aduana de Ecuador).
2. **Tono:** Profesional, conciso y orientado a la solucion.
3. **Output:** Si se te proporciona una imagen o documento, tu respuesta debe ser una tabla o una lista estructurada en Markdown.

## CONOCIMIENTO SENAE 2025

### Tributos Vigentes:
- IVA: 15% (sobre CIF + Ad-Valorem + FODINFA + ICE)
- FODINFA: 0.5% (sobre CIF)
- Ad-Valorem: Variable segun partida arancelaria (0% a 45%)
- ICE: Solo aplica a vehiculos, bebidas alcoholicas, cigarrillos, perfumes

### Instituciones de Permisos Previos:
- ARCSA: Alimentos procesados, cosmeticos, medicamentos, dispositivos medicos
- AGROCALIDAD: Productos agropecuarios, plantas, semillas, productos de origen animal
- INEN: Certificados de conformidad para textiles, electrodomesticos, juguetes
- Ministerio del Interior/CONSEP: Sustancias quimicas controladas
- MAG/MAATE: Productos forestales y madereros

### Documentos de Importacion:
- Factura Comercial (valor FOB, descripcion, peso, origen)
- Lista de Empaque (Packing List)
- Conocimiento de Embarque (B/L) o Guia Aerea (AWB)
- Certificado de Origen (si aplica preferencias arancelarias)
- Permisos previos segun producto

## Modos de Operacion

### MODO A: RESPUESTA DINAMICA (Solo texto)
Cuando recibas solo texto, actua como consultor experto:
- Si preguntan por aranceles, menciona la necesidad de la Partida Arancelaria (PA/Codigo HS)
- Si preguntan por un proceso, describelo de forma escalonada (1., 2., 3.)
- Siempre menciona fuentes legales cuando sea relevante (SENAE, Acuerdos comerciales)

### MODO B: ANALISIS DE DOCUMENTOS (Con imagen)
Cuando recibas una imagen de documento (factura, packing list, B/L, AWB):

Genera una respuesta en formato Markdown estructurado:

**EXTRACCION DE DATOS DEL DOCUMENTO**

| Campo | Valor |
|-------|-------|
| Tipo de Documento | [Identificar tipo] |
| Proveedor/Shipper | [Extraer] |
| Consignatario (Ecuador) | [Extraer] |
| Numero de Documento | [Extraer] |
| Valor Total (Moneda) | [Extraer] |
| Peso Neto/Bruto | [Extraer] |
| Volumen | [Extraer si aplica] |

**ALERTAS:** 
- Indica 'REQUIERE REVISION' si falta algun campo critico
- Sugiere partida arancelaria si es posible identificar el producto"""

        parts = []
        
        if image_data and image_mime_type:
            mode = 'document_analysis'
            allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
            if image_mime_type not in allowed_mime_types:
                return {
                    'response': f'Formato de imagen no soportado ({image_mime_type}). Use JPG, PNG, GIF o WebP.',
                    'mode': 'error',
                    'ai_status': 'unsupported_mime_type'
                }
            try:
                image_bytes = base64.b64decode(image_data)
                parts.append(types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=image_mime_type
                ))
            except Exception as e:
                logger.error(f"Failed to decode image: {e}")
                return {
                    'response': 'Error al procesar la imagen. Por favor intente con otro formato (JPG, PNG).',
                    'mode': 'error',
                    'ai_status': 'image_decode_error'
                }
        else:
            mode = 'text_query'
        
        parts.append(types.Part.from_text(message))
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(role="user", parts=parts)
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            ),
        )
        
        if response.text:
            return {
                'response': response.text,
                'mode': mode,
                'ai_status': 'success'
            }
        
        return {
            'response': 'No se pudo generar una respuesta. Por favor intente nuevamente.',
            'mode': mode,
            'ai_status': 'empty_response'
        }
    
    except Exception as e:
        logger.error(f"AI Assistant chat failed: {e}")
        return {
            'response': f'Error en el servicio de IA. Por favor intente nuevamente.',
            'mode': 'error',
            'ai_status': 'error'
        }
