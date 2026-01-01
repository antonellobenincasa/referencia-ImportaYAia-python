from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError
from datetime import date, timedelta # <--- IMPORTANTE: Necesario para el cálculo

# --- 1. VALIDADOR DE RUC ---
def validar_ruc_ecuador(value):
    """
    Valida que el RUC tenga 13 dígitos, sea numérico y termine en 001.
    """
    if not value.isdigit():
        raise ValidationError('El RUC debe contener solo números.')
    
    if len(value) != 13:
        raise ValidationError('El RUC debe tener exactamente 13 dígitos.')
    
    if not value.endswith('001'):
        raise ValidationError('El RUC inválido. Debe terminar obligatoriamente en "001".')

# --- 2. MODELO DE USUARIO PERSONALIZADO (Con Roles y Marketing) ---
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    
    ROLE_CHOICES = [
        ('lead_importer', 'Lead / Importador'),
        ('freight_forwarder', 'Freight Forwarder'),
        ('staff', 'Staff de la App'),
    ]
    
    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default='lead_importer',
        verbose_name="Rol en la Plataforma",
        help_text="Define el tipo de usuario y sus permisos básicos."
    )
    
    # --- CAMPOS DE PERFIL BÁSICO ---
    company_name = models.CharField(max_length=255, blank=True, verbose_name="Nombre de Empresa")
    phone = models.CharField(max_length=50, blank=True, verbose_name="Teléfono")
    whatsapp = models.CharField(max_length=50, blank=True, verbose_name="WhatsApp")
    city = models.CharField(max_length=100, blank=True, verbose_name="Ciudad")
    country = models.CharField(max_length=100, default='Ecuador', blank=True, verbose_name="País")
    
    PLATFORM_CHOICES = [
        ('web', 'Web'),
        ('mobile', 'Mobile App'),
        ('api', 'API'),
    ]
    platform = models.CharField(
        max_length=20,
        choices=PLATFORM_CHOICES,
        default='web',
        blank=True,
        verbose_name="Plataforma de Registro"
    )

    # --- CAMPOS DE MARKETING ---
    birth_date = models.DateField(
        null=True, blank=True, 
        verbose_name="Fecha de Nacimiento (Cumpleaños)",
        help_text="El sistema calculará automáticamente el vencimiento del regalo."
    )

    has_active_gift = models.BooleanField(
        default=False, 
        verbose_name="¿Tiene Regalo Digital Activo?",
        help_text="Se activa automáticamente en el cumpleaños."
    )
    
    gift_expiry_date = models.DateField(
        null=True, blank=True, 
        verbose_name="Vencimiento del Regalo ($100 OFF)",
        help_text="Cálculo automático: 30 días después del cumpleaños."
    )
    
    is_email_verified = models.BooleanField(
        default=False,
        verbose_name="Email Verificado",
        help_text="Indica si el usuario ha verificado su email."
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email

    # --- LÓGICA DE NEGOCIO AUTOMÁTICA ---
    def save(self, *args, **kwargs):
        # Si se ingresó una fecha de nacimiento, calculamos el vencimiento
        if self.birth_date:
            today = date.today()
            try:
                # Intentamos poner el cumpleaños en este año
                next_birthday = self.birth_date.replace(year=today.year)
            except ValueError:
                # Caso especial: Nació un 29 de febrero y este año no es bisiesto
                next_birthday = self.birth_date.replace(year=today.year, month=3, day=1)

            # Si el cumpleaños ya pasó este año, calculamos para el siguiente para el regalo futuro
            # NOTA: Si queremos dar el regalo ESTE año aunque ya haya pasado el cumple (ej: se registra hoy y su cumple fue ayer),
            # la lógica cambia. Pero asumiendo lógica de "próximo cumpleaños":
            if next_birthday < today:
                next_birthday = next_birthday.replace(year=today.year + 1)
            
            # REGLA DE NEGOCIO: Vence 30 días después del cumpleaños calculado
            self.gift_expiry_date = next_birthday + timedelta(days=30)
            
            # Opcional: Si hoy es exactamente el cumpleaños, activamos el regalo
            if today == next_birthday:
                 self.has_active_gift = True

        super().save(*args, **kwargs)

# --- 3. MODELO DE RUCs DE CLIENTES ---
class CustomerRUC(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_rucs',
        verbose_name="Usuario Propietario"
    )
    
    ruc = models.CharField(
        max_length=13, 
        unique=True, 
        verbose_name="Número de RUC",
        validators=[validar_ruc_ecuador],
        help_text="Ingrese los 13 dígitos. Debe terminar en 001."
    )
    
    company_name = models.CharField(max_length=255, verbose_name="Razón Social")
    
    is_primary = models.BooleanField(
        default=True, 
        verbose_name="Es RUC Principal",
        help_text="Si marca esto, cualquier otro RUC de este usuario dejará de ser principal."
    )
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente Aprobación'),
        ('primary', 'Principal'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Estado"
    )
    
    # Campos adicionales para justificación
    justification = models.TextField(blank=True, verbose_name="Justificación")
    relationship_description = models.TextField(blank=True, verbose_name="Descripción de Relación")
    
    # Campos de administración
    admin_notes = models.TextField(blank=True, verbose_name="Notas del Admin")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_rucs',
        verbose_name="Revisado por"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Revisión")
    
    # Campos SENAE
    is_oce_registered = models.BooleanField(default=False, verbose_name="Registrado en OCE")
    senae_verification_date = models.DateField(null=True, blank=True, verbose_name="Fecha Verificación SENAE")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha de Actualización")

    class Meta:
        verbose_name = "RUC de Cliente"
        verbose_name_plural = "RUCs de Clientes"

    def __str__(self):
        return f"{self.ruc} - {self.company_name}"

    def save(self, *args, **kwargs):
        # Si este RUC se marca como principal, desmarcar otros
        if self.is_primary:
            CustomerRUC.objects.filter(user=self.user).exclude(pk=self.pk).update(is_primary=False)
        
        super().save(*args, **kwargs)
    
    @classmethod
    def get_primary_ruc(cls, user):
        """Get the primary RUC for a user"""
        return cls.objects.filter(user=user, is_primary=True, status__in=['approved', 'primary']).first()
    
    @classmethod
    def get_approved_rucs(cls, user):
        """Get all approved RUCs for a user"""
        return cls.objects.filter(user=user, status__in=['approved', 'primary'])
    
    @classmethod
    def ruc_exists(cls, ruc):
        """Check if a RUC already exists"""
        return cls.objects.filter(ruc=ruc).exists()


# --- 4. TOKEN PARA RESETEO DE CONTRASEÑA ---
class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    @property
    def is_valid(self):
        from django.utils import timezone
        return not self.used and self.expires_at > timezone.now()
    
    class Meta:
        verbose_name = "Token de Reseteo"
        verbose_name_plural = "Tokens de Reseteo"


# --- 5. PERFIL DE LEAD/IMPORTADOR ---
class LeadProfile(models.Model):
    LEGAL_TYPE_CHOICES = [
        ('natural', 'Persona Natural'),
        ('juridica', 'Persona Jurídica'),
        ('rise', 'RISE'),
    ]
    
    TRADE_LANE_CHOICES = [
        ('china', 'China'),
        ('usa', 'Estados Unidos'),
        ('europe', 'Europa'),
        ('latam', 'Latinoamérica'),
        ('other', 'Otro'),
    ]
    
    PREFERRED_TRANSPORT_CHOICES = [
        ('sea', 'Marítimo'),
        ('air', 'Aéreo'),
        ('land', 'Terrestre'),
        ('multimodal', 'Multimodal'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lead_profile'
    )
    
    # Datos fiscales
    ruc = models.CharField(max_length=13, blank=True, verbose_name="RUC")
    legal_type = models.CharField(
        max_length=20, 
        choices=LEGAL_TYPE_CHOICES, 
        blank=True,
        verbose_name="Tipo de Contribuyente"
    )
    is_active_importer = models.BooleanField(default=False, verbose_name="Importador Activo")
    senae_code = models.CharField(max_length=50, blank=True, verbose_name="Código SENAE")
    
    # Dirección comercial
    business_address = models.TextField(blank=True, verbose_name="Dirección Comercial")
    postal_code = models.CharField(max_length=20, blank=True, verbose_name="Código Postal")
    
    # Preferencias comerciales
    preferred_trade_lane = models.CharField(
        max_length=20,
        choices=TRADE_LANE_CHOICES,
        blank=True,
        verbose_name="Ruta Comercial Preferida"
    )
    preferred_transport = models.CharField(
        max_length=20,
        choices=PREFERRED_TRANSPORT_CHOICES,
        blank=True,
        verbose_name="Transporte Preferido"
    )
    main_products = models.TextField(blank=True, verbose_name="Productos Principales")
    average_monthly_volume = models.CharField(max_length=100, blank=True, verbose_name="Volumen Mensual Promedio")
    
    # Datos de agente de aduana
    customs_broker_name = models.CharField(max_length=255, blank=True, verbose_name="Nombre Agente Aduanero")
    customs_broker_code = models.CharField(max_length=50, blank=True, verbose_name="Código Agente Aduanero")
    
    # Notificaciones
    notification_email = models.EmailField(blank=True, verbose_name="Email de Notificación")
    notification_whatsapp = models.CharField(max_length=50, blank=True, verbose_name="WhatsApp de Notificación")
    
    # Notas y estado
    notes = models.TextField(blank=True, verbose_name="Notas")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_profile_complete(self):
        """Check if the essential profile fields are filled"""
        return bool(self.ruc and self.legal_type)
    
    class Meta:
        verbose_name = "Perfil de Lead"
        verbose_name_plural = "Perfiles de Leads"
    
    def __str__(self):
        return f"Perfil de {self.user.email}"


# --- 6. PREFERENCIAS DE NOTIFICACIÓN ---
class NotificationPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_prefs'
    )
    
    # Alertas por correo
    email_alerts_enabled = models.BooleanField(default=True, verbose_name="Alertas por Email")
    push_alerts_enabled = models.BooleanField(default=True, verbose_name="Alertas Push")
    
    # Tipos de notificaciones
    milestone_updates = models.BooleanField(default=True, verbose_name="Actualizaciones de Hitos")
    eta_changes = models.BooleanField(default=True, verbose_name="Cambios de ETA")
    document_updates = models.BooleanField(default=True, verbose_name="Actualizaciones de Documentos")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Preferencia de Notificación"
        verbose_name_plural = "Preferencias de Notificación"
    
    @classmethod
    def get_or_create_for_user(cls, user):
        prefs, created = cls.objects.get_or_create(user=user)
        return prefs


# --- 7. INVITACIÓN PARA FREIGHT FORWARDER ---
class FFInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('accepted', 'Aceptada'),
        ('expired', 'Expirada'),
    ]
    
    email = models.EmailField(verbose_name="Email del Freight Forwarder")
    company_name = models.CharField(max_length=255, verbose_name="Nombre de Empresa")
    token = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    accepted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='accepted_ff_invitations'
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expires_at < timezone.now()
    
    class Meta:
        verbose_name = "Invitación FF"
        verbose_name_plural = "Invitaciones FF"


# --- 8. PERFIL DE FREIGHT FORWARDER ---
class FreightForwarderProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ff_profile'
    )
    company_name = models.CharField(max_length=255, verbose_name="Nombre de Empresa")
    contact_name = models.CharField(max_length=255, blank=True, verbose_name="Nombre de Contacto")
    phone = models.CharField(max_length=50, blank=True, verbose_name="Teléfono")
    is_verified = models.BooleanField(default=False, verbose_name="Verificado")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Perfil FF"
        verbose_name_plural = "Perfiles FF"
    
    def __str__(self):
        return f"FF: {self.company_name}"


# --- 9. HISTORIAL DE APROBACIÓN DE RUC ---
class RUCApprovalHistory(models.Model):
    ruc_record = models.ForeignKey(
        CustomerRUC,
        on_delete=models.CASCADE,
        related_name='approval_history'
    )
    action = models.CharField(max_length=20)  # 'approved', 'rejected'
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Historial de Aprobación"
        verbose_name_plural = "Historial de Aprobaciones"
    
    @classmethod
    def log_action(cls, ruc_record, action, admin_notes=''):
        return cls.objects.create(
            ruc_record=ruc_record,
            action=action,
            admin_notes=admin_notes
        )