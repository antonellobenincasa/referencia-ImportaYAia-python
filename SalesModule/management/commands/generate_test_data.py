"""
Management command to generate realistic test data for QA validation.
Populates the database with sample users, cotizaciones, shipments, pre-liquidations, and rates.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import date, timedelta
import random

from SalesModule.models import (
    LeadCotizacion, QuoteScenario, QuoteLineItem,
    FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate,
    CustomsBrokerageRate, Shipment, ShipmentTracking, PreLiquidation
)
from accounts.models import LeadProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Generate realistic test data for QA validation'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing test data before generating new data',
        )

    def handle(self, *args, **options):
        self.stdout.write('Generando datos de prueba para ImportaYa.ia...\n')
        
        if options['clear']:
            self.clear_test_data()
        
        users = self.create_test_users()
        self.create_freight_rates()
        self.create_insurance_rates()
        self.create_customs_duty_rates()
        self.create_inland_transport_rates()
        self.create_brokerage_rates()
        
        cotizaciones = self.create_cotizaciones(users)
        shipments = self.create_shipments(users, cotizaciones)
        self.create_pre_liquidations(cotizaciones)
        
        self.stdout.write(self.style.SUCCESS('\n✓ Datos de prueba generados exitosamente!'))
        self.print_summary()

    def clear_test_data(self):
        self.stdout.write('Limpiando datos de prueba existentes...')
        PreLiquidation.objects.all().delete()
        ShipmentTracking.objects.all().delete()
        Shipment.objects.all().delete()
        QuoteLineItem.objects.all().delete()
        QuoteScenario.objects.all().delete()
        LeadCotizacion.objects.all().delete()
        FreightRate.objects.all().delete()
        InsuranceRate.objects.all().delete()
        CustomsDutyRate.objects.all().delete()
        InlandTransportQuoteRate.objects.all().delete()
        CustomsBrokerageRate.objects.all().delete()
        User.objects.filter(email__endswith='@test.importaya.ia').delete()
        self.stdout.write(self.style.SUCCESS('✓ Datos limpiados'))

    def create_test_users(self):
        self.stdout.write('Creando usuarios de prueba...')
        users = []
        
        test_users = [
            {
                'email': 'carlos.mendez@test.importaya.ia',
                'first_name': 'Carlos',
                'last_name': 'Méndez',
                'company_name': 'Importaciones del Pacífico S.A.',
                'ruc': '0912345678001',
                'city': 'Guayaquil',
            },
            {
                'email': 'maria.santos@test.importaya.ia',
                'first_name': 'María',
                'last_name': 'Santos',
                'company_name': 'Comercializadora Andina Cía. Ltda.',
                'ruc': '1791234567001',
                'city': 'Quito',
            },
            {
                'email': 'jorge.vera@test.importaya.ia',
                'first_name': 'Jorge',
                'last_name': 'Vera',
                'company_name': 'AutoParts Ecuador',
                'ruc': '0991876543001',
                'city': 'Cuenca',
            },
        ]
        
        for user_data in test_users:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'username': user_data['email'].split('@')[0],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'company_name': user_data['company_name'],
                    'phone': f'+5939{random.randint(10000000, 99999999)}',
                    'city': user_data['city'],
                    'country': 'Ecuador',
                    'role': 'lead',
                }
            )
            if created:
                user.set_password('TestPass123!')
                user.save()
                
                LeadProfile.objects.create(
                    user=user,
                    ruc=user_data['ruc'],
                    legal_type='juridica',
                    is_active_importer=True,
                    senae_code=f'SENAE-{random.randint(1000, 9999)}',
                    business_address=f'Av. Principal {random.randint(100, 999)}, {user_data["city"]}',
                    preferred_trade_lane='china_ecuador',
                    preferred_transport='maritimo_lcl',
                )
            users.append(user)
            self.stdout.write(f'  - Usuario: {user.email}')
        
        return users

    def create_freight_rates(self):
        self.stdout.write('Creando tarifas de flete...')
        today = date.today()
        
        routes = [
            ('China', 'Shanghai', 'Guayaquil', 'aereo', Decimal('4.50'), 'kg', 3, 5, 'Air China Cargo'),
            ('China', 'Shenzhen', 'Guayaquil', 'aereo', Decimal('4.25'), 'kg', 4, 6, 'Emirates SkyCargo'),
            ('China', 'Shanghai', 'Guayaquil', 'maritimo_fcl_40', Decimal('2800'), 'container', 28, 35, 'MSC'),
            ('China', 'Ningbo', 'Guayaquil', 'maritimo_fcl_40', Decimal('2650'), 'container', 30, 38, 'COSCO'),
            ('China', 'Shanghai', 'Guayaquil', 'maritimo_lcl', Decimal('65'), 'cbm', 32, 42, 'Hapag-Lloyd'),
            ('USA', 'Miami', 'Guayaquil', 'aereo', Decimal('3.20'), 'kg', 2, 3, 'LATAM Cargo'),
            ('USA', 'Miami', 'Guayaquil', 'maritimo_lcl', Decimal('55'), 'cbm', 12, 18, 'Maersk'),
            ('USA', 'Los Angeles', 'Guayaquil', 'maritimo_fcl_40', Decimal('2200'), 'container', 15, 22, 'Evergreen'),
            ('Alemania', 'Hamburg', 'Guayaquil', 'maritimo_fcl_40', Decimal('3100'), 'container', 25, 32, 'Hamburg Sud'),
            ('España', 'Valencia', 'Guayaquil', 'maritimo_lcl', Decimal('72'), 'cbm', 22, 28, 'MSC'),
        ]
        
        for origin_country, origin_port, dest_port, transport, rate, unit, min_days, max_days, carrier in routes:
            FreightRate.objects.get_or_create(
                origin_country=origin_country,
                origin_port=origin_port,
                destination_port=dest_port,
                transport_type=transport,
                defaults={
                    'destination_country': 'Ecuador',
                    'rate_usd': rate,
                    'unit': unit,
                    'transit_days_min': min_days,
                    'transit_days_max': max_days,
                    'valid_from': today,
                    'valid_until': today + timedelta(days=365),
                    'is_active': True,
                    'carrier_name': carrier,
                }
            )
        self.stdout.write(f'  - {len(routes)} tarifas de flete creadas')

    def create_insurance_rates(self):
        self.stdout.write('Creando tarifas de seguro...')
        today = date.today()
        
        coverages = [
            ('Seguro Básico ICC-C', 'basico', Decimal('0.35'), Decimal('25'), 'Seguros del Pacífico'),
            ('Seguro Ampliado ICC-B', 'ampliada', Decimal('0.50'), Decimal('50'), 'AIG Ecuador'),
            ('Todo Riesgo ICC-A', 'todo_riesgo', Decimal('0.75'), Decimal('75'), 'Liberty Seguros'),
        ]
        
        for name, coverage, rate, min_premium, company in coverages:
            InsuranceRate.objects.get_or_create(
                name=name,
                coverage_type=coverage,
                defaults={
                    'rate_percentage': rate,
                    'min_premium_usd': min_premium,
                    'insurance_company': company,
                    'valid_from': today,
                    'valid_until': today + timedelta(days=365),
                    'is_active': True,
                }
            )
        self.stdout.write(f'  - {len(coverages)} tarifas de seguro creadas')

    def create_customs_duty_rates(self):
        self.stdout.write('Creando tarifas aduaneras (SENAE)...')
        today = date.today()
        
        tariffs = [
            ('8471300000', 'Computadoras portátiles', Decimal('0'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
            ('8517120000', 'Teléfonos celulares', Decimal('0'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
            ('8708999000', 'Partes y accesorios de vehículos', Decimal('15'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
            ('8703230000', 'Vehículos 1500-3000cc', Decimal('35'), Decimal('12'), Decimal('0.5'), Decimal('15'), Decimal('0')),
            ('6109100000', 'Camisetas de algodón', Decimal('20'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('45')),
            ('8544490000', 'Cables eléctricos', Decimal('15'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
            ('8528720000', 'Televisores LED/LCD', Decimal('20'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
            ('8418100000', 'Refrigeradores domésticos', Decimal('30'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
            ('8450110000', 'Lavadoras automáticas', Decimal('30'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
            ('9403600000', 'Muebles de madera', Decimal('30'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
        ]
        
        for hs_code, desc, ad_valorem, iva, fodinfa, ice, salvaguardia in tariffs:
            CustomsDutyRate.objects.get_or_create(
                hs_code=hs_code,
                defaults={
                    'description': desc,
                    'ad_valorem_percentage': ad_valorem,
                    'iva_percentage': iva,
                    'fodinfa_percentage': fodinfa,
                    'ice_percentage': ice,
                    'salvaguardia_percentage': salvaguardia,
                    'valid_from': today,
                    'is_active': True,
                }
            )
        self.stdout.write(f'  - {len(tariffs)} tarifas aduaneras creadas')

    def create_inland_transport_rates(self):
        self.stdout.write('Creando tarifas de transporte interno...')
        today = date.today()
        
        routes = [
            ('Guayaquil', 'Quito', 'camion_grande', Decimal('450'), 8),
            ('Guayaquil', 'Cuenca', 'camion_mediano', Decimal('280'), 5),
            ('Guayaquil', 'Manta', 'camion_pequeno', Decimal('120'), 3),
            ('Guayaquil', 'Machala', 'camion_pequeno', Decimal('100'), 2),
            ('Guayaquil', 'Ambato', 'camion_mediano', Decimal('320'), 6),
            ('Guayaquil', 'Guayaquil', 'camion_pequeno', Decimal('50'), 1),
            ('Quito', 'Cuenca', 'camion_grande', Decimal('380'), 7),
        ]
        
        for origin, dest, vehicle, rate, hours in routes:
            InlandTransportQuoteRate.objects.get_or_create(
                origin_city=origin,
                destination_city=dest,
                vehicle_type=vehicle,
                defaults={
                    'rate_usd': rate,
                    'estimated_hours': hours,
                    'valid_from': today,
                    'valid_until': today + timedelta(days=365),
                    'is_active': True,
                }
            )
        self.stdout.write(f'  - {len(routes)} tarifas de transporte interno creadas')

    def create_brokerage_rates(self):
        self.stdout.write('Creando tarifas de agenciamiento aduanero...')
        today = date.today()
        
        services = [
            ('Importación General', 'importacion_general', Decimal('150'), Decimal('0.25')),
            ('Importación Courier', 'importacion_courier', Decimal('75'), Decimal('0')),
            ('Importación Menaje', 'importacion_menaje', Decimal('200'), Decimal('0.15')),
            ('Exportación', 'exportacion', Decimal('100'), Decimal('0.15')),
        ]
        
        for name, service_type, fixed, percentage in services:
            CustomsBrokerageRate.objects.get_or_create(
                name=name,
                service_type=service_type,
                defaults={
                    'fixed_rate_usd': fixed,
                    'percentage_rate': percentage,
                    'min_rate_usd': fixed,
                    'valid_from': today,
                    'valid_until': today + timedelta(days=365),
                    'is_active': True,
                }
            )
        self.stdout.write(f'  - {len(services)} tarifas de agenciamiento creadas')

    def create_cotizaciones(self, users):
        self.stdout.write('Creando cotizaciones de prueba...')
        cotizaciones = []
        
        sample_cotizaciones = [
            {
                'tipo_carga': 'maritima',
                'origen_pais': 'China',
                'origen_ciudad': 'Shanghai',
                'destino_ciudad': 'Guayaquil',
                'descripcion_mercancia': 'Repuestos automotrices - 100 cajas',
                'peso_kg': Decimal('2500'),
                'volumen_cbm': Decimal('8.5'),
                'valor_mercancia_usd': Decimal('45000'),
                'estado': 'aprobada',
            },
            {
                'tipo_carga': 'aerea',
                'origen_pais': 'USA',
                'origen_ciudad': 'Miami',
                'destino_ciudad': 'Quito',
                'descripcion_mercancia': 'Equipos electrónicos - 20 cajas',
                'peso_kg': Decimal('150'),
                'valor_mercancia_usd': Decimal('25000'),
                'estado': 'cotizado',
            },
            {
                'tipo_carga': 'maritima',
                'origen_pais': 'China',
                'origen_ciudad': 'Shenzhen',
                'destino_ciudad': 'Guayaquil',
                'descripcion_mercancia': 'Textiles varios - 50 fardos',
                'peso_kg': Decimal('1200'),
                'volumen_cbm': Decimal('5.0'),
                'valor_mercancia_usd': Decimal('18000'),
                'estado': 'ro_generado',
            },
            {
                'tipo_carga': 'maritima',
                'origen_pais': 'Alemania',
                'origen_ciudad': 'Hamburg',
                'destino_ciudad': 'Cuenca',
                'descripcion_mercancia': 'Maquinaria industrial - 5 pallets',
                'peso_kg': Decimal('3500'),
                'volumen_cbm': Decimal('12.0'),
                'valor_mercancia_usd': Decimal('85000'),
                'estado': 'en_transito',
            },
            {
                'tipo_carga': 'aerea',
                'origen_pais': 'China',
                'origen_ciudad': 'Shanghai',
                'destino_ciudad': 'Guayaquil',
                'descripcion_mercancia': 'Celulares y accesorios - 30 cajas',
                'peso_kg': Decimal('200'),
                'valor_mercancia_usd': Decimal('35000'),
                'estado': 'pendiente',
            },
        ]
        
        for i, cot_data in enumerate(sample_cotizaciones):
            user = users[i % len(users)]
            cotizacion = LeadCotizacion.objects.create(
                lead_user=user,
                incoterm='FOB',
                requiere_seguro=True,
                requiere_transporte_interno=True,
                **cot_data
            )
            cotizacion.calculate_total()
            cotizacion.save()
            
            if cot_data['estado'] == 'aprobada':
                cotizacion.aprobar()
            elif cot_data['estado'] == 'ro_generado':
                cotizacion.aprobar()
                cotizacion.generar_ro()
            elif cot_data['estado'] == 'en_transito':
                cotizacion.aprobar()
                cotizacion.generar_ro()
                cotizacion.estado = 'en_transito'
                cotizacion.save()
            elif cot_data['estado'] == 'cotizado':
                cotizacion.estado = 'cotizado'
                cotizacion.save()
            
            cotizaciones.append(cotizacion)
            self.stdout.write(f'  - Cotización: {cotizacion.numero_cotizacion} ({cot_data["estado"]})')
        
        return cotizaciones

    def create_shipments(self, users, cotizaciones):
        self.stdout.write('Creando embarques de prueba...')
        shipments = []
        
        for cotizacion in cotizaciones:
            if cotizacion.estado in ['ro_generado', 'en_transito', 'completada']:
                shipment = Shipment.objects.create(
                    lead_user=cotizacion.lead_user,
                    cotizacion=cotizacion,
                    transport_type='maritimo' if cotizacion.tipo_carga == 'maritima' else 'aereo',
                    carrier_name='MSC Mediterranean Shipping' if cotizacion.tipo_carga == 'maritima' else 'LATAM Cargo',
                    bl_awb_number=f'BL-{random.randint(100000, 999999)}',
                    container_number=f'MSCU{random.randint(1000000, 9999999)}' if cotizacion.tipo_carga == 'maritima' else '',
                    origin_country=cotizacion.origen_pais,
                    origin_city=cotizacion.origen_ciudad,
                    destination_country='Ecuador',
                    destination_city=cotizacion.destino_ciudad,
                    description=cotizacion.descripcion_mercancia,
                    weight_kg=cotizacion.peso_kg,
                    packages=random.randint(5, 50),
                    estimated_departure=date.today() - timedelta(days=random.randint(10, 30)),
                    estimated_arrival=date.today() + timedelta(days=random.randint(5, 20)),
                    current_status='en_transito_internacional',
                    current_location='En ruta - Océano Pacífico',
                )
                
                ShipmentTracking.objects.create(
                    shipment=shipment,
                    status='booking_confirmado',
                    location=f'{cotizacion.origen_ciudad}, {cotizacion.origen_pais}',
                    description='Booking confirmado con naviera',
                    event_datetime=timezone.now() - timedelta(days=25)
                )
                ShipmentTracking.objects.create(
                    shipment=shipment,
                    status='recogido_origen',
                    location=f'Almacén origen - {cotizacion.origen_ciudad}',
                    description='Mercancía recogida en origen',
                    event_datetime=timezone.now() - timedelta(days=20)
                )
                ShipmentTracking.objects.create(
                    shipment=shipment,
                    status='en_transito_internacional',
                    location='En ruta - Océano Pacífico',
                    description='Zarpe del puerto de origen',
                    event_datetime=timezone.now() - timedelta(days=15)
                )
                
                shipments.append(shipment)
                self.stdout.write(f'  - Embarque: {shipment.tracking_number}')
        
        return shipments

    def create_pre_liquidations(self, cotizaciones):
        self.stdout.write('Creando pre-liquidaciones...')
        
        hs_codes = ['8708999000', '8471300000', '6109100000', '9403600000', '8517120000']
        
        for i, cotizacion in enumerate(cotizaciones):
            if cotizacion.estado in ['aprobada', 'ro_generado', 'en_transito']:
                hs_code = hs_codes[i % len(hs_codes)]
                fob = cotizacion.valor_mercancia_usd
                freight = fob * Decimal('0.05')
                insurance = fob * Decimal('0.005')
                cif = fob + freight + insurance
                
                pre_liq = PreLiquidation.objects.create(
                    cotizacion=cotizacion,
                    product_description=cotizacion.descripcion_mercancia,
                    suggested_hs_code=hs_code,
                    confirmed_hs_code=hs_code,
                    hs_code_confidence=Decimal('88.5'),
                    ai_reasoning=f'Clasificación basada en descripción: {cotizacion.descripcion_mercancia}',
                    fob_value_usd=fob,
                    freight_usd=freight,
                    insurance_usd=insurance,
                    cif_value_usd=cif,
                    is_confirmed=True,
                    confirmed_at=timezone.now(),
                )
                
                try:
                    duty_rate = CustomsDutyRate.objects.get(hs_code=hs_code, is_active=True)
                    pre_liq.ad_valorem_usd = cif * (duty_rate.ad_valorem_percentage / 100)
                    pre_liq.fodinfa_usd = cif * (duty_rate.fodinfa_percentage / 100)
                    pre_liq.ice_usd = cif * (duty_rate.ice_percentage / 100)
                    pre_liq.salvaguardia_usd = cif * (duty_rate.salvaguardia_percentage / 100)
                    base_iva = cif + pre_liq.ad_valorem_usd + pre_liq.fodinfa_usd + pre_liq.ice_usd + pre_liq.salvaguardia_usd
                    pre_liq.iva_usd = base_iva * (duty_rate.iva_percentage / 100)
                    pre_liq.total_tributos_usd = (
                        pre_liq.ad_valorem_usd + pre_liq.fodinfa_usd + 
                        pre_liq.ice_usd + pre_liq.salvaguardia_usd + pre_liq.iva_usd
                    )
                    pre_liq.save()
                except CustomsDutyRate.DoesNotExist:
                    pass
                
                self.stdout.write(f'  - Pre-Liquidación: HS {hs_code} para {cotizacion.numero_cotizacion}')

    def print_summary(self):
        self.stdout.write('\n' + '='*60)
        self.stdout.write('RESUMEN DE DATOS GENERADOS:')
        self.stdout.write('='*60)
        self.stdout.write(f'  Usuarios de prueba: {User.objects.filter(email__endswith="@test.importaya.ia").count()}')
        self.stdout.write(f'  Tarifas de flete: {FreightRate.objects.count()}')
        self.stdout.write(f'  Tarifas de seguro: {InsuranceRate.objects.count()}')
        self.stdout.write(f'  Tarifas aduaneras: {CustomsDutyRate.objects.count()}')
        self.stdout.write(f'  Transporte interno: {InlandTransportQuoteRate.objects.count()}')
        self.stdout.write(f'  Agenciamiento: {CustomsBrokerageRate.objects.count()}')
        self.stdout.write(f'  Cotizaciones: {LeadCotizacion.objects.count()}')
        self.stdout.write(f'  Embarques: {Shipment.objects.count()}')
        self.stdout.write(f'  Pre-liquidaciones: {PreLiquidation.objects.count()}')
        self.stdout.write('='*60)
        self.stdout.write('\nCredenciales de prueba:')
        self.stdout.write('  Email: carlos.mendez@test.importaya.ia')
        self.stdout.write('  Password: TestPass123!')
        self.stdout.write('='*60)
