from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # --- 1. Panel de Administración (Jazzmin) ---
    path('admin/', admin.site.urls),
    
    # --- 2. SISTEMA DE IDIOMAS (SOLUCIÓN AL ERROR) ---
    # Esta línea permite que el botón de cambiar idioma funcione
    path("i18n/", include("django.conf.urls.i18n")),
    
    # --- 3. Rutas de tus Módulos (APIs) ---
    # Asegúrate de que SalesModule tenga un archivo urls.py. 
    # Si te da error aquí, comenta esta línea con un # al inicio.
    path('api/sales/', include('SalesModule.urls')),
    
    # --- 3.1 Rutas de Autenticación (accounts) ---
    # --- 3.1 Rutas de Autenticación (accounts) ---
    path('api/accounts/', include('accounts.urls')), 
    
    # --- 3.2 Rutas de Master Admin ---
    path('api/admin/', include('MasterAdmin.urls')), 
]

# --- 4. Configuración de Archivos Estáticos y Media (Modo Desarrollo) ---
# Esto permite ver imágenes y estilos cuando DEBUG = True
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)