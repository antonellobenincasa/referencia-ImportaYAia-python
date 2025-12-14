"""
Servicio de validación de direcciones con Gemini AI
Valida direcciones de entrega terrestre y obtiene coordenadas de Google Maps
"""
import json
import os
from datetime import datetime
from decimal import Decimal
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


def get_gemini_client():
    """Obtiene el cliente de Gemini AI"""
    if not GEMINI_AVAILABLE:
        return None
    
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return None
    
    return genai.Client(api_key=api_key)


def validate_address_with_gemini(address: str, city: str, country: str = "Ecuador") -> dict:
    """
    Valida una dirección usando Gemini AI y retorna:
    - Dirección exacta formateada
    - Coordenadas de latitud/longitud
    - Link de Google Maps
    - Nivel de confianza
    
    Args:
        address: Dirección ingresada por el usuario
        city: Ciudad de destino
        country: País (default: Ecuador)
    
    Returns:
        dict con validated_address, latitude, longitude, google_maps_link, confidence, raw_response
    """
    client = get_gemini_client()
    
    if not client:
        return {
            'success': False,
            'error': 'Gemini AI no disponible',
            'validated_address': address,
            'latitude': None,
            'longitude': None,
            'google_maps_link': '',
            'confidence': 0,
            'raw_response': ''
        }
    
    prompt = f"""Eres un experto en geocodificación y direcciones de Ecuador. Analiza la siguiente dirección y proporciona información estructurada.

DIRECCIÓN INGRESADA: {address}
CIUDAD: {city}
PAÍS: {country}

IMPORTANTE: Necesito que valides esta dirección y proporciones:
1. La dirección exacta y completa, formateada correctamente para Ecuador
2. Las coordenadas aproximadas (latitud y longitud) basándote en tu conocimiento de la geografía de Ecuador
3. Un enlace de Google Maps usando las coordenadas

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{{
    "validated_address": "Dirección completa formateada correctamente",
    "street": "Nombre de la calle/avenida",
    "number": "Número de dirección si está disponible",
    "neighborhood": "Barrio/Sector",
    "city": "Ciudad",
    "province": "Provincia",
    "postal_code": "Código postal si se conoce",
    "latitude": -2.XXXXXX,
    "longitude": -79.XXXXXX,
    "google_maps_link": "https://www.google.com/maps?q=LAT,LNG",
    "confidence": 85,
    "notes": "Cualquier nota relevante sobre la ubicación",
    "is_valid": true,
    "validation_message": "Mensaje sobre la validación"
}}

NOTAS IMPORTANTES:
- Las coordenadas de Ecuador están aproximadamente entre latitud -5 a 1 y longitud -81 a -75
- Guayaquil está aproximadamente en latitud -2.17 y longitud -79.92
- Quito está aproximadamente en latitud -0.18 y longitud -78.47
- El confidence debe ser un número entre 0 y 100
- Si no puedes determinar la ubicación exacta, proporciona las coordenadas del centro de la ciudad mencionada
- is_valid debe ser false solo si la dirección es completamente inválida o incomprensible

Responde SOLO con el JSON, sin texto adicional."""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        
        response_text = response.text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        data = json.loads(response_text)
        
        lat = data.get('latitude')
        lng = data.get('longitude')
        
        if lat and lng:
            google_maps_link = f"https://www.google.com/maps?q={lat},{lng}"
        else:
            google_maps_link = data.get('google_maps_link', '')
        
        return {
            'success': True,
            'validated_address': data.get('validated_address', address),
            'street': data.get('street', ''),
            'number': data.get('number', ''),
            'neighborhood': data.get('neighborhood', ''),
            'city': data.get('city', city),
            'province': data.get('province', ''),
            'postal_code': data.get('postal_code', ''),
            'latitude': Decimal(str(lat)) if lat else None,
            'longitude': Decimal(str(lng)) if lng else None,
            'google_maps_link': google_maps_link,
            'confidence': data.get('confidence', 0),
            'notes': data.get('notes', ''),
            'is_valid': data.get('is_valid', True),
            'validation_message': data.get('validation_message', ''),
            'raw_response': response_text
        }
        
    except json.JSONDecodeError as e:
        return {
            'success': False,
            'error': f'Error al parsear respuesta de IA: {str(e)}',
            'validated_address': address,
            'latitude': None,
            'longitude': None,
            'google_maps_link': '',
            'confidence': 0,
            'raw_response': response_text if 'response_text' in locals() else ''
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Error al validar dirección: {str(e)}',
            'validated_address': address,
            'latitude': None,
            'longitude': None,
            'google_maps_link': '',
            'confidence': 0,
            'raw_response': ''
        }


def send_forwarder_notification_email(quote_submission, validated_address_data: dict) -> dict:
    """
    Envía correo electrónico al freight forwarder notificando la dirección de entrega.
    
    Args:
        quote_submission: Instancia de QuoteSubmission
        validated_address_data: Datos de dirección validada por Gemini AI
    
    Returns:
        dict con success, email_id, message
    """
    forwarder_email = getattr(settings, 'FREIGHT_FORWARDER_EMAIL', 'operaciones@importaya.ia')
    
    subject = f"[ImportaYa.ia] Cotización Transporte Terrestre - {quote_submission.submission_number or quote_submission.id}"
    
    google_maps_link = validated_address_data.get('google_maps_link', '')
    validated_address = validated_address_data.get('validated_address', quote_submission.inland_transport_address)
    latitude = validated_address_data.get('latitude', '')
    longitude = validated_address_data.get('longitude', '')
    confidence = validated_address_data.get('confidence', 0)
    
    message = f"""
SOLICITUD DE COTIZACIÓN TRANSPORTE TERRESTRE
=============================================

INFORMACIÓN DEL CLIENTE:
- Empresa: {quote_submission.company_name}
- Contacto: {quote_submission.contact_name}
- Email: {quote_submission.contact_email}
- Teléfono: {quote_submission.contact_phone}
- RUC: {quote_submission.company_ruc or 'No proporcionado'}

INFORMACIÓN DEL EMBARQUE:
- Número de Solicitud: {quote_submission.submission_number or f'QS-{quote_submission.id}'}
- Tipo de Transporte: {quote_submission.transport_type}
- Tipo de Contenedor: {quote_submission.container_type or 'N/A'}
- Descripción de Carga: {quote_submission.cargo_description}
- Peso: {quote_submission.cargo_weight_kg or 'N/A'} kg
- Volumen: {quote_submission.cargo_volume_cbm or 'N/A'} CBM

DIRECCIÓN DE ENTREGA TERRESTRE:
-------------------------------
Ciudad Destino: {quote_submission.inland_transport_city}

Dirección Original (ingresada por cliente):
{quote_submission.inland_transport_address}

Dirección Validada por IA:
{validated_address}

Coordenadas:
- Latitud: {latitude}
- Longitud: {longitude}
- Nivel de Confianza: {confidence}%

LINK GOOGLE MAPS:
{google_maps_link}

ACCIÓN REQUERIDA:
Por favor cotizar el transporte terrestre a la dirección indicada y responder a este correo con:
1. Costo del transporte terrestre
2. Tiempo estimado de entrega
3. Observaciones adicionales

Este correo fue generado automáticamente por ImportaYa.ia
Fecha: {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@importaya.ia'),
            recipient_list=[forwarder_email],
            fail_silently=False,
        )
        
        email_id = f"FF-{quote_submission.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        
        return {
            'success': True,
            'email_id': email_id,
            'message': f'Correo enviado exitosamente a {forwarder_email}',
            'sent_to': forwarder_email,
            'sent_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        return {
            'success': False,
            'email_id': '',
            'message': f'Error al enviar correo: {str(e)}',
            'error': str(e)
        }


def process_inland_transport_address(quote_submission) -> dict:
    """
    Proceso completo de validación de dirección y notificación al forwarder.
    
    1. Valida la dirección con Gemini AI
    2. Guarda los datos en la base de datos
    3. Envía correo al freight forwarder
    
    Args:
        quote_submission: Instancia de QuoteSubmission con datos de transporte terrestre
    
    Returns:
        dict con success, validation_result, email_result
    """
    if not quote_submission.needs_inland_transport:
        return {
            'success': False,
            'error': 'La solicitud no requiere transporte terrestre'
        }
    
    if not quote_submission.inland_transport_address:
        return {
            'success': False,
            'error': 'No se ha proporcionado dirección de entrega'
        }
    
    validation_result = validate_address_with_gemini(
        address=quote_submission.inland_transport_address,
        city=quote_submission.inland_transport_city or quote_submission.city,
        country='Ecuador'
    )
    
    quote_submission.inland_transport_address_validated = validation_result.get('validated_address', '')
    quote_submission.inland_transport_latitude = validation_result.get('latitude')
    quote_submission.inland_transport_longitude = validation_result.get('longitude')
    quote_submission.inland_transport_google_maps_link = validation_result.get('google_maps_link', '')
    quote_submission.inland_transport_ai_response = validation_result.get('raw_response', '')
    quote_submission.inland_transport_address_validated_at = timezone.now()
    
    email_result = send_forwarder_notification_email(quote_submission, validation_result)
    
    if email_result.get('success'):
        quote_submission.inland_transport_forwarder_notified = True
        quote_submission.inland_transport_forwarder_notified_at = timezone.now()
        quote_submission.inland_transport_forwarder_email_id = email_result.get('email_id', '')
    
    quote_submission.save()
    
    return {
        'success': True,
        'validation_result': {
            'validated_address': validation_result.get('validated_address'),
            'latitude': str(validation_result.get('latitude')) if validation_result.get('latitude') else None,
            'longitude': str(validation_result.get('longitude')) if validation_result.get('longitude') else None,
            'google_maps_link': validation_result.get('google_maps_link'),
            'confidence': validation_result.get('confidence'),
            'is_valid': validation_result.get('is_valid', True)
        },
        'email_result': email_result
    }
