"""
Quote PDF Generator for ImportaYa.ia
Generates professional quotation PDFs for FCL, LCL, and Aéreo transport types
with corporate branding and standardized format.
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    Image, HRFlowable, KeepTogether, PageBreak
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.utils import timezone
from decimal import Decimal
import io
import json


DEEP_OCEAN_BLUE = colors.HexColor('#0A2540')
AQUA_FLOW = colors.HexColor('#00C9B7')
VELOCITY_GREEN = colors.HexColor('#A4FF00')
LIGHT_GRAY = colors.HexColor('#F5F5F5')
MEDIUM_GRAY = colors.HexColor('#E0E0E0')
DARK_TEXT = colors.HexColor('#333333')
WHITE = colors.white

CARRIER_ABBREVIATIONS = {
    'EVERGREEN LINE': 'EMC',
    'COSCO SHIPPING LINES CO. LTD.': 'COSCO',
    'ORIENT OVERSEAS CONTAINER LINE': 'OOCL',
    'MEDITERRANEAN SHIPPING COMPANY': 'MSC',
    'Hapag Lloyd': 'HPL',
    'Maersk A/S trading as Sealand Americas.': 'SEALAND',
    'CMA-CGM': 'CMA-CGM',
    'HYUNDAI MERCHANT MARINE': 'HMM',
    'OCEAN NETWORK EXPRESS PTE. LTD.': 'ONE',
    'Pacific International Lines': 'PIL',
    'Wan Hai Lines Ltd.': 'WHL',
    'KING OCEAN SERVICES LTD': 'KOS',
    'ZIM INTEGRATED SHIPPING SERVICES': 'ZIM',
    'ZIM INTEGRATED SHIPPING': 'ZIM',
    'ZIM': 'ZIM',
}

EQUIVALENT_PORTS = {
    'GUANGZHOU': ['HUANGPU', 'GUANGZHOU', 'HUANGPU-GUANGZHOU'],
    'HUANGPU': ['HUANGPU', 'GUANGZHOU', 'HUANGPU-GUANGZHOU'],
    'HUANGPU-GUANGZHOU': ['HUANGPU', 'GUANGZHOU', 'HUANGPU-GUANGZHOU'],
    'TIANJIN': ['TIANJIN', 'XINGANG', 'TIANJIN-XINGANG'],
    'XINGANG': ['TIANJIN', 'XINGANG', 'TIANJIN-XINGANG'],
    'TIANJIN-XINGANG': ['TIANJIN', 'XINGANG', 'TIANJIN-XINGANG'],
    'SHENZHEN': ['SHENZHEN', 'SHEKOU', 'YANTIAN'],
    'SHEKOU': ['SHENZHEN', 'SHEKOU'],
    'YANTIAN': ['SHENZHEN', 'YANTIAN'],
}

CONSOLIDATED_PORT_NAMES = {
    'TIANJIN': 'TIANJIN-XINGANG',
    'XINGANG': 'TIANJIN-XINGANG',
    'TIANJIN-XINGANG': 'TIANJIN-XINGANG',
    'HUANGPU': 'HUANGPU-GUANGZHOU',
    'GUANGZHOU': 'HUANGPU-GUANGZHOU',
    'HUANGPU-GUANGZHOU': 'HUANGPU-GUANGZHOU',
}

PORT_SERVICE_CLASS = {
    'SHANGHAI': {'service': 'direct', 'transit_min': 33, 'transit_max': 37},
    'NINGBO': {'service': 'direct', 'transit_min': 33, 'transit_max': 37},
    'SHEKOU': {'service': 'direct', 'transit_min': 33, 'transit_max': 37},
    'SHENZHEN': {'service': 'direct', 'transit_min': 33, 'transit_max': 37},
    'HONG KONG': {'service': 'direct', 'transit_min': 33, 'transit_max': 37},
    'HONGKONG': {'service': 'direct', 'transit_min': 33, 'transit_max': 37},
    'QINGDAO': {'service': 'semi-direct', 'transit_min': 39, 'transit_max': 44},
    'KEELUNG': {'service': 'semi-direct', 'transit_min': 39, 'transit_max': 44},
    'KAOHSIUNG': {'service': 'semi-direct', 'transit_min': 39, 'transit_max': 44},
    'XIAMEN': {'service': 'transshipment', 'transit_min': 45, 'transit_max': 55},
    'HUANGPU': {'service': 'transshipment', 'transit_min': 45, 'transit_max': 55},
    'GUANGZHOU': {'service': 'transshipment', 'transit_min': 45, 'transit_max': 55},
    'HUANGPU-GUANGZHOU': {'service': 'transshipment', 'transit_min': 45, 'transit_max': 55},
    'TIANJIN': {'service': 'semi-direct', 'transit_min': 39, 'transit_max': 44},
    'XINGANG': {'service': 'semi-direct', 'transit_min': 39, 'transit_max': 44},
    'TIANJIN-XINGANG': {'service': 'semi-direct', 'transit_min': 39, 'transit_max': 44},
    'YANTIAN': {'service': 'direct', 'transit_min': 33, 'transit_max': 37},
}

def get_port_transit_time(port_name):
    """Get transit time range for a port based on service class"""
    port_upper = port_name.upper().strip()
    if port_upper in PORT_SERVICE_CLASS:
        info = PORT_SERVICE_CLASS[port_upper]
        return f"{info['transit_min']}-{info['transit_max']}"
    for key in PORT_SERVICE_CLASS:
        if key in port_upper or port_upper in key:
            info = PORT_SERVICE_CLASS[key]
            return f"{info['transit_min']}-{info['transit_max']}"
    return "35-45"

def get_consolidated_port_name(port_name):
    """Get the consolidated display name for a port"""
    port_upper = port_name.upper().strip()
    if port_upper in CONSOLIDATED_PORT_NAMES:
        return CONSOLIDATED_PORT_NAMES[port_upper]
    return port_name.upper()

def should_skip_duplicate_port(port_name, already_shown_ports):
    """Check if a port should be skipped because an equivalent is already shown"""
    port_upper = port_name.upper().strip()
    consolidated = get_consolidated_port_name(port_upper)
    if consolidated in already_shown_ports:
        return True
    if port_upper in EQUIVALENT_PORTS:
        for equiv in EQUIVALENT_PORTS[port_upper]:
            if equiv.upper() in already_shown_ports:
                return True
    return False

def get_carrier_abbreviation(carrier_name):
    """Get carrier abbreviation from full name"""
    if not carrier_name:
        return None
    carrier_upper = carrier_name.upper()
    for full_name, abbrev in CARRIER_ABBREVIATIONS.items():
        if full_name.upper() in carrier_upper or carrier_upper in full_name.upper():
            return abbrev
    words = carrier_name.split()
    if len(words) >= 2:
        return ''.join(w[0].upper() for w in words[:3] if w)
    return carrier_name[:5].upper() if len(carrier_name) > 5 else carrier_name.upper()

def get_equivalent_ports(port_name):
    """Get list of equivalent ports for a given port name"""
    port_upper = port_name.upper().strip()
    if port_upper in EQUIVALENT_PORTS:
        return EQUIVALENT_PORTS[port_upper]
    for key, equivalents in EQUIVALENT_PORTS.items():
        if port_upper in [e.upper() for e in equivalents]:
            return equivalents
    return [port_name]


def _detect_non_usd_currency(scenario_data):
    """
    Detect if the scenario contains any non-USD currencies.
    Returns True if any freight, origin costs, or local costs are in a currency other than USD.
    """
    if not scenario_data:
        return False
    
    non_usd_currencies = ['EUR', 'GBP', 'CNY', 'JPY', 'KRW']
    
    flete = scenario_data.get('flete', {})
    if isinstance(flete, dict):
        moneda = flete.get('moneda', 'USD')
        if moneda and moneda.upper() != 'USD':
            return True
        moneda_original = flete.get('moneda_original', 'USD')
        if moneda_original and moneda_original.upper() != 'USD':
            return True
    
    gastos_origen = scenario_data.get('gastos_origen_detalle', [])
    if isinstance(gastos_origen, list):
        for gasto in gastos_origen:
            if isinstance(gasto, dict):
                moneda = gasto.get('moneda', 'USD')
                if moneda and moneda.upper() != 'USD':
                    return True
    
    lineas = scenario_data.get('lineas', [])
    if isinstance(lineas, list):
        for linea in lineas:
            if isinstance(linea, dict):
                moneda = linea.get('moneda', 'USD')
                if moneda and moneda.upper() != 'USD':
                    return True
    
    if scenario_data.get('has_currency_conversion', False):
        return True
    
    return False


def get_custom_styles():
    """Create custom paragraph styles with ImportaYa.ia branding"""
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='QuoteTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=DEEP_OCEAN_BLUE,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='QuoteSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=DEEP_OCEAN_BLUE,
        alignment=TA_CENTER,
        spaceAfter=10,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=WHITE,
        backColor=DEEP_OCEAN_BLUE,
        alignment=TA_LEFT,
        spaceBefore=15,
        spaceAfter=5,
        leftIndent=5,
        rightIndent=5,
        fontName='Helvetica-Bold'
    ))
    
    styles['BodyText'].fontSize = 10
    styles['BodyText'].textColor = DARK_TEXT
    styles['BodyText'].alignment = TA_JUSTIFY
    styles['BodyText'].spaceAfter = 8
    styles['BodyText'].fontName = 'Helvetica'
    
    styles.add(ParagraphStyle(
        name='ClientInfo',
        parent=styles['Normal'],
        fontSize=10,
        textColor=DARK_TEXT,
        alignment=TA_LEFT,
        spaceAfter=3,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='TotalAmount',
        parent=styles['Normal'],
        fontSize=14,
        textColor=DEEP_OCEAN_BLUE,
        alignment=TA_RIGHT,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='Note',
        parent=styles['Normal'],
        fontSize=9,
        textColor=DARK_TEXT,
        alignment=TA_LEFT,
        spaceAfter=3,
        leftIndent=10,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.gray,
        alignment=TA_CENTER,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='Slogan',
        parent=styles['Normal'],
        fontSize=10,
        textColor=AQUA_FLOW,
        alignment=TA_CENTER,
        fontName='Helvetica-BoldOblique'
    ))
    
    return styles


def format_currency(value):
    """Format decimal value as USD currency"""
    if value is None:
        return "$ 0.00"
    if isinstance(value, str):
        try:
            value = Decimal(value)
        except:
            return "$ 0.00"
    return f"$ {value:,.2f}"


def get_transport_description(transport_type, container_type=None, incoterm="FOB", is_multiport_asia=False):
    """Get transport-specific description text"""
    if transport_type == 'FCL':
        if is_multiport_asia:
            return f"carga FCL Tarifario Puertos Bases ASIA, en términos {incoterm}"
        container_desc = container_type or "contenedor"
        return f"carga FCL-FCL ({container_desc}), en términos {incoterm}"
    elif transport_type == 'LCL':
        if is_multiport_asia:
            return f"carga LCL Tarifario Puertos Bases ASIA, en términos {incoterm}"
        return f"carga LCL (consolidado marítimo), en términos {incoterm}"
    elif transport_type == 'AEREO':
        return f"carga aérea, en términos {incoterm}"
    return f"carga {transport_type}, en términos {incoterm}"


def create_branded_logo():
    """Create branded logo with gradient-style text (Aqua Flow to Velocity Green)"""
    logo_table_data = [
        [
            Paragraph('<font color="#00C9B7"><b>Importa</b></font><font color="#A4FF00"><b>Ya.ia</b></font>', 
                      ParagraphStyle(
                          name='GradientLogo',
                          fontSize=24,
                          fontName='Helvetica-Bold',
                          alignment=TA_LEFT
                      ))
        ]
    ]
    
    logo_table = Table(logo_table_data, colWidths=[3*inch])
    logo_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    
    return logo_table


def create_header_table(quote_number, date_str):
    """Create the header with branded logo, quote number and date"""
    header_data = [
        [
            Paragraph('<font color="#00C9B7"><b>Importa</b></font><font color="#A4FF00"><b>Ya.ia</b></font>', 
                      ParagraphStyle(
                          name='GradientLogo',
                          fontSize=24,
                          fontName='Helvetica-Bold',
                          alignment=TA_LEFT
                      )),
            '',
            Paragraph(f'<b>Cotización No: {quote_number}</b>', ParagraphStyle(
                name='QuoteNum',
                fontSize=12,
                textColor=DEEP_OCEAN_BLUE,
                alignment=TA_RIGHT,
                fontName='Helvetica-Bold'
            ))
        ],
        [
            Paragraph('<i>La logística de carga integral, ahora es Inteligente!</i>', ParagraphStyle(
                name='SloganStyle',
                fontSize=9,
                textColor=AQUA_FLOW,
                fontName='Helvetica-Oblique'
            )),
            '',
            Paragraph(f'Guayaquil, {date_str}', ParagraphStyle(
                name='DateStyle',
                fontSize=10,
                textColor=DARK_TEXT,
                alignment=TA_RIGHT,
                fontName='Helvetica'
            ))
        ]
    ]
    
    header_table = Table(header_data, colWidths=[3*inch, 1*inch, 3*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    
    return header_table


def create_client_section(client_name, contact_name, city):
    """Create client information section"""
    styles = get_custom_styles()
    
    elements = [
        Spacer(1, 20),
        Paragraph("Señores", styles['ClientInfo']),
        Paragraph(f"<b>{client_name}</b>", styles['ClientInfo']),
        Paragraph(f"{city}.-", styles['ClientInfo']),
        Spacer(1, 10),
        Paragraph(f"Atención: <b>{contact_name}</b>", styles['ClientInfo']),
        Spacer(1, 10),
        Paragraph("De mis consideraciones:", styles['ClientInfo']),
        Spacer(1, 10),
    ]
    
    return elements


def create_intro_paragraph(transport_type, incoterm, destination, container_type=None, is_multiport_asia=False):
    """Create introduction paragraph based on transport type"""
    styles = get_custom_styles()
    
    transport_desc = get_transport_description(transport_type, container_type, incoterm, is_multiport_asia)
    
    text = f"""Por medio de la presente, nos es grato poner a su disposición nuestras tarifas para {transport_desc}, 
    con destino a <b>{destination}, ECUADOR</b>."""
    
    return Paragraph(text, styles['BodyText'])


def create_cargo_details_table(transport_type, quantity, volume_cbm, weight_kg):
    """Create cargo details table for LCL and AEREO quotes
    
    For LCL: Shows Pallets/Bultos, Volumen (mt3/WM), Peso (Ton.)
    For AEREO: Shows Pallets/Bultos, Volumen, Peso (Kilos)
    """
    header_style = ParagraphStyle(
        name='CargoDetailHeader',
        fontSize=9,
        textColor=DEEP_OCEAN_BLUE,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT
    )
    
    cell_style = ParagraphStyle(
        name='CargoDetailCell',
        fontSize=9,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    label_style = ParagraphStyle(
        name='CargoDetailLabel',
        fontSize=9,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_LEFT
    )
    
    if transport_type == 'LCL':
        weight_ton = float(weight_kg) / 1000
        data = [
            [
                Paragraph('<b>Detalle de la carga:</b>', header_style),
                '',
            ],
            [
                Paragraph('Pallets/Bultos:', label_style),
                Paragraph(str(quantity), cell_style),
            ],
            [
                Paragraph('Volumen (mt3/WM):', label_style),
                Paragraph(f"{float(volume_cbm):.1f}", cell_style),
            ],
            [
                Paragraph('Peso (Ton.):', label_style),
                Paragraph(f"{weight_ton:.3f}", cell_style),
            ],
        ]
    else:
        data = [
            [
                Paragraph('<b>Detalle de la carga:</b>', header_style),
                '',
            ],
            [
                Paragraph('Pallets/Bultos:', label_style),
                Paragraph(str(quantity), cell_style),
            ],
            [
                Paragraph('Volumen:', label_style),
                Paragraph(f"{float(volume_cbm):.0f}" if volume_cbm >= 1 else f"{float(volume_cbm):.2f}", cell_style),
            ],
            [
                Paragraph('Peso (Kilos):', label_style),
                Paragraph(f"{float(weight_kg):.0f}", cell_style),
            ],
        ]
    
    table = Table(data, colWidths=[1.5*inch, 0.8*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), WHITE),
        ('BACKGROUND', (0, 1), (0, -1), colors.Color(0.95, 0.95, 0.95)),
        ('BACKGROUND', (1, 1), (1, -1), WHITE),
        ('GRID', (0, 1), (-1, -1), 0.5, DEEP_OCEAN_BLUE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('SPAN', (0, 0), (1, 0)),
    ]))
    
    return table


def create_fcl_freight_table(origin, container_type, freight_rate, quantity=1, rates_by_container=None):
    """Create FCL maritime freight table with separate columns by container type"""
    total = Decimal(str(freight_rate)) * quantity
    
    container_display = container_type.replace('1x', '') if container_type else "40' HC"
    
    header_style = ParagraphStyle(
        name='TableHeader',
        fontSize=9,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    cell_style = ParagraphStyle(
        name='TableCell',
        fontSize=9,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    cell_highlight = ParagraphStyle(
        name='TableCellHighlight',
        fontSize=9,
        textColor=DEEP_OCEAN_BLUE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    if rates_by_container and len(rates_by_container) > 1:
        container_types = ["20' GP", "40' GP", "40' HC"]
        header_row = [Paragraph('<b>PUERTO</b>', header_style)]
        for ct in container_types:
            header_row.append(Paragraph(f'<b>{ct}</b>', header_style))
        header_row.append(Paragraph('<b>Cant.</b>', header_style))
        header_row.append(Paragraph('<b>Total</b>', header_style))
        
        data_row = [Paragraph(origin.upper(), cell_style)]
        
        def normalize_container(c):
            """Normalize container type for comparison (e.g., '1x40HC' -> '40hc')"""
            return c.lower().replace('1x', '').replace("'", "").replace(" ", "").replace("gp", "gp").replace("hc", "hc")
        
        normalized_selected = normalize_container(container_type or "40HC")
        
        for ct in container_types:
            rate_key = ct.replace("' ", "").replace("'", "").lower()
            rate = rates_by_container.get(rate_key, rates_by_container.get(ct, Decimal('0')))
            normalized_ct = normalize_container(ct)
            is_selected = normalized_ct == normalized_selected
            if is_selected:
                data_row.append(Paragraph(f'<b>{format_currency(rate)}</b>', cell_highlight))
            else:
                data_row.append(Paragraph(format_currency(rate), cell_style))
        
        data_row.append(Paragraph(str(quantity), cell_style))
        data_row.append(Paragraph(format_currency(total), cell_style))
        
        data = [header_row, data_row]
        
        table = Table(data, colWidths=[1.3*inch, 1*inch, 1*inch, 1*inch, 0.6*inch, 1.1*inch])
    else:
        data = [
            [
                Paragraph('<b>PUERTO</b>', header_style),
                Paragraph(f"<b>CONTENEDOR {container_display}</b>", header_style),
                Paragraph('<b>Cant.</b>', header_style),
                Paragraph('<b>Total</b>', header_style)
            ],
            [
                Paragraph(origin.upper(), cell_style),
                Paragraph(format_currency(freight_rate), cell_style),
                Paragraph(str(quantity), cell_style),
                Paragraph(format_currency(total), cell_style)
            ]
        ]
        
        table = Table(data, colWidths=[2*inch, 1.5*inch, 1*inch, 1.5*inch])
    
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_OCEAN_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, MEDIUM_GRAY),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    return table, total


def create_fcl_multiport_tarifario_table(ports_data, destination='GUAYAQUIL'):
    """
    Create FCL multi-port tarifario table with individual rows per port.
    Consolidates duplicate ports (e.g., Tianjin/Xingang, Huangpu/Guangzhou).
    Uses pre-defined transit times based on port service class.
    
    Args:
        ports_data: List of dicts with keys: pol, validity, free_days, transit_time, cost_20gp, cost_40gp, cost_40hc
        destination: Destination port name
        
    Returns:
        Table element for the PDF
    """
    header_style = ParagraphStyle(
        name='TarifarioHeader',
        fontSize=8,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    cell_style = ParagraphStyle(
        name='TarifarioCell',
        fontSize=8,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    cell_bold = ParagraphStyle(
        name='TarifarioCellBold',
        fontSize=7,
        textColor=DEEP_OCEAN_BLUE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    header_row = [
        Paragraph('<b>PUERTO</b>', header_style),
        Paragraph('<b>VALIDEZ</b>', header_style),
        Paragraph("<b>DÍAS LIBRES</b>", header_style),
        Paragraph('<b>T. T.</b>', header_style),
        Paragraph("<b>20' GP</b>", header_style),
        Paragraph("<b>40' GP</b>", header_style),
        Paragraph("<b>40' HC</b>", header_style),
    ]
    
    data = [header_row]
    shown_ports = set()
    
    for port_info in ports_data:
        pol = port_info.get('pol', 'N/A')
        pol_upper = pol.upper().strip()
        
        consolidated_name = get_consolidated_port_name(pol_upper)
        if should_skip_duplicate_port(pol_upper, shown_ports):
            continue
        shown_ports.add(consolidated_name)
        shown_ports.add(pol_upper)
        
        validity = port_info.get('validity', 'N/A')
        if hasattr(validity, 'strftime'):
            validity = validity.strftime('%d/%m/%Y')
        free_days = str(port_info.get('free_days', 21))
        
        transit = get_port_transit_time(consolidated_name)
        
        cost_20 = format_currency(port_info.get('cost_20gp', 0))
        cost_40gp = format_currency(port_info.get('cost_40gp', 0))
        cost_40hc = format_currency(port_info.get('cost_40hc', 0))
        
        display_name = consolidated_name.replace('-', '\u2011')
        
        row = [
            Paragraph(display_name, cell_bold),
            Paragraph(str(validity), cell_style),
            Paragraph(free_days, cell_style),
            Paragraph(str(transit), cell_style),
            Paragraph(cost_20, cell_style),
            Paragraph(cost_40gp, cell_style),
            Paragraph(cost_40hc, cell_style),
        ]
        data.append(row)
    
    col_widths = [1.2*inch, 0.8*inch, 0.65*inch, 0.65*inch, 0.85*inch, 0.85*inch, 0.85*inch]
    table = Table(data, colWidths=col_widths)
    
    style_commands = [
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_OCEAN_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
    ]
    
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), LIGHT_GRAY))
        else:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), WHITE))
    
    table.setStyle(TableStyle(style_commands))
    
    return table


def create_lcl_multiport_tarifario_table(ports_data, destination='GUAYAQUIL'):
    """
    Create LCL multi-port tarifario table with individual rows per port.
    Consolidates duplicate ports and uses pre-defined transit times.
    
    Args:
        ports_data: List of dicts with keys: pol, validity, free_days, transit_time, rate_per_cbm, min_charge
        destination: Destination port name
        
    Returns:
        Table element for the PDF
    """
    header_style = ParagraphStyle(
        name='TarifarioHeader',
        fontSize=8,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    cell_style = ParagraphStyle(
        name='TarifarioCell',
        fontSize=8,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    cell_bold = ParagraphStyle(
        name='TarifarioCellBold',
        fontSize=7,
        textColor=DEEP_OCEAN_BLUE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    header_row = [
        Paragraph('<b>PUERTO</b>', header_style),
        Paragraph('<b>VALIDEZ</b>', header_style),
        Paragraph("<b>DÍAS LIBRES</b>", header_style),
        Paragraph('<b>T. T.</b>', header_style),
        Paragraph("<b>USD/W-M</b>", header_style),
        Paragraph("<b>MÍNIMO</b>", header_style),
    ]
    
    data = [header_row]
    shown_ports = set()
    
    for port_info in ports_data:
        pol = port_info.get('pol', 'N/A')
        pol_upper = pol.upper().strip()
        
        consolidated_name = get_consolidated_port_name(pol_upper)
        if should_skip_duplicate_port(pol_upper, shown_ports):
            continue
        shown_ports.add(consolidated_name)
        shown_ports.add(pol_upper)
        
        validity = port_info.get('validity', 'N/A')
        if hasattr(validity, 'strftime'):
            validity = validity.strftime('%d/%m/%Y')
        free_days = str(port_info.get('free_days', 21))
        
        transit = get_port_transit_time(consolidated_name)
        
        rate_cbm = format_currency(port_info.get('rate_per_cbm', port_info.get('lcl_rate_per_cbm', 0)))
        min_charge = format_currency(port_info.get('min_charge', port_info.get('lcl_min_charge', 0)))
        
        display_name = consolidated_name.replace('-', '\u2011')
        
        row = [
            Paragraph(display_name, cell_bold),
            Paragraph(str(validity), cell_style),
            Paragraph(free_days, cell_style),
            Paragraph(str(transit), cell_style),
            Paragraph(rate_cbm, cell_style),
            Paragraph(min_charge, cell_style),
        ]
        data.append(row)
    
    col_widths = [1.4*inch, 0.85*inch, 0.7*inch, 0.7*inch, 1*inch, 1*inch]
    table = Table(data, colWidths=col_widths)
    
    style_commands = [
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_OCEAN_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), LIGHT_GRAY))
        else:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), WHITE))
    
    table.setStyle(TableStyle(style_commands))
    
    return table


def create_lcl_freight_table(origin, cbm_rate, weight_ton_rate, volume_cbm, weight_kg, quantity=1):
    """Create LCL maritime freight table"""
    weight_ton = Decimal(str(weight_kg)) / 1000 if weight_kg else Decimal('0')
    volume = Decimal(str(volume_cbm)) if volume_cbm else Decimal('1')
    
    cbm_total = Decimal(str(cbm_rate)) * volume
    ton_total = Decimal(str(weight_ton_rate)) * weight_ton
    chargeable = max(cbm_total, ton_total)
    
    min_rate = Decimal(str(cbm_rate)) * 1
    final_rate = max(chargeable, min_rate)
    
    header_style = ParagraphStyle(
        name='TableHeader',
        fontSize=10,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    cell_style = ParagraphStyle(
        name='TableCell',
        fontSize=10,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    data = [
        [
            Paragraph('<b>PUERTO</b>', header_style),
            Paragraph('<b>CBM</b>', header_style),
            Paragraph('<b>$/CBM</b>', header_style),
            Paragraph('<b>TON</b>', header_style),
            Paragraph('<b>$/TON</b>', header_style),
            Paragraph('<b>Total</b>', header_style)
        ],
        [
            Paragraph(origin.upper(), cell_style),
            Paragraph(f"{volume:.2f}", cell_style),
            Paragraph(format_currency(cbm_rate), cell_style),
            Paragraph(f"{weight_ton:.2f}", cell_style),
            Paragraph(format_currency(weight_ton_rate), cell_style),
            Paragraph(format_currency(final_rate), cell_style)
        ]
    ]
    
    table = Table(data, colWidths=[1.5*inch, 0.8*inch, 1*inch, 0.8*inch, 1*inch, 1.2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_OCEAN_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, MEDIUM_GRAY),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    return table, final_rate


def create_aereo_freight_table(origin, kg_rate, weight_kg, quantity=1):
    """Create air freight table"""
    weight = Decimal(str(weight_kg)) if weight_kg else Decimal('100')
    rate = Decimal(str(kg_rate))
    
    calculated = rate * weight
    min_charge = Decimal('85.00')
    total = max(calculated, min_charge)
    
    header_style = ParagraphStyle(
        name='TableHeader',
        fontSize=10,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    cell_style = ParagraphStyle(
        name='TableCell',
        fontSize=10,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    data = [
        [
            Paragraph('<b>AEROPUERTO</b>', header_style),
            Paragraph('<b>Peso (KG)</b>', header_style),
            Paragraph('<b>$/KG</b>', header_style),
            Paragraph('<b>Mínimo</b>', header_style),
            Paragraph('<b>Total</b>', header_style)
        ],
        [
            Paragraph(origin.upper(), cell_style),
            Paragraph(f"{weight:.2f}", cell_style),
            Paragraph(format_currency(rate), cell_style),
            Paragraph(format_currency(min_charge), cell_style),
            Paragraph(format_currency(total), cell_style)
        ]
    ]
    
    table = Table(data, colWidths=[1.5*inch, 1.2*inch, 1*inch, 1*inch, 1.2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_OCEAN_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, MEDIUM_GRAY),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    return table, total


def get_fcl_local_costs_from_db(carrier_code=None, port='GYE'):
    """
    Fetch FCL local costs from database for a specific carrier.
    Returns dict with cost values or None if not found.
    """
    from SalesModule.models import LocalDestinationCost
    
    costs = {}
    code_mapping = {
        'VISTO_BUENO': 'visto_bueno',
        'THC_DESTINO': 'thc',
        'LOCALES_CNTR': 'locales_cntr',
        'HANDLING': 'handling',
        'LOCALES_MBL': 'locales_mbl',
    }
    
    for db_code, key in code_mapping.items():
        record = LocalDestinationCost.objects.filter(
            transport_type='MARITIMO_FCL',
            code=db_code,
            carrier_code=carrier_code,
            port=port,
            is_active=True
        ).first()
        
        if record:
            costs[key] = record.cost_usd
    
    return costs if costs else None


def get_highest_fcl_local_costs(carriers, port='GYE'):
    """
    For multi-port quotations, get the highest local costs across all carriers.
    This ensures the quote covers all possible scenarios.
    """
    from SalesModule.models import LocalDestinationCost
    from django.db.models import Max
    
    carrier_abbrev_to_code = {
        'EMC': 'EMC',
        'COSCO': 'COSCO',
        'OOCL': 'OOCL',
        'MSC': 'MSC',
        'ONE': 'ONE',
        'HPG': 'HPG',
        'MAERSK': 'MAERSK',
        'CMA': 'CMA',
        'HMM': 'HMM',
        'WHL': 'WHL',
        'SBM': 'SBM',
        'PIL': 'PIL',
        'MARFRET': 'MARFRET',
        'ZIM': 'ZIM',
        'YML': 'YML',
    }
    
    carrier_codes = []
    for c in carriers:
        abbrev = get_carrier_abbreviation(c)
        code = carrier_abbrev_to_code.get(abbrev, abbrev)
        carrier_codes.append(code)
    
    costs = {}
    code_mapping = {
        'VISTO_BUENO': 'visto_bueno',
        'THC_DESTINO': 'thc',
        'LOCALES_CNTR': 'locales_cntr',
        'HANDLING': 'handling',
        'LOCALES_MBL': 'locales_mbl',
    }
    
    for db_code, key in code_mapping.items():
        max_cost = LocalDestinationCost.objects.filter(
            transport_type='MARITIMO_FCL',
            code=db_code,
            carrier_code__in=carrier_codes,
            is_active=True
        ).aggregate(max_val=Max('cost_usd'))['max_val']
        
        if max_cost:
            costs[key] = max_cost
    
    return costs if costs else None


def create_local_costs_table_fcl(costs, quantity=1, carrier_code=None, carriers_list=None, is_multiport=False):
    """
    Create local costs table for FCL with 3 consolidated concepts:
    - THC Destino (EXENTO IVA, unidad CONTENEDOR)
    - Locales Destino por BL (aplica IVA, unidad BL) = Visto Bueno + Locales MBL consolidados
    - Locales Destino por Contenedor (aplica IVA, unidad CONTENEDOR) = Locales CNTR + Handling consolidados
    
    If carrier_code provided, fetches from DB for that carrier.
    If carriers_list provided (multi-port), uses highest costs across carriers.
    For multi-port quotes: quantity is forced to 1, DB costs take priority over scenario costs.
    """
    header_style = ParagraphStyle(
        name='TableHeader',
        fontSize=9,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    cell_style = ParagraphStyle(
        name='TableCell',
        fontSize=9,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    cell_left = ParagraphStyle(
        name='TableCellLeft',
        fontSize=9,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_LEFT
    )
    
    iva_yes = ParagraphStyle(
        name='IvaYes',
        fontSize=8,
        textColor=AQUA_FLOW,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    iva_no = ParagraphStyle(
        name='IvaNo',
        fontSize=8,
        textColor=colors.gray,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    default_costs = {
        'visto_bueno': Decimal('60.00'),
        'thc': Decimal('200.00'),
        'locales_cntr': Decimal('450.00'),
        'handling': Decimal('50.00'),
        'locales_mbl': Decimal('100.00'),
    }
    
    db_costs = None
    if carriers_list:
        db_costs = get_highest_fcl_local_costs(carriers_list)
    elif carrier_code:
        abbrev = get_carrier_abbreviation(carrier_code)
        db_costs = get_fcl_local_costs_from_db(abbrev)
    
    if db_costs:
        for key, value in db_costs.items():
            default_costs[key] = value
    
    if not carriers_list:
        for key in default_costs:
            if key in costs:
                default_costs[key] = Decimal(str(costs[key]))
    
    locales_bl = default_costs['visto_bueno'] + default_costs['locales_mbl']
    locales_cntr = default_costs['locales_cntr'] + default_costs['handling']
    thc = default_costs['thc']
    
    data = [
        [
            Paragraph('<b>CONCEPTO</b>', header_style),
            Paragraph('<b>Valor Unit.</b>', header_style),
            Paragraph('<b>Cant.</b>', header_style),
            Paragraph('<b>Total</b>', header_style),
            Paragraph('<b>Unidad</b>', header_style),
            Paragraph('<b>IVA</b>', header_style)
        ],
        [
            Paragraph('THC DESTINO', cell_left),
            Paragraph(format_currency(thc), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(thc * quantity), cell_style),
            Paragraph('CONTENEDOR', cell_style),
            Paragraph('NO APLICA IVA', iva_no)
        ],
        [
            Paragraph('LOCALES DESTINO POR BL', cell_left),
            Paragraph(format_currency(locales_bl), cell_style),
            Paragraph('1', cell_style),
            Paragraph(format_currency(locales_bl), cell_style),
            Paragraph('BL', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('LOCALES DESTINO POR CONTENEDOR', cell_left),
            Paragraph(format_currency(locales_cntr), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(locales_cntr * quantity), cell_style),
            Paragraph('CONTENEDOR', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
    ]
    
    table = Table(data, colWidths=[2.2*inch, 0.9*inch, 0.6*inch, 0.9*inch, 1*inch, 1.1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_OCEAN_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, MEDIUM_GRAY),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    subtotal_iva = locales_bl + (locales_cntr * quantity)
    thc_total = thc * quantity
    
    return table, subtotal_iva, thc_total


def calculate_collect_fee_lcl(total_freight, origin_costs=Decimal('0'), min_fee=Decimal('15.00')):
    """
    Calculate LCL collect fee (ISD) = 6% of (freight + origin costs) or minimum, whichever is greater.
    Returns tuple: (base_fee, iva_amount, total_with_iva)
    """
    base_for_calc = Decimal(str(total_freight)) + Decimal(str(origin_costs))
    calculated_fee = base_for_calc * Decimal('0.06')
    base_fee = max(calculated_fee, min_fee)
    iva_amount = base_fee * Decimal('0.15')
    return base_fee, iva_amount, base_fee + iva_amount


def create_local_costs_table_lcl(costs, quantity=1, total_freight=Decimal('0'), origin_costs=Decimal('0'), cbm=Decimal('1')):
    """
    Create local costs table for LCL with collect fee calculation.
    - Desconsolidación: $20/CBM or min $135/BL
    - Locales destino: $100/BL
    - Collect Fee (ISD): 6% of (freight + origin) or min $15, whichever greater + 15% IVA
    """
    header_style = ParagraphStyle(
        name='TableHeader',
        fontSize=9,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    cell_style = ParagraphStyle(
        name='TableCell',
        fontSize=9,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    cell_left = ParagraphStyle(
        name='TableCellLeft',
        fontSize=9,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_LEFT
    )
    
    iva_yes = ParagraphStyle(
        name='IvaYes',
        fontSize=8,
        textColor=AQUA_FLOW,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    iva_no = ParagraphStyle(
        name='IvaNo',
        fontSize=8,
        textColor=colors.gray,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    collect_style = ParagraphStyle(
        name='CollectFee',
        fontSize=8,
        textColor=colors.HexColor('#FF6600'),
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    descons_per_cbm = Decimal('20.00')
    descons_min = Decimal('135.00')
    descons_calculated = descons_per_cbm * Decimal(str(cbm))
    descons_total = max(descons_calculated, descons_min)
    
    locales_bl = Decimal('100.00')
    
    collect_base, collect_iva, collect_total = calculate_collect_fee_lcl(total_freight, origin_costs)
    
    for key in costs:
        if key == 'desconsolidacion':
            descons_total = Decimal(str(costs[key]))
        elif key == 'locales_bl':
            locales_bl = Decimal(str(costs[key]))
    
    data = [
        [
            Paragraph('<b>CONCEPTO</b>', header_style),
            Paragraph('<b>Valor</b>', header_style),
            Paragraph('<b>Cant.</b>', header_style),
            Paragraph('<b>Total</b>', header_style),
            Paragraph('<b>Unidad</b>', header_style),
            Paragraph('<b>IVA</b>', header_style)
        ],
        [
            Paragraph('DESCONSOLIDACIÓN LCL', cell_left),
            Paragraph(f'$20/CBM o mín $135', cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(descons_total * quantity), cell_style),
            Paragraph('BL', cell_style),
            Paragraph('NO APLICA IVA', iva_no)
        ],
        [
            Paragraph('LOCALES DESTINO LCL', cell_left),
            Paragraph(format_currency(locales_bl), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(locales_bl * quantity), cell_style),
            Paragraph('BL', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('COLLECT FEE / ISD (6%)', cell_left),
            Paragraph(f'6% Flete o mín $15', cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(collect_base * quantity), cell_style),
            Paragraph('BL', cell_style),
            Paragraph('APLICA IVA', collect_style)
        ],
    ]
    
    table = Table(data, colWidths=[2.2*inch, 0.9*inch, 0.6*inch, 0.9*inch, 1*inch, 1.1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_OCEAN_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, MEDIUM_GRAY),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    subtotal_iva = (locales_bl + collect_base) * quantity
    subtotal_no_iva = descons_total * quantity
    
    return table, subtotal_iva, subtotal_no_iva, collect_base * quantity


def calculate_collect_fee_aereo(total_freight, origin_costs=Decimal('0'), min_fee=Decimal('25.00')):
    """
    Calculate AEREO collect fee (ISD) = 6% of (freight + origin costs) or minimum $25, whichever is greater.
    Returns tuple: (base_fee, iva_amount, total_with_iva)
    """
    base_for_calc = Decimal(str(total_freight)) + Decimal(str(origin_costs))
    calculated_fee = base_for_calc * Decimal('0.06')
    base_fee = max(calculated_fee, min_fee)
    iva_amount = base_fee * Decimal('0.15')
    return base_fee, iva_amount, base_fee + iva_amount


def create_local_costs_table_aereo(costs, quantity=1, total_freight=Decimal('0'), origin_costs=Decimal('0')):
    """
    Create local costs table for Aéreo with collect fee calculation.
    From Excel: Corte Guía $35, Admin Fee $50, Handling $50, Desconsolidación $15
    + Collect Fee (ISD): 6% of (freight + origin) or min $25, whichever greater + 15% IVA
    """
    header_style = ParagraphStyle(
        name='TableHeader',
        fontSize=9,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    cell_style = ParagraphStyle(
        name='TableCell',
        fontSize=9,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    cell_left = ParagraphStyle(
        name='TableCellLeft',
        fontSize=9,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_LEFT
    )
    
    iva_yes = ParagraphStyle(
        name='IvaYes',
        fontSize=8,
        textColor=AQUA_FLOW,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    collect_style = ParagraphStyle(
        name='CollectFee',
        fontSize=8,
        textColor=colors.HexColor('#FF6600'),
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    default_costs = {
        'corte_guia': Decimal('35.00'),
        'admin_fee': Decimal('50.00'),
        'handling': Decimal('50.00'),
        'desconsolidacion': Decimal('15.00'),
    }
    
    collect_base, collect_iva, collect_total = calculate_collect_fee_aereo(total_freight, origin_costs)
    
    for key in default_costs:
        if key in costs:
            default_costs[key] = Decimal(str(costs[key]))
    
    data = [
        [
            Paragraph('<b>CONCEPTO</b>', header_style),
            Paragraph('<b>Valor</b>', header_style),
            Paragraph('<b>Cant.</b>', header_style),
            Paragraph('<b>Total</b>', header_style),
            Paragraph('<b>Unidad</b>', header_style),
            Paragraph('<b>IVA</b>', header_style)
        ],
        [
            Paragraph('CORTE DE GUÍA', cell_left),
            Paragraph(format_currency(default_costs['corte_guia']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['corte_guia'] * quantity), cell_style),
            Paragraph('AWB', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('ADMIN FEE', cell_left),
            Paragraph(format_currency(default_costs['admin_fee']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['admin_fee'] * quantity), cell_style),
            Paragraph('AWB', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('HANDLING AÉREO', cell_left),
            Paragraph(format_currency(default_costs['handling']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['handling'] * quantity), cell_style),
            Paragraph('AWB', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('DESCONSOLIDACIÓN GUÍA', cell_left),
            Paragraph(format_currency(default_costs['desconsolidacion']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['desconsolidacion'] * quantity), cell_style),
            Paragraph('AWB', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('COLLECT FEE / ISD (6%)', cell_left),
            Paragraph(f'6% Flete o mín $25', cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(collect_base * quantity), cell_style),
            Paragraph('AWB', cell_style),
            Paragraph('APLICA IVA', collect_style)
        ],
    ]
    
    table = Table(data, colWidths=[2.2*inch, 0.9*inch, 0.6*inch, 0.9*inch, 1*inch, 1.1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_OCEAN_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, MEDIUM_GRAY),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    subtotal_iva = (default_costs['corte_guia'] + default_costs['admin_fee'] + 
                    default_costs['handling'] + default_costs['desconsolidacion'] + 
                    collect_base) * quantity
    
    return table, subtotal_iva, Decimal('0'), collect_base * quantity


def create_totals_section(freight_total, thc_total, local_iva_total, origin):
    """Create totals summary section for FCL"""
    styles = get_custom_styles()
    
    subtotal_flete_thc = freight_total + thc_total
    total_oferta = subtotal_flete_thc + local_iva_total
    
    totals_data = [
        [f'PUERTO:', origin.upper(), '', ''],
        ['', '', '', ''],
        ['Subtotal flete + THC:', '', '', format_currency(subtotal_flete_thc)],
        ['Subtotal gastos locales en destino (Sujeto a IVA):', '', '', format_currency(local_iva_total)],
        ['', '', '', ''],
        ['TOTAL DE LA OFERTA:', '', '', format_currency(total_oferta)],
    ]
    
    totals_table = Table(totals_data, colWidths=[3.5*inch, 1*inch, 1*inch, 1.5*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('TEXTCOLOR', (0, -1), (-1, -1), DEEP_OCEAN_BLUE),
        ('LINEABOVE', (0, -1), (-1, -1), 2, AQUA_FLOW),
        ('TOPPADDING', (0, -1), (-1, -1), 10),
    ]))
    
    return totals_table, total_oferta


def create_totals_section_lcl(freight_total, local_costs_no_iva, local_costs_iva, origin):
    """Create totals summary section for LCL - separate freight and local costs with IVA breakdown"""
    styles = get_custom_styles()
    
    total_local_costs = local_costs_no_iva + local_costs_iva
    total_oferta = freight_total + total_local_costs
    
    totals_data = [
        [f'PUERTO:', origin.upper(), '', ''],
        ['', '', '', ''],
        ['Total FLETE LCL (No aplica IVA):', '', '', format_currency(freight_total)],
        ['Total gastos locales en destino LCL:', '', '', format_currency(total_local_costs)],
        ['  (IVA no incluido - Ver detalle IVA en tabla)', '', '', ''],
        ['', '', '', ''],
        ['TOTAL DE LA OFERTA:', '', '', format_currency(total_oferta)],
    ]
    
    totals_table = Table(totals_data, colWidths=[3.5*inch, 1*inch, 1*inch, 1.5*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTSIZE', (0, 4), (0, 4), 8),
        ('TEXTCOLOR', (0, 4), (0, 4), colors.gray),
        ('FONTNAME', (0, 4), (0, 4), 'Helvetica-Oblique'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('TEXTCOLOR', (0, -1), (-1, -1), DEEP_OCEAN_BLUE),
        ('LINEABOVE', (0, -1), (-1, -1), 2, AQUA_FLOW),
        ('TOPPADDING', (0, -1), (-1, -1), 10),
    ]))
    
    return totals_table, total_oferta


def create_notes_section_fcl(transit_days, free_days, carrier_name=None, validity_date=None, is_multiport=False, has_emc=False, has_non_usd_currency=False):
    """Create additional notes section for FCL"""
    styles = get_custom_styles()
    
    validity_note_style = ParagraphStyle(
        name='ValidityNote',
        fontSize=10,
        textColor=DEEP_OCEAN_BLUE,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT,
        spaceAfter=8,
        leftIndent=10
    )
    
    carrier_note_style = ParagraphStyle(
        name='CarrierNote',
        fontSize=9,
        textColor=AQUA_FLOW,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT,
        spaceAfter=6,
        leftIndent=10,
        backColor=colors.HexColor('#F0FFFE')
    )
    
    emc_warning_style = ParagraphStyle(
        name='EmcWarning',
        fontSize=8,
        textColor=colors.HexColor('#CC0000'),
        fontName='Helvetica-Bold',
        alignment=TA_LEFT,
        spaceAfter=6,
        leftIndent=10,
        borderColor=colors.HexColor('#CC0000'),
        borderWidth=1,
        borderPadding=5
    )
    
    notes = []
    
    if validity_date and not is_multiport:
        notes.append(f"*** TARIFA VÁLIDA HASTA: {validity_date} ***")
    
    notes.extend([
        "Tarifas all in.",
        "Exoneración de garantías.",
        "Tarifas válidas para carga general, apilable, no peligrosa ni con sobredimensión.",
        "Notificaciones de eventos del contenedor durante su ruta de viaje vía APP = ImportaYAia.com",
        "Envío de la documentación de manera electrónica incluyendo el BL con firma digital-Ecas y aviso de llegada, todos los documentos podrán ser descargados vía APP.",
        "Tarifas sujetas a cambios por GRI anunciados por parte de las líneas navieras.",
        "Salida semanal.",
    ])
    
    if not is_multiport:
        notes.append(f"{free_days} días libres de demoraje en destino POD Guayaquil.")
        notes.append(f"Tránsito estimado {transit_days} días aprox. (Podría variar por parte de la naviera).")
    else:
        notes.append("Días libres y tiempo de tránsito varían según puerto de origen (ver tabla).")
    
    notes.append("Acceso a nuestra APP IMPORTAYAIA.com en la que usted podrá monitorear sus cargas 24/7.")
    notes.append("Con ImportaYa.ia el SEGURO de Transporte NO aplica DEDUCIBLE, contrata nuestro seguro y evita perder tu inversión!")
    if has_non_usd_currency:
        notes.append("Cotización en USD. Tipo de cambio referencial, pudiendo variar al momento del pago.")
    notes.append("Locales en destino sujetos a IVA local del 15%, IVA no incluido en valores totalizados de la cotización.")
    notes.append("Tarifas cotizadas NO aplican para cargas BONDED, no domésticas, cargas peligrosas DG Cargo o IMO cargo, cargas con sobredimensión o sobrepeso, tampoco aplican para cargas NO APILABLES. En esos casos favor ingresar comentarios e información al solicitar cotización para recibir una cotización manual en 24 horas o menos vía nuestra APP: ImportaYAia.com")
    notes.append("Nuestra APP cuenta con COBERTURA todo riesgo desde la bodega del FABRICANTE en origen hasta la puerta de su bodega o sitio final de entrega en destino, indistinto del INCOTERM de la IMPORTACIÓN y no aplica ningún DEDUCIBLE en caso de siniestros de sus cargas e inversiones. *Aplican términos legales y condiciones del servicio y cobertura contratada vía APP*")
    
    elements = []
    for i, note in enumerate(notes):
        if i == 0 and validity_date and not is_multiport:
            elements.append(Paragraph(f"<b>{note}</b>", validity_note_style))
        else:
            elements.append(Paragraph(f"• {note}", styles['Note']))
    
    if carrier_name:
        elements.append(Spacer(1, 10))
        if is_multiport:
            carrier_text = f"<b>NAVIERAS UTILIZADAS EN TARIFARIO IA:</b> {carrier_name}"
        else:
            carrier_text = f"<b>NAVIERA SELECCIONADA:</b> {carrier_name} + Servicio Inteligente de Carga = IMPORTAYA.IA"
        elements.append(Paragraph(carrier_text, carrier_note_style))
    
    if has_emc:
        elements.append(Spacer(1, 10))
        emc_note = (
            "<b>NOTA IMPORTANTE EMC (EVERGREEN):</b> En caso de utilizar la línea naviera EMC, "
            "dicha naviera trabaja con patios TASESA y ARETINA, los cuales cobran por devolución de "
            "contenedor vacío, un Handling de aprox. USD $95.00 más IVA 15% por cada contenedor. "
            "Dicho costo NO está incluido en nuestra cotización y corre por cuenta del CNEE/importador."
        )
        elements.append(Paragraph(emc_note, emc_warning_style))
    
    return elements


def create_notes_section_lcl(transit_days):
    """Create additional notes section for LCL"""
    styles = get_custom_styles()
    
    notes = [
        "Tarifas all in para carga consolidada.",
        "Peso tasable: Mayor entre CBM y TON (peso/volumen).",
        "Mínimo de cobro: Tarifa CBM × 1.",
        "Tarifas válidas para carga general, no peligrosa.",
        "Notificaciones de tracking vía APP y email.",
        "Acceso a nuestra APP ImportaYa.ia para monitorear sus cargas 24/7.",
        f"Tránsito estimado {transit_days} días aprox.",
        "Locales en destino sujetos a IVA local del 15%.",
        "Tarifas cotizadas NO aplican para cargas BONDED, no domésticas, cargas peligrosas DG Cargo o IMO cargo, cargas con sobredimensión o sobrepeso, tampoco aplican para cargas NO APILABLES. En esos casos favor ingresar comentarios e información al solicitar cotización para recibir una cotización manual en 24 horas o menos vía nuestra APP: ImportaYAia.com",
        "Nuestra APP cuenta con COBERTURA todo riesgo desde la bodega del FABRICANTE en origen hasta la puerta de su bodega o sitio final de entrega en destino, indistinto del INCOTERM de la IMPORTACIÓN y no aplica ningún DEDUCIBLE en caso de siniestros de sus cargas e inversiones. *Aplican términos legales y condiciones del servicio y cobertura contratada vía APP*",
    ]
    
    elements = []
    for note in notes:
        elements.append(Paragraph(f"• {note}", styles['Note']))
    
    return elements


def create_notes_section_aereo(transit_days):
    """Create additional notes section for Aéreo"""
    styles = get_custom_styles()
    
    notes = [
        "Tarifas por kilogramo, mínimo $85.00 USD por embarque.",
        "Peso tasable: Mayor entre peso real y peso volumétrico (L×A×H/6000).",
        "Tarifas válidas para carga general, no peligrosa, no perecedera.",
        "Tracking en tiempo real disponible.",
        "Documentación electrónica (AWB, factura comercial).",
        "Acceso a nuestra APP ImportaYa.ia para monitorear sus cargas 24/7.",
        f"Tránsito estimado {transit_days} días aprox.",
        "Locales en destino sujetos a IVA local del 15%.",
        "Tarifas cotizadas NO aplican para cargas BONDED, no domésticas, cargas peligrosas DG Cargo o IMO cargo, cargas con sobredimensión o sobrepeso. En esos casos favor ingresar comentarios e información al solicitar cotización para recibir una cotización manual en 24 horas o menos vía nuestra APP: ImportaYAia.com",
        "Nuestra APP cuenta con COBERTURA todo riesgo desde la bodega del FABRICANTE en origen hasta la puerta de su bodega o sitio final de entrega en destino, indistinto del INCOTERM de la IMPORTACIÓN y no aplica ningún DEDUCIBLE en caso de siniestros de sus cargas e inversiones. *Aplican términos legales y condiciones del servicio y cobertura contratada vía APP*",
    ]
    
    elements = []
    for note in notes:
        elements.append(Paragraph(f"• {note}", styles['Note']))
    
    return elements


def create_footer_section(valid_until):
    """Create footer with contact info and validity"""
    styles = get_custom_styles()
    
    elements = [
        Spacer(1, 20),
        HRFlowable(width="100%", thickness=2, color=AQUA_FLOW),
        Spacer(1, 10),
        Paragraph(f"Tarifa válida hasta {valid_until}.", styles['Footer']),
        Spacer(1, 5),
        Paragraph("Agradezco la atención brindada, esperando nuestra propuesta sea de su total agrado.", styles['BodyText']),
        Paragraph("Quedamos atentos a sus futuras instrucciones.", styles['BodyText']),
        Spacer(1, 20),
        Paragraph("Atentamente,", styles['ClientInfo']),
        Spacer(1, 30),
        Paragraph("<b>ImportaYa.ia</b>", styles['QuoteSubtitle']),
        Paragraph("<i>La logística de carga integral, ahora es Inteligente!</i>", styles['Slogan']),
        Spacer(1, 10),
        Paragraph("contacto@importaya.ia | www.importaya.ia | +593 99 999 9999", styles['Footer']),
    ]
    
    return elements


def generate_quote_pdf(quote_submission, scenario_data=None):
    """
    Generate a professional quote PDF for any transport type.
    
    Args:
        quote_submission: QuoteSubmission model instance
        scenario_data: Optional dict with scenario details from AI response
        
    Returns:
        BytesIO buffer containing the PDF
    """
    output = io.BytesIO()
    doc = SimpleDocTemplate(
        output, 
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )
    
    elements = []
    styles = get_custom_styles()
    
    quote_number = quote_submission.submission_number or f"IYA-{quote_submission.id:05d}"
    date_str = timezone.now().strftime("%d de %B de %Y").replace(
        "January", "enero").replace("February", "febrero").replace("March", "marzo"
    ).replace("April", "abril").replace("May", "mayo").replace("June", "junio"
    ).replace("July", "julio").replace("August", "agosto").replace("September", "septiembre"
    ).replace("October", "octubre").replace("November", "noviembre").replace("December", "diciembre")
    
    elements.append(create_header_table(quote_number, date_str))
    
    elements.extend(create_client_section(
        quote_submission.company_name,
        quote_submission.contact_name,
        quote_submission.city
    ))
    
    transport_type = quote_submission.transport_type
    container_type = getattr(quote_submission, 'container_type', None) or '1x40HC'
    incoterm = quote_submission.incoterm or 'FOB'
    destination = quote_submission.destination or 'Guayaquil'
    origin = quote_submission.origin or 'QINGDAO'
    
    is_multiport_asia = ' | ' in origin
    elements.append(create_intro_paragraph(transport_type, incoterm, destination, container_type, is_multiport_asia))
    elements.append(Spacer(1, 15))
    
    if scenario_data:
        try:
            if isinstance(scenario_data, str):
                scenario_data = json.loads(scenario_data)
        except:
            scenario_data = {}
    else:
        scenario_data = {}
    
    weight_kg = float(quote_submission.cargo_weight_kg or 100)
    volume_cbm = float(quote_submission.cargo_volume_cbm or 1)
    quantity = quote_submission.quantity or 1
    
    freight_label = "FLETE MARÍTIMO:" if transport_type in ['FCL', 'LCL'] else "FLETE AÉREO:"
    elements.append(Paragraph(f"<b>{freight_label}</b>", styles['SectionHeader']))
    elements.append(Spacer(1, 10))
    
    if transport_type in ['LCL', 'AEREO']:
        cargo_details = create_cargo_details_table(transport_type, quantity, volume_cbm, weight_kg)
        elements.append(cargo_details)
        elements.append(Spacer(1, 15))
    
    if transport_type == 'FCL':
        origin_ports = origin.split(' | ') if ' | ' in origin else [origin]
        is_multiport = len(origin_ports) > 1
        multiport_carriers = []
        
        if is_multiport:
            from SalesModule.models import FreightRateFCL
            from django.utils import timezone as dj_timezone
            from django.db.models import Q
            
            ports_data = []
            carriers_used = set()
            for pol in origin_ports:
                pol_clean = pol.strip()
                pol_variations = get_equivalent_ports(pol_clean)
                if '-' in pol_clean:
                    for part in pol_clean.split('-'):
                        if part.strip() not in pol_variations:
                            pol_variations.append(part.strip())
                
                rate = None
                for pol_var in pol_variations:
                    rate = FreightRateFCL.objects.filter(
                        pol_name__iexact=pol_var.strip(),
                        pod_name__icontains='Guayaquil',
                        is_active=True,
                        validity_date__gte=dj_timezone.now().date(),
                        cost_40hc__gt=0
                    ).order_by('cost_40hc').first()
                    if rate:
                        break
                
                if not rate:
                    for pol_var in pol_variations:
                        rate = FreightRateFCL.objects.filter(
                            pol_name__icontains=pol_var.strip(),
                            pod_name__icontains='Guayaquil',
                            is_active=True,
                            validity_date__gte=dj_timezone.now().date(),
                            cost_40hc__gt=0
                        ).order_by('cost_40hc').first()
                        if rate:
                            break
                
                if rate:
                    display_pol = pol_clean
                    if pol_clean.upper() == 'GUANGZHOU' and rate.pol_name.upper() == 'HUANGPU':
                        display_pol = 'HUANGPU-GUANGZHOU'
                    ports_data.append({
                        'pol': display_pol,
                        'validity': rate.validity_date,
                        'free_days': rate.free_days,
                        'transit_time': rate.transit_time or 'N/A',
                        'cost_20gp': rate.cost_20gp,
                        'cost_40gp': rate.cost_40gp,
                        'cost_40hc': rate.cost_40hc,
                        'carrier': rate.carrier_name,
                    })
                    if rate.carrier_name:
                        carriers_used.add(rate.carrier_name)
                else:
                    ports_data.append({
                        'pol': pol_clean,
                        'validity': 'Consultar',
                        'free_days': 21,
                        'transit_time': 'N/A',
                        'cost_20gp': Decimal('0'),
                        'cost_40gp': Decimal('0'),
                        'cost_40hc': Decimal('0'),
                        'carrier': None,
                    })
            
            freight_table = create_fcl_multiport_tarifario_table(ports_data, destination)
            elements.append(freight_table)
            freight_total = Decimal('0')
            multiport_carriers = list(carriers_used)
        else:
            freight_rate = scenario_data.get('flete_base', 1600)
            rates_by_container = scenario_data.get('rates_by_container', None)
            freight_table, freight_total = create_fcl_freight_table(
                origin, container_type, freight_rate, quantity, rates_by_container
            )
            elements.append(freight_table)
        
        elements.append(Spacer(1, 15))
        
        local_costs = scenario_data.get('costos_locales', {})
        local_quantity = 1 if is_multiport else quantity
        carrier_name_raw = scenario_data.get('carrier_name', scenario_data.get('naviera', None))
        
        if is_multiport and multiport_carriers:
            local_table, local_iva, thc_total = create_local_costs_table_fcl(
                local_costs, local_quantity, carrier_code=None, carriers_list=list(multiport_carriers)
            )
        else:
            local_table, local_iva, thc_total = create_local_costs_table_fcl(
                local_costs, local_quantity, carrier_code=carrier_name_raw, carriers_list=None
            )
        
        local_section_elements = [
            Paragraph("<b>GASTOS LOCALES EN DESTINO:</b>", styles['SectionHeader']),
            Spacer(1, 10),
            local_table
        ]
        
        if is_multiport:
            local_section_elements.append(Spacer(1, 8))
            multiport_note = Paragraph(
                '<i><font size="8" color="#666666">* Tarifario comparativo: Gastos locales mostrados por 1 contenedor. '
                'Para cotización con múltiples contenedores, solicite cotización individual por ruta.</font></i>',
                styles['Normal']
            )
            local_section_elements.append(multiport_note)
        
        elements.append(KeepTogether(local_section_elements))
        
        if not is_multiport:
            elements.append(Spacer(1, 15))
            totals_table, total_oferta = create_totals_section(freight_total, thc_total, local_iva, origin)
            elements.append(totals_table)
        
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<b>NOTAS ADICIONALES:</b>", styles['SectionHeader']))
        elements.append(Spacer(1, 10))
        
        transit_days = scenario_data.get('dias_transito', None)
        if not transit_days or transit_days in ['39-43', '35', '7-35', 'N/A']:
            transit_days = get_port_transit_time(origin)
        free_days = scenario_data.get('dias_libres', 21)
        carrier_name = scenario_data.get('carrier_name', scenario_data.get('naviera', None))
        validity_date = scenario_data.get('validity_date', scenario_data.get('validez', None))
        
        has_emc = False
        if is_multiport and multiport_carriers:
            carrier_abbrevs = []
            for carrier in sorted(multiport_carriers):
                abbrev = get_carrier_abbreviation(carrier)
                carrier_abbrevs.append(abbrev)
                if abbrev == 'EMC':
                    has_emc = True
            carrier_name = ', '.join(carrier_abbrevs[:5])
            if len(carrier_abbrevs) > 5:
                carrier_name += f' y {len(carrier_abbrevs) - 5} más'
        elif carrier_name:
            abbrev = get_carrier_abbreviation(carrier_name)
            if abbrev == 'EMC':
                has_emc = True
            carrier_name = abbrev
        
        has_non_usd_currency = _detect_non_usd_currency(scenario_data)
        elements.extend(create_notes_section_fcl(transit_days, free_days, carrier_name, validity_date, is_multiport, has_emc, has_non_usd_currency))
        
    elif transport_type == 'LCL':
        origin_ports = origin.split(' | ') if ' | ' in origin else [origin]
        is_multiport = len(origin_ports) > 1
        
        if is_multiport:
            from SalesModule.models import FreightRateFCL
            from django.utils import timezone as dj_timezone
            
            ports_data = []
            for pol in origin_ports:
                pol_clean = pol.strip()
                rate = FreightRateFCL.objects.filter(
                    pol_name__icontains=pol_clean,
                    pod_name__icontains='Guayaquil',
                    transport_type__icontains='LCL',
                    is_active=True,
                    validity_date__gte=dj_timezone.now().date()
                ).order_by('lcl_rate_per_cbm').first()
                
                if rate:
                    ports_data.append({
                        'pol': pol_clean,
                        'validity': rate.validity_date,
                        'free_days': rate.free_days,
                        'transit_time': rate.transit_time or 'N/A',
                        'rate_per_cbm': rate.lcl_rate_per_cbm or Decimal('0'),
                        'min_charge': rate.lcl_min_charge or Decimal('0'),
                    })
                else:
                    ports_data.append({
                        'pol': pol_clean,
                        'validity': 'Consultar',
                        'free_days': 21,
                        'transit_time': 'N/A',
                        'rate_per_cbm': Decimal('0'),
                        'min_charge': Decimal('0'),
                    })
            
            freight_table = create_lcl_multiport_tarifario_table(ports_data, destination)
            elements.append(freight_table)
            freight_total = Decimal('0')
        else:
            cbm_rate = scenario_data.get('tarifa_cbm', 85)
            ton_rate = scenario_data.get('tarifa_ton', 85)
            freight_table, freight_total = create_lcl_freight_table(
                origin, cbm_rate, ton_rate, volume_cbm, weight_kg, quantity
            )
            elements.append(freight_table)
        
        elements.append(Spacer(1, 15))
        elements.append(Paragraph("<b>GASTOS LOCALES EN DESTINO:</b>", styles['SectionHeader']))
        elements.append(Spacer(1, 10))
        
        local_costs = scenario_data.get('costos_locales', {})
        origin_costs = scenario_data.get('gastos_origen', Decimal('0'))
        local_table, local_iva, local_no_iva, collect_fee = create_local_costs_table_lcl(
            local_costs, quantity, total_freight=freight_total, origin_costs=origin_costs, cbm=Decimal(str(volume_cbm))
        )
        elements.append(local_table)
        
        if not is_multiport:
            elements.append(Spacer(1, 15))
            totals_table, total_oferta = create_totals_section_lcl(freight_total, local_no_iva, local_iva, origin)
            elements.append(totals_table)
        
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<b>NOTAS ADICIONALES:</b>", styles['SectionHeader']))
        elements.append(Spacer(1, 10))
        
        transit_days = scenario_data.get('dias_transito', None)
        if not transit_days or transit_days in ['25-35', '35', 'N/A']:
            transit_days = get_port_transit_time(origin)
        elements.extend(create_notes_section_lcl(transit_days))
        
    elif transport_type == 'AEREO':
        kg_rate = scenario_data.get('tarifa_kg', 4.50)
        freight_table, freight_total = create_aereo_freight_table(
            origin, kg_rate, weight_kg, quantity
        )
        elements.append(freight_table)
        
        elements.append(Spacer(1, 15))
        elements.append(Paragraph("<b>GASTOS LOCALES EN DESTINO:</b>", styles['SectionHeader']))
        elements.append(Spacer(1, 10))
        
        local_costs = scenario_data.get('costos_locales', {})
        origin_costs = scenario_data.get('gastos_origen', Decimal('0'))
        local_table, local_iva, _, collect_fee = create_local_costs_table_aereo(
            local_costs, quantity, total_freight=freight_total, origin_costs=origin_costs
        )
        elements.append(local_table)
        
        elements.append(Spacer(1, 15))
        totals_table, total_oferta = create_totals_section(freight_total, Decimal('0'), local_iva, origin)
        elements.append(totals_table)
        
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<b>NOTAS ADICIONALES:</b>", styles['SectionHeader']))
        elements.append(Spacer(1, 10))
        
        transit_days = scenario_data.get('dias_transito', '3-5')
        elements.extend(create_notes_section_aereo(transit_days))
    
    valid_until = (timezone.now() + timezone.timedelta(days=30)).strftime("%d/%m/%Y")
    elements.extend(create_footer_section(valid_until))
    
    doc.build(elements)
    output.seek(0)
    return output


def generate_multi_scenario_pdf(quote_submission, scenarios):
    """
    Generate a PDF with multiple scenario options.
    
    Args:
        quote_submission: QuoteSubmission model instance
        scenarios: List of scenario dictionaries from AI response
        
    Returns:
        BytesIO buffer containing the PDF
    """
    output = io.BytesIO()
    doc = SimpleDocTemplate(
        output, 
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )
    
    elements = []
    styles = get_custom_styles()
    
    quote_number = quote_submission.submission_number or f"IYA-{quote_submission.id:05d}"
    date_str = timezone.now().strftime("%d de %B de %Y").replace(
        "January", "enero").replace("February", "febrero").replace("March", "marzo"
    ).replace("April", "abril").replace("May", "mayo").replace("June", "junio"
    ).replace("July", "julio").replace("August", "agosto").replace("September", "septiembre"
    ).replace("October", "octubre").replace("November", "noviembre").replace("December", "diciembre")
    
    elements.append(create_header_table(quote_number, date_str))
    
    elements.extend(create_client_section(
        quote_submission.company_name,
        quote_submission.contact_name,
        quote_submission.city
    ))
    
    transport_type = quote_submission.transport_type
    container_type = getattr(quote_submission, 'container_type', None) or '1x40HC'
    incoterm = quote_submission.incoterm or 'FOB'
    destination = quote_submission.destination or 'Guayaquil'
    
    elements.append(create_intro_paragraph(transport_type, incoterm, destination, container_type))
    elements.append(Spacer(1, 15))
    
    elements.append(Paragraph("<b>OPCIONES DE COTIZACIÓN:</b>", styles['SectionHeader']))
    elements.append(Spacer(1, 10))
    
    header_style = ParagraphStyle(
        name='ScenarioHeader',
        fontSize=10,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    cell_style = ParagraphStyle(
        name='ScenarioCell',
        fontSize=10,
        textColor=DARK_TEXT,
        fontName='Helvetica',
        alignment=TA_CENTER
    )
    
    scenario_data = [
        [
            Paragraph('<b>Opción</b>', header_style),
            Paragraph('<b>Servicio</b>', header_style),
            Paragraph('<b>Tránsito</b>', header_style),
            Paragraph('<b>Total USD</b>', header_style),
        ]
    ]
    
    for i, scenario in enumerate(scenarios[:3], 1):
        nombre = scenario.get('nombre', f'Opción {i}')
        dias = scenario.get('dias_transito', 'N/A')
        total = scenario.get('total_usd', 0)
        
        scenario_data.append([
            Paragraph(f"<b>{i}</b>", cell_style),
            Paragraph(nombre, cell_style),
            Paragraph(f"{dias} días", cell_style),
            Paragraph(format_currency(total), cell_style),
        ])
    
    scenario_table = Table(scenario_data, colWidths=[0.8*inch, 2.5*inch, 1.5*inch, 1.5*inch])
    scenario_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_OCEAN_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, MEDIUM_GRAY),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    elements.append(scenario_table)
    
    valid_until = (timezone.now() + timezone.timedelta(days=30)).strftime("%d/%m/%Y")
    elements.extend(create_footer_section(valid_until))
    
    doc.build(elements)
    output.seek(0)
    return output
