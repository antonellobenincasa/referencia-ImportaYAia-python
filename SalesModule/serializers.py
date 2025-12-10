from rest_framework import serializers
from .models import (
    Lead, Opportunity, Quote, TaskReminder, Meeting, APIKey, BulkLeadImport,
    QuoteSubmission, CostRate, LeadCotizacion,
    FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate, CustomsBrokerageRate
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
    
    class Meta:
        model = QuoteSubmission
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'processed_at', 'validation_errors', 'cost_rate', 'final_price', 'submission_number')
    
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
    
    class Meta:
        model = QuoteSubmission
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'processed_at')


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
