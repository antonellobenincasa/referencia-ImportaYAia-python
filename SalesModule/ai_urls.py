"""
URL patterns for AI endpoints
"""
from django.urls import path
from .ai_views import AduanaChatView, ClassifyProductView

urlpatterns = [
    path('aduana-chat/', AduanaChatView.as_view(), name='aduana-chat'),
    path('classify-product/', ClassifyProductView.as_view(), name='classify-product'),
]
