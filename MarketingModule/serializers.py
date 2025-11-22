from rest_framework import serializers
from .models import EmailTemplate, EmailCampaign, SocialMediaPost


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class EmailCampaignSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = EmailCampaign
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'started_at', 'completed_at', 'total_recipients', 'emails_sent', 'emails_failed')


class SocialMediaPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaPost
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'published_at', 'external_post_id', 'external_post_url')
