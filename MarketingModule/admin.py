from django.contrib import admin
from .models import EmailTemplate, EmailCampaign, SocialMediaPost


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
