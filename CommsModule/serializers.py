from rest_framework import serializers
from .models import InboxMessage


class InboxMessageSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.company_name', read_only=True)
    
    class Meta:
        model = InboxMessage
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'read_at', 'responded_at')
