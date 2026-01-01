from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.admin.models import LogEntry
from .models import CustomerRUC, CustomUser

# --- 1. CONFIGURACIÓN DEL "INLINE" (Lista de RUCs dentro del Usuario) ---
class CustomerRUCInline(admin.TabularInline):
    model = CustomerRUC
    fk_name = 'user'  # Especificar el FK ya que hay múltiples FKs a CustomUser
    extra = 0
    can_delete = True
    show_change_link = True
    fields = ('ruc', 'company_name', 'status', 'is_primary')
    readonly_fields = ('created_at',)

# --- 2. ACCIONES PERSONALIZADAS PARA RUCs ---
@admin.action(description='✅ APROBAR RUCs seleccionados')
def mark_as_approved(modeladmin, request, queryset):
    updated = queryset.update(status='approved')
    modeladmin.message_user(request, f"{updated} RUC(s) marcados como APROBADOS.")

@admin.action(description='🚫 RECHAZAR RUCs seleccionados')
def mark_as_rejected(modeladmin, request, queryset):
    updated = queryset.update(status='rejected')
    modeladmin.message_user(request, f"{updated} RUC(s) marcados como RECHAZADOS.")

# --- 3. CONFIGURACIÓN DEL ADMIN DE USUARIOS (CustomUser) ---

# Des-registramos el usuario por defecto para usar el nuestro
try:
    admin.site.unregister(CustomUser)
except admin.sites.NotRegistered:
    pass

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # Lista principal de usuarios
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name', 'ruc')
    ordering = ('email',)

    # --- CONFIGURACIÓN DEL FORMULARIO DE EDICIÓN ---
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'role', 'ruc_list_display')
        }), 
        
        ('Fechas Importantes & Marketing', {
            'fields': (
                'last_login', 
                'date_joined', 
                'birth_date', 
                'has_active_gift', 
                'gift_expiry_date' # Este campo será de solo lectura abajo
            )
        }),

        ('Permisos de Acceso', {
            'fields': (
                'is_active',   # Check de Cliente Activo
                'is_staff',    # Permiso para entrar al admin (Staff)
                'groups',      # Grupos de permisos
                # NOTA: Se eliminó 'is_superuser' por seguridad
            ),
            'classes': ('collapse',), # Oculto por defecto para limpiar la vista
        }),
    )
    
    # --- CAMPOS DE SOLO LECTURA (Protección de Datos) ---
    # gift_expiry_date está aquí para que nadie lo altere manualmente
    readonly_fields = ('last_login', 'date_joined', 'ruc_list_display', 'gift_expiry_date')

    # Función auxiliar para mostrar los RUCs en el perfil (sin editar)
    def ruc_list_display(self, obj):
        return ", ".join([r.ruc for r in obj.customer_rucs.all()])
    ruc_list_display.short_description = "RUCs Asociados"

    # Insertamos la tabla de RUCs editables dentro del usuario
    inlines = [CustomerRUCInline]

# --- 4. CONFIGURACIÓN DE LA LISTA GLOBAL DE RUCs ---
@admin.register(CustomerRUC)
class CustomerRUCAdmin(admin.ModelAdmin):
    list_display = ('ruc', 'company_name', 'user', 'status', 'is_primary', 'created_at')
    list_display_links = ('ruc', 'company_name')
    list_filter = ('status', 'is_primary', 'created_at')
    search_fields = ('ruc', 'company_name', 'user__email')
    actions = [mark_as_approved, mark_as_rejected]
    ordering = ('-created_at',)

# --- 5. HISTORIAL DE ACCIONES (LOGS) ---
@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display = ('action_time', 'user', 'content_type', 'object_repr', 'action_flag', 'change_message')
    list_filter = ('action_time', 'user', 'content_type', 'action_flag')
    search_fields = ('object_repr', 'change_message', 'user__email')
    date_hierarchy = 'action_time'
    
    # Bloqueamos permisos para que sea solo lectura (Evidencia inmutable)
    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False