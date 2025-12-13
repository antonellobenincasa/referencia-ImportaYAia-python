from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings


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
    
    lead_number = models.CharField(_('Número de Lead'), max_length=20, unique=True, null=True, blank=True, help_text=_('LEAD-001, LEAD-002, etc.'))
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
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='leads',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Lead')
        verbose_name_plural = _('Leads')
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.lead_number:
            if self.owner:
                count = Lead.objects.filter(owner=self.owner).count() + 1
            else:
                count = Lead.objects.count() + 1
            self.lead_number = f"LEAD-{str(count).zfill(6)}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        contact = f"{self.first_name} {self.last_name}".strip() or self.company_name
        return f"[{self.lead_number}] {self.company_name} - {contact}"
    
    @property
    def days_since_creation(self):
        """Calculate days since lead creation"""
        from django.utils import timezone
        return (timezone.now() - self.created_at).days
    
    @property
    def should_be_prospecto(self):
        """Check if lead should auto-transition to PROSPECTO (after 7 days)"""
        return self.status == 'nuevo' and self.days_since_creation >= 7


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
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='opportunities',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
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
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quotes',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
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
            if self.owner:
                last_quote = Quote.objects.filter(owner=self.owner).order_by('-id').first()
            else:
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
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='task_reminders',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
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
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meetings',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
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
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='api_keys',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
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
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bulk_imports',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Importación Masiva de Leads')
        verbose_name_plural = _('Importaciones Masivas de Leads')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Importación {self.id} - {self.status}"


class QuoteSubmission(models.Model):
    """Solicitudes de cotización enviadas desde landing page o formulario"""
    STATUS_CHOICES = [
        ('recibida', _('Recibida')),
        ('validacion_pendiente', _('Validación Pendiente')),
        ('procesando_costos', _('Procesando Costos')),
        ('cotizacion_generada', _('Cotización Generada')),
        ('enviada', _('Enviada')),
        ('aprobada', _('Aprobada')),
        ('ro_generado', _('RO Generado')),
        ('en_transito', _('En Tránsito')),
        ('completada', _('Completada')),
        ('cancelada', _('Cancelada')),
        ('error_validacion', _('Error en Validación')),
        ('error_costos', _('Error en Costos')),
    ]
    
    TRANSPORT_TYPE_CHOICES = [
        ('FCL', _('Marítimo FCL')),
        ('LCL', _('Marítimo LCL')),
        ('AEREO', _('Aéreo')),
    ]
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='quote_submissions', verbose_name=_('Lead'), null=True, blank=True)
    
    CONTAINER_TYPE_CHOICES = [
        ('1x20GP', '1x20GP'),
        ('1x40GP', '1x40GP'),
        ('1x40HC', '1x40HC'),
        ('1x40NOR', '1x40NOR'),
        ('1x20 REEFER', '1x20 REEFER'),
        ('1x40 REEFER', '1x40 REEFER'),
        ('1x40 OT HC', '1x40 OT HC'),
        ('1x20 FLAT RACK', '1x20 FLAT RACK'),
        ('1x40 FLAT RACK', '1x40 FLAT RACK'),
        ('1x40 OPEN TOP', '1x40 OPEN TOP'),
        ('1x20 OPEN TOP', '1x20 OPEN TOP'),
    ]
    
    origin = models.CharField(_('Puerto/Ciudad Origen'), max_length=255)
    destination = models.CharField(_('Puerto/Ciudad Destino'), max_length=255)
    transport_type = models.CharField(_('Tipo de Transporte'), max_length=20, choices=TRANSPORT_TYPE_CHOICES)
    container_type = models.CharField(_('Tipo de Contenedor'), max_length=30, choices=CONTAINER_TYPE_CHOICES, blank=True, help_text=_('Solo para FCL'))
    
    cargo_description = models.TextField(_('Descripción de Carga'), blank=True)
    cargo_weight_kg = models.DecimalField(_('Peso (KG)'), max_digits=12, decimal_places=2, null=True, blank=True)
    cargo_volume_cbm = models.DecimalField(_('Volumen (CBM)'), max_digits=12, decimal_places=2, null=True, blank=True)
    
    incoterm = models.CharField(_('Incoterm'), max_length=10, blank=True, help_text=_('FOB, CIF, etc.'))
    quantity = models.IntegerField(_('Cantidad'), default=1)
    
    company_name = models.CharField(_('Empresa'), max_length=255)
    contact_name = models.CharField(_('Nombre de Contacto'), max_length=255)
    contact_email = models.EmailField(_('Email'))
    contact_phone = models.CharField(_('Teléfono'), max_length=50)
    contact_whatsapp = models.CharField(_('WhatsApp'), max_length=50, blank=True)
    city = models.CharField(_('Ciudad'), max_length=100)
    
    cost_rate = models.DecimalField(_('Tarifa de Costo (USD)'), max_digits=12, decimal_places=2, null=True, blank=True)
    profit_markup = models.DecimalField(_('Margen de Ganancia (USD)'), max_digits=12, decimal_places=2, default=Decimal('100.00'))
    final_price = models.DecimalField(_('Precio Final (USD)'), max_digits=12, decimal_places=2, null=True, blank=True)
    
    cost_rate_source = models.CharField(_('Fuente de Tarifa'), max_length=50, blank=True, help_text=_('api, webhook, google_sheets, manual'))
    
    ai_hs_code = models.CharField(_('Código HS (IA)'), max_length=20, blank=True, help_text=_('Partida arancelaria sugerida por IA'))
    ai_hs_confidence = models.IntegerField(_('Confianza HS (%)'), null=True, blank=True)
    ai_category = models.CharField(_('Categoría (IA)'), max_length=100, blank=True)
    ai_ad_valorem_pct = models.DecimalField(_('Ad-Valorem % (IA)'), max_digits=5, decimal_places=2, null=True, blank=True)
    ai_requires_permit = models.BooleanField(_('Requiere Permiso (IA)'), default=False)
    ai_permit_institutions = models.TextField(_('Instituciones de Permiso (IA)'), blank=True, help_text=_('JSON con permisos requeridos'))
    ai_response = models.TextField(_('Respuesta Completa IA'), blank=True, help_text=_('JSON completo de la respuesta de Gemini'))
    ai_status = models.CharField(_('Estado IA'), max_length=30, blank=True, help_text=_('success, fallback, error'))
    
    status = models.CharField(_('Estado'), max_length=30, choices=STATUS_CHOICES, default='recibida')
    validation_errors = models.TextField(_('Errores de Validación'), blank=True)
    notes = models.TextField(_('Notas'), blank=True)
    
    submission_number = models.CharField(_('Número de Solicitud'), max_length=30, unique=True, null=True, blank=True)
    ro_number = models.CharField(_('Número de RO'), max_length=30, unique=True, null=True, blank=True)
    
    shipper_name = models.CharField(_('Nombre del Shipper'), max_length=255, blank=True)
    shipper_address = models.TextField(_('Dirección del Shipper'), blank=True)
    consignee_name = models.CharField(_('Nombre del Consignatario'), max_length=255, blank=True)
    consignee_address = models.TextField(_('Dirección del Consignatario'), blank=True)
    notify_party = models.CharField(_('Notify Party'), max_length=255, blank=True)
    fecha_embarque_estimada = models.DateField(_('Fecha Estimada de Embarque'), null=True, blank=True)
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quote_submissions',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    processed_at = models.DateTimeField(_('Procesado en'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Solicitud de Cotización')
        verbose_name_plural = _('Solicitudes de Cotización')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.company_name} - {self.transport_type} ({self.status})"
    
    def validate_data(self):
        """Valida que todos los datos requeridos estén presentes"""
        errors = []
        
        if not self.company_name:
            errors.append('Nombre de empresa es requerido')
        if not self.contact_name:
            errors.append('Nombre de contacto es requerido')
        if not self.contact_email:
            errors.append('Email de contacto es requerido')
        if not self.contact_phone and not self.contact_whatsapp:
            errors.append('Teléfono o WhatsApp es requerido')
        if not self.origin:
            errors.append('Puerto/ciudad de origen es requerida')
        if not self.destination:
            errors.append('Puerto/ciudad de destino es requerida')
        if not self.cargo_description:
            errors.append('Descripción de carga es requerida')
        if self.transport_type == 'FCL' or self.transport_type == 'LCL':
            if not self.cargo_weight_kg and not self.cargo_volume_cbm:
                errors.append('Peso o volumen de carga es requerido')
        
        return errors
    
    def calculate_final_price(self):
        """Calcula el precio final: COST_RATE + PROFIT_MARKUP"""
        if self.cost_rate:
            self.final_price = self.cost_rate + self.profit_markup
        return self.final_price


class CostRate(models.Model):
    """Tarifas de costo desde proveedores (API, webhook, Google Sheets)"""
    SOURCE_CHOICES = [
        ('api', _('API')),
        ('webhook', _('Webhook')),
        ('google_sheets', _('Google Sheets')),
        ('manual', _('Manual')),
    ]
    
    TRANSPORT_TYPE_CHOICES = [
        ('FCL', _('Marítimo FCL')),
        ('LCL', _('Marítimo LCL')),
        ('AEREO', _('Aéreo')),
    ]
    
    origin = models.CharField(_('Origen'), max_length=255, db_index=True)
    destination = models.CharField(_('Destino'), max_length=255, db_index=True)
    transport_type = models.CharField(_('Tipo de Transporte'), max_length=20, choices=TRANSPORT_TYPE_CHOICES, db_index=True)
    
    rate = models.DecimalField(_('Tarifa (USD)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    
    source = models.CharField(_('Fuente'), max_length=20, choices=SOURCE_CHOICES)
    provider_name = models.CharField(_('Nombre del Proveedor'), max_length=255, blank=True)
    
    valid_from = models.DateField(_('Válido Desde'), auto_now_add=True)
    valid_until = models.DateField(_('Válido Hasta'), null=True, blank=True)
    is_active = models.BooleanField(_('Activa'), default=True, db_index=True)
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cost_rates',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Tarifa de Costo')
        verbose_name_plural = _('Tarifas de Costo')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['origin', 'destination', 'transport_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.origin} → {self.destination} ({self.transport_type}) - USD {self.rate}"


class LeadCotizacion(models.Model):
    """Cotizaciones solicitadas por LEADs desde el portal de importadores"""
    TIPO_CARGA_CHOICES = [
        ('aerea', _('Aérea')),
        ('maritima', _('Marítima')),
        ('terrestre', _('Terrestre')),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', _('Pendiente')),
        ('cotizado', _('Cotizado')),
        ('aprobada', _('Aprobada')),
        ('ro_generado', _('RO Generado')),
        ('en_transito', _('En Tránsito')),
        ('completada', _('Completada')),
        ('cancelada', _('Cancelada')),
    ]
    
    INCOTERM_CHOICES = [
        ('EXW', 'EXW - Ex Works'),
        ('FOB', 'FOB - Free On Board'),
        ('CIF', 'CIF - Cost, Insurance & Freight'),
        ('CFR', 'CFR - Cost & Freight'),
        ('DDP', 'DDP - Delivered Duty Paid'),
    ]
    
    numero_cotizacion = models.CharField(_('Número de Cotización'), max_length=20, unique=True)
    lead_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lead_cotizaciones',
        verbose_name=_('Usuario Lead')
    )
    
    tipo_carga = models.CharField(_('Tipo de Carga'), max_length=20, choices=TIPO_CARGA_CHOICES)
    origen_pais = models.CharField(_('País de Origen'), max_length=100)
    origen_ciudad = models.CharField(_('Ciudad de Origen'), max_length=100, blank=True)
    destino_ciudad = models.CharField(_('Ciudad de Destino'), max_length=100)
    descripcion_mercancia = models.TextField(_('Descripción de Mercancía'))
    peso_kg = models.DecimalField(_('Peso (kg)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    volumen_cbm = models.DecimalField(_('Volumen (m³)'), max_digits=12, decimal_places=2, null=True, blank=True)
    valor_mercancia_usd = models.DecimalField(_('Valor de Mercancía (USD)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    incoterm = models.CharField(_('Incoterm'), max_length=10, choices=INCOTERM_CHOICES, default='FOB')
    requiere_seguro = models.BooleanField(_('Requiere Seguro'), default=False)
    requiere_transporte_interno = models.BooleanField(_('Requiere Transporte Interno'), default=False)
    notas_adicionales = models.TextField(_('Notas Adicionales'), blank=True)
    
    flete_usd = models.DecimalField(_('Flete (USD)'), max_digits=12, decimal_places=2, null=True, blank=True)
    seguro_usd = models.DecimalField(_('Seguro (USD)'), max_digits=12, decimal_places=2, null=True, blank=True)
    aduana_usd = models.DecimalField(_('Agenciamiento Aduanero (USD)'), max_digits=12, decimal_places=2, null=True, blank=True)
    transporte_interno_usd = models.DecimalField(_('Transporte Interno (USD)'), max_digits=12, decimal_places=2, null=True, blank=True)
    otros_usd = models.DecimalField(_('Otros Gastos (USD)'), max_digits=12, decimal_places=2, null=True, blank=True)
    total_usd = models.DecimalField(_('Total (USD)'), max_digits=12, decimal_places=2, null=True, blank=True)
    
    estado = models.CharField(_('Estado'), max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    ro_number = models.CharField(_('Número de RO'), max_length=20, unique=True, null=True, blank=True)
    
    shipper_name = models.CharField(_('Nombre del Shipper'), max_length=255, blank=True)
    shipper_address = models.TextField(_('Dirección del Shipper'), blank=True)
    consignee_name = models.CharField(_('Nombre del Consignatario'), max_length=255, blank=True)
    consignee_address = models.TextField(_('Dirección del Consignatario'), blank=True)
    notify_party = models.CharField(_('Notify Party'), max_length=255, blank=True)
    fecha_embarque_estimada = models.DateField(_('Fecha de Embarque Estimada'), null=True, blank=True)
    
    fecha_creacion = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    fecha_aprobacion = models.DateTimeField(_('Fecha de Aprobación'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Cotización de Lead')
        verbose_name_plural = _('Cotizaciones de Leads')
        ordering = ['-fecha_creacion']
    
    def save(self, *args, **kwargs):
        if not self.pk and not self.numero_cotizacion:
            from django.db import transaction
            with transaction.atomic():
                max_count = LeadCotizacion.objects.count() + 1
                self.numero_cotizacion = f"COTI-ICS-{str(max_count).zfill(7)}"
        
        super().save(*args, **kwargs)
    
    def calculate_total(self):
        """Calcula automáticamente los costos basados en el tipo de carga y destino"""
        from decimal import Decimal
        
        base_rates = {
            'aerea': Decimal('4.50'),
            'maritima': Decimal('0.85'),
            'terrestre': Decimal('1.20'),
        }
        
        rate = base_rates.get(self.tipo_carga, Decimal('1.00'))
        self.flete_usd = self.peso_kg * rate
        
        if self.requiere_seguro:
            self.seguro_usd = self.valor_mercancia_usd * Decimal('0.005')
        else:
            self.seguro_usd = Decimal('0')
        
        self.aduana_usd = Decimal('150')
        
        if self.requiere_transporte_interno:
            transport_rates = {
                'Guayaquil': Decimal('50'),
                'Quito': Decimal('120'),
                'Cuenca': Decimal('180'),
                'Manta': Decimal('90'),
            }
            self.transporte_interno_usd = transport_rates.get(self.destino_ciudad, Decimal('100'))
        else:
            self.transporte_interno_usd = Decimal('0')
        
        self.otros_usd = Decimal('25')
        
        self.total_usd = (
            (self.flete_usd or Decimal('0')) +
            (self.seguro_usd or Decimal('0')) +
            (self.aduana_usd or Decimal('0')) +
            (self.transporte_interno_usd or Decimal('0')) +
            (self.otros_usd or Decimal('0'))
        )
    
    def aprobar(self):
        """Aprueba la cotización"""
        from django.utils import timezone
        self.estado = 'aprobada'
        self.fecha_aprobacion = timezone.now()
        self.save()
    
    def generar_ro(self):
        """Genera el número de Routing Order único"""
        if self.estado != 'aprobada':
            raise ValueError('La cotización debe estar aprobada para generar un RO')
        
        count = LeadCotizacion.objects.filter(ro_number__isnull=False).count() + 1
        self.ro_number = f"RO-{str(count).zfill(6)}"
        self.estado = 'ro_generado'
        self.save()
        return self.ro_number
    
    def __str__(self):
        return f"{self.numero_cotizacion} - {self.lead_user.email}"


class QuoteScenario(models.Model):
    """Escenarios de cotización con diferentes opciones de precio/tiempo"""
    SCENARIO_TYPE_CHOICES = [
        ('economico', _('Económico')),
        ('estandar', _('Estándar')),
        ('express', _('Express')),
    ]
    
    cotizacion = models.ForeignKey(
        LeadCotizacion,
        on_delete=models.CASCADE,
        related_name='escenarios',
        verbose_name=_('Cotización')
    )
    
    nombre = models.CharField(_('Nombre del Escenario'), max_length=100)
    tipo = models.CharField(_('Tipo'), max_length=20, choices=SCENARIO_TYPE_CHOICES, default='estandar')
    
    freight_rate = models.ForeignKey(
        'FreightRate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quote_scenarios',
        verbose_name=_('Tarifa de Flete')
    )
    insurance_rate = models.ForeignKey(
        'InsuranceRate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quote_scenarios',
        verbose_name=_('Tarifa de Seguro')
    )
    brokerage_rate = models.ForeignKey(
        'CustomsBrokerageRate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quote_scenarios',
        verbose_name=_('Tarifa de Agenciamiento')
    )
    inland_transport_rate = models.ForeignKey(
        'InlandTransportQuoteRate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quote_scenarios',
        verbose_name=_('Tarifa de Transporte Interno')
    )
    
    flete_usd = models.DecimalField(_('Flete (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    seguro_usd = models.DecimalField(_('Seguro (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    agenciamiento_usd = models.DecimalField(_('Agenciamiento (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    transporte_interno_usd = models.DecimalField(_('Transporte Interno (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    otros_usd = models.DecimalField(_('Otros (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    total_usd = models.DecimalField(_('Total (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    
    tiempo_transito_dias = models.IntegerField(_('Tiempo de Tránsito (días)'), null=True, blank=True)
    notas = models.TextField(_('Notas'), blank=True)
    
    is_selected = models.BooleanField(_('Seleccionado'), default=False)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Escenario de Cotización')
        verbose_name_plural = _('Escenarios de Cotización')
        ordering = ['tipo', 'total_usd']
    
    def calculate_total(self):
        """Calcula el total del escenario"""
        self.total_usd = (
            self.flete_usd +
            self.seguro_usd +
            self.agenciamiento_usd +
            self.transporte_interno_usd +
            self.otros_usd
        )
        return self.total_usd
    
    def __str__(self):
        return f"{self.cotizacion.numero_cotizacion} - {self.nombre} (${self.total_usd})"


class QuoteLineItem(models.Model):
    """Líneas de detalle de costos para cada escenario de cotización"""
    CATEGORY_CHOICES = [
        ('flete', _('Flete Internacional')),
        ('seguro', _('Seguro de Carga')),
        ('arancel', _('Aranceles')),
        ('iva', _('IVA')),
        ('fodinfa', _('FODINFA')),
        ('ice', _('ICE')),
        ('salvaguardia', _('Salvaguardia')),
        ('agenciamiento', _('Agenciamiento Aduanero')),
        ('transporte_interno', _('Transporte Interno')),
        ('almacenaje', _('Almacenaje')),
        ('handling', _('Handling/Manipuleo')),
        ('documentacion', _('Documentación')),
        ('otros', _('Otros')),
    ]
    
    escenario = models.ForeignKey(
        QuoteScenario,
        on_delete=models.CASCADE,
        related_name='lineas',
        verbose_name=_('Escenario')
    )
    
    categoria = models.CharField(_('Categoría'), max_length=30, choices=CATEGORY_CHOICES)
    descripcion = models.CharField(_('Descripción'), max_length=255)
    cantidad = models.DecimalField(_('Cantidad'), max_digits=12, decimal_places=2, default=Decimal('1'))
    precio_unitario_usd = models.DecimalField(_('Precio Unitario (USD)'), max_digits=12, decimal_places=4)
    subtotal_usd = models.DecimalField(_('Subtotal (USD)'), max_digits=12, decimal_places=2)
    
    es_estimado = models.BooleanField(_('Es Estimado'), default=False)
    notas = models.TextField(_('Notas'), blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Línea de Cotización')
        verbose_name_plural = _('Líneas de Cotización')
        ordering = ['categoria', 'created_at']
    
    def save(self, *args, **kwargs):
        self.subtotal_usd = self.cantidad * self.precio_unitario_usd
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.categoria}: {self.descripcion} - ${self.subtotal_usd}"


class FreightRate(models.Model):
    """Tarifas de flete internacional (aéreo, marítimo)"""
    TRANSPORT_CHOICES = [
        ('aereo', 'Aéreo'),
        ('maritimo_lcl', 'Marítimo LCL'),
        ('fcl_20gp', 'FCL 1x20GP'),
        ('fcl_40gp', 'FCL 1x40GP'),
        ('fcl_40hc', 'FCL 1x40HC'),
        ('fcl_40nor', 'FCL 1x40NOR'),
        ('fcl_20_reefer', 'FCL 1x20 REEFER'),
        ('fcl_40_reefer', 'FCL 1x40 REEFER'),
        ('fcl_40_ot_hc', 'FCL 1x40 OT HC'),
        ('fcl_20_flat_rack', 'FCL 1x20 FLAT RACK'),
        ('fcl_40_flat_rack', 'FCL 1x40 FLAT RACK'),
        ('fcl_40_open_top', 'FCL 1x40 OPEN TOP'),
        ('fcl_20_open_top', 'FCL 1x20 OPEN TOP'),
    ]
    
    UNIT_CHOICES = [
        ('kg', 'Por Kilogramo'),
        ('cbm', 'Por Metro Cúbico'),
        ('container', 'Por Contenedor'),
        ('shipment', 'Por Embarque'),
    ]
    
    origin_country = models.CharField(_('País Origen'), max_length=100, db_index=True)
    origin_port = models.CharField(_('Puerto/Aeropuerto Origen'), max_length=100, db_index=True)
    destination_country = models.CharField(_('País Destino'), max_length=100, default='Ecuador')
    destination_port = models.CharField(_('Puerto/Aeropuerto Destino'), max_length=100, db_index=True)
    
    transport_type = models.CharField(_('Tipo de Transporte'), max_length=30, choices=TRANSPORT_CHOICES, db_index=True)
    
    rate_usd = models.DecimalField(_('Tarifa (USD)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    unit = models.CharField(_('Unidad'), max_length=20, choices=UNIT_CHOICES)
    min_rate_usd = models.DecimalField(_('Tarifa Mínima (USD)'), max_digits=12, decimal_places=2, null=True, blank=True)
    
    carrier_name = models.CharField(_('Naviera/Aerolínea'), max_length=255, blank=True)
    transit_days_min = models.IntegerField(_('Días Tránsito Mín'), null=True, blank=True)
    transit_days_max = models.IntegerField(_('Días Tránsito Máx'), null=True, blank=True)
    
    valid_from = models.DateField(_('Válido Desde'))
    valid_until = models.DateField(_('Válido Hasta'))
    is_active = models.BooleanField(_('Activa'), default=True, db_index=True)
    
    notes = models.TextField(_('Notas'), blank=True)
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='freight_rates',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Tarifa de Flete')
        verbose_name_plural = _('Tarifas de Flete')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['origin_port', 'destination_port', 'transport_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.origin_port} → {self.destination_port} ({self.get_transport_type_display()}) - USD {self.rate_usd}/{self.unit}"


class InsuranceRate(models.Model):
    """Tarifas de seguro de carga"""
    COVERAGE_CHOICES = [
        ('basico', 'Cobertura Básica'),
        ('ampliada', 'Cobertura Ampliada'),
        ('todo_riesgo', 'Todo Riesgo'),
    ]
    
    name = models.CharField(_('Nombre'), max_length=255)
    coverage_type = models.CharField(_('Tipo de Cobertura'), max_length=30, choices=COVERAGE_CHOICES)
    
    rate_percentage = models.DecimalField(_('Tasa (%)'), max_digits=5, decimal_places=3, validators=[MinValueValidator(Decimal('0.001'))])
    min_premium_usd = models.DecimalField(_('Prima Mínima (USD)'), max_digits=12, decimal_places=2, default=Decimal('25.00'))
    
    deductible_percentage = models.DecimalField(_('Deducible (%)'), max_digits=5, decimal_places=2, default=Decimal('0'))
    
    insurance_company = models.CharField(_('Aseguradora'), max_length=255, blank=True)
    policy_number = models.CharField(_('Número de Póliza'), max_length=100, blank=True)
    
    valid_from = models.DateField(_('Válido Desde'))
    valid_until = models.DateField(_('Válido Hasta'))
    is_active = models.BooleanField(_('Activa'), default=True, db_index=True)
    
    notes = models.TextField(_('Notas'), blank=True)
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='insurance_rates',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Tarifa de Seguro')
        verbose_name_plural = _('Tarifas de Seguro')
        ordering = ['-created_at']
    
    def calculate_premium(self, cargo_value):
        """Calcula la prima del seguro basada en el valor de la mercancía"""
        premium = cargo_value * (self.rate_percentage / Decimal('100'))
        return max(premium, self.min_premium_usd)
    
    def __str__(self):
        return f"{self.name} ({self.get_coverage_type_display()}) - {self.rate_percentage}%"


class CustomsDutyRate(models.Model):
    """Tarifas arancelarias y tributos aduaneros de Ecuador (SENAE)"""
    hs_code = models.CharField(_('Código HS'), max_length=12, db_index=True, help_text=_('Código arancelario a 6, 8 o 10 dígitos'))
    description = models.TextField(_('Descripción del Producto'))
    
    ad_valorem_percentage = models.DecimalField(_('Ad Valorem (%)'), max_digits=5, decimal_places=2, default=Decimal('0'))
    iva_percentage = models.DecimalField(_('IVA (%)'), max_digits=5, decimal_places=2, default=Decimal('15'))
    fodinfa_percentage = models.DecimalField(_('FODINFA (%)'), max_digits=5, decimal_places=3, default=Decimal('0.5'))
    ice_percentage = models.DecimalField(_('ICE (%)'), max_digits=5, decimal_places=2, default=Decimal('0'))
    salvaguardia_percentage = models.DecimalField(_('Salvaguardia (%)'), max_digits=5, decimal_places=2, default=Decimal('0'))
    
    specific_duty_usd = models.DecimalField(_('Arancel Específico (USD/unidad)'), max_digits=12, decimal_places=4, default=Decimal('0'))
    specific_duty_unit = models.CharField(_('Unidad Específica'), max_length=50, blank=True, help_text=_('kg, litro, unidad, etc.'))
    
    requires_import_license = models.BooleanField(_('Requiere Licencia'), default=False)
    requires_phytosanitary = models.BooleanField(_('Requiere Fitosanitario'), default=False)
    requires_inen_certification = models.BooleanField(_('Requiere INEN'), default=False)
    
    notes = models.TextField(_('Notas'), blank=True)
    
    valid_from = models.DateField(_('Válido Desde'))
    valid_until = models.DateField(_('Válido Hasta'), null=True, blank=True)
    is_active = models.BooleanField(_('Activa'), default=True, db_index=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Tarifa Arancelaria')
        verbose_name_plural = _('Tarifas Arancelarias')
        ordering = ['hs_code']
        indexes = [
            models.Index(fields=['hs_code', 'is_active']),
        ]
    
    def calculate_duties(self, cif_value_usd, quantity=1):
        """Calcula todos los tributos aduaneros sobre el valor CIF"""
        ad_valorem = cif_value_usd * (self.ad_valorem_percentage / Decimal('100'))
        fodinfa = cif_value_usd * (self.fodinfa_percentage / Decimal('100'))
        specific_duty = self.specific_duty_usd * Decimal(quantity)
        
        base_iva = cif_value_usd + ad_valorem + fodinfa + specific_duty
        iva = base_iva * (self.iva_percentage / Decimal('100'))
        ice = base_iva * (self.ice_percentage / Decimal('100'))
        salvaguardia = cif_value_usd * (self.salvaguardia_percentage / Decimal('100'))
        
        return {
            'ad_valorem': ad_valorem,
            'fodinfa': fodinfa,
            'specific_duty': specific_duty,
            'salvaguardia': salvaguardia,
            'ice': ice,
            'iva': iva,
            'total': ad_valorem + fodinfa + specific_duty + salvaguardia + ice + iva,
        }
    
    def __str__(self):
        return f"{self.hs_code} - {self.description[:50]}"


class InlandTransportQuoteRate(models.Model):
    """Tarifas de transporte terrestre interno en Ecuador para cotizaciones"""
    VEHICLE_CHOICES = [
        ('camion_pequeno', 'Camión Pequeño (hasta 3 ton)'),
        ('camion_mediano', 'Camión Mediano (3-8 ton)'),
        ('camion_grande', 'Camión Grande (8-20 ton)'),
        ('trailer', 'Tráiler (20-30 ton)'),
        ('contenedor_20', 'Contenedor 20 pies'),
        ('contenedor_40', 'Contenedor 40 pies'),
    ]
    
    origin_city = models.CharField(_('Ciudad Origen'), max_length=100, db_index=True)
    destination_city = models.CharField(_('Ciudad Destino'), max_length=100, db_index=True)
    vehicle_type = models.CharField(_('Tipo de Vehículo'), max_length=30, choices=VEHICLE_CHOICES)
    
    rate_usd = models.DecimalField(_('Tarifa (USD)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    rate_per_kg_usd = models.DecimalField(_('Tarifa por kg (USD)'), max_digits=8, decimal_places=4, null=True, blank=True)
    
    estimated_hours = models.IntegerField(_('Horas Estimadas'), null=True, blank=True)
    distance_km = models.IntegerField(_('Distancia (km)'), null=True, blank=True)
    
    includes_loading = models.BooleanField(_('Incluye Carga'), default=False)
    includes_unloading = models.BooleanField(_('Incluye Descarga'), default=False)
    
    carrier_name = models.CharField(_('Transportista'), max_length=255, blank=True)
    
    valid_from = models.DateField(_('Válido Desde'))
    valid_until = models.DateField(_('Válido Hasta'))
    is_active = models.BooleanField(_('Activa'), default=True, db_index=True)
    
    notes = models.TextField(_('Notas'), blank=True)
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='inland_transport_quote_rates',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Tarifa de Transporte Terrestre (Cotización)')
        verbose_name_plural = _('Tarifas de Transporte Terrestre (Cotización)')
        ordering = ['origin_city', 'destination_city']
        indexes = [
            models.Index(fields=['origin_city', 'destination_city', 'vehicle_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.origin_city} → {self.destination_city} ({self.get_vehicle_type_display()}) - USD {self.rate_usd}"


class CustomsBrokerageRate(models.Model):
    """Tarifas de agenciamiento aduanero"""
    SERVICE_CHOICES = [
        ('importacion_general', 'Importación General'),
        ('importacion_courier', 'Importación Courier'),
        ('importacion_menaje', 'Importación Menaje'),
        ('exportacion', 'Exportación'),
        ('transito', 'Tránsito'),
        ('reexportacion', 'Reexportación'),
    ]
    
    name = models.CharField(_('Nombre del Servicio'), max_length=255)
    service_type = models.CharField(_('Tipo de Servicio'), max_length=30, choices=SERVICE_CHOICES)
    
    fixed_rate_usd = models.DecimalField(_('Tarifa Fija (USD)'), max_digits=12, decimal_places=2, default=Decimal('150'))
    percentage_rate = models.DecimalField(_('Tarifa Variable (%)'), max_digits=5, decimal_places=3, default=Decimal('0'), help_text=_('Porcentaje sobre valor CIF'))
    min_rate_usd = models.DecimalField(_('Tarifa Mínima (USD)'), max_digits=12, decimal_places=2, default=Decimal('150'))
    
    includes_aforo = models.BooleanField(_('Incluye Aforo'), default=True)
    includes_transmision = models.BooleanField(_('Incluye Transmisión'), default=True)
    includes_almacenaje = models.BooleanField(_('Incluye Gestión Almacenaje'), default=False)
    
    valid_from = models.DateField(_('Válido Desde'))
    valid_until = models.DateField(_('Válido Hasta'))
    is_active = models.BooleanField(_('Activa'), default=True, db_index=True)
    
    notes = models.TextField(_('Notas'), blank=True)
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customs_brokerage_rates',
        verbose_name=_('Propietario'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Tarifa de Agenciamiento Aduanero')
        verbose_name_plural = _('Tarifas de Agenciamiento Aduanero')
        ordering = ['-created_at']
    
    def calculate_fee(self, cif_value_usd):
        """Calcula el honorario de agenciamiento"""
        variable_fee = cif_value_usd * (self.percentage_rate / Decimal('100'))
        total_fee = self.fixed_rate_usd + variable_fee
        return max(total_fee, self.min_rate_usd)
    
    def __str__(self):
        return f"{self.name} ({self.get_service_type_display()}) - USD {self.fixed_rate_usd}"


class Shipment(models.Model):
    """Embarques en tránsito - seguimiento de carga desde origen hasta destino"""
    TRANSPORT_CHOICES = [
        ('aereo', _('Aéreo')),
        ('maritimo', _('Marítimo')),
        ('terrestre', _('Terrestre')),
    ]
    
    STATUS_CHOICES = [
        ('booking_confirmado', _('Booking Confirmado')),
        ('recogido_origen', _('Recogido en Origen')),
        ('en_transito_internacional', _('En Tránsito Internacional')),
        ('arribo_puerto', _('Arribo a Puerto/Aeropuerto')),
        ('en_aduana', _('En Proceso Aduanero')),
        ('liberado', _('Liberado de Aduana')),
        ('en_transito_interno', _('En Tránsito Interno')),
        ('entregado', _('Entregado')),
        ('incidencia', _('Con Incidencia')),
    ]
    
    tracking_number = models.CharField(_('Número de Tracking'), max_length=50, unique=True)
    cotizacion = models.ForeignKey(
        'LeadCotizacion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments',
        verbose_name=_('Cotización')
    )
    lead_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shipments',
        verbose_name=_('Usuario Lead')
    )
    
    transport_type = models.CharField(_('Tipo de Transporte'), max_length=20, choices=TRANSPORT_CHOICES)
    carrier_name = models.CharField(_('Transportista/Naviera'), max_length=255)
    bl_awb_number = models.CharField(_('BL/AWB'), max_length=50, blank=True)
    container_number = models.CharField(_('Número de Contenedor'), max_length=50, blank=True)
    
    origin_country = models.CharField(_('País Origen'), max_length=100)
    origin_city = models.CharField(_('Ciudad Origen'), max_length=100)
    destination_country = models.CharField(_('País Destino'), max_length=100, default='Ecuador')
    destination_city = models.CharField(_('Ciudad Destino'), max_length=100)
    
    description = models.TextField(_('Descripción de Mercancía'))
    weight_kg = models.DecimalField(_('Peso (kg)'), max_digits=12, decimal_places=2)
    packages = models.IntegerField(_('Número de Bultos'), default=1)
    
    estimated_departure = models.DateField(_('Fecha Salida Estimada'), null=True, blank=True)
    actual_departure = models.DateField(_('Fecha Salida Real'), null=True, blank=True)
    estimated_arrival = models.DateField(_('Fecha Llegada Estimada'), null=True, blank=True)
    actual_arrival = models.DateField(_('Fecha Llegada Real'), null=True, blank=True)
    estimated_delivery = models.DateField(_('Fecha Entrega Estimada'), null=True, blank=True)
    actual_delivery = models.DateField(_('Fecha Entrega Real'), null=True, blank=True)
    
    current_status = models.CharField(_('Estado Actual'), max_length=30, choices=STATUS_CHOICES, default='booking_confirmado')
    current_location = models.CharField(_('Ubicación Actual'), max_length=255, blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Embarque')
        verbose_name_plural = _('Embarques')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tracking_number']),
            models.Index(fields=['lead_user', 'current_status']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = self.generate_tracking_number()
        super().save(*args, **kwargs)
    
    def generate_tracking_number(self):
        """Generate unique tracking number: IYA-YYYYMMDD-XXXX"""
        from django.utils import timezone
        import random
        date_str = timezone.now().strftime('%Y%m%d')
        random_suffix = ''.join([str(random.randint(0, 9)) for _ in range(4)])
        return f"IYA-{date_str}-{random_suffix}"
    
    def __str__(self):
        return f"{self.tracking_number} - {self.get_current_status_display()}"


class ShipmentTracking(models.Model):
    """Historial de eventos de tracking para un embarque"""
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='tracking_events',
        verbose_name=_('Embarque')
    )
    
    status = models.CharField(_('Estado'), max_length=30, choices=Shipment.STATUS_CHOICES)
    location = models.CharField(_('Ubicación'), max_length=255)
    description = models.TextField(_('Descripción del Evento'))
    
    event_datetime = models.DateTimeField(_('Fecha y Hora del Evento'))
    created_at = models.DateTimeField(_('Fecha de Registro'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Evento de Tracking')
        verbose_name_plural = _('Eventos de Tracking')
        ordering = ['-event_datetime']
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.shipment.current_status = self.status
        self.shipment.current_location = self.location
        self.shipment.save(update_fields=['current_status', 'current_location', 'updated_at'])
    
    def __str__(self):
        return f"{self.shipment.tracking_number} - {self.get_status_display()} @ {self.location}"


class PreLiquidation(models.Model):
    """Pre-liquidación aduanera con clasificación de código HS"""
    cotizacion = models.ForeignKey(
        'LeadCotizacion',
        on_delete=models.CASCADE,
        related_name='pre_liquidations',
        verbose_name=_('Cotización')
    )
    
    product_description = models.TextField(_('Descripción del Producto'))
    suggested_hs_code = models.CharField(_('Código HS Sugerido'), max_length=12, blank=True)
    confirmed_hs_code = models.CharField(_('Código HS Confirmado'), max_length=12, blank=True)
    
    hs_code_confidence = models.DecimalField(_('Confianza IA (%)'), max_digits=5, decimal_places=2, null=True, blank=True)
    ai_reasoning = models.TextField(_('Razonamiento IA'), blank=True)
    
    fob_value_usd = models.DecimalField(_('Valor FOB (USD)'), max_digits=12, decimal_places=2)
    freight_usd = models.DecimalField(_('Flete (USD)'), max_digits=12, decimal_places=2)
    insurance_usd = models.DecimalField(_('Seguro (USD)'), max_digits=12, decimal_places=2)
    cif_value_usd = models.DecimalField(_('Valor CIF (USD)'), max_digits=12, decimal_places=2)
    
    ad_valorem_usd = models.DecimalField(_('Ad Valorem (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    fodinfa_usd = models.DecimalField(_('FODINFA (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    ice_usd = models.DecimalField(_('ICE (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    salvaguardia_usd = models.DecimalField(_('Salvaguardia (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    iva_usd = models.DecimalField(_('IVA (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    total_tributos_usd = models.DecimalField(_('Total Tributos (USD)'), max_digits=12, decimal_places=2, default=Decimal('0'))
    
    requires_permit = models.BooleanField(_('Requiere Permiso Previo'), default=False)
    permit_institucion = models.CharField(_('Institucion Permiso'), max_length=100, blank=True)
    permit_tipo = models.CharField(_('Tipo de Permiso'), max_length=255, blank=True)
    permit_descripcion = models.TextField(_('Descripcion Permiso'), blank=True)
    permit_tramite_previo = models.BooleanField(_('Tramite Previo al Embarque'), default=False)
    permit_tiempo_estimado = models.CharField(_('Tiempo Estimado Tramite'), max_length=100, blank=True)
    special_taxes = models.JSONField(_('Impuestos Especiales'), default=list, blank=True)
    ai_status = models.CharField(_('Estado IA'), max_length=50, blank=True)
    
    is_confirmed = models.BooleanField(_('Confirmada'), default=False)
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='confirmed_pre_liquidations',
        verbose_name=_('Confirmada Por')
    )
    confirmed_at = models.DateTimeField(_('Fecha de Confirmación'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Pre-Liquidación')
        verbose_name_plural = _('Pre-Liquidaciones')
        ordering = ['-created_at']
    
    def calculate_cif(self):
        """Calculate CIF value from FOB + Freight + Insurance"""
        self.cif_value_usd = self.fob_value_usd + self.freight_usd + self.insurance_usd
        return self.cif_value_usd
    
    def calculate_duties(self):
        """Calculate duties based on confirmed HS code"""
        if not self.confirmed_hs_code:
            return None
        
        try:
            duty_rate = CustomsDutyRate.objects.get(hs_code=self.confirmed_hs_code, is_active=True)
            duties = duty_rate.calculate_duties(self.cif_value_usd)
            
            self.ad_valorem_usd = duties['ad_valorem']
            self.fodinfa_usd = duties['fodinfa']
            self.ice_usd = duties['ice']
            self.salvaguardia_usd = duties['salvaguardia']
            self.iva_usd = duties['iva']
            self.total_tributos_usd = duties['total']
            
            return duties
        except CustomsDutyRate.DoesNotExist:
            return None
    
    def __str__(self):
        return f"Pre-Liq {self.cotizacion.numero_cotizacion} - HS {self.confirmed_hs_code or self.suggested_hs_code}"


class LogisticsProvider(models.Model):
    """Proveedor logístico (navieras, consolidadores, aerolíneas)"""
    TRANSPORT_TYPE_CHOICES = [
        ('FCL', _('Marítimo FCL')),
        ('LCL', _('Marítimo LCL')),
        ('AEREO', _('Aéreo')),
    ]
    
    name = models.CharField(_('Nombre del Proveedor'), max_length=255)
    code = models.CharField(_('Código'), max_length=20, unique=True, help_text=_('Código corto único: MSC, DHL, etc.'))
    transport_type = models.CharField(_('Tipo de Transporte'), max_length=10, choices=TRANSPORT_TYPE_CHOICES, db_index=True)
    
    contact_name = models.CharField(_('Nombre de Contacto'), max_length=255, blank=True)
    contact_email = models.EmailField(_('Email de Contacto'), blank=True)
    contact_phone = models.CharField(_('Teléfono de Contacto'), max_length=50, blank=True)
    
    website = models.URLField(_('Sitio Web'), blank=True)
    notes = models.TextField(_('Notas'), blank=True)
    
    priority = models.PositiveIntegerField(_('Prioridad'), default=5, help_text=_('1-10, donde 1 es máxima prioridad'))
    is_active = models.BooleanField(_('Activo'), default=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Proveedor Logístico')
        verbose_name_plural = _('Proveedores Logísticos')
        ordering = ['transport_type', 'priority', 'name']
        indexes = [
            models.Index(fields=['transport_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_transport_type_display()})"


class ProviderRate(models.Model):
    """Tarifas por proveedor, ruta y tipo de contenedor/carga"""
    DESTINATION_MARITIME_CHOICES = [
        ('GYE', _('Guayaquil')),
        ('PSJ', _('Posorja DPWorld')),
    ]
    
    DESTINATION_AIR_CHOICES = [
        ('GYE', _('Guayaquil - José Joaquín de Olmedo')),
        ('UIO', _('Quito - Mariscal Sucre')),
    ]
    
    CONTAINER_TYPE_CHOICES = [
        ('20GP', _('1x20GP - General Purpose')),
        ('40GP', _('1x40GP - General Purpose')),
        ('40HC', _('1x40HC - High Cube')),
        ('40NOR', _('1x40NOR - Non-Operating Reefer')),
        ('20RF', _('1x20RF - Reefer 20')),
        ('40RF', _('1x40RF - Reefer 40')),
        ('20OT', _('1x20OT - Open Top')),
        ('40OT', _('1x40OT - Open Top High Cube')),
        ('20FR', _('1x20FR - Flat Rack')),
        ('40FR', _('1x40FR - Flat Rack')),
        ('45HC', _('1x45HC - High Cube 45')),
    ]
    
    UNIT_CHOICES = [
        ('CONTAINER', _('Por Contenedor')),
        ('CBM', _('Por Metro Cúbico')),
        ('TON', _('Por Tonelada')),
        ('KG', _('Por Kilogramo')),
        ('WM', _('Por W/M (Mayor CBM o TON)')),
    ]
    
    provider = models.ForeignKey(
        LogisticsProvider,
        on_delete=models.CASCADE,
        related_name='rates',
        verbose_name=_('Proveedor')
    )
    
    origin_port = models.CharField(_('Puerto/Aeropuerto Origen'), max_length=100, help_text=_('Ej: SHANGHAI, MIAMI, MADRID'))
    origin_country = models.CharField(_('País Origen'), max_length=100)
    destination = models.CharField(_('Destino Ecuador'), max_length=10, help_text=_('GYE, PSJ para marítimo. GYE, UIO para aéreo.'))
    
    container_type = models.CharField(_('Tipo de Contenedor'), max_length=10, choices=CONTAINER_TYPE_CHOICES, blank=True, help_text=_('Solo para FCL'))
    
    rate_usd = models.DecimalField(_('Tarifa USD'), max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    unit = models.CharField(_('Unidad'), max_length=15, choices=UNIT_CHOICES, default='CONTAINER')
    
    transit_days_min = models.PositiveIntegerField(_('Días Tránsito Mínimo'), default=15)
    transit_days_max = models.PositiveIntegerField(_('Días Tránsito Máximo'), default=25)
    free_days = models.PositiveIntegerField(_('Días Libres Demora'), default=21, help_text=_('Días libres de almacenaje/demora'))
    
    thc_origin_usd = models.DecimalField(_('THC Origen USD'), max_digits=8, decimal_places=2, default=Decimal('0'))
    thc_destination_usd = models.DecimalField(_('THC Destino USD'), max_digits=8, decimal_places=2, default=Decimal('200'))
    
    valid_from = models.DateField(_('Válido Desde'))
    valid_to = models.DateField(_('Válido Hasta'))
    
    notes = models.TextField(_('Notas'), blank=True)
    is_active = models.BooleanField(_('Activo'), default=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Tarifa de Proveedor')
        verbose_name_plural = _('Tarifas de Proveedores')
        ordering = ['provider', 'origin_port', 'rate_usd']
        indexes = [
            models.Index(fields=['provider', 'origin_port', 'destination', 'is_active']),
            models.Index(fields=['valid_from', 'valid_to']),
        ]
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.provider.transport_type in ['FCL', 'LCL']:
            if self.destination not in ['GYE', 'PSJ']:
                raise ValidationError({'destination': _('Para transporte marítimo, el destino debe ser GYE o PSJ.')})
        elif self.provider.transport_type == 'AEREO':
            if self.destination not in ['GYE', 'UIO']:
                raise ValidationError({'destination': _('Para transporte aéreo, el destino debe ser GYE o UIO.')})
        
        if self.provider.transport_type == 'FCL' and not self.container_type:
            raise ValidationError({'container_type': _('El tipo de contenedor es requerido para FCL.')})
    
    def is_valid_today(self):
        from django.utils import timezone
        today = timezone.now().date()
        return self.valid_from <= today <= self.valid_to and self.is_active
    
    def __str__(self):
        container_info = f" - {self.container_type}" if self.container_type else ""
        return f"{self.provider.name}: {self.origin_port} → {self.destination}{container_info} @ USD {self.rate_usd}/{self.unit}"


class AirportRegion(models.Model):
    """
    Regions for organizing airports (e.g., Asia, Europe, Americas).
    """
    REGION_CHOICES = [
        ('ASIA', 'Asia'),
        ('EUROPA', 'Europa'),
        ('NORTEAMERICA', 'Norteamérica'),
        ('CENTROAMERICA', 'Centroamérica y Caribe'),
        ('SUDAMERICA', 'Sudamérica'),
        ('AFRICA', 'África'),
        ('OCEANIA', 'Oceanía'),
        ('MEDIO_ORIENTE', 'Medio Oriente'),
    ]
    
    code = models.CharField(_('Código'), max_length=20, unique=True)
    name = models.CharField(_('Nombre'), max_length=100)
    display_order = models.PositiveIntegerField(_('Orden de visualización'), default=0)
    is_active = models.BooleanField(_('Activo'), default=True)
    
    class Meta:
        verbose_name = _('Región de Aeropuertos')
        verbose_name_plural = _('Regiones de Aeropuertos')
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return self.name


class Airport(models.Model):
    """
    World airports database for ImportaYa.ia.
    Optimized for user search by ciudad_exacta and internal lookup by iata_code.
    
    Business Logic:
    - Users search by ciudad_exacta (user-friendly city names in Spanish)
    - System uses iata_code internally for freight rate lookups
    - Airports are organized by region and country for filtering
    """
    
    region = models.ForeignKey(
        AirportRegion,
        on_delete=models.PROTECT,
        related_name='airports',
        verbose_name=_('Región'),
        null=True,
        blank=True
    )
    region_name = models.CharField(_('Nombre de Región'), max_length=50, db_index=True)
    country = models.CharField(_('País'), max_length=100, db_index=True)
    ciudad_exacta = models.CharField(
        _('Ciudad Exacta'),
        max_length=150,
        db_index=True,
        help_text=_('Campo principal para búsqueda de usuarios')
    )
    name = models.CharField(_('Nombre del Aeropuerto'), max_length=200)
    iata_code = models.CharField(
        _('Código IATA'),
        max_length=3,
        unique=True,
        db_index=True,
        help_text=_('Código de 3 letras usado internamente para tarifas')
    )
    
    icao_code = models.CharField(_('Código ICAO'), max_length=4, blank=True, null=True)
    latitude = models.DecimalField(_('Latitud'), max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(_('Longitud'), max_digits=10, decimal_places=7, null=True, blank=True)
    timezone = models.CharField(_('Zona Horaria'), max_length=50, blank=True)
    
    is_major_hub = models.BooleanField(_('Hub Principal'), default=False)
    is_cargo_capable = models.BooleanField(_('Capacidad de Carga'), default=True)
    is_active = models.BooleanField(_('Activo'), default=True)
    
    notes = models.TextField(_('Notas'), blank=True)
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Aeropuerto')
        verbose_name_plural = _('Aeropuertos')
        ordering = ['region_name', 'country', 'ciudad_exacta']
        indexes = [
            models.Index(fields=['ciudad_exacta']),
            models.Index(fields=['iata_code']),
            models.Index(fields=['country', 'ciudad_exacta']),
            models.Index(fields=['region_name', 'country']),
            models.Index(fields=['is_active', 'is_cargo_capable']),
        ]
    
    def __str__(self):
        return f"{self.ciudad_exacta} ({self.iata_code}) - {self.name}"
    
    @classmethod
    def search_by_city(cls, query: str, limit: int = 10):
        """
        Search airports by ciudad_exacta (user search field).
        Returns airports matching the query, ordered by relevance.
        """
        from django.db.models import Q, Case, When, IntegerField
        
        query = query.strip()
        if not query:
            return cls.objects.none()
        
        results = cls.objects.filter(
            Q(ciudad_exacta__icontains=query) |
            Q(name__icontains=query) |
            Q(iata_code__iexact=query) |
            Q(country__icontains=query),
            is_active=True,
            is_cargo_capable=True
        ).annotate(
            relevance=Case(
                When(iata_code__iexact=query, then=1),
                When(ciudad_exacta__iexact=query, then=2),
                When(ciudad_exacta__istartswith=query, then=3),
                When(ciudad_exacta__icontains=query, then=4),
                When(name__icontains=query, then=5),
                default=6,
                output_field=IntegerField()
            )
        ).order_by('relevance', 'ciudad_exacta')[:limit]
        
        return results
    
    @classmethod
    def get_by_iata(cls, iata_code: str):
        """
        Get airport by IATA code (internal system lookup).
        """
        try:
            return cls.objects.get(iata_code=iata_code.upper(), is_active=True)
        except cls.DoesNotExist:
            return None


class ManualQuoteRequest(models.Model):
    """
    Solicitudes de cotización manual para contenedores especiales.
    
    Se activa cuando el LEAD selecciona contenedores que requieren
    cotización manual: REEFER, FLAT RACK, OPEN TOP.
    
    El MASTER ADMIN recibe la solicitud, ingresa los costos manualmente,
    y el sistema envía la cotización al LEAD.
    """
    STATUS_CHOICES = [
        ('pendiente', _('Pendiente')),
        ('asignada', _('Asignada a Agente')),
        ('en_proceso', _('En Proceso')),
        ('cotizacion_lista', _('Cotización Lista')),
        ('enviada', _('Enviada al Cliente')),
        ('aprobada', _('Aprobada')),
        ('rechazada', _('Rechazada')),
        ('expirada', _('Expirada')),
        ('cancelada', _('Cancelada')),
    ]
    
    CONTAINER_TYPES = [
        ('20RF', '1x20\' Reefer'),
        ('40RF', '1x40\' Reefer'),
        ('20FR', '1x20\' Flat Rack'),
        ('40FR', '1x40\' Flat Rack'),
        ('20OT', '1x20\' Open Top'),
        ('40OT', '1x40\' Open Top'),
    ]
    
    request_number = models.CharField(
        _('Número de Solicitud'),
        max_length=30,
        unique=True,
        null=True,
        blank=True,
        help_text=_('MQR-YYYYMMDD-XXXX')
    )
    
    quote_submission = models.ForeignKey(
        'QuoteSubmission',
        on_delete=models.CASCADE,
        related_name='manual_quote_requests',
        verbose_name=_('Solicitud de Cotización'),
        null=True,
        blank=True
    )
    lead = models.ForeignKey(
        'Lead',
        on_delete=models.CASCADE,
        related_name='manual_quote_requests',
        verbose_name=_('Lead'),
        null=True,
        blank=True
    )
    
    container_selection = models.JSONField(
        _('Selección de Contenedores'),
        default=list,
        help_text=_('Lista JSON: [{"tipo": "40RF", "cantidad": 2}]')
    )
    
    origin = models.CharField(_('Puerto/Ciudad Origen'), max_length=255)
    destination = models.CharField(_('Puerto/Ciudad Destino'), max_length=255)
    cargo_description = models.TextField(_('Descripción de Carga'))
    cargo_weight_kg = models.DecimalField(
        _('Peso Total (KG)'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    cargo_volume_cbm = models.DecimalField(
        _('Volumen Total (CBM)'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    special_requirements = models.TextField(
        _('Requisitos Especiales'),
        blank=True,
        help_text=_('Temperatura para REEFER, dimensiones especiales, etc.')
    )
    temperature_min = models.DecimalField(
        _('Temperatura Mínima (°C)'),
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True
    )
    temperature_max = models.DecimalField(
        _('Temperatura Máxima (°C)'),
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True
    )
    
    company_name = models.CharField(_('Empresa'), max_length=255)
    contact_name = models.CharField(_('Nombre de Contacto'), max_length=255)
    contact_email = models.EmailField(_('Email'))
    contact_phone = models.CharField(_('Teléfono'), max_length=50)
    contact_whatsapp = models.CharField(_('WhatsApp'), max_length=50, blank=True)
    
    status = models.CharField(
        _('Estado'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pendiente'
    )
    
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='assigned_manual_quotes',
        verbose_name=_('Asignado a'),
        null=True,
        blank=True
    )
    
    cost_freight_usd = models.DecimalField(
        _('Costo Flete (USD)'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    cost_local_charges_usd = models.DecimalField(
        _('Cargos Locales (USD)'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    cost_special_equipment_usd = models.DecimalField(
        _('Equipo Especial (USD)'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Genset, PTI, etc.')
    )
    cost_total_usd = models.DecimalField(
        _('Costo Total (USD)'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    profit_margin_usd = models.DecimalField(
        _('Margen de Ganancia (USD)'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('150.00')
    )
    final_price_usd = models.DecimalField(
        _('Precio Final (USD)'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    valid_until = models.DateField(_('Válido Hasta'), null=True, blank=True)
    transit_time_days = models.IntegerField(
        _('Tiempo de Tránsito (días)'),
        null=True,
        blank=True
    )
    provider_name = models.CharField(
        _('Naviera/Proveedor'),
        max_length=255,
        blank=True
    )
    
    internal_notes = models.TextField(
        _('Notas Internas'),
        blank=True,
        help_text=_('Solo visible para administradores')
    )
    customer_message = models.TextField(
        _('Mensaje al Cliente'),
        blank=True,
        help_text=_('Se incluirá en la cotización enviada')
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    assigned_at = models.DateTimeField(_('Fecha de Asignación'), null=True, blank=True)
    quoted_at = models.DateTimeField(_('Fecha de Cotización'), null=True, blank=True)
    sent_at = models.DateTimeField(_('Fecha de Envío'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Solicitud de Cotización Manual')
        verbose_name_plural = _('Solicitudes de Cotización Manual')
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.request_number:
            from django.utils import timezone
            today = timezone.now().strftime('%Y%m%d')
            count = ManualQuoteRequest.objects.filter(
                request_number__startswith=f'MQR-{today}'
            ).count() + 1
            self.request_number = f"MQR-{today}-{str(count).zfill(4)}"
        
        if self.cost_freight_usd and self.cost_local_charges_usd:
            self.cost_total_usd = (
                (self.cost_freight_usd or Decimal('0')) +
                (self.cost_local_charges_usd or Decimal('0')) +
                (self.cost_special_equipment_usd or Decimal('0'))
            )
            self.final_price_usd = self.cost_total_usd + self.profit_margin_usd
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        containers = ", ".join([
            f"{c.get('cantidad', 1)}x{c.get('tipo', '?')}"
            for c in (self.container_selection or [])
        ])
        return f"[{self.request_number}] {self.company_name} - {containers}"
    
    def get_container_summary(self) -> str:
        """Returns a human-readable container selection summary."""
        if not self.container_selection:
            return "Sin contenedores"
        
        parts = []
        for sel in self.container_selection:
            tipo = sel.get('tipo', '?')
            cantidad = sel.get('cantidad', 1)
            parts.append(f"{cantidad}x{tipo}")
        
        return " + ".join(parts)
    
    def calculate_eta_response(self) -> str:
        """Returns estimated response time message."""
        if self.status == 'pendiente':
            return "Tiempo estimado de respuesta: 2-3 días laborables"
        elif self.status in ['asignada', 'en_proceso']:
            return "Su solicitud está siendo procesada"
        elif self.status == 'cotizacion_lista':
            return "Cotización lista, pendiente de envío"
        elif self.status == 'enviada':
            return "Cotización enviada a su correo"
        else:
            return ""
    
    @property
    def days_pending(self) -> int:
        """Calculate days since request was created."""
        from django.utils import timezone
        return (timezone.now() - self.created_at).days
    
    @property
    def is_urgent(self) -> bool:
        """Flag if request is pending for more than 2 days."""
        return self.status == 'pendiente' and self.days_pending >= 2


class Port(models.Model):
    """
    Puertos Mundiales para origen de embarques marítimos.
    Utiliza el estándar UN/LOCODE para identificación única.
    """
    REGION_CHOICES = [
        ('Norteamérica', _('Norteamérica')),
        ('Latinoamérica', _('Latinoamérica')),
        ('Europa', _('Europa')),
        ('África', _('África')),
        ('Asia', _('Asia')),
        ('Oceanía', _('Oceanía')),
    ]
    
    un_locode = models.CharField(
        _('UN/LOCODE'),
        max_length=5,
        unique=True,
        db_index=True,
        help_text=_('Código UN/LOCODE del puerto (ej: USLAX)')
    )
    name = models.CharField(
        _('Nombre del Puerto'),
        max_length=255,
        db_index=True
    )
    country = models.CharField(
        _('País'),
        max_length=100,
        db_index=True
    )
    region = models.CharField(
        _('Región'),
        max_length=50,
        choices=REGION_CHOICES,
        db_index=True
    )
    is_active = models.BooleanField(
        _('Activo'),
        default=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Puerto')
        verbose_name_plural = _('Puertos')
        ordering = ['region', 'country', 'name']
        indexes = [
            models.Index(fields=['un_locode']),
            models.Index(fields=['name']),
            models.Index(fields=['country']),
            models.Index(fields=['region']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.un_locode}) - {self.country}"
    
    @classmethod
    def search_by_name(cls, query: str, limit: int = 20):
        """Busca puertos por nombre o país."""
        from django.db.models import Q
        return cls.objects.filter(
            Q(name__icontains=query) | 
            Q(country__icontains=query) |
            Q(un_locode__icontains=query),
            is_active=True
        )[:limit]
    
    @classmethod
    def get_by_region(cls, region: str):
        """Obtiene todos los puertos de una región."""
        return cls.objects.filter(region=region, is_active=True)


class ExchangeRate(models.Model):
    """
    Tasas de cambio para el sistema financiero logístico.
    USD es la moneda base (rate = 1.0).
    app_rate incluye el spread bancario para protección contra fluctuaciones.
    """
    CURRENCY_CHOICES = [
        ('USD', 'Dólar Estadounidense'),
        ('EUR', 'Euro'),
        ('GBP', 'Libra Esterlina'),
        ('CNY', 'Yuan Chino'),
        ('JPY', 'Yen Japonés'),
    ]
    
    currency_code = models.CharField(
        _('Código de Moneda'),
        max_length=3,
        primary_key=True,
        choices=CURRENCY_CHOICES,
        help_text=_('Código ISO 4217 de la moneda')
    )
    market_rate = models.DecimalField(
        _('Tasa de Mercado'),
        max_digits=12,
        decimal_places=6,
        default=Decimal('1.0'),
        validators=[MinValueValidator(Decimal('0.000001'))],
        help_text=_('Tasa de cambio del mercado (1 USD = X moneda)')
    )
    app_rate = models.DecimalField(
        _('Tasa de Aplicación'),
        max_digits=12,
        decimal_places=6,
        default=Decimal('1.0'),
        validators=[MinValueValidator(Decimal('0.000001'))],
        help_text=_('Tasa con spread bancario aplicado')
    )
    spread_applied = models.DecimalField(
        _('Spread Aplicado'),
        max_digits=5,
        decimal_places=4,
        default=Decimal('0.03'),
        validators=[MinValueValidator(Decimal('0.0'))],
        help_text=_('Spread bancario aplicado (ej: 0.03 = 3%)')
    )
    source = models.CharField(
        _('Fuente'),
        max_length=50,
        default='yfinance',
        help_text=_('Fuente de la tasa: yfinance, api, manual')
    )
    last_updated = models.DateTimeField(
        _('Última Actualización'),
        auto_now=True
    )
    is_active = models.BooleanField(
        _('Activo'),
        default=True
    )
    
    class Meta:
        verbose_name = _('Tasa de Cambio')
        verbose_name_plural = _('Tasas de Cambio')
        ordering = ['currency_code']
    
    def __str__(self):
        return f"{self.currency_code}: Market {self.market_rate:.4f} | App {self.app_rate:.4f}"
    
    def save(self, *args, **kwargs):
        if self.currency_code == 'USD':
            self.market_rate = Decimal('1.0')
            self.app_rate = Decimal('1.0')
            self.spread_applied = Decimal('0.0')
        super().save(*args, **kwargs)
    
    @classmethod
    def get_rate(cls, currency_code: str) -> 'ExchangeRate':
        """Obtiene la tasa de cambio para una moneda."""
        try:
            return cls.objects.get(currency_code=currency_code.upper(), is_active=True)
        except cls.DoesNotExist:
            return None


class CarrierContract(models.Model):
    """
    Contratos comerciales con navieras/carriers.
    Administrado por Master Admin para gestión de tarifas FCL.
    """
    ROUTE_TYPE_CHOICES = [
        ('DIRECTA', _('Ruta Directa')),
        ('TRASBORDO', _('Con Trasbordo')),
        ('PENDULO', _('Servicio Péndulo')),
    ]
    
    carrier_code = models.CharField(
        _('Código Naviera'),
        max_length=10,
        db_index=True,
        help_text=_('Código de la naviera (MSK, CMA, HPL, ONE, etc.)')
    )
    carrier_name = models.CharField(
        _('Nombre Naviera'),
        max_length=100,
        help_text=_('Nombre completo de la línea naviera')
    )
    free_demurrage_days = models.PositiveIntegerField(
        _('Días Libres Demora'),
        default=21,
        help_text=_('Días libres de demoraje en destino')
    )
    free_detention_days = models.PositiveIntegerField(
        _('Días Libres Detención'),
        default=14,
        help_text=_('Días libres de detención del contenedor')
    )
    contract_validity = models.DateField(
        _('Vigencia del Contrato'),
        help_text=_('Fecha hasta la cual la tarifa es válida')
    )
    route_type = models.CharField(
        _('Tipo de Ruta'),
        max_length=20,
        choices=ROUTE_TYPE_CHOICES,
        default='DIRECTA'
    )
    service_name = models.CharField(
        _('Nombre del Servicio'),
        max_length=100,
        blank=True,
        help_text=_('Nombre comercial del servicio (ej: AMEX, WCSA)')
    )
    departure_day = models.CharField(
        _('Día de Salida'),
        max_length=50,
        default='Semanal',
        help_text=_('Frecuencia de salida (ej: Lunes, Semanal)')
    )
    notes = models.TextField(
        _('Notas'),
        blank=True
    )
    is_active = models.BooleanField(
        _('Activo'),
        default=True
    )
    
    created_at = models.DateTimeField(_('Creado'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Actualizado'), auto_now=True)
    
    class Meta:
        verbose_name = _('Contrato de Naviera')
        verbose_name_plural = _('Contratos de Navieras')
        ordering = ['carrier_code', '-contract_validity']
        unique_together = ['carrier_code', 'contract_validity']
    
    def __str__(self):
        return f"{self.carrier_code} - {self.carrier_name} (válido hasta {self.contract_validity})"
    
    @classmethod
    def get_active_contract(cls, carrier_code: str):
        """Obtiene el contrato activo más reciente para una naviera."""
        from django.utils import timezone
        today = timezone.now().date()
        return cls.objects.filter(
            carrier_code=carrier_code.upper(),
            contract_validity__gte=today,
            is_active=True
        ).order_by('-contract_validity').first()


class TransitTimeAverage(models.Model):
    """
    Tiempos de tránsito históricos por ruta y naviera.
    Usado para generar estimaciones en cotizaciones.
    """
    pol = models.CharField(
        _('Puerto Origen (POL)'),
        max_length=10,
        db_index=True,
        help_text=_('Código UN/LOCODE del puerto de origen')
    )
    pol_name = models.CharField(
        _('Nombre Puerto Origen'),
        max_length=100,
        blank=True
    )
    pod = models.CharField(
        _('Puerto Destino (POD)'),
        max_length=10,
        db_index=True,
        help_text=_('Código UN/LOCODE del puerto de destino')
    )
    pod_name = models.CharField(
        _('Nombre Puerto Destino'),
        max_length=100,
        blank=True
    )
    carrier_code = models.CharField(
        _('Código Naviera'),
        max_length=10,
        db_index=True
    )
    estimated_days = models.CharField(
        _('Días Estimados'),
        max_length=20,
        help_text=_('Rango de días de tránsito (ej: 39-43)')
    )
    min_days = models.PositiveIntegerField(
        _('Días Mínimos'),
        null=True,
        blank=True
    )
    max_days = models.PositiveIntegerField(
        _('Días Máximos'),
        null=True,
        blank=True
    )
    last_updated = models.DateField(
        _('Última Actualización'),
        auto_now=True
    )
    is_active = models.BooleanField(
        _('Activo'),
        default=True
    )
    
    class Meta:
        verbose_name = _('Tiempo de Tránsito')
        verbose_name_plural = _('Tiempos de Tránsito')
        ordering = ['pol', 'pod', 'carrier_code']
        unique_together = ['pol', 'pod', 'carrier_code']
        indexes = [
            models.Index(fields=['pol', 'pod']),
            models.Index(fields=['carrier_code']),
        ]
    
    def __str__(self):
        return f"{self.pol} → {self.pod} ({self.carrier_code}): {self.estimated_days} días"
    
    def save(self, *args, **kwargs):
        if self.estimated_days and '-' in self.estimated_days:
            try:
                parts = self.estimated_days.split('-')
                self.min_days = int(parts[0].strip())
                self.max_days = int(parts[1].strip())
            except (ValueError, IndexError):
                pass
        super().save(*args, **kwargs)
    
    @classmethod
    def get_transit_time(cls, pol: str, pod: str, carrier_code: str = None):
        """
        Busca el tiempo de tránsito para una ruta.
        Si no encuentra con naviera específica, busca cualquier naviera en la ruta.
        """
        if carrier_code:
            result = cls.objects.filter(
                pol=pol.upper(),
                pod=pod.upper(),
                carrier_code=carrier_code.upper(),
                is_active=True
            ).first()
            if result:
                return result
        
        return cls.objects.filter(
            pol=pol.upper(),
            pod=pod.upper(),
            is_active=True
        ).first()


class FreightRateFCL(models.Model):
    """
    Tarifas de flete marítimo FCL con costos por tipo de contenedor.
    Diseñado para importación masiva desde CSV de proveedores.
    """
    transport_type = models.CharField(
        _('Tipo de Transporte'),
        max_length=20,
        default='MARITIMO FCL',
        editable=False
    )
    pol_name = models.CharField(
        _('Puerto de Origen (POL)'),
        max_length=100,
        db_index=True,
        help_text=_('Nombre del puerto de origen')
    )
    pod_name = models.CharField(
        _('Puerto de Destino (POD)'),
        max_length=100,
        db_index=True,
        help_text=_('Nombre del puerto de destino en Ecuador')
    )
    carrier_name = models.CharField(
        _('Naviera'),
        max_length=150,
        db_index=True
    )
    validity_date = models.DateField(
        _('Vigencia Hasta'),
        db_index=True,
        help_text=_('Fecha hasta la cual la tarifa es válida')
    )
    transit_time = models.CharField(
        _('Tiempo de Tránsito'),
        max_length=20,
        blank=True,
        help_text=_('Días estimados de tránsito (ej: 35-42)')
    )
    free_days = models.PositiveIntegerField(
        _('Días Libres'),
        default=21,
        help_text=_('Días libres de demora en destino')
    )
    currency = models.CharField(
        _('Moneda'),
        max_length=3,
        default='USD'
    )
    cost_20gp = models.DecimalField(
        _('Costo 20GP (USD)'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Costo base contenedor 20 pies estándar')
    )
    cost_40gp = models.DecimalField(
        _('Costo 40GP (USD)'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Costo base contenedor 40 pies estándar')
    )
    cost_40hc = models.DecimalField(
        _('Costo 40HC (USD)'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Costo base contenedor 40 pies High Cube')
    )
    cost_nor = models.DecimalField(
        _('Costo 40NOR (USD)'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Costo Non Operating Reefer (opcional)')
    )
    cost_lcl = models.DecimalField(
        _('Costo LCL (USD/W-M)'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Tarifa LCL por Ton/m3 (Weight/Measure)')
    )
    cost_45 = models.DecimalField(
        _('Tarifa +45KGS'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Tarifa aérea para +45 kg')
    )
    cost_100 = models.DecimalField(
        _('Tarifa +100KGS'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Tarifa aérea para +100 kg')
    )
    cost_300 = models.DecimalField(
        _('Tarifa +300KGS'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Tarifa aérea para +300 kg')
    )
    cost_500 = models.DecimalField(
        _('Tarifa +500KGS'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Tarifa aérea para +500 kg')
    )
    cost_1000 = models.DecimalField(
        _('Tarifa +1000KGS'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Tarifa aérea para +1000 kg')
    )
    routing = models.CharField(
        _('Routing'),
        max_length=100,
        blank=True,
        help_text=_('Ruta/Escalas del vuelo')
    )
    frequency = models.CharField(
        _('Frecuencia'),
        max_length=50,
        blank=True,
        help_text=_('Frecuencia de vuelo (ej: Daily, D135)')
    )
    packaging_type = models.CharField(
        _('Tipo Embalaje'),
        max_length=50,
        blank=True,
        help_text=_('Tipo de embalaje aceptado (carton, pallet)')
    )
    includes_thc = models.BooleanField(
        _('Incluye THC'),
        default=False,
        help_text=_('Indica si la tarifa incluye THC en origen')
    )
    agent_name = models.CharField(
        _('Agente'),
        max_length=150,
        blank=True
    )
    contract_number = models.CharField(
        _('Número de Contrato'),
        max_length=50,
        blank=True
    )
    is_active = models.BooleanField(
        _('Activo'),
        default=True,
        db_index=True
    )
    
    created_at = models.DateTimeField(_('Creado'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Actualizado'), auto_now=True)
    
    class Meta:
        verbose_name = _('Tarifa FCL')
        verbose_name_plural = _('Tarifas FCL')
        ordering = ['pol_name', 'pod_name', 'carrier_name', '-validity_date']
        indexes = [
            models.Index(fields=['pol_name', 'pod_name']),
            models.Index(fields=['carrier_name']),
            models.Index(fields=['validity_date', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.pol_name} → {self.pod_name} ({self.carrier_name}) - 20GP: ${self.cost_20gp}"
    
    @classmethod
    def get_best_rate(cls, pol: str, pod: str, container_type: str = '20GP'):
        """
        Obtiene la mejor tarifa vigente para una ruta y tipo de contenedor.
        """
        from django.utils import timezone
        today = timezone.now().date()
        
        cost_field = f'cost_{container_type.lower().replace(" ", "")}'
        
        return cls.objects.filter(
            pol_name__icontains=pol,
            pod_name__icontains=pod,
            validity_date__gte=today,
            is_active=True
        ).order_by(cost_field).first()


class ProfitMarginConfig(models.Model):
    """
    Configuración de márgenes de ganancia por tipo de transporte y rubro.
    Permite definir porcentajes o montos fijos de margen para cada concepto.
    """
    TRANSPORT_TYPE_CHOICES = [
        ('MARITIMO_FCL', _('Marítimo FCL')),
        ('MARITIMO_LCL', _('Marítimo LCL')),
        ('AEREO', _('Aéreo')),
        ('TERRESTRE', _('Terrestre')),
        ('ALL', _('Todos')),
    ]
    
    ITEM_TYPE_CHOICES = [
        ('FLETE', _('Flete Internacional')),
        ('THC_ORIGEN', _('THC Origen')),
        ('THC_DESTINO', _('THC Destino')),
        ('HANDLING', _('Handling')),
        ('DOC_FEE', _('Document Fee')),
        ('BL_FEE', _('BL Fee')),
        ('SEGURO', _('Seguro')),
        ('ALMACENAJE', _('Almacenaje')),
        ('TRANSPORTE_LOCAL', _('Transporte Local')),
        ('AGENCIAMIENTO', _('Agenciamiento Aduanero')),
        ('OTROS', _('Otros Gastos')),
        ('ALL', _('Todos los Rubros')),
    ]
    
    MARGIN_TYPE_CHOICES = [
        ('PERCENTAGE', _('Porcentaje')),
        ('FIXED', _('Monto Fijo')),
        ('MINIMUM', _('Mínimo Garantizado')),
    ]
    
    name = models.CharField(
        _('Nombre'),
        max_length=100,
        help_text=_('Nombre descriptivo de la configuración')
    )
    transport_type = models.CharField(
        _('Tipo de Transporte'),
        max_length=20,
        choices=TRANSPORT_TYPE_CHOICES,
        db_index=True
    )
    item_type = models.CharField(
        _('Tipo de Rubro'),
        max_length=30,
        choices=ITEM_TYPE_CHOICES,
        db_index=True
    )
    margin_type = models.CharField(
        _('Tipo de Margen'),
        max_length=20,
        choices=MARGIN_TYPE_CHOICES,
        default='PERCENTAGE'
    )
    margin_value = models.DecimalField(
        _('Valor del Margen'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Porcentaje (ej: 15.00) o monto fijo en USD')
    )
    minimum_margin = models.DecimalField(
        _('Margen Mínimo USD'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Margen mínimo garantizado en USD (aplica cuando margin_type=PERCENTAGE)')
    )
    priority = models.IntegerField(
        _('Prioridad'),
        default=10,
        help_text=_('Menor número = mayor prioridad. Usa esto para sobrescribir reglas generales.')
    )
    is_active = models.BooleanField(
        _('Activo'),
        default=True,
        db_index=True
    )
    notes = models.TextField(
        _('Notas'),
        blank=True
    )
    
    created_at = models.DateTimeField(_('Creado'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Actualizado'), auto_now=True)
    
    class Meta:
        verbose_name = _('Configuración de Margen')
        verbose_name_plural = _('Configuraciones de Márgenes')
        ordering = ['priority', 'transport_type', 'item_type']
        unique_together = ['transport_type', 'item_type', 'margin_type']
    
    def __str__(self):
        if self.margin_type == 'PERCENTAGE':
            return f"{self.name}: {self.margin_value}% ({self.transport_type}/{self.item_type})"
        return f"{self.name}: ${self.margin_value} ({self.transport_type}/{self.item_type})"
    
    @classmethod
    def get_margin_for_item(cls, transport_type: str, item_type: str) -> 'ProfitMarginConfig':
        """
        Obtiene la configuración de margen aplicable para un tipo de transporte y rubro.
        Busca primero configuración específica, luego general.
        """
        config = cls.objects.filter(
            transport_type=transport_type,
            item_type=item_type,
            is_active=True
        ).order_by('priority').first()
        
        if not config:
            config = cls.objects.filter(
                transport_type=transport_type,
                item_type='ALL',
                is_active=True
            ).order_by('priority').first()
        
        if not config:
            config = cls.objects.filter(
                transport_type='ALL',
                item_type=item_type,
                is_active=True
            ).order_by('priority').first()
        
        if not config:
            config = cls.objects.filter(
                transport_type='ALL',
                item_type='ALL',
                is_active=True
            ).order_by('priority').first()
        
        return config
    
    def calculate_margin(self, base_cost: Decimal) -> Decimal:
        """
        Calcula el margen a aplicar sobre un costo base.
        """
        if self.margin_type == 'FIXED':
            return self.margin_value
        elif self.margin_type == 'MINIMUM':
            return max(self.margin_value, Decimal('0.00'))
        else:
            calculated = (base_cost * self.margin_value / Decimal('100')).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            if self.minimum_margin:
                return max(calculated, self.minimum_margin)
            return calculated


class LocalDestinationCost(models.Model):
    """
    Catálogo de gastos locales estándar en destino (Ecuador).
    Incluye THC, handling, document fees, y otros gastos locales.
    """
    TRANSPORT_TYPE_CHOICES = [
        ('MARITIMO_FCL', _('Marítimo FCL')),
        ('MARITIMO_LCL', _('Marítimo LCL')),
        ('AEREO', _('Aéreo')),
        ('ALL', _('Todos')),
    ]
    
    COST_TYPE_CHOICES = [
        ('THC_DESTINO', _('THC Destino')),
        ('HANDLING', _('Handling')),
        ('DOC_FEE', _('Document Fee')),
        ('BL_FEE', _('BL Fee')),
        ('DESCONSOLIDACION', _('Desconsolidación')),
        ('ALMACENAJE_BASE', _('Almacenaje Base')),
        ('MOVILIZACION', _('Movilización')),
        ('INSPECCION', _('Inspección')),
        ('AFORO', _('Aforo')),
        ('TRANSMISION', _('Transmisión DAE')),
        ('OTROS', _('Otros')),
    ]
    
    PORT_CHOICES = [
        ('GYE', _('Guayaquil')),
        ('PSJ', _('Puerto Bolívar')),
        ('MEC', _('Manta')),
        ('ESM', _('Esmeraldas')),
        ('UIO', _('Quito (Aéreo)')),
        ('ALL', _('Todos los Puertos')),
    ]
    
    CONTAINER_TYPE_CHOICES = [
        ('20GP', '20GP'),
        ('40GP', '40GP'),
        ('40HC', '40HC'),
        ('40NOR', '40NOR'),
        ('LCL', 'LCL (por CBM/TON)'),
        ('KG', 'Por Kilogramo'),
        ('ALL', 'Todos'),
    ]
    
    name = models.CharField(
        _('Nombre'),
        max_length=100,
        help_text=_('Nombre descriptivo del gasto')
    )
    code = models.CharField(
        _('Código'),
        max_length=30,
        help_text=_('Código interno (ej: DTHC, HANDLING)')
    )
    transport_type = models.CharField(
        _('Tipo de Transporte'),
        max_length=20,
        choices=TRANSPORT_TYPE_CHOICES,
        db_index=True
    )
    cost_type = models.CharField(
        _('Tipo de Costo'),
        max_length=30,
        choices=COST_TYPE_CHOICES,
        db_index=True
    )
    port = models.CharField(
        _('Puerto/Aeropuerto'),
        max_length=10,
        choices=PORT_CHOICES,
        default='ALL'
    )
    container_type = models.CharField(
        _('Tipo Contenedor'),
        max_length=10,
        choices=CONTAINER_TYPE_CHOICES,
        default='ALL'
    )
    cost_usd = models.DecimalField(
        _('Costo USD'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    cost_per_unit = models.CharField(
        _('Por Unidad'),
        max_length=30,
        default='CONTENEDOR',
        help_text=_('CONTENEDOR, CBM, TON, KG, BL, etc.')
    )
    is_iva_exempt = models.BooleanField(
        _('Exento de IVA'),
        default=False,
        help_text=_('DTHC en FCL marítimo está exento de IVA')
    )
    exemption_reason = models.CharField(
        _('Razón Exención'),
        max_length=200,
        blank=True
    )
    is_mandatory = models.BooleanField(
        _('Obligatorio'),
        default=True,
        help_text=_('Si es obligatorio incluir en toda cotización')
    )
    is_active = models.BooleanField(
        _('Activo'),
        default=True,
        db_index=True
    )
    validity_start = models.DateField(
        _('Vigencia Desde'),
        null=True,
        blank=True
    )
    validity_end = models.DateField(
        _('Vigencia Hasta'),
        null=True,
        blank=True
    )
    notes = models.TextField(
        _('Notas'),
        blank=True
    )
    
    created_at = models.DateTimeField(_('Creado'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Actualizado'), auto_now=True)
    
    class Meta:
        verbose_name = _('Gasto Local en Destino')
        verbose_name_plural = _('Gastos Locales en Destino')
        ordering = ['transport_type', 'cost_type', 'port']
    
    def __str__(self):
        return f"{self.code}: ${self.cost_usd} ({self.transport_type}/{self.port})"
    
    @classmethod
    def get_local_costs(cls, transport_type: str, port: str = 'GYE', container_type: str = None):
        """
        Obtiene todos los gastos locales aplicables para un tipo de transporte y puerto.
        """
        from django.utils import timezone
        from django.db.models import Q
        today = timezone.now().date()
        
        filters = Q(is_active=True) & (
            Q(transport_type=transport_type) | Q(transport_type='ALL')
        ) & (
            Q(port=port) | Q(port='ALL')
        )
        
        if container_type:
            filters &= Q(container_type=container_type) | Q(container_type='ALL')
        
        filters &= (
            Q(validity_start__isnull=True) | Q(validity_start__lte=today)
        ) & (
            Q(validity_end__isnull=True) | Q(validity_end__gte=today)
        )
        
        return cls.objects.filter(filters).order_by('cost_type')
    
    @classmethod
    def calculate_total_local_costs(cls, transport_type: str, port: str = 'GYE', 
                                     container_type: str = None, quantity: int = 1,
                                     cbm: Decimal = None, weight_kg: Decimal = None):
        """
        Calcula el total de gastos locales para una cotización.
        Returns dict with items and totals.
        """
        costs = cls.get_local_costs(transport_type, port, container_type)
        
        items = []
        total_gravable = Decimal('0.00')
        total_exento = Decimal('0.00')
        
        for cost in costs:
            if cost.cost_per_unit == 'CONTENEDOR':
                monto = cost.cost_usd * quantity
            elif cost.cost_per_unit == 'CBM' and cbm:
                monto = cost.cost_usd * cbm
            elif cost.cost_per_unit == 'KG' and weight_kg:
                monto = cost.cost_usd * weight_kg
            elif cost.cost_per_unit == 'TON' and weight_kg:
                monto = cost.cost_usd * (weight_kg / Decimal('1000'))
            else:
                monto = cost.cost_usd * quantity
            
            item = {
                'codigo': cost.code,
                'descripcion': cost.name,
                'monto': float(monto),
                'moneda': 'USD',
                'is_iva_exempt': cost.is_iva_exempt,
                'exemption_reason': cost.exemption_reason
            }
            items.append(item)
            
            if cost.is_iva_exempt:
                total_exento += monto
            else:
                total_gravable += monto
        
        return {
            'items': items,
            'total_gravable': float(total_gravable),
            'total_exento': float(total_exento),
            'total': float(total_gravable + total_exento)
        }
