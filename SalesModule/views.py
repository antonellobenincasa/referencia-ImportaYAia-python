from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
from datetime import timedelta, datetime
import csv, io, secrets
import logging
import traceback

from accounts.mixins import OwnerFilterMixin
from .permissions import IsLeadUser

logger = logging.getLogger(__name__)
from .models import (
    Lead, Opportunity, Quote, TaskReminder, Meeting, APIKey, BulkLeadImport,
    QuoteSubmission, CostRate, LeadCotizacion, QuoteScenario, QuoteLineItem,
    FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate, CustomsBrokerageRate,
    Shipment, ShipmentTracking, PreLiquidation
)
from .serializers import (
    LeadSerializer, OpportunitySerializer, QuoteSerializer, 
    QuoteGenerateSerializer, TaskReminderSerializer, MeetingSerializer,
    APIKeySerializer, BulkLeadImportSerializer, QuoteSubmissionSerializer,
    QuoteSubmissionDetailSerializer, CostRateSerializer, LeadCotizacionSerializer,
    LeadCotizacionInstruccionSerializer, LeadCotizacionDetailSerializer,
    QuoteScenarioSerializer, QuoteLineItemSerializer,
    QuoteScenarioSelectSerializer, GenerateScenariosSerializer,
    FreightRateSerializer, InsuranceRateSerializer, CustomsDutyRateSerializer,
    InlandTransportQuoteRateSerializer, CustomsBrokerageRateSerializer,
    CustomsDutyCalculationSerializer, BrokerageFeeCalculationSerializer,
    ShipmentSerializer, ShipmentDetailSerializer, ShipmentCreateSerializer,
    ShipmentTrackingSerializer, AddTrackingEventSerializer,
    PreLiquidationSerializer, HSCodeSuggestionSerializer
)


class LeadViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'source', 'country']
    search_fields = ['company_name', 'contact_name', 'email']
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_201_CREATED:
            lead_data = response.data
            is_active_importer = lead_data.get('is_active_importer', False)
            
            if not is_active_importer:
                self._send_customs_email(lead_data)
        
        return response
    
    def _send_customs_email(self, lead_data):
        try:
            subject = f"Nuevo Lead: {lead_data['company_name']} - Oferta de Servicio de RUC"
            message = f"""
Estimado Departamento de Aduanas,

Se ha registrado un nuevo lead que podría ser cliente potencial para nuestro servicio de registro de RUC ante la SENAE.

Información del Lead:
- Empresa: {lead_data['company_name']}
- Contacto: {lead_data['contact_name']}
- Correo: {lead_data['email']}
- Teléfono: {lead_data.get('phone', 'N/A')}
- WhatsApp: {lead_data.get('whatsapp', 'N/A')}
- Ciudad: {lead_data.get('city', 'N/A')}
- Notas: {lead_data.get('notes', 'N/A')}

Por favor, contacte al lead para ofrecerle nuestro servicio de registro de RUC ante la SENAE - Aduana del Ecuador.

Sistema IntegralCargoSolutions ICS
"""
            
            customs_email = getattr(settings, 'CUSTOMS_DEPARTMENT_EMAIL', 'aduanas@integralcargosolutions.ec')
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [customs_email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending customs email: {str(e)}")


class OpportunityViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['stage', 'lead']
    search_fields = ['opportunity_name']


class QuoteViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'incoterm', 'cargo_type']
    search_fields = ['quote_number']
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_quote(self, request):
        serializer = QuoteGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        try:
            opportunity = Opportunity.objects.get(id=data['opportunity_id'])
        except Opportunity.DoesNotExist:
            return Response({'error': 'Oportunidad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        final_price = data['base_rate'] + data['profit_margin']
        
        quote = Quote.objects.create(
            opportunity=opportunity,
            origin=data['origin'],
            destination=data['destination'],
            incoterm=data['incoterm'],
            cargo_type=data['cargo_type'],
            cargo_description=data.get('cargo_description', ''),
            base_rate=data['base_rate'],
            profit_margin=data['profit_margin'],
            final_price=final_price,
            valid_until=data.get('valid_until'),
            notes=data.get('notes', ''),
            status='borrador'
        )
        
        return Response(QuoteSerializer(quote).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='send')
    def send_quote(self, request, pk=None):
        quote = self.get_object()
        
        if quote.status == 'enviado':
            return Response({'error': 'La cotización ya fue enviada'}, status=status.HTTP_400_BAD_REQUEST)
        
        quote.status = 'enviado'
        quote.sent_at = timezone.now()
        quote.save()
        
        follow_up_time = timezone.now() + timedelta(hours=1)
        TaskReminder.objects.create(
            quote=quote,
            lead=quote.opportunity.lead,
            task_type='seguimiento_cotizacion',
            title=f'Seguimiento de Cotización {quote.quote_number}',
            description=f'Hacer seguimiento de la cotización {quote.quote_number} enviada a {quote.opportunity.lead.company_name}',
            priority='alta',
            due_date=follow_up_time
        )
        
        return Response({
            'message': 'Cotización enviada exitosamente',
            'quote': QuoteSerializer(quote).data,
            'follow_up_created': True,
            'follow_up_time': follow_up_time
        }, status=status.HTTP_200_OK)


class TaskReminderViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = TaskReminder.objects.all()
    serializer_class = TaskReminderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'priority', 'task_type', 'lead']
    search_fields = ['title', 'description']
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_task(self, request, pk=None):
        task = self.get_object()
        task.status = 'completada'
        task.completed_at = timezone.now()
        task.save()
        return Response(TaskReminderSerializer(task).data)


class MeetingViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'meeting_type', 'lead']
    search_fields = ['title']
    
    @action(detail=True, methods=['post'], url_path='sync-calendar')
    def sync_calendar(self, request, pk=None):
        meeting = self.get_object()
        
        calendar_type = request.data.get('calendar_type')
        
        if calendar_type == 'google':
            meeting.google_calendar_synced = True
            meeting.save()
            return Response({
                'message': 'Mock: Reunión sincronizada con Google Calendar',
                'meeting_id': meeting.id,
                'reminder_15min': True
            })
        elif calendar_type == 'outlook':
            meeting.outlook_synced = True
            meeting.save()
            return Response({
                'message': 'Mock: Reunión sincronizada con Outlook',
                'meeting_id': meeting.id,
                'reminder_15min': True
            })
        else:
            return Response({'error': 'Tipo de calendario no válido (google/outlook)'}, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.decorators import api_view
from rest_framework.views import APIView
from django.http import HttpResponse
from datetime import datetime
from .reports.generators import (
    generate_sales_metrics_report,
    generate_lead_conversion_report,
    generate_communication_report,
    generate_quote_analytics_report,
    generate_quote_submissions_report,
    generate_dashboard_summary,
    generate_cost_analytics_report,
    generate_operational_kpis,
    generate_import_trends_report,
    generate_financial_summary,
    export_report_to_excel,
    export_report_to_pdf
)


class DashboardAPIView(APIView):
    """Consolidated dashboard summary for LEAD portal"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        summary = generate_dashboard_summary(user=request.user)
        return Response(summary, status=status.HTTP_200_OK)


class ReportsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        report_type = request.query_params.get('type', 'sales_metrics')
        format_type = request.query_params.get('format', 'json')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        start_date = None
        end_date = None
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        
        user = request.user
        
        if report_type == 'sales_metrics':
            report_data = generate_sales_metrics_report(start_date, end_date)
        elif report_type == 'lead_conversion':
            report_data = generate_lead_conversion_report(start_date, end_date)
        elif report_type == 'communication':
            report_data = generate_communication_report(start_date, end_date)
        elif report_type == 'quote_analytics':
            report_data = generate_quote_analytics_report(start_date, end_date)
        elif report_type == 'quote_submissions':
            report_data = generate_quote_submissions_report(start_date, end_date)
        elif report_type == 'cost_analytics':
            report_data = generate_cost_analytics_report(start_date, end_date, user=user)
        elif report_type == 'operational_kpis':
            report_data = generate_operational_kpis(start_date, end_date, user=user)
        elif report_type == 'import_trends':
            report_data = generate_import_trends_report(start_date, end_date, user=user)
        elif report_type == 'financial_summary':
            report_data = generate_financial_summary(start_date, end_date, user=user)
        else:
            return Response({'error': 'Tipo de reporte no válido'}, status=status.HTTP_400_BAD_REQUEST)
        
        if format_type == 'json':
            return Response(report_data, status=status.HTTP_200_OK)
        elif format_type == 'excel':
            excel_file = export_report_to_excel(report_data, report_type)
            response = HttpResponse(
                excel_file.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{report_type}_{datetime.now().strftime("%Y%m%d")}.xlsx"'
            return response
        elif format_type == 'pdf':
            pdf_file = export_report_to_pdf(report_data, report_type)
            response = HttpResponse(pdf_file.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{report_type}_{datetime.now().strftime("%Y%m%d")}.pdf"'
            return response
        else:
            return Response({'error': 'Formato no válido'}, status=status.HTTP_400_BAD_REQUEST)


class APIKeyViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = APIKey.objects.all()
    serializer_class = APIKeySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'service_type']
    search_fields = ['name', 'service_type']
    
    def perform_create(self, serializer):
        key = 'ic_' + secrets.token_urlsafe(32)
        serializer.save(key=key, owner=self.request.user)


class QuoteSubmissionViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = QuoteSubmission.objects.all()
    serializer_class = QuoteSubmissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'transport_type', 'city']
    search_fields = ['company_name', 'contact_email', 'origin', 'destination']
    
    def perform_create(self, serializer):
        quote_submission = serializer.save()
        
        self._generate_intelligent_quote_with_ai(quote_submission)
        
        if quote_submission.status == 'validacion_pendiente':
            self._find_and_apply_cost_rates(quote_submission)
    
    def _generate_intelligent_quote_with_ai(self, quote_submission):
        """Genera cotización inteligente usando Gemini AI"""
        try:
            from .gemini_service import generate_intelligent_quote
            import json
            
            ai_result = generate_intelligent_quote(
                cargo_description=quote_submission.cargo_description,
                origin=quote_submission.origin,
                destination=quote_submission.destination,
                transport_type=quote_submission.transport_type,
                weight_kg=float(quote_submission.cargo_weight_kg) if quote_submission.cargo_weight_kg else None,
                volume_cbm=float(quote_submission.cargo_volume_cbm) if quote_submission.cargo_volume_cbm else None,
                incoterm=quote_submission.incoterm or "FOB",
                fob_value_usd=None,
                container_type=quote_submission.container_type or None
            )
            
            clasificacion = ai_result.get('clasificacion', {})
            quote_submission.ai_hs_code = clasificacion.get('hs_code', '')
            quote_submission.ai_hs_confidence = clasificacion.get('confianza')
            quote_submission.ai_category = clasificacion.get('categoria', '')
            
            tributos = ai_result.get('tributos', {})
            quote_submission.ai_ad_valorem_pct = tributos.get('ad_valorem_pct')
            
            permisos = ai_result.get('permisos', [])
            quote_submission.ai_requires_permit = len(permisos) > 0
            quote_submission.ai_permit_institutions = json.dumps(permisos, ensure_ascii=False) if permisos else ''
            
            quote_submission.ai_response = json.dumps(ai_result, ensure_ascii=False)
            quote_submission.ai_status = ai_result.get('ai_status', 'unknown')
            
            if ai_result.get('ai_status') == 'success':
                self._create_scenarios_from_ai(quote_submission, ai_result)
            
            quote_submission.save()
            logger.info(f"AI quote generated for submission {quote_submission.id}: {quote_submission.ai_status}")
            
        except Exception as e:
            logger.error(f"Error generating AI quote: {e}")
            quote_submission.ai_status = 'error'
            quote_submission.notes = f"Error IA: {str(e)}"
            quote_submission.save()
    
    def _create_scenarios_from_ai(self, quote_submission, ai_result):
        """Procesa escenarios de cotización desde respuesta de IA
        
        Nota: Los escenarios se almacenan en el campo ai_response como JSON.
        QuoteScenario está vinculado a LeadCotizacion, no a QuoteSubmission.
        Los escenarios generados por IA pueden usarse para crear una LeadCotizacion posteriormente.
        """
        try:
            escenarios = ai_result.get('escenarios', [])
            if escenarios:
                logger.info(f"AI generated {len(escenarios)} scenarios for submission {quote_submission.id}")
                
                scenario_summary = []
                for esc in escenarios:
                    scenario_summary.append(f"{esc.get('tipo', 'N/A')}: ${esc.get('subtotal_logistica_usd', 0):.2f} ({esc.get('tiempo_transito_dias', 'N/A')} días)")
                
                if quote_submission.notes:
                    quote_submission.notes += f"\n\nEscenarios IA: {', '.join(scenario_summary)}"
                else:
                    quote_submission.notes = f"Escenarios IA: {', '.join(scenario_summary)}"
            
        except Exception as e:
            logger.error(f"Error processing scenarios from AI: {e}")
    
    def _find_and_apply_cost_rates(self, quote_submission):
        """Busca COST_RATES según origin/destination/transport_type"""
        try:
            cost_rate = CostRate.objects.filter(
                origin__icontains=quote_submission.origin,
                destination__icontains=quote_submission.destination,
                transport_type=quote_submission.transport_type,
                is_active=True
            ).order_by('-created_at').first()
            
            if cost_rate:
                quote_submission.cost_rate = cost_rate.rate
                quote_submission.cost_rate_source = cost_rate.source
                quote_submission.calculate_final_price()
                quote_submission.status = 'cotizacion_generada'
                quote_submission.processed_at = timezone.now()
            else:
                quote_submission.status = 'procesando_costos'
            
            quote_submission.save()
        except Exception as e:
            quote_submission.status = 'error_costos'
            quote_submission.notes = str(e)
            quote_submission.save()
    
    @action(detail=False, methods=['get'], url_path='search-cost-rates')
    def search_cost_rates(self, request):
        """Busca COST_RATES disponibles para cotización"""
        origin = request.query_params.get('origin')
        destination = request.query_params.get('destination')
        transport_type = request.query_params.get('transport_type')
        
        if not all([origin, destination, transport_type]):
            return Response({'error': 'origin, destination y transport_type son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        
        rates = CostRate.objects.filter(
            origin__icontains=origin,
            destination__icontains=destination,
            transport_type=transport_type,
            is_active=True
        ).order_by('-created_at')
        
        return Response(CostRateSerializer(rates, many=True).data)
    
    @action(detail=True, methods=['get'], url_path='download-pdf')
    def download_pdf(self, request, pk=None):
        """Descarga PDF de cotización con formato profesional"""
        try:
            quote_submission = self.get_object()
            
            from .reports.quote_pdf_generator import generate_quote_pdf, generate_multi_scenario_pdf
            import json
            
            scenario_index = request.query_params.get('scenario')
            
            scenario_data = None
            if quote_submission.ai_response:
                try:
                    ai_response = json.loads(quote_submission.ai_response)
                    escenarios = ai_response.get('escenarios', [])
                    
                    if scenario_index is not None:
                        idx = int(scenario_index)
                        if 0 <= idx < len(escenarios):
                            raw_scenario = escenarios[idx]
                        else:
                            raw_scenario = escenarios[0] if escenarios else {}
                    else:
                        raw_scenario = escenarios[0] if escenarios else {}
                    
                    scenario_data = {
                        'flete_base': raw_scenario.get('flete_maritimo_usd') or raw_scenario.get('flete_aereo_usd') or raw_scenario.get('flete_usd', 1600),
                        'tarifa_cbm': raw_scenario.get('tarifa_cbm', 85),
                        'tarifa_ton': raw_scenario.get('tarifa_ton', 85),
                        'tarifa_kg': raw_scenario.get('tarifa_kg', 4.50),
                        'dias_transito': raw_scenario.get('tiempo_transito_dias', 'N/A'),
                        'dias_libres': raw_scenario.get('dias_libres_demora', 21),
                        'costos_locales': {
                            'visto_bueno': raw_scenario.get('gastos_documentacion_usd', 100),
                            'handling': raw_scenario.get('handling_usd', 50),
                            'delivery_porteo': raw_scenario.get('transporte_interno_usd', 250),
                            'thc': raw_scenario.get('thc_usd', 200),
                            'manejo_pago_local': raw_scenario.get('manejo_pago_usd', 150),
                        }
                    }
                except (json.JSONDecodeError, ValueError):
                    pass
            
            pdf_buffer = generate_quote_pdf(quote_submission, scenario_data)
            
            filename = f"Cotizacion_{quote_submission.submission_number or quote_submission.id}_{quote_submission.transport_type}.pdf"
            
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            logger.error(f"Error generating quote PDF: {e}")
            return Response({'error': f'Error generando PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'], url_path='download-multi-scenario-pdf')
    def download_multi_scenario_pdf(self, request, pk=None):
        """Descarga PDF con múltiples escenarios de cotización"""
        try:
            quote_submission = self.get_object()
            
            from .reports.quote_pdf_generator import generate_multi_scenario_pdf
            import json
            
            scenarios = []
            if quote_submission.ai_response:
                try:
                    ai_response = json.loads(quote_submission.ai_response)
                    escenarios = ai_response.get('escenarios', [])
                    
                    for esc in escenarios:
                        scenarios.append({
                            'nombre': esc.get('tipo', 'N/A'),
                            'dias_transito': esc.get('tiempo_transito_dias', 'N/A'),
                            'total_usd': esc.get('subtotal_logistica_usd', 0)
                        })
                except json.JSONDecodeError:
                    pass
            
            if not scenarios:
                return Response({'error': 'No hay escenarios disponibles para esta cotización'}, status=status.HTTP_400_BAD_REQUEST)
            
            pdf_buffer = generate_multi_scenario_pdf(quote_submission, scenarios)
            
            filename = f"Cotizacion_Escenarios_{quote_submission.submission_number or quote_submission.id}.pdf"
            
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            logger.error(f"Error generating multi-scenario PDF: {e}")
            return Response({'error': f'Error generando PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CostRateViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = CostRate.objects.filter(is_active=True)
    serializer_class = CostRateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['origin', 'destination', 'transport_type', 'source', 'is_active']
    search_fields = ['origin', 'destination', 'provider_name']
    
    @action(detail=False, methods=['get'], url_path='by-route')
    def get_by_route(self, request):
        """Obtiene tarifa para una ruta específica"""
        origin = request.query_params.get('origin')
        destination = request.query_params.get('destination')
        transport_type = request.query_params.get('transport_type')
        
        if not all([origin, destination, transport_type]):
            return Response({'error': 'Parámetros requeridos: origin, destination, transport_type'}, status=status.HTTP_400_BAD_REQUEST)
        
        rate = CostRate.objects.filter(
            origin__icontains=origin,
            destination__icontains=destination,
            transport_type=transport_type,
            is_active=True
        ).order_by('-created_at').first()
        
        if rate:
            return Response(CostRateSerializer(rate).data)
        return Response({'error': 'No hay tarifa disponible para esta ruta'}, status=status.HTTP_404_NOT_FOUND)


class BulkLeadImportViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = BulkLeadImport.objects.all()
    serializer_class = BulkLeadImportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'file_type']
    
    @action(detail=False, methods=['get'], url_path='template')
    def generate_template(self, request):
        file_type = request.query_params.get('file_type', 'csv')
        # EXACTAMENTE los nombres de columna que espera el parser de upload
        columns = ['Empresa', 'Nombre Contacto', 'Correo', 'Teléfono', 'WhatsApp', 'País', 'Ciudad', 'Notas', '¿Es Importador Activo?', 'RUC']
        
        if file_type == 'csv':
            output = io.StringIO()
            # Usar punto y coma como delimitador (estándar en Ecuador)
            writer = csv.writer(output, delimiter=';', lineterminator='\r\n')
            writer.writerow(columns)
            
            # Agregar UTF-8 BOM para que Excel reconozca caracteres acentuados
            csv_content = output.getvalue()
            csv_bytes = '\ufeff' + csv_content  # UTF-8 BOM
            
            response = HttpResponse(csv_bytes.encode('utf-8'), content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="plantilla_leads.csv"'
            return response
        
        elif file_type == 'xlsx':
            import openpyxl
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = 'Leads'
            ws.append(columns)
            
            excel_file = io.BytesIO()
            wb.save(excel_file)
            excel_file.seek(0)
            
            response = HttpResponse(excel_file.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="plantilla_leads.xlsx"'
            return response
        
        elif file_type == 'xls':
            import openpyxl
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = 'Leads'
            ws.append(columns)
            
            excel_file = io.BytesIO()
            wb.save(excel_file)
            excel_file.seek(0)
            
            response = HttpResponse(excel_file.getvalue(), content_type='application/vnd.ms-excel')
            response['Content-Disposition'] = 'attachment; filename="plantilla_leads.xls"'
            return response
        
        elif file_type == 'txt':
            output = '\t'.join(columns)
            response = HttpResponse(output, content_type='text/plain')
            response['Content-Disposition'] = 'attachment; filename="plantilla_leads.txt"'
            return response
        
        return Response({'error': 'Tipo de archivo no válido'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='upload')
    def upload_file(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Detectar tipo de archivo automáticamente si no se proporciona
        file_type = request.data.get('file_type', '').lower()
        if not file_type:
            filename_lower = file_obj.name.lower()
            if filename_lower.endswith('.xlsx'):
                file_type = 'xlsx'
            elif filename_lower.endswith('.xls'):
                file_type = 'xls'
            elif filename_lower.endswith('.csv'):
                file_type = 'csv'
            elif filename_lower.endswith('.txt'):
                file_type = 'txt'
            else:
                return Response({'error': f'Tipo de archivo no soportado: {file_obj.name}'}, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Archivo: {file_obj.name}, Tipo detectado: {file_type}")
        
        # CRITICAL: Leer contenido ANTES de guardar en modelo (Django consume el archivo)
        try:
            file_content = file_obj.read()
            logger.info(f"Contenido leído: {len(file_content)} bytes")
        except Exception as e:
            logger.exception(f"Error leyendo archivo: {str(e)}")
            return Response({'error': f'Error leyendo archivo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        file_obj.seek(0)  # Reset para que Django pueda guardarlo
        
        import_record = BulkLeadImport.objects.create(
            file=file_obj,
            file_type=file_type,
            status='procesando'
        )
        
        try:
            logger.info(f"Iniciando parse de archivo {file_type}")
            rows = self._parse_file_content(file_content, file_type)
            logger.info(f"Parse exitoso, {len(rows)} filas encontradas")
            
            import_record.total_rows = len(rows)
            import_record.save()
            
            error_list = []
            for idx, row in enumerate(rows):
                try:
                    # Clean whitespace from all values
                    row = {k: (str(v).strip() if v else '') for k, v in row.items()}
                    
                    # Map both Spanish and English column names
                    company_name = row.get('Empresa') or row.get('company_name') or 'N/A'
                    contact_name = row.get('Nombre Contacto') or row.get('contact_name') or ''
                    email = row.get('Correo') or row.get('email') or ''
                    phone = row.get('Teléfono') or row.get('phone') or ''
                    whatsapp = row.get('WhatsApp') or row.get('whatsapp') or ''
                    country = row.get('País') or row.get('country') or 'Ecuador'
                    city = row.get('Ciudad') or row.get('city') or ''
                    notes = row.get('Notas') or row.get('notes') or ''
                    is_active_importer_val = row.get('¿Es Importador Activo?') or row.get('is_active_importer') or 'False'
                    ruc_val = row.get('RUC') or row.get('ruc') or ''
                    
                    # Dividir contact_name en first_name y last_name
                    name_parts = contact_name.strip().split(' ', 1) if contact_name else ['', '']
                    first_name = name_parts[0] if len(name_parts) > 0 else ''
                    last_name = name_parts[1] if len(name_parts) > 1 else ''
                    
                    logger.debug(f"Fila {idx+1}: Empresa='{company_name}', Nombre='{first_name}', Apellido='{last_name}', Email='{email}'")
                    
                    lead = Lead.objects.create(
                        company_name=company_name[:255],
                        first_name=first_name[:255],
                        last_name=last_name[:255],
                        email=email[:255],
                        phone=phone[:50],
                        whatsapp=whatsapp[:50],
                        country=country[:100],
                        city=city[:100],
                        source='bulk_import',
                        notes=notes,
                        is_active_importer=str(is_active_importer_val).lower() in ['true', 'sí', 'si', '1', 'verdadero'],
                        ruc=ruc_val[:13]
                    )
                    import_record.imported_rows += 1
                    logger.info(f"✅ Fila {idx+1} creada exitosamente")
                except Exception as e:
                    import_record.error_rows += 1
                    error_msg = f"Fila {idx+1}: {str(e)}"
                    error_list.append(error_msg)
                    logger.error(error_msg)
            
            import_record.error_details = '\n'.join(error_list)
            import_record.status = 'completado'
            import_record.save()
            
            return Response(BulkLeadImportSerializer(import_record).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            error_tb = traceback.format_exc()
            logger.error(f"Error en upload_file: {str(e)}\n{error_tb}")
            import_record.status = 'error'
            import_record.error_details = f"{str(e)}\n\nTraceback:\n{error_tb}"
            import_record.save()
            return Response({
                'error': str(e),
                'detail': error_tb,
                'import_id': import_record.id
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _parse_file_content(self, content, file_type):
        """Parse file content that was already read into memory"""
        rows = []
        try:
            if file_type == 'csv':
                try:
                    text = content.decode('utf-8')
                except UnicodeDecodeError:
                    text = content.decode('latin-1')
                
                # Remover BOM si existe
                if text.startswith('\ufeff'):
                    text = text[1:]
                    logger.info("BOM UTF-8 removido del contenido")
                
                # Auto-detect delimiter (comma or semicolon)
                first_line = text.split('\n')[0] if text else ''
                delimiter = ';' if ';' in first_line else ','
                logger.info(f"CSV delimiter detectado: '{delimiter}'")
                
                reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
                rows = [row for row in reader if any(row.values())]
                logger.info(f"CSV leído con {len(rows)} filas")
            
            elif file_type == 'xlsx':
                import openpyxl
                logger.info(f"Leyendo XLSX con openpyxl...")
                
                wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
                ws = wb.active
                logger.info(f"Sheet activa: {ws.title}, max_row: {ws.max_row}")
                
                if not ws or ws.max_row < 2:
                    logger.warning("Archivo Excel está vacío")
                    return []
                
                headers = []
                for cell in ws[1]:
                    if cell.value:
                        headers.append(str(cell.value).strip())
                
                logger.info(f"Headers encontrados: {headers}")
                
                if not headers:
                    logger.warning("No se encontraron headers en el Excel")
                    return []
                
                for row_idx in range(2, ws.max_row + 1):
                    values = []
                    for col_idx in range(1, len(headers) + 1):
                        cell = ws.cell(row=row_idx, column=col_idx)
                        val = str(cell.value).strip() if cell.value else ''
                        values.append(val)
                    
                    if any(values):
                        row_dict = dict(zip(headers, values))
                        rows.append(row_dict)
                        logger.debug(f"Fila {row_idx}: {row_dict}")
                
                wb.close()
                logger.info(f"Total filas leídas: {len(rows)}")
            
            elif file_type == 'txt':
                try:
                    text = content.decode('utf-8')
                except UnicodeDecodeError:
                    text = content.decode('latin-1')
                
                for line in text.split('\n'):
                    if line.strip():
                        parts = [p.strip() for p in line.split('\t')]
                        rows.append({
                            'Empresa': parts[0] if len(parts) > 0 else '',
                            'Nombre Contacto': parts[1] if len(parts) > 1 else ''
                        })
        
        except Exception as e:
            error_tb = traceback.format_exc()
            logger.error(f"Error en _parse_file {file_type}: {str(e)}\n{error_tb}")
            raise ValueError(f"Error parseando archivo {file_type}: {str(e)}")
        
        return rows


class LeadCotizacionViewSet(viewsets.ModelViewSet):
    """ViewSet for LEAD user quotation requests - restricted to LEAD role users only"""
    serializer_class = LeadCotizacionSerializer
    permission_classes = [IsAuthenticated, IsLeadUser]
    filterset_fields = ['estado', 'tipo_carga']
    search_fields = ['numero_cotizacion', 'descripcion_mercancia', 'origen_pais']
    ordering_fields = ['fecha_creacion', 'total_usd', 'estado']
    
    def get_queryset(self):
        queryset = LeadCotizacion.objects.filter(lead_user=self.request.user)
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LeadCotizacionDetailSerializer
        return LeadCotizacionSerializer
    
    def perform_create(self, serializer):
        serializer.save(lead_user=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='por-estado')
    def por_estado(self, request):
        """Get quotations grouped by status"""
        queryset = self.get_queryset()
        estados = {}
        for estado_code, estado_name in LeadCotizacion.ESTADO_CHOICES:
            estados[estado_code] = {
                'nombre': str(estado_name),
                'count': queryset.filter(estado=estado_code).count()
            }
        return Response(estados)
    
    @action(detail=True, methods=['post'], url_path='generar-escenarios')
    def generar_escenarios(self, request, pk=None):
        """Generate quote scenarios with strict route-aligned rate matching"""
        cotizacion = self.get_object()
        from decimal import Decimal
        
        cotizacion.escenarios.all().delete()
        scenarios_created = []
        
        tipo_carga_map = {'aerea': 'aereo', 'maritima': 'maritimo', 'terrestre': 'terrestre'}
        primary_transport = tipo_carga_map.get(cotizacion.tipo_carga, 'aereo')
        
        def find_freight_rate_strict(transport_prefix):
            """Find freight rate with strict route alignment - requires origin+destination match"""
            base_qs = FreightRate.objects.filter(transport_type__startswith=transport_prefix, is_active=True)
            return base_qs.filter(
                origin_country__iexact=cotizacion.origen_pais,
                destination_country__iexact='Ecuador'
            ).first()
        
        air_freight = find_freight_rate_strict('aereo')
        sea_freight = find_freight_rate_strict('maritimo')
        
        if not air_freight and not sea_freight:
            return Response({
                'error': 'No hay tarifas de flete configuradas para esta ruta',
                'detalles': [
                    f'Origen: {cotizacion.origen_pais}',
                    f'Destino: Ecuador ({cotizacion.destino_ciudad})',
                    'No se encontraron tarifas aéreas ni marítimas para esta ruta'
                ],
                'accion_requerida': 'Configure tarifas de flete para la ruta solicitada antes de generar escenarios',
                'configuracion_necesaria': {
                    'modelo': 'FreightRate',
                    'campos_requeridos': {
                        'origin_country': cotizacion.origen_pais,
                        'destination_country': 'Ecuador',
                        'transport_type': 'aereo o maritimo_*'
                    }
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        insurance = InsuranceRate.objects.filter(is_active=True).first()
        if not insurance:
            return Response({
                'error': 'No hay tarifa de seguro configurada',
                'accion_requerida': 'Configure al menos una tarifa de seguro activa'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        brokerage = CustomsBrokerageRate.objects.filter(is_active=True).first()
        if not brokerage:
            return Response({
                'error': 'No hay tarifa de agenciamiento aduanero configurada',
                'accion_requerida': 'Configure al menos una tarifa de agenciamiento activa'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        inland = None
        if cotizacion.requiere_transporte_interno:
            inland = InlandTransportQuoteRate.objects.filter(
                destination_city__iexact=cotizacion.destino_ciudad, is_active=True
            ).first()
            if not inland:
                return Response({
                    'error': f'No hay tarifa de transporte interno a {cotizacion.destino_ciudad}',
                    'accion_requerida': f'Configure tarifa de transporte interno para {cotizacion.destino_ciudad}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        customs_rate = CustomsDutyRate.objects.filter(is_active=True).first()
        
        air_rate = air_freight.rate_usd if air_freight else Decimal('4.50')
        sea_rate = sea_freight.rate_usd if sea_freight else Decimal('0.85')
        insurance_pct = (insurance.rate_percentage / 100) if insurance else Decimal('0.005')
        brokerage_fee = brokerage.fixed_rate_usd if brokerage else Decimal('150')
        inland_cost = inland.rate_usd if inland else Decimal('80')
        air_transit = air_freight.transit_time_days if air_freight else 5
        sea_transit = sea_freight.transit_time_days if sea_freight else 25
        
        def calculate_duties(flete, seguro):
            """Calculate customs duties based on CIF value"""
            from .gemini_service import SENAE_TRIBUTOS_2025
            cif_value = cotizacion.valor_mercancia_usd + flete + seguro
            if customs_rate:
                duties = customs_rate.calculate_duties(cif_value)
            else:
                ad_valorem = cif_value * SENAE_TRIBUTOS_2025['ad_valorem_default']
                fodinfa = cif_value * SENAE_TRIBUTOS_2025['fodinfa_rate']
                base_iva = cif_value + ad_valorem + fodinfa
                iva = base_iva * SENAE_TRIBUTOS_2025['iva_rate']
                duties = {
                    'ad_valorem': ad_valorem,
                    'fodinfa': fodinfa,
                    'ice': Decimal('0'),
                    'salvaguardia': Decimal('0'),
                    'iva': iva,
                    'total': ad_valorem + fodinfa + iva
                }
            return duties
        
        def create_scenario_with_items(nombre, tipo, flete, transit_days, freight_rate_obj, notas):
            seguro = cotizacion.valor_mercancia_usd * insurance_pct if cotizacion.requiere_seguro else Decimal('0')
            transporte = inland_cost if cotizacion.requiere_transporte_interno else Decimal('0')
            duties = calculate_duties(flete, seguro)
            
            total = flete + seguro + brokerage_fee + transporte + duties['total'] + Decimal('25')
            
            scenario = QuoteScenario.objects.create(
                cotizacion=cotizacion,
                nombre=nombre,
                tipo=tipo,
                freight_rate=freight_rate_obj,
                insurance_rate=insurance if cotizacion.requiere_seguro else None,
                brokerage_rate=brokerage,
                inland_transport_rate=inland if cotizacion.requiere_transporte_interno else None,
                flete_usd=flete,
                seguro_usd=seguro,
                agenciamiento_usd=brokerage_fee,
                transporte_interno_usd=transporte,
                otros_usd=duties['total'] + Decimal('25'),
                total_usd=total,
                tiempo_transito_dias=transit_days,
                notas=notas
            )
            
            line_items_data = [
                ('flete', f'Flete Internacional ({cotizacion.peso_kg} kg)', flete),
                ('seguro', f'Seguro de Carga ({insurance_pct*100:.2f}%)', seguro),
                ('arancel', f'Ad Valorem ({customs_rate.ad_valorem_percentage if customs_rate else 10}%)', duties['ad_valorem']),
                ('fodinfa', 'FODINFA (0.5%)', duties['fodinfa']),
                ('iva', 'IVA (15%)', duties['iva']),
                ('ice', 'ICE', duties.get('ice', Decimal('0'))),
                ('salvaguardia', 'Salvaguardia', duties.get('salvaguardia', Decimal('0'))),
                ('agenciamiento', 'Agenciamiento Aduanero', brokerage_fee),
                ('transporte_interno', f'Transporte a {cotizacion.destino_ciudad}', transporte),
                ('otros', 'Gastos Administrativos', Decimal('25')),
            ]
            
            for cat, desc, amount in line_items_data:
                if amount > 0:
                    QuoteLineItem.objects.create(
                        escenario=scenario,
                        categoria=cat,
                        descripcion=desc,
                        cantidad=Decimal('1'),
                        precio_unitario_usd=amount,
                        subtotal_usd=amount,
                        es_estimado=(cat in ['arancel', 'iva', 'fodinfa', 'ice', 'salvaguardia'])
                    )
            
            return scenario
        
        air_flete = cotizacion.peso_kg * air_rate
        air_scenario = create_scenario_with_items(
            'Opción Aérea Express', 'express', air_flete, air_transit, air_freight,
            'Transporte aéreo con tiempo de tránsito reducido'
        )
        scenarios_created.append(air_scenario)
        
        sea_flete = cotizacion.peso_kg * sea_rate
        sea_scenario = create_scenario_with_items(
            'Opción Marítima Económica', 'economico', sea_flete, sea_transit, sea_freight,
            'Transporte marítimo con mejor precio'
        )
        scenarios_created.append(sea_scenario)
        
        std_rate = (air_rate + sea_rate) / 2
        std_flete = cotizacion.peso_kg * std_rate
        std_scenario = create_scenario_with_items(
            'Opción Estándar', 'estandar', std_flete, int((air_transit + sea_transit) / 2), None,
            'Balance entre precio y tiempo de tránsito'
        )
        scenarios_created.append(std_scenario)
        
        cotizacion.estado = 'cotizado'
        cotizacion.save()
        
        return Response({
            'message': f'Se generaron {len(scenarios_created)} escenarios de cotización',
            'ruta': f'{cotizacion.origen_pais} → Ecuador ({cotizacion.destino_ciudad})',
            'tarifas_verificadas': True,
            'escenarios': QuoteScenarioSerializer(scenarios_created, many=True).data,
            'cotizacion': LeadCotizacionDetailSerializer(cotizacion).data
        })
    
    @action(detail=True, methods=['post'], url_path='seleccionar-escenario')
    def seleccionar_escenario(self, request, pk=None):
        """Select a quote scenario"""
        cotizacion = self.get_object()
        serializer = QuoteScenarioSelectSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        scenario_id = serializer.validated_data['scenario_id']
        try:
            scenario = cotizacion.escenarios.get(id=scenario_id)
        except QuoteScenario.DoesNotExist:
            return Response({'error': 'Escenario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        cotizacion.escenarios.update(is_selected=False)
        scenario.is_selected = True
        scenario.save()
        
        cotizacion.flete_usd = scenario.flete_usd
        cotizacion.seguro_usd = scenario.seguro_usd
        cotizacion.aduana_usd = scenario.agenciamiento_usd
        cotizacion.transporte_interno_usd = scenario.transporte_interno_usd
        cotizacion.otros_usd = scenario.otros_usd
        cotizacion.total_usd = scenario.total_usd
        cotizacion.save()
        
        return Response({
            'message': 'Escenario seleccionado exitosamente',
            'escenario': QuoteScenarioSerializer(scenario).data,
            'cotizacion': LeadCotizacionDetailSerializer(cotizacion).data
        })
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Approve a quotation"""
        cotizacion = self.get_object()
        
        if cotizacion.estado != 'cotizado':
            return Response(
                {'error': 'Solo se pueden aprobar cotizaciones con estado "cotizado"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cotizacion.aprobar()
        return Response({
            'message': 'Cotización aprobada exitosamente',
            'cotizacion': LeadCotizacionDetailSerializer(cotizacion).data
        })
    
    @action(detail=True, methods=['post'], url_path='instruccion-embarque')
    def instruccion_embarque(self, request, pk=None):
        """Send shipping instructions and generate RO number"""
        cotizacion = self.get_object()
        
        if cotizacion.estado != 'aprobada':
            return Response(
                {'error': 'Solo se pueden enviar instrucciones para cotizaciones aprobadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = LeadCotizacionInstruccionSerializer(data=request.data)
        if serializer.is_valid():
            cotizacion.shipper_name = serializer.validated_data['shipper_name']
            cotizacion.shipper_address = serializer.validated_data['shipper_address']
            cotizacion.consignee_name = serializer.validated_data['consignee_name']
            cotizacion.consignee_address = serializer.validated_data['consignee_address']
            cotizacion.notify_party = serializer.validated_data.get('notify_party', '')
            cotizacion.fecha_embarque_estimada = serializer.validated_data['fecha_embarque_estimada']
            cotizacion.save()
            
            ro_number = cotizacion.generar_ro()
            
            return Response({
                'success': True,
                'message': f'RO generado exitosamente: {ro_number}',
                'ro_number': ro_number,
                'cotizacion': LeadCotizacionDetailSerializer(cotizacion).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FreightRateViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    """CRUD for freight rates"""
    queryset = FreightRate.objects.all()
    serializer_class = FreightRateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['transport_mode', 'origin_port', 'destination_port', 'is_active']
    search_fields = ['origin_port', 'destination_port', 'carrier_name']
    ordering_fields = ['rate_usd', 'transit_time_days', 'created_at']


class InsuranceRateViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    """CRUD for insurance rates"""
    queryset = InsuranceRate.objects.all()
    serializer_class = InsuranceRateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['coverage_type', 'is_active']
    search_fields = ['name']
    ordering_fields = ['rate_percentage', 'created_at']
    
    @action(detail=True, methods=['post'], url_path='calculate-premium')
    def calculate_premium(self, request, pk=None):
        """Calculate insurance premium for a cargo value"""
        rate = self.get_object()
        cargo_value = request.data.get('cargo_value')
        if cargo_value is None:
            return Response({'error': 'cargo_value is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from decimal import Decimal
            premium = rate.calculate_premium(Decimal(str(cargo_value)))
            return Response({
                'cargo_value': str(cargo_value),
                'premium': str(premium),
                'rate_percentage': str(rate.rate_percentage)
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CustomsDutyRateViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only access to SENAE customs duty rates (government tariffs)"""
    queryset = CustomsDutyRate.objects.filter(is_active=True)
    serializer_class = CustomsDutyRateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'requires_import_license', 'requires_phytosanitary', 'requires_inen_certification']
    search_fields = ['hs_code', 'description']
    ordering_fields = ['hs_code', 'ad_valorem_percentage', 'created_at']
    
    @action(detail=True, methods=['post'], url_path='calculate-duties')
    def calculate_duties(self, request, pk=None):
        """Calculate all customs duties for a CIF value"""
        rate = self.get_object()
        serializer = CustomsDutyCalculationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        cif_value = serializer.validated_data['cif_value_usd']
        quantity = serializer.validated_data.get('quantity', 1)
        
        duties = rate.calculate_duties(cif_value, quantity)
        return Response({
            'cif_value_usd': str(cif_value),
            'quantity': quantity,
            'hs_code': rate.hs_code,
            'duties': {k: str(v) for k, v in duties.items()}
        })
    
    @action(detail=False, methods=['get'], url_path='search-hs')
    def search_hs(self, request):
        """Search customs duty rates by HS code prefix"""
        hs_code = request.query_params.get('code', '')
        if len(hs_code) < 2:
            return Response({'error': 'Provide at least 2 digits of HS code'}, status=status.HTTP_400_BAD_REQUEST)
        
        rates = CustomsDutyRate.objects.filter(hs_code__startswith=hs_code, is_active=True)[:20]
        serializer = self.get_serializer(rates, many=True)
        return Response(serializer.data)


class InlandTransportQuoteRateViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    """CRUD for inland transport rates"""
    queryset = InlandTransportQuoteRate.objects.all()
    serializer_class = InlandTransportQuoteRateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['origin_city', 'destination_city', 'vehicle_type', 'is_active']
    search_fields = ['origin_city', 'destination_city', 'carrier_name']
    ordering_fields = ['rate_usd', 'distance_km', 'created_at']


class CustomsBrokerageRateViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    """CRUD for customs brokerage fees"""
    queryset = CustomsBrokerageRate.objects.all()
    serializer_class = CustomsBrokerageRateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['service_type', 'is_active']
    search_fields = ['name']
    ordering_fields = ['fixed_rate_usd', 'created_at']
    
    @action(detail=True, methods=['post'], url_path='calculate-fee')
    def calculate_fee(self, request, pk=None):
        """Calculate brokerage fee for a CIF value"""
        rate = self.get_object()
        serializer = BrokerageFeeCalculationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        cif_value = serializer.validated_data['cif_value_usd']
        fee = rate.calculate_fee(cif_value)
        
        return Response({
            'cif_value_usd': str(cif_value),
            'fee_usd': str(fee),
            'service_type': rate.get_service_type_display()
        })


class ShipmentViewSet(viewsets.ModelViewSet):
    """ViewSet for shipment tracking - LEAD users only"""
    permission_classes = [IsAuthenticated, IsLeadUser]
    filterset_fields = ['current_status', 'transport_type']
    search_fields = ['tracking_number', 'bl_awb_number', 'container_number', 'description']
    ordering_fields = ['created_at', 'estimated_arrival', 'current_status']
    
    def get_queryset(self):
        return Shipment.objects.filter(lead_user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ShipmentCreateSerializer
        if self.action == 'retrieve':
            return ShipmentDetailSerializer
        return ShipmentSerializer
    
    def perform_create(self, serializer):
        serializer.save(lead_user=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='por-estado')
    def por_estado(self, request):
        """Get shipment counts by status for dashboard"""
        queryset = self.get_queryset()
        estados = {}
        for status_code, status_name in Shipment.STATUS_CHOICES:
            estados[status_code] = {
                'nombre': str(status_name),
                'count': queryset.filter(current_status=status_code).count()
            }
        return Response(estados)
    
    @action(detail=True, methods=['post'], url_path='agregar-evento')
    def agregar_evento(self, request, pk=None):
        """Add a tracking event to a shipment"""
        shipment = self.get_object()
        serializer = AddTrackingEventSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        event = ShipmentTracking.objects.create(
            shipment=shipment,
            status=serializer.validated_data['status'],
            location=serializer.validated_data['location'],
            description=serializer.validated_data['description'],
            event_datetime=serializer.validated_data['event_datetime']
        )
        
        return Response({
            'message': 'Evento de tracking agregado',
            'evento': ShipmentTrackingSerializer(event).data,
            'shipment': ShipmentDetailSerializer(shipment).data
        })
    
    @action(detail=True, methods=['get'], url_path='historial')
    def historial(self, request, pk=None):
        """Get full tracking history for a shipment"""
        shipment = self.get_object()
        events = shipment.tracking_events.all()
        return Response({
            'tracking_number': shipment.tracking_number,
            'current_status': shipment.get_current_status_display(),
            'eventos': ShipmentTrackingSerializer(events, many=True).data
        })
    
    @action(detail=False, methods=['get'], url_path='buscar/(?P<tracking_number>[^/.]+)')
    def buscar(self, request, tracking_number=None):
        """Search shipment by tracking number"""
        try:
            shipment = self.get_queryset().get(tracking_number=tracking_number)
            return Response(ShipmentDetailSerializer(shipment).data)
        except Shipment.DoesNotExist:
            return Response({'error': 'Embarque no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class PreLiquidationViewSet(viewsets.ModelViewSet):
    """ViewSet for pre-liquidation with AI HS code classification"""
    serializer_class = PreLiquidationSerializer
    permission_classes = [IsAuthenticated, IsLeadUser]
    
    def get_queryset(self):
        return PreLiquidation.objects.filter(cotizacion__lead_user=self.request.user)
    
    def perform_create(self, serializer):
        pre_liq = serializer.save()
        pre_liq.calculate_cif()
        self._suggest_hs_code(pre_liq)
        self._calculate_estimated_duties(pre_liq)
        pre_liq.save()
    
    def _calculate_estimated_duties(self, pre_liq):
        """Calculate estimated duties using suggested HS code or default rates"""
        from decimal import Decimal
        cif = pre_liq.cif_value_usd
        
        try:
            if pre_liq.suggested_hs_code and pre_liq.suggested_hs_code != '9999.00.00':
                duty_rate = CustomsDutyRate.objects.filter(
                    hs_code=pre_liq.suggested_hs_code, 
                    is_active=True
                ).first()
                if duty_rate:
                    duties = duty_rate.calculate_duties(cif)
                    pre_liq.ad_valorem_usd = duties['ad_valorem']
                    pre_liq.fodinfa_usd = duties['fodinfa']
                    pre_liq.ice_usd = duties['ice']
                    pre_liq.salvaguardia_usd = duties['salvaguardia']
                    pre_liq.iva_usd = duties['iva']
                    pre_liq.total_tributos_usd = duties['total']
                    return
        except Exception:
            pass
        
        from .gemini_service import SENAE_TRIBUTOS_2025
        pre_liq.ad_valorem_usd = cif * SENAE_TRIBUTOS_2025['ad_valorem_default']
        pre_liq.fodinfa_usd = cif * SENAE_TRIBUTOS_2025['fodinfa_rate']
        base_iva = cif + pre_liq.ad_valorem_usd + pre_liq.fodinfa_usd
        pre_liq.iva_usd = base_iva * SENAE_TRIBUTOS_2025['iva_rate']
        pre_liq.ice_usd = Decimal('0')
        pre_liq.salvaguardia_usd = Decimal('0')
        pre_liq.total_tributos_usd = pre_liq.ad_valorem_usd + pre_liq.fodinfa_usd + pre_liq.iva_usd
    
    def _suggest_hs_code(self, pre_liq):
        """AI-powered HS code suggestion using Gemini AI"""
        from .gemini_service import suggest_hs_code
        
        origin_country = ''
        if pre_liq.cotizacion:
            origin_country = getattr(pre_liq.cotizacion, 'origin', '') or getattr(pre_liq.cotizacion, 'origen_pais', '') or ''
        
        fob_value = float(pre_liq.fob_value_usd) if pre_liq.fob_value_usd else 0
        
        result = suggest_hs_code(
            product_description=pre_liq.product_description,
            origin_country=origin_country,
            fob_value=fob_value
        )
        
        pre_liq.suggested_hs_code = result.get('suggested_hs_code', '9999.00.00')
        pre_liq.hs_code_confidence = result.get('confidence', 30)
        
        reasoning = result.get('reasoning', 'Clasificacion pendiente')
        notes = result.get('notes', '')
        ai_status = result.get('ai_status', 'unknown')
        
        if ai_status.startswith('fallback'):
            reasoning = f"[Sistema de respaldo] {reasoning}"
        
        if notes and notes not in reasoning:
            reasoning = f"{reasoning} | {notes}"
        
        pre_liq.ai_reasoning = reasoning
        pre_liq.ai_status = ai_status
        
        pre_liq.requires_permit = result.get('requires_permit', False)
        permit_info = result.get('permit_info', None)
        if permit_info and isinstance(permit_info, dict):
            pre_liq.permit_institucion = permit_info.get('institucion', '')
            pre_liq.permit_tipo = permit_info.get('permiso', '')
            pre_liq.permit_descripcion = permit_info.get('descripcion', '')
            pre_liq.permit_tramite_previo = permit_info.get('tramite_previo', False)
            pre_liq.permit_tiempo_estimado = permit_info.get('tiempo_estimado', '')
        
        special_taxes = result.get('special_taxes', [])
        if special_taxes and isinstance(special_taxes, list):
            pre_liq.special_taxes = special_taxes
    
    @action(detail=True, methods=['post'], url_path='confirmar-hs')
    def confirmar_hs(self, request, pk=None):
        """Confirm HS code and calculate duties with CIF recalculation"""
        pre_liq = self.get_object()
        hs_code = request.data.get('hs_code', pre_liq.suggested_hs_code)
        
        if not hs_code:
            return Response({'error': 'Se requiere código HS'}, status=status.HTTP_400_BAD_REQUEST)
        
        pre_liq.confirmed_hs_code = hs_code
        pre_liq.calculate_cif()
        
        try:
            duty_rate = CustomsDutyRate.objects.get(hs_code=hs_code, is_active=True)
            duties = duty_rate.calculate_duties(pre_liq.cif_value_usd)
            
            pre_liq.ad_valorem_usd = duties['ad_valorem']
            pre_liq.fodinfa_usd = duties['fodinfa']
            pre_liq.ice_usd = duties['ice']
            pre_liq.salvaguardia_usd = duties['salvaguardia']
            pre_liq.iva_usd = duties['iva']
            pre_liq.total_tributos_usd = duties['total']
            pre_liq.is_confirmed = True
            pre_liq.confirmed_by = request.user
            pre_liq.confirmed_at = timezone.now()
            pre_liq.save()
            
            return Response({
                'message': 'Código HS confirmado y tributos calculados',
                'hs_code': hs_code,
                'cif_value_usd': str(pre_liq.cif_value_usd),
                'tributos': {
                    'ad_valorem': str(pre_liq.ad_valorem_usd),
                    'fodinfa': str(pre_liq.fodinfa_usd),
                    'ice': str(pre_liq.ice_usd),
                    'salvaguardia': str(pre_liq.salvaguardia_usd),
                    'iva': str(pre_liq.iva_usd),
                    'total': str(pre_liq.total_tributos_usd)
                },
                'pre_liquidacion': PreLiquidationSerializer(pre_liq).data
            })
        except CustomsDutyRate.DoesNotExist:
            from decimal import Decimal
            from .gemini_service import SENAE_TRIBUTOS_2025
            cif = pre_liq.cif_value_usd
            pre_liq.ad_valorem_usd = cif * SENAE_TRIBUTOS_2025['ad_valorem_default']
            pre_liq.fodinfa_usd = cif * SENAE_TRIBUTOS_2025['fodinfa_rate']
            base_iva = cif + pre_liq.ad_valorem_usd + pre_liq.fodinfa_usd
            pre_liq.iva_usd = base_iva * SENAE_TRIBUTOS_2025['iva_rate']
            pre_liq.ice_usd = Decimal('0')
            pre_liq.salvaguardia_usd = Decimal('0')
            pre_liq.total_tributos_usd = pre_liq.ad_valorem_usd + pre_liq.fodinfa_usd + pre_liq.iva_usd
            pre_liq.is_confirmed = True
            pre_liq.confirmed_by = request.user
            pre_liq.confirmed_at = timezone.now()
            pre_liq.save()
            
            return Response({
                'message': 'Código HS confirmado con tarifas estimadas (no existe tarifa específica)',
                'hs_code': hs_code,
                'nota': 'Se usaron tarifas estimadas: Ad Valorem 10%, FODINFA 0.5%, IVA 15% (2025)',
                'pre_liquidacion': PreLiquidationSerializer(pre_liq).data
            })
    
    @action(detail=False, methods=['post'], url_path='sugerir-hs')
    def sugerir_hs(self, request):
        """AI endpoint for HS code suggestion using Gemini AI"""
        from .gemini_service import suggest_hs_code
        
        serializer = HSCodeSuggestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        description = serializer.validated_data['product_description']
        origin_country = request.data.get('origin_country', '')
        try:
            fob_value = float(request.data.get('fob_value', 0) or 0)
        except (ValueError, TypeError):
            fob_value = 0
        
        result = suggest_hs_code(
            product_description=description,
            origin_country=origin_country,
            fob_value=fob_value
        )
        
        ai_status = result.get('ai_status', 'unknown')
        
        return Response({
            'suggested_hs_code': result.get('suggested_hs_code', '9999.00.00'),
            'confidence': result.get('confidence', 30),
            'category': result.get('category', ''),
            'reasoning': result.get('reasoning', 'Clasificacion pendiente'),
            'notes': result.get('notes', ''),
            'ai_powered': ai_status == 'success',
            'ai_status': ai_status,
            'ad_valorem_rate': result.get('ad_valorem_rate', 0.10),
            'requires_permit': result.get('requires_permit', False),
            'permit_info': result.get('permit_info', None),
            'special_taxes': result.get('special_taxes', []),
            'tributos_2025': result.get('tributos_2025', {
                'iva_rate': 0.15,
                'fodinfa_rate': 0.005,
                'ad_valorem_rate': 0.10
            })
        })


class AIAssistantAPIView(APIView):
    """
    AI Assistant endpoint for ImportaYa.ia
    Handles text queries (Mode A) and document analysis (Mode B)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .gemini_service import ai_assistant_chat
        
        message = request.data.get('message', '').strip()
        image_data = request.data.get('image_data')
        image_mime_type = request.data.get('image_mime_type')
        
        if not message and not image_data:
            return Response({
                'error': 'Se requiere un mensaje o una imagen para procesar'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not message:
            message = "Analiza este documento y extrae la informacion relevante para importacion a Ecuador."
        
        result = ai_assistant_chat(
            message=message,
            image_data=image_data,
            image_mime_type=image_mime_type
        )
        
        return Response(result)
