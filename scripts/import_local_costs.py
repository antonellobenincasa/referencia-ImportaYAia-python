#!/usr/bin/env python
"""
Import local destination costs from Excel file.
Supports FCL (per carrier), LCL (fixed), and AEREO costs.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hsamp.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from decimal import Decimal
from SalesModule.models import LocalDestinationCost

FCL_CARRIERS = {
    'ONE': 'ONE',
    'HPG': 'HPG',
    'MAERSK si arriba a POD GYE GUAYAQUIL': 'MAERSK',
    'MAERSK si arriba a POD PSJ POSORJA': 'MAERSK_PSJ',
    'MSC': 'MSC',
    'HMM': 'HMM',
    'CMA': 'CMA',
    'EMC': 'EMC',
    'WHL': 'WHL',
    'COSCO': 'COSCO',
    'OOCL': 'OOCL',
    'SBM o SEABOARD MARINE': 'SBM',
    'PIL': 'PIL',
    'MARFRET': 'MARFRET',
    'ZIM': 'ZIM',
    'YML o YANG MING': 'YML',
}

FCL_COST_MAPPING = {
    'Locales destino por MBL': ('LOCALES_MBL', 'Locales destino por MBL', 'BL', False),
    'THC destino o DTHC por contenedor': ('THC_DESTINO', 'THC Destino', 'CONTENEDOR', True),
    'Locales destino por contenedor': ('LOCALES_CNTR', 'Locales destino por contenedor', 'CONTENEDOR', False),
    'Handling x contenedor IMPORTAYAIA.COM': ('HANDLING', 'Handling por contenedor', 'CONTENEDOR', False),
}

def import_fcl_costs():
    """Import FCL local costs per carrier"""
    import openpyxl
    
    wb = openpyxl.load_workbook('attached_assets/GASTOS_LOCALES_DESTINO_FCL_LCL_AEREO_-_copia_1766237522680.xlsx')
    sheet = wb['LOCALES DESTINO FCL']
    
    rows = list(sheet.iter_rows(values_only=True))
    
    header_row = rows[4]
    carrier_cols = {}
    for col_idx, cell in enumerate(header_row):
        if cell and cell != 'GASTOS LOCALES DESTINO = VENTA IMPORTAYAIA.COM':
            carrier_code = FCL_CARRIERS.get(cell, cell)
            carrier_cols[col_idx] = carrier_code
    
    print(f"Found carriers: {list(carrier_cols.values())}")
    
    cost_rows = rows[5:9]
    
    created_count = 0
    for row in cost_rows:
        cost_name = row[0]
        if cost_name not in FCL_COST_MAPPING:
            continue
            
        code, name, unit, is_exempt = FCL_COST_MAPPING[cost_name]
        
        for col_idx, carrier_code in carrier_cols.items():
            cost_value = row[col_idx]
            if cost_value is None or not isinstance(cost_value, (int, float)):
                continue
            
            port = 'PSJ' if carrier_code == 'MAERSK_PSJ' else 'GYE'
            carrier = 'MAERSK' if carrier_code == 'MAERSK_PSJ' else carrier_code
            
            obj, created = LocalDestinationCost.objects.update_or_create(
                transport_type='MARITIMO_FCL',
                code=code,
                carrier_code=carrier,
                port=port,
                defaults={
                    'name': name,
                    'cost_type': 'THC_DESTINO' if code == 'THC_DESTINO' else ('HANDLING' if code == 'HANDLING' else 'BL_FEE'),
                    'container_type': 'ALL',
                    'cost_usd': Decimal(str(cost_value)),
                    'cost_per_unit': unit,
                    'is_iva_exempt': is_exempt,
                    'exemption_reason': 'THC exento de IVA según normativa' if is_exempt else '',
                    'is_mandatory': True,
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                print(f"  Created: {carrier} - {code} = ${cost_value}")
            else:
                print(f"  Updated: {carrier} - {code} = ${cost_value}")
    
    vb_carriers = list(carrier_cols.values())
    for carrier in vb_carriers:
        port = 'PSJ' if carrier == 'MAERSK_PSJ' else 'GYE'
        carrier_clean = 'MAERSK' if carrier == 'MAERSK_PSJ' else carrier
        
        obj, created = LocalDestinationCost.objects.update_or_create(
            transport_type='MARITIMO_FCL',
            code='VISTO_BUENO',
            carrier_code=carrier_clean,
            port=port,
            defaults={
                'name': 'Visto Bueno FCL',
                'cost_type': 'DOC_FEE',
                'container_type': 'ALL',
                'cost_usd': Decimal('60.00'),
                'cost_per_unit': 'BL',
                'is_iva_exempt': False,
                'is_mandatory': True,
                'is_active': True,
            }
        )
        if created:
            created_count += 1
            print(f"  Created: {carrier_clean} - VISTO_BUENO = $60.00")
    
    print(f"\nFCL: Created {created_count} records")
    return created_count


def import_lcl_costs():
    """Import LCL local costs (fixed for all carriers)"""
    lcl_costs = [
        ('DESCONSOLIDACION', 'Desconsolidación LCL', Decimal('20.00'), 'CBM/TON', Decimal('135.00'), False),
        ('LOCALES_BL', 'Locales destino por BL', Decimal('100.00'), 'BL', None, False),
    ]
    
    created_count = 0
    for code, name, cost, unit, min_charge, is_exempt in lcl_costs:
        obj, created = LocalDestinationCost.objects.update_or_create(
            transport_type='MARITIMO_LCL',
            code=code,
            carrier_code=None,
            defaults={
                'name': name,
                'cost_type': 'DESCONSOLIDACION' if code == 'DESCONSOLIDACION' else 'BL_FEE',
                'container_type': 'LCL',
                'port': 'GYE',
                'cost_usd': cost,
                'cost_per_unit': unit,
                'is_iva_exempt': is_exempt,
                'is_mandatory': True,
                'is_active': True,
                'notes': f'Mínimo USD {min_charge} por BL' if min_charge else '',
            }
        )
        if created:
            created_count += 1
            print(f"  Created: LCL - {code} = ${cost}")
        else:
            print(f"  Updated: LCL - {code} = ${cost}")
    
    print(f"\nLCL: Created {created_count} records")
    return created_count


def import_aereo_costs():
    """Import AEREO local costs"""
    aereo_costs = [
        ('CORTE_GUIA', 'Corte de Guía', Decimal('35.00'), 'GUIA', False),
        ('ADMIN_FEE', 'Admin Fee', Decimal('50.00'), 'GUIA', False),
        ('HANDLING', 'Handling', Decimal('50.00'), 'GUIA', False),
        ('DESCONSOLIDACION', 'Desconsolidación Guía', Decimal('15.00'), 'GUIA', False),
    ]
    
    created_count = 0
    for code, name, cost, unit, is_exempt in aereo_costs:
        obj, created = LocalDestinationCost.objects.update_or_create(
            transport_type='AEREO',
            code=code,
            carrier_code=None,
            defaults={
                'name': name,
                'cost_type': 'HANDLING' if code == 'HANDLING' else ('DESCONSOLIDACION' if code == 'DESCONSOLIDACION' else 'DOC_FEE'),
                'container_type': 'KG',
                'port': 'UIO',
                'cost_usd': cost,
                'cost_per_unit': unit,
                'is_iva_exempt': is_exempt,
                'is_mandatory': True,
                'is_active': True,
            }
        )
        if created:
            created_count += 1
            print(f"  Created: AEREO - {code} = ${cost}")
        else:
            print(f"  Updated: AEREO - {code} = ${cost}")
    
    print(f"\nAEREO: Created {created_count} records")
    return created_count


if __name__ == '__main__':
    print("=" * 60)
    print("Importing Local Destination Costs from Excel")
    print("=" * 60)
    
    print("\n--- FCL Costs (per carrier) ---")
    fcl_count = import_fcl_costs()
    
    print("\n--- LCL Costs (fixed) ---")
    lcl_count = import_lcl_costs()
    
    print("\n--- AEREO Costs ---")
    aereo_count = import_aereo_costs()
    
    total = fcl_count + lcl_count + aereo_count
    print("\n" + "=" * 60)
    print(f"TOTAL: Imported {total} local cost records")
    print("=" * 60)
    
    print("\n--- Summary by Transport Type ---")
    for tt in ['MARITIMO_FCL', 'MARITIMO_LCL', 'AEREO']:
        count = LocalDestinationCost.objects.filter(transport_type=tt).count()
        print(f"  {tt}: {count} records")
