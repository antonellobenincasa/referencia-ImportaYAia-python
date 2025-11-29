from rest_framework import serializers
from .models import Lead, Opportunity, Quote, TaskReminder, Meeting, APIKey, BulkLeadImport
from decimal import Decimal


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


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
