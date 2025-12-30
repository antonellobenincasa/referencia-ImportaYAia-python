from rest_framework import serializers
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

# --- SERIALIZADORES BASE ---

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'

class OpportunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Opportunity
        fields = '__all__'

class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = '__all__'

class QuoteGenerateSerializer(serializers.Serializer):
    """Serializer manual para generar cotizaciones simples"""
    opportunity_id = serializers.IntegerField()
    origin = serializers.CharField()
    destination = serializers.CharField()
    incoterm = serializers.CharField() # Lo hacemos CharField simple para evitar conflictos
    cargo_type = serializers.CharField()
    base_rate = serializers.DecimalField(max_digits=12, decimal_places=2)
    profit_margin = serializers.DecimalField(max_digits=12, decimal_places=2)
    valid_until = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

class TaskReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskReminder
        fields = '__all__'

class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = '__all__'

class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = '__all__'
        read_only_fields = ('key',)

class BulkLeadImportSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkLeadImport
        fields = '__all__'

# --- COTIZACIONES APP ---

class QuoteSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteSubmission
        fields = '__all__'

class QuoteSubmissionDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteSubmissionDocument
        fields = '__all__'

class QuoteSubmissionDetailSerializer(QuoteSubmissionSerializer):
    """Serializer detallado para ver documentos anidados"""
    documents = QuoteSubmissionDocumentSerializer(many=True, read_only=True)

class CostRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostRate
        fields = '__all__'

class LeadCotizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadCotizacion
        fields = '__all__'

class LeadCotizacionInstruccionSerializer(serializers.Serializer):
    """Para recibir instrucciones de embarque desde el frontend"""
    shipper_name = serializers.CharField()
    shipper_address = serializers.CharField()
    consignee_name = serializers.CharField()
    consignee_address = serializers.CharField()
    notify_party = serializers.CharField(required=False, allow_blank=True)
    fecha_embarque_estimada = serializers.DateField(required=False)

class QuoteLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteLineItem
        fields = '__all__'

class QuoteScenarioSerializer(serializers.ModelSerializer):
    lineas = QuoteLineItemSerializer(many=True, read_only=True)
    class Meta:
        model = QuoteScenario
        fields = '__all__'

class LeadCotizacionDetailSerializer(LeadCotizacionSerializer):
    escenarios = QuoteScenarioSerializer(many=True, read_only=True)

class QuoteScenarioSelectSerializer(serializers.Serializer):
    scenario_id = serializers.IntegerField()

class GenerateScenariosSerializer(serializers.Serializer):
    cotizacion_id = serializers.IntegerField()

# --- TARIFARIOS ---

class FreightRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreightRate
        fields = '__all__'

class InsuranceRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceRate
        fields = '__all__'

class CustomsDutyRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomsDutyRate
        fields = '__all__'

class InlandTransportQuoteRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InlandTransportQuoteRate
        fields = '__all__'

class CustomsBrokerageRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomsBrokerageRate
        fields = '__all__'

class CustomsDutyCalculationSerializer(serializers.Serializer):
    cif_value_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    quantity = serializers.IntegerField(default=1)

class BrokerageFeeCalculationSerializer(serializers.Serializer):
    cif_value_usd = serializers.DecimalField(max_digits=12, decimal_places=2)

# --- OPERACIONES ---

class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = '__all__'

class ShipmentTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentTracking
        fields = '__all__'

class ShipmentDetailSerializer(ShipmentSerializer):
    tracking_events = ShipmentTrackingSerializer(many=True, read_only=True)

class ShipmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ('tracking_number', 'current_status')

class AddTrackingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentTracking
        fields = ['status', 'location', 'description', 'event_datetime']

# --- PRE-LIQUIDACIÓN ---

class PreLiquidationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreLiquidationDocument
        fields = '__all__'

class PreLiquidationSerializer(serializers.ModelSerializer):
    documents = PreLiquidationDocumentSerializer(many=True, read_only=True)
    class Meta:
        model = PreLiquidation
        fields = '__all__'

class HSCodeSuggestionSerializer(serializers.Serializer):
    product_description = serializers.CharField()

class PreLiquidationUpdateHSCodeSerializer(serializers.Serializer):
    hs_code = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)

class RequestAssistanceSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)

# --- OTROS ---

class PortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Port
        fields = '__all__'

class PortSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Port
        fields = ('id', 'name', 'country', 'un_locode')

class ShippingInstructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingInstruction
        fields = '__all__'

class ShippingInstructionDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingInstructionDocument
        fields = '__all__'

class ShippingInstructionDetailSerializer(ShippingInstructionSerializer):
    documents = ShippingInstructionDocumentSerializer(many=True, read_only=True)

class ShippingInstructionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingInstruction
        fields = '__all__'

class ShippingInstructionFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingInstruction
        fields = '__all__'

class ShipmentMilestoneSerializer(serializers.ModelSerializer):
    milestone_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ShipmentMilestone
        fields = '__all__'
        
    def get_milestone_name(self, obj):
        return obj.get_milestone_key_display()

class CargoTrackingListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingInstruction
        fields = ('id', 'ro_number', 'status', 'shipper_name', 'consignee_name', 'origin_port', 'destination_port', 'created_at')

class CargoTrackingDetailSerializer(ShippingInstructionDetailSerializer):
    milestones = ShipmentMilestoneSerializer(many=True, read_only=True)

class FreightForwarderConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreightForwarderConfig
        fields = '__all__'

class FFQuoteCostSerializer(serializers.ModelSerializer):
    class Meta:
        model = FFQuoteCost
        fields = '__all__'

class FFQuoteCostUploadSerializer(serializers.Serializer):
    freight_cost_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    origin_costs_usd = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    origin_costs_detail = serializers.JSONField(required=False)
    destination_costs_usd = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    destination_costs_detail = serializers.JSONField(required=False)
    carrier_name = serializers.CharField(required=False)
    transit_time = serializers.CharField(required=False)
    profit_margin_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    ff_reference = serializers.CharField(required=False)
    validity_date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

class PendingFFQuoteSerializer(QuoteSubmissionSerializer):
    """Serializer para mostrar cotizaciones pendientes al Admin"""
    pass

class InlandFCLTariffSerializer(serializers.ModelSerializer):
    class Meta:
        model = InlandFCLTariff
        fields = '__all__'

class InlandSecurityTariffSerializer(serializers.ModelSerializer):
    class Meta:
        model = InlandSecurityTariff
        fields = '__all__'

# --- SERIALIZADORES FALTANTES (NUEVOS) ---

class LogisticsProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogisticsProvider
        fields = '__all__'

class ProviderRateSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    class Meta:
        model = ProviderRate
        fields = '__all__'

class AirportRegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AirportRegion
        fields = '__all__'

class AirportSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    class Meta:
        model = Airport
        fields = '__all__'

class AirportSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airport
        fields = ('id', 'ciudad_exacta', 'iata_code', 'country')

class ContainerSerializer(serializers.ModelSerializer): # Si tienes un viewset para esto
    class Meta:
        model = Container
        fields = '__all__'

class ManualQuoteRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualQuoteRequest
        fields = '__all__'

class TrackingTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrackingTemplate
        fields = '__all__'

