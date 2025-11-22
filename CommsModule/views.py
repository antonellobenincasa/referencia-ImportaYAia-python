from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import InboxMessage
from .serializers import InboxMessageSerializer
from SalesModule.models import Lead


class InboxMessageViewSet(viewsets.ModelViewSet):
    queryset = InboxMessage.objects.all()
    serializer_class = InboxMessageSerializer
    filterset_fields = ['source', 'direction', 'status', 'lead']
    search_fields = ['sender_name', 'message_body']


@api_view(['POST'])
def whatsapp_inbound_webhook(request):
    data = request.data
    
    phone_number = data.get('from')
    message_text = data.get('message')
    message_id = data.get('message_id', '')
    sender_name = data.get('name', '')
    
    if not phone_number or not message_text:
        return Response({'error': 'Campos requeridos: from, message'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        lead = Lead.objects.get(whatsapp=phone_number)
    except Lead.DoesNotExist:
        lead = Lead.objects.create(
            company_name=sender_name or f'Nuevo Lead {phone_number}',
            contact_name=sender_name or 'Desconocido',
            email=f'{phone_number}@whatsapp.temp',
            whatsapp=phone_number,
            source='whatsapp',
            status='nuevo'
        )
    
    inbox_message = InboxMessage.objects.create(
        lead=lead,
        source='whatsapp',
        direction='entrante',
        sender_name=sender_name,
        sender_identifier=phone_number,
        message_body=message_text,
        external_message_id=message_id,
        status='nuevo'
    )
    
    return Response({
        'message': 'Mensaje de WhatsApp recibido y registrado',
        'inbox_message_id': inbox_message.id,
        'lead_id': lead.id
    }, status=status.HTTP_201_CREATED)
