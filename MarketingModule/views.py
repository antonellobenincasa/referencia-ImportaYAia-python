from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import EmailTemplate, EmailCampaign, SocialMediaPost
from .serializers import EmailTemplateSerializer, EmailCampaignSerializer, SocialMediaPostSerializer
from SalesModule.models import Lead


class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'subject']


class EmailCampaignViewSet(viewsets.ModelViewSet):
    queryset = EmailCampaign.objects.all()
    serializer_class = EmailCampaignSerializer
    filterset_fields = ['status', 'template']
    search_fields = ['name']
    
    @action(detail=False, methods=['post'], url_path='send-mass-email')
    def send_mass_email(self, request):
        segment_filter = request.data.get('segment_filter', {})
        template_id = request.data.get('template_id')
        campaign_name = request.data.get('campaign_name', 'Campaña sin nombre')
        
        if not template_id:
            return Response({'error': 'template_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            template = EmailTemplate.objects.get(id=template_id)
        except EmailTemplate.DoesNotExist:
            return Response({'error': 'Plantilla no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        leads = Lead.objects.filter(**segment_filter)
        total_recipients = leads.count()
        
        campaign = EmailCampaign.objects.create(
            name=campaign_name,
            template=template,
            segment_filter=segment_filter,
            status='completada',
            started_at=timezone.now(),
            completed_at=timezone.now(),
            total_recipients=total_recipients,
            emails_sent=total_recipients,
            emails_failed=0
        )
        
        return Response({
            'message': f'Mock: {total_recipients} emails enviados exitosamente via SendGrid/Mailgun',
            'campaign_id': campaign.id,
            'total_recipients': total_recipients,
            'template_used': template.name
        }, status=status.HTTP_200_OK)


class SocialMediaPostViewSet(viewsets.ModelViewSet):
    queryset = SocialMediaPost.objects.all()
    serializer_class = SocialMediaPostSerializer
    filterset_fields = ['platform', 'status']
    search_fields = ['content', 'hashtags']
    
    @action(detail=True, methods=['post'], url_path='publish')
    def publish_post(self, request, pk=None):
        post = self.get_object()
        
        if post.status == 'publicado':
            return Response({'error': 'El post ya fue publicado'}, status=status.HTTP_400_BAD_REQUEST)
        
        post.status = 'publicado'
        post.published_at = timezone.now()
        post.external_post_id = f'mock_{post.platform}_{post.id}'
        post.external_post_url = f'https://{post.platform}.com/post/{post.id}'
        post.save()
        
        return Response({
            'message': f'Mock: Post publicado exitosamente en {post.platform}',
            'post_id': post.id,
            'platform': post.platform,
            'external_url': post.external_post_url
        }, status=status.HTTP_200_OK)
