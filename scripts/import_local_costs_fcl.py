"""
Import FCL, LCL and AEREO local destination costs from Excel file.
Run with: python manage.py shell < scripts/import_local_costs_fcl.py
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hsamp.settings')
django.setup()

from decimal import Decimal
from SalesModule.models import LocalDestinationCost

LocalDestinationCost.objects.filter(transport_type='MARITIMO_FCL').delete()
LocalDestinationCost.objects.filter(transport_type='MARITIMO_LCL').delete()
LocalDestinationCost.objects.filter(transport_type='AEREO').delete()

print("Deleted existing local costs. Importing new data...")

FCL_CARRIERS = {
    'ONE': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 450, 'handling': 50},
    'HPG': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 450, 'handling': 50},
    'MSK_GYE': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 450, 'handling': 50},
    'MSK_PSJ': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 450, 'handling': 50},
    'MSC': {'locales_mbl': 165, 'dthc': 195, 'locales_cntr': 440, 'handling': 50},
    'HMM': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 450, 'handling': 50},
    'CMA': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 400, 'handling': 50},
    'EMC': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 450, 'handling': 50},
    'WHL': {'locales_mbl': 125, 'dthc': 225, 'locales_cntr': 450, 'handling': 50},
    'COSCO': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 450, 'handling': 50},
    'OOCL': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 400, 'handling': 50},
    'SBM': {'locales_mbl': 125, 'dthc': 200, 'locales_cntr': 450, 'handling': 100},
    'PIL': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 450, 'handling': 100},
    'MARFRET': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 500, 'handling': 50},
    'ZIM': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 500, 'handling': 50},
    'YML': {'locales_mbl': 100, 'dthc': 200, 'locales_cntr': 500, 'handling': 50},
}

fcl_count = 0
for carrier_code, costs in FCL_CARRIERS.items():
    LocalDestinationCost.objects.create(
        name=f'Locales Destino por MBL - {carrier_code}',
        code=f'LOCALES_MBL_{carrier_code}',
        transport_type='MARITIMO_FCL',
        cost_type='DOC_FEE',
        port='ALL',
        container_type='ALL',
        carrier_code=carrier_code,
        cost_usd=Decimal(str(costs['locales_mbl'])),
        cost_per_unit='BL',
        is_iva_exempt=False,
        is_mandatory=True,
        is_active=True
    )
    fcl_count += 1
    
    LocalDestinationCost.objects.create(
        name=f'THC Destino (DTHC) - {carrier_code}',
        code=f'DTHC_{carrier_code}',
        transport_type='MARITIMO_FCL',
        cost_type='THC_DESTINO',
        port='ALL',
        container_type='ALL',
        carrier_code=carrier_code,
        cost_usd=Decimal(str(costs['dthc'])),
        cost_per_unit='CONTENEDOR',
        is_iva_exempt=True,
        exemption_reason='DTHC exento de IVA en marítimo FCL',
        is_mandatory=True,
        is_active=True
    )
    fcl_count += 1
    
    LocalDestinationCost.objects.create(
        name=f'Locales Destino por Contenedor - {carrier_code}',
        code=f'LOCALES_CNTR_{carrier_code}',
        transport_type='MARITIMO_FCL',
        cost_type='OTROS',
        port='ALL',
        container_type='ALL',
        carrier_code=carrier_code,
        cost_usd=Decimal(str(costs['locales_cntr'])),
        cost_per_unit='CONTENEDOR',
        is_iva_exempt=False,
        is_mandatory=True,
        is_active=True
    )
    fcl_count += 1
    
    LocalDestinationCost.objects.create(
        name=f'Handling por Contenedor - {carrier_code}',
        code=f'HANDLING_{carrier_code}',
        transport_type='MARITIMO_FCL',
        cost_type='HANDLING',
        port='ALL',
        container_type='ALL',
        carrier_code=carrier_code,
        cost_usd=Decimal(str(costs['handling'])),
        cost_per_unit='CONTENEDOR',
        is_iva_exempt=False,
        is_mandatory=True,
        is_active=True
    )
    fcl_count += 1

print(f"Created {fcl_count} FCL local costs for {len(FCL_CARRIERS)} carriers")

lcl_costs = [
    {
        'name': 'Desconsolidación LCL',
        'code': 'DESCONS_LCL',
        'cost_type': 'DESCONSOLIDACION',
        'cost_usd': Decimal('20.00'),
        'cost_per_unit': 'CBM',
        'notes': 'USD 20 x CBM/TON o mínimo USD 135 por BL'
    },
    {
        'name': 'Locales Destino LCL por BL',
        'code': 'LOCALES_LCL_BL',
        'cost_type': 'OTROS',
        'cost_usd': Decimal('100.00'),
        'cost_per_unit': 'BL',
        'notes': 'Fijo por cada embarque LCL'
    },
]

lcl_count = 0
for cost in lcl_costs:
    LocalDestinationCost.objects.create(
        name=cost['name'],
        code=cost['code'],
        transport_type='MARITIMO_LCL',
        cost_type=cost['cost_type'],
        port='ALL',
        container_type='LCL',
        carrier_code=None,
        cost_usd=cost['cost_usd'],
        cost_per_unit=cost['cost_per_unit'],
        is_iva_exempt=False,
        is_mandatory=True,
        is_active=True,
        notes=cost.get('notes', '')
    )
    lcl_count += 1

print(f"Created {lcl_count} LCL local costs")

aereo_costs = [
    {'name': 'Corte de Guía', 'code': 'CORTE_GUIA', 'cost_type': 'OTROS', 'cost_usd': Decimal('35.00')},
    {'name': 'Admin Fee', 'code': 'ADMIN_FEE', 'cost_type': 'OTROS', 'cost_usd': Decimal('50.00')},
    {'name': 'Handling Aéreo', 'code': 'HANDLING_AEREO', 'cost_type': 'HANDLING', 'cost_usd': Decimal('50.00')},
    {'name': 'Desconsolidación Guía', 'code': 'DESCONS_GUIA', 'cost_type': 'DESCONSOLIDACION', 'cost_usd': Decimal('15.00')},
]

aereo_count = 0
for cost in aereo_costs:
    LocalDestinationCost.objects.create(
        name=cost['name'],
        code=cost['code'],
        transport_type='AEREO',
        cost_type=cost['cost_type'],
        port='ALL',
        container_type='ALL',
        carrier_code=None,
        cost_usd=cost['cost_usd'],
        cost_per_unit='GUIA',
        is_iva_exempt=False,
        is_mandatory=True,
        is_active=True,
        notes='Sujeto a IVA 15%'
    )
    aereo_count += 1

print(f"Created {aereo_count} AEREO local costs")

total = LocalDestinationCost.objects.count()
print(f"\nTotal local costs in database: {total}")
print("Import completed successfully!")
