"""
Legal Footer Generator for ImportaYa.ia
Generates dynamic legal notes for quotations based on transport type.
"""
from decimal import Decimal
from typing import List, Optional

SPREAD_BANCARIO_USD = Decimal('0.03')


def generar_nota_tipo_cambio(monedas_utilizadas: List[str] = None) -> str:
    """
    Generate fixed exchange rate disclaimer note.
    
    Args:
        monedas_utilizadas: List of currencies used in the quote
        
    Returns:
        Exchange rate disclaimer text
    """
    if not monedas_utilizadas:
        monedas_utilizadas = ['EUR', 'GBP']
    
    monedas_str = ', '.join(monedas_utilizadas)
    spread_pct = float(SPREAD_BANCARIO_USD) * 100
    
    return (
        f"NOTA DE TIPO DE CAMBIO: Los montos en moneda extranjera ({monedas_str}) "
        f"han sido convertidos a USD utilizando tasas de cambio del mercado con un "
        f"spread bancario de USD {float(SPREAD_BANCARIO_USD):.2f} ({spread_pct:.0f}%) "
        f"para protección contra fluctuaciones cambiarias. Las tasas son referenciales "
        f"y pueden variar al momento de la facturación."
    )


def generar_nota_impuestos(transport_type: str, tiene_dthc: bool = False) -> str:
    """
    Generate dynamic tax disclaimer based on transport type.
    
    BUSINESS RULES:
    - Aéreo/LCL: "15% IVA sobre todos los gastos locales"
    - Marítimo FCL: "15% IVA excepto DTHC que está exento"
    
    Args:
        transport_type: 'FCL', 'LCL', or 'AEREO'
        tiene_dthc: Whether the quote includes DTHC charges
        
    Returns:
        Tax disclaimer text
    """
    transport_type = transport_type.upper()
    
    if transport_type == 'FCL':
        if tiene_dthc:
            return (
                "NOTA DE IMPUESTOS: Los gastos locales están sujetos al 15% de IVA, "
                "EXCEPTO el cargo por Terminal Handling en Destino (DTHC/THC Destino) "
                "que se encuentra EXENTO de IVA según la normativa tributaria vigente "
                "para transporte marítimo de contenedor completo (FCL)."
            )
        else:
            return (
                "NOTA DE IMPUESTOS: Los gastos locales están sujetos al 15% de IVA. "
                "Para transporte marítimo FCL, el cargo DTHC (si aplica) está exento de IVA."
            )
    else:
        modal = "aéreo" if transport_type == 'AEREO' else "marítimo LCL"
        return (
            f"NOTA DE IMPUESTOS: Todos los gastos locales para transporte {modal} "
            f"están sujetos al 15% de IVA según la normativa tributaria vigente del Ecuador."
        )


def generar_nota_validez(dias: int = 15) -> str:
    """
    Generate quote validity note.
    
    Args:
        dias: Number of days the quote is valid
        
    Returns:
        Validity note text
    """
    return (
        f"VALIDEZ: Esta cotización tiene una validez de {dias} días calendario "
        f"a partir de la fecha de emisión. Los precios están sujetos a disponibilidad "
        f"y pueden variar sin previo aviso una vez vencido este plazo."
    )


def generar_nota_seguro() -> str:
    """
    Generate insurance disclaimer note.
    """
    return (
        "NOTA DE SEGURO: Los valores de seguro se calculan sobre el valor CIF de la mercancía. "
        "El seguro de transporte es opcional pero altamente recomendado. ImportaYa.ia no se "
        "hace responsable por daños o pérdidas en mercancías no aseguradas."
    )


def generar_nota_aduanas() -> str:
    """
    Generate customs disclaimer note.
    """
    return (
        "NOTA ADUANERA: Los tributos aduaneros (Ad-Valorem, FODINFA, IVA de importación) "
        "son estimados y pueden variar según la clasificación final del SENAE. "
        "Los permisos previos (ARCSA, AGROCALIDAD, INEN, etc.) son responsabilidad del importador "
        "y deben gestionarse antes del arribo de la mercancía."
    )


def generar_footer_completo(
    transport_type: str,
    tiene_dthc: bool = False,
    monedas_utilizadas: List[str] = None,
    dias_validez: int = 15,
    incluir_seguro: bool = True,
    incluir_aduanas: bool = True
) -> str:
    """
    Generate complete legal footer for quotation.
    
    Args:
        transport_type: 'FCL', 'LCL', or 'AEREO'
        tiene_dthc: Whether quote includes DTHC charges
        monedas_utilizadas: Currencies used in quote
        dias_validez: Days the quote is valid
        incluir_seguro: Include insurance note
        incluir_aduanas: Include customs note
        
    Returns:
        Complete legal footer text
    """
    notas = []
    
    notas.append(generar_nota_impuestos(transport_type, tiene_dthc))
    
    if monedas_utilizadas and any(m != 'USD' for m in monedas_utilizadas):
        notas.append(generar_nota_tipo_cambio(monedas_utilizadas))
    
    notas.append(generar_nota_validez(dias_validez))
    
    if incluir_seguro:
        notas.append(generar_nota_seguro())
    
    if incluir_aduanas:
        notas.append(generar_nota_aduanas())
    
    separator = "\n\n"
    header = "=" * 60 + "\nNOTAS LEGALES Y CONDICIONES\n" + "=" * 60 + "\n\n"
    footer = "\n" + "=" * 60
    
    return header + separator.join(notas) + footer


def generar_footer_pdf(
    transport_type: str,
    tiene_dthc: bool = False
) -> List[str]:
    """
    Generate legal notes as a list for PDF generation.
    Each item is a separate paragraph.
    
    Args:
        transport_type: 'FCL', 'LCL', or 'AEREO'
        tiene_dthc: Whether quote includes DTHC charges
        
    Returns:
        List of note strings for PDF paragraphs
    """
    return [
        generar_nota_impuestos(transport_type, tiene_dthc),
        generar_nota_tipo_cambio(),
        generar_nota_validez(15),
        generar_nota_aduanas()
    ]
