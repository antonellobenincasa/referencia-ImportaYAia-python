from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeadViewSet, OpportunityViewSet, QuoteViewSet, TaskReminderViewSet, MeetingViewSet, 
    ReportsAPIView, APIKeyViewSet, BulkLeadImportViewSet, QuoteSubmissionViewSet, CostRateViewSet
)

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'opportunities', OpportunityViewSet, basename='opportunity')
router.register(r'quotes', QuoteViewSet, basename='quote')
router.register(r'tasks', TaskReminderViewSet, basename='task')
router.register(r'meetings', MeetingViewSet, basename='meeting')
router.register(r'api-keys', APIKeyViewSet, basename='api-key')
router.register(r'bulk-import', BulkLeadImportViewSet, basename='bulk-import')
router.register(r'quote-submissions', QuoteSubmissionViewSet, basename='quote-submission')
router.register(r'cost-rates', CostRateViewSet, basename='cost-rate')

urlpatterns = [
    path('', include(router.urls)),
    path('reports/', ReportsAPIView.as_view(), name='reports'),
]
