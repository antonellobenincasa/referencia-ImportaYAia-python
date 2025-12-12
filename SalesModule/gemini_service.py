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
                parts.append(types.Part(
                    inline_data=types.Blob(
                        data=image_bytes,
                        mime_type=image_mime_type
                    )
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
        
        parts.append(types.Part(text=message))
        
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


def _generate_fallback_scenarios(transport_type: str, weight_kg: float = None, volume_cbm: float = None) -> list:
    """
    Generate realistic fallback scenarios when Gemini is unavailable.
    
    Business Logic:
    - AEREO: Tarifa por kg O flete mínimo (el mayor), tiempos 1-8 días según aeropuerto/aerolínea
    - LCL: Tarifa por CBM O por tonelada (el mayor), mínimo = tarifa x 2, 
           tiempos directos 7-35 días, indirectos 45-55 días
    - FCL: Contenedores 20ft/40ft/40HC, tiempos directos 7-35 días, indirectos 45-55 días
    """
    weight = float(weight_kg) if weight_kg else 100.0
    volume = float(volume_cbm) if volume_cbm else 1.0
    
    FLETE_MINIMO_AEREO = 85.0
    TARIFA_AEREO_KG = 4.50
    
    TARIFA_LCL_CBM = 65.0
    TARIFA_LCL_TON = 65.0
    FLETE_MINIMO_LCL_FACTOR = 2.0
    
    FCL_20FT_BASE = 1800.0
    FCL_40FT_BASE = 2800.0
    FCL_40HC_BASE = 3200.0
    
    SEGURO_PCT = 0.005
    AGENCIAMIENTO_BASE = 150.0
    TRANSPORTE_GYE = 50.0
    TRANSPORTE_UIO = 120.0
    TRANSPORTE_CUE = 180.0
    
    scenarios = []
    
    if transport_type == 'AEREO':
        flete_por_kg = weight * TARIFA_AEREO_KG
        flete_base = max(flete_por_kg, FLETE_MINIMO_AEREO)
        
        flete_consolidado = round(flete_base * 0.85, 2)
        flete_regular = round(flete_base, 2)
        flete_express = round(flete_base * 1.35, 2)
        
        scenarios = [
            {
                "tipo": "economico",
                "nombre": "Aéreo Consolidado",
                "modalidad": "Consolidado aéreo",
                "flete_usd": flete_consolidado,
                "flete_minimo_aplicado": flete_por_kg < FLETE_MINIMO_AEREO,
                "seguro_usd": round(flete_consolidado * SEGURO_PCT * 10, 2),
                "agenciamiento_usd": AGENCIAMIENTO_BASE,
                "transporte_interno_usd": TRANSPORTE_GYE,
                "handling_usd": 25.0,
                "otros_usd": 20.0,
                "subtotal_logistica_usd": round(flete_consolidado + AGENCIAMIENTO_BASE + TRANSPORTE_GYE + 45.0 + round(flete_consolidado * SEGURO_PCT * 10, 2), 2),
                "tiempo_transito_min_dias": 6,
                "tiempo_transito_max_dias": 8,
                "tiempo_transito_dias": "6-8",
                "notas": "Consolidado aéreo. Tiempo variable según aeropuerto origen y disponibilidad de vuelos. Ideal para cargas no urgentes."
            },
            {
                "tipo": "estandar",
                "nombre": "Aéreo Regular",
                "modalidad": "Vuelo regular directo",
                "flete_usd": flete_regular,
                "flete_minimo_aplicado": flete_por_kg < FLETE_MINIMO_AEREO,
                "seguro_usd": round(flete_regular * SEGURO_PCT * 10, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.2, 2),
                "transporte_interno_usd": TRANSPORTE_GYE,
                "handling_usd": 35.0,
                "otros_usd": 25.0,
                "subtotal_logistica_usd": round(flete_regular + AGENCIAMIENTO_BASE * 1.2 + TRANSPORTE_GYE + 60.0 + round(flete_regular * SEGURO_PCT * 10, 2), 2),
                "tiempo_transito_min_dias": 3,
                "tiempo_transito_max_dias": 5,
                "tiempo_transito_dias": "3-5",
                "notas": "Servicio aéreo regular. Tiempo depende de aerolínea y conexiones. Buena relación precio/tiempo."
            },
            {
                "tipo": "express",
                "nombre": "Aéreo Express/Courier",
                "modalidad": "Servicio express prioritario",
                "flete_usd": flete_express,
                "flete_minimo_aplicado": flete_por_kg < FLETE_MINIMO_AEREO,
                "seguro_usd": round(flete_express * SEGURO_PCT * 10, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.4, 2),
                "transporte_interno_usd": TRANSPORTE_GYE,
                "handling_usd": 45.0,
                "otros_usd": 30.0,
                "subtotal_logistica_usd": round(flete_express + AGENCIAMIENTO_BASE * 1.4 + TRANSPORTE_GYE + 75.0 + round(flete_express * SEGURO_PCT * 10, 2), 2),
                "tiempo_transito_min_dias": 1,
                "tiempo_transito_max_dias": 3,
                "tiempo_transito_dias": "1-3",
                "notas": "Servicio express con prioridad. Entrega garantizada en tiempo mínimo. Para cargas urgentes."
            }
        ]
        
    elif transport_type == 'LCL':
        weight_tons = weight / 1000.0
        flete_por_cbm = volume * TARIFA_LCL_CBM
        flete_por_ton = weight_tons * TARIFA_LCL_TON * 1000
        flete_calculado = max(flete_por_cbm, flete_por_ton)
        flete_minimo_lcl = max(TARIFA_LCL_CBM, TARIFA_LCL_TON) * FLETE_MINIMO_LCL_FACTOR
        flete_base = max(flete_calculado, flete_minimo_lcl)
        
        flete_indirecto = round(flete_base * 0.80, 2)
        flete_directo = round(flete_base, 2)
        flete_aereo_alt = round(weight * TARIFA_AEREO_KG * 1.1, 2)
        
        scenarios = [
            {
                "tipo": "economico",
                "nombre": "Marítimo LCL - Servicio Indirecto",
                "modalidad": "Consolidado marítimo con transbordo",
                "flete_usd": flete_indirecto,
                "flete_base_cbm": round(flete_por_cbm, 2),
                "flete_base_ton": round(flete_por_ton, 2),
                "flete_minimo_aplicado": flete_calculado < flete_minimo_lcl,
                "calculo_aplicado": "CBM" if flete_por_cbm >= flete_por_ton else "Tonelada",
                "seguro_usd": round(flete_indirecto * SEGURO_PCT * 5, 2),
                "agenciamiento_usd": AGENCIAMIENTO_BASE,
                "transporte_interno_usd": TRANSPORTE_GYE,
                "gastos_puerto_usd": 45.0,
                "otros_usd": 30.0,
                "subtotal_logistica_usd": round(flete_indirecto + AGENCIAMIENTO_BASE + TRANSPORTE_GYE + 75.0 + round(flete_indirecto * SEGURO_PCT * 5, 2), 2),
                "tiempo_transito_min_dias": 45,
                "tiempo_transito_max_dias": 55,
                "tiempo_transito_dias": "45-55",
                "notas": "Servicio indirecto con transbordo. Mejor tarifa pero tiempo extendido. Para puertos sin servicio directo."
            },
            {
                "tipo": "estandar",
                "nombre": "Marítimo LCL - Servicio Directo",
                "modalidad": "Consolidado marítimo directo",
                "flete_usd": flete_directo,
                "flete_base_cbm": round(flete_por_cbm, 2),
                "flete_base_ton": round(flete_por_ton, 2),
                "flete_minimo_aplicado": flete_calculado < flete_minimo_lcl,
                "calculo_aplicado": "CBM" if flete_por_cbm >= flete_por_ton else "Tonelada",
                "seguro_usd": round(flete_directo * SEGURO_PCT * 5, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.2, 2),
                "transporte_interno_usd": TRANSPORTE_GYE,
                "gastos_puerto_usd": 55.0,
                "otros_usd": 35.0,
                "subtotal_logistica_usd": round(flete_directo + AGENCIAMIENTO_BASE * 1.2 + TRANSPORTE_GYE + 90.0 + round(flete_directo * SEGURO_PCT * 5, 2), 2),
                "tiempo_transito_min_dias": 7,
                "tiempo_transito_max_dias": 35,
                "tiempo_transito_dias": "7-35",
                "notas": "Servicio directo sin transbordo. Tiempo variable según puerto origen y naviera. Mejor opción precio/tiempo."
            },
            {
                "tipo": "express",
                "nombre": "Aéreo - Alternativa Express",
                "modalidad": "Cambio a transporte aéreo",
                "flete_usd": max(flete_aereo_alt, FLETE_MINIMO_AEREO),
                "flete_minimo_aplicado": flete_aereo_alt < FLETE_MINIMO_AEREO,
                "seguro_usd": round(max(flete_aereo_alt, FLETE_MINIMO_AEREO) * SEGURO_PCT * 10, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.3, 2),
                "transporte_interno_usd": TRANSPORTE_GYE,
                "handling_usd": 40.0,
                "otros_usd": 30.0,
                "subtotal_logistica_usd": round(max(flete_aereo_alt, FLETE_MINIMO_AEREO) + AGENCIAMIENTO_BASE * 1.3 + TRANSPORTE_GYE + 70.0 + round(max(flete_aereo_alt, FLETE_MINIMO_AEREO) * SEGURO_PCT * 10, 2), 2),
                "tiempo_transito_min_dias": 3,
                "tiempo_transito_max_dias": 5,
                "tiempo_transito_dias": "3-5",
                "notas": "Alternativa aérea para entrega urgente. Ideal si el tiempo es crítico. Mayor costo pero entrega rápida."
            }
        ]
        
    else:  # FCL - Contenedores 20ft, 40ft, 40HC
        scenarios = [
            {
                "tipo": "economico",
                "nombre": "Marítimo FCL 20ft - Servicio Estándar",
                "modalidad": "Contenedor 20 pies estándar",
                "contenedor_tipo": "20ft Standard",
                "capacidad": "33 CBM / 28,000 kg máx",
                "flete_usd": FCL_20FT_BASE,
                "seguro_usd": round(FCL_20FT_BASE * SEGURO_PCT, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.2, 2),
                "transporte_interno_usd": 80.0,
                "gastos_puerto_usd": 120.0,
                "thc_usd": 180.0,
                "otros_usd": 50.0,
                "subtotal_logistica_usd": round(FCL_20FT_BASE + round(FCL_20FT_BASE * SEGURO_PCT, 2) + AGENCIAMIENTO_BASE * 1.2 + 80.0 + 120.0 + 180.0 + 50.0, 2),
                "tiempo_transito_min_dias": 7,
                "tiempo_transito_max_dias": 35,
                "tiempo_transito_dias": "7-35",
                "notas": "Contenedor 20ft estándar. Tiempo variable: 7-35 días (directo) o 45-55 días (indirecto). Ideal para cargas medianas."
            },
            {
                "tipo": "estandar",
                "nombre": "Marítimo FCL 40ft - Servicio Estándar",
                "modalidad": "Contenedor 40 pies estándar",
                "contenedor_tipo": "40ft Standard",
                "capacidad": "67 CBM / 28,500 kg máx",
                "flete_usd": FCL_40FT_BASE,
                "seguro_usd": round(FCL_40FT_BASE * SEGURO_PCT, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.3, 2),
                "transporte_interno_usd": 100.0,
                "gastos_puerto_usd": 150.0,
                "thc_usd": 220.0,
                "otros_usd": 60.0,
                "subtotal_logistica_usd": round(FCL_40FT_BASE + round(FCL_40FT_BASE * SEGURO_PCT, 2) + AGENCIAMIENTO_BASE * 1.3 + 100.0 + 150.0 + 220.0 + 60.0, 2),
                "tiempo_transito_min_dias": 7,
                "tiempo_transito_max_dias": 35,
                "tiempo_transito_dias": "7-35",
                "notas": "Contenedor 40ft estándar. Tiempo variable: 7-35 días (directo) o 45-55 días (indirecto). Mejor relación costo/volumen."
            },
            {
                "tipo": "express",
                "nombre": "Marítimo FCL 40HC - Alta Capacidad",
                "modalidad": "Contenedor 40 pies High Cube",
                "contenedor_tipo": "40ft High Cube",
                "capacidad": "76 CBM / 28,500 kg máx",
                "flete_usd": FCL_40HC_BASE,
                "seguro_usd": round(FCL_40HC_BASE * SEGURO_PCT, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.4, 2),
                "transporte_interno_usd": 100.0,
                "gastos_puerto_usd": 160.0,
                "thc_usd": 240.0,
                "otros_usd": 70.0,
                "subtotal_logistica_usd": round(FCL_40HC_BASE + round(FCL_40HC_BASE * SEGURO_PCT, 2) + AGENCIAMIENTO_BASE * 1.4 + 100.0 + 160.0 + 240.0 + 70.0, 2),
                "tiempo_transito_min_dias": 7,
                "tiempo_transito_max_dias": 35,
                "tiempo_transito_dias": "7-35",
                "notas": "Contenedor 40HC (High Cube). Mayor altura (+30cm). Tiempo variable: 7-35 días (directo) o 45-55 días (indirecto). Para cargas voluminosas."
            }
        ]
    
    return scenarios


def generate_intelligent_quote(
    cargo_description: str,
    origin: str,
    destination: str,
    transport_type: str,
    weight_kg: float = None,
    volume_cbm: float = None,
    incoterm: str = "FOB",
    fob_value_usd: float = None
) -> dict:
    """
    Generate an intelligent quote using Gemini AI for automatic HS code classification,
    customs duty calculation, permit detection, and multi-scenario quote generation.
    
    Args:
        cargo_description: Description of the cargo/product
        origin: Origin port/city
        destination: Destination port/city in Ecuador
        transport_type: 'FCL', 'LCL', or 'AEREO'
        weight_kg: Weight in kilograms
        volume_cbm: Volume in cubic meters
        incoterm: Trade term (FOB, CIF, etc.)
        fob_value_usd: Estimated FOB value in USD
    
    Returns:
        dict with classification, tributes, permits, and quote scenarios
    """
    
    default_response = {
        'clasificacion': {
            'hs_code': '9999.00.00',
            'descripcion': 'Sin clasificar - Requiere revisión manual',
            'confianza': 30,
            'categoria': 'General'
        },
        'tributos': {
            'ad_valorem_pct': 10.0,
            'iva_pct': 15.0,
            'fodinfa_pct': 0.5,
            'ice_pct': 0.0
        },
        'permisos': [],
        'escenarios': [],
        'ai_status': 'fallback',
        'notas': 'Clasificación automática no disponible. Se requiere revisión manual.'
    }
    
    if not cargo_description:
        default_response['ai_status'] = 'missing_description'
        return default_response
    
    if not GEMINI_AVAILABLE or client is None:
        logger.info("Using fallback intelligent quote (Gemini unavailable)")
        fallback = _fallback_hs_suggestion(cargo_description)
        
        ad_valorem_rate = fallback.get('ad_valorem_rate', 0.1)
        if isinstance(ad_valorem_rate, Decimal):
            ad_valorem_rate = float(ad_valorem_rate)
        
        default_response['clasificacion'] = {
            'hs_code': fallback.get('suggested_hs_code', '9999.00.00'),
            'descripcion': fallback.get('reasoning', 'Sin clasificar'),
            'confianza': int(fallback.get('confidence', 30)),
            'categoria': fallback.get('category', 'General')
        }
        default_response['tributos'] = {
            'ad_valorem_pct': float(ad_valorem_rate * 100),
            'iva_pct': 15.0,
            'fodinfa_pct': 0.5,
            'ice_pct': 0.0
        }
        if fallback.get('permit_info'):
            default_response['permisos'] = [{
                'institucion': str(fallback['permit_info'].get('institucion', '')),
                'permiso': str(fallback['permit_info'].get('permiso', '')),
                'tiempo_estimado': str(fallback['permit_info'].get('tiempo_estimado', ''))
            }]
        
        default_response['escenarios'] = _generate_fallback_scenarios(transport_type, weight_kg, volume_cbm)
        default_response['ai_status'] = 'fallback_keyword'
        return default_response
    
    try:
        from google.genai import types
        
        weight_info = f"{weight_kg} KG" if weight_kg else "No especificado"
        volume_info = f"{volume_cbm} CBM" if volume_cbm else "No especificado"
        value_info = f"USD {fob_value_usd}" if fob_value_usd else "No especificado"
        
        transport_display = {
            'FCL': 'Marítimo FCL (Contenedor Completo)',
            'LCL': 'Marítimo LCL (Carga Suelta)',
            'AEREO': 'Aéreo'
        }.get(transport_type, transport_type)
        
        system_prompt = """Eres un SISTEMA EXPERTO EN CLASIFICACION ARANCELARIA Y COTIZACION LOGISTICA para importaciones a Ecuador.

Tu rol es analizar solicitudes de cotización y generar respuestas estructuradas en JSON para la plataforma ImportaYa.ia.

## CONOCIMIENTO SENAE ECUADOR 2025

### Tributos Vigentes:
- IVA: 15% (se calcula sobre CIF + Ad-Valorem + FODINFA + ICE)
- FODINFA: 0.5% (se calcula sobre CIF)
- Ad-Valorem: Variable según partida arancelaria (0% a 45%)
- ICE: Solo para vehículos, bebidas alcohólicas, cigarrillos, perfumes

### Instituciones de Permisos Previos:
- ARCSA: Alimentos procesados, cosméticos, medicamentos, dispositivos médicos, suplementos
- AGROCALIDAD: Productos agropecuarios, plantas, semillas, productos de origen animal
- INEN: Certificados de conformidad para textiles, electrodomésticos, juguetes
- Ministerio del Interior/CONSEP: Sustancias químicas controladas
- MAG/MAATE: Productos forestales y madereros

### Tarifas Base de Referencia (USD):
AEREO:
- Tarifa por KG: $4.50 - $8.00 según volumen
- Tiempo tránsito: 2-5 días
- Mínimo: $85

MARITIMO LCL:
- Tarifa por CBM: $55 - $80 según ruta
- Tiempo tránsito: 20-35 días
- Mínimo: $150

MARITIMO FCL:
- 20ft: $1,800 - $2,500 según ruta
- 40ft: $2,800 - $4,000 según ruta
- 40HC: $3,200 - $4,500 según ruta
- Tiempo tránsito: 18-30 días

### Costos Adicionales Estándar:
- Seguro: 0.5% del valor CIF
- Agenciamiento aduanero: $150 - $250
- Transporte interno: $50 (Guayaquil), $120 (Quito), $180 (Cuenca)
- Handling/Documentación: $25 - $50

## INSTRUCCIONES DE RESPUESTA

Debes responder EXCLUSIVAMENTE en formato JSON válido con esta estructura exacta:

{
  "clasificacion": {
    "hs_code": "XXXX.XX.XX",
    "descripcion": "Descripción técnica de la partida",
    "confianza": 85,
    "categoria": "Categoría del producto"
  },
  "tributos": {
    "ad_valorem_pct": 20.0,
    "iva_pct": 15.0,
    "fodinfa_pct": 0.5,
    "ice_pct": 0.0
  },
  "permisos": [
    {
      "institucion": "ARCSA",
      "permiso": "Notificación Sanitaria Obligatoria (NSO)",
      "tiempo_estimado": "15-30 días hábiles",
      "obligatorio": true
    }
  ],
  "escenarios": [
    {
      "tipo": "economico",
      "nombre": "Marítimo LCL - Económico",
      "flete_usd": 280.00,
      "seguro_usd": 25.00,
      "agenciamiento_usd": 150.00,
      "transporte_interno_usd": 50.00,
      "otros_usd": 25.00,
      "subtotal_logistica_usd": 530.00,
      "tiempo_transito_dias": 35,
      "notas": "Opción más económica, mayor tiempo de tránsito"
    },
    {
      "tipo": "estandar",
      "nombre": "Marítimo LCL - Estándar",
      "flete_usd": 350.00,
      "seguro_usd": 30.00,
      "agenciamiento_usd": 180.00,
      "transporte_interno_usd": 50.00,
      "otros_usd": 30.00,
      "subtotal_logistica_usd": 640.00,
      "tiempo_transito_dias": 28,
      "notas": "Balance óptimo costo-tiempo"
    },
    {
      "tipo": "express",
      "nombre": "Aéreo Express",
      "flete_usd": 850.00,
      "seguro_usd": 40.00,
      "agenciamiento_usd": 200.00,
      "transporte_interno_usd": 50.00,
      "otros_usd": 35.00,
      "subtotal_logistica_usd": 1175.00,
      "tiempo_transito_dias": 5,
      "notas": "Entrega más rápida, mayor costo"
    }
  ],
  "notas_generales": "Observaciones importantes sobre la importación",
  "alertas": ["Lista de alertas o requisitos especiales si aplican"]
}

IMPORTANTE:
1. El hs_code debe ser una partida arancelaria real del arancel ecuatoriano
2. La confianza debe ser un número entre 0 y 100
3. Los escenarios deben adaptarse al tipo de transporte solicitado
4. Si el producto requiere permisos previos, es OBLIGATORIO incluirlos
5. Los costos deben ser realistas según el mercado ecuatoriano 2025
6. Responde SOLO con el JSON, sin texto adicional"""

        user_message = f"""Genera una cotización inteligente para la siguiente solicitud:

PRODUCTO/CARGA: {cargo_description}
ORIGEN: {origin}
DESTINO: {destination} (Ecuador)
TIPO DE TRANSPORTE SOLICITADO: {transport_display}
PESO: {weight_info}
VOLUMEN: {volume_info}
VALOR ESTIMADO FOB: {value_info}
INCOTERM: {incoterm}

Analiza el producto, clasifícalo con su partida arancelaria, calcula los tributos aplicables, 
identifica si requiere permisos previos, y genera 3 escenarios de cotización (económico, estándar, express)."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(role="user", parts=[types.Part(text=user_message)])
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
                logger.info(f"Intelligent quote generated successfully for: {cargo_description[:50]}...")
                return data
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in intelligent quote: {e}")
                default_response['ai_status'] = 'json_parse_error'
                default_response['notas'] = f'Error al procesar respuesta de IA: {str(e)}'
                return default_response
        
        default_response['ai_status'] = 'empty_response'
        return default_response
    
    except Exception as e:
        logger.error(f"Intelligent quote generation failed: {e}")
        default_response['ai_status'] = 'error'
        default_response['notas'] = f'Error en servicio de IA: {str(e)}'
        return default_response
