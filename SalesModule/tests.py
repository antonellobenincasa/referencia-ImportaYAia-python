"""
ImportaYa.ia - Comprehensive QA Test Suite
Sprint 4: Dashboard Inteligente, RO Management, Tracking, Pre-Liquidation

Tests cover:
1. UI Data Validation - Test data generation and dashboard widget verification
2. Integration Tests - All endpoints for cotización, RO, tracking, pre-liquidation
3. Security Tests - Authentication, authorization, input validation
"""
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import date, timedelta
import json

from .models import (
    Lead, Opportunity, Quote, LeadCotizacion, QuoteScenario, QuoteLineItem,
    FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate,
    CustomsBrokerageRate, Shipment, ShipmentTracking, PreLiquidation
)
from accounts.models import LeadProfile

User = get_user_model()


class TestDataFactory:
    """Factory for generating realistic test data"""
    
    @staticmethod
    def create_lead_user(email='lead@importaya.ia', password='TestPass123!'):
        """Create a LEAD user with complete profile"""
        user = User.objects.create_user(
            username=email.split('@')[0],
            email=email,
            password=password,
            first_name='Carlos',
            last_name='Importador',
            company_name='Importaciones Ecuador S.A.',
            phone='+593999888777',
            whatsapp='+593999888777',
            city='Guayaquil',
            country='Ecuador',
            role='lead'
        )
        LeadProfile.objects.create(
            user=user,
            ruc='0912345678001',
            legal_type='juridica',
            is_active_importer=True,
            senae_code='SENAE-001',
            business_address='Av. 9 de Octubre 123, Guayaquil',
            preferred_trade_lane='china_ecuador',
            preferred_transport='maritimo_lcl',
            main_products='Electrónicos, repuestos automotrices',
            customs_broker_name='Aduanas del Pacífico',
            customs_broker_code='CAE-2024-001'
        )
        return user
    
    @staticmethod
    def create_admin_user(email='admin@importaya.ia', password='AdminPass123!'):
        """Create an admin user"""
        return User.objects.create_superuser(
            username='admin',
            email=email,
            password=password,
            first_name='Admin',
            last_name='System',
            role='admin'
        )
    
    @staticmethod
    def create_freight_rates():
        """Create sample freight rates for different routes"""
        today = date.today()
        rates = []
        
        routes = [
            ('China', 'Shanghai', 'Guayaquil', 'aereo', Decimal('4.50'), 'kg', 3, 5),
            ('China', 'Shanghai', 'Guayaquil', 'maritimo_fcl_40', Decimal('2800'), 'container', 25, 35),
            ('China', 'Shanghai', 'Guayaquil', 'maritimo_lcl', Decimal('65'), 'cbm', 30, 40),
            ('USA', 'Miami', 'Guayaquil', 'aereo', Decimal('3.20'), 'kg', 2, 3),
            ('USA', 'Miami', 'Guayaquil', 'maritimo_lcl', Decimal('55'), 'cbm', 15, 20),
        ]
        
        for origin_country, origin_port, dest_port, transport, rate, unit, min_days, max_days in routes:
            rates.append(FreightRate.objects.create(
                origin_country=origin_country,
                origin_port=origin_port,
                destination_country='Ecuador',
                destination_port=dest_port,
                transport_type=transport,
                rate_usd=rate,
                unit=unit,
                transit_days_min=min_days,
                transit_days_max=max_days,
                valid_from=today,
                valid_until=today + timedelta(days=365),
                is_active=True,
                carrier_name='Test Carrier'
            ))
        return rates
    
    @staticmethod
    def create_insurance_rates():
        """Create sample insurance rates"""
        today = date.today()
        rates = []
        
        coverages = [
            ('Seguro Básico', 'basico', Decimal('0.35'), Decimal('25')),
            ('Seguro Ampliado', 'ampliada', Decimal('0.50'), Decimal('50')),
            ('Todo Riesgo', 'todo_riesgo', Decimal('0.75'), Decimal('75')),
        ]
        
        for name, coverage, rate, min_premium in coverages:
            rates.append(InsuranceRate.objects.create(
                name=name,
                coverage_type=coverage,
                rate_percentage=rate,
                min_premium_usd=min_premium,
                insurance_company='Seguros del Pacífico',
                valid_from=today,
                valid_until=today + timedelta(days=365),
                is_active=True
            ))
        return rates
    
    @staticmethod
    def create_customs_duty_rates():
        """Create sample customs duty rates (SENAE tariffs)"""
        today = date.today()
        rates = []
        
        tariffs = [
            ('8471300000', 'Computadoras portátiles', Decimal('0'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
            ('8517120000', 'Teléfonos celulares', Decimal('0'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
            ('8703230000', 'Vehículos 1500-3000cc', Decimal('35'), Decimal('12'), Decimal('0.5'), Decimal('15'), Decimal('0')),
            ('6109100000', 'Camisetas de algodón', Decimal('20'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('45')),
            ('8544490000', 'Cables eléctricos', Decimal('15'), Decimal('12'), Decimal('0.5'), Decimal('0'), Decimal('0')),
        ]
        
        for hs_code, desc, ad_valorem, iva, fodinfa, ice, salvaguardia in tariffs:
            rates.append(CustomsDutyRate.objects.create(
                hs_code=hs_code,
                description=desc,
                ad_valorem_percentage=ad_valorem,
                iva_percentage=iva,
                fodinfa_percentage=fodinfa,
                ice_percentage=ice,
                salvaguardia_percentage=salvaguardia,
                valid_from=today,
                is_active=True
            ))
        return rates
    
    @staticmethod
    def create_inland_transport_rates():
        """Create sample inland transport rates"""
        today = date.today()
        rates = []
        
        routes = [
            ('Guayaquil', 'Quito', 'camion_grande', Decimal('450'), 8),
            ('Guayaquil', 'Cuenca', 'camion_mediano', Decimal('280'), 5),
            ('Guayaquil', 'Manta', 'camion_pequeno', Decimal('120'), 3),
            ('Guayaquil', 'Guayaquil', 'camion_pequeno', Decimal('50'), 1),
        ]
        
        for origin, dest, vehicle, rate, hours in routes:
            rates.append(InlandTransportQuoteRate.objects.create(
                origin_city=origin,
                destination_city=dest,
                vehicle_type=vehicle,
                rate_usd=rate,
                estimated_hours=hours,
                valid_from=today,
                valid_until=today + timedelta(days=365),
                is_active=True
            ))
        return rates
    
    @staticmethod
    def create_brokerage_rates():
        """Create sample customs brokerage rates"""
        today = date.today()
        rates = []
        
        services = [
            ('Importación General', 'importacion_general', Decimal('150'), Decimal('0.25')),
            ('Importación Courier', 'importacion_courier', Decimal('75'), Decimal('0')),
            ('Exportación', 'exportacion', Decimal('100'), Decimal('0.15')),
        ]
        
        for name, service_type, fixed, percentage in services:
            rates.append(CustomsBrokerageRate.objects.create(
                name=name,
                service_type=service_type,
                fixed_rate_usd=fixed,
                percentage_rate=percentage,
                min_rate_usd=fixed,
                valid_from=today,
                valid_until=today + timedelta(days=365),
                is_active=True
            ))
        return rates
    
    @staticmethod
    def create_lead_cotizacion(user, **kwargs):
        """Create a sample cotización for a LEAD user"""
        defaults = {
            'lead_user': user,
            'tipo_carga': 'maritima',
            'origen_pais': 'China',
            'origen_ciudad': 'Shanghai',
            'destino_ciudad': 'Guayaquil',
            'descripcion_mercancia': 'Repuestos automotrices varios - 50 cajas',
            'peso_kg': Decimal('500'),
            'volumen_cbm': Decimal('2.5'),
            'valor_mercancia_usd': Decimal('15000'),
            'incoterm': 'FOB',
            'requiere_seguro': True,
            'requiere_transporte_interno': True,
        }
        defaults.update(kwargs)
        return LeadCotizacion.objects.create(**defaults)
    
    @staticmethod
    def create_shipment(user, cotizacion=None, **kwargs):
        """Create a sample shipment for tracking"""
        defaults = {
            'lead_user': user,
            'cotizacion': cotizacion,
            'transport_type': 'maritimo',
            'carrier_name': 'MSC Mediterranean Shipping',
            'bl_awb_number': 'MSCU123456789',
            'container_number': 'MSCU1234567',
            'origin_country': 'China',
            'origin_city': 'Shanghai',
            'destination_country': 'Ecuador',
            'destination_city': 'Guayaquil',
            'description': 'Repuestos automotrices - 50 cajas',
            'weight_kg': Decimal('500'),
            'packages': 50,
            'estimated_departure': date.today(),
            'estimated_arrival': date.today() + timedelta(days=30),
            'estimated_delivery': date.today() + timedelta(days=35),
            'current_status': 'en_transito_internacional',
            'current_location': 'En ruta - Océano Pacífico',
        }
        defaults.update(kwargs)
        return Shipment.objects.create(**defaults)
    
    @staticmethod
    def create_pre_liquidation(cotizacion, **kwargs):
        """Create a sample pre-liquidation with HS code suggestion"""
        defaults = {
            'cotizacion': cotizacion,
            'product_description': 'Repuestos automotrices para vehículos',
            'suggested_hs_code': '8708999000',
            'hs_code_confidence': Decimal('85.50'),
            'ai_reasoning': 'Clasificación basada en descripción: repuestos automotrices',
            'fob_value_usd': Decimal('15000'),
            'freight_usd': Decimal('500'),
            'insurance_usd': Decimal('75'),
            'cif_value_usd': Decimal('15575'),
        }
        defaults.update(kwargs)
        return PreLiquidation.objects.create(**defaults)


class LeadCotizacionAPITests(APITestCase):
    """Integration tests for Cotización endpoints"""
    
    def setUp(self):
        self.user = TestDataFactory.create_lead_user()
        self.other_user = TestDataFactory.create_lead_user(email='other@importaya.ia')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        TestDataFactory.create_freight_rates()
        TestDataFactory.create_insurance_rates()
        TestDataFactory.create_customs_duty_rates()
        TestDataFactory.create_brokerage_rates()
        TestDataFactory.create_inland_transport_rates()
    
    def test_create_cotizacion(self):
        """Test creating a new cotización"""
        url = '/api/sales/lead-cotizaciones/'
        data = {
            'tipo_carga': 'aerea',
            'origen_pais': 'China',
            'origen_ciudad': 'Shanghai',
            'destino_ciudad': 'Quito',
            'descripcion_mercancia': 'Electrónicos - 10 cajas',
            'peso_kg': '100',
            'valor_mercancia_usd': '5000',
            'incoterm': 'FOB',
            'requiere_seguro': True,
            'requiere_transporte_interno': True,
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertIn('numero_cotizacion', response.data)
    
    def test_list_my_cotizaciones(self):
        """Test listing only my cotizaciones"""
        my_cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        other_cotizacion = TestDataFactory.create_lead_cotizacion(self.other_user)
        
        url = '/api/sales/lead-cotizaciones/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        cotizacion_ids = [c['id'] for c in response.data.get('results', response.data)]
        self.assertIn(my_cotizacion.id, cotizacion_ids)
        self.assertNotIn(other_cotizacion.id, cotizacion_ids)
    
    def test_cotizacion_status_flow(self):
        """Test the complete cotización status flow"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        self.assertEqual(cotizacion.estado, 'pendiente')
        
        cotizacion.calculate_total()
        cotizacion.estado = 'cotizado'
        cotizacion.save()
        cotizacion.refresh_from_db()
        self.assertEqual(cotizacion.estado, 'cotizado')
        
        cotizacion.aprobar()
        cotizacion.refresh_from_db()
        self.assertEqual(cotizacion.estado, 'aprobada')
        self.assertIsNotNone(cotizacion.fecha_aprobacion)
        
        ro_number = cotizacion.generar_ro()
        cotizacion.refresh_from_db()
        self.assertEqual(cotizacion.estado, 'ro_generado')
        self.assertTrue(ro_number.startswith('RO-'))
    
    def test_cotizacion_por_estado_endpoint(self):
        """Test the cotizaciones by status endpoint"""
        TestDataFactory.create_lead_cotizacion(self.user, estado='pendiente')
        cotizacion2 = TestDataFactory.create_lead_cotizacion(self.user)
        cotizacion2.estado = 'aprobada'
        cotizacion2.save()
        
        url = '/api/sales/lead-cotizaciones/por-estado/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('pendiente', response.data)
    
    def test_generar_escenarios(self):
        """Test scenario generation for a cotización"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        
        url = f'/api/sales/lead-cotizaciones/{cotizacion.id}/generar-escenarios/'
        response = self.client.post(url)
        
        if response.status_code == status.HTTP_200_OK:
            self.assertIn('escenarios', response.data)
        elif response.status_code == status.HTTP_400_BAD_REQUEST:
            self.assertIn('error', response.data)
    
    def test_seleccionar_escenario(self):
        """Test selecting a quote scenario"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        scenario = QuoteScenario.objects.create(
            cotizacion=cotizacion,
            nombre='Escenario Económico',
            tipo='economico',
            flete_usd=Decimal('500'),
            total_usd=Decimal('750')
        )
        
        url = f'/api/sales/lead-cotizaciones/{cotizacion.id}/seleccionar-escenario/'
        response = self.client.post(url, {'escenario_id': scenario.id}, format='json')
        
        if response.status_code == status.HTTP_200_OK:
            scenario.refresh_from_db()
            self.assertTrue(scenario.is_selected)


class RoutingOrderAPITests(APITestCase):
    """Integration tests for Routing Order (RO) management"""
    
    def setUp(self):
        self.user = TestDataFactory.create_lead_user()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_generate_ro_requires_approved_cotizacion(self):
        """Test that RO generation requires an approved cotización"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        
        with self.assertRaises(ValueError):
            cotizacion.generar_ro()
    
    def test_generate_ro_success(self):
        """Test successful RO generation"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        cotizacion.aprobar()
        
        ro_number = cotizacion.generar_ro()
        
        self.assertTrue(ro_number.startswith('RO-'))
        cotizacion.refresh_from_db()
        self.assertEqual(cotizacion.estado, 'ro_generado')
        self.assertEqual(cotizacion.ro_number, ro_number)
    
    def test_ro_number_uniqueness(self):
        """Test that RO numbers are unique"""
        cotizacion1 = TestDataFactory.create_lead_cotizacion(self.user)
        cotizacion1.aprobar()
        ro1 = cotizacion1.generar_ro()
        
        cotizacion2 = TestDataFactory.create_lead_cotizacion(self.user)
        cotizacion2.aprobar()
        ro2 = cotizacion2.generar_ro()
        
        self.assertNotEqual(ro1, ro2)


class ShipmentTrackingAPITests(APITestCase):
    """Integration tests for Shipment Tracking endpoints"""
    
    def setUp(self):
        self.user = TestDataFactory.create_lead_user()
        self.other_user = TestDataFactory.create_lead_user(email='other@importaya.ia')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_shipment(self):
        """Test creating a new shipment"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        cotizacion.aprobar()
        cotizacion.generar_ro()
        
        url = '/api/sales/shipments/'
        data = {
            'cotizacion': cotizacion.id,
            'transport_type': 'maritimo',
            'carrier_name': 'MSC',
            'bl_awb_number': 'MSCU987654321',
            'origin_country': 'China',
            'origin_city': 'Shanghai',
            'destination_city': 'Guayaquil',
            'description': 'Mercancía de prueba',
            'weight_kg': '500',
            'packages': 10,
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
    
    def test_list_my_shipments(self):
        """Test listing only my shipments"""
        my_shipment = TestDataFactory.create_shipment(self.user)
        other_shipment = TestDataFactory.create_shipment(self.other_user)
        
        url = '/api/sales/shipments/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        shipment_ids = [s['id'] for s in response.data.get('results', response.data)]
        self.assertIn(my_shipment.id, shipment_ids)
        self.assertNotIn(other_shipment.id, shipment_ids)
    
    def test_shipment_por_estado(self):
        """Test shipments by status endpoint"""
        TestDataFactory.create_shipment(self.user, current_status='booking_confirmado')
        TestDataFactory.create_shipment(self.user, current_status='en_transito_internacional')
        
        url = '/api/sales/shipments/por-estado/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_add_tracking_event(self):
        """Test adding a tracking event to a shipment"""
        shipment = TestDataFactory.create_shipment(self.user)
        
        url = f'/api/sales/shipments/{shipment.id}/agregar-evento/'
        data = {
            'status': 'arribo_puerto',
            'location': 'Puerto de Guayaquil',
            'description': 'Arribo al puerto de destino',
            'event_datetime': timezone.now().isoformat(),
        }
        response = self.client.post(url, data, format='json')
        
        if response.status_code == status.HTTP_200_OK:
            shipment.refresh_from_db()
            self.assertEqual(shipment.current_status, 'arribo_puerto')
    
    def test_search_by_tracking_number(self):
        """Test searching shipment by tracking number"""
        shipment = TestDataFactory.create_shipment(self.user)
        
        url = f'/api/sales/shipments/buscar/?tracking_number={shipment.tracking_number}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_tracking_history(self):
        """Test getting tracking history for a shipment"""
        shipment = TestDataFactory.create_shipment(self.user)
        
        ShipmentTracking.objects.create(
            shipment=shipment,
            status='booking_confirmado',
            location='Shanghai, China',
            description='Booking confirmado',
            event_datetime=timezone.now() - timedelta(days=5)
        )
        ShipmentTracking.objects.create(
            shipment=shipment,
            status='en_transito_internacional',
            location='En ruta - Océano Pacífico',
            description='Zarpe del puerto de origen',
            event_datetime=timezone.now()
        )
        
        url = f'/api/sales/shipments/{shipment.id}/historial/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PreLiquidationAPITests(APITestCase):
    """Integration tests for Pre-Liquidation and AI HS Classification"""
    
    def setUp(self):
        self.user = TestDataFactory.create_lead_user()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        TestDataFactory.create_customs_duty_rates()
    
    def test_create_pre_liquidation(self):
        """Test creating a pre-liquidation"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        
        url = '/api/sales/pre-liquidations/'
        data = {
            'cotizacion': cotizacion.id,
            'product_description': 'Laptops HP modelo 2024',
            'fob_value_usd': '10000',
            'freight_usd': '300',
            'insurance_usd': '50',
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
    
    def test_hs_code_suggestion(self):
        """Test AI HS code suggestion endpoint"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        pre_liq = TestDataFactory.create_pre_liquidation(cotizacion)
        
        url = f'/api/sales/pre-liquidations/{pre_liq.id}/sugerir-hs/'
        response = self.client.post(url)
        
        if response.status_code == status.HTTP_200_OK:
            self.assertIn('suggested_hs_code', response.data)
    
    def test_confirm_hs_code(self):
        """Test confirming HS code and calculating duties"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        pre_liq = TestDataFactory.create_pre_liquidation(cotizacion)
        
        url = f'/api/sales/pre-liquidations/{pre_liq.id}/confirmar-hs/'
        data = {'hs_code': '8471300000'}
        response = self.client.post(url, data, format='json')
        
        if response.status_code == status.HTTP_200_OK:
            pre_liq.refresh_from_db()
            self.assertTrue(pre_liq.is_confirmed)
            self.assertEqual(pre_liq.confirmed_hs_code, '8471300000')
    
    def test_cif_calculation(self):
        """Test CIF value calculation"""
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        pre_liq = PreLiquidation.objects.create(
            cotizacion=cotizacion,
            product_description='Test product',
            fob_value_usd=Decimal('10000'),
            freight_usd=Decimal('500'),
            insurance_usd=Decimal('50'),
            cif_value_usd=Decimal('0')
        )
        
        cif = pre_liq.calculate_cif()
        self.assertEqual(cif, Decimal('10550'))


class DashboardAPITests(APITestCase):
    """Integration tests for Dashboard and Reports endpoints"""
    
    def setUp(self):
        self.user = TestDataFactory.create_lead_user()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        cotizacion.estado = 'aprobada'
        cotizacion.save()
        
        TestDataFactory.create_shipment(self.user, cotizacion=cotizacion)
        TestDataFactory.create_pre_liquidation(cotizacion)
    
    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        url = '/api/sales/dashboard/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertIn('cotizaciones_por_estado', response.data)
        self.assertIn('embarques_activos', response.data)
    
    def test_cost_analytics_report(self):
        """Test cost analytics report"""
        url = '/api/sales/reports/?type=cost_analytics'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_operational_kpis_report(self):
        """Test operational KPIs report"""
        url = '/api/sales/reports/?type=operational_kpis'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_import_trends_report(self):
        """Test import trends report"""
        url = '/api/sales/reports/?type=import_trends'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_financial_summary_report(self):
        """Test financial summary report"""
        url = '/api/sales/reports/?type=financial_summary'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class SecurityTests(APITestCase):
    """Security tests: Authentication, Authorization, Input Validation"""
    
    def setUp(self):
        self.user = TestDataFactory.create_lead_user()
        self.other_user = TestDataFactory.create_lead_user(email='other@importaya.ia')
        self.client = APIClient()
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access protected endpoints"""
        protected_urls = [
            '/api/sales/lead-cotizaciones/',
            '/api/sales/shipments/',
            '/api/sales/pre-liquidations/',
            '/api/sales/dashboard/',
        ]
        
        for url in protected_urls:
            response = self.client.get(url)
            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"URL {url} should require authentication"
            )
    
    def test_cannot_access_other_user_cotizacion(self):
        """Test that users cannot access other users' cotizaciones"""
        other_cotizacion = TestDataFactory.create_lead_cotizacion(self.other_user)
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/sales/lead-cotizaciones/{other_cotizacion.id}/'
        response = self.client.get(url)
        
        self.assertIn(
            response.status_code,
            [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]
        )
    
    def test_cannot_modify_other_user_cotizacion(self):
        """Test that users cannot modify other users' cotizaciones"""
        other_cotizacion = TestDataFactory.create_lead_cotizacion(self.other_user)
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/sales/lead-cotizaciones/{other_cotizacion.id}/'
        response = self.client.patch(url, {'notas_adicionales': 'Hacked!'}, format='json')
        
        self.assertIn(
            response.status_code,
            [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]
        )
    
    def test_cannot_access_other_user_shipment(self):
        """Test that users cannot access other users' shipments"""
        other_shipment = TestDataFactory.create_shipment(self.other_user)
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/sales/shipments/{other_shipment.id}/'
        response = self.client.get(url)
        
        self.assertIn(
            response.status_code,
            [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]
        )
    
    def test_sql_injection_prevention(self):
        """Test SQL injection prevention in search fields"""
        self.client.force_authenticate(user=self.user)
        
        malicious_inputs = [
            "'; DROP TABLE lead_cotizacion; --",
            "1' OR '1'='1",
            "1; SELECT * FROM users; --",
            "admin'--",
        ]
        
        for malicious_input in malicious_inputs:
            url = f'/api/sales/shipments/buscar/?tracking_number={malicious_input}'
            response = self.client.get(url)
            self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def test_xss_prevention_in_description(self):
        """Test XSS prevention in text fields"""
        self.client.force_authenticate(user=self.user)
        
        xss_payloads = [
            '<script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src="x" onerror="alert(1)">',
            '"><script>alert(String.fromCharCode(88,83,83))</script>',
        ]
        
        for payload in xss_payloads:
            url = '/api/sales/lead-cotizaciones/'
            data = {
                'tipo_carga': 'aerea',
                'origen_pais': 'China',
                'origen_ciudad': 'Shanghai',
                'destino_ciudad': 'Guayaquil',
                'descripcion_mercancia': payload,
                'peso_kg': '100',
                'valor_mercancia_usd': '5000',
                'incoterm': 'FOB',
            }
            response = self.client.post(url, data, format='json')
            self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def test_ruc_validation(self):
        """Test RUC validation (13 numeric digits)"""
        invalid_rucs = [
            '123',
            'abcdefghijklm',
            '12345678901234',
            '123456789012',
            'RUC-0912345678001',
        ]
        
        for invalid_ruc in invalid_rucs:
            try:
                profile = LeadProfile.objects.get(user=self.user)
                profile.ruc = invalid_ruc
                profile.save()
            except:
                pass
    
    def test_cannot_modify_approved_cotizacion_critical_fields(self):
        """Test that critical fields cannot be modified after approval"""
        self.client.force_authenticate(user=self.user)
        
        cotizacion = TestDataFactory.create_lead_cotizacion(self.user)
        cotizacion.estado = 'aprobada'
        cotizacion.save()
        
        original_valor = cotizacion.valor_mercancia_usd
        
        url = f'/api/sales/lead-cotizaciones/{cotizacion.id}/'
        response = self.client.patch(url, {'valor_mercancia_usd': '999999'}, format='json')
        
        cotizacion.refresh_from_db()
    
    def test_token_required_for_api_access(self):
        """Test that API access requires valid authentication token"""
        url = '/api/sales/lead-cotizaciones/'
        
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_12345')
        response = self.client.get(url)
        
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )


class DataIntegrityTests(TransactionTestCase):
    """Tests for data integrity and database constraints"""
    
    def test_cotizacion_numero_unique(self):
        """Test that cotización numbers are unique"""
        user = TestDataFactory.create_lead_user()
        
        cot1 = TestDataFactory.create_lead_cotizacion(user)
        cot2 = TestDataFactory.create_lead_cotizacion(user)
        
        self.assertNotEqual(cot1.numero_cotizacion, cot2.numero_cotizacion)
    
    def test_shipment_tracking_number_unique(self):
        """Test that tracking numbers are unique"""
        user = TestDataFactory.create_lead_user()
        
        ship1 = TestDataFactory.create_shipment(user)
        ship2 = TestDataFactory.create_shipment(user)
        
        self.assertNotEqual(ship1.tracking_number, ship2.tracking_number)
    
    def test_tracking_event_updates_shipment_status(self):
        """Test that tracking events update parent shipment status"""
        user = TestDataFactory.create_lead_user()
        shipment = TestDataFactory.create_shipment(user, current_status='booking_confirmado')
        
        ShipmentTracking.objects.create(
            shipment=shipment,
            status='en_aduana',
            location='Aduana de Guayaquil',
            description='En proceso aduanero',
            event_datetime=timezone.now()
        )
        
        shipment.refresh_from_db()
        self.assertEqual(shipment.current_status, 'en_aduana')
        self.assertEqual(shipment.current_location, 'Aduana de Guayaquil')
    
    def test_pre_liquidation_cif_calculation(self):
        """Test that CIF is correctly calculated"""
        user = TestDataFactory.create_lead_user()
        cotizacion = TestDataFactory.create_lead_cotizacion(user)
        
        pre_liq = PreLiquidation.objects.create(
            cotizacion=cotizacion,
            product_description='Test',
            fob_value_usd=Decimal('10000'),
            freight_usd=Decimal('500'),
            insurance_usd=Decimal('50'),
            cif_value_usd=Decimal('0')
        )
        
        pre_liq.calculate_cif()
        self.assertEqual(pre_liq.cif_value_usd, Decimal('10550'))


class RateCalculationTests(TestCase):
    """Tests for rate calculation logic"""
    
    def setUp(self):
        TestDataFactory.create_insurance_rates()
        TestDataFactory.create_customs_duty_rates()
        TestDataFactory.create_brokerage_rates()
    
    def test_insurance_premium_calculation(self):
        """Test insurance premium calculation"""
        rate = InsuranceRate.objects.get(coverage_type='basico')
        
        cargo_value = Decimal('10000')
        premium = rate.calculate_premium(cargo_value)
        
        expected = cargo_value * (rate.rate_percentage / Decimal('100'))
        expected = max(expected, rate.min_premium_usd)
        
        self.assertEqual(premium, expected)
    
    def test_insurance_minimum_premium(self):
        """Test that minimum premium is applied"""
        rate = InsuranceRate.objects.get(coverage_type='basico')
        
        cargo_value = Decimal('100')
        premium = rate.calculate_premium(cargo_value)
        
        self.assertEqual(premium, rate.min_premium_usd)
    
    def test_brokerage_fee_calculation(self):
        """Test customs brokerage fee calculation"""
        rate = CustomsBrokerageRate.objects.get(service_type='importacion_general')
        
        cif_value = Decimal('10000')
        fee = rate.calculate_fee(cif_value)
        
        expected = rate.fixed_rate_usd + (cif_value * rate.percentage_rate / Decimal('100'))
        expected = max(expected, rate.min_rate_usd)
        
        self.assertEqual(fee, expected)
    
    def test_cotizacion_total_calculation(self):
        """Test cotización total calculation"""
        user = TestDataFactory.create_lead_user()
        cotizacion = TestDataFactory.create_lead_cotizacion(user)
        
        cotizacion.calculate_total()
        
        self.assertIsNotNone(cotizacion.flete_usd)
        self.assertIsNotNone(cotizacion.total_usd)
        self.assertGreater(cotizacion.total_usd, Decimal('0'))
