from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InboxMessageViewSet, ChannelConnectionViewSet, whatsapp_inbound_webhook

router = DefaultRouter()
router.register(r'messages', InboxMessageViewSet, basename='message')
router.register(r'channels', ChannelConnectionViewSet, basename='channel')

urlpatterns = [
    path('', include(router.urls)),
    path('webhooks/whatsapp/', whatsapp_inbound_webhook, name='whatsapp-webhook'),
]
