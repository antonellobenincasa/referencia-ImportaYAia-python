from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
import uuid

# --- MODELOS PRINCIPALES DEL CRM ---

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
    source = models.CharField(_('Fuente'), max_length=100, blank=True)
    notes = models.TextField(_('Notas'), blank=True)
    is_active_importer = models.BooleanField(_('¿Es importador actualmente?'), default=False)
    ruc = models.CharField(_('RUC'), max_length=13, blank=True)
    legal_type = models.CharField(_('Tipo Legal'), max_length=20, choices=[('natural', 'Persona Natural'), ('juridica', 'Persona Jurídica')], default='juridica')
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leads', verbose_name=_('Propietario'), null=True, blank=True)
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Lead')
        verbose_name_plural = _('Leads')
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.lead_number:
            count = Lead.objects.count() + 1
            self.lead_number = f"LEAD-{str(count).zfill(6)}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"[{self.lead_number}] {self.company_name}"

class Opportunity(models.Model):
    STAGE_CHOICES = [
        ('calificacion', _('Calificación')),
        ('propuesta', _('Propuesta')),
        ('negociacion', _('Negociación')),
        ('cerrado_ganado', _('Cerrado Ganado')),
        ('cerrado_perdido', _('Cerrado Perdido')),
    ]
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='opportunities')
    opportunity_name = models.CharField(_('Nombre de Oportunidad'), max_length=255)
    stage = models.CharField(_('Etapa'), max_length=20, choices=STAGE_CHOICES, default='calificacion')
    estimated_value = models.DecimalField(_('Valor Estimado (USD)'), max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    probability = models.IntegerField(_('Probabilidad (%)'), default=50)
    expected_close_date = models.DateField(_('Fecha Esperada de Cierre'), null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Oportunidad')
        verbose_name_plural = _('Oportunidades')

    def __str__(self):
        return f"{self.opportunity_name} - {self.lead.company_name}"

class Quote(models.Model):
    STATUS_CHOICES = [
        ('borrador', _('Borrador')),
        ('enviado', _('Enviado')),
        ('aceptado', _('Aceptado')),
        ('rechazado', _('Rechazado')),
    ]
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='quotes')
    quote_number = models.CharField(_('Número de Cotización'), max_length=50, unique=True)
    origin = models.CharField(_('Origen'), max_length=255)
    destination = models.CharField(_('Destino'), max_length=255)
    incoterm = models.CharField(_('Incoterm'), max_length=3)
    cargo_type = models.CharField(_('Tipo de Carga'), max_length=20)
    cargo_description = models.TextField(_('Descripción'), blank=True)
    base_rate = models.DecimalField(max_digits=12, decimal_places=2)
    profit_margin = models.DecimalField(max_digits=12, decimal_places=2)
    final_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='borrador')
    valid_until = models.DateField(null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Cotización Interna')
        verbose_name_plural = _('Cotizaciones Internas')

    def save(self, *args, **kwargs):
        if not self.quote_number:
            last = Quote.objects.last()
            num = last.id + 1 if last else 1
            self.quote_number = f"COT-{num:05d}"
        super().save(*args, **kwargs)

# --- MODELOS DE APOYO (TAREAS, REUNIONES, API) ---

class TaskReminder(models.Model):
    title = models.CharField(max_length=255)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, null=True)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, null=True)
    due_date = models.DateTimeField()
    status = models.CharField(max_length=20, default='pendiente')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)

class Meeting(models.Model):
    title = models.CharField(max_length=255)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE)
    meeting_datetime = models.DateTimeField()
    status = models.CharField(max_length=20, default='programada')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)

class APIKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    key = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)

class BulkLeadImport(models.Model):
    file = models.FileField(upload_to='bulk_imports/')
    status = models.CharField(max_length=20, default='pendiente')
    created_at = models.DateTimeField(auto_now_add=True)

# --- MODELOS DE COTIZACIÓN WEB/APP (EL CORAZÓN DE FLUTTER) ---

class QuoteSubmission(models.Model):
    STATUS_CHOICES = [
        ('recibida', _('Recibida')),
        ('validacion_pendiente', _('Validación Pendiente')),
        ('procesando_costos', _('Procesando Costos')),
        ('en_espera_ff', _('En Espera FF')),
        ('cotizacion_generada', _('Cotización Generada')),
        ('enviada', _('Enviada')),
        ('aprobada', _('Aprobada')),
        ('ro_generado', _('RO Generado')),
        ('en_transito', _('En Tránsito')),
    ]
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='quote_submissions', null=True, blank=True)
    origin = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    transport_type = models.CharField(max_length=20)
    cargo_description = models.TextField(blank=True)
    cargo_weight_kg = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cargo_volume_cbm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Datos de Producto para IA
    product_description = models.TextField(blank=True)
    fob_value_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Datos de Contacto
    company_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=50)
    city = models.CharField(max_length=100)
    company_ruc = models.CharField(max_length=13, blank=True)
    
    # Flags de control
    is_oce_registered = models.BooleanField(default=False)
    is_first_quote = models.BooleanField(default=True)
    vendor_validation_status = models.CharField(max_length=30, default='not_required')
    
    # Resultados IA
    ai_hs_code = models.CharField(max_length=20, blank=True)
    ai_response = models.TextField(blank=True)
    ai_status = models.CharField(max_length=30, blank=True)
    
    # Resultado Económico
    final_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    profit_markup = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('100.00'))
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='recibida')
    submission_number = models.CharField(max_length=30, unique=True, null=True, blank=True)
    
    # Transporte Interno
    needs_inland_transport = models.BooleanField(default=False)
    inland_transport_city = models.CharField(max_length=100, blank=True)
    inland_transport_address = models.TextField(blank=True)
    inland_transport_google_maps_link = models.URLField(max_length=500, blank=True)
    wants_armed_custody = models.BooleanField(default=False)
    wants_satellite_lock = models.BooleanField(default=False)
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Solicitud de Cotización')
        verbose_name_plural = _('Solicitudes de Cotización')

    def save(self, *args, **kwargs):
        if not self.submission_number:
            self.submission_number = f"QS-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
        
    def calculate_final_price(self):
        # Lógica simplificada para evitar errores si no hay costo base aun
        if hasattr(self, 'cost_rate') and self.cost_rate:
            self.final_price = self.cost_rate + self.profit_markup
        return self.final_price

class QuoteSubmissionDocument(models.Model):
    quote_submission = models.ForeignKey(QuoteSubmission, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, default='otro')
    file = models.FileField(upload_to='quote_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

# --- TARIFARIOS Y COSTOS (MOTORES DE CÁLCULO) ---

class CostRate(models.Model):
    origin = models.CharField(max_length=255, db_index=True)
    destination = models.CharField(max_length=255, db_index=True)
    transport_type = models.CharField(max_length=20, db_index=True)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    source = models.CharField(max_length=20, default='manual')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class FreightRate(models.Model):
    """Tarifas de flete detalladas"""
    transport_type = models.CharField(max_length=30, db_index=True)
    origin_port = models.CharField(max_length=100, db_index=True)
    destination_port = models.CharField(max_length=100, db_index=True)
    rate_usd = models.DecimalField(max_digits=12, decimal_places=2)
    unit = models.CharField(max_length=20)
    carrier_name = models.CharField(max_length=255, blank=True)
    transit_days_min = models.IntegerField(null=True)
    transit_days_max = models.IntegerField(null=True)
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class InsuranceRate(models.Model):
    name = models.CharField(max_length=255)
    rate_percentage = models.DecimalField(max_digits=5, decimal_places=3)
    min_premium_usd = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('25.00'))
    is_active = models.BooleanField(default=True)
    
    def calculate_premium(self, cargo_value):
        premium = cargo_value * (self.rate_percentage / Decimal('100'))
        return max(premium, self.min_premium_usd)

class CustomsDutyRate(models.Model):
    hs_code = models.CharField(max_length=12, db_index=True)
    description = models.TextField()
    ad_valorem_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    
    def calculate_duties(self, cif_value_usd):
        return {
            'ad_valorem': cif_value_usd * (self.ad_valorem_percentage / Decimal('100')),
            'total': cif_value_usd * (self.ad_valorem_percentage / Decimal('100')) # Simplificado
        }

class InlandTransportQuoteRate(models.Model):
    origin_city = models.CharField(max_length=100)
    destination_city = models.CharField(max_length=100)
    vehicle_type = models.CharField(max_length=30)
    rate_usd = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)

class CustomsBrokerageRate(models.Model):
    service_type = models.CharField(max_length=30)
    fixed_rate_usd = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    def calculate_fee(self, cif):
        return self.fixed_rate_usd

class InlandFCLTariff(models.Model):
    destination_city = models.CharField(max_length=100)
    container_type = models.CharField(max_length=20)
    rate_usd = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    @classmethod
    def get_rate_for_city(cls, city):
        return cls.objects.filter(destination_city__icontains=city, is_active=True).first()

class InlandSecurityTariff(models.Model):
    destination_city = models.CharField(max_length=100)
    service_type = models.CharField(max_length=30)
    base_rate_usd = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    @classmethod
    def get_rates_for_city(cls, city):
        return cls.objects.filter(destination_city__icontains=city, is_active=True)

# --- COTIZACIONES DE USUARIO LEAD (FRONTEND) ---

class LeadCotizacion(models.Model):
    numero_cotizacion = models.CharField(max_length=20, unique=True)
    lead_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lead_cotizaciones')
    quote_submission = models.ForeignKey(QuoteSubmission, on_delete=models.SET_NULL, null=True, blank=True)
    
    tipo_carga = models.CharField(max_length=20)
    origen_pais = models.CharField(max_length=100)
    destino_ciudad = models.CharField(max_length=100)
    descripcion_mercancia = models.TextField()
    peso_kg = models.DecimalField(max_digits=12, decimal_places=2)
    valor_mercancia_usd = models.DecimalField(max_digits=12, decimal_places=2)
    
    requiere_seguro = models.BooleanField(default=False)
    requiere_transporte_interno = models.BooleanField(default=False)
    
    # Costos desglosados
    flete_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    seguro_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    aduana_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    transporte_interno_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    otros_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    total_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    
    estado = models.CharField(max_length=20, default='pendiente')
    ro_number = models.CharField(max_length=20, null=True, blank=True)
    
    # Datos para RO
    shipper_name = models.CharField(max_length=255, blank=True)
    shipper_address = models.TextField(blank=True)
    consignee_name = models.CharField(max_length=255, blank=True)
    consignee_address = models.TextField(blank=True)
    notify_party = models.CharField(max_length=255, blank=True)
    fecha_embarque_estimada = models.DateField(null=True, blank=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Cotización de Lead')
        verbose_name_plural = _('Cotizaciones de Leads')

    def save(self, *args, **kwargs):
        if not self.numero_cotizacion:
            count = LeadCotizacion.objects.count() + 1
            self.numero_cotizacion = f"COTI-{count:05d}"
        super().save(*args, **kwargs)
        
    def generar_ro(self):
        if not self.ro_number:
            count = LeadCotizacion.objects.filter(ro_number__isnull=False).count() + 1
            self.ro_number = f"RO-{count:06d}"
            self.estado = 'ro_generado'
            self.save()
        return self.ro_number
    
    def aprobar(self):
        self.estado = 'aprobada'
        self.save()

class QuoteScenario(models.Model):
    cotizacion = models.ForeignKey(LeadCotizacion, on_delete=models.CASCADE, related_name='escenarios')
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, default='estandar')
    
    freight_rate = models.ForeignKey(FreightRate, on_delete=models.SET_NULL, null=True)
    insurance_rate = models.ForeignKey(InsuranceRate, on_delete=models.SET_NULL, null=True)
    brokerage_rate = models.ForeignKey(CustomsBrokerageRate, on_delete=models.SET_NULL, null=True)
    inland_transport_rate = models.ForeignKey(InlandTransportQuoteRate, on_delete=models.SET_NULL, null=True)
    
    flete_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    seguro_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    agenciamiento_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transporte_interno_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    otros_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    tiempo_transito_dias = models.IntegerField(null=True)
    is_selected = models.BooleanField(default=False)

class QuoteLineItem(models.Model):
    escenario = models.ForeignKey(QuoteScenario, on_delete=models.CASCADE, related_name='lineas')
    categoria = models.CharField(max_length=30)
    descripcion = models.CharField(max_length=255)
    cantidad = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    precio_unitario_usd = models.DecimalField(max_digits=12, decimal_places=4)
    subtotal_usd = models.DecimalField(max_digits=12, decimal_places=2)
    es_estimado = models.BooleanField(default=False)

# --- OPERACIONES Y TRACKING ---

class Shipment(models.Model):
    STATUS_CHOICES = [
        ('booking_confirmado', _('Booking Confirmado')),
        ('en_transito_internacional', _('En Tránsito')),
        ('arribo_puerto', _('Arribo')),
        ('entregado', _('Entregado')),
    ]
    tracking_number = models.CharField(max_length=50, unique=True)
    lead_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shipments')
    cotizacion = models.ForeignKey(LeadCotizacion, on_delete=models.SET_NULL, null=True, blank=True)
    
    transport_type = models.CharField(max_length=20)
    carrier_name = models.CharField(max_length=255)
    description = models.TextField()
    current_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='booking_confirmado')
    current_location = models.CharField(max_length=255, blank=True)
    
    estimated_arrival = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = f"TRK-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

class ShipmentTracking(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='tracking_events')
    status = models.CharField(max_length=30)
    location = models.CharField(max_length=255)
    description = models.TextField()
    event_datetime = models.DateTimeField()

class ShippingInstruction(models.Model):
    quote_submission = models.OneToOneField(QuoteSubmission, on_delete=models.CASCADE, related_name='shipping_instruction')
    ro_number = models.CharField(max_length=30, unique=True, null=True, blank=True)
    status = models.CharField(max_length=30, default='draft')
    
    shipper_name = models.CharField(max_length=255, blank=True)
    shipper_address = models.TextField(blank=True)
    shipper_contact = models.CharField(max_length=255, blank=True)
    shipper_email = models.EmailField(blank=True)
    shipper_phone = models.CharField(max_length=50, blank=True)
    
    consignee_name = models.CharField(max_length=255, blank=True)
    consignee_address = models.TextField(blank=True)
    consignee_tax_id = models.CharField(max_length=13, blank=True)
    consignee_contact = models.CharField(max_length=255, blank=True)
    consignee_email = models.EmailField(blank=True)
    consignee_phone = models.CharField(max_length=50, blank=True)
    
    notify_party_name = models.CharField(max_length=255, blank=True)
    
    origin_port = models.CharField(max_length=100, blank=True)
    destination_port = models.CharField(max_length=100, blank=True)
    cargo_description = models.TextField(blank=True)
    hs_codes = models.CharField(max_length=255, blank=True)
    gross_weight_kg = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    volume_cbm = models.DecimalField(max_digits=12, decimal_places=3, null=True)
    packages_count = models.IntegerField(null=True)
    packages_type = models.CharField(max_length=50, blank=True)
    container_numbers = models.TextField(blank=True)
    
    invoice_number = models.CharField(max_length=100, blank=True)
    invoice_value_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    incoterm = models.CharField(max_length=10, blank=True)
    
    ai_extracted_data = models.JSONField(default=dict, blank=True)
    is_ai_processed = models.BooleanField(default=False)
    
    assigned_ff_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_shipments')
    ff_assignment_date = models.DateTimeField(null=True)
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    finalized_at = models.DateTimeField(null=True)

class ShippingInstructionDocument(models.Model):
    shipping_instruction = models.ForeignKey(ShippingInstruction, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30)
    file = models.FileField(upload_to='shipping_instructions/')
    file_name = models.CharField(max_length=255, blank=True)
    ai_processed = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ShipmentMilestone(models.Model):
    shipping_instruction = models.ForeignKey(ShippingInstruction, on_delete=models.CASCADE, related_name='milestones')
    milestone_key = models.CharField(max_length=50)
    milestone_order = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default='PENDING')
    planned_date = models.DateTimeField(null=True, blank=True)
    actual_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    meta_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['milestone_order']
        
    @classmethod
    def create_initial_milestones(cls, shipping_instruction):
        milestones_data = [
            (1, 'SI_ENVIADA', 'SI Enviada'),
            (2, 'SI_RECIBIDA_FORWARDER', 'SI Recibida por Forwarder'),
            (3, 'SHIPPER_CONTACTADO', 'Shipper Contactado'),
            (4, 'BOOKING_ORDER_RECIBIDA', 'Booking Order Recibida'),
            (5, 'ETD_SOLICITADO', 'ETD Solicitado'),
            (6, 'BOOKING_CONFIRMADO', 'Booking Confirmado'),
            (7, 'SO_LIBERADO', 'S/O Liberado'),
            (8, 'RETIRO_CARGUE_VACIOS', 'Retiro Vacíos'),
            (9, 'CONTENEDORES_CARGADOS', 'Cargados'),
            (10, 'GATE_IN', 'Gate In'),
            (11, 'ETD', 'Zarpe (ETD)'),
            (12, 'ATD', 'Zarpe Real (ATD)'),
            (13, 'TRANSHIPMENT', 'Transbordo'),
            (14, 'ETA_DESTINO', 'Arribo (ETA)'),
        ]
        for order, key, label in milestones_data:
            cls.objects.create(
                shipping_instruction=shipping_instruction,
                milestone_key=key,
                milestone_order=order,
                status='PENDING'
            )
            
    @classmethod
    def get_current_milestone(cls, shipping_instruction):
        return cls.objects.filter(shipping_instruction=shipping_instruction, status='PENDING').first()

class PreLiquidation(models.Model):
    cotizacion = models.ForeignKey(LeadCotizacion, on_delete=models.CASCADE, null=True, blank=True)
    quote_submission = models.ForeignKey(QuoteSubmission, on_delete=models.CASCADE, null=True, blank=True)
    product_description = models.TextField()
    suggested_hs_code = models.CharField(max_length=25, blank=True)
    confirmed_hs_code = models.CharField(max_length=25, blank=True)
    
    fob_value_usd = models.DecimalField(max_digits=12, decimal_places=2)
    freight_usd = models.DecimalField(max_digits=12, decimal_places=2)
    insurance_usd = models.DecimalField(max_digits=12, decimal_places=2)
    cif_value_usd = models.DecimalField(max_digits=12, decimal_places=2)
    
    ad_valorem_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fodinfa_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ice_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salvaguardia_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_tributos_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    is_confirmed = models.BooleanField(default=False)
    confirmed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    confirmed_at = models.DateTimeField(null=True)
    
    assistance_requested = models.BooleanField(default=False)
    assistance_status = models.CharField(max_length=20, default='none')
    assistance_notes = models.TextField(blank=True)
    assistance_requested_at = models.DateTimeField(null=True)
    
    # Campos IA
    ai_reasoning = models.TextField(blank=True)
    ai_status = models.CharField(max_length=50, blank=True)
    requires_permit = models.BooleanField(default=False)
    permit_institucion = models.CharField(max_length=100, blank=True)
    permit_tipo = models.CharField(max_length=255, blank=True)
    permit_descripcion = models.TextField(blank=True)
    permit_tramite_previo = models.BooleanField(default=False)
    permit_tiempo_estimado = models.CharField(max_length=100, blank=True)
    special_taxes = models.JSONField(default=list, blank=True)

    def calculate_cif(self):
        self.cif_value_usd = (self.fob_value_usd or 0) + (self.freight_usd or 0) + (self.insurance_usd or 0)
        return self.cif_value_usd

class PreLiquidationDocument(models.Model):
    pre_liquidation = models.ForeignKey(PreLiquidation, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30)
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

# --- MASTER DATA (DATOS MAESTROS) ---

class LogisticsProvider(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    transport_type = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=5)

class ProviderRate(models.Model):
    provider = models.ForeignKey(LogisticsProvider, on_delete=models.CASCADE)
    origin_port = models.CharField(max_length=100)
    origin_country = models.CharField(max_length=100)
    destination = models.CharField(max_length=10)
    container_type = models.CharField(max_length=10, blank=True)
    rate_usd = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=15, default='CONTAINER')
    transit_days_min = models.IntegerField(default=15)
    transit_days_max = models.IntegerField(default=25)
    free_days = models.IntegerField(default=21)
    thc_origin_usd = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    thc_destination_usd = models.DecimalField(max_digits=8, decimal_places=2, default=200)
    valid_from = models.DateField()
    valid_to = models.DateField()
    is_active = models.BooleanField(default=True)

class AirportRegion(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

class Airport(models.Model):
    region = models.ForeignKey(AirportRegion, on_delete=models.PROTECT, null=True)
    region_name = models.CharField(max_length=50)
    country = models.CharField(max_length=100)
    ciudad_exacta = models.CharField(max_length=150)
    name = models.CharField(max_length=200)
    iata_code = models.CharField(max_length=3, unique=True)
    is_cargo_capable = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    
    @classmethod
    def search_by_city(cls, query, limit=10):
        from django.db.models import Q
        return cls.objects.filter(
            Q(ciudad_exacta__icontains=query) | Q(iata_code__icontains=query),
            is_active=True
        )[:limit]
    
    @classmethod
    def get_by_iata(cls, code):
        return cls.objects.filter(iata_code=code.upper(), is_active=True).first()

class Port(models.Model):
    name = models.CharField(max_length=255)
    country = models.CharField(max_length=100)
    un_locode = models.CharField(max_length=5, unique=True)
    region = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    
    @classmethod
    def search_by_name(cls, query, limit=20):
        from django.db.models import Q
        return cls.objects.filter(
            Q(name__icontains=query) | Q(un_locode__icontains=query),
            is_active=True
        )[:limit]
    
    @classmethod
    def get_by_region(cls, region):
        return cls.objects.filter(region=region, is_active=True)

class Container(models.Model):
    """
    Modelo para definir tipos de contenedores (20GP, 40HC, etc.)
    y sus capacidades para el algoritmo de cubicaje.
    """
    code = models.CharField(max_length=10, unique=True, verbose_name="Código (ej. 20GP)")
    name = models.CharField(max_length=100, verbose_name="Nombre Descriptivo")
    description = models.TextField(blank=True, null=True)
    
    volume_capacity_cbm = models.DecimalField(max_digits=5, decimal_places=2, help_text="Capacidad cúbica máxima (m3)")
    weight_capacity_kg = models.DecimalField(max_digits=8, decimal_places=2, help_text="Capacidad de peso máxima (kg)")
    
    length_m = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    width_m = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    height_m = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    
    is_active = models.BooleanField(default=True, verbose_name="Activo")

    def __str__(self):
        return f"{self.code} - {self.name}"

    class Meta:
        verbose_name = "Contenedor"
        verbose_name_plural = "Tipos de Contenedores"

class ManualQuoteRequest(models.Model):
    request_number = models.CharField(max_length=30, unique=True, null=True)
    quote_submission = models.ForeignKey(QuoteSubmission, on_delete=models.CASCADE, null=True)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, null=True)
    container_selection = models.JSONField(default=list)
    origin = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    cargo_description = models.TextField()
    status = models.CharField(max_length=20, default='pendiente')
    
    cost_freight_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    cost_local_charges_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    cost_special_equipment_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    profit_margin_usd = models.DecimalField(max_digits=12, decimal_places=2, default=150)
    final_price_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

class TrackingTemplate(models.Model):
    transport_type = models.CharField(max_length=10)
    milestone_name = models.CharField(max_length=100)
    milestone_order = models.IntegerField(default=1)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

class FreightForwarderConfig(models.Model):
    name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_name = models.CharField(max_length=255)
    default_profit_margin_percent = models.DecimalField(max_digits=5, decimal_places=2, default=15)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @classmethod
    def get_active(cls):
        return cls.objects.filter(is_active=True).first()

class FFQuoteCost(models.Model):
    quote_submission = models.OneToOneField(QuoteSubmission, on_delete=models.CASCADE, related_name='ff_quote_cost')
    ff_config = models.ForeignKey(FreightForwarderConfig, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, default='pending')
    
    origin_costs_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    origin_costs_detail = models.JSONField(default=dict)
    freight_cost_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    carrier_name = models.CharField(max_length=150, blank=True)
    transit_time = models.CharField(max_length=50, blank=True)
    destination_costs_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    destination_costs_detail = models.JSONField(default=dict)
    
    profit_margin_percent = models.DecimalField(max_digits=5, decimal_places=2, default=15)
    total_ff_cost_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_with_margin_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    ff_reference = models.CharField(max_length=100, blank=True)
    validity_date = models.DateField(null=True)
    notes = models.TextField(blank=True)
    ff_notified_at = models.DateTimeField(null=True)
    ff_response_at = models.DateTimeField(null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def calculate_totals(self):
        self.total_ff_cost_usd = self.origin_costs_usd + self.freight_cost_usd + self.destination_costs_usd
        multiplier = 1 + (self.profit_margin_percent / Decimal('100'))
        self.total_with_margin_usd = self.total_ff_cost_usd * multiplier
        return self.total_with_margin_usd
        
    def save(self, *args, **kwargs):
        self.calculate_totals()
        super().save(*args, **kwargs)