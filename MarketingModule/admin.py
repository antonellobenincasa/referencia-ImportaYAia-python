from django.contrib import admin
from .models import EmailTemplate, EmailCampaign, SocialMediaPost, LandingPage, LandingPageSubmission


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'subject')
    date_hierarchy = 'created_at'


@admin.register(EmailCampaign)
class EmailCampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'template', 'status', 'total_recipients', 'emails_sent', 'created_at')
    list_filter = ('status',)
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(SocialMediaPost)
class SocialMediaPostAdmin(admin.ModelAdmin):
    list_display = ('platform', 'content', 'status', 'scheduled_time', 'published_at')
    list_filter = ('platform', 'status')
    search_fields = ('content', 'hashtags')
    date_hierarchy = 'scheduled_time'


@admin.register(LandingPage)
class LandingPageAdmin(admin.ModelAdmin):
    list_display = ('name', 'title', 'is_active', 'total_visits', 'total_submissions', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'title', 'public_url_slug')
    date_hierarchy = 'created_at'
    prepopulated_fields = {'public_url_slug': ('name',)}


@admin.register(LandingPageSubmission)
class LandingPageSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        'landing_page', 'get_customer_name', 'transport_type', 'status', 
        'needs_customs_clearance', 'needs_insurance', 'needs_inland_transport',
        'created_lead', 'created_quote', 'created_at'
    )
    list_filter = (
        'status', 'transport_type', 'is_existing_customer', 'is_company',
        'needs_customs_clearance', 'needs_insurance', 'needs_inland_transport'
    )
    search_fields = (
        'company_name', 'first_name', 'last_name', 'email', 
        'existing_customer_ruc', 'company_ruc', 'inland_transport_city'
    )
    date_hierarchy = 'created_at'
    readonly_fields = (
        'created_at', 'processed_at', 'submission_ip', 'created_lead', 
        'created_quote', 'inland_transport_full_address'
    )
    
    fieldsets = (
        ('Información de Landing Page', {
            'fields': ('landing_page', 'status', 'submission_ip', 'submission_source_channel')
        }),
        ('Información del Cliente', {
            'fields': (
                'is_existing_customer', 'existing_customer_ruc',
                'is_company', 'company_name', 'company_ruc',
                'first_name', 'last_name', 'email', 'phone'
            )
        }),
        ('Detalles de Transporte', {
            'fields': (
                'transport_type', 'incoterm', 'origin_region',
                'airport_origin', 'airport_destination',
                'pol_port_of_lading', 'pod_port_of_discharge'
            )
        }),
        ('Detalles de Carga', {
            'fields': (
                'is_general_cargo', 'is_dg_cargo', 'msds_document',
                'gross_weight_kg', 'pieces_quantity',
                'dimension_unit', 'length', 'width', 'height', 'total_cbm',
                'is_stackable', 'container_type', 'pickup_address'
            )
        }),
        ('Servicios Complementarios', {
            'fields': (
                'needs_customs_clearance',
                'needs_insurance', 'cargo_cif_value_usd',
                'needs_inland_transport', 'inland_transport_city',
                'inland_transport_street', 'inland_transport_street_number',
                'inland_transport_zip_code', 'inland_transport_references',
                'inland_transport_full_address'
            ),
            'classes': ('collapse',)
        }),
        ('Comentarios', {
            'fields': ('lead_comments',)
        }),
        ('Resultado del Procesamiento', {
            'fields': (
                'created_lead', 'created_quote', 'quote_validity_days',
                'processed_at', 'error_message'
            )
        }),
    )
    
    def get_customer_name(self, obj):
        return obj.company_name or f"{obj.first_name} {obj.last_name}"
    get_customer_name.short_description = 'Cliente'
