from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
from datetime import timedelta, datetime
import csv, io, secrets
from .models import Lead, Opportunity, Quote, TaskReminder, Meeting, APIKey, BulkLeadImport
from .serializers import (
    LeadSerializer, OpportunitySerializer, QuoteSerializer, 
    QuoteGenerateSerializer, TaskReminderSerializer, MeetingSerializer,
    APIKeySerializer, BulkLeadImportSerializer
)


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
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


class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    filterset_fields = ['stage', 'lead']
    search_fields = ['opportunity_name']


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
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


class TaskReminderViewSet(viewsets.ModelViewSet):
    queryset = TaskReminder.objects.all()
    serializer_class = TaskReminderSerializer
    filterset_fields = ['status', 'priority', 'task_type', 'lead']
    search_fields = ['title', 'description']
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_task(self, request, pk=None):
        task = self.get_object()
        task.status = 'completada'
        task.completed_at = timezone.now()
        task.save()
        return Response(TaskReminderSerializer(task).data)


class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
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


class APIKeyViewSet(viewsets.ModelViewSet):
    queryset = APIKey.objects.all()
    serializer_class = APIKeySerializer
    filterset_fields = ['is_active', 'service_type']
    search_fields = ['name', 'service_type']
    
    def perform_create(self, serializer):
        key = 'ic_' + secrets.token_urlsafe(32)
        serializer.save(key=key)


class BulkLeadImportViewSet(viewsets.ModelViewSet):
    queryset = BulkLeadImport.objects.all()
    serializer_class = BulkLeadImportSerializer
    filterset_fields = ['status', 'file_type']
    
    @action(detail=False, methods=['get'], url_path='template')
    def generate_template(self, request):
        file_type = request.query_params.get('file_type', 'csv')
        columns = ['company_name', 'first_name', 'last_name', 'email', 'phone', 'whatsapp', 'country', 'city', 'source', 'notes']
        
        if file_type == 'csv':
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(columns)
            response = HttpResponse(output.getvalue(), content_type='text/csv')
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
        
        file_type = request.data.get('file_type', 'csv')
        
        import_record = BulkLeadImport.objects.create(
            file=file_obj,
            file_type=file_type,
            status='procesando'
        )
        
        try:
            rows = self._parse_file(file_obj, file_type)
            import_record.total_rows = len(rows)
            import_record.save()
            
            error_list = []
            for idx, row in enumerate(rows):
                try:
                    lead = Lead.objects.create(
                        company_name=row.get('company_name', 'N/A'),
                        contact_name=row.get('contact_name', 'N/A'),
                        email=row.get('email', ''),
                        phone=row.get('phone', ''),
                        whatsapp=row.get('whatsapp', ''),
                        country=row.get('country', 'Ecuador'),
                        city=row.get('city', ''),
                        source='bulk_import',
                        notes=row.get('notes', '')
                    )
                    import_record.imported_rows += 1
                except Exception as e:
                    import_record.error_rows += 1
                    error_list.append(f"Fila {idx+1}: {str(e)}")
            
            import_record.error_details = '\n'.join(error_list)
            import_record.status = 'completado'
            import_record.save()
            
            return Response(BulkLeadImportSerializer(import_record).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import_record.status = 'error'
            import_record.error_details = str(e)
            import_record.save()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def _parse_file(self, file_obj, file_type):
        rows = []
        content = file_obj.read()
        
        if file_type == 'csv':
            reader = csv.DictReader(io.StringIO(content.decode('utf-8')))
            rows = list(reader)
        elif file_type in ['xlsx', 'xls']:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content))
            ws = wb.active
            headers = [cell.value for cell in ws[1]]
            for row in ws.iter_rows(min_row=2, values_only=False):
                row_dict = {}
                for idx, cell in enumerate(row):
                    row_dict[headers[idx]] = cell.value
                rows.append(row_dict)
        elif file_type == 'txt':
            lines = content.decode('utf-8').split('\n')
            for line in lines:
                if line.strip():
                    parts = line.split('\t')
                    rows.append({'company_name': parts[0] if len(parts) > 0 else '', 'contact_name': parts[1] if len(parts) > 1 else ''})
        
        return rows
