"""
Script para cargar datos iniciales de márgenes de ganancia y gastos locales.
Ejecutar con: python manage.py shell < SalesModule/seed_margins_and_costs.py
O importar y llamar seed_all()
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hsamp.settings')
django.setup()

from decimal import Decimal
from SalesModule.models import ProfitMarginConfig, LocalDestinationCost


def seed_profit_margins():
    """Crea configuraciones de márgenes de ganancia por defecto."""
    
    margins_data = [
        {
            'name': 'Margen General FCL',
            'transport_type': 'MARITIMO_FCL',
            'item_type': 'ALL',
            'margin_type': 'PERCENTAGE',
            'margin_value': Decimal('12.00'),
            'minimum_margin': Decimal('75.00'),
            'priority': 100,
            'notes': 'Margen general para todos los rubros FCL'
        },
        {
            'name': 'Margen Flete FCL',
            'transport_type': 'MARITIMO_FCL',
            'item_type': 'FLETE',
            'margin_type': 'PERCENTAGE',
            'margin_value': Decimal('10.00'),
            'minimum_margin': Decimal('100.00'),
            'priority': 10,
            'notes': 'Margen específico para flete marítimo FCL'
        },
        {
            'name': 'Margen General LCL',
            'transport_type': 'MARITIMO_LCL',
            'item_type': 'ALL',
            'margin_type': 'PERCENTAGE',
            'margin_value': Decimal('15.00'),
            'minimum_margin': Decimal('50.00'),
            'priority': 100,
            'notes': 'Margen general para todos los rubros LCL'
        },
        {
            'name': 'Margen Flete LCL',
            'transport_type': 'MARITIMO_LCL',
            'item_type': 'FLETE',
            'margin_type': 'PERCENTAGE',
            'margin_value': Decimal('12.00'),
            'minimum_margin': Decimal('35.00'),
            'priority': 10,
            'notes': 'Margen específico para flete marítimo LCL'
        },
        {
            'name': 'Margen General Aéreo',
            'transport_type': 'AEREO',
            'item_type': 'ALL',
            'margin_type': 'PERCENTAGE',
            'margin_value': Decimal('18.00'),
            'minimum_margin': Decimal('50.00'),
            'priority': 100,
            'notes': 'Margen general para todos los rubros aéreos'
        },
        {
            'name': 'Margen Flete Aéreo',
            'transport_type': 'AEREO',
            'item_type': 'FLETE',
            'margin_type': 'PERCENTAGE',
            'margin_value': Decimal('15.00'),
            'minimum_margin': Decimal('75.00'),
            'priority': 10,
            'notes': 'Margen específico para flete aéreo'
        },
        {
            'name': 'Margen THC Fijo',
            'transport_type': 'ALL',
            'item_type': 'THC_DESTINO',
            'margin_type': 'FIXED',
            'margin_value': Decimal('25.00'),
            'minimum_margin': None,
            'priority': 5,
            'notes': 'Margen fijo para THC destino'
        },
        {
            'name': 'Margen Handling Fijo',
            'transport_type': 'ALL',
            'item_type': 'HANDLING',
            'margin_type': 'FIXED',
            'margin_value': Decimal('15.00'),
            'minimum_margin': None,
            'priority': 5,
            'notes': 'Margen fijo para handling'
        },
        {
            'name': 'Margen Doc Fee Fijo',
            'transport_type': 'ALL',
            'item_type': 'DOC_FEE',
            'margin_type': 'FIXED',
            'margin_value': Decimal('20.00'),
            'minimum_margin': None,
            'priority': 5,
            'notes': 'Margen fijo para document fee'
        },
    ]
    
    created = 0
    updated = 0
    
    for data in margins_data:
        obj, was_created = ProfitMarginConfig.objects.update_or_create(
            transport_type=data['transport_type'],
            item_type=data['item_type'],
            margin_type=data['margin_type'],
            defaults={
                'name': data['name'],
                'margin_value': data['margin_value'],
                'minimum_margin': data['minimum_margin'],
                'priority': data['priority'],
                'notes': data['notes'],
                'is_active': True
            }
        )
        if was_created:
            created += 1
        else:
            updated += 1
    
    print(f"ProfitMarginConfig: {created} creados, {updated} actualizados")
    return created, updated


def seed_local_costs():
    """Crea catálogo de gastos locales estándar en Ecuador."""
    
    costs_data = [
        {
            'name': 'THC Destino Guayaquil 20GP',
            'code': 'DTHC_20GP',
            'transport_type': 'MARITIMO_FCL',
            'cost_type': 'THC_DESTINO',
            'port': 'GYE',
            'container_type': '20GP',
            'cost_usd': Decimal('150.00'),
            'cost_per_unit': 'CONTENEDOR',
            'is_iva_exempt': True,
            'exemption_reason': 'DTHC exento de IVA en transporte marítimo FCL',
            'is_mandatory': True
        },
        {
            'name': 'THC Destino Guayaquil 40GP',
            'code': 'DTHC_40GP',
            'transport_type': 'MARITIMO_FCL',
            'cost_type': 'THC_DESTINO',
            'port': 'GYE',
            'container_type': '40GP',
            'cost_usd': Decimal('220.00'),
            'cost_per_unit': 'CONTENEDOR',
            'is_iva_exempt': True,
            'exemption_reason': 'DTHC exento de IVA en transporte marítimo FCL',
            'is_mandatory': True
        },
        {
            'name': 'THC Destino Guayaquil 40HC',
            'code': 'DTHC_40HC',
            'transport_type': 'MARITIMO_FCL',
            'cost_type': 'THC_DESTINO',
            'port': 'GYE',
            'container_type': '40HC',
            'cost_usd': Decimal('220.00'),
            'cost_per_unit': 'CONTENEDOR',
            'is_iva_exempt': True,
            'exemption_reason': 'DTHC exento de IVA en transporte marítimo FCL',
            'is_mandatory': True
        },
        {
            'name': 'THC Destino LCL',
            'code': 'DTHC_LCL',
            'transport_type': 'MARITIMO_LCL',
            'cost_type': 'THC_DESTINO',
            'port': 'GYE',
            'container_type': 'LCL',
            'cost_usd': Decimal('12.00'),
            'cost_per_unit': 'CBM',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'Handling FCL 20GP',
            'code': 'HANDLING_20GP',
            'transport_type': 'MARITIMO_FCL',
            'cost_type': 'HANDLING',
            'port': 'ALL',
            'container_type': '20GP',
            'cost_usd': Decimal('45.00'),
            'cost_per_unit': 'CONTENEDOR',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'Handling FCL 40GP/HC',
            'code': 'HANDLING_40',
            'transport_type': 'MARITIMO_FCL',
            'cost_type': 'HANDLING',
            'port': 'ALL',
            'container_type': '40GP',
            'cost_usd': Decimal('65.00'),
            'cost_per_unit': 'CONTENEDOR',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'Handling LCL',
            'code': 'HANDLING_LCL',
            'transport_type': 'MARITIMO_LCL',
            'cost_type': 'HANDLING',
            'port': 'ALL',
            'container_type': 'LCL',
            'cost_usd': Decimal('8.00'),
            'cost_per_unit': 'CBM',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'Document Fee FCL',
            'code': 'DOC_FEE_FCL',
            'transport_type': 'MARITIMO_FCL',
            'cost_type': 'DOC_FEE',
            'port': 'ALL',
            'container_type': 'ALL',
            'cost_usd': Decimal('75.00'),
            'cost_per_unit': 'BL',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'Document Fee LCL',
            'code': 'DOC_FEE_LCL',
            'transport_type': 'MARITIMO_LCL',
            'cost_type': 'DOC_FEE',
            'port': 'ALL',
            'container_type': 'LCL',
            'cost_usd': Decimal('55.00'),
            'cost_per_unit': 'BL',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'BL Fee',
            'code': 'BL_FEE',
            'transport_type': 'ALL',
            'cost_type': 'BL_FEE',
            'port': 'ALL',
            'container_type': 'ALL',
            'cost_usd': Decimal('50.00'),
            'cost_per_unit': 'BL',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'Desconsolidación LCL',
            'code': 'DESCONS_LCL',
            'transport_type': 'MARITIMO_LCL',
            'cost_type': 'DESCONSOLIDACION',
            'port': 'GYE',
            'container_type': 'LCL',
            'cost_usd': Decimal('15.00'),
            'cost_per_unit': 'CBM',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'Handling Aéreo',
            'code': 'HANDLING_AIR',
            'transport_type': 'AEREO',
            'cost_type': 'HANDLING',
            'port': 'ALL',
            'container_type': 'KG',
            'cost_usd': Decimal('0.08'),
            'cost_per_unit': 'KG',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'Handling Aéreo Mínimo',
            'code': 'HANDLING_AIR_MIN',
            'transport_type': 'AEREO',
            'cost_type': 'HANDLING',
            'port': 'ALL',
            'container_type': 'ALL',
            'cost_usd': Decimal('45.00'),
            'cost_per_unit': 'EMBARQUE',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': False
        },
        {
            'name': 'Document Fee Aéreo',
            'code': 'DOC_FEE_AIR',
            'transport_type': 'AEREO',
            'cost_type': 'DOC_FEE',
            'port': 'ALL',
            'container_type': 'ALL',
            'cost_usd': Decimal('65.00'),
            'cost_per_unit': 'AWB',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
        {
            'name': 'Transmisión DAE',
            'code': 'TRANSMISION_DAE',
            'transport_type': 'ALL',
            'cost_type': 'TRANSMISION',
            'port': 'ALL',
            'container_type': 'ALL',
            'cost_usd': Decimal('25.00'),
            'cost_per_unit': 'DAE',
            'is_iva_exempt': False,
            'exemption_reason': '',
            'is_mandatory': True
        },
    ]
    
    created = 0
    updated = 0
    
    for data in costs_data:
        obj, was_created = LocalDestinationCost.objects.update_or_create(
            code=data['code'],
            transport_type=data['transport_type'],
            port=data['port'],
            container_type=data['container_type'],
            defaults={
                'name': data['name'],
                'cost_type': data['cost_type'],
                'cost_usd': data['cost_usd'],
                'cost_per_unit': data['cost_per_unit'],
                'is_iva_exempt': data['is_iva_exempt'],
                'exemption_reason': data['exemption_reason'],
                'is_mandatory': data['is_mandatory'],
                'is_active': True
            }
        )
        if was_created:
            created += 1
        else:
            updated += 1
    
    print(f"LocalDestinationCost: {created} creados, {updated} actualizados")
    return created, updated


def seed_all():
    """Ejecuta todas las semillas de datos."""
    print("=" * 50)
    print("Cargando datos iniciales para cotización automática")
    print("=" * 50)
    
    seed_profit_margins()
    seed_local_costs()
    
    print("=" * 50)
    print("Carga completada exitosamente")
    print("=" * 50)


if __name__ == '__main__':
    seed_all()
