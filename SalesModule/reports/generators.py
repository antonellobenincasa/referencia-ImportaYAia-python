from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from SalesModule.models import Lead, Opportunity, Quote, TaskReminder, QuoteSubmission, CostRate
from CommsModule.models import InboxMessage
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import io


def generate_sales_metrics_report(start_date=None, end_date=None):
    if not end_date:
        end_date = timezone.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    total_leads = Lead.objects.filter(created_at__range=[start_date, end_date]).count()
    converted_leads = Lead.objects.filter(
        created_at__range=[start_date, end_date],
        status='convertido'
    ).count()
    
    total_quotes = Quote.objects.filter(created_at__range=[start_date, end_date]).count()
    quotes_sent = Quote.objects.filter(
        created_at__range=[start_date, end_date],
        status='enviado'
    ).count()
    quotes_accepted = Quote.objects.filter(
        created_at__range=[start_date, end_date],
        status='aceptado'
    ).count()
    
    total_quote_value = Quote.objects.filter(
        created_at__range=[start_date, end_date]
    ).aggregate(total=Sum('final_price'))['total'] or 0
    
    avg_quote_value = Quote.objects.filter(
        created_at__range=[start_date, end_date]
    ).aggregate(avg=Avg('final_price'))['avg'] or 0
    
    opportunities = Opportunity.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('stage').annotate(count=Count('id'))
    
    return {
        'period': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'leads': {
            'total': total_leads,
            'converted': converted_leads,
            'conversion_rate': round((converted_leads / total_leads * 100) if total_leads > 0 else 0, 2)
        },
        'quotes': {
            'total': total_quotes,
            'sent': quotes_sent,
            'accepted': quotes_accepted,
            'acceptance_rate': round((quotes_accepted / quotes_sent * 100) if quotes_sent > 0 else 0, 2),
            'total_value': float(total_quote_value),
            'average_value': float(avg_quote_value)
        },
        'opportunities_by_stage': list(opportunities)
    }


def generate_lead_conversion_report(start_date=None, end_date=None):
    if not end_date:
        end_date = timezone.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    leads_by_status = Lead.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('status').annotate(count=Count('id'))
    
    leads_by_source = Lead.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('source').annotate(count=Count('id'))
    
    return {
        'period': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'leads_by_status': list(leads_by_status),
        'leads_by_source': list(leads_by_source)
    }


def generate_communication_report(start_date=None, end_date=None):
    if not end_date:
        end_date = timezone.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    messages_by_source = InboxMessage.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('source').annotate(count=Count('id'))
    
    messages_by_status = InboxMessage.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('status').annotate(count=Count('id'))
    
    total_messages = InboxMessage.objects.filter(
        created_at__range=[start_date, end_date]
    ).count()
    
    responded_messages = InboxMessage.objects.filter(
        created_at__range=[start_date, end_date],
        status='respondido'
    ).count()
    
    return {
        'period': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'total_messages': total_messages,
        'responded_messages': responded_messages,
        'response_rate': round((responded_messages / total_messages * 100) if total_messages > 0 else 0, 2),
        'messages_by_source': list(messages_by_source),
        'messages_by_status': list(messages_by_status)
    }


def generate_quote_analytics_report(start_date=None, end_date=None):
    if not end_date:
        end_date = timezone.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    quotes_by_status = Quote.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('status').annotate(count=Count('id'))
    
    quotes_by_incoterm = Quote.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('incoterm').annotate(count=Count('id'))
    
    quotes_by_cargo_type = Quote.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('cargo_type').annotate(count=Count('id'))
    
    avg_profit_margin = Quote.objects.filter(
        created_at__range=[start_date, end_date]
    ).aggregate(avg=Avg('profit_margin'))['avg'] or 0
    
    submissions_by_status = QuoteSubmission.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('status').annotate(count=Count('id'))
    
    submissions_by_transport = QuoteSubmission.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('transport_type').annotate(count=Count('id'))
    
    total_submission_value = QuoteSubmission.objects.filter(
        created_at__range=[start_date, end_date],
        final_price__isnull=False
    ).aggregate(total=Sum('final_price'))['total'] or 0
    
    return {
        'period': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'quotes_by_status': list(quotes_by_status),
        'quotes_by_incoterm': list(quotes_by_incoterm),
        'quotes_by_cargo_type': list(quotes_by_cargo_type),
        'average_profit_margin': float(avg_profit_margin),
        'quote_submissions': {
            'total': QuoteSubmission.objects.filter(created_at__range=[start_date, end_date]).count(),
            'by_status': list(submissions_by_status),
            'by_transport_type': list(submissions_by_transport),
            'total_value': float(total_submission_value)
        }
    }


def generate_quote_submissions_report(start_date=None, end_date=None):
    if not end_date:
        end_date = timezone.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    submissions = QuoteSubmission.objects.filter(
        created_at__range=[start_date, end_date]
    ).values_list(
        'id', 'company_name', 'contact_name', 'contact_email',
        'origin', 'destination', 'transport_type', 'status',
        'cost_rate', 'profit_markup', 'final_price', 'created_at'
    )
    
    return {
        'period': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'total_submissions': QuoteSubmission.objects.filter(created_at__range=[start_date, end_date]).count(),
        'submissions': [
            {
                'id': s[0],
                'empresa': s[1],
                'contacto': s[2],
                'email': s[3],
                'origen': s[4],
                'destino': s[5],
                'transporte': s[6],
                'estado': s[7],
                'costo': float(s[8]) if s[8] else 0,
                'margen': float(s[9]) if s[9] else 0,
                'precio_final': float(s[10]) if s[10] else 0,
                'fecha': s[11].strftime('%Y-%m-%d %H:%M')
            } for s in submissions
        ]
    }


def export_report_to_excel(report_data, report_type):
    wb = Workbook()
    ws = wb.active
    ws.title = report_type
    
    ws['A1'] = f'Reporte: {report_type}'
    ws['A1'].font = Font(bold=True, size=14)
    ws.merge_cells('A1:D1')
    
    row = 3
    for key, value in report_data.items():
        ws[f'A{row}'] = str(key)
        ws[f'B{row}'] = str(value)
        row += 1
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def export_report_to_pdf(report_data, report_type):
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title = Paragraph(f'<b>Reporte: {report_type}</b>', styles['Title'])
    elements.append(title)
    
    data = [['Campo', 'Valor']]
    for key, value in report_data.items():
        data.append([str(key), str(value)])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    doc.build(elements)
    output.seek(0)
    return output
