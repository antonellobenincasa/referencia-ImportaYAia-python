from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds additional fields for ICS platform.
    """
    email = models.EmailField(_('Correo electrónico'), unique=True)
    company_name = models.CharField(_('Nombre de Empresa'), max_length=255, blank=True)
    phone = models.CharField(_('Teléfono'), max_length=50, blank=True)
    whatsapp = models.CharField(_('WhatsApp'), max_length=50, blank=True)
    city = models.CharField(_('Ciudad'), max_length=100, blank=True, default='Guayaquil')
    country = models.CharField(_('País'), max_length=100, default='Ecuador')
    
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
