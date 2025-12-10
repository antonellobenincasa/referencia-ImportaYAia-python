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
    FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate, CustomsBrokerageRate
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
    CustomsDutyCalculationSerializer, BrokerageFeeCalculationSerializer
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
    export_report_to_excel,
    export_report_to_pdf
)


class ReportsAPIView(APIView):
    
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
        
        if quote_submission.status == 'validacion_pendiente':
            self._find_and_apply_cost_rates(quote_submission)
    
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
        """Generate quote scenarios with strict route-specific rate matching"""
        cotizacion = self.get_object()
        from decimal import Decimal
        
        cotizacion.escenarios.all().delete()
        scenarios_created = []
        missing_rates = []
        
        tipo_carga_map = {'aerea': 'aereo', 'maritima': 'maritimo', 'terrestre': 'terrestre'}
        primary_transport = tipo_carga_map.get(cotizacion.tipo_carga, 'aereo')
        
        def find_freight_rate(transport_prefix):
            """Find freight rate with strict route matching - origin+destination required"""
            base_qs = FreightRate.objects.filter(transport_type__startswith=transport_prefix, is_active=True)
            
            rate = base_qs.filter(
                origin_country__iexact=cotizacion.origen_pais,
                destination_country__iexact='Ecuador'
            ).first()
            if rate:
                return rate
            
            rate = base_qs.filter(origin_country__iexact=cotizacion.origen_pais).first()
            return rate
        
        air_freight = find_freight_rate('aereo')
        sea_freight = find_freight_rate('maritimo')
        
        if primary_transport == 'aereo' and not air_freight:
            missing_rates.append(f'Tarifa de flete aéreo desde {cotizacion.origen_pais}')
        if primary_transport == 'maritimo' and not sea_freight:
            missing_rates.append(f'Tarifa de flete marítimo desde {cotizacion.origen_pais}')
        
        if not air_freight and not sea_freight:
            return Response({
                'error': 'No hay tarifas de flete disponibles',
                'detalles': [f'No existe tarifa de flete aéreo o marítimo desde {cotizacion.origen_pais} hacia Ecuador'],
                'accion_requerida': 'Agregue tarifas de flete en Tarifas → Flete Internacional',
                'ruta_solicitada': f'{cotizacion.origen_pais} → Ecuador ({cotizacion.destino_ciudad})'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        insurance = InsuranceRate.objects.filter(is_active=True).first()
        if not insurance:
            missing_rates.append('Tarifa de seguro de carga')
        
        brokerage = CustomsBrokerageRate.objects.filter(is_active=True).first()
        if not brokerage:
            missing_rates.append('Tarifa de agenciamiento aduanero')
        
        inland = None
        if cotizacion.requiere_transporte_interno:
            inland = InlandTransportQuoteRate.objects.filter(
                destination_city__iexact=cotizacion.destino_ciudad, is_active=True
            ).first()
            if not inland:
                inland = InlandTransportQuoteRate.objects.filter(is_active=True).first()
            if not inland:
                missing_rates.append(f'Tarifa de transporte interno a {cotizacion.destino_ciudad}')
        
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
            cif_value = cotizacion.valor_mercancia_usd + flete + seguro
            if customs_rate:
                duties = customs_rate.calculate_duties(cif_value)
            else:
                ad_valorem = cif_value * Decimal('0.10')
                fodinfa = cif_value * Decimal('0.005')
                base_iva = cif_value + ad_valorem + fodinfa
                iva = base_iva * Decimal('0.12')
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
                ('iva', 'IVA (12%)', duties['iva']),
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
        
        response_data = {
            'message': f'Se generaron {len(scenarios_created)} escenarios de cotización',
            'ruta': f'{cotizacion.origen_pais} → Ecuador ({cotizacion.destino_ciudad})',
            'escenarios': QuoteScenarioSerializer(scenarios_created, many=True).data,
            'cotizacion': LeadCotizacionDetailSerializer(cotizacion).data
        }
        
        if missing_rates:
            response_data['tarifas_faltantes'] = missing_rates
            response_data['nota'] = 'Algunas tarifas no están configuradas. Los costos usan valores predeterminados.'
        
        return Response(response_data)
    
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
