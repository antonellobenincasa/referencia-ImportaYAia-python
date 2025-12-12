"""
container_logic.py - Optimizador de Contenedores para ImportaYa.ia

Este módulo determina la mejor opción de contenedor (LCL vs FCL) y
selecciona el tipo óptimo de contenedor basado en volumen y peso de la carga.

Constantes del Sistema:
- LCL: Solo si volumen < 25 CBM Y peso < 10,000 kg
- 20GP: Max 30 CBM, 27,000 kg
- 40GP: Max 62 CBM, 27,000 kg
- 40HC: Max 68 CBM, 27,000 kg (priorizar para voluminosos)

Lógica de Decisión:
1. Si volumen < 25 CBM Y peso < 10,000 kg → recomendar LCL
2. Sino, seleccionar contenedor FCL que mejor ajuste por volumen
3. CRÍTICO: Si peso excede 27 TON por contenedor, dividir en múltiples
4. Para carga pesada, preferir 2x20GP en lugar de 1x40GP si es más eficiente

Autor: ImportaYa.ia
Versión: 1.0.0
"""

from decimal import Decimal, ROUND_HALF_UP, ROUND_CEILING
from typing import Dict, Union, Optional
from dataclasses import dataclass
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


CONTENEDORES = {
    "20GP": ContenedorSpec(
        codigo="20GP",
        nombre_completo="1 x 20' General Purpose",
        nombre_corto="20' Standard",
        volumen_max_cbm=Decimal("30"),
        peso_max_kg=Decimal("27000"),
    ),
    "40GP": ContenedorSpec(
        codigo="40GP",
        nombre_completo="1 x 40' General Purpose",
        nombre_corto="40' Standard",
        volumen_max_cbm=Decimal("62"),
        peso_max_kg=Decimal("27000"),
    ),
    "40HC": ContenedorSpec(
        codigo="40HC",
        nombre_completo="1 x 40' High Cube",
        nombre_corto="40' High Cube",
        volumen_max_cbm=Decimal("68"),
        peso_max_kg=Decimal("27000"),
    ),
}

LCL_MAX_VOLUMEN_CBM = Decimal("25")
LCL_MAX_PESO_KG = Decimal("10000")
FCL_MAX_PESO_KG = Decimal("27000")


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
    detalle_adicional: Optional[str] = None


def _to_decimal(value: Union[int, float, str, Decimal]) -> Decimal:
    """Convierte un valor a Decimal"""
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


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
    
    Lógica de Decisión:
    1. Si volumen < 25 CBM Y peso < 10,000 kg → recomendar LCL
    2. Sino, evaluar todas las opciones FCL
    3. CRÍTICO: Si peso excede 27 TON por contenedor, dividir en múltiples
    4. Para carga pesada, preferir 2x20GP si es más eficiente que 1x40GP/40HC
    
    Args:
        volumen_cbm: Volumen total de la carga en metros cúbicos
        peso_kg: Peso total de la carga en kilogramos
    
    Returns:
        ResultadoOptimizacion con la recomendación completa
    
    Ejemplo:
        >>> resultado = optimizar_contenedor(volumen_cbm=35, peso_kg=8000)
        >>> print(resultado.recomendacion_principal)
        "1 x 40' General Purpose"
    """
    volumen = _to_decimal(volumen_cbm)
    peso = _to_decimal(peso_kg)
    
    if volumen <= 0 or peso <= 0:
        raise ValueError("El volumen y peso deben ser mayores a cero")
    
    if volumen < LCL_MAX_VOLUMEN_CBM and peso < LCL_MAX_PESO_KG:
        razonamiento = (
            f"Carga de {volumen:.2f} CBM y {peso:.0f} kg califica para LCL. "
            f"Umbrales: < {LCL_MAX_VOLUMEN_CBM} CBM y < {LCL_MAX_PESO_KG:.0f} kg."
        )
        
        return ResultadoOptimizacion(
            recomendacion_principal="LCL (Carga Suelta Consolidada)",
            cantidad=1,
            tipo_codigo="LCL",
            razonamiento=razonamiento,
            advertencia_peso=False,
            distribucion_sugerida="Carga consolidada con otros embarques.",
            volumen_total_cbm=volumen,
            peso_total_kg=peso,
            es_lcl=True,
            detalle_adicional="Se cotizará por CBM o peso (W/M), el que sea mayor."
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
        "detalle_adicional": resultado.detalle_adicional
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
