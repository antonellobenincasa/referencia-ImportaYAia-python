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
