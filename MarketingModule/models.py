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


class LandingPage(models.Model):
    CHANNEL_CHOICES = [
        ('email', _('Email')),
        ('whatsapp', 'WhatsApp'),
        ('telegram', 'Telegram'),
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('tiktok', 'TikTok'),
        ('web', _('Web/Enlace Directo')),
    ]
    
    name = models.CharField(_('Nombre de Landing Page'), max_length=255, unique=True)
    title = models.CharField(_('Título'), max_length=500)
    description = models.TextField(_('Descripción'), blank=True)
    
    distribution_channels = models.JSONField(
        _('Canales de Distribución'),
        default=list,
        help_text=_('Lista de canales habilitados para esta landing page')
    )
    
    is_active = models.BooleanField(_('Activa'), default=True)
    
    public_url_slug = models.SlugField(_('URL Pública (Slug)'), max_length=100, unique=True)
    
    custom_branding = models.JSONField(
        _('Personalización de Marca'),
        default=dict,
        blank=True,
        help_text=_('Colores, logos, y otros elementos de marca')
    )
    
    total_visits = models.IntegerField(_('Total de Visitas'), default=0)
    total_submissions = models.IntegerField(_('Total de Envíos'), default=0)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Landing Page')
        verbose_name_plural = _('Landing Pages')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class LandingPageSubmission(models.Model):
    TRANSPORT_TYPE_CHOICES = [
        ('air', _('Aéreo')),
        ('ocean_lcl', _('Marítimo LCL')),
        ('ocean_fcl', _('Marítimo FCL')),
    ]
    
    DIMENSION_UNIT_CHOICES = [
        ('cm', _('Centímetros')),
        ('inches', _('Pulgadas')),
    ]
    
    CONTAINER_TYPE_CHOICES = [
        ('20gp', '1x20GP'),
        ('40gp', '1x40GP'),
        ('40hc', '1x40HC'),
        ('40nor', '1x40NOR'),
        ('40rf', '1x40RF'),
        ('20rf', '1x20RF'),
        ('40ot_hc', '1x40 OT HC'),
        ('20flat', '1x20 Flat Rack'),
        ('40flat', '1x40 Flat Rack'),
        ('20ot', '1x20 OT'),
        ('40ot', '1x40 OT'),
    ]
    
    landing_page = models.ForeignKey(
        LandingPage,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name=_('Landing Page')
    )
    
    is_existing_customer = models.BooleanField(_('¿Es Cliente Existente?'), default=False)
    
    existing_customer_ruc = models.CharField(
        _('RUC (Cliente Existente)'),
        max_length=13,
        blank=True,
        help_text=_('RUC del cliente existente para búsqueda en CRM')
    )
    
    first_name = models.CharField(_('Nombres'), max_length=255, blank=True)
    last_name = models.CharField(_('Apellidos'), max_length=255, blank=True)
    
    is_company = models.BooleanField(_('¿Es Empresa?'), default=False)
    company_name = models.CharField(_('Razón Social'), max_length=500, blank=True)
    company_ruc = models.CharField(_('RUC de Empresa'), max_length=13, blank=True)
    
    email = models.EmailField(_('Email'))
    phone = models.CharField(_('Teléfono'), max_length=20)
    
    transport_type = models.CharField(
        _('Tipo de Transporte'),
        max_length=20,
        choices=TRANSPORT_TYPE_CHOICES
    )
    
    incoterm = models.CharField(_('Incoterm'), max_length=10)
    
    is_general_cargo = models.BooleanField(_('Carga General'), default=True)
    is_dg_cargo = models.BooleanField(_('Carga Peligrosa (DG)'), default=False)
    
    msds_document = models.FileField(
        _('Documento MSDS'),
        upload_to='landing_submissions/msds/',
        blank=True,
        null=True,
        help_text=_('Obligatorio para carga peligrosa')
    )
    
    additional_documents = models.JSONField(
        _('Documentos Adicionales'),
        default=list,
        blank=True,
        help_text=_('Lista de URLs/paths de documentos adicionales')
    )
    
    gross_weight_kg = models.DecimalField(
        _('Peso Bruto (KG)'),
        max_digits=10,
        decimal_places=2
    )
    
    pieces_quantity = models.IntegerField(_('Cantidad de Piezas'))
    
    dimension_unit = models.CharField(
        _('Unidad de Medida'),
        max_length=10,
        choices=DIMENSION_UNIT_CHOICES,
        default='cm'
    )
    
    length = models.DecimalField(_('Largo'), max_digits=10, decimal_places=2, blank=True, null=True)
    width = models.DecimalField(_('Ancho'), max_digits=10, decimal_places=2, blank=True, null=True)
    height = models.DecimalField(_('Alto'), max_digits=10, decimal_places=2, blank=True, null=True)
    
    total_cbm = models.DecimalField(
        _('CBM Total (Metros Cúbicos)'),
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
        help_text=_('Para Ocean LCL')
    )
    
    is_stackable = models.BooleanField(_('¿Es Apilable?'), default=True)
    
    container_type = models.CharField(
        _('Tipo de Contenedor'),
        max_length=20,
        choices=CONTAINER_TYPE_CHOICES,
        blank=True,
        help_text=_('Solo para Ocean FCL')
    )
    
    airport_origin = models.CharField(_('Aeropuerto de Origen'), max_length=100, blank=True)
    airport_destination = models.CharField(_('Aeropuerto de Destino'), max_length=100, blank=True)
    
    pol_port_of_lading = models.CharField(_('Puerto de Embarque (POL)'), max_length=100, blank=True)
    pod_port_of_discharge = models.CharField(_('Puerto de Descarga (POD)'), max_length=100, blank=True)
    
    pickup_address = models.TextField(
        _('Dirección de Recogida en Origen'),
        blank=True,
        help_text=_('Opcional para cálculo de costo de pickup')
    )
    
    quote_validity_days = models.IntegerField(
        _('Validez de Cotización (Días)'),
        blank=True,
        null=True,
        help_text=_('Calculado automáticamente según tipo de transporte y origen')
    )
    
    origin_region = models.CharField(
        _('Región de Origen'),
        max_length=100,
        blank=True,
        help_text=_('Asia, Southeast Asia, Europa, América, etc.')
    )
    
    created_lead = models.ForeignKey(
        'SalesModule.Lead',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='landing_submissions',
        verbose_name=_('Lead Creado')
    )
    
    created_quote = models.ForeignKey(
        'SalesModule.Quote',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='landing_submissions',
        verbose_name=_('Cotización Creada')
    )
    
    submission_ip = models.GenericIPAddressField(_('IP de Envío'), blank=True, null=True)
    submission_source_channel = models.CharField(
        _('Canal de Origen'),
        max_length=20,
        blank=True,
        help_text=_('Email, WhatsApp, etc.')
    )
    
    status = models.CharField(
        _('Estado'),
        max_length=20,
        default='pendiente',
        choices=[
            ('pendiente', _('Pendiente')),
            ('procesando', _('Procesando')),
            ('cotizado', _('Cotizado')),
            ('fallido', _('Fallido')),
        ]
    )
    
    error_message = models.TextField(_('Mensaje de Error'), blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Envío'), auto_now_add=True)
    processed_at = models.DateTimeField(_('Fecha de Procesamiento'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Envío de Landing Page')
        verbose_name_plural = _('Envíos de Landing Pages')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['landing_page', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['existing_customer_ruc']),
            models.Index(fields=['company_ruc']),
        ]
    
    def __str__(self):
        customer = self.company_name or f"{self.first_name} {self.last_name}"
        return f"{self.landing_page.name} - {customer} - {self.transport_type}"
