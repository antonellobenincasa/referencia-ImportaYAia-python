from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmailTemplateViewSet, EmailCampaignViewSet, SocialMediaPostViewSet,
    LandingPageViewSet, LandingPageSubmissionViewSet
)

router = DefaultRouter()
router.register(r'email-templates', EmailTemplateViewSet, basename='email-template')
router.register(r'email-campaigns', EmailCampaignViewSet, basename='email-campaign')
router.register(r'social-posts', SocialMediaPostViewSet, basename='social-post')
router.register(r'landing-pages', LandingPageViewSet, basename='landing-page')
router.register(r'landing-submissions', LandingPageSubmissionViewSet, basename='landing-submission')

urlpatterns = [
    path('', include(router.urls)),
]
