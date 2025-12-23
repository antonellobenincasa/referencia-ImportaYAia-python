from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds additional fields for ICS platform.
    """
    ROLE_CHOICES = [
        ('lead', 'Lead/Importador'),
        ('admin', 'Administrador'),
        ('freight_forwarder', 'Freight Forwarder'),
    ]
    
    PLATFORM_CHOICES = [
        ('ios', 'iOS'),
        ('android', 'Android'),
        ('windows', 'Windows Desktop'),
        ('web', 'Web'),
    ]
    
    email = models.EmailField(_('Correo electrónico'), unique=True)
    company_name = models.CharField(_('Nombre de Empresa'), max_length=255, blank=True)
    phone = models.CharField(_('Teléfono'), max_length=50, blank=True)
    whatsapp = models.CharField(_('WhatsApp'), max_length=50, blank=True)
    city = models.CharField(_('Ciudad'), max_length=100, blank=True, default='Guayaquil')
    country = models.CharField(_('País'), max_length=100, default='Ecuador')
    
    role = models.CharField(_('Rol'), max_length=20, choices=ROLE_CHOICES, default='lead')
    platform = models.CharField(_('Plataforma'), max_length=20, choices=PLATFORM_CHOICES, default='web')
    
    is_email_verified = models.BooleanField(_('Email Verificado'), default=False)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} - {self.get_full_name() or self.username}"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        return self.first_name or self.username


class LeadProfile(models.Model):
    """
    Extended profile for LEAD (importer) users.
    Contains business, trade preferences, and customs information.
    """
    LEGAL_TYPE_CHOICES = [
        ('natural', 'Persona Natural'),
        ('juridica', 'Persona Jurídica'),
    ]
    
    TRADE_LANE_CHOICES = [
        ('china_ecuador', 'China - Ecuador'),
        ('usa_ecuador', 'USA - Ecuador'),
        ('europa_ecuador', 'Europa - Ecuador'),
        ('asia_ecuador', 'Asia - Ecuador'),
        ('latam_ecuador', 'Latinoamérica - Ecuador'),
    ]
    
    PREFERRED_TRANSPORT_CHOICES = [
        ('aereo', 'Aéreo'),
        ('maritimo_fcl', 'Marítimo FCL'),
        ('maritimo_lcl', 'Marítimo LCL'),
        ('terrestre', 'Terrestre'),
        ('multimodal', 'Multimodal'),
    ]
    
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='lead_profile',
        verbose_name=_('Usuario')
    )
    
    ruc = models.CharField(
        _('RUC'),
        max_length=13,
        blank=True,
        help_text=_('13 dígitos numéricos del RUC Ecuador')
    )
    legal_type = models.CharField(
        _('Tipo Legal'),
        max_length=20,
        choices=LEGAL_TYPE_CHOICES,
        default='juridica'
    )
    is_active_importer = models.BooleanField(
        _('¿Es importador actualmente?'),
        default=False
    )
    senae_code = models.CharField(
        _('Código SENAE'),
        max_length=50,
        blank=True,
        help_text=_('Código de operador en SENAE')
    )
    
    business_address = models.TextField(_('Dirección Comercial'), blank=True)
    postal_code = models.CharField(_('Código Postal'), max_length=20, blank=True)
    
    preferred_trade_lane = models.CharField(
        _('Ruta Comercial Preferida'),
        max_length=50,
        choices=TRADE_LANE_CHOICES,
        blank=True
    )
    preferred_transport = models.CharField(
        _('Transporte Preferido'),
        max_length=20,
        choices=PREFERRED_TRANSPORT_CHOICES,
        blank=True
    )
    
    main_products = models.TextField(
        _('Productos Principales'),
        blank=True,
        help_text=_('Descripción de los productos que importa regularmente')
    )
    average_monthly_volume = models.CharField(
        _('Volumen Mensual Promedio'),
        max_length=100,
        blank=True,
        help_text=_('Ej: 5-10 TEUs, 50-100 kg aéreo')
    )
    
    customs_broker_name = models.CharField(_('Agente de Aduanas'), max_length=255, blank=True)
    customs_broker_code = models.CharField(_('Código Agente Aduanas'), max_length=50, blank=True)
    
    notification_email = models.EmailField(_('Email de Notificaciones'), blank=True)
    notification_whatsapp = models.CharField(_('WhatsApp Notificaciones'), max_length=50, blank=True)
    
    notes = models.TextField(_('Notas Adicionales'), blank=True)
    
    is_profile_complete = models.BooleanField(_('Perfil Completo'), default=False)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Perfil de Importador')
        verbose_name_plural = _('Perfiles de Importadores')
    
    def __str__(self):
        return f"Perfil de {self.user.email}"
    
    def check_profile_completeness(self):
        """Check if minimum required fields are filled"""
        required_fields = [
            self.ruc,
            self.user.company_name,
            self.user.phone or self.user.whatsapp,
        ]
        self.is_profile_complete = all(required_fields)
        return self.is_profile_complete
    
    def save(self, *args, **kwargs):
        self.check_profile_completeness()
        super().save(*args, **kwargs)


class CustomerRUC(models.Model):
    """
    Modelo para gestionar múltiples RUCs por usuario.
    Garantiza unicidad de RUC en todo el sistema y requiere aprobación para RUCs adicionales.
    """
    STATUS_CHOICES = [
        ('primary', 'RUC Principal'),
        ('pending', 'Pendiente Aprobación'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    ]
    
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='customer_rucs',
        verbose_name=_('Usuario')
    )
    ruc = models.CharField(
        _('RUC'),
        max_length=13,
        unique=True,
        help_text=_('13 dígitos numéricos del RUC Ecuador - Único en todo el sistema')
    )
    company_name = models.CharField(
        _('Razón Social'),
        max_length=255,
        help_text=_('Nombre de la empresa asociada al RUC')
    )
    is_primary = models.BooleanField(
        _('Es RUC Principal'),
        default=False,
        help_text=_('Si es el RUC principal del usuario')
    )
    status = models.CharField(
        _('Estado'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    justification = models.TextField(
        _('Justificación'),
        blank=True,
        help_text=_('Razón para registrar este RUC adicional')
    )
    relationship_description = models.CharField(
        _('Relación con RUC Principal'),
        max_length=255,
        blank=True,
        help_text=_('Ej: Empresa filial, Representante legal, etc.')
    )
    admin_notes = models.TextField(
        _('Notas del Administrador'),
        blank=True,
        help_text=_('Notas del Master Admin sobre la aprobación/rechazo')
    )
    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ruc_reviews',
        verbose_name=_('Revisado por')
    )
    reviewed_at = models.DateTimeField(
        _('Fecha de Revisión'),
        null=True,
        blank=True
    )
    is_oce_registered = models.BooleanField(
        _('Registrado como OCE en SENAE'),
        default=False,
        help_text=_('Si el RUC está registrado como Operador de Comercio Exterior')
    )
    senae_verification_date = models.DateField(
        _('Fecha Verificación SENAE'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('RUC de Cliente')
        verbose_name_plural = _('RUCs de Clientes')
        ordering = ['-is_primary', '-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['ruc'],
                name='unique_ruc_system_wide'
            ),
        ]
    
    def __str__(self):
        status_label = 'Principal' if self.is_primary else self.get_status_display()
        return f"{self.ruc} - {self.company_name} ({status_label})"
    
    def save(self, *args, **kwargs):
        if self.is_primary:
            self.status = 'primary'
            CustomerRUC.objects.filter(
                user=self.user, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
    
    @classmethod
    def get_primary_ruc(cls, user):
        """Obtiene el RUC principal del usuario"""
        return cls.objects.filter(user=user, is_primary=True).first()
    
    @classmethod
    def get_approved_rucs(cls, user):
        """Obtiene todos los RUCs aprobados del usuario"""
        return cls.objects.filter(
            user=user,
            status__in=['primary', 'approved']
        )
    
    @classmethod
    def ruc_exists(cls, ruc):
        """Verifica si un RUC ya existe en el sistema"""
        return cls.objects.filter(ruc=ruc).exists()


class RUCApprovalHistory(models.Model):
    """
    Audit log for RUC approval/rejection actions.
    Tracks all actions taken on CustomerRUC records by Master Admin.
    """
    ACTION_CHOICES = [
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    ]
    
    ruc = models.ForeignKey(
        'CustomerRUC',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approval_history',
        verbose_name=_('RUC')
    )
    ruc_number = models.CharField(
        _('Número de RUC'),
        max_length=13,
        help_text=_('Stored for reference even if RUC is deleted')
    )
    company_name = models.CharField(
        _('Razón Social'),
        max_length=255,
        help_text=_('Stored for reference even if RUC is deleted')
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ruc_approval_history',
        verbose_name=_('Usuario Propietario')
    )
    user_email = models.EmailField(
        _('Email del Usuario'),
        help_text=_('Stored for reference even if user is deleted')
    )
    user_name = models.CharField(
        _('Nombre del Usuario'),
        max_length=255,
        blank=True
    )
    action = models.CharField(
        _('Acción'),
        max_length=20,
        choices=ACTION_CHOICES
    )
    admin_notes = models.TextField(
        _('Notas del Administrador'),
        blank=True
    )
    performed_at = models.DateTimeField(
        _('Fecha de Acción'),
        auto_now_add=True
    )
    
    class Meta:
        verbose_name = _('Historial de Aprobación RUC')
        verbose_name_plural = _('Historial de Aprobaciones RUC')
        ordering = ['-performed_at']
    
    def __str__(self):
        return f"{self.ruc_number} - {self.get_action_display()} - {self.performed_at.strftime('%Y-%m-%d %H:%M')}"
    
    @classmethod
    def log_action(cls, ruc_record, action, admin_notes=''):
        """
        Create a history entry for a RUC approval/rejection action.
        """
        return cls.objects.create(
            ruc=ruc_record,
            ruc_number=ruc_record.ruc,
            company_name=ruc_record.company_name,
            user=ruc_record.user,
            user_email=ruc_record.user.email if ruc_record.user else '',
            user_name=ruc_record.user.get_full_name() if ruc_record.user else '',
            action=action,
            admin_notes=admin_notes
        )


class PasswordResetToken(models.Model):
    """Token for password reset functionality"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = _('Token de Recuperación')
        verbose_name_plural = _('Tokens de Recuperación')
    
    def __str__(self):
        return f"Reset token for {self.user.email}"
    
    @property
    def is_valid(self):
        from django.utils import timezone
        return not self.used and self.expires_at > timezone.now()


class NotificationPreference(models.Model):
    """
    User notification preferences for cargo tracking alerts.
    All notifications are ON by default.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        verbose_name=_('Usuario')
    )
    
    email_alerts_enabled = models.BooleanField(
        _('Alertas por Email'),
        default=True,
        help_text=_('Recibir notificaciones de tracking por email')
    )
    
    push_alerts_enabled = models.BooleanField(
        _('Alertas Push'),
        default=True,
        help_text=_('Recibir notificaciones push en el teléfono')
    )
    
    milestone_updates = models.BooleanField(
        _('Actualizaciones de Hitos'),
        default=True,
        help_text=_('Recibir alertas cuando la carga alcance un nuevo hito')
    )
    
    eta_changes = models.BooleanField(
        _('Cambios de ETA'),
        default=True,
        help_text=_('Recibir alertas cuando cambie la fecha estimada de llegada')
    )
    
    document_updates = models.BooleanField(
        _('Actualizaciones de Documentos'),
        default=True,
        help_text=_('Recibir alertas sobre nuevos documentos disponibles')
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Preferencia de Notificación')
        verbose_name_plural = _('Preferencias de Notificación')
    
    def __str__(self):
        return f"Notificaciones: {self.user.email}"
    
    @classmethod
    def get_or_create_for_user(cls, user):
        """Get or create notification preferences for a user with defaults ON"""
        prefs, created = cls.objects.get_or_create(user=user)
        return prefs


class FreightForwarderProfile(models.Model):
    """
    Perfil extendido para usuarios Freight Forwarder.
    Vinculado a LogisticsProvider o FreightForwarderConfig.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='ff_profile',
        verbose_name=_('Usuario')
    )
    
    company_name = models.CharField(
        _('Nombre de Empresa'),
        max_length=255
    )
    contact_name = models.CharField(
        _('Nombre de Contacto'),
        max_length=255,
        blank=True
    )
    phone = models.CharField(
        _('Teléfono'),
        max_length=50,
        blank=True
    )
    
    is_verified = models.BooleanField(
        _('Verificado'),
        default=False,
        help_text=_('El Freight Forwarder ha sido verificado por Master Admin')
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Perfil Freight Forwarder')
        verbose_name_plural = _('Perfiles Freight Forwarder')
    
    def __str__(self):
        return f"FF: {self.company_name} - {self.user.email}"


class FFInvitation(models.Model):
    """
    Invitaciones para que Freight Forwarders se registren y actualicen tracking.
    Tokens seguros con expiración.
    """
    STATUS_CHOICES = [
        ('pending', _('Pendiente')),
        ('sent', _('Enviada')),
        ('accepted', _('Aceptada')),
        ('expired', _('Expirada')),
        ('revoked', _('Revocada')),
    ]
    
    email = models.EmailField(_('Email del Freight Forwarder'))
    company_name = models.CharField(_('Nombre de Empresa'), max_length=255)
    
    token = models.CharField(
        _('Token de Invitación'),
        max_length=128,
        unique=True,
        db_index=True
    )
    
    status = models.CharField(
        _('Estado'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    expires_at = models.DateTimeField(_('Expira en'))
    
    accepted_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ff_invitations_accepted',
        verbose_name=_('Aceptada Por')
    )
    accepted_at = models.DateTimeField(_('Aceptada en'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    sent_at = models.DateTimeField(_('Enviada en'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Invitación FF')
        verbose_name_plural = _('Invitaciones FF')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitación: {self.email} ({self.status})"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    @classmethod
    def generate_token(cls):
        import secrets
        return secrets.token_urlsafe(64)
    
    @classmethod
    def create_invitation(cls, email, company_name, days_valid=7):
        from django.utils import timezone
        from datetime import timedelta
        
        token = cls.generate_token()
        expires_at = timezone.now() + timedelta(days=days_valid)
        
        invitation = cls.objects.create(
            email=email,
            company_name=company_name,
            token=token,
            expires_at=expires_at
        )
        return invitation


class FFGlobalConfig(models.Model):
    """
    Configuración global para asignación de Freight Forwarders.
    Solo debe existir un registro (singleton pattern).
    """
    MODE_CHOICES = [
        ('single', 'FF Único Global'),
        ('multi', 'Asignación por Criterios'),
        ('manual', 'Asignación Manual'),
    ]
    
    assignment_mode = models.CharField(
        _('Modo de Asignación'),
        max_length=20,
        choices=MODE_CHOICES,
        default='manual',
        help_text=_('Define cómo se asignan los FF a los embarques')
    )
    
    default_ff = models.ForeignKey(
        'FreightForwarderProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='as_default_ff',
        verbose_name=_('FF por Defecto'),
        help_text=_('FF que maneja todos los embarques en modo "single" o como fallback')
    )
    
    auto_assign_on_ro = models.BooleanField(
        _('Auto-asignar al generar RO'),
        default=True,
        help_text=_('Asignar automáticamente FF cuando se genera el Routing Order')
    )
    
    notes = models.TextField(
        _('Notas'),
        blank=True,
        help_text=_('Notas sobre la configuración de FF')
    )
    
    updated_at = models.DateTimeField(_('Última Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Configuración Global FF')
        verbose_name_plural = _('Configuración Global FF')
    
    def __str__(self):
        return f"Configuración FF: {self.get_assignment_mode_display()}"
    
    @classmethod
    def get_config(cls):
        """Obtiene o crea la configuración global (singleton)"""
        config, _ = cls.objects.get_or_create(pk=1)
        return config
    
    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)


class FFRouteAssignment(models.Model):
    """
    Asignación de Freight Forwarders a rutas específicas, tipos de transporte,
    navieras, aerolíneas, puertos de origen, países, etc.
    """
    TRANSPORT_CHOICES = [
        ('all', 'Todos'),
        ('FCL', 'Marítimo FCL'),
        ('LCL', 'Marítimo LCL'),
        ('AEREO', 'Aéreo'),
    ]
    
    freight_forwarder = models.ForeignKey(
        'FreightForwarderProfile',
        on_delete=models.CASCADE,
        related_name='route_assignments',
        verbose_name=_('Freight Forwarder')
    )
    
    transport_type = models.CharField(
        _('Tipo de Transporte'),
        max_length=20,
        choices=TRANSPORT_CHOICES,
        default='all',
        help_text=_('Tipo de transporte que maneja este FF')
    )
    
    origin_country = models.CharField(
        _('País de Origen'),
        max_length=100,
        blank=True,
        help_text=_('Deje vacío para todos los países')
    )
    
    origin_port = models.CharField(
        _('Puerto/Aeropuerto de Origen'),
        max_length=100,
        blank=True,
        help_text=_('POL o aeropuerto específico. Deje vacío para todos.')
    )
    
    destination_city = models.CharField(
        _('Ciudad de Destino'),
        max_length=100,
        blank=True,
        help_text=_('Ciudad de destino en Ecuador. Deje vacío para todas.')
    )
    
    carrier_name = models.CharField(
        _('Naviera/Aerolínea'),
        max_length=100,
        blank=True,
        help_text=_('Nombre de la naviera o aerolínea. Deje vacío para todas.')
    )
    
    priority = models.PositiveIntegerField(
        _('Prioridad'),
        default=1,
        help_text=_('Mayor prioridad = menor número. Se asigna el FF con mayor prioridad que coincida.')
    )
    
    is_active = models.BooleanField(
        _('Activo'),
        default=True
    )
    
    notes = models.TextField(
        _('Notas'),
        blank=True
    )
    
    created_at = models.DateTimeField(_('Fecha de Creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Fecha de Actualización'), auto_now=True)
    
    class Meta:
        verbose_name = _('Asignación de Ruta FF')
        verbose_name_plural = _('Asignaciones de Rutas FF')
        ordering = ['priority', '-created_at']
    
    def __str__(self):
        parts = [self.freight_forwarder.company_name]
        if self.transport_type != 'all':
            parts.append(self.transport_type)
        if self.origin_country:
            parts.append(self.origin_country)
        if self.carrier_name:
            parts.append(self.carrier_name)
        return ' | '.join(parts)
    
    @classmethod
    def find_ff_for_shipment(cls, transport_type=None, origin_country=None, 
                              origin_port=None, destination_city=None, carrier=None):
        """
        Encuentra el FF más apropiado según los criterios del embarque.
        Retorna el FFProfile o None.
        """
        from django.db.models import Q
        
        config = FFGlobalConfig.get_config()
        
        if config.assignment_mode == 'single':
            return config.default_ff
        
        if config.assignment_mode == 'manual':
            return None
        
        assignments = cls.objects.filter(is_active=True).order_by('priority')
        
        for assignment in assignments:
            match = True
            
            if assignment.transport_type != 'all' and transport_type:
                if assignment.transport_type != transport_type:
                    match = False
            
            if assignment.origin_country and origin_country:
                if assignment.origin_country.lower() not in origin_country.lower():
                    match = False
            
            if assignment.origin_port and origin_port:
                if assignment.origin_port.lower() not in origin_port.lower():
                    match = False
            
            if assignment.destination_city and destination_city:
                if assignment.destination_city.lower() not in destination_city.lower():
                    match = False
            
            if assignment.carrier_name and carrier:
                if assignment.carrier_name.lower() not in carrier.lower():
                    match = False
            
            if match:
                return assignment.freight_forwarder
        
        return config.default_ff
