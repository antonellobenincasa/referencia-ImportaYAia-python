from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    PasswordChangeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ValidateTokenView,
    CheckAuthView,
    LeadProfileView,
    MyRUCsView,
    RegisterRUCView,
    CheckRUCView,
    PendingRUCApprovalsView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', csrf_exempt(RegisterView.as_view()), name='register'),
    path('login/', csrf_exempt(LoginView.as_view()), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/complete/', LeadProfileView.as_view(), name='lead_profile'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    
    path('password/reset/', csrf_exempt(PasswordResetRequestView.as_view()), name='password_reset_request'),
    path('password/reset/confirm/', csrf_exempt(PasswordResetConfirmView.as_view()), name='password_reset_confirm'),
    path('password/reset/validate/<str:token>/', ValidateTokenView.as_view(), name='validate_reset_token'),
    
    path('check/', CheckAuthView.as_view(), name='check_auth'),
    
    # RUC Management endpoints
    path('my-rucs/', MyRUCsView.as_view(), name='my_rucs'),
    path('register-ruc/', RegisterRUCView.as_view(), name='register_ruc'),
    path('check-ruc/', CheckRUCView.as_view(), name='check_ruc'),
    path('admin/ruc-approvals/', PendingRUCApprovalsView.as_view(), name='pending_ruc_approvals'),
    path('admin/ruc-approvals/<int:pk>/', PendingRUCApprovalsView.as_view(), name='process_ruc_approval'),
]
