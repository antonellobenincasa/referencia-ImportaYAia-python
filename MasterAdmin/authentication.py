"""
MASTER ADMIN Authentication Module
Exclusive authentication system for super administrator access.
Credentials are stored in Replit Secrets and NOT linked to regular user auth.
Sessions are persisted to database to survive server restarts.
"""
import os
import secrets
from rest_framework import authentication, exceptions
from rest_framework.permissions import BasePermission


def get_master_admin_credentials():
    """Get MASTER ADMIN credentials from environment variables (Secrets)."""
    username = os.environ.get('MASTER_ADMIN_USERNAME')
    password = os.environ.get('MASTER_ADMIN_PASSWORD')
    return username, password


def validate_master_admin_credentials(username: str, password: str) -> bool:
    """Validate provided credentials against stored secrets."""
    stored_username, stored_password = get_master_admin_credentials()
    
    if not stored_username or not stored_password:
        return False
    
    username_match = secrets.compare_digest(username, stored_username)
    password_match = secrets.compare_digest(password, stored_password)
    
    return username_match and password_match


def create_master_admin_session() -> str:
    """Create a new session token for MASTER ADMIN (persisted to database)."""
    from .models import MasterAdminSession
    token = secrets.token_urlsafe(64)
    MasterAdminSession.create_session(token, duration_hours=8)
    return token


def validate_master_admin_session(token: str) -> bool:
    """Validate a MASTER ADMIN session token (checks database)."""
    if not token:
        return False
    from .models import MasterAdminSession
    return MasterAdminSession.validate_token(token)


def invalidate_master_admin_session(token: str):
    """Invalidate a MASTER ADMIN session."""
    from .models import MasterAdminSession
    MasterAdminSession.invalidate_token(token)


class MasterAdminAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for MASTER ADMIN.
    Uses a separate session system from regular JWT auth.
    """
    
    def authenticate(self, request):
        auth_header = request.headers.get('X-Master-Admin-Token')
        
        if not auth_header:
            return None
        
        if not validate_master_admin_session(auth_header):
            raise exceptions.AuthenticationFailed('Token de MASTER ADMIN inválido o expirado.')
        
        return (MasterAdminUser(), auth_header)


class MasterAdminUser:
    """
    Pseudo-user object for MASTER ADMIN.
    Not a database user - purely for authentication context.
    """
    is_authenticated = True
    is_master_admin = True
    username = 'MASTER_ADMIN'
    
    def __str__(self):
        return 'MASTER ADMIN'


class IsMasterAdmin(BasePermission):
    """
    Permission class that only allows MASTER ADMIN access.
    """
    
    def has_permission(self, request, view):
        return (
            hasattr(request.user, 'is_master_admin') and 
            request.user.is_master_admin is True
        )
