#!/usr/bin/env python
"""
Script de Importación de Gastos Locales en Destino (Aéreo)
==========================================================
Procesa archivos CSV con gastos locales para transporte aéreo.
"""
import os
import sys
import re
from decimal import Decimal

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'importaya.settings')
django.setup()

from SalesModule.models import LocalDestinationCost


def parse_amount(text: str) -> float:
    """Extrae monto numérico de texto como '$35.00' o '35.00'"""
    if not text:
        return None
    
    text = text.strip()
    match = re.search(r'\$?\s*([\d]+(?:[.,]\d{1,2})?)', text)
    if match:
        value = match.group(1).replace(',', '.')
        return float(value)
    return None


def import_aereo_local_charges():
    """Importa los gastos locales aéreos desde datos del CSV."""
    
    charges_data = [
        {
            'name': 'Corte de Guía',
            'code': 'CORTE_GUIA',
            'amount': Decimal('35.00'),
            'unit_type': 'X GUIA AEREA',
            'calculation_rule': None
        },
        {
            'name': 'Admin Fee',
            'code': 'ADMIN_FEE',
            'amount': Decimal('50.00'),
            'unit_type': 'X GUIA AEREA',
            'calculation_rule': None
        },
        {
            'name': 'Handling',
            'code': 'HANDLING',
            'amount': Decimal('50.00'),
            'unit_type': 'X GUIA AEREA',
            'calculation_rule': None
        },
        {
            'name': 'Desconsolidación Guía',
            'code': 'DESCONSOLIDACION',
            'amount': Decimal('15.00'),
            'unit_type': 'X GUIA AEREA',
            'calculation_rule': None
        },
        {
            'name': 'Costo Local Pago Manejo Import',
            'code': 'MANEJO_IMPORT',
            'amount': Decimal('25.00'),
            'unit_type': 'X GUIA AEREA (MINIMO)',
            'calculation_rule': 'Se calcula la suma de FLETE AEREO TOTAL + GASTOS ORIGEN AEREO (solo en CASO DE HABERLOS incoterm FCA y EXW) y al resultado se multiplica por 6% o podría aplicar COSTO MINIMO USD 25.00 POR GUIA AEREA, se aplica siempre el que sea mayor.'
        },
    ]
    
    print("=" * 60)
    print("IMPORTACIÓN GASTOS LOCALES AÉREOS - ImportaYa.ia")
    print("=" * 60)
    
    existing = LocalDestinationCost.objects.filter(transport_type='AEREO').count()
    if existing > 0:
        print(f"⚠️  Ya existen {existing} gastos AÉREOS. Actualizando...")
    
    created_count = 0
    updated_count = 0
    
    for data in charges_data:
        obj, created = LocalDestinationCost.objects.update_or_create(
            code=data['code'],
            transport_type='AEREO',
            defaults={
                'name': data['name'],
                'cost_type': 'HANDLING' if data['code'] == 'HANDLING' else 'OTROS',
                'port': 'ALL',
                'container_type': 'ALL',
                'amount': data['amount'],
                'currency': 'USD',
                'is_per_unit': True,
                'is_iva_exempt': False,
                'notes': data.get('calculation_rule', '') or f"Unidad: {data['unit_type']}",
                'is_active': True
            }
        )
        
        if created:
            print(f"✅ CREADO: {data['name']} - ${data['amount']}")
            created_count += 1
        else:
            print(f"🔄 ACTUALIZADO: {data['name']} - ${data['amount']}")
            updated_count += 1
    
    print()
    print(f"RESUMEN: {created_count} creados, {updated_count} actualizados")
    print("=" * 60)
    
    return created_count, updated_count


if __name__ == '__main__':
    import_aereo_local_charges()
