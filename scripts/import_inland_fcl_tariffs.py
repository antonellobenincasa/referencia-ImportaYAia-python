#!/usr/bin/env python
"""
Script para importar tarifas de transporte terrestre FCL y servicios de seguridad.
Datos extraídos del PDF: TARIFARIO_x_CIUDAD_DESTINO_de_TRANSPORTE_TERRESTRE_FCL
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hsamp.settings')
django.setup()

from decimal import Decimal
from SalesModule.models import InlandFCLTariff, InlandSecurityTariff

TRANSPORT_TARIFFS = [
    {'destination': 'PERIMETRO URBANO', 'route': 'GYE - PERIMETRO URB', 'rate': Decimal('275.00')},
    {'destination': 'MANTA', 'route': 'GYE-MANTA-GYE', 'rate': Decimal('585.00')},
    {'destination': 'CUENCA', 'route': 'GYE-CUENCA-GYE', 'rate': Decimal('795.00')},
    {'destination': 'AMBATO', 'route': 'GYE-AMBATO-GYE', 'rate': Decimal('895.00')},
    {'destination': 'QUITO', 'route': 'GYE-UIO-GYE', 'rate': Decimal('1150.00')},
    {'destination': 'MACHALA', 'route': 'GYE-MACHALA-GYE', 'rate': Decimal('595.00')},
]

CUSTODIA_ARMADA_TARIFFS = [
    {'destination': 'PERIMETRO URBANO', 'route': 'GYE - PERIMETRO URB', 'rate': Decimal('150.00')},
    {'destination': 'MANTA', 'route': 'GYE-MANTA-GYE', 'rate': Decimal('350.00')},
    {'destination': 'CUENCA', 'route': 'GYE-CUENCA-GYE', 'rate': Decimal('345.00')},
    {'destination': 'AMBATO', 'route': 'GYE-AMBATO-GYE', 'rate': Decimal('405.00')},
    {'destination': 'QUITO', 'route': 'GYE-UIO-GYE', 'rate': Decimal('475.00')},
    {'destination': 'MACHALA', 'route': 'GYE-MACHALA-GYE', 'rate': Decimal('350.00')},
]

CANDADO_SATELITAL_TARIFFS = [
    {'destination': 'PERIMETRO URBANO', 'route': 'GYE - PERIMETRO URB', 'rate': Decimal('50.00')},
    {'destination': 'MANTA', 'route': 'GYE-MANTA-GYE', 'rate': Decimal('65.00')},
    {'destination': 'CUENCA', 'route': 'GYE-CUENCA-GYE', 'rate': Decimal('70.00')},
    {'destination': 'AMBATO', 'route': 'GYE-AMBATO-GYE', 'rate': Decimal('75.00')},
    {'destination': 'QUITO', 'route': 'GYE-UIO-GYE', 'rate': Decimal('85.00')},
    {'destination': 'MACHALA', 'route': 'GYE-MACHALA-GYE', 'rate': Decimal('65.00')},
]

TRANSPORT_NOTES = """NOTAS LEGALES:
- Turno por devolución de vacío USD 56 + IVA 15%
- 6 horas libres de carga o descarga en bodega
- De la 7ma a la 10ma hora = $35 + IVA por hora
- De la 11ava hora en adelante = 90% del valor del viaje pactado
- A partir del medio día del siguiente día = flete completo
- Falso flete = 85% del valor del flete interno GYE"""

def import_transport_tariffs():
    print("=" * 60)
    print("Importando tarifas de TRANSPORTE TERRESTRE FCL...")
    print("=" * 60)
    
    created_count = 0
    updated_count = 0
    
    for tariff_data in TRANSPORT_TARIFFS:
        obj, created = InlandFCLTariff.objects.update_or_create(
            origin_city='GYE',
            destination_city=tariff_data['destination'],
            container_type='ALL',
            defaults={
                'route_name': tariff_data['route'],
                'rate_usd': tariff_data['rate'],
                'is_round_trip': True,
                'empty_return_fee_usd': Decimal('56.00'),
                'empty_return_iva_applies': True,
                'free_loading_hours': 6,
                'hour_7_to_10_rate_usd': Decimal('35.00'),
                'hour_11_plus_percent': Decimal('90.00'),
                'false_freight_percent': Decimal('85.00'),
                'is_active': True,
                'notes': TRANSPORT_NOTES,
            }
        )
        if created:
            created_count += 1
            print(f"  [CREADO] {tariff_data['route']} - ${tariff_data['rate']}")
        else:
            updated_count += 1
            print(f"  [ACTUALIZADO] {tariff_data['route']} - ${tariff_data['rate']}")
    
    print(f"\nTransporte: {created_count} creados, {updated_count} actualizados")
    return created_count, updated_count


def import_security_tariffs():
    print("\n" + "=" * 60)
    print("Importando tarifas de CUSTODIA ARMADA...")
    print("=" * 60)
    
    created_count = 0
    updated_count = 0
    
    for tariff_data in CUSTODIA_ARMADA_TARIFFS:
        obj, created = InlandSecurityTariff.objects.update_or_create(
            origin_city='GYE',
            destination_city=tariff_data['destination'],
            service_type='CUSTODIA_ARMADA',
            defaults={
                'route_name': tariff_data['route'],
                'base_rate_usd': tariff_data['rate'],
                'iva_rate': Decimal('15.00'),
                'iva_applies': True,
                'is_active': True,
                'notes': 'Servicio de custodia armada para contenedores FCL',
            }
        )
        if created:
            created_count += 1
            print(f"  [CREADO] Custodia Armada {tariff_data['route']} - ${tariff_data['rate']} + IVA")
        else:
            updated_count += 1
            print(f"  [ACTUALIZADO] Custodia Armada {tariff_data['route']} - ${tariff_data['rate']} + IVA")
    
    print(f"\nCustodia Armada: {created_count} creados, {updated_count} actualizados")
    
    print("\n" + "=" * 60)
    print("Importando tarifas de CANDADO SATELITAL...")
    print("=" * 60)
    
    created_candado = 0
    updated_candado = 0
    
    for tariff_data in CANDADO_SATELITAL_TARIFFS:
        obj, created = InlandSecurityTariff.objects.update_or_create(
            origin_city='GYE',
            destination_city=tariff_data['destination'],
            service_type='CANDADO_SATELITAL',
            defaults={
                'route_name': tariff_data['route'],
                'base_rate_usd': tariff_data['rate'],
                'iva_rate': Decimal('15.00'),
                'iva_applies': True,
                'is_active': True,
                'notes': 'Servicio de candado satelital GPS para contenedores FCL',
            }
        )
        if created:
            created_candado += 1
            print(f"  [CREADO] Candado Satelital {tariff_data['route']} - ${tariff_data['rate']} + IVA")
        else:
            updated_candado += 1
            print(f"  [ACTUALIZADO] Candado Satelital {tariff_data['route']} - ${tariff_data['rate']} + IVA")
    
    print(f"\nCandado Satelital: {created_candado} creados, {updated_candado} actualizados")
    
    return created_count + created_candado, updated_count + updated_candado


def show_summary():
    print("\n" + "=" * 60)
    print("RESUMEN DE TARIFAS IMPORTADAS")
    print("=" * 60)
    
    print("\nTARIFAS TRANSPORTE TERRESTRE FCL:")
    print("-" * 50)
    for tariff in InlandFCLTariff.objects.filter(is_active=True).order_by('destination_city'):
        print(f"  {tariff.route_name:25} USD ${tariff.rate_usd:>8.2f}")
    
    print("\nTARIFAS CUSTODIA ARMADA:")
    print("-" * 50)
    for tariff in InlandSecurityTariff.objects.filter(service_type='CUSTODIA_ARMADA', is_active=True).order_by('destination_city'):
        total = tariff.get_total_with_iva()
        print(f"  {tariff.route_name:25} USD ${tariff.base_rate_usd:>7.2f} + IVA = ${total:>8.2f}")
    
    print("\nTARIFAS CANDADO SATELITAL:")
    print("-" * 50)
    for tariff in InlandSecurityTariff.objects.filter(service_type='CANDADO_SATELITAL', is_active=True).order_by('destination_city'):
        total = tariff.get_total_with_iva()
        print(f"  {tariff.route_name:25} USD ${tariff.base_rate_usd:>7.2f} + IVA = ${total:>8.2f}")


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("IMPORTACION DE TARIFAS FCL - TRANSPORTE Y SEGURIDAD")
    print("Fuente: TARIFARIO_x_CIUDAD_DESTINO_de_TRANSPORTE_TERRESTRE_FCL")
    print("=" * 60 + "\n")
    
    transport_created, transport_updated = import_transport_tariffs()
    security_created, security_updated = import_security_tariffs()
    
    show_summary()
    
    print("\n" + "=" * 60)
    print(f"TOTAL: {transport_created + security_created} registros creados, {transport_updated + security_updated} actualizados")
    print("=" * 60 + "\n")
