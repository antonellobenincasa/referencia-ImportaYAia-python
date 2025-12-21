from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeadViewSet, OpportunityViewSet, QuoteViewSet, TaskReminderViewSet, MeetingViewSet, 
    ReportsAPIView, DashboardAPIView, APIKeyViewSet, BulkLeadImportViewSet, QuoteSubmissionViewSet, QuoteSubmissionDocumentViewSet, CostRateViewSet,
    LeadCotizacionViewSet,
    FreightRateViewSet, InsuranceRateViewSet, CustomsDutyRateViewSet,
    InlandTransportQuoteRateViewSet, CustomsBrokerageRateViewSet,
    ShipmentViewSet, PreLiquidationViewSet, AIAssistantAPIView,
    LogisticsProviderViewSet, ProviderRateViewSet,
    AirportViewSet, AirportRegionViewSet,
    ContainerViewSet, ManualQuoteRequestViewSet, PortViewSet,
    ShippingInstructionViewSet, CargoTrackingViewSet, ShipmentMilestoneViewSet,
    TrackingTemplateViewSet,
    FreightForwarderConfigViewSet, PendingFFQuotesViewSet
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
router.register(r'quote-submission-documents', QuoteSubmissionDocumentViewSet, basename='quote-submission-document')
router.register(r'cost-rates', CostRateViewSet, basename='cost-rate')
router.register(r'lead-cotizaciones', LeadCotizacionViewSet, basename='lead-cotizacion')

router.register(r'rates/freight', FreightRateViewSet, basename='freight-rate')
router.register(r'rates/insurance', InsuranceRateViewSet, basename='insurance-rate')
router.register(r'rates/customs-duty', CustomsDutyRateViewSet, basename='customs-duty-rate')
router.register(r'rates/inland-transport', InlandTransportQuoteRateViewSet, basename='inland-transport-rate')
router.register(r'rates/brokerage', CustomsBrokerageRateViewSet, basename='brokerage-rate')

router.register(r'shipments', ShipmentViewSet, basename='shipment')
router.register(r'pre-liquidations', PreLiquidationViewSet, basename='pre-liquidation')

router.register(r'logistics-providers', LogisticsProviderViewSet, basename='logistics-provider')
router.register(r'provider-rates', ProviderRateViewSet, basename='provider-rate')

router.register(r'airports', AirportViewSet, basename='airport')
router.register(r'airport-regions', AirportRegionViewSet, basename='airport-region')

router.register(r'containers', ContainerViewSet, basename='container')
router.register(r'manual-quote-requests', ManualQuoteRequestViewSet, basename='manual-quote-request')
router.register(r'ports', PortViewSet, basename='port')
router.register(r'shipping-instructions', ShippingInstructionViewSet, basename='shipping-instruction')
router.register(r'cargo-tracking', CargoTrackingViewSet, basename='cargo-tracking')
router.register(r'shipment-milestones', ShipmentMilestoneViewSet, basename='shipment-milestone')
router.register(r'tracking-templates', TrackingTemplateViewSet, basename='tracking-template')

router.register(r'admin/ff-config', FreightForwarderConfigViewSet, basename='ff-config')
router.register(r'admin/pending-ff-quotes', PendingFFQuotesViewSet, basename='pending-ff-quotes')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard'),
    path('reports/', ReportsAPIView.as_view(), name='reports'),
    path('ai-assistant/', AIAssistantAPIView.as_view(), name='ai-assistant'),
]
