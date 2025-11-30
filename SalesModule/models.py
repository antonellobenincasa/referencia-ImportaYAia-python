from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal


class Lead(models.Model):
    STATUS_CHOICES = [
        ('nuevo', _('Nuevo')),
        ('prospecto', _('Prospecto')),
        ('contacto_establecido', _('Contacto Establecido')),
        ('proceso_cotizacion', _('Proceso Cotización')),
        ('oferta_presentada', _('Oferta Presentada')),
        ('negociacion', _('Negociación')),
        ('cotizacion_aprobada', _('Cotización Aprobada')),
    ]
    
    company_name = models.CharField(_('Nombre de Empresa'), max_length=255)
    first_name = models.CharField(_('Nombres'), max_length=255, blank=True)
    last_name = models.CharField(_('Apellidos'), max_length=255, blank=True)
    email = models.EmailField(_('Correo Electrónico'))
    phone = models.CharField(_('Teléfono'), max_length=50, blank=True)
    whatsapp = models.CharField(_('WhatsApp'), max_length=50, blank=True)
    country = models.CharField(_('País'), max_length=100, default='Ecuador')
    city = models.CharField(_('Ciudad'), max_length=100, blank=True)
    status = models.CharField(_('Estado'), max_length=20, choices=STATUS_CHOICES, default='nuevo')
    source = models.CharField(_('Fuente'), max_length=100, blank=True, help_text=_('Facebook, Instagram, WhatsApp, Email, etc.'))
    notes = models.TextField(_('Notas'), blank=True)
    is_active_importer = models.BooleanField(_('¿Es importador actualmente?'), default=False)
    ruc = models.CharField(_('RUC'), max_length=13, blank=True, help_text=_('13 dígitos numéricos del RUC Ecuador'))
    legal_type = models.CharField(_('Tipo Legal'), max_length=20, choices=[('natural', 'Persona Natural'), ('juridica', 'Persona Jurídica')], default='juridica')
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Lead')
        verbose_name_plural = _('Leads')
        ordering = ['-created_at']
    
    def __str__(self):
        contact = f"{self.first_name} {self.last_name}".strip() or self.company_name
        return f"{self.company_name} - {contact}"


class Opportunity(models.Model):
    STAGE_CHOICES = [
        ('calificacion', _('Calificación')),
        ('propuesta', _('Propuesta')),
        ('negociacion', _('Negociación')),
        ('cerrado_ganado', _('Cerrado Ganado')),
        ('cerrado_perdido', _('Cerrado Perdido')),
    ]
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='opportunities', verbose_name=_('Lead'))
    opportunity_name = models.CharField(_('Nombre de Oportunidad'), max_length=255)
    stage = models.CharField(_('Etapa'), max_length=20, choices=STAGE_CHOICES, default='calificacion')
    estimated_value = models.DecimalField(_('Valor Estimado (USD)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    probability = models.IntegerField(_('Probabilidad (%)'), default=50, validators=[MinValueValidator(0)])
    expected_close_date = models.DateField(_('Fecha Esperada de Cierre'), null=True, blank=True)
    notes = models.TextField(_('Notas'), blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Oportunidad')
        verbose_name_plural = _('Oportunidades')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.opportunity_name} - {self.lead.company_name}"


class Quote(models.Model):
    STATUS_CHOICES = [
        ('borrador', _('Borrador')),
        ('enviado', _('Enviado')),
        ('visto', _('Visto')),
        ('aceptado', _('Aceptado')),
        ('rechazado', _('Rechazado')),
        ('expirado', _('Expirado')),
    ]
    
    INCOTERM_CHOICES = [
        ('EXW', 'EXW - Ex Works'),
        ('FCA', 'FCA - Free Carrier'),
        ('FAS', 'FAS - Free Alongside Ship'),
        ('FOB', 'FOB - Free On Board'),
        ('CFR', 'CFR - Cost and Freight'),
        ('CIF', 'CIF - Cost, Insurance and Freight'),
        ('CPT', 'CPT - Carriage Paid To'),
        ('CIP', 'CIP - Carriage and Insurance Paid To'),
        ('DAP', 'DAP - Delivered At Place'),
        ('DPU', 'DPU - Delivered at Place Unloaded'),
        ('DDP', 'DDP - Delivered Duty Paid'),
    ]
    
    CARGO_TYPE_CHOICES = [
        ('FCL', _('FCL - Contenedor Completo')),
        ('LCL', _('LCL - Carga Suelta')),
        ('Aereo', _('Aéreo')),
        ('Terrestre', _('Terrestre')),
    ]
    
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='quotes', verbose_name=_('Oportunidad'))
    quote_number = models.CharField(_('Número de Cotización'), max_length=50, unique=True)
    
    origin = models.CharField(_('Origen'), max_length=255)
    destination = models.CharField(_('Destino'), max_length=255)
    incoterm = models.CharField(_('Incoterm'), max_length=3, choices=INCOTERM_CHOICES)
    cargo_type = models.CharField(_('Tipo de Carga'), max_length=20, choices=CARGO_TYPE_CHOICES)
    cargo_description = models.TextField(_('Descripción de Carga'), blank=True)
    
    base_rate = models.DecimalField(_('Tarifa Base (USD)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    profit_margin = models.DecimalField(_('Margen de Ganancia Mínimo (USD)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    final_price = models.DecimalField(_('Precio Final al Cliente (USD)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    
    status = models.CharField(_('Estado'), max_length=20, choices=STATUS_CHOICES, default='borrador')
    valid_until = models.DateField(_('Válido Hasta'), null=True, blank=True)
    notes = models.TextField(_('Notas'), blank=True)
    
    sent_at = models.DateTimeField(_('Enviado en'), null=True, blank=True)
    viewed_at = models.DateTimeField(_('Visto en'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Cotización')
        verbose_name_plural = _('Cotizaciones')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.quote_number} - {self.opportunity.opportunity_name}"
    
    def save(self, *args, **kwargs):
        if not self.quote_number:
            last_quote = Quote.objects.order_by('-id').first()
            if last_quote:
                last_number = int(last_quote.quote_number.split('-')[1])
                self.quote_number = f"COT-{last_number + 1:05d}"
            else:
                self.quote_number = "COT-00001"
        super().save(*args, **kwargs)


class TaskReminder(models.Model):
    PRIORITY_CHOICES = [
        ('baja', _('Baja')),
        ('media', _('Media')),
        ('alta', _('Alta')),
    ]
    
    STATUS_CHOICES = [
        ('pendiente', _('Pendiente')),
        ('completada', _('Completada')),
        ('cancelada', _('Cancelada')),
    ]
    
    TASK_TYPE_CHOICES = [
        ('seguimiento_cotizacion', _('Seguimiento de Cotización')),
        ('llamada', _('Llamada')),
        ('email', _('Enviar Email')),
        ('reunion', _('Reunión')),
        ('otro', _('Otro')),
    ]
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='tasks', verbose_name=_('Lead'), null=True, blank=True)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='tasks', verbose_name=_('Cotización'), null=True, blank=True)
    
    task_type = models.CharField(_('Tipo de Tarea'), max_length=30, choices=TASK_TYPE_CHOICES, default='otro')
    title = models.CharField(_('Título'), max_length=255)
    description = models.TextField(_('Descripción'), blank=True)
    priority = models.CharField(_('Prioridad'), max_length=10, choices=PRIORITY_CHOICES, default='media')
    status = models.CharField(_('Estado'), max_length=20, choices=STATUS_CHOICES, default='pendiente')
    
    due_date = models.DateTimeField(_('Fecha Límite'))
    completed_at = models.DateTimeField(_('Completado en'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Recordatorio de Tarea')
        verbose_name_plural = _('Recordatorios de Tareas')
        ordering = ['due_date']
    
    def __str__(self):
        return f"{self.title} - {self.due_date.strftime('%Y-%m-%d %H:%M')}"


class Meeting(models.Model):
    STATUS_CHOICES = [
        ('programada', _('Programada')),
        ('confirmada', _('Confirmada')),
        ('completada', _('Completada')),
        ('cancelada', _('Cancelada')),
    ]
    
    MEETING_TYPE_CHOICES = [
        ('virtual', _('Virtual')),
        ('presencial', _('Presencial')),
        ('telefonica', _('Telefónica')),
    ]
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='meetings', verbose_name=_('Lead'))
    opportunity = models.ForeignKey(Opportunity, on_delete=models.SET_NULL, related_name='meetings', verbose_name=_('Oportunidad'), null=True, blank=True)
    
    title = models.CharField(_('Título'), max_length=255)
    meeting_type = models.CharField(_('Tipo de Reunión'), max_length=20, choices=MEETING_TYPE_CHOICES, default='virtual')
    meeting_datetime = models.DateTimeField(_('Fecha y Hora'))
    duration_minutes = models.IntegerField(_('Duración (minutos)'), default=30)
    
    meeting_link = models.URLField(_('Link de Reunión'), blank=True, help_text=_('Zoom, Google Meet, etc.'))
    location = models.CharField(_('Ubicación'), max_length=255, blank=True)
    
    status = models.CharField(_('Estado'), max_length=20, choices=STATUS_CHOICES, default='programada')
    notes = models.TextField(_('Notas'), blank=True)
    
    google_calendar_synced = models.BooleanField(_('Sincronizado con Google Calendar'), default=False)
    outlook_synced = models.BooleanField(_('Sincronizado con Outlook'), default=False)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Reunión')
        verbose_name_plural = _('Reuniones')
        ordering = ['meeting_datetime']
    
    def __str__(self):
        return f"{self.title} - {self.meeting_datetime.strftime('%Y-%m-%d %H:%M')}"


import uuid


class APIKey(models.Model):
    """API Keys para integraciones externas y webhooks"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_('Nombre de la API'), max_length=255)
    key = models.CharField(_('Clave API'), max_length=255, unique=True)
    secret = models.CharField(_('Secreto'), max_length=255, blank=True)
    webhook_url = models.URLField(_('URL del Webhook'), blank=True, help_text=_('URL para recibir eventos'))
    
    is_active = models.BooleanField(_('Activa'), default=True)
    service_type = models.CharField(
        _('Tipo de Servicio'),
        max_length=50,
        choices=[
            ('zapier', 'Zapier'),
            ('custom', 'Custom Webhook'),
            ('stripe', 'Stripe'),
            ('sendgrid', 'SendGrid'),
            ('whatsapp', 'WhatsApp'),
            ('other', 'Otro'),
        ],
        default='custom'
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('API Key')
        verbose_name_plural = _('API Keys')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.service_type}"


class BulkLeadImport(models.Model):
    """Rastreo de imports masivos de leads"""
    STATUS_CHOICES = [
        ('pendiente', _('Pendiente')),
        ('procesando', _('Procesando')),
        ('completado', _('Completado')),
        ('error', _('Error')),
    ]
    
    file = models.FileField(_('Archivo'), upload_to='bulk_imports/')
    file_type = models.CharField(
        _('Tipo de Archivo'),
        max_length=20,
        choices=[
            ('csv', 'CSV'),
            ('xlsx', 'Excel'),
            ('xls', 'Excel 97-2003'),
            ('txt', 'Texto'),
        ]
    )
    
    status = models.CharField(_('Estado'), max_length=20, choices=STATUS_CHOICES, default='pendiente')
    total_rows = models.IntegerField(_('Total de Filas'), default=0)
    imported_rows = models.IntegerField(_('Filas Importadas'), default=0)
    error_rows = models.IntegerField(_('Filas con Error'), default=0)
    error_details = models.TextField(_('Detalles de Errores'), blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Importación Masiva de Leads')
        verbose_name_plural = _('Importaciones Masivas de Leads')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Importación {self.id} - {self.status}"
