from django.db import models
from django.utils.translation import gettext_lazy as _


class EmailTemplate(models.Model):
    name = models.CharField(_('Nombre de Plantilla'), max_length=255, unique=True)
    subject = models.CharField(_('Asunto'), max_length=500)
    body_html = models.TextField(_('Cuerpo HTML'))
    body_text = models.TextField(_('Cuerpo Texto Plano'), blank=True)
    
    available_variables = models.TextField(
        _('Variables Disponibles'),
        blank=True,
        help_text=_('Variables separadas por comas (ej: {{company_name}}, {{contact_name}}, {{quote_number}})')
    )
    
    is_active = models.BooleanField(_('Activo'), default=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Plantilla de Email')
        verbose_name_plural = _('Plantillas de Email')
        ordering = ['name']
    
    def __str__(self):
        return self.name


class EmailCampaign(models.Model):
    STATUS_CHOICES = [
        ('borrador', _('Borrador')),
        ('programada', _('Programada')),
        ('enviando', _('Enviando')),
        ('completada', _('Completada')),
        ('cancelada', _('Cancelada')),
    ]
    
    name = models.CharField(_('Nombre de Campaña'), max_length=255)
    template = models.ForeignKey(EmailTemplate, on_delete=models.PROTECT, related_name='campaigns', verbose_name=_('Plantilla'))
    
    segment_filter = models.JSONField(
        _('Filtro de Segmento'),
        default=dict,
        help_text=_('Criterios para filtrar leads (ej: {"status": "calificado", "country": "Ecuador"})')
    )
    
    status = models.CharField(_('Estado'), max_length=20, choices=STATUS_CHOICES, default='borrador')
    
    scheduled_at = models.DateTimeField(_('Programada para'), null=True, blank=True)
    started_at = models.DateTimeField(_('Iniciada en'), null=True, blank=True)
    completed_at = models.DateTimeField(_('Completada en'), null=True, blank=True)
    
    total_recipients = models.IntegerField(_('Total de Destinatarios'), default=0)
    emails_sent = models.IntegerField(_('Emails Enviados'), default=0)
    emails_failed = models.IntegerField(_('Emails Fallidos'), default=0)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Campaña de Email')
        verbose_name_plural = _('Campañas de Email')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.status}"


class SocialMediaPost(models.Model):
    PLATFORM_CHOICES = [
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('tiktok', 'TikTok'),
        ('twitter', 'Twitter / X'),
        ('linkedin', 'LinkedIn'),
    ]
    
    STATUS_CHOICES = [
        ('borrador', _('Borrador')),
        ('programado', _('Programado')),
        ('publicado', _('Publicado')),
        ('fallido', _('Fallido')),
        ('cancelado', _('Cancelado')),
    ]
    
    platform = models.CharField(_('Plataforma'), max_length=20, choices=PLATFORM_CHOICES)
    content = models.TextField(_('Contenido'))
    
    image_url = models.URLField(_('URL de Imagen'), blank=True)
    video_url = models.URLField(_('URL de Video'), blank=True)
    
    hashtags = models.CharField(_('Hashtags'), max_length=500, blank=True, help_text=_('Separados por espacios'))
    
    status = models.CharField(_('Estado'), max_length=20, choices=STATUS_CHOICES, default='borrador')
    
    scheduled_time = models.DateTimeField(_('Hora Programada'))
    published_at = models.DateTimeField(_('Publicado en'), null=True, blank=True)
    
    external_post_id = models.CharField(_('ID Externo del Post'), max_length=255, blank=True, help_text=_('ID del post en la plataforma social'))
    external_post_url = models.URLField(_('URL del Post Externo'), blank=True)
    
    error_message = models.TextField(_('Mensaje de Error'), blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Post de Redes Sociales')
        verbose_name_plural = _('Posts de Redes Sociales')
        ordering = ['scheduled_time']
        indexes = [
            models.Index(fields=['platform', 'status']),
            models.Index(fields=['scheduled_time']),
        ]
    
    def __str__(self):
        return f"{self.platform} - {self.scheduled_time.strftime('%Y-%m-%d %H:%M')} - {self.status}"
