from rest_framework import permissions


class IsLeadUser(permissions.BasePermission):
    """Permission class to ensure user has LEAD role"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) == 'lead'


class IsAsesorOrAdmin(permissions.BasePermission):
    """Permission class for ASESOR or ADMIN users"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(request.user, 'role', None)
        return role in ['asesor', 'admin']


class IsAdminUser(permissions.BasePermission):
    """Permission class for ADMIN users only"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) == 'admin'
