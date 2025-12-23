from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import CustomUser, PasswordResetToken, LeadProfile, CustomerRUC, NotificationPreference
import uuid
from datetime import timedelta
from django.utils import timezone


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'company_name', 'phone', 'whatsapp', 'city',
            'role', 'platform'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': False},
            'platform': {'required': False},
        }
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value.lower()
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Las contraseñas no coinciden.'})
        
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        email = validated_data.get('email')
        base_username = email.split('@')[0].lower()
        username = base_username
        counter = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        validated_data['username'] = username
        
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        if not email or not password:
            raise serializers.ValidationError('Email y contraseña son requeridos.')
        
        user = authenticate(username=email, password=password)
        
        if not user:
            try:
                user_exists = CustomUser.objects.get(email=email)
                raise serializers.ValidationError('Contraseña incorrecta.')
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError('No existe una cuenta con este correo electrónico.')
        
        if not user.is_active:
            raise serializers.ValidationError('Esta cuenta ha sido desactivada.')
        
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'company_name', 'phone', 'whatsapp', 'city', 'country',
            'role', 'platform', 'is_email_verified', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'email', 'is_email_verified', 'date_joined', 'last_login']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    class Meta:
        model = CustomUser
        fields = [
            'first_name', 'last_name', 'company_name', 'phone', 'whatsapp', 'city', 'country'
        ]


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Las contraseñas no coinciden.'})
        
        try:
            validate_password(data['new_password'])
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        email = value.lower()
        if not CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError('No existe una cuenta con este correo electrónico.')
        return email


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_token(self, value):
        try:
            reset_token = PasswordResetToken.objects.get(token=value)
            if not reset_token.is_valid:
                raise serializers.ValidationError('Este enlace ha expirado o ya fue utilizado.')
            self.reset_token = reset_token
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Token inválido.')
        return value
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Las contraseñas no coinciden.'})
        
        try:
            validate_password(data['new_password'])
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        
        return data


class LeadProfileSerializer(serializers.ModelSerializer):
    """Serializer for LEAD extended profile"""
    class Meta:
        model = LeadProfile
        fields = [
            'ruc', 'legal_type', 'is_active_importer', 'senae_code',
            'business_address', 'postal_code',
            'preferred_trade_lane', 'preferred_transport',
            'main_products', 'average_monthly_volume',
            'customs_broker_name', 'customs_broker_code',
            'notification_email', 'notification_whatsapp',
            'notes', 'is_profile_complete',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['is_profile_complete', 'created_at', 'updated_at']
    
    def validate_ruc(self, value):
        """Validate RUC format (13 numeric digits)"""
        if value:
            value = value.strip()
            if not value.isdigit() or len(value) != 13:
                raise serializers.ValidationError('El RUC debe tener exactamente 13 dígitos numéricos.')
        return value


class UserWithProfileSerializer(serializers.ModelSerializer):
    """Complete user serializer with LeadProfile"""
    full_name = serializers.SerializerMethodField()
    lead_profile = LeadProfileSerializer(read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'company_name', 'phone', 'whatsapp', 'city', 'country',
            'role', 'platform', 'is_email_verified', 'date_joined', 'last_login',
            'lead_profile'
        ]
        read_only_fields = ['id', 'email', 'is_email_verified', 'date_joined', 'last_login']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class LeadProfileUpdateSerializer(serializers.Serializer):
    """Serializer for updating both user and lead profile"""
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    whatsapp = serializers.CharField(max_length=50, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False)
    
    ruc = serializers.CharField(max_length=13, required=False, allow_blank=True)
    legal_type = serializers.ChoiceField(choices=LeadProfile.LEGAL_TYPE_CHOICES, required=False)
    is_active_importer = serializers.BooleanField(required=False)
    senae_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    business_address = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    preferred_trade_lane = serializers.ChoiceField(choices=LeadProfile.TRADE_LANE_CHOICES, required=False, allow_blank=True)
    preferred_transport = serializers.ChoiceField(choices=LeadProfile.PREFERRED_TRANSPORT_CHOICES, required=False, allow_blank=True)
    main_products = serializers.CharField(required=False, allow_blank=True)
    average_monthly_volume = serializers.CharField(max_length=100, required=False, allow_blank=True)
    customs_broker_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    customs_broker_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    notification_email = serializers.EmailField(required=False, allow_blank=True)
    notification_whatsapp = serializers.CharField(max_length=50, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_ruc(self, value):
        if value:
            value = value.strip()
            if not value.isdigit() or len(value) != 13:
                raise serializers.ValidationError('El RUC debe tener exactamente 13 dígitos numéricos.')
        return value
    
    def update(self, instance, validated_data):
        user_fields = ['first_name', 'last_name', 'company_name', 'phone', 'whatsapp', 'city', 'country']
        profile_fields = [
            'ruc', 'legal_type', 'is_active_importer', 'senae_code',
            'business_address', 'postal_code', 'preferred_trade_lane', 'preferred_transport',
            'main_products', 'average_monthly_volume', 'customs_broker_name', 'customs_broker_code',
            'notification_email', 'notification_whatsapp', 'notes'
        ]
        
        for field in user_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()
        
        instance.refresh_from_db()
        
        lead_profile, created = LeadProfile.objects.get_or_create(user=instance)
        for field in profile_fields:
            if field in validated_data:
                setattr(lead_profile, field, validated_data[field])
        
        lead_profile.user = instance
        lead_profile.save()
        
        return instance


class CustomerRUCSerializer(serializers.ModelSerializer):
    """Serializer for CustomerRUC model"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CustomerRUC
        fields = [
            'id', 'ruc', 'company_name', 'is_primary', 'status', 'status_display',
            'justification', 'relationship_description', 'admin_notes',
            'is_oce_registered', 'senae_verification_date',
            'user_email', 'user_name', 'reviewed_by', 'reviewed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'is_primary', 'status', 'admin_notes', 'reviewed_by', 
            'reviewed_at', 'created_at', 'updated_at', 'user_email', 'user_name', 'status_display'
        ]
    
    def get_user_name(self, obj):
        """Get full name of the user who owns this RUC"""
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return None
    
    def validate_ruc(self, value):
        """Validate RUC format and uniqueness"""
        if not value:
            raise serializers.ValidationError('El RUC es obligatorio.')
        
        value = value.strip()
        if not value.isdigit() or len(value) != 13:
            raise serializers.ValidationError('El RUC debe tener exactamente 13 dígitos numéricos.')
        
        instance = self.instance
        if CustomerRUC.objects.filter(ruc=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError('Este RUC ya está registrado en el sistema por otro usuario.')
        
        return value


class CustomerRUCCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new CustomerRUC"""
    
    class Meta:
        model = CustomerRUC
        fields = ['ruc', 'company_name', 'justification', 'relationship_description', 'is_oce_registered']
    
    def validate_ruc(self, value):
        """Validate RUC format and uniqueness"""
        if not value:
            raise serializers.ValidationError('El RUC es obligatorio.')
        
        value = value.strip()
        if not value.isdigit() or len(value) != 13:
            raise serializers.ValidationError('El RUC debe tener exactamente 13 dígitos numéricos.')
        
        if CustomerRUC.ruc_exists(value):
            raise serializers.ValidationError('Este RUC ya está registrado en el sistema.')
        
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        has_primary = CustomerRUC.objects.filter(user=user, is_primary=True).exists()
        
        if not has_primary:
            validated_data['is_primary'] = True
            validated_data['status'] = 'primary'
        else:
            validated_data['is_primary'] = False
            validated_data['status'] = 'pending'
        
        validated_data['user'] = user
        return super().create(validated_data)


class RUCApprovalSerializer(serializers.Serializer):
    """Serializer for approving/rejecting RUC requests"""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    admin_notes = serializers.CharField(required=False, allow_blank=True)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for user notification preferences"""
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'email_alerts_enabled', 'push_alerts_enabled',
            'milestone_updates', 'eta_changes', 'document_updates',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
