from rest_framework import serializers
from .models import (
    Lead, Opportunity, Quote, TaskReminder, Meeting, APIKey, BulkLeadImport,
    QuoteSubmission, QuoteSubmissionDocument, CostRate, LeadCotizacion, QuoteScenario, QuoteLineItem,
    FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate, CustomsBrokerageRate,
    Shipment, ShipmentTracking, PreLiquidation, LogisticsProvider, ProviderRate,
    Airport, AirportRegion, ManualQuoteRequest, Port
)
from decimal import Decimal


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'lead_number')
    
    def validate(self, data):
        """Validar que no exista un lead duplicado con el mismo nombre y RUC"""
        company_name = data.get('company_name', '').strip()
        ruc = data.get('ruc', '').strip()
        
        if company_name and ruc:
            existing = Lead.objects.filter(
                company_name__iexact=company_name,
                ruc=ruc
            ).exclude(pk=self.instance.pk if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError({
                    'duplicate': f"⚠️ Ya existe un Lead con la empresa '{company_name}' y RUC '{ruc}'. Lead: {existing.first().lead_number}"
                })
        
        return data


class OpportunitySerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.company_name', read_only=True)
    
    class Meta:
        model = Opportunity
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class QuoteSerializer(serializers.ModelSerializer):
    opportunity_name = serializers.CharField(source='opportunity.opportunity_name', read_only=True)
    
    class Meta:
        model = Quote
        fields = '__all__'
        read_only_fields = ('quote_number', 'created_at', 'updated_at', 'sent_at', 'viewed_at')


class QuoteGenerateSerializer(serializers.Serializer):
    opportunity_id = serializers.IntegerField()
    origin = serializers.CharField(max_length=255)
    destination = serializers.CharField(max_length=255)
    incoterm = serializers.ChoiceField(choices=Quote.INCOTERM_CHOICES)
    cargo_type = serializers.ChoiceField(choices=Quote.CARGO_TYPE_CHOICES)
    cargo_description = serializers.CharField(required=False, allow_blank=True)
    base_rate = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    profit_margin = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.00'))
    valid_until = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class TaskReminderSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.company_name', read_only=True, allow_null=True)
    quote_number = serializers.CharField(source='quote.quote_number', read_only=True, allow_null=True)
    
    class Meta:
        model = TaskReminder
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class MeetingSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.company_name', read_only=True)
    
    class Meta:
        model = Meeting
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'google_calendar_synced', 'outlook_synced')


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = ['id', 'name', 'key', 'secret', 'webhook_url', 'is_active', 'service_type', 'created_at']
        read_only_fields = ('id', 'created_at', 'key')


class BulkLeadImportSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkLeadImport
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'status', 'imported_rows', 'error_rows', 'error_details')


class CostRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostRate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class QuoteSubmissionSerializer(serializers.ModelSerializer):
    validation_errors_list = serializers.SerializerMethodField()
    ai_permit_list = serializers.SerializerMethodField()
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = QuoteSubmission
        fields = '__all__'
        read_only_fields = (
            'created_at', 'updated_at', 'processed_at', 'validation_errors', 
            'cost_rate', 'final_price', 'submission_number',
            'ai_hs_code', 'ai_hs_confidence', 'ai_category', 'ai_ad_valorem_pct',
            'ai_requires_permit', 'ai_permit_institutions', 'ai_response', 'ai_status'
        )
    
    def get_documents_count(self, obj):
        return obj.documents.count()
    
    def get_ai_permit_list(self, obj):
        """Parse AI permit institutions JSON to list"""
        if obj.ai_permit_institutions:
            import json
            try:
                return json.loads(obj.ai_permit_institutions)
            except json.JSONDecodeError:
                return []
        return []
    
    def get_validation_errors_list(self, obj):
        if obj.validation_errors:
            return obj.validation_errors.split('\n')
        return []
    
    def create(self, validated_data):
        quote_submission = QuoteSubmission(**validated_data)
        
        errors = quote_submission.validate_data()
        if errors:
            quote_submission.status = 'error_validacion'
            quote_submission.validation_errors = '\n'.join(errors)
        else:
            quote_submission.status = 'validacion_pendiente'
        
        count = QuoteSubmission.objects.count() + 1
        quote_submission.submission_number = f"QS-ICS-{str(count).zfill(6)}"
        
        quote_submission.save()
        return quote_submission


class QuoteSubmissionDetailSerializer(serializers.ModelSerializer):
    lead_company = serializers.CharField(source='lead.company_name', read_only=True, allow_null=True)
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = QuoteSubmission
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'processed_at')
    
    def get_documents(self, obj):
        return QuoteSubmissionDocumentSerializer(obj.documents.all(), many=True).data


class QuoteSubmissionDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    
    class Meta:
        model = QuoteSubmissionDocument
        fields = [
            'id', 'quote_submission', 'document_type', 'document_type_display',
            'file', 'file_name', 'file_size', 'description', 'uploaded_at'
        ]
        read_only_fields = ('id', 'uploaded_at', 'file_name', 'file_size')
    
    def create(self, validated_data):
        file = validated_data.get('file')
        if file:
            validated_data['file_name'] = file.name
            validated_data['file_size'] = file.size
        return super().create(validated_data)


class LeadCotizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadCotizacion
        fields = '__all__'
        read_only_fields = (
            'numero_cotizacion', 'lead_user', 'fecha_creacion', 'fecha_actualizacion',
            'flete_usd', 'seguro_usd', 'aduana_usd', 'transporte_interno_usd', 
            'otros_usd', 'total_usd', 'estado', 'ro_number', 'fecha_aprobacion'
        )
    
    def create(self, validated_data):
        validated_data['lead_user'] = self.context['request'].user
        
        count = LeadCotizacion.objects.count() + 1
        validated_data['numero_cotizacion'] = f"COTI-ICS-{str(count).zfill(7)}"
        
        cotizacion = LeadCotizacion.objects.create(**validated_data)
        
        cotizacion.calculate_total()
        cotizacion.estado = 'cotizado'
        cotizacion.save()
        
        return cotizacion


class LeadCotizacionInstruccionSerializer(serializers.Serializer):
    shipper_name = serializers.CharField(max_length=255)
    shipper_address = serializers.CharField()
    consignee_name = serializers.CharField(max_length=255)
    consignee_address = serializers.CharField()
    notify_party = serializers.CharField(max_length=255, required=False, allow_blank=True)
    fecha_embarque_estimada = serializers.DateField()
    notas = serializers.CharField(required=False, allow_blank=True)


class FreightRateSerializer(serializers.ModelSerializer):
    transport_mode_display = serializers.CharField(source='get_transport_mode_display', read_only=True)
    
    class Meta:
        model = FreightRate
        fields = [
            'id', 'origin_port', 'destination_port', 'transport_mode', 'transport_mode_display',
            'container_type', 'carrier_name', 'carrier_code',
            'rate_usd', 'rate_per_kg_usd', 'rate_per_cbm_usd',
            'fuel_surcharge_usd', 'security_surcharge_usd', 'other_surcharges_usd',
            'transit_time_days', 'transit_time_max_days', 'frequency',
            'valid_from', 'valid_until', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InsuranceRateSerializer(serializers.ModelSerializer):
    coverage_type_display = serializers.CharField(source='get_coverage_type_display', read_only=True)
    
    class Meta:
        model = InsuranceRate
        fields = [
            'id', 'name', 'coverage_type', 'coverage_type_display',
            'rate_percentage', 'min_premium_usd',
            'deductible_percentage', 'max_coverage_usd',
            'valid_from', 'valid_until', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('include_premium_example'):
            sample_value = Decimal('10000')
            data['example_premium'] = str(instance.calculate_premium(sample_value))
        return data


class CustomsDutyRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomsDutyRate
        fields = [
            'id', 'hs_code', 'description',
            'ad_valorem_percentage', 'iva_percentage', 'fodinfa_percentage',
            'ice_percentage', 'salvaguardia_percentage',
            'specific_duty_usd', 'specific_duty_unit',
            'requires_import_license', 'requires_phytosanitary', 'requires_inen_certification',
            'valid_from', 'valid_until', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('include_duty_example'):
            sample_cif = Decimal('1000')
            duties = instance.calculate_duties(sample_cif)
            data['example_duties'] = {k: str(v) for k, v in duties.items()}
        return data


class CustomsDutyCalculationSerializer(serializers.Serializer):
    cif_value_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    quantity = serializers.IntegerField(default=1, min_value=1)


class InlandTransportQuoteRateSerializer(serializers.ModelSerializer):
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    
    class Meta:
        model = InlandTransportQuoteRate
        fields = [
            'id', 'origin_city', 'destination_city', 
            'vehicle_type', 'vehicle_type_display',
            'rate_usd', 'rate_per_kg_usd',
            'estimated_hours', 'distance_km',
            'includes_loading', 'includes_unloading',
            'carrier_name',
            'valid_from', 'valid_until', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomsBrokerageRateSerializer(serializers.ModelSerializer):
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    
    class Meta:
        model = CustomsBrokerageRate
        fields = [
            'id', 'name', 'service_type', 'service_type_display',
            'fixed_rate_usd', 'percentage_rate', 'min_rate_usd',
            'includes_aforo', 'includes_transmision', 'includes_almacenaje',
            'valid_from', 'valid_until', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('include_fee_example'):
            sample_cif = Decimal('10000')
            data['example_fee'] = str(instance.calculate_fee(sample_cif))
        return data


class BrokerageFeeCalculationSerializer(serializers.Serializer):
    cif_value_usd = serializers.DecimalField(max_digits=12, decimal_places=2)


class QuoteLineItemSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    
    class Meta:
        model = QuoteLineItem
        fields = [
            'id', 'categoria', 'categoria_display', 'descripcion',
            'cantidad', 'precio_unitario_usd', 'subtotal_usd',
            'es_estimado', 'notas', 'created_at'
        ]
        read_only_fields = ['id', 'subtotal_usd', 'created_at']


class QuoteScenarioSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    lineas = QuoteLineItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuoteScenario
        fields = [
            'id', 'nombre', 'tipo', 'tipo_display',
            'freight_rate', 'insurance_rate', 'brokerage_rate', 'inland_transport_rate',
            'flete_usd', 'seguro_usd', 'agenciamiento_usd', 'transporte_interno_usd',
            'otros_usd', 'total_usd', 'tiempo_transito_dias', 'notas',
            'is_selected', 'lineas', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_usd', 'created_at', 'updated_at']


class LeadCotizacionDetailSerializer(serializers.ModelSerializer):
    """Serializer with nested scenarios for detailed view"""
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_carga_display = serializers.CharField(source='get_tipo_carga_display', read_only=True)
    escenarios = QuoteScenarioSerializer(many=True, read_only=True)
    lead_email = serializers.EmailField(source='lead_user.email', read_only=True)
    lead_company = serializers.CharField(source='lead_user.company_name', read_only=True)
    
    class Meta:
        model = LeadCotizacion
        fields = [
            'id', 'numero_cotizacion', 'lead_email', 'lead_company',
            'tipo_carga', 'tipo_carga_display', 'origen_pais', 'origen_ciudad',
            'destino_ciudad', 'descripcion_mercancia',
            'peso_kg', 'volumen_cbm', 'valor_mercancia_usd', 'incoterm',
            'requiere_seguro', 'requiere_transporte_interno', 'notas_adicionales',
            'flete_usd', 'seguro_usd', 'aduana_usd', 'transporte_interno_usd',
            'otros_usd', 'total_usd',
            'estado', 'estado_display', 'ro_number',
            'shipper_name', 'shipper_address', 'consignee_name', 'consignee_address',
            'notify_party', 'fecha_embarque_estimada',
            'fecha_creacion', 'fecha_actualizacion', 'fecha_aprobacion',
            'escenarios'
        ]
        read_only_fields = [
            'id', 'numero_cotizacion', 'lead_email', 'lead_company',
            'flete_usd', 'seguro_usd', 'aduana_usd', 'transporte_interno_usd',
            'otros_usd', 'total_usd', 'ro_number',
            'fecha_creacion', 'fecha_actualizacion', 'fecha_aprobacion'
        ]


class QuoteScenarioSelectSerializer(serializers.Serializer):
    """Serializer for selecting a quote scenario"""
    scenario_id = serializers.IntegerField()


class GenerateScenariosSerializer(serializers.Serializer):
    """Serializer for generating quote scenarios automatically"""
    include_air = serializers.BooleanField(default=True)
    include_sea = serializers.BooleanField(default=True)
    include_express = serializers.BooleanField(default=False)


class ShipmentTrackingSerializer(serializers.ModelSerializer):
    """Serializer for shipment tracking events"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ShipmentTracking
        fields = [
            'id', 'status', 'status_display', 'location', 'description',
            'event_datetime', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ShipmentSerializer(serializers.ModelSerializer):
    """Serializer for shipments"""
    current_status_display = serializers.CharField(source='get_current_status_display', read_only=True)
    transport_type_display = serializers.CharField(source='get_transport_type_display', read_only=True)
    cotizacion_numero = serializers.CharField(source='cotizacion.numero_cotizacion', read_only=True, allow_null=True)
    
    class Meta:
        model = Shipment
        fields = [
            'id', 'tracking_number', 'cotizacion', 'cotizacion_numero',
            'transport_type', 'transport_type_display', 'carrier_name',
            'bl_awb_number', 'container_number',
            'origin_country', 'origin_city', 'destination_country', 'destination_city',
            'description', 'weight_kg', 'packages',
            'estimated_departure', 'actual_departure',
            'estimated_arrival', 'actual_arrival',
            'estimated_delivery', 'actual_delivery',
            'current_status', 'current_status_display', 'current_location',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tracking_number', 'current_status', 'current_location', 'created_at', 'updated_at']


class ShipmentDetailSerializer(ShipmentSerializer):
    """Detailed shipment serializer with tracking events"""
    tracking_events = ShipmentTrackingSerializer(many=True, read_only=True)
    
    class Meta(ShipmentSerializer.Meta):
        fields = ShipmentSerializer.Meta.fields + ['tracking_events']


class ShipmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating shipments"""
    class Meta:
        model = Shipment
        fields = [
            'cotizacion', 'transport_type', 'carrier_name',
            'bl_awb_number', 'container_number',
            'origin_country', 'origin_city', 'destination_country', 'destination_city',
            'description', 'weight_kg', 'packages',
            'estimated_departure', 'estimated_arrival', 'estimated_delivery'
        ]


class AddTrackingEventSerializer(serializers.Serializer):
    """Serializer for adding tracking events to a shipment"""
    status = serializers.ChoiceField(choices=Shipment.STATUS_CHOICES)
    location = serializers.CharField(max_length=255)
    description = serializers.CharField()
    event_datetime = serializers.DateTimeField()


class PreLiquidationSerializer(serializers.ModelSerializer):
    """Serializer for pre-liquidation"""
    cotizacion_numero = serializers.CharField(source='cotizacion.numero_cotizacion', read_only=True)
    permit_info = serializers.SerializerMethodField()
    
    class Meta:
        model = PreLiquidation
        fields = [
            'id', 'cotizacion', 'cotizacion_numero',
            'product_description', 'suggested_hs_code', 'confirmed_hs_code',
            'hs_code_confidence', 'ai_reasoning',
            'fob_value_usd', 'freight_usd', 'insurance_usd', 'cif_value_usd',
            'ad_valorem_usd', 'fodinfa_usd', 'ice_usd', 'salvaguardia_usd',
            'iva_usd', 'total_tributos_usd',
            'requires_permit', 'permit_info', 'special_taxes', 'ai_status',
            'is_confirmed', 'confirmed_by', 'confirmed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'cotizacion_numero', 'suggested_hs_code', 'hs_code_confidence', 'ai_reasoning',
            'cif_value_usd', 'ad_valorem_usd', 'fodinfa_usd', 'ice_usd',
            'salvaguardia_usd', 'iva_usd', 'total_tributos_usd',
            'requires_permit', 'permit_info', 'special_taxes', 'ai_status',
            'confirmed_by', 'confirmed_at', 'created_at', 'updated_at'
        ]
    
    def get_permit_info(self, obj):
        if obj.requires_permit and obj.permit_institucion:
            return {
                'institucion': obj.permit_institucion,
                'permiso': obj.permit_tipo,
                'descripcion': obj.permit_descripcion,
                'tramite_previo': obj.permit_tramite_previo,
                'tiempo_estimado': obj.permit_tiempo_estimado
            }
        return None


class HSCodeSuggestionSerializer(serializers.Serializer):
    """Serializer for AI HS code suggestion request"""
    product_description = serializers.CharField()
    origin_country = serializers.CharField(required=False, allow_blank=True)


class HSCodeSuggestionResponseSerializer(serializers.Serializer):
    """Serializer for AI HS code suggestion response"""
    suggested_hs_code = serializers.CharField()
    confidence = serializers.DecimalField(max_digits=5, decimal_places=2)
    reasoning = serializers.CharField()
    description = serializers.CharField()
    ad_valorem_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)


class ShipmentStatusCountSerializer(serializers.Serializer):
    """Serializer for shipment status counts"""
    status = serializers.CharField()
    status_display = serializers.CharField()
    count = serializers.IntegerField()


class LogisticsProviderSerializer(serializers.ModelSerializer):
    """Serializer for logistics providers (navieras, consolidadores, aerolíneas)"""
    transport_type_display = serializers.CharField(source='get_transport_type_display', read_only=True)
    rates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LogisticsProvider
        fields = [
            'id', 'name', 'code', 'transport_type', 'transport_type_display',
            'contact_name', 'contact_email', 'contact_phone', 'website', 'notes',
            'priority', 'is_active', 'rates_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')
    
    def get_rates_count(self, obj):
        return obj.rates.filter(is_active=True).count()


class ProviderRateSerializer(serializers.ModelSerializer):
    """Serializer for provider rates"""
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    provider_code = serializers.CharField(source='provider.code', read_only=True)
    transport_type = serializers.CharField(source='provider.transport_type', read_only=True)
    container_type_display = serializers.CharField(source='get_container_type_display', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = ProviderRate
        fields = [
            'id', 'provider', 'provider_name', 'provider_code', 'transport_type',
            'origin_port', 'origin_country', 'destination',
            'container_type', 'container_type_display',
            'rate_usd', 'unit', 'unit_display',
            'transit_days_min', 'transit_days_max', 'free_days',
            'thc_origin_usd', 'thc_destination_usd',
            'valid_from', 'valid_to', 'is_valid',
            'notes', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')
    
    def get_is_valid(self, obj):
        return obj.is_valid_today()
    
    def validate(self, data):
        provider = data.get('provider') or (self.instance.provider if self.instance else None)
        destination = data.get('destination')
        container_type = data.get('container_type')
        
        if provider and destination:
            if provider.transport_type in ['FCL', 'LCL']:
                if destination not in ['GYE', 'PSJ']:
                    raise serializers.ValidationError({
                        'destination': 'Para transporte marítimo, el destino debe ser GYE o PSJ.'
                    })
            elif provider.transport_type == 'AEREO':
                if destination not in ['GYE', 'UIO']:
                    raise serializers.ValidationError({
                        'destination': 'Para transporte aéreo, el destino debe ser GYE o UIO.'
                    })
        
        if provider and provider.transport_type == 'FCL' and not container_type:
            raise serializers.ValidationError({
                'container_type': 'El tipo de contenedor es requerido para FCL.'
            })
        
        return data


class ProviderRateListSerializer(serializers.Serializer):
    """Lightweight serializer for rate listings"""
    id = serializers.IntegerField()
    provider_name = serializers.CharField()
    provider_code = serializers.CharField()
    origin_port = serializers.CharField()
    destination = serializers.CharField()
    container_type = serializers.CharField(allow_blank=True)
    rate_usd = serializers.DecimalField(max_digits=10, decimal_places=2)
    transit_days = serializers.CharField()
    is_valid = serializers.BooleanField()


class AirportRegionSerializer(serializers.ModelSerializer):
    """Serializer for airport regions"""
    airport_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AirportRegion
        fields = ['id', 'code', 'name', 'display_order', 'is_active', 'airport_count']
    
    def get_airport_count(self, obj):
        return obj.airports.filter(is_active=True).count()


class AirportSerializer(serializers.ModelSerializer):
    """Full airport serializer"""
    region_display = serializers.CharField(source='region.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Airport
        fields = [
            'id', 'region', 'region_display', 'region_name', 'country',
            'ciudad_exacta', 'name', 'iata_code', 'icao_code',
            'latitude', 'longitude', 'timezone',
            'is_major_hub', 'is_cargo_capable', 'is_active', 'notes'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AirportSearchSerializer(serializers.ModelSerializer):
    """Lightweight serializer for airport search results (user-facing)"""
    label = serializers.SerializerMethodField()
    value = serializers.CharField(source='iata_code')
    
    class Meta:
        model = Airport
        fields = ['id', 'ciudad_exacta', 'iata_code', 'name', 'country', 'region_name', 'label', 'value']
    
    def get_label(self, obj):
        return f"{obj.ciudad_exacta} ({obj.iata_code}) - {obj.country}"


class AirportAutocompleteSerializer(serializers.Serializer):
    """Serializer for autocomplete dropdown results"""
    id = serializers.IntegerField()
    ciudad_exacta = serializers.CharField()
    iata_code = serializers.CharField()
    name = serializers.CharField()
    country = serializers.CharField()
    display_text = serializers.SerializerMethodField()
    
    def get_display_text(self, obj):
        return f"{obj.ciudad_exacta} ({obj.iata_code})"


class ManualQuoteRequestSerializer(serializers.ModelSerializer):
    """Serializer for manual quote requests (special containers)"""
    container_summary = serializers.SerializerMethodField()
    eta_response = serializers.SerializerMethodField()
    days_pending = serializers.IntegerField(read_only=True)
    is_urgent = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ManualQuoteRequest
        fields = '__all__'
        read_only_fields = (
            'request_number', 'created_at', 'updated_at',
            'assigned_at', 'quoted_at', 'sent_at',
            'cost_total_usd', 'final_price_usd'
        )
    
    def get_container_summary(self, obj):
        return obj.get_container_summary()
    
    def get_eta_response(self, obj):
        return obj.calculate_eta_response()


class PortSerializer(serializers.ModelSerializer):
    """Serializer for world ports"""
    class Meta:
        model = Port
        fields = ['id', 'un_locode', 'name', 'country', 'region', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ('created_at', 'updated_at')


class PortSearchSerializer(serializers.ModelSerializer):
    """Simplified serializer for port search/autocomplete"""
    label = serializers.SerializerMethodField()
    value = serializers.CharField(source='un_locode')
    
    class Meta:
        model = Port
        fields = ['id', 'un_locode', 'name', 'country', 'region', 'label', 'value']
    
    def get_label(self, obj):
        return f"{obj.name} ({obj.un_locode}) - {obj.country}"


from .models import FreightRateFCL, ProfitMarginConfig, LocalDestinationCost


class FreightRateFCLSerializer(serializers.ModelSerializer):
    """Serializer for unified freight rates (FCL, LCL, AEREO)"""
    class Meta:
        model = FreightRateFCL
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class FreightRateFCLListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing freight rates"""
    route = serializers.SerializerMethodField()
    
    class Meta:
        model = FreightRateFCL
        fields = [
            'id', 'transport_type', 'pol_name', 'pod_name', 'carrier_name',
            'cost_20gp', 'cost_40gp', 'cost_40hc', 'cost_lcl',
            'cost_45', 'cost_100', 'cost_300', 'cost_500', 'cost_1000',
            'validity_date', 'transit_time', 'currency', 'is_active', 'route'
        ]
    
    def get_route(self, obj):
        return f"{obj.pol_name} → {obj.pod_name}"


class ProfitMarginConfigSerializer(serializers.ModelSerializer):
    """Serializer for profit margin configuration"""
    transport_type_display = serializers.CharField(source='get_transport_type_display', read_only=True)
    item_type_display = serializers.CharField(source='get_item_type_display', read_only=True)
    margin_type_display = serializers.CharField(source='get_margin_type_display', read_only=True)
    
    class Meta:
        model = ProfitMarginConfig
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class LocalDestinationCostSerializer(serializers.ModelSerializer):
    """Serializer for local destination costs"""
    transport_type_display = serializers.CharField(source='get_transport_type_display', read_only=True)
    cost_type_display = serializers.CharField(source='get_cost_type_display', read_only=True)
    port_display = serializers.CharField(source='get_port_display', read_only=True)
    container_type_display = serializers.CharField(source='get_container_type_display', read_only=True)
    
    class Meta:
        model = LocalDestinationCost
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
