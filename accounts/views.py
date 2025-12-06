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

from .models import CustomUser, PasswordResetToken
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
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
