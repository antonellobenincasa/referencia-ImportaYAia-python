from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, EmailCampaignViewSet, SocialMediaPostViewSet

router = DefaultRouter()
router.register(r'email-templates', EmailTemplateViewSet, basename='email-template')
router.register(r'email-campaigns', EmailCampaignViewSet, basename='email-campaign')
router.register(r'social-posts', SocialMediaPostViewSet, basename='social-post')

urlpatterns = [
    path('', include(router.urls)),
]
