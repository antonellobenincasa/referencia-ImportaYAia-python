from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InboxMessageViewSet, whatsapp_inbound_webhook

router = DefaultRouter()
router.register(r'messages', InboxMessageViewSet, basename='inbox-message')

urlpatterns = [
    path('', include(router.urls)),
    path('whatsapp/inbound/', whatsapp_inbound_webhook, name='whatsapp-inbound'),
]
