from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from accounts.mixins import OwnerFilterMixin
from .models import InboxMessage, ChannelConnection
from .serializers import InboxMessageSerializer, ChannelConnectionSerializer


class InboxMessageViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = InboxMessage.objects.all()
    serializer_class = InboxMessageSerializer
    permission_classes = [IsAuthenticated]

@csrf_exempt
def whatsapp_inbound_webhook(request):
    """Mock WhatsApp webhook endpoint"""
    if request.method == 'POST':
        return JsonResponse({'status': 'received'})
    return JsonResponse({'status': 'ok'})

class ChannelConnectionViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    queryset = ChannelConnection.objects.all()
    serializer_class = ChannelConnectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        return qs.order_by('-is_active', '-connected_at')
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle channel connection on/off"""
        channel = self.get_object()
        channel.is_active = not channel.is_active
        channel.save()
        serializer = self.get_serializer(channel)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active_channels(self, request):
        """Get all active channels for the current user"""
        active = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active, many=True)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a channel connection"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
