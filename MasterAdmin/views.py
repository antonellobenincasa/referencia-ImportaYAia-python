"""
MASTER ADMIN Views - Complete Dashboard and CRUD Operations
Provides unrestricted access to all system data for super administrator.
"""
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.apps import apps
from datetime import timedelta
import logging
import os

from .authentication import (
    MasterAdminAuthentication,
    IsMasterAdmin,
    validate_master_admin_credentials,
    create_master_admin_session,
    invalidate_master_admin_session,
)

from accounts.models import CustomUser, LeadProfile
from SalesModule.models import (
    LeadCotizacion, Shipment, ShipmentTracking, PreLiquidation,
    FreightRate, InsuranceRate, CustomsDutyRate, 
    InlandTransportQuoteRate, CustomsBrokerageRate,
    QuoteScenario, QuoteLineItem
)

logger = logging.getLogger(__name__)


class MasterAdminLoginView(APIView):
    """
    Exclusive login endpoint for MASTER ADMIN.
    Uses credentials from Replit Secrets - NOT linked to regular user auth.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        username = request.data.get('username', '')
        password = request.data.get('password', '')
        
        if not username or not password:
            return Response({
                'success': False,
                'error': 'Credenciales requeridas'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if validate_master_admin_credentials(username, password):
            token = create_master_admin_session()
            logger.info(f"MASTER ADMIN login successful from {request.META.get('REMOTE_ADDR')}")
            
            return Response({
                'success': True,
                'message': 'Acceso MASTER ADMIN concedido',
                'token': token,
                'expires_in_hours': 8
            })
        else:
            logger.warning(f"Failed MASTER ADMIN login attempt from {request.META.get('REMOTE_ADDR')}")
            return Response({
                'success': False,
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)


class MasterAdminLogoutView(APIView):
    """Logout endpoint for MASTER ADMIN."""
    authentication_classes = [MasterAdminAuthentication]
    permission_classes = [IsMasterAdmin]
    
    def post(self, request):
        token = request.headers.get('X-Master-Admin-Token')
        if token:
            invalidate_master_admin_session(token)
        return Response({'success': True, 'message': 'Sesión MASTER ADMIN cerrada'})


class MasterAdminDashboardView(APIView):
    """
    Main Dashboard - High-level KPIs and system overview.
    """
    authentication_classes = [MasterAdminAuthentication]
    permission_classes = [IsMasterAdmin]
    
    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        total_leads = CustomUser.objects.filter(role='lead').count()
        total_cotizaciones = LeadCotizacion.objects.count()
        cotizaciones_aprobadas = LeadCotizacion.objects.filter(estado='aprobada').count()
        cotizaciones_rechazadas = LeadCotizacion.objects.filter(estado='rechazada').count()
        cotizaciones_pendientes = LeadCotizacion.objects.filter(estado='pendiente').count()
        
        ros_activos = LeadCotizacion.objects.filter(
            estado__in=['ro_generado', 'en_transito'],
            ro_number__isnull=False
        ).count()
        
        embarques_activos = Shipment.objects.exclude(
            current_status__in=['entregado', 'incidencia']
        ).count()
        
        valor_total_cotizado = LeadCotizacion.objects.aggregate(
            total=Sum('total_usd')
        )['total'] or 0
        
        tributos_totales = PreLiquidation.objects.filter(
            is_confirmed=True
        ).aggregate(
            total=Sum('total_tributos_usd')
        )['total'] or 0
        
        cotizaciones_mes = LeadCotizacion.objects.filter(
            fecha_creacion__gte=month_start
        ).count()
        
        cotizaciones_por_estado = LeadCotizacion.objects.values('estado').annotate(
            count=Count('id')
        ).order_by('estado')
        
        embarques_por_estado = Shipment.objects.values('current_status').annotate(
            count=Count('id')
        ).order_by('current_status')
        
        return Response({
            'kpis': {
                'total_leads': total_leads,
                'total_cotizaciones': total_cotizaciones,
                'cotizaciones_aprobadas': cotizaciones_aprobadas,
                'cotizaciones_rechazadas': cotizaciones_rechazadas,
                'cotizaciones_pendientes': cotizaciones_pendientes,
                'ros_activos': ros_activos,
                'embarques_activos': embarques_activos,
                'valor_total_cotizado_usd': float(valor_total_cotizado),
                'tributos_totales_usd': float(tributos_totales),
            },
            'metricas_mes': {
                'cotizaciones_nuevas': cotizaciones_mes,
            },
            'distribucion': {
                'cotizaciones_por_estado': list(cotizaciones_por_estado),
                'embarques_por_estado': list(embarques_por_estado),
            },
            'timestamp': now.isoformat()
        })


class MasterAdminUsersView(APIView):
    """
    Full CRUD access to all Users (LEADs).
    """
    authentication_classes = [MasterAdminAuthentication]
    permission_classes = [IsMasterAdmin]
    
    def get(self, request):
        user_id = request.query_params.get('id')
        
        if user_id:
            try:
                user = CustomUser.objects.get(id=user_id)
                profile = None
                try:
                    profile = LeadProfile.objects.get(user=user)
                    profile_data = {
                        'ruc': profile.ruc,
                        'razon_social': profile.razon_social,
                        'tipo_persona': profile.tipo_persona,
                        'codigo_senae': profile.codigo_senae,
                        'direccion_matriz': profile.direccion_matriz,
                        'ciudad': profile.ciudad,
                        'provincia': profile.provincia,
                        'telefono_empresa': profile.telefono_empresa,
                        'productos_frecuentes': profile.productos_frecuentes,
                        'paises_origen_frecuentes': profile.paises_origen_frecuentes,
                    }
                except LeadProfile.DoesNotExist:
                    profile_data = None
                
                return Response({
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'role': user.role,
                    'is_active': user.is_active,
                    'date_joined': user.date_joined,
                    'last_login': user.last_login,
                    'profile': profile_data
                })
            except CustomUser.DoesNotExist:
                return Response({'error': 'Usuario no encontrado'}, status=404)
        
        users = CustomUser.objects.all().order_by('-date_joined')
        
        role_filter = request.query_params.get('role')
        if role_filter:
            users = users.filter(role=role_filter)
        
        search = request.query_params.get('search')
        if search:
            users = users.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return Response({
            'total': users.count(),
            'users': [
                {
                    'id': u.id,
                    'email': u.email,
                    'first_name': u.first_name,
                    'last_name': u.last_name,
                    'phone': u.phone,
                    'role': u.role,
                    'is_active': u.is_active,
                    'date_joined': u.date_joined,
                    'last_login': u.last_login,
                }
                for u in users[:100]
            ]
        })
    
    def put(self, request):
        user_id = request.data.get('id')
        if not user_id:
            return Response({'error': 'ID de usuario requerido'}, status=400)
        
        try:
            user = CustomUser.objects.get(id=user_id)
            
            updatable_fields = ['first_name', 'last_name', 'phone', 'is_active', 'role']
            for field in updatable_fields:
                if field in request.data:
                    setattr(user, field, request.data[field])
            
            user.save()
            return Response({'success': True, 'message': 'Usuario actualizado'})
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)
    
    def delete(self, request):
        user_id = request.query_params.get('id')
        if not user_id:
            return Response({'error': 'ID de usuario requerido'}, status=400)
        
        try:
            user = CustomUser.objects.get(id=user_id)
            user.is_active = False
            user.save()
            return Response({'success': True, 'message': 'Usuario desactivado'})
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)


class MasterAdminCotizacionesView(APIView):
    """
    Full CRUD access to all Cotizaciones.
    """
    authentication_classes = [MasterAdminAuthentication]
    permission_classes = [IsMasterAdmin]
    
    def get(self, request):
        cotizacion_id = request.query_params.get('id')
        
        if cotizacion_id:
            try:
                cot = LeadCotizacion.objects.get(id=cotizacion_id)
                scenarios = QuoteScenario.objects.filter(cotizacion=cot)
                
                return Response({
                    'cotizacion': {
                        'id': cot.id,
                        'numero_cotizacion': cot.numero_cotizacion,
                        'lead_user_id': cot.lead_user_id,
                        'lead_email': cot.lead_user.email if cot.lead_user else None,
                        'tipo_carga': cot.tipo_carga,
                        'origen_pais': cot.origen_pais,
                        'origen_ciudad': cot.origen_ciudad,
                        'destino_ciudad': cot.destino_ciudad,
                        'descripcion_mercancia': cot.descripcion_mercancia,
                        'peso_kg': float(cot.peso_kg) if cot.peso_kg else 0,
                        'volumen_cbm': float(cot.volumen_cbm) if cot.volumen_cbm else 0,
                        'valor_mercancia_usd': float(cot.valor_mercancia_usd) if cot.valor_mercancia_usd else 0,
                        'incoterm': cot.incoterm,
                        'flete_usd': float(cot.flete_usd) if cot.flete_usd else 0,
                        'seguro_usd': float(cot.seguro_usd) if cot.seguro_usd else 0,
                        'aduana_usd': float(cot.aduana_usd) if cot.aduana_usd else 0,
                        'transporte_interno_usd': float(cot.transporte_interno_usd) if cot.transporte_interno_usd else 0,
                        'otros_usd': float(cot.otros_usd) if cot.otros_usd else 0,
                        'total_usd': float(cot.total_usd) if cot.total_usd else 0,
                        'estado': cot.estado,
                        'ro_number': cot.ro_number,
                        'fecha_creacion': cot.fecha_creacion,
                        'fecha_aprobacion': cot.fecha_aprobacion,
                    },
                    'scenarios': [
                        {
                            'id': s.id,
                            'nombre': s.nombre,
                            'tipo_transporte': s.tipo_transporte,
                            'total_usd': float(s.total_usd) if s.total_usd else 0,
                            'is_selected': s.is_selected,
                        }
                        for s in scenarios
                    ]
                })
            except LeadCotizacion.DoesNotExist:
                return Response({'error': 'Cotización no encontrada'}, status=404)
        
        cotizaciones = LeadCotizacion.objects.all().order_by('-fecha_creacion')
        
        estado_filter = request.query_params.get('estado')
        if estado_filter:
            cotizaciones = cotizaciones.filter(estado=estado_filter)
        
        search = request.query_params.get('search')
        if search:
            cotizaciones = cotizaciones.filter(
                Q(numero_cotizacion__icontains=search) |
                Q(descripcion_mercancia__icontains=search) |
                Q(ro_number__icontains=search)
            )
        
        return Response({
            'total': cotizaciones.count(),
            'cotizaciones': [
                {
                    'id': c.id,
                    'numero_cotizacion': c.numero_cotizacion,
                    'lead_email': c.lead_user.email if c.lead_user else None,
                    'origen': f"{c.origen_ciudad}, {c.origen_pais}",
                    'destino': c.destino_ciudad,
                    'total_usd': float(c.total_usd) if c.total_usd else 0,
                    'estado': c.estado,
                    'ro_number': c.ro_number,
                    'fecha_creacion': c.fecha_creacion,
                }
                for c in cotizaciones[:100]
            ]
        })
    
    def put(self, request):
        cotizacion_id = request.data.get('id')
        if not cotizacion_id:
            return Response({'error': 'ID de cotización requerido'}, status=400)
        
        try:
            cot = LeadCotizacion.objects.get(id=cotizacion_id)
            
            updatable_fields = [
                'estado', 'flete_usd', 'seguro_usd', 'aduana_usd',
                'transporte_interno_usd', 'otros_usd', 'total_usd'
            ]
            for field in updatable_fields:
                if field in request.data:
                    setattr(cot, field, request.data[field])
            
            cot.save()
            return Response({'success': True, 'message': 'Cotización actualizada'})
        except LeadCotizacion.DoesNotExist:
            return Response({'error': 'Cotización no encontrada'}, status=404)
    
    def delete(self, request):
        cotizacion_id = request.query_params.get('id')
        if not cotizacion_id:
            return Response({'error': 'ID de cotización requerido'}, status=400)
        
        try:
            cot = LeadCotizacion.objects.get(id=cotizacion_id)
            cot.delete()
            return Response({'success': True, 'message': 'Cotización eliminada'})
        except LeadCotizacion.DoesNotExist:
            return Response({'error': 'Cotización no encontrada'}, status=404)


class MasterAdminShipmentsView(APIView):
    """
    Full CRUD access to all Shipments and Tracking.
    """
    authentication_classes = [MasterAdminAuthentication]
    permission_classes = [IsMasterAdmin]
    
    def get(self, request):
        shipment_id = request.query_params.get('id')
        
        if shipment_id:
            try:
                ship = Shipment.objects.get(id=shipment_id)
                tracking = ShipmentTracking.objects.filter(shipment=ship).order_by('-timestamp')
                
                return Response({
                    'shipment': {
                        'id': ship.id,
                        'tracking_number': ship.tracking_number,
                        'cotizacion_id': ship.cotizacion_id,
                        'transport_type': ship.transport_type,
                        'carrier_name': ship.carrier_name,
                        'bl_awb_number': ship.bl_awb_number,
                        'container_number': ship.container_number,
                        'origin_country': ship.origin_country,
                        'origin_city': ship.origin_city,
                        'destination_city': ship.destination_city,
                        'current_status': ship.current_status,
                        'current_location': ship.current_location,
                        'estimated_departure': ship.estimated_departure,
                        'actual_departure': ship.actual_departure,
                        'estimated_arrival': ship.estimated_arrival,
                        'actual_arrival': ship.actual_arrival,
                        'estimated_delivery': ship.estimated_delivery,
                        'actual_delivery': ship.actual_delivery,
                    },
                    'tracking_history': [
                        {
                            'id': t.id,
                            'status': t.status,
                            'location': t.location,
                            'description': t.description,
                            'timestamp': t.timestamp,
                        }
                        for t in tracking
                    ]
                })
            except Shipment.DoesNotExist:
                return Response({'error': 'Embarque no encontrado'}, status=404)
        
        shipments = Shipment.objects.all().order_by('-created_at')
        
        status_filter = request.query_params.get('status')
        if status_filter:
            shipments = shipments.filter(current_status=status_filter)
        
        return Response({
            'total': shipments.count(),
            'shipments': [
                {
                    'id': s.id,
                    'tracking_number': s.tracking_number,
                    'origin': f"{s.origin_city}, {s.origin_country}",
                    'destination': s.destination_city,
                    'transport_type': s.transport_type,
                    'current_status': s.current_status,
                    'current_location': s.current_location,
                    'created_at': s.created_at,
                }
                for s in shipments[:100]
            ]
        })
    
    def put(self, request):
        shipment_id = request.data.get('id')
        if not shipment_id:
            return Response({'error': 'ID de embarque requerido'}, status=400)
        
        try:
            ship = Shipment.objects.get(id=shipment_id)
            
            updatable_fields = [
                'current_status', 'current_location', 'carrier_name',
                'estimated_arrival', 'actual_arrival', 'estimated_delivery', 'actual_delivery'
            ]
            for field in updatable_fields:
                if field in request.data:
                    setattr(ship, field, request.data[field])
            
            ship.save()
            return Response({'success': True, 'message': 'Embarque actualizado'})
        except Shipment.DoesNotExist:
            return Response({'error': 'Embarque no encontrado'}, status=404)


class MasterAdminRatesView(APIView):
    """
    Full CRUD access to all Cost/Rate tables.
    """
    authentication_classes = [MasterAdminAuthentication]
    permission_classes = [IsMasterAdmin]
    
    def get(self, request):
        rate_type = request.query_params.get('type', 'freight')
        
        if rate_type == 'freight':
            rates = FreightRate.objects.all()
            return Response({
                'type': 'freight',
                'total': rates.count(),
                'rates': [
                    {
                        'id': r.id,
                        'origen_pais': r.origen_pais,
                        'destino_pais': r.destino_pais,
                        'tipo_transporte': r.tipo_transporte,
                        'tarifa_base_usd': float(r.tarifa_base_usd),
                        'tarifa_kg_usd': float(r.tarifa_kg_usd) if r.tarifa_kg_usd else 0,
                        'tarifa_cbm_usd': float(r.tarifa_cbm_usd) if r.tarifa_cbm_usd else 0,
                        'is_active': r.is_active,
                    }
                    for r in rates
                ]
            })
        elif rate_type == 'insurance':
            rates = InsuranceRate.objects.all()
            return Response({
                'type': 'insurance',
                'total': rates.count(),
                'rates': [
                    {
                        'id': r.id,
                        'nombre': r.nombre,
                        'tipo_cobertura': r.tipo_cobertura,
                        'tasa_porcentaje': float(r.tasa_porcentaje),
                        'prima_minima_usd': float(r.prima_minima_usd),
                        'is_active': r.is_active,
                    }
                    for r in rates
                ]
            })
        elif rate_type == 'customs':
            rates = CustomsDutyRate.objects.all()
            return Response({
                'type': 'customs',
                'total': rates.count(),
                'rates': [
                    {
                        'id': r.id,
                        'codigo_hs': r.codigo_hs,
                        'descripcion': r.descripcion,
                        'ad_valorem_pct': float(r.ad_valorem_pct),
                        'fodinfa_pct': float(r.fodinfa_pct),
                        'ice_pct': float(r.ice_pct) if r.ice_pct else 0,
                        'salvaguardia_pct': float(r.salvaguardia_pct) if r.salvaguardia_pct else 0,
                        'iva_pct': float(r.iva_pct),
                    }
                    for r in rates
                ]
            })
        elif rate_type == 'inland':
            rates = InlandTransportQuoteRate.objects.all()
            return Response({
                'type': 'inland',
                'total': rates.count(),
                'rates': [
                    {
                        'id': r.id,
                        'ciudad_destino': r.ciudad_destino,
                        'tipo_vehiculo': r.tipo_vehiculo,
                        'tarifa_base_usd': float(r.tarifa_base_usd),
                        'is_active': r.is_active,
                    }
                    for r in rates
                ]
            })
        elif rate_type == 'brokerage':
            rates = CustomsBrokerageRate.objects.all()
            return Response({
                'type': 'brokerage',
                'total': rates.count(),
                'rates': [
                    {
                        'id': r.id,
                        'nombre': r.nombre,
                        'tarifa_base_usd': float(r.tarifa_base_usd),
                        'porcentaje_valor': float(r.porcentaje_valor) if r.porcentaje_valor else 0,
                        'is_active': r.is_active,
                    }
                    for r in rates
                ]
            })
        
        return Response({'error': 'Tipo de tarifa no válido'}, status=400)


class MasterAdminProfitReviewView(APIView):
    """
    Financial Reporting - Profit Review by RO and Freight Forwarder.
    """
    authentication_classes = [MasterAdminAuthentication]
    permission_classes = [IsMasterAdmin]
    
    def get(self, request):
        ros = LeadCotizacion.objects.filter(
            ro_number__isnull=False
        ).order_by('-fecha_creacion')
        
        profit_data = []
        total_revenue = 0
        total_costs = 0
        
        for ro in ros:
            flete = float(ro.flete_usd) if ro.flete_usd else 0
            seguro = float(ro.seguro_usd) if ro.seguro_usd else 0
            aduana = float(ro.aduana_usd) if ro.aduana_usd else 0
            transporte = float(ro.transporte_interno_usd) if ro.transporte_interno_usd else 0
            otros = float(ro.otros_usd) if ro.otros_usd else 0
            total = float(ro.total_usd) if ro.total_usd else 0
            
            estimated_cost = flete * 0.7 + seguro * 0.8 + aduana * 0.9 + transporte * 0.75
            margin = total - estimated_cost
            margin_pct = (margin / total * 100) if total > 0 else 0
            
            total_revenue += total
            total_costs += estimated_cost
            
            profit_data.append({
                'ro_number': ro.ro_number,
                'cotizacion_numero': ro.numero_cotizacion,
                'cliente_email': ro.lead_user.email if ro.lead_user else 'N/A',
                'origen': f"{ro.origen_ciudad}, {ro.origen_pais}",
                'destino': ro.destino_ciudad,
                'tipo_carga': ro.tipo_carga,
                'estado': ro.estado,
                'desglose': {
                    'flete_usd': flete,
                    'seguro_usd': seguro,
                    'aduana_usd': aduana,
                    'transporte_interno_usd': transporte,
                    'otros_usd': otros,
                },
                'total_facturado_usd': total,
                'costo_estimado_usd': round(estimated_cost, 2),
                'margen_usd': round(margin, 2),
                'margen_porcentaje': round(margin_pct, 2),
                'fecha_creacion': ro.fecha_creacion,
            })
        
        total_margin = total_revenue - total_costs
        avg_margin_pct = (total_margin / total_revenue * 100) if total_revenue > 0 else 0
        
        return Response({
            'resumen': {
                'total_ros': len(profit_data),
                'ingresos_totales_usd': round(total_revenue, 2),
                'costos_totales_usd': round(total_costs, 2),
                'margen_total_usd': round(total_margin, 2),
                'margen_promedio_porcentaje': round(avg_margin_pct, 2),
            },
            'ros': profit_data,
            'export_available': True
        })


class MasterAdminLogsView(APIView):
    """
    System Logs and Error Viewer.
    """
    authentication_classes = [MasterAdminAuthentication]
    permission_classes = [IsMasterAdmin]
    
    def get(self, request):
        log_type = request.query_params.get('type', 'system')
        limit = int(request.query_params.get('limit', 100))
        
        logs = []
        
        if log_type == 'system':
            log_files = [
                '/tmp/logs/ImportaYa.ia_Server_*.log',
            ]
            
            import glob
            for pattern in log_files:
                files = sorted(glob.glob(pattern), reverse=True)[:3]
                for log_file in files:
                    try:
                        with open(log_file, 'r') as f:
                            lines = f.readlines()[-limit:]
                            logs.extend([{
                                'source': os.path.basename(log_file),
                                'message': line.strip(),
                                'level': 'ERROR' if 'error' in line.lower() else 'INFO'
                            } for line in lines if line.strip()])
                    except Exception as e:
                        logs.append({
                            'source': 'system',
                            'message': f'Error leyendo log: {str(e)}',
                            'level': 'WARNING'
                        })
        
        api_status = {
            'database': 'connected',
            'celery': 'unknown',
            'email_service': 'mock',
            'senae_api': 'not_configured',
            'tracking_api': 'mock',
        }
        
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            api_status['database'] = 'connected'
        except Exception:
            api_status['database'] = 'disconnected'
        
        return Response({
            'logs': logs[-limit:],
            'api_status': api_status,
            'timestamp': timezone.now().isoformat()
        })


class MasterAdminExportView(APIView):
    """
    Export data to CSV/Excel format.
    """
    authentication_classes = [MasterAdminAuthentication]
    permission_classes = [IsMasterAdmin]
    
    def get(self, request):
        export_type = request.query_params.get('type', 'profit')
        format_type = request.query_params.get('format', 'csv')
        
        if export_type == 'profit':
            ros = LeadCotizacion.objects.filter(ro_number__isnull=False)
            
            csv_data = "RO Number,Cotizacion,Cliente,Origen,Destino,Total USD,Margen Estimado USD,Fecha\n"
            for ro in ros:
                total = float(ro.total_usd) if ro.total_usd else 0
                margin = total * 0.25
                csv_data += f"{ro.ro_number},{ro.numero_cotizacion},{ro.lead_user.email if ro.lead_user else 'N/A'},\"{ro.origen_ciudad}, {ro.origen_pais}\",{ro.destino_ciudad},{total},{round(margin, 2)},{ro.fecha_creacion.strftime('%Y-%m-%d')}\n"
            
            return Response({
                'success': True,
                'format': 'csv',
                'filename': f'profit_report_{timezone.now().strftime("%Y%m%d")}.csv',
                'data': csv_data
            })
        
        return Response({'error': 'Tipo de exportación no válido'}, status=400)
