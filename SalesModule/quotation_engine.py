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
        
        if item.get('is_iva_exempt', False):
            is_exempt = True
            exemption_reason = item.get('exemption_reason', 'Exento de IVA según configuración')
        elif transport_type == 'FCL' and is_dthc_item(codigo, descripcion):
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


def obtener_tarifa_flete(
    pol: str,
    pod: str,
    transport_type: str,
    container_type: str = '20GP',
    weight_kg: Optional[Decimal] = None,
    volume_cbm: Optional[Decimal] = None
) -> Optional[Dict]:
    """
    Obtiene la mejor tarifa de flete desde la base de datos.
    
    Args:
        pol: Puerto de origen (nombre o código)
        pod: Puerto de destino (nombre o código)
        transport_type: 'FCL', 'LCL', o 'AEREO'
        container_type: Tipo de contenedor para FCL (20GP, 40GP, 40HC, etc.)
        weight_kg: Peso en kg (para LCL/AEREO)
        volume_cbm: Volumen en CBM (para LCL)
        
    Returns:
        Dict con tarifa de flete y detalles, o None si no hay tarifa
    """
    from .models import FreightRateFCL
    
    transport_type = transport_type.upper()
    
    if transport_type == 'FCL':
        rate = FreightRateFCL.get_best_rate(pol, pod, container_type)
        if not rate:
            logger.warning(f"No hay tarifa FCL para {pol} → {pod} ({container_type})")
            return None
        
        container_field_map = {
            '20GP': 'cost_20gp',
            '40GP': 'cost_40gp',
            '40HC': 'cost_40hc',
            '40NOR': 'cost_40nor',
            '20REEFER': 'cost_20reefer',
            '40REEFER': 'cost_40reefer',
        }
        
        container_key = container_type.upper().replace(' ', '').replace('1X', '')
        cost_field = container_field_map.get(container_key)
        
        if not cost_field:
            logger.error(f"Tipo de contenedor no soportado: {container_type}")
            return None
        
        costo_raw = getattr(rate, cost_field, None)
        if costo_raw is None:
            logger.error(f"No hay tarifa disponible para {container_type} en ruta {pol} → {pod}")
            return None
        
        costo = Decimal(str(costo_raw))
        
        return {
            'tipo': 'FLETE_INTERNACIONAL',
            'descripcion': f'Flete Marítimo FCL {container_type}',
            'codigo': f'FLETE_FCL_{container_type}',
            'monto': float(costo),
            'moneda': 'USD',
            'carrier': rate.carrier_name,
            'pol': rate.pol_name,
            'pod': rate.pod_name,
            'transit_time': rate.transit_time,
            'validity': str(rate.validity_date) if rate.validity_date else None,
            'rate_id': rate.id
        }
    
    elif transport_type == 'LCL':
        from django.utils import timezone
        today = timezone.now().date()
        
        rate = FreightRateFCL.objects.filter(
            pol_name__icontains=pol,
            pod_name__icontains=pod,
            transport_type='LCL',
            is_active=True,
            validity_date__gte=today
        ).order_by('lcl_rate_per_cbm').first()
        
        if not rate:
            logger.warning(f"No hay tarifa LCL para {pol} → {pod}")
            return None
        
        rate_per_cbm = Decimal(str(rate.lcl_rate_per_cbm)) if rate.lcl_rate_per_cbm else Decimal('0')
        
        if volume_cbm is not None and weight_kg is not None:
            peso_volumetrico = volume_cbm * Decimal('1000')
            chargeable_weight = max(peso_volumetrico, weight_kg)
            cbm_cobrable = chargeable_weight / Decimal('1000')
            monto = rate_per_cbm * cbm_cobrable
        elif volume_cbm is not None:
            monto = rate_per_cbm * volume_cbm
        else:
            monto = rate_per_cbm
        
        return {
            'tipo': 'FLETE_INTERNACIONAL',
            'descripcion': 'Flete Marítimo LCL',
            'codigo': 'FLETE_LCL',
            'monto': float(monto),
            'moneda': 'USD',
            'carrier': rate.carrier_name,
            'pol': rate.pol_name,
            'pod': rate.pod_name,
            'transit_time': rate.transit_time,
            'validity': str(rate.validity_date) if rate.validity_date else None,
            'rate_per_cbm': float(rate_per_cbm),
            'volume_cbm': float(volume_cbm) if volume_cbm is not None else None,
            'rate_id': rate.id
        }
    
    elif transport_type == 'AEREO':
        from django.utils import timezone
        today = timezone.now().date()
        
        rate = FreightRateFCL.objects.filter(
            pol_name__icontains=pol,
            pod_name__icontains=pod,
            transport_type='AEREO',
            is_active=True,
            validity_date__gte=today
        ).order_by('air_rate_min').first()
        
        if not rate:
            logger.warning(f"No hay tarifa AÉREA para {pol} → {pod}")
            return None
        
        chargeable_weight = Decimal('0')
        
        if weight_kg is not None:
            if weight_kg <= 45:
                tarifa = Decimal(str(rate.air_rate_min or 0))
            elif weight_kg <= 100:
                tarifa = Decimal(str(rate.air_rate_45 or rate.air_rate_min or 0))
            elif weight_kg <= 300:
                tarifa = Decimal(str(rate.air_rate_100 or rate.air_rate_45 or 0))
            elif weight_kg <= 500:
                tarifa = Decimal(str(rate.air_rate_300 or rate.air_rate_100 or 0))
            elif weight_kg <= 1000:
                tarifa = Decimal(str(rate.air_rate_500 or rate.air_rate_300 or 0))
            else:
                tarifa = Decimal(str(rate.air_rate_1000 or rate.air_rate_500 or 0))
            
            if volume_cbm is not None:
                peso_volumetrico = volume_cbm * Decimal('167')
                chargeable_weight = max(peso_volumetrico, weight_kg)
            else:
                chargeable_weight = weight_kg
            
            monto = tarifa * chargeable_weight
        else:
            monto = Decimal(str(rate.air_rate_min or 0))
        
        return {
            'tipo': 'FLETE_INTERNACIONAL',
            'descripcion': 'Flete Aéreo',
            'codigo': 'FLETE_AEREO',
            'monto': float(monto),
            'moneda': 'USD',
            'carrier': rate.carrier_name,
            'pol': rate.pol_name,
            'pod': rate.pod_name,
            'transit_time': rate.transit_time,
            'validity': str(rate.validity_date) if rate.validity_date else None,
            'weight_kg': float(weight_kg) if weight_kg is not None else None,
            'chargeable_weight': float(chargeable_weight),
            'rate_id': rate.id
        }
    
    return None


def aplicar_margen_ganancia(
    costo_base: Decimal,
    transport_type: str,
    item_type: str = 'FLETE'
) -> Dict:
    """
    Aplica el margen de ganancia configurado al costo base.
    Siempre aplica un margen mínimo del 15% si no hay configuración.
    
    Args:
        costo_base: Costo base sin margen
        transport_type: 'FCL', 'LCL', o 'AEREO' (se convierte a MARITIMO_FCL, etc.)
        item_type: Tipo de rubro (FLETE, THC_ORIGEN, HANDLING, etc.)
        
    Returns:
        Dict con costo base, margen aplicado, y precio final
    """
    from .models import ProfitMarginConfig
    
    transport_mapping = {
        'FCL': 'MARITIMO_FCL',
        'LCL': 'MARITIMO_LCL',
        'AEREO': 'AEREO',
        'TERRESTRE': 'TERRESTRE'
    }
    
    transport_key = transport_mapping.get(transport_type.upper(), 'ALL')
    
    config = ProfitMarginConfig.get_margin_for_item(transport_key, item_type)
    
    costo_base = Decimal(str(costo_base))
    
    if config:
        margen = config.calculate_margin(costo_base)
        precio_final = costo_base + margen
        
        margin_value_decimal = Decimal(str(config.margin_value)) if config.margin_value else Decimal('0')
        min_margin_decimal = Decimal(str(config.minimum_margin)) if config.minimum_margin else None
        
        return {
            'costo_base': float(costo_base),
            'margen_aplicado': float(margen),
            'precio_final': float(precio_final),
            'config_name': config.name,
            'margin_type': config.margin_type,
            'margin_value': float(margin_value_decimal),
            'minimum_margin': float(min_margin_decimal) if min_margin_decimal else None
        }
    
    margen_default = (costo_base * Decimal('0.15')).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP
    )
    logger.info(f"Usando margen por defecto 15% para {item_type} ({transport_type})")
    return {
        'costo_base': float(costo_base),
        'margen_aplicado': float(margen_default),
        'precio_final': float(costo_base + margen_default),
        'config_name': 'DEFAULT_15%',
        'margin_type': 'PERCENTAGE',
        'margin_value': 15.0,
        'minimum_margin': None
    }


def obtener_gastos_locales_db(
    transport_type: str,
    port: str = 'GYE',
    container_type: Optional[str] = None,
    quantity: int = 1,
    cbm: Optional[Decimal] = None,
    weight_kg: Optional[Decimal] = None
) -> Dict:
    """
    Obtiene los gastos locales desde la base de datos.
    
    Args:
        transport_type: 'FCL', 'LCL', o 'AEREO'
        port: Puerto de destino (GYE, PSJ, MEC, etc.)
        container_type: Tipo de contenedor (20GP, 40GP, etc.)
        quantity: Cantidad de contenedores
        cbm: Volumen en CBM (para LCL)
        weight_kg: Peso en kg (para AEREO)
        
    Returns:
        Dict con items de gastos locales y totales
    """
    from .models import LocalDestinationCost
    
    transport_mapping = {
        'FCL': 'MARITIMO_FCL',
        'LCL': 'MARITIMO_LCL',
        'AEREO': 'AEREO'
    }
    
    transport_key = transport_mapping.get(transport_type.upper(), transport_type.upper())
    
    result = LocalDestinationCost.calculate_total_local_costs(
        transport_type=transport_key,
        port=port,
        container_type=container_type,
        quantity=quantity,
        cbm=cbm,
        weight_kg=weight_kg
    )
    
    return result


def generar_cotizacion_automatica(
    pol: str,
    pod: str,
    transport_type: str,
    container_type: str = '20GP',
    quantity: int = 1,
    weight_kg: Optional[Decimal] = None,
    volume_cbm: Optional[Decimal] = None,
    destination_port: str = 'GYE',
    apply_margins: bool = True
) -> Dict:
    """
    Genera una cotización completa automáticamente usando las tarifas de la base de datos.
    
    Proceso:
    1. Obtiene tarifa de flete desde FreightRateFCL
    2. Aplica márgenes de ganancia desde ProfitMarginConfig
    3. Obtiene gastos locales desde LocalDestinationCost
    4. Calcula IVA con exenciones
    5. Genera totales
    
    Args:
        pol: Puerto de origen
        pod: Puerto de destino
        transport_type: 'FCL', 'LCL', o 'AEREO'
        container_type: Tipo de contenedor para FCL
        quantity: Cantidad de contenedores
        weight_kg: Peso en kg
        volume_cbm: Volumen en CBM
        destination_port: Puerto de destino Ecuador (GYE, PSJ, etc.)
        apply_margins: Si se aplican márgenes de ganancia
        
    Returns:
        Cotización completa con desglose detallado
    """
    errors = []
    warnings = []
    
    tarifa_flete = obtener_tarifa_flete(
        pol=pol,
        pod=pod,
        transport_type=transport_type,
        container_type=container_type,
        weight_kg=weight_kg,
        volume_cbm=volume_cbm
    )
    
    if not tarifa_flete:
        errors.append(f"No se encontró tarifa de flete para {pol} → {pod} ({transport_type})")
        tarifa_flete = {
            'tipo': 'FLETE_INTERNACIONAL',
            'descripcion': f'Flete {transport_type} (sin tarifa)',
            'codigo': f'FLETE_{transport_type}',
            'monto': 0.0,
            'moneda': 'USD'
        }
    
    if apply_margins and tarifa_flete['monto'] > 0:
        margin_result = aplicar_margen_ganancia(
            costo_base=Decimal(str(tarifa_flete['monto'])),
            transport_type=transport_type,
            item_type='FLETE'
        )
        tarifa_flete['costo_base'] = margin_result['costo_base']
        tarifa_flete['monto'] = margin_result['precio_final']
        tarifa_flete['margen'] = margin_result['margen_aplicado']
        tarifa_flete['margin_config'] = margin_result['config_name']
    
    fletes = [tarifa_flete]
    
    gastos_db = obtener_gastos_locales_db(
        transport_type=transport_type,
        port=destination_port,
        container_type=container_type if transport_type == 'FCL' else None,
        quantity=quantity,
        cbm=volume_cbm,
        weight_kg=weight_kg
    )
    
    gastos_locales = gastos_db.get('items', [])
    
    if apply_margins:
        for gasto in gastos_locales:
            if gasto['monto'] > 0:
                margin_result = aplicar_margen_ganancia(
                    costo_base=Decimal(str(gasto['monto'])),
                    transport_type=transport_type,
                    item_type=gasto.get('codigo', 'OTROS')
                )
                gasto['costo_base'] = margin_result['costo_base']
                gasto['monto'] = margin_result['precio_final']
                gasto['margen'] = margin_result['margen_aplicado']
    
    cotizacion = calcular_cotizacion_completa(
        fletes=fletes,
        gastos_locales=gastos_locales,
        transport_type=transport_type
    )
    
    cotizacion['metadata'] = {
        'pol': pol,
        'pod': pod,
        'transport_type': transport_type,
        'container_type': container_type if transport_type == 'FCL' else None,
        'quantity': quantity,
        'weight_kg': float(weight_kg) if weight_kg else None,
        'volume_cbm': float(volume_cbm) if volume_cbm else None,
        'destination_port': destination_port,
        'margins_applied': apply_margins,
        'rate_source': 'database'
    }
    
    if tarifa_flete.get('carrier'):
        cotizacion['metadata']['carrier'] = tarifa_flete['carrier']
    if tarifa_flete.get('transit_time'):
        cotizacion['metadata']['transit_time'] = tarifa_flete['transit_time']
    if tarifa_flete.get('validity'):
        cotizacion['metadata']['validity'] = tarifa_flete['validity']
    
    cotizacion['errors'] = errors
    cotizacion['warnings'] = warnings
    
    return cotizacion


def buscar_mejores_tarifas(
    pol: str,
    pod: str,
    transport_type: str,
    container_type: str = '20GP',
    limit: int = 5
) -> List[Dict]:
    """
    Busca las mejores tarifas disponibles para una ruta.
    
    Args:
        pol: Puerto de origen
        pod: Puerto de destino
        transport_type: 'FCL', 'LCL', o 'AEREO'
        container_type: Tipo de contenedor para FCL
        limit: Número máximo de resultados
        
    Returns:
        Lista de tarifas ordenadas por precio
    """
    from .models import FreightRateFCL
    from django.utils import timezone
    
    today = timezone.now().date()
    transport_type = transport_type.upper()
    
    base_query = FreightRateFCL.objects.filter(
        pol_name__icontains=pol,
        pod_name__icontains=pod,
        validity_date__gte=today,
        is_active=True
    )
    
    if transport_type == 'FCL':
        cost_field = f'cost_{container_type.lower().replace(" ", "")}'
        rates = base_query.filter(transport_type='FCL').order_by(cost_field)[:limit]
        
        return [{
            'carrier': r.carrier_name,
            'pol': r.pol_name,
            'pod': r.pod_name,
            'costo': float(getattr(r, cost_field, 0) or 0),
            'container_type': container_type,
            'transit_time': r.transit_time,
            'validity': str(r.validity_date),
            'rate_id': r.id
        } for r in rates]
    
    elif transport_type == 'LCL':
        rates = base_query.filter(transport_type='LCL').order_by('lcl_rate_per_cbm')[:limit]
        
        return [{
            'carrier': r.carrier_name,
            'pol': r.pol_name,
            'pod': r.pod_name,
            'costo_per_cbm': float(r.lcl_rate_per_cbm or 0),
            'transit_time': r.transit_time,
            'validity': str(r.validity_date),
            'rate_id': r.id
        } for r in rates]
    
    elif transport_type == 'AEREO':
        rates = base_query.filter(transport_type='AEREO').order_by('air_rate_min')[:limit]
        
        return [{
            'carrier': r.carrier_name,
            'pol': r.pol_name,
            'pod': r.pod_name,
            'rate_min': float(r.air_rate_min or 0),
            'rate_45': float(r.air_rate_45 or 0),
            'rate_100': float(r.air_rate_100 or 0),
            'transit_time': r.transit_time,
            'validity': str(r.validity_date),
            'rate_id': r.id
        } for r in rates]
    
    return []


def _crear_escenario_desde_tarifa(
    rate_info: Dict,
    transport_type: str,
    container_type: str,
    quantity: int,
    weight_kg: Optional[Decimal],
    volume_cbm: Optional[Decimal],
    destination_port: str,
    escenario_tipo: str,
    descripcion: str
) -> Dict:
    """
    Crea un escenario de cotización usando una tarifa específica.
    """
    from .models import FreightRateFCL
    
    rate_id = rate_info.get('rate_id')
    if not rate_id:
        return None
    
    try:
        rate = FreightRateFCL.objects.get(id=rate_id)
    except FreightRateFCL.DoesNotExist:
        return None
    
    if transport_type.upper() == 'FCL':
        container_field_map = {
            '20GP': 'cost_20gp', '40GP': 'cost_40gp', '40HC': 'cost_40hc',
            '40NOR': 'cost_40nor', '20REEFER': 'cost_20reefer', '40REEFER': 'cost_40reefer',
        }
        container_key = container_type.upper().replace(' ', '').replace('1X', '')
        cost_field = container_field_map.get(container_key, 'cost_20gp')
        costo = Decimal(str(getattr(rate, cost_field, 0) or 0))
    elif transport_type.upper() == 'LCL':
        rate_per_cbm = Decimal(str(rate.lcl_rate_per_cbm or 0))
        costo = rate_per_cbm * (volume_cbm or Decimal('1'))
    else:
        costo = Decimal(str(rate.air_rate_min or 0))
    
    margin_result = aplicar_margen_ganancia(costo, transport_type, 'FLETE')
    
    gastos_db = obtener_gastos_locales_db(
        transport_type=transport_type,
        port=destination_port,
        container_type=container_type if transport_type.upper() == 'FCL' else None,
        quantity=quantity,
        cbm=volume_cbm,
        weight_kg=weight_kg
    )
    
    gastos_locales = gastos_db.get('items', [])
    
    for gasto in gastos_locales:
        if gasto['monto'] > 0:
            gasto_margin = aplicar_margen_ganancia(
                Decimal(str(gasto['monto'])), transport_type, gasto.get('codigo', 'OTROS')
            )
            gasto['monto'] = gasto_margin['precio_final']
    
    flete = {
        'tipo': 'FLETE_INTERNACIONAL',
        'descripcion': f'Flete {transport_type} ({rate.carrier_name})',
        'codigo': f'FLETE_{transport_type}',
        'monto': margin_result['precio_final'],
        'moneda': 'USD',
        'carrier': rate.carrier_name,
        'transit_time': rate.transit_time
    }
    
    cotizacion = calcular_cotizacion_completa([flete], gastos_locales, transport_type)
    
    cotizacion['escenario'] = escenario_tipo
    cotizacion['descripcion'] = descripcion
    cotizacion['metadata'] = {
        'carrier': rate.carrier_name,
        'transit_time': rate.transit_time,
        'validity': str(rate.validity_date) if rate.validity_date else None,
        'rate_id': rate.id
    }
    
    return cotizacion


def generar_escenarios_cotizacion(
    pol: str,
    pod: str,
    transport_type: str,
    container_type: str = '20GP',
    quantity: int = 1,
    weight_kg: Optional[Decimal] = None,
    volume_cbm: Optional[Decimal] = None,
    destination_port: str = 'GYE'
) -> Dict:
    """
    Genera múltiples escenarios de cotización (económico, estándar, express).
    Cada escenario usa una naviera diferente.
    """
    mejores_tarifas = buscar_mejores_tarifas(
        pol=pol,
        pod=pod,
        transport_type=transport_type,
        container_type=container_type,
        limit=10
    )
    
    if not mejores_tarifas:
        return {
            'error': f'No se encontraron tarifas para {pol} → {pod} ({transport_type})',
            'escenarios': []
        }
    
    escenarios = []
    
    economico = _crear_escenario_desde_tarifa(
        rate_info=mejores_tarifas[0],
        transport_type=transport_type,
        container_type=container_type,
        quantity=quantity,
        weight_kg=weight_kg,
        volume_cbm=volume_cbm,
        destination_port=destination_port,
        escenario_tipo='ECONOMICO',
        descripcion=f'Opción más económica - {mejores_tarifas[0].get("carrier", "")}'
    )
    if economico:
        escenarios.append(economico)
    
    if len(mejores_tarifas) >= 2:
        mid_index = len(mejores_tarifas) // 2
        estandar = _crear_escenario_desde_tarifa(
            rate_info=mejores_tarifas[mid_index],
            transport_type=transport_type,
            container_type=container_type,
            quantity=quantity,
            weight_kg=weight_kg,
            volume_cbm=volume_cbm,
            destination_port=destination_port,
            escenario_tipo='ESTANDAR',
            descripcion=f'Balance costo/tiempo - {mejores_tarifas[mid_index].get("carrier", "")}'
        )
        if estandar:
            escenarios.append(estandar)
    
    express_rate = None
    for rate in mejores_tarifas:
        if rate.get('transit_time'):
            try:
                tt = int(str(rate['transit_time']).split()[0])
                if express_rate is None:
                    express_rate = rate
                else:
                    curr_tt = int(str(express_rate.get('transit_time', '999')).split()[0])
                    if tt < curr_tt:
                        express_rate = rate
            except (ValueError, IndexError):
                pass
    
    if express_rate and express_rate.get('rate_id') != mejores_tarifas[0].get('rate_id'):
        express = _crear_escenario_desde_tarifa(
            rate_info=express_rate,
            transport_type=transport_type,
            container_type=container_type,
            quantity=quantity,
            weight_kg=weight_kg,
            volume_cbm=volume_cbm,
            destination_port=destination_port,
            escenario_tipo='EXPRESS',
            descripcion=f'Menor tiempo de tránsito - {express_rate.get("carrier", "")}'
        )
        if express:
            escenarios.append(express)
    
    return {
        'pol': pol,
        'pod': pod,
        'transport_type': transport_type,
        'total_tarifas_encontradas': len(mejores_tarifas),
        'escenarios': escenarios
    }
