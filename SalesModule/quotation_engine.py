"""
Quotation Engine for ImportaYa.ia
Handles currency conversion and IVA calculation with special exemptions.
"""
import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

IVA_RATE = Decimal('0.15')

DTHC_CODES = ['DTHC', 'THC_DESTINO', 'DESTINATION_THC', 'THC_GYE', 'THC_PSJ']


def convertir_a_usd(monto: Decimal, moneda: str) -> Tuple[Decimal, Dict]:
    """
    Convert an amount from any supported currency to USD.
    Uses the app exchange rate (with bank spread).
    
    Args:
        monto: Amount in source currency
        moneda: Source currency code
        
    Returns:
        Tuple of (amount_in_usd, conversion_details)
    """
    from .currency_manager import obtener_tasa_app
    
    moneda = moneda.upper()
    
    if moneda == 'USD':
        return (monto, {
            'monto_original': float(monto),
            'moneda_original': 'USD',
            'monto_usd': float(monto),
            'tasa_aplicada': 1.0,
            'conversion_required': False
        })
    
    tasa_info = obtener_tasa_app(moneda, 'USD')
    tasa = Decimal(str(tasa_info['tasa_conversion']))
    
    if moneda in ['EUR', 'GBP']:
        monto_usd = (monto / tasa).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    else:
        monto_usd = (monto / tasa).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    return (monto_usd, {
        'monto_original': float(monto),
        'moneda_original': moneda,
        'monto_usd': float(monto_usd),
        'tasa_aplicada': float(tasa),
        'conversion_required': True
    })


def is_dthc_item(item_code: str, item_description: str = '') -> bool:
    """
    Check if an item is a Destination THC (exempt from IVA in FCL maritime).
    
    Args:
        item_code: Item code or identifier
        item_description: Item description for additional matching
        
    Returns:
        True if item is DTHC
    """
    item_code_upper = item_code.upper()
    desc_upper = item_description.upper()
    
    for dthc_code in DTHC_CODES:
        if dthc_code in item_code_upper or dthc_code in desc_upper:
            return True
    
    dthc_keywords = ['THC DESTINO', 'THC EN DESTINO', 'TERMINAL HANDLING DESTINO']
    for keyword in dthc_keywords:
        if keyword in desc_upper:
            return True
    
    return False


def calcular_iva_gastos_locales(
    gastos_locales: List[Dict],
    transport_type: str
) -> Dict:
    """
    Calculate IVA on local costs with FCL DTHC exemption.
    
    CRITICAL BUSINESS RULE:
    - Aéreo/LCL: 15% IVA on ALL local costs
    - Marítimo FCL: 15% IVA on all local costs EXCEPT DTHC (which is EXEMPT)
    
    Args:
        gastos_locales: List of local cost items with format:
            [{'codigo': 'DTHC', 'descripcion': '...', 'monto': 150.00, 'moneda': 'USD'}]
        transport_type: 'FCL', 'LCL', or 'AEREO'
        
    Returns:
        Dict with IVA calculation breakdown
    """
    transport_type = transport_type.upper()
    
    total_gravable = Decimal('0.0')
    total_exento = Decimal('0.0')
    items_gravables = []
    items_exentos = []
    
    for item in gastos_locales:
        codigo = item.get('codigo', '')
        descripcion = item.get('descripcion', '')
        monto = Decimal(str(item.get('monto', 0)))
        moneda = item.get('moneda', 'USD')
        
        if moneda != 'USD':
            monto, _ = convertir_a_usd(monto, moneda)
        
        is_exempt = False
        exemption_reason = None
        
        if transport_type == 'FCL' and is_dthc_item(codigo, descripcion):
            is_exempt = True
            exemption_reason = 'DTHC exento de IVA en transporte marítimo FCL'
        
        item_detail = {
            'codigo': codigo,
            'descripcion': descripcion,
            'monto_usd': float(monto),
            'moneda_original': item.get('moneda', 'USD'),
            'gravable': not is_exempt,
            'exemption_reason': exemption_reason
        }
        
        if is_exempt:
            total_exento += monto
            items_exentos.append(item_detail)
        else:
            total_gravable += monto
            items_gravables.append(item_detail)
    
    iva_calculado = (total_gravable * IVA_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    return {
        'transport_type': transport_type,
        'total_gastos_locales': float(total_gravable + total_exento),
        'base_gravable': float(total_gravable),
        'base_exenta': float(total_exento),
        'iva_rate': float(IVA_RATE),
        'iva_calculado': float(iva_calculado),
        'items_gravables': items_gravables,
        'items_exentos': items_exentos,
        'formula_aplicada': f"({float(total_gravable):.2f} × {float(IVA_RATE)*100:.0f}%) = {float(iva_calculado):.2f}" if transport_type == 'FCL' and total_exento > 0 else f"Total Locales × {float(IVA_RATE)*100:.0f}%"
    }


def calcular_cotizacion_completa(
    fletes: List[Dict],
    gastos_locales: List[Dict],
    transport_type: str,
    moneda_destino: str = 'USD'
) -> Dict:
    """
    Calculate complete quotation with freight, local costs, and IVA.
    
    Grand_Total_USD = Fletes + Gastos_Locales + IVA
    
    Args:
        fletes: List of freight items
        gastos_locales: List of local cost items
        transport_type: 'FCL', 'LCL', or 'AEREO'
        moneda_destino: Output currency (default USD)
        
    Returns:
        Complete quotation breakdown
    """
    total_fletes = Decimal('0.0')
    fletes_detalle = []
    
    for flete in fletes:
        monto = Decimal(str(flete.get('monto', 0)))
        moneda = flete.get('moneda', 'USD')
        
        if moneda != 'USD':
            monto_usd, conversion = convertir_a_usd(monto, moneda)
            flete_detail = {
                **flete,
                'monto_original': float(monto),
                'moneda_original': moneda,
                'monto_usd': float(monto_usd),
                'conversion_details': conversion
            }
        else:
            monto_usd = monto
            flete_detail = {
                **flete,
                'monto_usd': float(monto_usd)
            }
        
        total_fletes += monto_usd
        fletes_detalle.append(flete_detail)
    
    iva_result = calcular_iva_gastos_locales(gastos_locales, transport_type)
    
    total_locales = Decimal(str(iva_result['total_gastos_locales']))
    iva_total = Decimal(str(iva_result['iva_calculado']))
    
    grand_total = total_fletes + total_locales + iva_total
    
    return {
        'transport_type': transport_type,
        'fletes': {
            'items': fletes_detalle,
            'subtotal_usd': float(total_fletes)
        },
        'gastos_locales': {
            'items': iva_result['items_gravables'] + iva_result['items_exentos'],
            'subtotal_usd': float(total_locales),
            'base_gravable': iva_result['base_gravable'],
            'base_exenta': iva_result['base_exenta']
        },
        'iva': {
            'rate': float(IVA_RATE),
            'base': iva_result['base_gravable'],
            'monto': float(iva_total),
            'formula': iva_result['formula_aplicada'],
            'exemptions': iva_result['items_exentos']
        },
        'totales': {
            'fletes': float(total_fletes),
            'gastos_locales': float(total_locales),
            'iva': float(iva_total),
            'grand_total_usd': float(grand_total)
        },
        'moneda': 'USD'
    }


def generar_resumen_cotizacion(cotizacion: Dict) -> str:
    """
    Generate a human-readable quotation summary.
    
    Args:
        cotizacion: Result from calcular_cotizacion_completa
        
    Returns:
        Formatted summary string
    """
    totales = cotizacion['totales']
    transport = cotizacion['transport_type']
    
    lines = [
        f"=== RESUMEN DE COTIZACIÓN ({transport}) ===",
        "",
        f"Fletes:                 USD {totales['fletes']:>10,.2f}",
        f"Gastos Locales:         USD {totales['gastos_locales']:>10,.2f}",
        f"IVA (15%):              USD {totales['iva']:>10,.2f}",
        "-" * 40,
        f"TOTAL:                  USD {totales['grand_total_usd']:>10,.2f}",
    ]
    
    if cotizacion['iva'].get('exemptions'):
        lines.append("")
        lines.append("* DTHC exento de IVA (transporte marítimo FCL)")
    
    return "\n".join(lines)
