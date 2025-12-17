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
    Image, HRFlowable, KeepTogether
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


def get_transport_description(transport_type, container_type=None, incoterm="FOB"):
    """Get transport-specific description text"""
    if transport_type == 'FCL':
        container_desc = container_type or "contenedor"
        return f"carga FCL-FCL ({container_desc}), en términos {incoterm}"
    elif transport_type == 'LCL':
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


def create_intro_paragraph(transport_type, incoterm, destination, container_type=None):
    """Create introduction paragraph based on transport type"""
    styles = get_custom_styles()
    
    transport_desc = get_transport_description(transport_type, container_type, incoterm)
    
    text = f"""Por medio de la presente, nos es grato poner a su disposición nuestras tarifas para {transport_desc}, 
    con destino a <b>{destination}, ECUADOR</b>."""
    
    return Paragraph(text, styles['BodyText'])


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
        fontSize=8,
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
    
    for port_info in ports_data:
        pol = port_info.get('pol', 'N/A')
        validity = port_info.get('validity', 'N/A')
        if hasattr(validity, 'strftime'):
            validity = validity.strftime('%d/%m/%Y')
        free_days = str(port_info.get('free_days', 21))
        transit = port_info.get('transit_time', 'N/A')
        cost_20 = format_currency(port_info.get('cost_20gp', 0))
        cost_40gp = format_currency(port_info.get('cost_40gp', 0))
        cost_40hc = format_currency(port_info.get('cost_40hc', 0))
        
        row = [
            Paragraph(pol.upper(), cell_bold),
            Paragraph(str(validity), cell_style),
            Paragraph(free_days, cell_style),
            Paragraph(str(transit), cell_style),
            Paragraph(cost_20, cell_style),
            Paragraph(cost_40gp, cell_style),
            Paragraph(cost_40hc, cell_style),
        ]
        data.append(row)
    
    col_widths = [1.1*inch, 0.85*inch, 0.7*inch, 0.7*inch, 0.85*inch, 0.85*inch, 0.85*inch]
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
        fontSize=8,
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
    
    for port_info in ports_data:
        pol = port_info.get('pol', 'N/A')
        validity = port_info.get('validity', 'N/A')
        if hasattr(validity, 'strftime'):
            validity = validity.strftime('%d/%m/%Y')
        free_days = str(port_info.get('free_days', 21))
        transit = port_info.get('transit_time', 'N/A')
        rate_cbm = format_currency(port_info.get('rate_per_cbm', port_info.get('lcl_rate_per_cbm', 0)))
        min_charge = format_currency(port_info.get('min_charge', port_info.get('lcl_min_charge', 0)))
        
        row = [
            Paragraph(pol.upper(), cell_bold),
            Paragraph(str(validity), cell_style),
            Paragraph(free_days, cell_style),
            Paragraph(str(transit), cell_style),
            Paragraph(rate_cbm, cell_style),
            Paragraph(min_charge, cell_style),
        ]
        data.append(row)
    
    col_widths = [1.3*inch, 0.9*inch, 0.75*inch, 0.75*inch, 1*inch, 1*inch]
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
    
    min_rate = Decimal(str(cbm_rate)) * 2
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


def create_local_costs_table_fcl(costs, quantity=1):
    """
    Create local costs table for FCL with 4 concepts per carrier:
    - Locales destino por MBL (aplica IVA, unidad BL)
    - THC Destino (EXENTO IVA, unidad CONTENEDOR)
    - Locales destino por contenedor (aplica IVA, unidad CONTENEDOR)
    - Handling por contenedor (aplica IVA, unidad CONTENEDOR)
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
        'locales_mbl': Decimal('100.00'),
        'thc': Decimal('200.00'),
        'locales_cntr': Decimal('400.00'),
        'handling': Decimal('50.00'),
    }
    
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
            Paragraph('LOCALES DESTINO POR MBL', cell_left),
            Paragraph(format_currency(default_costs['locales_mbl']), cell_style),
            Paragraph('1', cell_style),
            Paragraph(format_currency(default_costs['locales_mbl']), cell_style),
            Paragraph('BL', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('THC DESTINO', cell_left),
            Paragraph(format_currency(default_costs['thc']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['thc'] * quantity), cell_style),
            Paragraph('CONTENEDOR', cell_style),
            Paragraph('NO APLICA IVA', iva_no)
        ],
        [
            Paragraph('LOCALES DESTINO POR CONTENEDOR', cell_left),
            Paragraph(format_currency(default_costs['locales_cntr']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['locales_cntr'] * quantity), cell_style),
            Paragraph('CONTENEDOR', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('HANDLING POR CONTENEDOR', cell_left),
            Paragraph(format_currency(default_costs['handling']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['handling'] * quantity), cell_style),
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
    
    subtotal_iva = (default_costs['locales_mbl'] + 
                    default_costs['locales_cntr'] * quantity + 
                    default_costs['handling'] * quantity)
    thc_total = default_costs['thc'] * quantity
    
    return table, subtotal_iva, thc_total


def create_local_costs_table_lcl(costs, quantity=1):
    """Create local costs table for LCL"""
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
        'visto_bueno': Decimal('75.00'),
        'handling': Decimal('35.00'),
        'desconsolidacion': Decimal('15.00'),
        'almacenaje': Decimal('25.00'),
    }
    
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
            Paragraph('VISTO BUENO LCL', cell_left),
            Paragraph(format_currency(default_costs['visto_bueno']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['visto_bueno'] * quantity), cell_style),
            Paragraph('BL', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('HANDLING', cell_left),
            Paragraph(format_currency(default_costs['handling']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['handling'] * quantity), cell_style),
            Paragraph('EMBARQUE', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('DESCONSOLIDACIÓN', cell_left),
            Paragraph(format_currency(default_costs['desconsolidacion']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['desconsolidacion'] * quantity), cell_style),
            Paragraph('CBM', cell_style),
            Paragraph('NO APLICA IVA', iva_no)
        ],
        [
            Paragraph('ALMACENAJE (5 DÍAS LIBRES)', cell_left),
            Paragraph(format_currency(default_costs['almacenaje']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['almacenaje'] * quantity), cell_style),
            Paragraph('EMBARQUE', cell_style),
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
    
    subtotal_iva = (default_costs['visto_bueno'] + default_costs['handling'] + 
                    default_costs['almacenaje']) * quantity
    subtotal_no_iva = default_costs['desconsolidacion'] * quantity
    
    return table, subtotal_iva, subtotal_no_iva


def create_local_costs_table_aereo(costs, quantity=1):
    """Create local costs table for Aéreo"""
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
    
    default_costs = {
        'handling_aereo': Decimal('45.00'),
        'almacenaje_aereo': Decimal('20.00'),
        'documentacion': Decimal('35.00'),
    }
    
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
            Paragraph('HANDLING AÉREO', cell_left),
            Paragraph(format_currency(default_costs['handling_aereo']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['handling_aereo'] * quantity), cell_style),
            Paragraph('AWB', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('ALMACENAJE (3 DÍAS LIBRES)', cell_left),
            Paragraph(format_currency(default_costs['almacenaje_aereo']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['almacenaje_aereo'] * quantity), cell_style),
            Paragraph('EMBARQUE', cell_style),
            Paragraph('APLICA IVA', iva_yes)
        ],
        [
            Paragraph('DOCUMENTACIÓN Y GUÍA', cell_left),
            Paragraph(format_currency(default_costs['documentacion']), cell_style),
            Paragraph(str(quantity), cell_style),
            Paragraph(format_currency(default_costs['documentacion'] * quantity), cell_style),
            Paragraph('AWB', cell_style),
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
    
    subtotal_iva = (default_costs['handling_aereo'] + default_costs['almacenaje_aereo'] + 
                    default_costs['documentacion']) * quantity
    
    return table, subtotal_iva, Decimal('0')


def create_totals_section(freight_total, thc_total, local_iva_total, origin):
    """Create totals summary section"""
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


def create_notes_section_fcl(transit_days, free_days, carrier_name=None, validity_date=None):
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
    
    notes = []
    
    if validity_date:
        notes.append(f"*** TARIFA VÁLIDA HASTA: {validity_date} ***")
    
    notes.extend([
        "Tarifas all in.",
        "Exoneración de garantías.",
        "Tarifas válidas para carga general, apilable, no peligrosa ni con sobredimensión.",
        "Notificaciones de eventos del contenedor durante su ruta de viaje vía APP = ImportaYAia.com",
        "Información de ubicación de su contenedor en tiempo real - rastreo de contenedor satelital en tierra y en altamar Via APP.",
        "Envío de la documentación de manera electrónica incluyendo el BL con firma digital-Ecas y aviso de llegada, todos los documentos podrán ser descargados vía APP.",
        "Tarifas sujetas a cambios por GRI anunciados por parte de las líneas navieras.",
        "Salida semanal.",
    ])
    
    if carrier_name:
        notes.append(f"Naviera: {carrier_name} + Servicio Inteligente de Carga = IMPORTAYA.IA.")
    
    notes.extend([
        f"{free_days} días libres de demoraje en destino POD Guayaquil.",
        f"Tránsito estimado {transit_days} días aprox. (Podría variar por parte de la naviera).",
        "Acceso a nuestra APP IMPORTAYAIA.com en la que usted podrá monitorear sus cargas 24/7.",
        "Con ImportaYa.ia el SEGURO de Transporte NO aplica DEDUCIBLE, contrata nuestro seguro y evita perder tu inversión!",
        "Cotización en USD. Tipo de cambio referencial, pudiendo variar al momento del pago.",
        "Locales en destino sujetos a IVA local del 15%, IVA no incluido en valores totalizados de la cotización.",
    ])
    
    elements = []
    for i, note in enumerate(notes):
        if i == 0 and validity_date:
            elements.append(Paragraph(f"<b>{note}</b>", validity_note_style))
        else:
            elements.append(Paragraph(f"• {note}", styles['Note']))
    
    return elements


def create_notes_section_lcl(transit_days):
    """Create additional notes section for LCL"""
    styles = get_custom_styles()
    
    notes = [
        "Tarifas all in para carga consolidada.",
        "Peso tasable: Mayor entre CBM y TON (peso/volumen).",
        "Mínimo de cobro: Tarifa CBM × 2.",
        "Tarifas válidas para carga general, no peligrosa.",
        "5 días libres de almacenaje en destino.",
        "Notificaciones de tracking vía APP y email.",
        "Sugerimos que toda carga de importación esté amparada con póliza de seguro.",
        "Acceso a nuestra APP ImportaYa.ia para monitorear sus cargas 24/7.",
        f"Tránsito estimado {transit_days} días aprox.",
        "Locales en destino sujetos a IVA local del 15%.",
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
        "3 días libres de almacenaje en destino.",
        "Tracking en tiempo real disponible.",
        "Documentación electrónica (AWB, factura comercial).",
        "Sugerimos que toda carga esté amparada con póliza de seguro.",
        "Acceso a nuestra APP ImportaYa.ia para monitorear sus cargas 24/7.",
        f"Tránsito estimado {transit_days} días aprox.",
        "Locales en destino sujetos a IVA local del 15%.",
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
    
    elements.append(create_intro_paragraph(transport_type, incoterm, destination, container_type))
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
    
    if transport_type == 'FCL':
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
                    is_active=True,
                    validity_date__gte=dj_timezone.now().date()
                ).order_by('cost_40hc').first()
                
                if rate:
                    ports_data.append({
                        'pol': pol_clean,
                        'validity': rate.validity_date,
                        'free_days': rate.free_days,
                        'transit_time': rate.transit_time or 'N/A',
                        'cost_20gp': rate.cost_20gp,
                        'cost_40gp': rate.cost_40gp,
                        'cost_40hc': rate.cost_40hc,
                    })
                else:
                    ports_data.append({
                        'pol': pol_clean,
                        'validity': 'Consultar',
                        'free_days': 21,
                        'transit_time': 'N/A',
                        'cost_20gp': Decimal('0'),
                        'cost_40gp': Decimal('0'),
                        'cost_40hc': Decimal('0'),
                    })
            
            freight_table = create_fcl_multiport_tarifario_table(ports_data, destination)
            elements.append(freight_table)
            freight_total = Decimal('0')
        else:
            freight_rate = scenario_data.get('flete_base', 1600)
            rates_by_container = scenario_data.get('rates_by_container', None)
            freight_table, freight_total = create_fcl_freight_table(
                origin, container_type, freight_rate, quantity, rates_by_container
            )
            elements.append(freight_table)
        
        elements.append(Spacer(1, 15))
        elements.append(Paragraph("<b>GASTOS LOCALES EN DESTINO:</b>", styles['SectionHeader']))
        elements.append(Spacer(1, 10))
        
        local_costs = scenario_data.get('costos_locales', {})
        local_table, local_iva, thc_total = create_local_costs_table_fcl(local_costs, quantity)
        elements.append(local_table)
        
        if not is_multiport:
            elements.append(Spacer(1, 15))
            totals_table, total_oferta = create_totals_section(freight_total, thc_total, local_iva, origin)
            elements.append(totals_table)
        
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<b>NOTAS ADICIONALES:</b>", styles['SectionHeader']))
        elements.append(Spacer(1, 10))
        
        transit_days = scenario_data.get('dias_transito', '39-43')
        free_days = scenario_data.get('dias_libres', 21)
        carrier_name = scenario_data.get('carrier_name', scenario_data.get('naviera', None))
        validity_date = scenario_data.get('validity_date', scenario_data.get('validez', None))
        elements.extend(create_notes_section_fcl(transit_days, free_days, carrier_name, validity_date))
        
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
        local_table, local_iva, local_no_iva = create_local_costs_table_lcl(local_costs, quantity)
        elements.append(local_table)
        
        if not is_multiport:
            elements.append(Spacer(1, 15))
            totals_table, total_oferta = create_totals_section(freight_total, local_no_iva, local_iva, origin)
            elements.append(totals_table)
        
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<b>NOTAS ADICIONALES:</b>", styles['SectionHeader']))
        elements.append(Spacer(1, 10))
        
        transit_days = scenario_data.get('dias_transito', '25-35')
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
        local_table, local_iva, _ = create_local_costs_table_aereo(local_costs, quantity)
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
