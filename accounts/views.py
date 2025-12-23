from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta
import uuid

from .models import CustomUser, PasswordResetToken, LeadProfile, CustomerRUC, NotificationPreference
from django.db.models import Q
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    LeadProfileSerializer,
    UserWithProfileSerializer,
    LeadProfileUpdateSerializer,
    CustomerRUCSerializer,
    CustomerRUCCreateSerializer,
    RUCApprovalSerializer,
    NotificationPreferenceSerializer,
)


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'Cuenta creada exitosamente.',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'Inicio de sesión exitoso.',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'success': True,
                'message': 'Sesión cerrada exitosamente.'
            })
        except Exception:
            return Response({
                'success': True,
                'message': 'Sesión cerrada.'
            })


class ProfileView(generics.RetrieveUpdateAPIView):
    """User profile view and update"""
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente.',
            'user': UserSerializer(instance).data
        })


class PasswordChangeView(APIView):
    """Change password for authenticated user"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'success': True,
            'message': 'Contraseña actualizada exitosamente.'
        })


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetRequestView(APIView):
    """Request password reset - sends email with token"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = CustomUser.objects.get(email=email)
        
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        
        token = PasswordResetToken.objects.create(
            user=user,
            token=str(uuid.uuid4()),
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        return Response({
            'success': True,
            'message': 'Se ha enviado un enlace de recuperación a tu correo electrónico.',
            'reset_token': token.token
        })


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetConfirmView(APIView):
    """Confirm password reset with token"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reset_token = serializer.reset_token
        user = reset_token.user
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        reset_token.used = True
        reset_token.save()
        
        return Response({
            'success': True,
            'message': 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.'
        })


class ValidateTokenView(APIView):
    """Validate password reset token"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request, token):
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if reset_token.is_valid:
                return Response({
                    'valid': True,
                    'message': 'Token válido.'
                })
            else:
                return Response({
                    'valid': False,
                    'message': 'Este enlace ha expirado o ya fue utilizado.'
                }, status=status.HTTP_400_BAD_REQUEST)
        except PasswordResetToken.DoesNotExist:
            return Response({
                'valid': False,
                'message': 'Token inválido.'
            }, status=status.HTTP_400_BAD_REQUEST)


class CheckAuthView(APIView):
    """Check if user is authenticated"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'authenticated': True,
            'user': UserSerializer(request.user).data
        })


class LeadProfileView(APIView):
    """Complete LEAD profile view and update"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get complete user profile with LeadProfile"""
        user = request.user
        lead_profile, created = LeadProfile.objects.get_or_create(user=user)
        
        return Response({
            'success': True,
            'user': UserWithProfileSerializer(user).data
        })
    
    def put(self, request):
        """Update complete user profile including LeadProfile"""
        serializer = LeadProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.update(request.user, serializer.validated_data)
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente.',
            'user': UserWithProfileSerializer(request.user).data
        })
    
    def patch(self, request):
        """Partial update of user profile"""
        serializer = LeadProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.update(request.user, serializer.validated_data)
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente.',
            'user': UserWithProfileSerializer(request.user).data
        })


class MyRUCsView(APIView):
    """View user's registered RUCs"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all RUCs for the current user"""
        rucs = CustomerRUC.objects.filter(user=request.user).order_by('-is_primary', '-created_at')
        serializer = CustomerRUCSerializer(rucs, many=True)
        
        primary_ruc = CustomerRUC.get_primary_ruc(request.user)
        approved_rucs = CustomerRUC.get_approved_rucs(request.user)
        
        fallback_ruc = None
        fallback_company = None
        
        if not primary_ruc and rucs.count() == 0:
            try:
                from SalesModule.models import QuoteSubmission
                previous_quote = QuoteSubmission.objects.filter(
                    Q(contact_email__iexact=request.user.email) |
                    Q(lead__email__iexact=request.user.email) |
                    Q(owner=request.user)
                ).exclude(
                    Q(company_ruc__isnull=True) | Q(company_ruc='')
                ).order_by('-created_at').first()
                
                if previous_quote and previous_quote.company_ruc:
                    fallback_ruc = previous_quote.company_ruc
                    fallback_company = previous_quote.company_name
            except Exception:
                pass
        
        return Response({
            'success': True,
            'rucs': serializer.data,
            'primary_ruc': CustomerRUCSerializer(primary_ruc).data if primary_ruc else None,
            'approved_count': approved_rucs.count(),
            'has_primary': primary_ruc is not None,
            'fallback_ruc': fallback_ruc,
            'fallback_company': fallback_company,
        })


class RegisterRUCView(APIView):
    """Register a new RUC for the current user"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Create a new RUC registration"""
        serializer = CustomerRUCCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        ruc = serializer.save()
        
        if ruc.is_primary:
            message = 'RUC principal registrado exitosamente.'
        else:
            message = 'Solicitud de RUC adicional enviada. Pendiente de aprobación por el administrador.'
        
        return Response({
            'success': True,
            'message': message,
            'ruc': CustomerRUCSerializer(ruc).data,
            'requires_approval': not ruc.is_primary
        }, status=status.HTTP_201_CREATED)


class CheckRUCView(APIView):
    """Check if a RUC is already registered - privacy-safe version"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        ruc = request.query_params.get('ruc', '').strip()
        
        if not ruc:
            return Response({
                'error': 'El parámetro RUC es requerido.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not ruc.isdigit() or len(ruc) != 13:
            return Response({
                'valid': False,
                'available': False,
                'message': 'El RUC debe tener exactamente 13 dígitos numéricos.'
            })
        
        is_mine = CustomerRUC.objects.filter(ruc=ruc, user=request.user).exists()
        
        if is_mine:
            return Response({
                'valid': True,
                'is_mine': True,
                'available': False,
                'message': 'Este RUC ya está registrado en tu cuenta.'
            })
        
        exists_other = CustomerRUC.objects.filter(ruc=ruc).exclude(user=request.user).exists()
        
        return Response({
            'valid': True,
            'is_mine': False,
            'available': not exists_other,
            'message': 'RUC no disponible.' if exists_other else 'RUC disponible para registro.'
        })


class PendingRUCApprovalsView(APIView):
    """Master Admin view for pending RUC approvals"""
    permission_classes = [AllowAny]
    
    def _is_master_admin(self, request):
        """Check if request is from Master Admin (custom token) or superuser (JWT)"""
        from MasterAdmin.authentication import validate_master_admin_session
        
        master_token = request.headers.get('X-Master-Admin-Token')
        if master_token and validate_master_admin_session(master_token):
            return True
        
        if hasattr(request, 'user') and request.user.is_authenticated:
            return request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'
        
        return False
    
    def get(self, request):
        """Get all pending RUC approval requests"""
        if not self._is_master_admin(request):
            return Response({
                'error': 'No tiene permisos para acceder a esta función.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        pending_rucs = CustomerRUC.objects.filter(status='pending').select_related('user').order_by('-created_at')
        serializer = CustomerRUCSerializer(pending_rucs, many=True)
        
        return Response({
            'success': True,
            'pending_count': pending_rucs.count(),
            'pending_rucs': serializer.data
        })
    
    def post(self, request, pk):
        """Approve or reject a RUC request"""
        if not self._is_master_admin(request):
            return Response({
                'error': 'No tiene permisos para realizar esta acción.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            ruc_request = CustomerRUC.objects.get(pk=pk, status='pending')
        except CustomerRUC.DoesNotExist:
            return Response({
                'error': 'Solicitud de RUC no encontrada o ya procesada.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = RUCApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action = serializer.validated_data['action']
        admin_notes = serializer.validated_data.get('admin_notes', '')
        
        ruc_request.admin_notes = admin_notes
        if hasattr(request, 'user') and request.user.is_authenticated and hasattr(request.user, 'pk'):
            ruc_request.reviewed_by = request.user
        ruc_request.reviewed_at = timezone.now()
        
        if action == 'approve':
            ruc_request.status = 'approved'
            
            user_has_primary = CustomerRUC.objects.filter(
                user=ruc_request.user, 
                is_primary=True
            ).exists()
            
            if not user_has_primary:
                ruc_request.is_primary = True
            
            message = f'RUC {ruc_request.ruc} aprobado exitosamente.'
        else:
            ruc_request.status = 'rejected'
            message = f'RUC {ruc_request.ruc} rechazado.'
        
        ruc_request.save()
        
        return Response({
            'success': True,
            'message': message,
            'ruc': CustomerRUCSerializer(ruc_request).data
        })


class NotificationPreferencesView(generics.RetrieveUpdateAPIView):
    """View for managing user notification preferences"""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer
    
    def get_object(self):
        prefs = NotificationPreference.get_or_create_for_user(self.request.user)
        return prefs
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'preferences': serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'success': True,
            'message': 'Preferencias de notificación actualizadas.',
            'preferences': serializer.data
        })
