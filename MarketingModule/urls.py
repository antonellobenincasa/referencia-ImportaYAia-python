from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmailTemplateViewSet, EmailCampaignViewSet, SocialMediaPostViewSet,
    LandingPageViewSet, LandingPageSubmissionViewSet, InlandTransportRateViewSet
)

router = DefaultRouter()
router.register(r'email-templates', EmailTemplateViewSet, basename='email-template')
router.register(r'email-campaigns', EmailCampaignViewSet, basename='email-campaign')
router.register(r'social-posts', SocialMediaPostViewSet, basename='social-post')
router.register(r'landing-pages', LandingPageViewSet, basename='landing-page')
router.register(r'landing-submissions', LandingPageSubmissionViewSet, basename='landing-submission')
router.register(r'inland-transport-rates', InlandTransportRateViewSet, basename='inland-transport-rate')

urlpatterns = [
    path('', include(router.urls)),
]
