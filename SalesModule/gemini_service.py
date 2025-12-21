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


def get_providers_for_transport(transport_type: str, limit: int = 3) -> list:
    """
    Get active logistics providers for a given transport type.
    Used to include provider names in quote scenarios.
    
    Args:
        transport_type: 'FCL', 'LCL', or 'AEREO'
        limit: Maximum number of providers to return
    
    Returns:
        List of provider dictionaries with name, code, priority
    """
    try:
        from .models import LogisticsProvider
        providers = LogisticsProvider.objects.filter(
            transport_type=transport_type.upper(),
            is_active=True
        ).order_by('priority')[:limit]
        
        return [
            {
                'id': p.id,
                'name': p.name,
                'code': p.code,
                'priority': p.priority
            }
            for p in providers
        ]
    except Exception as e:
        logger.warning(f"Could not fetch providers for {transport_type}: {e}")
        return []


def get_best_rate_for_route(transport_type: str, origin: str = None, destination: str = 'GYE', container_type: str = None) -> dict:
    """
    Get the best available rate from provider database for a given route.
    
    Args:
        transport_type: 'FCL', 'LCL', or 'AEREO'
        origin: Origin port/airport
        destination: Destination in Ecuador (GYE, PSJ for maritime; GYE, UIO for air)
        container_type: Container type for FCL
    
    Returns:
        Best rate info or None if no rates found
    """
    try:
        from django.utils import timezone
        from .models import ProviderRate
        
        today = timezone.now().date()
        
        queryset = ProviderRate.objects.select_related('provider').filter(
            provider__transport_type=transport_type.upper(),
            provider__is_active=True,
            is_active=True,
            valid_from__lte=today,
            valid_to__gte=today
        )
        
        if destination:
            queryset = queryset.filter(destination=destination.upper())
        
        if origin:
            queryset = queryset.filter(origin_port__icontains=origin)
        
        if container_type and transport_type.upper() == 'FCL':
            container_code = container_type.replace('1x', '').replace('x', '').upper()
            queryset = queryset.filter(container_type=container_code)
        
        rate = queryset.order_by('rate_usd').first()
        
        if rate:
            return {
                'provider_name': rate.provider.name,
                'provider_code': rate.provider.code,
                'rate_usd': float(rate.rate_usd),
                'transit_days_min': rate.transit_days_min,
                'transit_days_max': rate.transit_days_max,
                'free_days': rate.free_days,
                'thc_destination': float(rate.thc_destination_usd),
                'origin_port': rate.origin_port,
                'destination': rate.destination
            }
    except Exception as e:
        logger.warning(f"Could not fetch best rate for {transport_type}: {e}")
    
    return None

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


def _generate_fallback_scenarios(transport_type: str, weight_kg: float = None, volume_cbm: float = None, container_type: str = None) -> list:
    """
    Generate realistic fallback scenarios when Gemini is unavailable.
    
    Business Logic:
    - AEREO: Tarifa por kg O flete mínimo (el mayor), tiempos 1-8 días según aeropuerto/aerolínea
    - LCL: Tarifa por CBM O por tonelada (el mayor), mínimo = tarifa x 2, 
           tiempos directos 7-35 días, indirectos 45-55 días
    - FCL: 11 tipos de contenedor con tarifas específicas, tiempos directos 7-35 días, indirectos 45-55 días
    
    Container Types Supported:
    - 1x20GP, 1x40GP, 1x40HC, 1x40NOR (General Purpose)
    - 1x20 REEFER, 1x40 REEFER (Refrigerados)
    - 1x40 OT HC (Open Top High Cube)
    - 1x20 FLAT RACK, 1x40 FLAT RACK
    - 1x20 OPEN TOP, 1x40 OPEN TOP
    """
    weight = float(weight_kg) if weight_kg else 100.0
    volume = float(volume_cbm) if volume_cbm else 1.0
    
    FLETE_MINIMO_AEREO = 85.0
    TARIFA_AEREO_KG = 4.50
    
    TARIFA_LCL_CBM = 65.0
    TARIFA_LCL_TON = 65.0
    FLETE_MINIMO_LCL_FACTOR = 2.0
    
    FCL_CONTAINER_RATES = {
        '1x20GP': {'flete': 1800.0, 'capacidad': '33 CBM / 28,000 kg máx', 'tipo': '20ft General Purpose'},
        '1x40GP': {'flete': 2800.0, 'capacidad': '67 CBM / 28,500 kg máx', 'tipo': '40ft General Purpose'},
        '1x40HC': {'flete': 3200.0, 'capacidad': '76 CBM / 28,500 kg máx', 'tipo': '40ft High Cube'},
        '1x40NOR': {'flete': 2900.0, 'capacidad': '67 CBM / 28,500 kg máx', 'tipo': '40ft Non-Operating Reefer'},
        '1x20 REEFER': {'flete': 3500.0, 'capacidad': '27 CBM / 27,000 kg máx', 'tipo': '20ft Refrigerado'},
        '1x40 REEFER': {'flete': 5200.0, 'capacidad': '58 CBM / 29,000 kg máx', 'tipo': '40ft Refrigerado'},
        '1x40 OT HC': {'flete': 4200.0, 'capacidad': '76 CBM / 28,500 kg máx', 'tipo': '40ft Open Top High Cube'},
        '1x20 FLAT RACK': {'flete': 3000.0, 'capacidad': 'Carga sobredimensionada', 'tipo': '20ft Flat Rack'},
        '1x40 FLAT RACK': {'flete': 4500.0, 'capacidad': 'Carga sobredimensionada', 'tipo': '40ft Flat Rack'},
        '1x40 OPEN TOP': {'flete': 3800.0, 'capacidad': '65 CBM / 28,000 kg máx', 'tipo': '40ft Open Top'},
        '1x20 OPEN TOP': {'flete': 2200.0, 'capacidad': '31 CBM / 27,000 kg máx', 'tipo': '20ft Open Top'},
    }
    
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
        
    else:  # FCL - 11 tipos de contenedor
        selected_container = container_type if container_type and container_type in FCL_CONTAINER_RATES else '1x40HC'
        container_data = FCL_CONTAINER_RATES[selected_container]
        flete_base = container_data['flete']
        
        is_20ft = '20' in selected_container
        is_reefer = 'REEFER' in selected_container
        is_special = any(x in selected_container for x in ['FLAT RACK', 'OPEN TOP', 'OT HC'])
        
        transporte_base = 80.0 if is_20ft else 100.0
        gastos_puerto = 120.0 if is_20ft else 150.0
        thc_base = 180.0 if is_20ft else 220.0
        
        if is_reefer:
            gastos_puerto += 80.0
            thc_base += 50.0
        if is_special:
            gastos_puerto += 50.0
        
        scenarios = [
            {
                "tipo": "economico",
                "nombre": f"FCL {selected_container} - Servicio Indirecto",
                "modalidad": f"Contenedor {container_data['tipo']} - Con transbordo",
                "contenedor_tipo": selected_container,
                "capacidad": container_data['capacidad'],
                "servicio": "indirecto",
                "flete_usd": round(flete_base * 0.85, 2),
                "seguro_usd": round(flete_base * 0.85 * SEGURO_PCT, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.2, 2),
                "transporte_interno_usd": transporte_base,
                "gastos_puerto_usd": gastos_puerto,
                "thc_usd": thc_base,
                "otros_usd": 50.0,
                "subtotal_logistica_usd": round(flete_base * 0.85 + round(flete_base * 0.85 * SEGURO_PCT, 2) + AGENCIAMIENTO_BASE * 1.2 + transporte_base + gastos_puerto + thc_base + 50.0, 2),
                "tiempo_transito_min_dias": 45,
                "tiempo_transito_max_dias": 55,
                "tiempo_transito_dias": "45-55",
                "notas": f"{container_data['tipo']}. Servicio indirecto con transbordo. Mejor tarifa, tiempo extendido. Capacidad: {container_data['capacidad']}."
            },
            {
                "tipo": "estandar",
                "nombre": f"FCL {selected_container} - Servicio Directo",
                "modalidad": f"Contenedor {container_data['tipo']} - Sin transbordo",
                "contenedor_tipo": selected_container,
                "capacidad": container_data['capacidad'],
                "servicio": "directo",
                "flete_usd": flete_base,
                "seguro_usd": round(flete_base * SEGURO_PCT, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.3, 2),
                "transporte_interno_usd": transporte_base,
                "gastos_puerto_usd": gastos_puerto,
                "thc_usd": thc_base,
                "otros_usd": 60.0,
                "subtotal_logistica_usd": round(flete_base + round(flete_base * SEGURO_PCT, 2) + AGENCIAMIENTO_BASE * 1.3 + transporte_base + gastos_puerto + thc_base + 60.0, 2),
                "tiempo_transito_min_dias": 7,
                "tiempo_transito_max_dias": 35,
                "tiempo_transito_dias": "7-35",
                "notas": f"{container_data['tipo']}. Servicio directo sin transbordo. Tiempo variable según puerto origen y naviera. Capacidad: {container_data['capacidad']}."
            },
            {
                "tipo": "express",
                "nombre": f"FCL {selected_container} - Servicio Premium",
                "modalidad": f"Contenedor {container_data['tipo']} - Naviera premium",
                "contenedor_tipo": selected_container,
                "capacidad": container_data['capacidad'],
                "servicio": "premium",
                "flete_usd": round(flete_base * 1.15, 2),
                "seguro_usd": round(flete_base * 1.15 * SEGURO_PCT, 2),
                "agenciamiento_usd": round(AGENCIAMIENTO_BASE * 1.4, 2),
                "transporte_interno_usd": transporte_base,
                "gastos_puerto_usd": gastos_puerto + 30.0,
                "thc_usd": thc_base + 20.0,
                "otros_usd": 70.0,
                "subtotal_logistica_usd": round(flete_base * 1.15 + round(flete_base * 1.15 * SEGURO_PCT, 2) + AGENCIAMIENTO_BASE * 1.4 + transporte_base + gastos_puerto + 30.0 + thc_base + 20.0 + 70.0, 2),
                "tiempo_transito_min_dias": 7,
                "tiempo_transito_max_dias": 25,
                "tiempo_transito_dias": "7-25",
                "notas": f"{container_data['tipo']}. Servicio premium con naviera de primera línea. Tiempos más cortos garantizados. Capacidad: {container_data['capacidad']}."
            }
        ]
    
    providers = get_providers_for_transport(transport_type, limit=3)
    if providers:
        for i, scenario in enumerate(scenarios):
            if i < len(providers):
                scenario['proveedor'] = {
                    'id': providers[i]['id'],
                    'nombre': providers[i]['name'],
                    'codigo': providers[i]['code']
                }
            else:
                scenario['proveedor'] = {
                    'id': providers[0]['id'],
                    'nombre': providers[0]['name'],
                    'codigo': providers[0]['code']
                }
    
    return scenarios


def generate_intelligent_quote(
    cargo_description: str,
    origin: str,
    destination: str,
    transport_type: str,
    weight_kg: float = None,
    volume_cbm: float = None,
    incoterm: str = "FOB",
    fob_value_usd: float = None,
    container_type: str = None,
    hs_code_known: str = None
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
        container_type: FCL container type (e.g., '1x40HC', '1x20GP', '1x40 REEFER')
        hs_code_known: Optional HS code provided by the customer for validation
    
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
        
        default_response['escenarios'] = _generate_fallback_scenarios(transport_type, weight_kg, volume_cbm, container_type)
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


def extract_shipping_data_from_quote_documents(quote_submission_id: int) -> dict:
    """
    Extrae datos de Shipping Instructions desde documentos de la cotización usando Gemini AI.
    Se usa cuando el usuario accede por primera vez al formulario de instrucción de embarque.
    
    Args:
        quote_submission_id: ID del QuoteSubmission
    
    Returns:
        Dict con datos extraídos o vacío si no hay datos
    """
    if not GEMINI_AVAILABLE:
        logger.warning("Gemini AI not available for document extraction")
        return {}
    
    try:
        from .models import QuoteSubmission, QuoteSubmissionDocument
        import base64
        from django.core.files.storage import default_storage
        
        quote_submission = QuoteSubmission.objects.get(id=quote_submission_id)
        documents = quote_submission.documents.all()
        
        if not documents.exists():
            logger.info(f"No documents found for quote submission {quote_submission_id}")
            return {}
        
        document_contents = []
        for doc in documents:
            doc_info = {
                'type': doc.get_document_type_display(),
                'type_code': doc.document_type,
                'filename': doc.file_name
            }
            
            if doc.file and doc.file.name:
                try:
                    ext = doc.file_name.lower().split('.')[-1] if doc.file_name else ''
                    
                    if ext in ['pdf', 'jpg', 'jpeg', 'png']:
                        with default_storage.open(doc.file.name, 'rb') as f:
                            file_bytes = f.read()
                            encoded = base64.b64encode(file_bytes).decode('utf-8')
                            doc_info['content_base64'] = encoded[:10000]
                            doc_info['mime_type'] = 'application/pdf' if ext == 'pdf' else f'image/{ext}'
                    elif ext in ['txt', 'csv']:
                        with default_storage.open(doc.file.name, 'r') as f:
                            doc_info['content'] = f.read()[:8000]
                    else:
                        doc_info['note'] = f"Archivo {ext.upper()} - {doc.file_name}"
                except Exception as e:
                    doc_info['note'] = f"Archivo: {doc.file_name} ({e})"
            
            document_contents.append(doc_info)
        
        system_prompt = """Eres un experto en documentación de comercio internacional y logística de carga para Ecuador.
Tu tarea es extraer información estructurada de facturas comerciales, packing lists y otros documentos comerciales.

CAMPOS A EXTRAER (retorna SOLO los que encuentres):

1. SHIPPER (Exportador/Vendedor):
   - shipper_name: Nombre de la empresa exportadora
   - shipper_address: Dirección completa del shipper (ciudad, país)
   - shipper_contact: Nombre de contacto si está disponible
   - shipper_email: Email si está disponible
   - shipper_phone: Teléfono si está disponible

2. CONSIGNEE (Importador/Comprador ecuatoriano):
   - consignee_name: Nombre de la empresa importadora en Ecuador
   - consignee_address: Dirección en Ecuador
   - consignee_tax_id: RUC del importador (13 dígitos si es Ecuador)

3. CARGA:
   - cargo_description: Descripción de productos/mercancía
   - hs_codes: Códigos arancelarios si existen (separados por coma)
   - gross_weight_kg: Peso bruto total en KG
   - net_weight_kg: Peso neto total en KG  
   - volume_cbm: Volumen total en metros cúbicos
   - packages_count: Cantidad total de bultos/cajas
   - packages_type: Tipo de empaque (CARTONS, PALLETS, BAGS, etc.)

4. VALORES:
   - invoice_value_usd: Valor total de la factura en USD
   - invoice_number: Número de factura comercial
   - invoice_date: Fecha de factura (YYYY-MM-DD)
   - incoterm: Término de comercio (FOB, CIF, EXW, etc.)

5. PUERTOS:
   - origin_port: Puerto/ciudad de origen
   - destination_port: Puerto de destino (GYE=Guayaquil, PSJ=Puerto Bolivar)

IMPORTANTE:
- Responde SOLO con JSON válido
- Solo incluye campos que encuentres claramente en los documentos
- Incluye "extraction_confidence" (0-100) indicando confianza general
- Para RUC Ecuador, debe tener 13 dígitos
"""

        user_message = f"""Analiza los siguientes documentos comerciales y extrae la información para Shipping Instructions:

DOCUMENTOS ({len(document_contents)} archivos):
{json.dumps(document_contents, indent=2, ensure_ascii=False)}

CONTEXTO DE LA COTIZACIÓN:
- Empresa: {quote_submission.company_name or 'No especificada'}
- Contacto: {quote_submission.contact_name or 'No especificado'}
- Email: {quote_submission.contact_email or 'No especificado'}
- Origen: {quote_submission.origin or 'No especificado'}
- Destino: {quote_submission.destination or 'No especificado'}
- Descripción carga: {quote_submission.cargo_description or quote_submission.product_description or 'No especificada'}
- Peso: {quote_submission.cargo_weight_kg or 'No especificado'} kg
- Volumen: {quote_submission.cargo_volume_cbm or 'No especificado'} CBM

Extrae y estructura la información encontrada. Responde SOLO con JSON."""

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
                extracted_data = json.loads(response.text)
                logger.info(f"Successfully extracted data from quote {quote_submission_id} documents: {list(extracted_data.keys())}")
                return extracted_data
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in quote document extraction: {e}")
                return {}
        
        return {}
    
    except Exception as e:
        logger.error(f"Quote document extraction failed for QS {quote_submission_id}: {e}")
        return {}


def extract_shipping_data_from_documents(shipping_instruction_id: int) -> dict:
    """
    Extrae datos de Shipping Instructions desde documentos subidos usando Gemini AI.
    Soporta facturas comerciales, packing lists, booking confirmations, etc.
    
    Args:
        shipping_instruction_id: ID del ShippingInstruction
    
    Returns:
        Dict con datos extraídos o vacío si no hay datos
    """
    if not GEMINI_AVAILABLE:
        logger.warning("Gemini AI not available for document extraction")
        return {}
    
    try:
        from .models import ShippingInstruction, ShippingInstructionDocument
        import base64
        
        shipping_instruction = ShippingInstruction.objects.get(id=shipping_instruction_id)
        documents = shipping_instruction.documents.filter(ai_processed=False)
        
        if not documents.exists():
            return {}
        
        document_contents = []
        for doc in documents:
            doc_info = {
                'type': doc.document_type,
                'filename': doc.original_filename
            }
            
            if doc.file and doc.file.name:
                try:
                    ext = doc.original_filename.lower().split('.')[-1] if doc.original_filename else ''
                    if ext in ['txt', 'csv']:
                        with doc.file.open('r') as f:
                            doc_info['content'] = f.read()[:5000]
                    else:
                        doc_info['note'] = f"Archivo {ext.upper()} subido - extraer datos del nombre: {doc.original_filename}"
                except Exception as e:
                    doc_info['note'] = f"Error leyendo archivo: {str(e)}"
            
            document_contents.append(doc_info)
        
        system_prompt = """Eres un experto en documentación de comercio internacional y logística de carga.
Tu tarea es extraer información estructurada de documentos de embarque para completar un formulario de Shipping Instructions.

CAMPOS A EXTRAER:
1. SHIPPER (Exportador):
   - shipper_name: Nombre completo de la empresa exportadora
   - shipper_address: Dirección completa del shipper
   - shipper_contact: Nombre del contacto
   - shipper_email: Email del contacto
   - shipper_phone: Teléfono del contacto

2. CONSIGNEE (Importador/Consignatario):
   - consignee_name: Nombre de la empresa importadora
   - consignee_address: Dirección en Ecuador
   - consignee_tax_id: RUC del importador ecuatoriano

3. NOTIFY PARTY (Notificante):
   - notify_party_name: Nombre del notificante
   - notify_party_address: Dirección del notificante

4. DETALLES DE LA CARGA:
   - cargo_description: Descripción detallada de la mercancía
   - hs_code: Partida arancelaria si está disponible
   - gross_weight_kg: Peso bruto en kilogramos
   - net_weight_kg: Peso neto en kilogramos
   - volume_cbm: Volumen en metros cúbicos
   - package_count: Número de bultos/cajas
   - package_type: Tipo de embalaje (PALLETS, BOXES, BAGS, etc.)

5. DETALLES DE TRANSPORTE:
   - origin_port: Puerto o aeropuerto de origen
   - destination_port: Puerto o aeropuerto de destino en Ecuador
   - incoterm: Incoterm de la operación
   - container_type: Tipo de contenedor si aplica

6. VALORES:
   - fob_value_usd: Valor FOB en USD
   - freight_value_usd: Valor del flete
   - insurance_value_usd: Valor del seguro

7. REFERENCIAS:
   - po_number: Número de orden de compra
   - invoice_number: Número de factura comercial
   - booking_reference: Referencia de booking

RESPONDE EN JSON con solo los campos que puedas extraer con confianza.
Si no puedes extraer un campo, no lo incluyas en la respuesta.
Incluye un campo "extraction_confidence" (0-100) indicando tu nivel de confianza general."""

        user_message = f"""Extrae la información de Shipping Instructions de los siguientes documentos:

DOCUMENTOS DISPONIBLES:
{json.dumps(document_contents, indent=2, ensure_ascii=False)}

CONTEXTO ACTUAL (datos ya conocidos):
- Origen actual: {shipping_instruction.origin_port or 'No especificado'}
- Destino: {shipping_instruction.destination_port or 'No especificado'}
- Descripción carga: {shipping_instruction.cargo_description or 'No especificada'}
- Shipper actual: {shipping_instruction.shipper_name or 'No especificado'}
- Consignee actual: {shipping_instruction.consignee_name or 'No especificado'}

Extrae y estructura la información encontrada en los documentos. 
Prioriza datos concretos sobre estimaciones.
Responde SOLO con el JSON estructurado."""

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
                extracted_data = json.loads(response.text)
                logger.info(f"Successfully extracted shipping data for SI {shipping_instruction_id}")
                return extracted_data
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in document extraction: {e}")
                return {}
        
        return {}
    
    except Exception as e:
        logger.error(f"Document extraction failed for SI {shipping_instruction_id}: {e}")
        return {}


def generate_quote_scenarios_from_ff_costs(quote_submission, ff_cost):
    """
    Generate quote scenarios based on FF costs uploaded by Master Admin.
    This is used for non-FOB incoterms where costs come from freight forwarder.
    
    Args:
        quote_submission: QuoteSubmission instance
        ff_cost: FFQuoteCost instance with uploaded costs
    
    Returns:
        QuoteScenario instance created
    """
    from SalesModule.models import QuoteScenario, QuoteLineItem
    from decimal import Decimal
    import json
    
    transport_type = quote_submission.transport_type
    fob_value = Decimal(str(quote_submission.fob_value_usd or 0))
    
    origin_costs = Decimal(str(ff_cost.origin_costs_usd or 0))
    freight_cost = Decimal(str(ff_cost.freight_cost_usd or 0))
    destination_costs = Decimal(str(ff_cost.destination_costs_usd or 0))
    margin_percent = Decimal(str(ff_cost.profit_margin_percent or 15))
    
    total_ff_base = origin_costs + freight_cost + destination_costs
    margin_amount = total_ff_base * (margin_percent / Decimal('100'))
    total_with_margin = total_ff_base + margin_amount
    
    cif_base = fob_value + freight_cost
    insurance_rate = Decimal('0.0035')
    insurance_min = Decimal('70')
    insurance_base = max(cif_base * insurance_rate, insurance_min)
    insurance_iva = insurance_base * Decimal('0.15')
    insurance_total = insurance_base + insurance_iva
    
    cif_value = fob_value + freight_cost + insurance_base
    
    iva_exempt_costs = destination_costs
    iva_taxable_costs = total_with_margin - destination_costs
    iva_amount = iva_taxable_costs * Decimal('0.15')
    
    total_cost = total_with_margin + insurance_total + iva_amount
    
    ai_response = {
        'tipo_transporte': transport_type,
        'incoterm': quote_submission.incoterm,
        'origen': quote_submission.origin,
        'destino': quote_submission.destination,
        'valor_fob_usd': float(fob_value),
        'gastos_origen_usd': float(origin_costs),
        'flete_usd': float(freight_cost),
        'flete_maritimo_usd' if transport_type in ['FCL', 'LCL'] else 'flete_aereo_usd': float(freight_cost),
        'gastos_destino_usd': float(destination_costs),
        'seguro_usd': float(insurance_total),
        'seguro_base': float(insurance_base),
        'seguro_iva': float(insurance_iva),
        'subtotal_usd': float(total_with_margin),
        'iva_usd': float(iva_amount),
        'total_usd': float(total_cost),
        'cif_usd': float(cif_value),
        'tiempo_transito': ff_cost.transit_time,
        'naviera': ff_cost.carrier_name,
        'referencia_ff': ff_cost.ff_reference,
        'vigencia': str(ff_cost.validity_date) if ff_cost.validity_date else None,
        'margen_aplicado_percent': float(margin_percent),
        'notas': ff_cost.notes,
        'costos_locales': ff_cost.destination_costs_detail or {},
        'desglose_origen': ff_cost.origin_costs_detail or {},
        'generado_por': 'FF_MANUAL'
    }
    
    scenario = QuoteScenario.objects.create(
        quote_submission=quote_submission,
        scenario_type='estandar',
        carrier_name=ff_cost.carrier_name or 'Freight Forwarder',
        transit_time=ff_cost.transit_time or 'Consultar',
        free_days=21,
        subtotal_usd=total_with_margin,
        iva_usd=iva_amount,
        total_usd=total_cost,
        is_recommended=True,
        notes=f"Cotización generada desde costos del Freight Forwarder. Ref: {ff_cost.ff_reference or 'N/A'}",
        ai_response=ai_response
    )
    
    if origin_costs > 0:
        QuoteLineItem.objects.create(
            scenario=scenario,
            item_type='gastos_origen',
            description='Gastos en Origen (Pickup, Handling, Documentación)',
            amount_usd=origin_costs + (origin_costs * margin_percent / 100),
            is_iva_exempt=True,
            notes=json.dumps(ff_cost.origin_costs_detail) if ff_cost.origin_costs_detail else None
        )
    
    QuoteLineItem.objects.create(
        scenario=scenario,
        item_type='flete',
        description=f'Flete {"Marítimo" if transport_type in ["FCL", "LCL"] else "Aéreo"} ({ff_cost.carrier_name or "N/A"})',
        amount_usd=freight_cost + (freight_cost * margin_percent / 100),
        is_iva_exempt=False,
        notes=f"Tiempo de tránsito: {ff_cost.transit_time or 'Consultar'}"
    )
    
    if destination_costs > 0:
        QuoteLineItem.objects.create(
            scenario=scenario,
            item_type='gastos_destino',
            description='Gastos Locales en Destino (THC, Handling, Documentación)',
            amount_usd=destination_costs + (destination_costs * margin_percent / 100),
            is_iva_exempt=True,
            notes=json.dumps(ff_cost.destination_costs_detail) if ff_cost.destination_costs_detail else None
        )
    
    QuoteLineItem.objects.create(
        scenario=scenario,
        item_type='seguro',
        description='Seguro de Carga ImportaYa.IA (Sin Deducible)',
        amount_usd=insurance_total,
        is_iva_exempt=False,
        notes=f"Prima base: ${insurance_base:.2f} + IVA 15%: ${insurance_iva:.2f}"
    )
    
    return scenario
