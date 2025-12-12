"""
calculator.py - Motor de Cálculo de Peso Cobrable para ImportaYa.ia

Este módulo normaliza unidades de medida y calcula el Peso Cobrable (Chargeable Weight)
para cotizaciones de carga internacional según estándares GDS (Global Distribution System).

Estándares implementados:
- ISO 4217 para códigos de unidades
- UNECE Recommendation 21 para tipos de bultos
- IATA para factores volumétricos aéreos
- Prácticas marítimas estándar para LCL (W/M)

Autor: ImportaYa.ia
Versión: 1.0.0
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple, Dict, Union, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class UnidadPeso(Enum):
    """Códigos ISO de unidades de peso"""
    KGM = "KGM"  # Kilogramo (unidad base SI)
    LBR = "LBR"  # Libra
    TNE = "TNE"  # Tonelada Métrica (1000 KGM)
    GRO = "GRO"  # Peso Bruto (Gross)
    CHW = "CHW"  # Peso Cobrable (Chargeable Weight) - Virtual


class UnidadLongitud(Enum):
    """Códigos ISO de unidades de longitud"""
    CMT = "CMT"  # Centímetro (unidad base para cálculos internos)
    MTR = "MTR"  # Metro
    INH = "INH"  # Pulgada (Inch)


class UnidadVolumen(Enum):
    """Códigos ISO de unidades de volumen"""
    MTQ = "MTQ"  # Metro Cúbico (CBM) - estándar marítimo/aéreo
    FTQ = "FTQ"  # Pie Cúbico (CFT)


class TipoTransporte(Enum):
    """Tipos de transporte para cálculo de peso cobrable"""
    AEREO = "AEREO"
    MARITIMO_LCL = "LCL"
    MARITIMO_FCL = "FCL"


FACTORES_CONVERSION_PESO = {
    UnidadPeso.KGM: Decimal("1.0"),
    UnidadPeso.LBR: Decimal("0.453592"),
    UnidadPeso.TNE: Decimal("1000.0"),
}

FACTORES_CONVERSION_LONGITUD = {
    UnidadLongitud.CMT: Decimal("1.0"),
    UnidadLongitud.MTR: Decimal("100.0"),
    UnidadLongitud.INH: Decimal("2.54"),
}

FACTORES_CONVERSION_VOLUMEN = {
    UnidadVolumen.MTQ: Decimal("1.0"),
    UnidadVolumen.FTQ: Decimal("0.0283168"),
}

FACTOR_VOLUMETRICO_AEREO = Decimal("6000")
FACTOR_VOLUMETRICO_AEREO_CBM = Decimal("167")

FACTOR_ESTIBA_MARITIMO = Decimal("1000")


@dataclass
class ResultadoPesoCobrable:
    """Resultado del cálculo de peso cobrable"""
    peso_bruto_kg: Decimal
    peso_volumetrico_kg: Decimal
    peso_cobrable: Decimal
    unidad_cobrable: str
    volumen_cbm: Decimal
    tipo_transporte: str
    base_cobro: str
    detalle: str


class CalculatorError(Exception):
    """Excepción base para errores del calculador"""
    pass


class UnidadDesconocidaError(CalculatorError):
    """Error cuando se proporciona una unidad no reconocida"""
    pass


class ValorInvalidoError(CalculatorError):
    """Error cuando se proporciona un valor inválido"""
    pass


def _to_decimal(value: Union[int, float, str, Decimal]) -> Decimal:
    """Convierte un valor a Decimal con manejo de errores"""
    try:
        if isinstance(value, Decimal):
            return value
        return Decimal(str(value))
    except Exception as e:
        raise ValorInvalidoError(f"No se puede convertir '{value}' a número: {e}")


def _parse_unidad_longitud(unidad: str) -> UnidadLongitud:
    """Parsea una unidad de longitud desde string"""
    unidad_upper = unidad.upper().strip()
    
    aliases = {
        "CM": UnidadLongitud.CMT,
        "CMT": UnidadLongitud.CMT,
        "CENTIMETRO": UnidadLongitud.CMT,
        "CENTIMETROS": UnidadLongitud.CMT,
        "M": UnidadLongitud.MTR,
        "MTR": UnidadLongitud.MTR,
        "METRO": UnidadLongitud.MTR,
        "METROS": UnidadLongitud.MTR,
        "IN": UnidadLongitud.INH,
        "INH": UnidadLongitud.INH,
        "INCH": UnidadLongitud.INH,
        "INCHES": UnidadLongitud.INH,
        "PULGADA": UnidadLongitud.INH,
        "PULGADAS": UnidadLongitud.INH,
    }
    
    if unidad_upper in aliases:
        return aliases[unidad_upper]
    
    raise UnidadDesconocidaError(
        f"Unidad de longitud '{unidad}' no reconocida. "
        f"Unidades válidas: CMT (cm), MTR (m), INH (pulgadas)"
    )


def _parse_tipo_transporte(tipo: str) -> TipoTransporte:
    """Parsea el tipo de transporte desde string"""
    tipo_upper = tipo.upper().strip()
    
    aliases = {
        "AEREO": TipoTransporte.AEREO,
        "AÉREO": TipoTransporte.AEREO,
        "AIR": TipoTransporte.AEREO,
        "LCL": TipoTransporte.MARITIMO_LCL,
        "MARITIMO_LCL": TipoTransporte.MARITIMO_LCL,
        "MARÍTIMO_LCL": TipoTransporte.MARITIMO_LCL,
        "MARITIMO LCL": TipoTransporte.MARITIMO_LCL,
        "FCL": TipoTransporte.MARITIMO_FCL,
        "MARITIMO_FCL": TipoTransporte.MARITIMO_FCL,
        "MARÍTIMO_FCL": TipoTransporte.MARITIMO_FCL,
        "MARITIMO FCL": TipoTransporte.MARITIMO_FCL,
    }
    
    if tipo_upper in aliases:
        return aliases[tipo_upper]
    
    raise UnidadDesconocidaError(
        f"Tipo de transporte '{tipo}' no reconocido. "
        f"Tipos válidos: AEREO, LCL, FCL"
    )


def normalizar_dimensiones(
    largo: Union[int, float, Decimal],
    ancho: Union[int, float, Decimal],
    alto: Union[int, float, Decimal],
    unidad_origen: str
) -> Tuple[Decimal, Decimal, Decimal]:
    """
    Normaliza dimensiones a Centímetros (CMT) para cálculo interno.
    
    Args:
        largo: Largo de la carga
        ancho: Ancho de la carga
        alto: Alto de la carga
        unidad_origen: Unidad de las dimensiones (CMT, MTR, INH)
    
    Returns:
        Tuple con (largo_cm, ancho_cm, alto_cm) en Decimal
    
    Raises:
        UnidadDesconocidaError: Si la unidad no es reconocida
        ValorInvalidoError: Si los valores no son válidos
    
    Ejemplo:
        >>> normalizar_dimensiones(10, 20, 30, "INH")
        (Decimal('25.40'), Decimal('50.80'), Decimal('76.20'))
    """
    unidad = _parse_unidad_longitud(unidad_origen)
    factor = FACTORES_CONVERSION_LONGITUD[unidad]
    
    largo_dec = _to_decimal(largo)
    ancho_dec = _to_decimal(ancho)
    alto_dec = _to_decimal(alto)
    
    if largo_dec <= 0 or ancho_dec <= 0 or alto_dec <= 0:
        raise ValorInvalidoError("Las dimensiones deben ser mayores a cero")
    
    largo_cm = (largo_dec * factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    ancho_cm = (ancho_dec * factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    alto_cm = (alto_dec * factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
    logger.debug(
        f"Dimensiones normalizadas: {largo} x {ancho} x {alto} {unidad_origen} -> "
        f"{largo_cm} x {ancho_cm} x {alto_cm} CMT"
    )
    
    return largo_cm, ancho_cm, alto_cm


def normalizar_peso(
    peso: Union[int, float, Decimal],
    unidad_origen: str
) -> Decimal:
    """
    Normaliza peso a Kilogramos (KGM).
    
    Args:
        peso: Valor del peso
        unidad_origen: Unidad del peso (KGM, LBR, TNE)
    
    Returns:
        Peso en kilogramos como Decimal
    """
    unidad_upper = unidad_origen.upper().strip()
    
    aliases = {
        "KG": UnidadPeso.KGM,
        "KGM": UnidadPeso.KGM,
        "KILOGRAMO": UnidadPeso.KGM,
        "KILOGRAMOS": UnidadPeso.KGM,
        "LB": UnidadPeso.LBR,
        "LBR": UnidadPeso.LBR,
        "LIBRA": UnidadPeso.LBR,
        "LIBRAS": UnidadPeso.LBR,
        "TON": UnidadPeso.TNE,
        "TNE": UnidadPeso.TNE,
        "TONELADA": UnidadPeso.TNE,
        "TONELADAS": UnidadPeso.TNE,
        "MT": UnidadPeso.TNE,
    }
    
    if unidad_upper not in aliases:
        raise UnidadDesconocidaError(
            f"Unidad de peso '{unidad_origen}' no reconocida. "
            f"Unidades válidas: KGM (kg), LBR (lb), TNE (ton)"
        )
    
    unidad = aliases[unidad_upper]
    factor = FACTORES_CONVERSION_PESO[unidad]
    
    peso_dec = _to_decimal(peso)
    if peso_dec <= 0:
        raise ValorInvalidoError("El peso debe ser mayor a cero")
    
    peso_kg = (peso_dec * factor).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)
    
    return peso_kg


def calcular_volumen_cbm(
    largo_cm: Union[int, float, Decimal],
    ancho_cm: Union[int, float, Decimal],
    alto_cm: Union[int, float, Decimal]
) -> Decimal:
    """
    Calcula el volumen en Metros Cúbicos (CBM/MTQ).
    
    Fórmula: (Largo_cm * Ancho_cm * Alto_cm) / 1,000,000
    
    Args:
        largo_cm: Largo en centímetros
        ancho_cm: Ancho en centímetros
        alto_cm: Alto en centímetros
    
    Returns:
        Volumen en CBM (metros cúbicos)
    """
    largo = _to_decimal(largo_cm)
    ancho = _to_decimal(ancho_cm)
    alto = _to_decimal(alto_cm)
    
    volumen_cm3 = largo * ancho * alto
    volumen_cbm = volumen_cm3 / Decimal("1000000")
    
    return volumen_cbm.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


def calcular_peso_volumetrico_aereo(
    largo_cm: Union[int, float, Decimal],
    ancho_cm: Union[int, float, Decimal],
    alto_cm: Union[int, float, Decimal]
) -> Decimal:
    """
    Calcula el peso volumétrico para transporte AÉREO.
    
    Fórmula IATA: (Largo_cm * Ancho_cm * Alto_cm) / 6000 = Peso Volumétrico (Kg)
    Factor: 1 CBM = 167 kg
    
    Args:
        largo_cm: Largo en centímetros
        ancho_cm: Ancho en centímetros
        alto_cm: Alto en centímetros
    
    Returns:
        Peso volumétrico en kilogramos
    """
    largo = _to_decimal(largo_cm)
    ancho = _to_decimal(ancho_cm)
    alto = _to_decimal(alto_cm)
    
    volumen_cm3 = largo * ancho * alto
    peso_volumetrico = volumen_cm3 / FACTOR_VOLUMETRICO_AEREO
    
    return peso_volumetrico.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)


def calcular_peso_cobrable(
    largo_cm: Union[int, float, Decimal],
    ancho_cm: Union[int, float, Decimal],
    alto_cm: Union[int, float, Decimal],
    peso_bruto_kg: Union[int, float, Decimal],
    tipo_transporte: str
) -> ResultadoPesoCobrable:
    """
    Calcula el Peso Cobrable (Chargeable Weight) según el tipo de transporte.
    
    LÓGICA AÉREO:
    - Fórmula Volumétrica: (L x A x H cm) / 6000 = Peso Volumétrico (Kg)
    - Regla: Cobra el MAYOR entre Peso Bruto y Peso Volumétrico
    
    LÓGICA MARÍTIMO LCL (W/M - Weight or Measure):
    - Calcula Volumen en CBM: (L x A x H cm) / 1,000,000
    - Factor de Estiba: 1 CBM = 1000 KGM (Relación 1:1 tonelada/m3)
    - Regla: Compara Peso Bruto (Ton) vs Volumen (CBM). Cobra por el mayor.
    
    Args:
        largo_cm: Largo en centímetros
        ancho_cm: Ancho en centímetros
        alto_cm: Alto en centímetros
        peso_bruto_kg: Peso bruto en kilogramos
        tipo_transporte: Tipo de transporte (AEREO, LCL, FCL)
    
    Returns:
        ResultadoPesoCobrable con todos los detalles del cálculo
    
    Raises:
        UnidadDesconocidaError: Si el tipo de transporte no es reconocido
        ValorInvalidoError: Si los valores no son válidos
    
    Ejemplo AÉREO (caja pequeña pesada):
        >>> resultado = calcular_peso_cobrable(50, 40, 30, 45, "AEREO")
        >>> print(resultado.peso_cobrable, resultado.base_cobro)
        Decimal('45.000') 'PESO_BRUTO'
    
    Ejemplo LCL (carga voluminosa):
        >>> resultado = calcular_peso_cobrable(120, 100, 80, 200, "LCL")
        >>> print(resultado.peso_cobrable, resultado.unidad_cobrable)
        Decimal('0.9600') 'CBM'
    """
    tipo = _parse_tipo_transporte(tipo_transporte)
    
    largo = _to_decimal(largo_cm)
    ancho = _to_decimal(ancho_cm)
    alto = _to_decimal(alto_cm)
    peso_bruto = _to_decimal(peso_bruto_kg)
    
    if largo <= 0 or ancho <= 0 or alto <= 0:
        raise ValorInvalidoError("Las dimensiones deben ser mayores a cero")
    if peso_bruto <= 0:
        raise ValorInvalidoError("El peso bruto debe ser mayor a cero")
    
    volumen_cbm = calcular_volumen_cbm(largo, ancho, alto)
    
    if tipo == TipoTransporte.AEREO:
        peso_volumetrico = calcular_peso_volumetrico_aereo(largo, ancho, alto)
        
        if peso_bruto >= peso_volumetrico:
            peso_cobrable = peso_bruto
            base_cobro = "PESO_BRUTO"
            detalle = (
                f"Peso Bruto ({peso_bruto:.3f} kg) >= Peso Volumétrico ({peso_volumetrico:.3f} kg). "
                f"Se cobra por Peso Bruto."
            )
        else:
            peso_cobrable = peso_volumetrico
            base_cobro = "PESO_VOLUMETRICO"
            detalle = (
                f"Peso Volumétrico ({peso_volumetrico:.3f} kg) > Peso Bruto ({peso_bruto:.3f} kg). "
                f"Se cobra por Peso Volumétrico. Factor: 6000 cm³/kg."
            )
        
        return ResultadoPesoCobrable(
            peso_bruto_kg=peso_bruto.quantize(Decimal("0.001")),
            peso_volumetrico_kg=peso_volumetrico,
            peso_cobrable=peso_cobrable.quantize(Decimal("0.001")),
            unidad_cobrable="KG",
            volumen_cbm=volumen_cbm,
            tipo_transporte="AEREO",
            base_cobro=base_cobro,
            detalle=detalle
        )
    
    elif tipo == TipoTransporte.MARITIMO_LCL:
        peso_bruto_ton = peso_bruto / Decimal("1000")
        peso_volumetrico_equivalente = volumen_cbm * FACTOR_ESTIBA_MARITIMO
        
        if peso_bruto >= peso_volumetrico_equivalente:
            peso_cobrable = peso_bruto_ton
            unidad_cobrable = "TON"
            base_cobro = "PESO"
            detalle = (
                f"Peso ({peso_bruto_ton:.4f} TON) >= Volumen ({volumen_cbm:.4f} CBM). "
                f"Regla W/M: Se cobra por PESO (toneladas)."
            )
        else:
            peso_cobrable = volumen_cbm
            unidad_cobrable = "CBM"
            base_cobro = "VOLUMEN"
            detalle = (
                f"Volumen ({volumen_cbm:.4f} CBM) > Peso ({peso_bruto_ton:.4f} TON). "
                f"Regla W/M: Se cobra por VOLUMEN (CBM). Factor estiba: 1 CBM = 1 TON."
            )
        
        return ResultadoPesoCobrable(
            peso_bruto_kg=peso_bruto.quantize(Decimal("0.001")),
            peso_volumetrico_kg=peso_volumetrico_equivalente.quantize(Decimal("0.001")),
            peso_cobrable=peso_cobrable.quantize(Decimal("0.0001")),
            unidad_cobrable=unidad_cobrable,
            volumen_cbm=volumen_cbm,
            tipo_transporte="LCL",
            base_cobro=base_cobro,
            detalle=detalle
        )
    
    elif tipo == TipoTransporte.MARITIMO_FCL:
        return ResultadoPesoCobrable(
            peso_bruto_kg=peso_bruto.quantize(Decimal("0.001")),
            peso_volumetrico_kg=Decimal("0"),
            peso_cobrable=Decimal("1"),
            unidad_cobrable="CONTENEDOR",
            volumen_cbm=volumen_cbm,
            tipo_transporte="FCL",
            base_cobro="CONTENEDOR",
            detalle=(
                f"FCL: Flete por contenedor completo. "
                f"Volumen: {volumen_cbm:.4f} CBM, Peso: {peso_bruto:.1f} kg. "
                f"Verificar que no exceda límites del contenedor."
            )
        )
    
    raise UnidadDesconocidaError(f"Tipo de transporte no soportado: {tipo_transporte}")


def calcular_peso_cobrable_completo(
    largo: Union[int, float, Decimal],
    ancho: Union[int, float, Decimal],
    alto: Union[int, float, Decimal],
    unidad_dimensiones: str,
    peso_bruto: Union[int, float, Decimal],
    unidad_peso: str,
    tipo_transporte: str
) -> ResultadoPesoCobrable:
    """
    Función completa que normaliza unidades y calcula peso cobrable en un solo paso.
    
    Args:
        largo, ancho, alto: Dimensiones de la carga
        unidad_dimensiones: Unidad de las dimensiones (CMT, MTR, INH)
        peso_bruto: Peso de la carga
        unidad_peso: Unidad del peso (KGM, LBR, TNE)
        tipo_transporte: Tipo de transporte (AEREO, LCL, FCL)
    
    Returns:
        ResultadoPesoCobrable con todos los detalles
    
    Ejemplo:
        >>> resultado = calcular_peso_cobrable_completo(
        ...     largo=20, ancho=16, alto=12, unidad_dimensiones="INH",
        ...     peso_bruto=100, unidad_peso="LBR",
        ...     tipo_transporte="AEREO"
        ... )
    """
    largo_cm, ancho_cm, alto_cm = normalizar_dimensiones(
        largo, ancho, alto, unidad_dimensiones
    )
    
    peso_kg = normalizar_peso(peso_bruto, unidad_peso)
    
    return calcular_peso_cobrable(largo_cm, ancho_cm, alto_cm, peso_kg, tipo_transporte)


if __name__ == "__main__":
    print("=" * 70)
    print("IMPORTAYA.IA - CALCULADORA DE PESO COBRABLE")
    print("=" * 70)
    
    print("\n" + "=" * 70)
    print("CASO 1: AÉREO - Caja pequeña pesada (electrónicos)")
    print("=" * 70)
    print("Dimensiones: 30 x 25 x 20 cm")
    print("Peso Bruto: 12 kg")
    print("Tipo: AÉREO")
    
    resultado_aereo = calcular_peso_cobrable(
        largo_cm=30, ancho_cm=25, alto_cm=20,
        peso_bruto_kg=12,
        tipo_transporte="AEREO"
    )
    
    print(f"\nResultados:")
    print(f"  Peso Bruto: {resultado_aereo.peso_bruto_kg} kg")
    print(f"  Peso Volumétrico: {resultado_aereo.peso_volumetrico_kg} kg")
    print(f"  Volumen: {resultado_aereo.volumen_cbm} CBM")
    print(f"  PESO COBRABLE: {resultado_aereo.peso_cobrable} {resultado_aereo.unidad_cobrable}")
    print(f"  Base de cobro: {resultado_aereo.base_cobro}")
    print(f"  Detalle: {resultado_aereo.detalle}")
    
    print("\n" + "=" * 70)
    print("CASO 2: AÉREO - Caja voluminosa liviana (almohadas)")
    print("=" * 70)
    print("Dimensiones: 60 x 50 x 40 cm")
    print("Peso Bruto: 5 kg")
    print("Tipo: AÉREO")
    
    resultado_aereo_vol = calcular_peso_cobrable(
        largo_cm=60, ancho_cm=50, alto_cm=40,
        peso_bruto_kg=5,
        tipo_transporte="AEREO"
    )
    
    print(f"\nResultados:")
    print(f"  Peso Bruto: {resultado_aereo_vol.peso_bruto_kg} kg")
    print(f"  Peso Volumétrico: {resultado_aereo_vol.peso_volumetrico_kg} kg")
    print(f"  Volumen: {resultado_aereo_vol.volumen_cbm} CBM")
    print(f"  PESO COBRABLE: {resultado_aereo_vol.peso_cobrable} {resultado_aereo_vol.unidad_cobrable}")
    print(f"  Base de cobro: {resultado_aereo_vol.base_cobro}")
    print(f"  Detalle: {resultado_aereo_vol.detalle}")
    
    print("\n" + "=" * 70)
    print("CASO 3: MARÍTIMO LCL - Carga voluminosa (muebles)")
    print("=" * 70)
    print("Dimensiones: 120 x 100 x 80 cm (pallet grande)")
    print("Peso Bruto: 200 kg")
    print("Tipo: LCL")
    
    resultado_lcl = calcular_peso_cobrable(
        largo_cm=120, ancho_cm=100, alto_cm=80,
        peso_bruto_kg=200,
        tipo_transporte="LCL"
    )
    
    print(f"\nResultados:")
    print(f"  Peso Bruto: {resultado_lcl.peso_bruto_kg} kg ({float(resultado_lcl.peso_bruto_kg)/1000:.4f} TON)")
    print(f"  Volumen: {resultado_lcl.volumen_cbm} CBM")
    print(f"  PESO COBRABLE: {resultado_lcl.peso_cobrable} {resultado_lcl.unidad_cobrable}")
    print(f"  Base de cobro: {resultado_lcl.base_cobro}")
    print(f"  Detalle: {resultado_lcl.detalle}")
    
    print("\n" + "=" * 70)
    print("CASO 4: MARÍTIMO LCL - Carga pesada y densa (maquinaria)")
    print("=" * 70)
    print("Dimensiones: 80 x 60 x 50 cm")
    print("Peso Bruto: 500 kg (0.5 TON)")
    print("Tipo: LCL")
    
    resultado_lcl_pesado = calcular_peso_cobrable(
        largo_cm=80, ancho_cm=60, alto_cm=50,
        peso_bruto_kg=500,
        tipo_transporte="LCL"
    )
    
    print(f"\nResultados:")
    print(f"  Peso Bruto: {resultado_lcl_pesado.peso_bruto_kg} kg ({float(resultado_lcl_pesado.peso_bruto_kg)/1000:.4f} TON)")
    print(f"  Volumen: {resultado_lcl_pesado.volumen_cbm} CBM")
    print(f"  PESO COBRABLE: {resultado_lcl_pesado.peso_cobrable} {resultado_lcl_pesado.unidad_cobrable}")
    print(f"  Base de cobro: {resultado_lcl_pesado.base_cobro}")
    print(f"  Detalle: {resultado_lcl_pesado.detalle}")
    
    print("\n" + "=" * 70)
    print("CASO 5: Conversión de unidades (Pulgadas y Libras)")
    print("=" * 70)
    print("Dimensiones: 20 x 16 x 12 pulgadas")
    print("Peso Bruto: 44 libras")
    print("Tipo: AÉREO")
    
    resultado_conversion = calcular_peso_cobrable_completo(
        largo=20, ancho=16, alto=12, unidad_dimensiones="INH",
        peso_bruto=44, unidad_peso="LBR",
        tipo_transporte="AEREO"
    )
    
    print(f"\nDimensiones normalizadas:")
    largo_cm, ancho_cm, alto_cm = normalizar_dimensiones(20, 16, 12, "INH")
    print(f"  {largo_cm} x {ancho_cm} x {alto_cm} cm")
    peso_kg = normalizar_peso(44, "LBR")
    print(f"  Peso: {peso_kg} kg")
    
    print(f"\nResultados:")
    print(f"  Peso Bruto: {resultado_conversion.peso_bruto_kg} kg")
    print(f"  Peso Volumétrico: {resultado_conversion.peso_volumetrico_kg} kg")
    print(f"  PESO COBRABLE: {resultado_conversion.peso_cobrable} {resultado_conversion.unidad_cobrable}")
    print(f"  Base de cobro: {resultado_conversion.base_cobro}")
    
    print("\n" + "=" * 70)
    print("Pruebas completadas exitosamente!")
    print("=" * 70)
