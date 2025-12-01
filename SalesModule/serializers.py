from rest_framework import serializers
from .models import Lead, Opportunity, Quote, TaskReminder, Meeting, APIKey, BulkLeadImport, QuoteSubmission, CostRate
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
        read_only_fields = ('created_at', 'updated_at', 'processed_at', 'status', 'validation_errors', 'cost_rate', 'final_price')
    
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
        
        quote_submission.save()
        return quote_submission


class QuoteSubmissionDetailSerializer(serializers.ModelSerializer):
    lead_company = serializers.CharField(source='lead.company_name', read_only=True, allow_null=True)
    
    class Meta:
        model = QuoteSubmission
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'processed_at')
