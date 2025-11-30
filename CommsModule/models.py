from django.db import models
from django.utils.translation import gettext_lazy as _
from SalesModule.models import Lead


class InboxMessage(models.Model):
    SOURCE_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('tiktok', 'TikTok'),
        ('email', _('Correo Electrónico')),
        ('web', _('Formulario Web')),
        ('otro', _('Otro')),
    ]
    
    DIRECTION_CHOICES = [
        ('entrante', _('Entrante')),
        ('saliente', _('Saliente')),
    ]
    
    STATUS_CHOICES = [
        ('nuevo', _('Nuevo')),
        ('leido', _('Leído')),
        ('respondido', _('Respondido')),
        ('archivado', _('Archivado')),
    ]
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='messages', verbose_name=_('Lead'))
    source = models.CharField(_('Fuente'), max_length=20, choices=SOURCE_CHOICES)
    direction = models.CharField(_('Dirección'), max_length=20, choices=DIRECTION_CHOICES, default='entrante')
    
    sender_name = models.CharField(_('Nombre del Remitente'), max_length=255, blank=True)
    sender_identifier = models.CharField(_('Identificador del Remitente'), max_length=255, blank=True, help_text=_('Teléfono, Email, ID de Usuario, etc.'))
    
    subject = models.CharField(_('Asunto'), max_length=500, blank=True)
    message_body = models.TextField(_('Cuerpo del Mensaje'))
    
    status = models.CharField(_('Estado'), max_length=20, choices=STATUS_CHOICES, default='nuevo')
    
    external_message_id = models.CharField(_('ID Externo del Mensaje'), max_length=255, blank=True, help_text=_('ID del mensaje en la plataforma externa'))
    
    read_at = models.DateTimeField(_('Leído en'), null=True, blank=True)
    responded_at = models.DateTimeField(_('Respondido en'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Mensaje de Inbox')
        verbose_name_plural = _('Mensajes de Inbox')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lead', 'source']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.source} - {self.sender_name or self.sender_identifier} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class ChannelConnection(models.Model):
    CHANNEL_TYPE_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('tiktok', 'TikTok'),
        ('email', 'Email'),
        ('webhook', 'Custom Webhook'),
    ]

    CONNECTION_METHOD_CHOICES = [
        ('api_key', 'API Key'),
        ('webhook', 'Webhook'),
        ('builtin', 'Built-in'),
    ]

    channel_type = models.CharField(_('Tipo de Canal'), max_length=20, choices=CHANNEL_TYPE_CHOICES)
    is_active = models.BooleanField(_('Activo'), default=True)
    
    connection_method = models.CharField(_('Método de Conexión'), max_length=20, choices=CONNECTION_METHOD_CHOICES, default='builtin')
    api_key = models.CharField(_('API Key'), max_length=500, blank=True, help_text=_('Se almacena encriptado'))
    webhook_url = models.URLField(_('URL Webhook'), blank=True, help_text=_('URL para recibir eventos'))
    webhook_secret = models.CharField(_('Secreto Webhook'), max_length=500, blank=True, help_text=_('Se almacena encriptado'))
    
    configuration = models.JSONField(_('Configuración Adicional'), default=dict, blank=True, help_text=_('Datos adicionales específicos del canal'))
    
    connected_at = models.DateTimeField(_('Fecha de Conexión'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Conexión de Canal')
        verbose_name_plural = _('Conexiones de Canales')
        unique_together = ('channel_type',)
        ordering = ['-connected_at']
    
    def __str__(self):
        return f"{self.get_channel_type_display()} - {'Activo' if self.is_active else 'Inactivo'}"
