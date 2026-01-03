from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView

# Importamos TODOS los modelos y serializadores nuevos
from .models import (
    Lead, Opportunity, Quote, TaskReminder, Meeting, APIKey, BulkLeadImport,
    QuoteSubmission, QuoteSubmissionDocument, CostRate, LeadCotizacion, QuoteScenario, QuoteLineItem,
    FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate, CustomsBrokerageRate,
    Shipment, ShipmentTracking, PreLiquidation, PreLiquidationDocument, Port,
    ShippingInstruction, ShippingInstructionDocument, ShipmentMilestone,
    FreightForwarderConfig, FFQuoteCost, InlandFCLTariff, InlandSecurityTariff,
    LogisticsProvider, ProviderRate, Airport, AirportRegion, Container, 
    ManualQuoteRequest, TrackingTemplate
)

# --- REEMPLAZA EL BLOQUE DE 'from .serializers import' POR ESTO ---
from .serializers import (
    LeadSerializer, OpportunitySerializer, QuoteSerializer, TaskReminderSerializer,
    MeetingSerializer, APIKeySerializer, BulkLeadImportSerializer,
    QuoteSubmissionSerializer, QuoteSubmissionDetailSerializer, CostRateSerializer,
    LeadCotizacionSerializer, QuoteScenarioSerializer, QuoteLineItemSerializer,
    FreightRateSerializer, InsuranceRateSerializer, CustomsDutyRateSerializer,
    InlandTransportQuoteRateSerializer, CustomsBrokerageRateSerializer,
    ShipmentSerializer, ShipmentTrackingSerializer, ShipmentDetailSerializer,
    PreLiquidationSerializer, PreLiquidationDocumentSerializer,
    PortSerializer, ShippingInstructionSerializer, ShippingInstructionDocumentSerializer,
    ShipmentMilestoneSerializer, FreightForwarderConfigSerializer, FFQuoteCostSerializer,
    InlandFCLTariffSerializer, InlandSecurityTariffSerializer,
    LogisticsProviderSerializer, ProviderRateSerializer, AirportSerializer,
    ContainerSerializer, ManualQuoteRequestSerializer, TrackingTemplateSerializer,
    AirportRegionSerializer  # <--- ¡ESTE ERA EL QUE FALTABA!
)

# --- VISTAS ESPECIALES PARA LA APP (Gate y Auth) ---

class UserProfileView(APIView):
    """
    Endpoint CRÍTICO: Dice a la App si el usuario tiene RUC aprobado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "full_name": f"{user.first_name} {user.last_name}".strip(),
            "company_name": "", 
            "ruc": "",          
            "ruc_status": "none"
        }

        if hasattr(user, 'company_name') and user.company_name:
            data['company_name'] = user.company_name

        try:
            from accounts.models import CustomerRUC
            ruc_record = CustomerRUC.objects.filter(user=user).order_by('-created_at').first()
            if ruc_record:
                data['ruc'] = ruc_record.ruc
                data['ruc_status'] = ruc_record.status
                if ruc_record.company_name:
                    data['company_name'] = ruc_record.company_name
        except Exception as e:
            print(f"Error checking RUC: {e}")

        return Response(data)

class AdminRucApprovalView(APIView):
    """Para que el Master Admin apruebe RUCs manualmente"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from accounts.models import CustomerRUC
        pending = CustomerRUC.objects.filter(status='pending').select_related('user')
        data = [{"id": r.id, "user": r.user.email, "ruc": r.ruc, "company": r.company_name} for r in pending]
        return Response(data)

    def post(self, request):
        from accounts.models import CustomerRUC
        ruc_id = request.data.get('ruc_id')
        action = request.data.get('action')
        try:
            ruc = CustomerRUC.objects.get(id=ruc_id)
            if action == 'approve':
                ruc.status = 'approved'
            elif action == 'reject':
                ruc.status = 'rejected'
            ruc.save()
            return Response({"status": "success"})
        except Exception:
            return Response({"error": "RUC no encontrado"}, status=404)

# --- VIEWSETS STANDARD (CRUD para todos los modelos) ---

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

class QuoteViewSet(viewsets.ModelViewSet): # Cotizaciones Internas CRM
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]

class QuoteSubmissionViewSet(viewsets.ModelViewSet): # Cotizaciones de la App
    queryset = QuoteSubmission.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['retrieve', 'update']:
            return QuoteSubmissionDetailSerializer
        return QuoteSubmissionSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class BulkLeadImportViewSet(viewsets.ModelViewSet): # <--- EL QUE FALTABA
    queryset = BulkLeadImport.objects.all()
    serializer_class = BulkLeadImportSerializer
    permission_classes = [IsAuthenticated]

class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ShipmentDetailSerializer
        return ShipmentSerializer

class TrackingTemplateViewSet(viewsets.ModelViewSet):
    queryset = TrackingTemplate.objects.all()
    serializer_class = TrackingTemplateSerializer # Asegúrate de crear este serializer abajo si falta
    permission_classes = [IsAuthenticated]

# --- TARIFARIOS Y CATALOGOS ---

class FreightRateViewSet(viewsets.ModelViewSet):
    queryset = FreightRate.objects.all()
    serializer_class = FreightRateSerializer

class LogisticsProviderViewSet(viewsets.ModelViewSet):
    queryset = LogisticsProvider.objects.all()
    serializer_class = LogisticsProviderSerializer

from rest_framework import filters as drf_filters

class PortViewSet(viewsets.ModelViewSet):
    queryset = Port.objects.filter(is_active=True)
    serializer_class = PortSerializer
    filter_backends = [drf_filters.SearchFilter]
    search_fields = ['name', 'un_locode', 'country', 'region']

class AirportViewSet(viewsets.ModelViewSet):
    queryset = Airport.objects.filter(is_active=True)
    serializer_class = AirportSerializer
    filter_backends = [drf_filters.SearchFilter]
    search_fields = ['name', 'iata_code', 'country', 'ciudad_exacta']

class ContainerViewSet(viewsets.ModelViewSet):
    queryset = Container.objects.all()
    serializer_class = ContainerSerializer

# --- OTROS VIEWSETS NECESARIOS ---
# Agregamos viewsets simples para el resto de modelos para evitar errores de URL

class TaskReminderViewSet(viewsets.ModelViewSet):
    queryset = TaskReminder.objects.all()
    serializer_class = TaskReminderSerializer

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer

class APIKeyViewSet(viewsets.ModelViewSet):
    queryset = APIKey.objects.all()
    serializer_class = APIKeySerializer

class CostRateViewSet(viewsets.ModelViewSet):
    queryset = CostRate.objects.all()
    serializer_class = CostRateSerializer

class LeadCotizacionViewSet(viewsets.ModelViewSet):
    queryset = LeadCotizacion.objects.all()
    serializer_class = LeadCotizacionSerializer

class InsuranceRateViewSet(viewsets.ModelViewSet):
    queryset = InsuranceRate.objects.all()
    serializer_class = InsuranceRateSerializer

class CustomsDutyRateViewSet(viewsets.ModelViewSet):
    queryset = CustomsDutyRate.objects.all()
    serializer_class = CustomsDutyRateSerializer

class InlandTransportQuoteRateViewSet(viewsets.ModelViewSet):
    queryset = InlandTransportQuoteRate.objects.all()
    serializer_class = InlandTransportQuoteRateSerializer

class CustomsBrokerageRateViewSet(viewsets.ModelViewSet):
    queryset = CustomsBrokerageRate.objects.all()
    serializer_class = CustomsBrokerageRateSerializer

class ShipmentTrackingViewSet(viewsets.ModelViewSet):
    queryset = ShipmentTracking.objects.all()
    serializer_class = ShipmentTrackingSerializer

class PreLiquidationViewSet(viewsets.ModelViewSet):
    queryset = PreLiquidation.objects.all()
    serializer_class = PreLiquidationSerializer

    # --- PEGA ESTO AL FINAL DE SalesModule/views.py ---

class ShippingInstructionViewSet(viewsets.ModelViewSet):
    queryset = ShippingInstruction.objects.all()
    serializer_class = ShippingInstructionSerializer
    permission_classes = [IsAuthenticated]

class FreightForwarderConfigViewSet(viewsets.ModelViewSet):
    queryset = FreightForwarderConfig.objects.all()
    serializer_class = FreightForwarderConfigSerializer
    permission_classes = [IsAuthenticated]

class FFQuoteCostViewSet(viewsets.ModelViewSet):
    queryset = FFQuoteCost.objects.all()
    serializer_class = FFQuoteCostSerializer
    permission_classes = [IsAuthenticated]

class InlandFCLTariffViewSet(viewsets.ModelViewSet):
    queryset = InlandFCLTariff.objects.all()
    serializer_class = InlandFCLTariffSerializer
    permission_classes = [IsAuthenticated]

class InlandSecurityTariffViewSet(viewsets.ModelViewSet):
    queryset = InlandSecurityTariff.objects.all()
    serializer_class = InlandSecurityTariffSerializer
    permission_classes = [IsAuthenticated]

class ProviderRateViewSet(viewsets.ModelViewSet):
    queryset = ProviderRate.objects.all()
    serializer_class = ProviderRateSerializer
    permission_classes = [IsAuthenticated]

class AirportRegionViewSet(viewsets.ModelViewSet):
    queryset = AirportRegion.objects.all()
    serializer_class = AirportRegionSerializer
    permission_classes = [IsAuthenticated]

class ManualQuoteRequestViewSet(viewsets.ModelViewSet):
    queryset = ManualQuoteRequest.objects.all()
    serializer_class = ManualQuoteRequestSerializer
    permission_classes = [IsAuthenticated]

class PortViewSet(viewsets.ModelViewSet):
    queryset = Port.objects.all()
    serializer_class = PortSerializer
    permission_classes = [IsAuthenticated]

class LogisticsProviderViewSet(viewsets.ModelViewSet):
    queryset = LogisticsProvider.objects.all()
    serializer_class = LogisticsProviderSerializer
    permission_classes = [IsAuthenticated]

class AirportViewSet(viewsets.ModelViewSet):
    queryset = Airport.objects.all()
    serializer_class = AirportSerializer
    permission_classes = [IsAuthenticated]

class ContainerViewSet(viewsets.ModelViewSet):
    queryset = Container.objects.all()
    serializer_class = ContainerSerializer
    permission_classes = [IsAuthenticated]