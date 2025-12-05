"""
Mixins for owner-based filtering and auto-assignment
"""
from rest_framework.permissions import IsAuthenticated, AllowAny


class OwnerFilterMixin:
    """
    Mixin that filters queryset by owner and auto-assigns owner on create/update.
    Use this mixin in ViewSets for models that have an 'owner' field.
    """
    
    def get_queryset(self):
        """Filter queryset to only show objects owned by the current user"""
        queryset = super().get_queryset()
        
        if not self.request.user.is_authenticated:
            return queryset.none()
        
        if hasattr(queryset.model, 'owner'):
            return queryset.filter(owner=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Automatically assign owner to created objects"""
        if hasattr(serializer.Meta.model, 'owner'):
            serializer.save(owner=self.request.user)
        else:
            serializer.save()
    
    def perform_update(self, serializer):
        """Ensure owner cannot be changed on update"""
        if hasattr(serializer.Meta.model, 'owner'):
            serializer.save(owner=self.request.user)
        else:
            serializer.save()


class PublicCreateMixin:
    """
    Mixin for resources that allow public create (e.g., landing page submissions).
    List/retrieve/update/delete require authentication and filter by owner.
    """
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if not self.request.user.is_authenticated:
            return queryset.none()
        
        if hasattr(queryset.model, 'owner'):
            return queryset.filter(owner=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated and hasattr(serializer.Meta.model, 'owner'):
            serializer.save(owner=self.request.user)
        else:
            serializer.save()
    
    def perform_update(self, serializer):
        """Ensure owner cannot be changed on update"""
        if self.request.user.is_authenticated and hasattr(serializer.Meta.model, 'owner'):
            serializer.save(owner=self.request.user)
        else:
            serializer.save()


class PublicReadOnlyMixin:
    """
    Mixin for resources with public read-only access (filter by is_active=True).
    Write operations require authentication and filter by owner.
    """
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.action in ['list', 'retrieve']:
            if hasattr(queryset.model, 'is_active'):
                return queryset.filter(is_active=True)
            return queryset
        
        if not self.request.user.is_authenticated:
            return queryset.none()
        
        if hasattr(queryset.model, 'owner'):
            return queryset.filter(owner=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        if hasattr(serializer.Meta.model, 'owner'):
            serializer.save(owner=self.request.user)
        else:
            serializer.save()
    
    def perform_update(self, serializer):
        """Ensure owner cannot be changed on update"""
        if hasattr(serializer.Meta.model, 'owner'):
            serializer.save(owner=self.request.user)
        else:
            serializer.save()
