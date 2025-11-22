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
        'created_lead', 'created_quote', 'created_at'
    )
    list_filter = ('status', 'transport_type', 'is_existing_customer', 'is_company')
    search_fields = ('company_name', 'first_name', 'last_name', 'email', 'existing_customer_ruc', 'company_ruc')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'processed_at', 'submission_ip', 'created_lead', 'created_quote')
    
    def get_customer_name(self, obj):
        return obj.company_name or f"{obj.first_name} {obj.last_name}"
    get_customer_name.short_description = 'Cliente'
