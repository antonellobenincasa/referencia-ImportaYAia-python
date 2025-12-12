"""
container_logic.py - Optimizador de Contenedores para ImportaYa.ia

Este módulo determina la mejor opción de contenedor (LCL vs FCL) y
selecciona el tipo óptimo de contenedor basado en volumen y peso de la carga.

Constantes del Sistema MARÍTIMO LCL:
- LCL estándar: volumen <= 15 CBM Y peso <= 4.99 TON (sin recargos)
- LCL con OWS (Overweight Surcharge):
  - 5.00 a 7.99 TON: USD 10 por CBM/TON extra
  - 8.00 a 9.99 TON: USD 15 por CBM/TON extra
  - 10.00 a 11.99 TON: USD 25 por CBM/TON extra
- LCL > 12 TON: Requiere cotización manual o alternativas

Constantes del Sistema FCL:
- 20GP: Max 30 CBM, 27,000 kg
- 40GP: Max 62 CBM, 27,000 kg
- 40HC: Max 68 CBM, 27,000 kg (priorizar para voluminosos)
- 40NOR: Max 62 CBM, 27,000 kg (Non Operating Reefer - no refrigera)

Contenedores Especiales (requieren cotización manual):
- 20RF/40RF: Reefer (refrigerados)
- 20FR/40FR: Flat Rack
- 20OT/40OT: Open Top

Lógica de Decisión:
1. Si volumen <= 15 CBM Y peso <= 4.99 TON → LCL estándar
2. Si volumen <= 15 CBM Y peso 5-11.99 TON → LCL con OWS
3. Si peso >= 12 TON → Cotización manual o sugerir alternativas
4. Sino, seleccionar contenedor FCL óptimo

Soporte Multi-Contenedor:
- El LEAD puede seleccionar tipo, cantidad y mezcla de contenedores
- Contenedores automáticos: 20GP, 40GP, 40HC, 40NOR
- Contenedores manuales: REEFER, FLAT RACK, OPEN TOP

Autor: ImportaYa.ia
Versión: 3.0.0
"""

from decimal import Decimal, ROUND_HALF_UP, ROUND_CEILING
from typing import Dict, Union, Optional, List
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)


@dataclass
class ContenedorSpec:
    """Especificaciones de un tipo de contenedor"""
    codigo: str
    nombre_completo: str
    nombre_corto: str
    volumen_max_cbm: Decimal
    peso_max_kg: Decimal
    cotizacion_automatica: bool = True
    descripcion: str = ""


CONTENEDORES = {
    "20GP": ContenedorSpec(
        codigo="20GP",
        nombre_completo="1 x 20' General Purpose",
        nombre_corto="20' Standard",
        volumen_max_cbm=Decimal("30"),
        peso_max_kg=Decimal("27000"),
        cotizacion_automatica=True,
        descripcion="Contenedor estándar de 20 pies",
    ),
    "40GP": ContenedorSpec(
        codigo="40GP",
        nombre_completo="1 x 40' General Purpose",
        nombre_corto="40' Standard",
        volumen_max_cbm=Decimal("62"),
        peso_max_kg=Decimal("27000"),
        cotizacion_automatica=True,
        descripcion="Contenedor estándar de 40 pies",
    ),
    "40HC": ContenedorSpec(
        codigo="40HC",
        nombre_completo="1 x 40' High Cube",
        nombre_corto="40' High Cube",
        volumen_max_cbm=Decimal("68"),
        peso_max_kg=Decimal("27000"),
        cotizacion_automatica=True,
        descripcion="Contenedor de 40 pies con altura extra (9'6\")",
    ),
    "40NOR": ContenedorSpec(
        codigo="40NOR",
        nombre_completo="1 x 40' Non Operating Reefer",
        nombre_corto="40' NOR",
        volumen_max_cbm=Decimal("62"),
        peso_max_kg=Decimal("27000"),
        cotizacion_automatica=True,
        descripcion="Contenedor reefer sin refrigeración activa (solo aislamiento)",
    ),
}

CONTENEDORES_ESPECIALES = {
    "20RF": ContenedorSpec(
        codigo="20RF",
        nombre_completo="1 x 20' Reefer",
        nombre_corto="20' Reefer",
        volumen_max_cbm=Decimal("28"),
        peso_max_kg=Decimal("27000"),
        cotizacion_automatica=False,
        descripcion="Contenedor refrigerado de 20 pies",
    ),
    "40RF": ContenedorSpec(
        codigo="40RF",
        nombre_completo="1 x 40' Reefer",
        nombre_corto="40' Reefer",
        volumen_max_cbm=Decimal("60"),
        peso_max_kg=Decimal("27000"),
        cotizacion_automatica=False,
        descripcion="Contenedor refrigerado de 40 pies",
    ),
    "20FR": ContenedorSpec(
        codigo="20FR",
        nombre_completo="1 x 20' Flat Rack",
        nombre_corto="20' Flat Rack",
        volumen_max_cbm=Decimal("30"),
        peso_max_kg=Decimal("31000"),
        cotizacion_automatica=False,
        descripcion="Plataforma para carga sobredimensionada",
    ),
    "40FR": ContenedorSpec(
        codigo="40FR",
        nombre_completo="1 x 40' Flat Rack",
        nombre_corto="40' Flat Rack",
        volumen_max_cbm=Decimal("62"),
        peso_max_kg=Decimal("40000"),
        cotizacion_automatica=False,
        descripcion="Plataforma para carga sobredimensionada",
    ),
    "20OT": ContenedorSpec(
        codigo="20OT",
        nombre_completo="1 x 20' Open Top",
        nombre_corto="20' Open Top",
        volumen_max_cbm=Decimal("30"),
        peso_max_kg=Decimal("27000"),
        cotizacion_automatica=False,
        descripcion="Contenedor con techo abierto para carga alta",
    ),
    "40OT": ContenedorSpec(
        codigo="40OT",
        nombre_completo="1 x 40' Open Top",
        nombre_corto="40' Open Top",
        volumen_max_cbm=Decimal("65"),
        peso_max_kg=Decimal("27000"),
        cotizacion_automatica=False,
        descripcion="Contenedor con techo abierto para carga alta",
    ),
}

TODOS_CONTENEDORES = {**CONTENEDORES, **CONTENEDORES_ESPECIALES}

LCL_MAX_VOLUMEN_CBM = Decimal("15")
LCL_PESO_SIN_RECARGO_KG = Decimal("4990")
LCL_PESO_MAXIMO_KG = Decimal("11990")
LCL_PESO_COTIZACION_MANUAL_KG = Decimal("12000")
FCL_MAX_PESO_KG = Decimal("27000")

OWS_TARIFAS = [
    {"min_kg": Decimal("5000"), "max_kg": Decimal("7990"), "usd_por_unidad": Decimal("10")},
    {"min_kg": Decimal("8000"), "max_kg": Decimal("9990"), "usd_por_unidad": Decimal("15")},
    {"min_kg": Decimal("10000"), "max_kg": Decimal("11990"), "usd_por_unidad": Decimal("25")},
]

NAVIERAS_LCL = {
    "MSL": {
        "nombre": "Maritime Services Line Del Ecuador (MSL)",
        "codigo": "MSL",
        "max_volumen_cbm": Decimal("25"),
        "max_peso_kg": Decimal("5000"),
        "aplica_ows": False,
        "descripcion": "MSL permite LCL hasta 25 CBM y 5 TON por B/L"
    },
    "STANDARD": {
        "nombre": "Naviera Estándar",
        "codigo": "STANDARD",
        "max_volumen_cbm": Decimal("15"),
        "max_peso_kg": Decimal("4990"),
        "aplica_ows": True,
        "descripcion": "Límites estándar LCL con OWS para sobrepeso"
    }
}


@dataclass
class ResultadoOWS:
    """Resultado del cálculo de OWS (Overweight Surcharge)"""
    aplica_ows: bool
    peso_excedente_kg: Decimal
    tarifa_usd_por_unidad: Decimal
    unidades_cobro: Decimal
    total_ows_usd: Decimal
    rango_peso: str


@dataclass
class ResultadoOptimizacion:
    """Resultado de la optimización de contenedor"""
    recomendacion_principal: str
    cantidad: int
    tipo_codigo: str
    razonamiento: str
    advertencia_peso: bool
    distribucion_sugerida: str
    volumen_total_cbm: Decimal
    peso_total_kg: Decimal
    es_lcl: bool
    requiere_cotizacion_manual: bool = False
    alternativas_sugeridas: Optional[list] = None
    ows: Optional[ResultadoOWS] = None
    detalle_adicional: Optional[str] = None


def _to_decimal(value: Union[int, float, str, Decimal]) -> Decimal:
    """Convierte un valor a Decimal"""
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def get_navieras_lcl_disponibles() -> list:
    """Retorna lista de navieras LCL disponibles para el usuario."""
    return [
        {"codigo": k, "nombre": v["nombre"], "max_cbm": float(v["max_volumen_cbm"]), 
         "max_ton": float(v["max_peso_kg"]/1000), "descripcion": v["descripcion"]}
        for k, v in NAVIERAS_LCL.items()
    ]


def califica_para_naviera_lcl(volumen_cbm: Decimal, peso_kg: Decimal, naviera: str = "STANDARD") -> Dict:
    """Verifica si la carga califica para LCL con una naviera específica."""
    volumen = _to_decimal(volumen_cbm)
    peso = _to_decimal(peso_kg)
    
    nav = NAVIERAS_LCL.get(naviera.upper(), NAVIERAS_LCL["STANDARD"])
    califica = volumen <= nav["max_volumen_cbm"] and peso <= nav["max_peso_kg"]
    
    return {
        "naviera": nav["nombre"],
        "codigo": nav["codigo"],
        "califica_lcl": califica,
        "max_volumen_cbm": float(nav["max_volumen_cbm"]),
        "max_peso_kg": float(nav["max_peso_kg"]),
        "volumen_carga": float(volumen),
        "peso_carga": float(peso),
        "mensaje": nav["descripcion"] if califica else f"Carga excede límites de {nav['nombre']}"
    }


def calcular_ows(
    volumen_cbm: Decimal,
    peso_kg: Decimal
) -> Optional[ResultadoOWS]:
    """
    Calcula el OWS (Overweight Surcharge) para embarques LCL.
    
    Tarifas OWS por rango de peso:
    - 5.00 a 7.99 TON: USD 10 por CBM o TON extra (el mayor)
    - 8.00 a 9.99 TON: USD 15 por CBM o TON extra (el mayor)
    - 10.00 a 11.99 TON: USD 25 por CBM o TON extra (el mayor)
    
    Returns:
        ResultadoOWS si aplica recargo, None si no aplica
    """
    if peso_kg <= LCL_PESO_SIN_RECARGO_KG:
        return None
    
    if peso_kg >= LCL_PESO_COTIZACION_MANUAL_KG:
        return None
    
    for tarifa in OWS_TARIFAS:
        if tarifa["min_kg"] <= peso_kg <= tarifa["max_kg"]:
            peso_ton = peso_kg / Decimal("1000")
            unidades_cobro = max(volumen_cbm, peso_ton)
            total_ows = unidades_cobro * tarifa["usd_por_unidad"]
            
            rango_min_ton = tarifa["min_kg"] / Decimal("1000")
            rango_max_ton = tarifa["max_kg"] / Decimal("1000")
            
            return ResultadoOWS(
                aplica_ows=True,
                peso_excedente_kg=peso_kg - LCL_PESO_SIN_RECARGO_KG,
                tarifa_usd_por_unidad=tarifa["usd_por_unidad"],
                unidades_cobro=unidades_cobro.quantize(Decimal("0.01")),
                total_ows_usd=total_ows.quantize(Decimal("0.01")),
                rango_peso=f"{rango_min_ton:.2f} - {rango_max_ton:.2f} TON"
            )
    
    return None


def calcular_contenedores_necesarios(
    volumen_cbm: Decimal,
    peso_kg: Decimal,
    contenedor: ContenedorSpec
) -> int:
    """
    Calcula cuántos contenedores del tipo especificado se necesitan.
    
    Considera tanto límite de volumen como de peso (27 TON máximo).
    Usa CEILING para asegurar capacidad suficiente.
    """
    contenedores_por_volumen = (volumen_cbm / contenedor.volumen_max_cbm).quantize(
        Decimal("1"), rounding=ROUND_CEILING
    )
    if contenedores_por_volumen < 1:
        contenedores_por_volumen = Decimal("1")
    
    contenedores_por_peso = (peso_kg / contenedor.peso_max_kg).quantize(
        Decimal("1"), rounding=ROUND_CEILING
    )
    if contenedores_por_peso < 1:
        contenedores_por_peso = Decimal("1")
    
    return int(max(contenedores_por_volumen, contenedores_por_peso))


def evaluar_opcion_contenedor(
    volumen_cbm: Decimal,
    peso_kg: Decimal,
    contenedor: ContenedorSpec
) -> Dict:
    """
    Evalúa una opción de contenedor y retorna métricas.
    """
    cantidad = calcular_contenedores_necesarios(volumen_cbm, peso_kg, contenedor)
    
    capacidad_total_volumen = contenedor.volumen_max_cbm * cantidad
    capacidad_total_peso = contenedor.peso_max_kg * cantidad
    
    uso_volumen = (volumen_cbm / capacidad_total_volumen * 100).quantize(Decimal("0.1"))
    uso_peso = (peso_kg / capacidad_total_peso * 100).quantize(Decimal("0.1"))
    
    espacio_desperdiciado = capacidad_total_volumen - volumen_cbm
    
    return {
        "codigo": contenedor.codigo,
        "cantidad": cantidad,
        "capacidad_volumen_cbm": capacidad_total_volumen,
        "capacidad_peso_kg": capacidad_total_peso,
        "uso_volumen_pct": uso_volumen,
        "uso_peso_pct": uso_peso,
        "espacio_desperdiciado_cbm": espacio_desperdiciado,
        "peso_por_contenedor_kg": (peso_kg / cantidad).quantize(Decimal("0.1")),
    }


def optimizar_contenedor(
    volumen_cbm: Union[int, float, Decimal],
    peso_kg: Union[int, float, Decimal]
) -> ResultadoOptimizacion:
    """
    Determina la mejor opción de contenedor basado en volumen y peso.
    
    Lógica de Decisión MARÍTIMO LCL:
    1. Si volumen <= 15 CBM Y peso <= 4.99 TON → LCL estándar (sin recargos)
    2. Si volumen <= 15 CBM Y peso 5.00-11.99 TON → LCL con OWS
    3. Si peso >= 12 TON → Cotización manual o alternativas
    
    Lógica FCL:
    4. Sino, seleccionar contenedor FCL óptimo
    5. CRÍTICO: Si peso excede 27 TON por contenedor, dividir en múltiples
    
    Args:
        volumen_cbm: Volumen total de la carga en metros cúbicos
        peso_kg: Peso total de la carga en kilogramos
    
    Returns:
        ResultadoOptimizacion con la recomendación completa
    """
    volumen = _to_decimal(volumen_cbm)
    peso = _to_decimal(peso_kg)
    
    if volumen <= 0 or peso <= 0:
        raise ValueError("El volumen y peso deben ser mayores a cero")
    
    peso_ton = peso / Decimal("1000")
    
    if volumen <= LCL_MAX_VOLUMEN_CBM and peso >= LCL_PESO_COTIZACION_MANUAL_KG:
        peso_mitad = peso / 2
        alternativas = [
            f"Opción A: Partir en 2 embarques LCL de ~{peso_mitad/1000:.2f} TON cada uno",
            f"Opción B: Cotizar como FCL 1x20GP (si vol <= 30 CBM y peso <= 27 TON)"
        ]
        
        return ResultadoOptimizacion(
            recomendacion_principal="COTIZACIÓN MANUAL REQUERIDA",
            cantidad=0,
            tipo_codigo="MANUAL",
            razonamiento=(
                f"Carga de {volumen:.2f} CBM y {peso_ton:.2f} TON excede límite LCL de 12 TON. "
                f"No aplica cotización automática. Se requiere cotización caso a caso."
            ),
            advertencia_peso=True,
            distribucion_sugerida="Consultar alternativas sugeridas.",
            volumen_total_cbm=volumen,
            peso_total_kg=peso,
            es_lcl=False,
            requiere_cotizacion_manual=True,
            alternativas_sugeridas=alternativas,
            detalle_adicional="Peso excede 12 TON - límite máximo para LCL automático."
        )
    
    if volumen <= LCL_MAX_VOLUMEN_CBM and peso <= LCL_PESO_MAXIMO_KG:
        ows_resultado = calcular_ows(volumen, peso)
        
        if ows_resultado is None:
            razonamiento = (
                f"Carga de {volumen:.2f} CBM y {peso_ton:.2f} TON califica para LCL estándar. "
                f"Umbrales: <= {LCL_MAX_VOLUMEN_CBM} CBM y <= 4.99 TON (sin recargos)."
            )
            detalle = "Se cotizará por CBM o peso (W/M), el que sea mayor."
        else:
            razonamiento = (
                f"Carga de {volumen:.2f} CBM y {peso_ton:.2f} TON califica para LCL con recargo OWS. "
                f"Rango de peso: {ows_resultado.rango_peso}. "
                f"Recargo OWS: USD {ows_resultado.tarifa_usd_por_unidad} x {ows_resultado.unidades_cobro} = USD {ows_resultado.total_ows_usd}."
            )
            detalle = f"OWS (Overweight Surcharge): USD {ows_resultado.total_ows_usd} adicional al flete base."
        
        return ResultadoOptimizacion(
            recomendacion_principal="LCL (Carga Suelta Consolidada)" + (" + OWS" if ows_resultado else ""),
            cantidad=1,
            tipo_codigo="LCL",
            razonamiento=razonamiento,
            advertencia_peso=ows_resultado is not None,
            distribucion_sugerida="Carga consolidada con otros embarques.",
            volumen_total_cbm=volumen,
            peso_total_kg=peso,
            es_lcl=True,
            ows=ows_resultado,
            detalle_adicional=detalle
        )
    
    evaluaciones = []
    for codigo, contenedor in CONTENEDORES.items():
        evaluacion = evaluar_opcion_contenedor(volumen, peso, contenedor)
        evaluaciones.append(evaluacion)
    
    mejor_opcion: Dict = {}
    mejor_score: Optional[Decimal] = None
    
    es_carga_voluminosa = volumen > Decimal("60")
    es_carga_pesada = peso > Decimal("25000")
    
    for ev in evaluaciones:
        total_capacidad_cbm = CONTENEDORES[ev["codigo"]].volumen_max_cbm * ev["cantidad"]
        espacio_extra = total_capacidad_cbm - volumen
        
        if espacio_extra < 0:
            score = espacio_extra * Decimal("-100")
        else:
            score = espacio_extra + (ev["cantidad"] * Decimal("20"))
            
            if es_carga_voluminosa and ev["codigo"] == "40HC":
                score = score * Decimal("0.7")
            elif es_carga_pesada and ev["codigo"] == "20GP" and ev["cantidad"] <= 2:
                score = score * Decimal("0.8")
        
        if mejor_score is None or score < mejor_score:
            mejor_score = score
            mejor_opcion = ev
    
    if not mejor_opcion:
        mejor_opcion = evaluaciones[0]
    
    peso_por_contenedor = peso / mejor_opcion["cantidad"]
    advertencia_peso = peso_por_contenedor > FCL_MAX_PESO_KG * Decimal("0.95")
    
    contenedor_spec = CONTENEDORES[mejor_opcion["codigo"]]
    
    if mejor_opcion["cantidad"] == 1:
        recomendacion = contenedor_spec.nombre_completo
    else:
        recomendacion = f"{mejor_opcion['cantidad']} x {contenedor_spec.nombre_corto}"
    
    razonamiento_parts = [
        f"Carga de {volumen:.2f} CBM y {peso:.0f} kg excede límites LCL."
    ]
    
    if mejor_opcion["cantidad"] == 1:
        razonamiento_parts.append(
            f"Un {contenedor_spec.nombre_corto} es suficiente "
            f"(capacidad: {contenedor_spec.volumen_max_cbm} CBM, {contenedor_spec.peso_max_kg:.0f} kg)."
        )
    else:
        razonamiento_parts.append(
            f"Se requieren {mejor_opcion['cantidad']} contenedores {contenedor_spec.nombre_corto} "
            f"para distribuir la carga de manera segura."
        )
    
    if advertencia_peso:
        razonamiento_parts.append(
            f"⚠️ Peso cercano al límite ({peso_por_contenedor:.0f} kg por unidad, máx: {FCL_MAX_PESO_KG:.0f} kg)."
        )
    
    razonamiento_parts.append(
        f"Uso: {mejor_opcion['uso_volumen_pct']:.1f}% volumen, {mejor_opcion['uso_peso_pct']:.1f}% peso."
    )
    
    distribucion = f"Carga total distribuida en {mejor_opcion['cantidad']} unidad(es)."
    if mejor_opcion["cantidad"] > 1:
        distribucion += f" Aprox. {volumen/mejor_opcion['cantidad']:.2f} CBM y {peso_por_contenedor:.0f} kg por contenedor."
    
    return ResultadoOptimizacion(
        recomendacion_principal=recomendacion,
        cantidad=mejor_opcion["cantidad"],
        tipo_codigo=mejor_opcion["codigo"],
        razonamiento=" ".join(razonamiento_parts),
        advertencia_peso=advertencia_peso,
        distribucion_sugerida=distribucion,
        volumen_total_cbm=volumen,
        peso_total_kg=peso,
        es_lcl=False,
        detalle_adicional=None
    )


def optimizar_contenedor_json(
    volumen_cbm: Union[int, float, Decimal],
    peso_kg: Union[int, float, Decimal]
) -> Dict:
    """
    Versión de la función que retorna un diccionario listo para JSON.
    
    Args:
        volumen_cbm: Volumen total en CBM
        peso_kg: Peso total en kg
    
    Returns:
        Diccionario con la estructura esperada por el frontend
    """
    resultado = optimizar_contenedor(volumen_cbm, peso_kg)
    
    ows_dict = None
    if resultado.ows:
        ows_dict = {
            "aplica_ows": resultado.ows.aplica_ows,
            "peso_excedente_kg": float(resultado.ows.peso_excedente_kg),
            "tarifa_usd_por_unidad": float(resultado.ows.tarifa_usd_por_unidad),
            "unidades_cobro": float(resultado.ows.unidades_cobro),
            "total_ows_usd": float(resultado.ows.total_ows_usd),
            "rango_peso": resultado.ows.rango_peso
        }
    
    return {
        "recomendacion_principal": resultado.recomendacion_principal,
        "cantidad": resultado.cantidad,
        "tipo_codigo": resultado.tipo_codigo,
        "razonamiento": resultado.razonamiento,
        "advertencia_peso": resultado.advertencia_peso,
        "distribucion_sugerida": resultado.distribucion_sugerida,
        "volumen_total_cbm": float(resultado.volumen_total_cbm),
        "peso_total_kg": float(resultado.peso_total_kg),
        "es_lcl": resultado.es_lcl,
        "requiere_cotizacion_manual": resultado.requiere_cotizacion_manual,
        "alternativas_sugeridas": resultado.alternativas_sugeridas,
        "ows": ows_dict,
        "detalle_adicional": resultado.detalle_adicional
    }


@dataclass
class ContenedorSeleccion:
    """Representa una selección de contenedor por el LEAD"""
    tipo_codigo: str
    cantidad: int
    
    def __post_init__(self):
        if self.cantidad < 1:
            raise ValueError("La cantidad debe ser al menos 1")
        if self.tipo_codigo not in TODOS_CONTENEDORES:
            raise ValueError(f"Tipo de contenedor '{self.tipo_codigo}' no válido")


@dataclass
class ResultadoMultiContenedor:
    """Resultado de validación y cálculo de selección multi-contenedor"""
    selecciones: List[ContenedorSeleccion]
    volumen_total_cbm: Decimal
    peso_max_total_kg: Decimal
    total_contenedores: int
    requiere_cotizacion_manual: bool
    contenedores_manuales: List[str]
    contenedores_automaticos: List[str]
    resumen: str
    advertencias: List[str]
    descripcion_completa: str


def get_contenedores_disponibles() -> Dict:
    """Retorna todos los contenedores disponibles para selección."""
    resultado = {
        "automaticos": [],
        "manuales": [],
    }
    
    for codigo, spec in CONTENEDORES.items():
        resultado["automaticos"].append({
            "codigo": codigo,
            "nombre": spec.nombre_completo,
            "nombre_corto": spec.nombre_corto,
            "volumen_max_cbm": float(spec.volumen_max_cbm),
            "peso_max_kg": float(spec.peso_max_kg),
            "descripcion": spec.descripcion,
            "cotizacion_automatica": True,
        })
    
    for codigo, spec in CONTENEDORES_ESPECIALES.items():
        resultado["manuales"].append({
            "codigo": codigo,
            "nombre": spec.nombre_completo,
            "nombre_corto": spec.nombre_corto,
            "volumen_max_cbm": float(spec.volumen_max_cbm),
            "peso_max_kg": float(spec.peso_max_kg),
            "descripcion": spec.descripcion,
            "cotizacion_automatica": False,
            "mensaje_manual": "Requiere cotización manual (2-3 días laborables)",
        })
    
    return resultado


def validar_seleccion_multicontenedor(
    selecciones: List[Dict[str, Union[str, int]]]
) -> ResultadoMultiContenedor:
    """
    Valida y procesa una selección multi-contenedor del LEAD.
    
    Args:
        selecciones: Lista de diccionarios con formato:
            [{"tipo": "20GP", "cantidad": 2}, {"tipo": "40HC", "cantidad": 1}]
    
    Returns:
        ResultadoMultiContenedor con validación completa
    
    Raises:
        ValueError: Si hay errores de validación
    """
    if not selecciones:
        raise ValueError("Debe seleccionar al menos un contenedor")
    
    contenedores_procesados: List[ContenedorSeleccion] = []
    contenedores_manuales: List[str] = []
    contenedores_automaticos: List[str] = []
    advertencias: List[str] = []
    
    volumen_total = Decimal("0")
    peso_max_total = Decimal("0")
    total_contenedores = 0
    
    for sel in selecciones:
        tipo = sel.get("tipo", "").upper()
        cantidad = int(sel.get("cantidad", 0))
        
        if not tipo:
            raise ValueError("Cada selección debe tener un tipo de contenedor")
        if cantidad < 1:
            raise ValueError(f"La cantidad para {tipo} debe ser al menos 1")
        
        if tipo not in TODOS_CONTENEDORES:
            raise ValueError(f"Tipo de contenedor '{tipo}' no reconocido")
        
        spec = TODOS_CONTENEDORES[tipo]
        
        contenedores_procesados.append(ContenedorSeleccion(tipo, cantidad))
        
        volumen_total += spec.volumen_max_cbm * cantidad
        peso_max_total += spec.peso_max_kg * cantidad
        total_contenedores += cantidad
        
        if spec.cotizacion_automatica:
            contenedores_automaticos.append(f"{cantidad}x{tipo}")
        else:
            contenedores_manuales.append(f"{cantidad}x{tipo}")
            advertencias.append(
                f"{cantidad}x{spec.nombre_corto}: Requiere cotización manual (2-3 días laborables)"
            )
    
    requiere_manual = len(contenedores_manuales) > 0
    
    partes_resumen = []
    if contenedores_automaticos:
        partes_resumen.append(" + ".join(contenedores_automaticos))
    if contenedores_manuales:
        partes_resumen.append(" + ".join(contenedores_manuales) + " (MANUAL)")
    
    resumen = " + ".join(partes_resumen) if partes_resumen else "Sin selección"
    
    descripcion_parts = [f"Selección: {resumen}"]
    descripcion_parts.append(f"Capacidad total: {volumen_total:.0f} CBM / {peso_max_total/1000:.1f} TON")
    
    if requiere_manual:
        descripcion_parts.append(
            "NOTA: Incluye contenedores especiales que requieren cotización manual. "
            "Un asesor le contactará en 2-3 días laborables con el precio."
        )
    
    return ResultadoMultiContenedor(
        selecciones=contenedores_procesados,
        volumen_total_cbm=volumen_total,
        peso_max_total_kg=peso_max_total,
        total_contenedores=total_contenedores,
        requiere_cotizacion_manual=requiere_manual,
        contenedores_manuales=contenedores_manuales,
        contenedores_automaticos=contenedores_automaticos,
        resumen=resumen,
        advertencias=advertencias,
        descripcion_completa=" | ".join(descripcion_parts)
    )


def validar_seleccion_multicontenedor_json(
    selecciones: List[Dict[str, Union[str, int]]]
) -> Dict:
    """
    Versión JSON de validar_seleccion_multicontenedor.
    
    Args:
        selecciones: Lista de diccionarios con tipo y cantidad
    
    Returns:
        Diccionario con el resultado de la validación
    """
    try:
        resultado = validar_seleccion_multicontenedor(selecciones)
        
        return {
            "exito": True,
            "selecciones": [
                {"tipo": s.tipo_codigo, "cantidad": s.cantidad}
                for s in resultado.selecciones
            ],
            "volumen_total_cbm": float(resultado.volumen_total_cbm),
            "peso_max_total_kg": float(resultado.peso_max_total_kg),
            "total_contenedores": resultado.total_contenedores,
            "requiere_cotizacion_manual": resultado.requiere_cotizacion_manual,
            "contenedores_manuales": resultado.contenedores_manuales,
            "contenedores_automaticos": resultado.contenedores_automaticos,
            "resumen": resultado.resumen,
            "advertencias": resultado.advertencias,
            "descripcion_completa": resultado.descripcion_completa,
        }
    except ValueError as e:
        return {
            "exito": False,
            "error": str(e),
        }


def calcular_capacidad_seleccion(
    selecciones: List[Dict[str, Union[str, int]]]
) -> Dict:
    """
    Calcula la capacidad total de una selección de contenedores.
    
    Args:
        selecciones: Lista de {"tipo": "20GP", "cantidad": 2}
    
    Returns:
        Diccionario con capacidades por contenedor y totales
    """
    detalles = []
    volumen_total = Decimal("0")
    peso_total = Decimal("0")
    
    for sel in selecciones:
        tipo = sel.get("tipo", "").upper()
        cantidad = int(sel.get("cantidad", 0))
        
        if tipo in TODOS_CONTENEDORES and cantidad > 0:
            spec = TODOS_CONTENEDORES[tipo]
            vol = spec.volumen_max_cbm * cantidad
            peso = spec.peso_max_kg * cantidad
            
            volumen_total += vol
            peso_total += peso
            
            detalles.append({
                "tipo": tipo,
                "cantidad": cantidad,
                "nombre": spec.nombre_corto,
                "volumen_unitario_cbm": float(spec.volumen_max_cbm),
                "peso_unitario_kg": float(spec.peso_max_kg),
                "volumen_subtotal_cbm": float(vol),
                "peso_subtotal_kg": float(peso),
                "cotizacion_automatica": spec.cotizacion_automatica,
            })
    
    return {
        "detalles": detalles,
        "volumen_total_cbm": float(volumen_total),
        "peso_total_kg": float(peso_total),
        "peso_total_ton": float(peso_total / 1000),
    }


if __name__ == "__main__":
    print("=" * 70)
    print("IMPORTAYA.IA - OPTIMIZADOR DE CONTENEDORES")
    print("=" * 70)
    
    print("\n" + "=" * 70)
    print("CASO 1: Carga pequeña - Califica para LCL")
    print("=" * 70)
    print("Volumen: 15 CBM, Peso: 5,000 kg")
    
    resultado1 = optimizar_contenedor(15, 5000)
    print(f"\nRecomendación: {resultado1.recomendacion_principal}")
    print(f"Tipo: {resultado1.tipo_codigo}")
    print(f"Razonamiento: {resultado1.razonamiento}")
    print(f"Es LCL: {resultado1.es_lcl}")
    
    print("\n" + "=" * 70)
    print("CASO 2: Carga mediana - 1x40GP")
    print("=" * 70)
    print("Volumen: 35 CBM, Peso: 12,000 kg")
    
    resultado2 = optimizar_contenedor(35, 12000)
    print(f"\nRecomendación: {resultado2.recomendacion_principal}")
    print(f"Cantidad: {resultado2.cantidad}")
    print(f"Tipo: {resultado2.tipo_codigo}")
    print(f"Razonamiento: {resultado2.razonamiento}")
    
    print("\n" + "=" * 70)
    print("CASO 3: Carga voluminosa - 1x40HC")
    print("=" * 70)
    print("Volumen: 65 CBM, Peso: 15,000 kg")
    
    resultado3 = optimizar_contenedor(65, 15000)
    print(f"\nRecomendación: {resultado3.recomendacion_principal}")
    print(f"Cantidad: {resultado3.cantidad}")
    print(f"Tipo: {resultado3.tipo_codigo}")
    print(f"Razonamiento: {resultado3.razonamiento}")
    
    print("\n" + "=" * 70)
    print("CASO 4: Carga muy pesada - Múltiples contenedores")
    print("=" * 70)
    print("Volumen: 45 CBM, Peso: 50,000 kg")
    
    resultado4 = optimizar_contenedor(45, 50000)
    print(f"\nRecomendación: {resultado4.recomendacion_principal}")
    print(f"Cantidad: {resultado4.cantidad}")
    print(f"Tipo: {resultado4.tipo_codigo}")
    print(f"Advertencia peso: {resultado4.advertencia_peso}")
    print(f"Distribución: {resultado4.distribucion_sugerida}")
    print(f"Razonamiento: {resultado4.razonamiento}")
    
    print("\n" + "=" * 70)
    print("CASO 5: Carga grande voluminosa - Múltiples 40HC")
    print("=" * 70)
    print("Volumen: 150 CBM, Peso: 40,000 kg")
    
    resultado5 = optimizar_contenedor(150, 40000)
    print(f"\nRecomendación: {resultado5.recomendacion_principal}")
    print(f"Cantidad: {resultado5.cantidad}")
    print(f"Tipo: {resultado5.tipo_codigo}")
    print(f"Distribución: {resultado5.distribucion_sugerida}")
    print(f"Razonamiento: {resultado5.razonamiento}")
    
    print("\n" + "=" * 70)
    print("CASO 6: Carga pequeña que cabe en 20GP")
    print("=" * 70)
    print("Volumen: 28 CBM, Peso: 18,000 kg")
    
    resultado6 = optimizar_contenedor(28, 18000)
    print(f"\nRecomendación: {resultado6.recomendacion_principal}")
    print(f"Cantidad: {resultado6.cantidad}")
    print(f"Tipo: {resultado6.tipo_codigo}")
    print(f"Razonamiento: {resultado6.razonamiento}")
    
    print("\n" + "=" * 70)
    print("Pruebas completadas exitosamente!")
    print("=" * 70)
