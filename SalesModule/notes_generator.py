"""
Notes Generator for ImportaYa.ia Quotations
Generates automatic "NOTAS ADICIONALES" for FCL maritime quotations.
Combines static notes with dynamic data from CarrierContract and TransitTimeAverage.
"""
import logging
from typing import List, Dict, Optional
from datetime import date

logger = logging.getLogger(__name__)


STATIC_NOTES_FCL = [
    "Tarifas all in.",
    "Exoneración de garantías.",
    "Tarifas válidas para carga general, apilable, no peligrosa ni con sobredimensión.",
    "Notificaciones de eventos del contenedor durante su ruta de viaje vía notificaciones y alertas en tu APP = ImportaYAia.com",
    "Envío de la documentación de manera electrónica incluyendo el BL con firma digital-Ecas y aviso de llegada, todos los documentos podrán ser descargados vía APP.",
    "Tarifas sujetas a cambios por GRI anunciados por parte de las líneas navieras.",
    "Salida semanal.",
    "Acceso a nuestra APP IMPORTAYAIA.com en la que usted podrá monitorear sus cargas 24/7.",
    "Locales en destino sujetos a IVA local del 15%, IVA no incluido en valores totalizados de la cotización.",
]

INSURANCE_NOTE = (
    "Sugerimos que toda carga de importación esté amparada con la póliza de seguro que cubra "
    "todo riesgo desde el origen hasta la bodega del consignatario. En caso de algún siniestro "
    "FARLETZA S.A. no se hará responsable de cubrir ninguna suma de dinero, ni presentar ningún "
    "reclamo ante las líneas navieras o proveedores de origen. Nuestra cobertura de riesgo es "
    "desde el 0.45% del valor CIF asegurado. Con ImportaYa.ia NO aplica DEDUCIBLE, contrata "
    "nuestro SEGURO de Transporte IMPORTAYA.IA y evita perder tu inversión o tu negocio!"
)

STATIC_NOTES_LCL = [
    "Tarifas all in para carga consolidada.",
    "Tarifas válidas para carga general, apilable, no peligrosa ni con sobredimensión.",
    "Peso máximo por pieza: 2,000 kg.",
    "Dimensiones máximas por pieza: 5.9m x 2.35m x 2.39m (LxAxA).",
    "Cargos sujetos a peso/medida (W/M), se cobra el mayor.",
    "Notificaciones de eventos de su carga vía APP = ImportaYAia.com",
    "Acceso a nuestra APP IMPORTAYAIA.com en la que usted podrá monitorear sus cargas 24/7.",
    "Tarifas sujetas a cambios sin previo aviso.",
    "Locales en destino sujetos a IVA local del 15%.",
]

STATIC_NOTES_AEREO = [
    "Tarifas all in para carga aérea.",
    "Tarifas válidas para carga general, no peligrosa.",
    "Se cobra el mayor entre peso bruto y peso volumétrico (factor 167 kg/m³).",
    "Peso mínimo cobrable: 45 kg.",
    "Notificaciones de eventos de su carga vía APP = ImportaYAia.com",
    "Acceso a nuestra APP IMPORTAYAIA.com en la que usted podrá monitorear sus cargas 24/7.",
    "Tiempos de tránsito sujetos a disponibilidad de espacio.",
    "Tarifas sujetas a cambios sin previo aviso.",
    "Locales en destino sujetos a IVA local del 15%.",
]


def _get_carrier_contract(carrier_code: str) -> Optional[Dict]:
    """
    Fetch carrier contract from database.
    Returns dict with contract info or None if not found.
    """
    try:
        from .models import CarrierContract
        contract = CarrierContract.get_active_contract(carrier_code)
        if contract:
            return {
                'carrier_code': contract.carrier_code,
                'carrier_name': contract.carrier_name,
                'free_demurrage_days': contract.free_demurrage_days,
                'free_detention_days': contract.free_detention_days,
                'contract_validity': contract.contract_validity,
                'route_type': contract.route_type,
                'service_name': contract.service_name,
                'departure_day': contract.departure_day,
            }
    except Exception as e:
        logger.warning(f"Error fetching carrier contract for {carrier_code}: {e}")
    return None


def _get_transit_time(pol: str, pod: str, carrier_code: str = None) -> Optional[str]:
    """
    Fetch transit time from database.
    Returns estimated days string or None if not found.
    """
    try:
        from .models import TransitTimeAverage
        transit = TransitTimeAverage.get_transit_time(pol, pod, carrier_code)
        if transit:
            return transit.estimated_days
    except Exception as e:
        logger.warning(f"Error fetching transit time for {pol}-{pod}: {e}")
    return None


def _format_date_spanish(d: date) -> str:
    """Format date in Spanish format: DD de MES de YYYY"""
    months = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }
    return f"{d.day} de {months[d.month]} de {d.year}"


def get_fcl_notes(quote_context: Dict) -> List[str]:
    """
    Generate complete list of notes for FCL maritime quotation.
    
    Args:
        quote_context: Dictionary containing quote information:
            - carrier_code: str (e.g., 'MSK', 'CMA')
            - pol: str (Port of Loading UN/LOCODE)
            - pod: str (Port of Discharge UN/LOCODE)
            - pol_name: str (optional, port name)
            - pod_name: str (optional, port name)
    
    Returns:
        List of formatted note strings
    """
    notes = []
    
    carrier_code = quote_context.get('carrier_code', '').upper()
    pol = quote_context.get('pol', '').upper()
    pod = quote_context.get('pod', '').upper()
    
    notes.extend(STATIC_NOTES_FCL)
    
    contract = _get_carrier_contract(carrier_code) if carrier_code else None
    
    if contract:
        validity_date = _format_date_spanish(contract['contract_validity'])
        notes.append(
            f"Tarifa válida hasta {validity_date}. "
            f"Con {contract['carrier_code']} + Servicio Inteligente de Carga = IMPORTAYA.IA."
        )
        
        route_desc = "DIRECTA" if contract['route_type'] == 'DIRECTA' else "con TRASBORDO"
        notes.append(
            f"Servicio con RUTA {route_desc}, puede variar por parte de cada línea naviera."
        )
        
        notes.append(f"{contract['free_demurrage_days']} días libres de demoraje.")
        
        if contract['free_detention_days'] and contract['free_detention_days'] > 0:
            notes.append(f"{contract['free_detention_days']} días libres de detención.")
        
        if contract['departure_day']:
            notes.append(f"Frecuencia de salida: {contract['departure_day']}.")
    else:
        if carrier_code:
            notes.append(
                f"Tarifa con {carrier_code} + Servicio Inteligente de Carga = IMPORTAYA.IA."
            )
        notes.append("21 días libres de demoraje (estándar).")
    
    if pol and pod:
        transit_days = _get_transit_time(pol, pod, carrier_code)
        if transit_days:
            carrier_text = f"con {carrier_code}" if carrier_code else "estimado"
            notes.append(f"{transit_days} días de tránsito {carrier_text}.")
        else:
            notes.append("Tiempo de tránsito sujeto a itinerario de la naviera.")
    else:
        notes.append("Tiempo de tránsito sujeto a itinerario de la naviera.")
    
    notes.append(INSURANCE_NOTE)
    
    return notes


def get_lcl_notes(quote_context: Dict) -> List[str]:
    """
    Generate complete list of notes for LCL maritime quotation.
    
    Args:
        quote_context: Dictionary containing quote information
    
    Returns:
        List of formatted note strings
    """
    notes = []
    
    notes.extend(STATIC_NOTES_LCL)
    
    pol = quote_context.get('pol', '').upper()
    pod = quote_context.get('pod', '').upper()
    
    if pol and pod:
        transit_days = _get_transit_time(pol, pod)
        if transit_days:
            notes.append(f"{transit_days} días de tránsito estimado.")
        else:
            notes.append("Tiempo de tránsito sujeto a itinerario del consolidador.")
    
    notes.append(INSURANCE_NOTE)
    
    return notes


def get_aereo_notes(quote_context: Dict) -> List[str]:
    """
    Generate complete list of notes for Air Freight quotation.
    
    Args:
        quote_context: Dictionary containing quote information
    
    Returns:
        List of formatted note strings
    """
    notes = []
    
    notes.extend(STATIC_NOTES_AEREO)
    
    notes.append(INSURANCE_NOTE)
    
    return notes


def get_notes_by_transport(transport_type: str, quote_context: Dict) -> List[str]:
    """
    Get notes based on transport type.
    
    Args:
        transport_type: 'FCL', 'LCL', or 'AEREO'
        quote_context: Quote context dictionary
    
    Returns:
        List of formatted note strings
    """
    transport_type = transport_type.upper()
    
    if transport_type == 'FCL':
        return get_fcl_notes(quote_context)
    elif transport_type == 'LCL':
        return get_lcl_notes(quote_context)
    elif transport_type == 'AEREO':
        return get_aereo_notes(quote_context)
    else:
        logger.warning(f"Unknown transport type: {transport_type}, using FCL notes")
        return get_fcl_notes(quote_context)


def format_notes_for_display(notes: List[str], numbered: bool = True) -> str:
    """
    Format notes list for display.
    
    Args:
        notes: List of note strings
        numbered: Whether to add numbers to each note
    
    Returns:
        Formatted string with all notes
    """
    if numbered:
        formatted = []
        for i, note in enumerate(notes, 1):
            formatted.append(f"{i}. {note}")
        return "\n".join(formatted)
    else:
        return "\n• ".join([""] + notes).strip()


def format_notes_for_pdf(notes: List[str]) -> List[Dict]:
    """
    Format notes for PDF generation with ReportLab.
    
    Args:
        notes: List of note strings
    
    Returns:
        List of dicts with 'number' and 'text' keys
    """
    return [
        {'number': i, 'text': note}
        for i, note in enumerate(notes, 1)
    ]


def get_marketing_closing() -> str:
    """
    Generate the marketing closing section for quotations.
    This should appear at the very end of the document, after all legal notes.
    
    Returns:
        Formatted closing text with proper line breaks
    """
    closing = """¿HAS TENIDO DEMORAS EN LA LIBERACIÓN DE LA ECAS CON OTROS EMBARCADORES? OLVIDATE DE ESO, AQUI LA IA de IMPORTAYAIA.COM, TE LO HACE SIMPLE Y FACIL, TODO ES AUTOMATICO, DESCARGA TUS DOCUMENTOS DE EMBARQUE, E-CAS, todo directo desde la APP!

Agradezco la atención brindada, esperando nuestra propuesta sea siempre de su total agrado.
Quedamos atentos a sus instrucciones de embarque!

Atentamente,

IMPORTAYAIA.COM
Celular: 0969055893"""
    
    return closing


def get_complete_quotation_notes(transport_type: str, quote_context: Dict) -> List[str]:
    """
    Get complete quotation notes including the marketing closing.
    Combines transport-specific notes with the marketing closing section.
    
    Args:
        transport_type: 'FCL', 'LCL', or 'AEREO'
        quote_context: Quote context dictionary
    
    Returns:
        Complete list of notes with marketing closing as final item
    """
    notes = get_notes_by_transport(transport_type, quote_context)
    notes.append(get_marketing_closing())
    return notes
