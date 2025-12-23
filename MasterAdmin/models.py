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
