"""
MASTER ADMIN URL Configuration
Private, hidden URL paths for super administrator access.
"""
from django.urls import path
from .views import (
    MasterAdminLoginView,
    MasterAdminLogoutView,
    MasterAdminDashboardView,
    MasterAdminUsersView,
    MasterAdminCotizacionesView,
    MasterAdminShipmentsView,
    MasterAdminRatesView,
    MasterAdminProfitReviewView,
    MasterAdminLogsView,
    MasterAdminExportView,
    MasterAdminPortsView,
    MasterAdminAirportsView,
    MasterAdminProvidersView,
    MasterAdminProviderRatesView,
    MasterAdminFreightRateFCLView,
    MasterAdminProfitMarginView,
    MasterAdminLocalCostView,
)

urlpatterns = [
    path('auth/login/', MasterAdminLoginView.as_view(), name='master-admin-login'),
    path('auth/logout/', MasterAdminLogoutView.as_view(), name='master-admin-logout'),
    path('dashboard/', MasterAdminDashboardView.as_view(), name='master-admin-dashboard'),
    path('users/', MasterAdminUsersView.as_view(), name='master-admin-users'),
    path('cotizaciones/', MasterAdminCotizacionesView.as_view(), name='master-admin-cotizaciones'),
    path('shipments/', MasterAdminShipmentsView.as_view(), name='master-admin-shipments'),
    path('rates/', MasterAdminRatesView.as_view(), name='master-admin-rates'),
    path('profit-review/', MasterAdminProfitReviewView.as_view(), name='master-admin-profit'),
    path('logs/', MasterAdminLogsView.as_view(), name='master-admin-logs'),
    path('export/', MasterAdminExportView.as_view(), name='master-admin-export'),
    path('ports/', MasterAdminPortsView.as_view(), name='master-admin-ports'),
    path('airports/', MasterAdminAirportsView.as_view(), name='master-admin-airports'),
    path('providers/', MasterAdminProvidersView.as_view(), name='master-admin-providers'),
    path('provider-rates/', MasterAdminProviderRatesView.as_view(), name='master-admin-provider-rates'),
    path('freight-rates/', MasterAdminFreightRateFCLView.as_view(), name='master-admin-freight-rates'),
    path('profit-margins/', MasterAdminProfitMarginView.as_view(), name='master-admin-profit-margins'),
    path('local-costs/', MasterAdminLocalCostView.as_view(), name='master-admin-local-costs'),
]
