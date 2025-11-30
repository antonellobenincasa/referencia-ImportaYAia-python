from rest_framework import serializers
from .models import InboxMessage, ChannelConnection

class InboxMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = InboxMessage
        fields = '__all__'

class ChannelConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelConnection
        fields = ['id', 'channel_type', 'is_active', 'connection_method', 'webhook_url', 'configuration', 'connected_at']
        read_only_fields = ['id', 'connected_at']
    
    def create(self, validated_data):
        # Prevent duplicate active connections for same channel
        channel_type = validated_data.get('channel_type')
        if ChannelConnection.objects.filter(channel_type=channel_type, is_active=True).exists():
            raise serializers.ValidationError(f"Ya existe una conexión activa para {channel_type}")
        return super().create(validated_data)
