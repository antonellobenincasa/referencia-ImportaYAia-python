#!/usr/bin/env python
"""
Script de Importación de Tramos de Seguro
==========================================
Procesa archivos CSV con tablas de tramos de seguro para ImportaYa.ia.
Utiliza Regex para parsear formatos no estructurados.

Uso:
    python manage.py shell < scripts/import_insurance.py
    O ejecutar desde Django shell:
    exec(open('scripts/import_insurance.py').read())
"""

import os
import sys
import re
from decimal import Decimal

# Setup Django
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'importaya.settings')
django.setup()

from SalesModule.models import InsuranceBracket


def parse_number(text: str) -> float:
    """
    Convierte texto numérico con formato español/latino a float.
    Maneja formatos como: 20.000,00 o 20000,00 o 20,000.00
    """
    if not text:
        return 0.0
    
    # Remover espacios y caracteres no numéricos excepto puntos y comas
    text = text.strip()
    
    # Si tiene tanto puntos como comas, determinar cuál es el separador decimal
    if ',' in text and '.' in text:
        # El último separador es el decimal
        if text.rfind(',') > text.rfind('.'):
            # Formato: 1.000.000,00 (coma es decimal)
            text = text.replace('.', '').replace(',', '.')
        else:
            # Formato: 1,000,000.00 (punto es decimal)
            text = text.replace(',', '')
    elif ',' in text:
        # Solo comas: asumir que es decimal (formato 1000,00)
        text = text.replace(',', '.')
    
    return float(text)


def extract_range(text: str) -> tuple:
    """
    Extrae min_value y max_value de textos como:
    - "desde USD 0,00 a USD 20000,00"
    - "desde 20001,00 usd 30000,00"
    
    Returns:
        Tuple (min_value, max_value) o (None, None) si no se puede parsear
    """
    if not text or not isinstance(text, str):
        return None, None
    
    text_lower = text.lower().strip()
    
    # Buscar todos los números en el texto
    # Patrón para números con formato: 0,00 o 0.00 o 20000,00 o 1.000.000,00
    number_pattern = r'[\d]+(?:[.,]\d{3})*(?:[.,]\d{1,2})?'
    numbers = re.findall(number_pattern, text)
    
    if len(numbers) >= 2:
        min_val = parse_number(numbers[0])
        max_val = parse_number(numbers[1])
        
        # Asegurar que min < max
        if min_val > max_val:
            min_val, max_val = max_val, min_val
            
        return min_val, max_val
    
    return None, None


def extract_cost(text: str) -> float:
    """
    Extrae el costo fijo de textos como:
    - "USD 105,00 + IVA"
    - "Aplica costo MINIMO de USD 70,00 + 15% de IVA local"
    
    Returns:
        float del costo o None si no se puede parsear
    """
    if not text or not isinstance(text, str):
        return None
    
    # Buscar patrón "USD XX,XX" o después de "de USD"
    patterns = [
        r'USD\s+([\d]+(?:[.,]\d{1,2})?)',  # USD 105,00
        r'de\s+USD\s+([\d]+(?:[.,]\d{1,2})?)',  # de USD 70,00
        r'\$\s*([\d]+(?:[.,]\d{1,2})?)',  # $ 105.00
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return parse_number(match.group(1))
    
    return None


def import_insurance_brackets(file_path: str = None):
    """
    Importa los tramos de seguro desde un archivo CSV.
    Usa regex parsing si se proporciona archivo, sino usa datos de fallback.
    """
    
    insurance_data = []
    
    # Intentar parsear el archivo CSV si existe
    if file_path and os.path.exists(file_path):
        print(f"📄 Parseando archivo: {file_path}")
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                lines = f.readlines()
            
            for line in lines[2:]:  # Saltar headers
                parts = line.strip().split(';')
                if len(parts) >= 2:
                    range_text = parts[0]
                    cost_text = parts[1]
                    
                    min_val, max_val = extract_range(range_text)
                    cost = extract_cost(cost_text)
                    
                    if min_val is not None and max_val is not None and cost is not None:
                        print(f"  ✓ Regex detectó: {min_val:,.0f} - {max_val:,.0f} → ${cost}")
                        insurance_data.append({
                            'min_value': Decimal(str(min_val)),
                            'max_value': Decimal(str(max_val)),
                            'fixed_fee': Decimal(str(cost)),
                            'description': cost_text.strip()
                        })
        except Exception as e:
            print(f"⚠️ Error parseando archivo: {e}")
    
    # Fallback a datos hardcodeados si no hay archivo o falló el parsing
    if not insurance_data:
        print("📋 Usando datos de fallback (CSV pre-parseado)")
        insurance_data = [
            {
                'min_value': Decimal('0.00'),
                'max_value': Decimal('20000.00'),
                'fixed_fee': Decimal('70.00'),
                'description': 'Aplica costo MINIMO de USD 70,00 + 15% de IVA local'
            },
            {
                'min_value': Decimal('20001.00'),
                'max_value': Decimal('30000.00'),
                'fixed_fee': Decimal('105.00'),
                'description': 'USD 105,00 + IVA'
            },
            {
                'min_value': Decimal('30001.00'),
                'max_value': Decimal('50000.00'),
                'fixed_fee': Decimal('175.00'),
                'description': 'USD 175,00 + IVA'
            },
            {
                'min_value': Decimal('50001.00'),
                'max_value': Decimal('100000.00'),
                'fixed_fee': Decimal('350.00'),
                'description': 'USD 350,00 + IVA'
            },
            {
                'min_value': Decimal('100001.00'),
                'max_value': Decimal('300000.00'),
                'fixed_fee': Decimal('1050.00'),
                'description': 'USD 1050,00 + IVA'
            },
            {
                'min_value': Decimal('300001.00'),
                'max_value': Decimal('500000.00'),
                'fixed_fee': Decimal('1750.00'),
                'description': 'USD 1750,00 + IVA'
            },
        ]
    
    print("=" * 60)
    print("IMPORTACIÓN DE TRAMOS DE SEGURO - ImportaYa.ia")
    print("=" * 60)
    print()
    
    # Eliminar tramos existentes (si hay)
    existing_count = InsuranceBracket.objects.count()
    if existing_count > 0:
        print(f"⚠️  Eliminando {existing_count} tramos existentes...")
        InsuranceBracket.objects.all().delete()
    
    created_count = 0
    errors = []
    
    for data in insurance_data:
        try:
            bracket = InsuranceBracket.objects.create(
                min_value=data['min_value'],
                max_value=data['max_value'],
                fixed_fee=data['fixed_fee'],
                rate_percentage=Decimal('0.35'),
                currency='USD',
                description=data['description'],
                iva_percentage=Decimal('15.00'),
                is_active=True
            )
            
            print(f"✅ Tramo creado: USD {data['min_value']:>12,.2f} - {data['max_value']:>12,.2f} → Prima: ${data['fixed_fee']}")
            created_count += 1
            
        except Exception as e:
            error_msg = f"❌ Error creando tramo {data['min_value']}-{data['max_value']}: {str(e)}"
            print(error_msg)
            errors.append(error_msg)
    
    print()
    print("=" * 60)
    print(f"RESUMEN: {created_count} tramos creados, {len(errors)} errores")
    print("=" * 60)
    
    # Verificar la importación
    print()
    print("VERIFICACIÓN DE TRAMOS IMPORTADOS:")
    print("-" * 60)
    
    for bracket in InsuranceBracket.objects.all().order_by('min_value'):
        premium_info = bracket.calculate_total_premium()
        print(f"  {bracket} → Total con IVA: ${premium_info['total']:.2f}")
    
    print()
    print("✅ Importación completada exitosamente")
    
    return created_count, errors


def test_insurance_calculation():
    """
    Prueba el cálculo de seguro para diferentes valores de mercancía.
    """
    print()
    print("=" * 60)
    print("PRUEBA DE CÁLCULO DE SEGURO")
    print("=" * 60)
    
    test_values = [
        Decimal('5000.00'),
        Decimal('15000.00'),
        Decimal('25000.00'),
        Decimal('45000.00'),
        Decimal('75000.00'),
        Decimal('200000.00'),
        Decimal('400000.00'),
    ]
    
    for value in test_values:
        bracket = InsuranceBracket.get_bracket_for_value(value)
        if bracket:
            premium = bracket.calculate_total_premium()
            print(f"  Valor: USD {value:>12,.2f} → Prima: ${premium['prima_base']:.2f} + IVA ${premium['iva_monto']:.2f} = ${premium['total']:.2f}")
        else:
            print(f"  Valor: USD {value:>12,.2f} → ⚠️ Sin tramo aplicable")


if __name__ == '__main__':
    import_insurance_brackets()
    test_insurance_calculation()
