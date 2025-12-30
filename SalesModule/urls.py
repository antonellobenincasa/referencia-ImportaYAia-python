from django.urls import path, include
# 1. Agrega estas importaciones de rest_framework_simplejwt
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# ... tus otras importaciones ...
from rest_framework.routers import DefaultRouter
from .views import (
    UserProfileView, AdminRucApprovalView,
    LeadViewSet, OpportunityViewSet, QuoteViewSet, TaskReminderViewSet,
    MeetingViewSet, APIKeyViewSet, BulkLeadImportViewSet,
    QuoteSubmissionViewSet, CostRateViewSet, LeadCotizacionViewSet,
    FreightRateViewSet, InsuranceRateViewSet, CustomsDutyRateViewSet,
    InlandTransportQuoteRateViewSet, CustomsBrokerageRateViewSet,
    ShipmentViewSet, ShipmentTrackingViewSet, PreLiquidationViewSet,
    ShippingInstructionViewSet, FreightForwarderConfigViewSet, FFQuoteCostViewSet,
    InlandFCLTariffViewSet, InlandSecurityTariffViewSet,
    LogisticsProviderViewSet, ProviderRateViewSet, AirportViewSet,
    AirportRegionViewSet, ContainerViewSet, ManualQuoteRequestViewSet,
    TrackingTemplateViewSet, PortViewSet
)

router = DefaultRouter()

# CRM
router.register(r'leads', LeadViewSet)
router.register(r'opportunities', OpportunityViewSet)
router.register(r'quotes-internal', QuoteViewSet) # Cotizaciones CRM interno
router.register(r'tasks', TaskReminderViewSet)
router.register(r'meetings', MeetingViewSet)
router.register(r'api-keys', APIKeyViewSet)
router.register(r'bulk-imports', BulkLeadImportViewSet)

# APP & COTIZADOR
router.register(r'submissions', QuoteSubmissionViewSet) # Endpoint principal App
router.register(r'cost-rates', CostRateViewSet)
router.register(r'lead-cotizaciones', LeadCotizacionViewSet)
router.register(r'manual-quote-requests', ManualQuoteRequestViewSet)

# TARIFARIOS & DATA MAESTRA
router.register(r'freight-rates', FreightRateViewSet)
router.register(r'insurance-rates', InsuranceRateViewSet)
router.register(r'customs-duty-rates', CustomsDutyRateViewSet)
router.register(r'inland-transport-rates', InlandTransportQuoteRateViewSet)
router.register(r'customs-brokerage-rates', CustomsBrokerageRateViewSet)
router.register(r'inland-fcl-tariffs', InlandFCLTariffViewSet)
router.register(r'inland-security-tariffs', InlandSecurityTariffViewSet)
router.register(r'provider-rates', ProviderRateViewSet)

# OPERACIONES & LOGISTICA
router.register(r'shipments', ShipmentViewSet)
router.register(r'tracking-events', ShipmentTrackingViewSet)
router.register(r'pre-liquidations', PreLiquidationViewSet)
router.register(r'shipping-instructions', ShippingInstructionViewSet)
router.register(r'ff-configs', FreightForwarderConfigViewSet)
router.register(r'ff-quote-costs', FFQuoteCostViewSet)
router.register(r'tracking-templates', TrackingTemplateViewSet)

# CATALOGOS
router.register(r'logistics-providers', LogisticsProviderViewSet)
router.register(r'ports', PortViewSet)
router.register(r'airports', AirportViewSet)
router.register(r'airport-regions', AirportRegionViewSet)
router.register(r'containers', ContainerViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # 2. AGREGA ESTAS LÍNEAS PARA EL LOGIN
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Endpoints especiales existentes
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('admin/approve-ruc/', AdminRucApprovalView.as_view(), name='admin-ruc-approval'),
]