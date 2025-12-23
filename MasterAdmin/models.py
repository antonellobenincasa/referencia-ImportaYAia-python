"""
Master Admin Session Model
Persists Master Admin sessions to database to survive server restarts.
"""
from django.db import models
from django.utils import timezone
from datetime import timedelta


class MasterAdminSession(models.Model):
    """Persistent storage for Master Admin sessions."""
    token = models.CharField(max_length=128, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'masteradmin_session'
        verbose_name = 'Master Admin Session'
        verbose_name_plural = 'Master Admin Sessions'

    def __str__(self):
        return f"Session {self.token[:20]}... expires {self.expires_at}"

    @property
    def is_valid(self):
        return self.is_active and self.expires_at > timezone.now()

    @classmethod
    def cleanup_expired(cls):
        """Remove expired sessions."""
        cls.objects.filter(expires_at__lt=timezone.now()).delete()

    @classmethod
    def create_session(cls, token: str, duration_hours: int = 8):
        """Create a new session."""
        cls.cleanup_expired()
        expires_at = timezone.now() + timedelta(hours=duration_hours)
        session = cls.objects.create(token=token, expires_at=expires_at)
        return session

    @classmethod
    def validate_token(cls, token: str) -> bool:
        """Check if a token is valid."""
        if not token:
            return False
        try:
            session = cls.objects.get(token=token, is_active=True)
            if session.expires_at > timezone.now():
                return True
            session.delete()
            return False
        except cls.DoesNotExist:
            return False

    @classmethod
    def invalidate_token(cls, token: str):
        """Invalidate a session."""
        cls.objects.filter(token=token).delete()


class ActivityLog(models.Model):
    """
    Activity Log for tracking system events and user actions.
    Used by Master Admin dashboard for monitoring and auditing.
    """
    ACTION_TYPE_CHOICES = [
        ('login', 'Inicio de Sesión'),
        ('logout', 'Cierre de Sesión'),
        ('quote_created', 'Cotización Creada'),
        ('quote_approved', 'Cotización Aprobada'),
        ('quote_rejected', 'Cotización Rechazada'),
        ('ro_generated', 'RO Generado'),
        ('shipment_created', 'Embarque Creado'),
        ('shipment_updated', 'Embarque Actualizado'),
        ('user_created', 'Usuario Creado'),
        ('user_updated', 'Usuario Actualizado'),
        ('ruc_approved', 'RUC Aprobado'),
        ('ruc_rejected', 'RUC Rechazado'),
        ('document_uploaded', 'Documento Subido'),
        ('preliq_created', 'Pre-Liquidación Creada'),
        ('system_error', 'Error del Sistema'),
        ('api_call', 'Llamada API'),
        ('config_changed', 'Configuración Modificada'),
        ('other', 'Otro'),
    ]

    LEVEL_CHOICES = [
        ('INFO', 'Información'),
        ('WARNING', 'Advertencia'),
        ('ERROR', 'Error'),
        ('SUCCESS', 'Éxito'),
    ]

    action_type = models.CharField(
        max_length=50, 
        choices=ACTION_TYPE_CHOICES, 
        default='other',
        db_index=True
    )
    level = models.CharField(
        max_length=10, 
        choices=LEVEL_CHOICES, 
        default='INFO',
        db_index=True
    )
    message = models.TextField()
    
    user_id = models.IntegerField(null=True, blank=True, db_index=True)
    user_email = models.CharField(max_length=255, blank=True, default='')
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    
    related_object_type = models.CharField(max_length=100, blank=True, default='')
    related_object_id = models.IntegerField(null=True, blank=True)
    
    extra_data = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'masteradmin_activity_log'
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action_type', 'created_at']),
            models.Index(fields=['user_id', 'created_at']),
        ]

    def __str__(self):
        return f"[{self.level}] {self.action_type}: {self.message[:50]}..."

    @classmethod
    def log(cls, action_type, message, user=None, level='INFO', request=None, 
            related_object=None, extra_data=None):
        """
        Helper method to create an activity log entry.
        """
        entry = cls(
            action_type=action_type,
            message=message,
            level=level,
            extra_data=extra_data
        )
        
        if user:
            if hasattr(user, 'id'):
                entry.user_id = user.id
                entry.user_email = getattr(user, 'email', '')
            elif isinstance(user, int):
                entry.user_id = user
        
        if request:
            entry.ip_address = cls._get_client_ip(request)
            entry.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        
        if related_object:
            entry.related_object_type = related_object.__class__.__name__
            entry.related_object_id = getattr(related_object, 'id', None)
        
        entry.save()
        return entry

    @staticmethod
    def _get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    @classmethod
    def get_action_types(cls):
        """Return list of action types for filter dropdown."""
        return [{'value': k, 'label': v} for k, v in cls.ACTION_TYPE_CHOICES]
