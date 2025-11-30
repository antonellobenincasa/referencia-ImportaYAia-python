from django.contrib import admin
from .models import Lead, Opportunity, Quote, TaskReminder, Meeting


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'first_name', 'last_name', 'email', 'status', 'source', 'created_at')
    list_filter = ('status', 'source', 'country')
    search_fields = ('company_name', 'first_name', 'last_name', 'email', 'phone')
    date_hierarchy = 'created_at'


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ('opportunity_name', 'lead', 'stage', 'estimated_value', 'probability', 'created_at')
    list_filter = ('stage',)
    search_fields = ('opportunity_name', 'lead__company_name')
    date_hierarchy = 'created_at'


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ('quote_number', 'opportunity', 'status', 'final_price', 'sent_at', 'created_at')
    list_filter = ('status', 'incoterm', 'cargo_type')
    search_fields = ('quote_number', 'opportunity__opportunity_name')
    date_hierarchy = 'created_at'
    readonly_fields = ('quote_number',)


@admin.register(TaskReminder)
class TaskReminderAdmin(admin.ModelAdmin):
    list_display = ('title', 'lead', 'task_type', 'priority', 'status', 'due_date')
    list_filter = ('task_type', 'priority', 'status')
    search_fields = ('title', 'description')
    date_hierarchy = 'due_date'


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'lead', 'meeting_type', 'meeting_datetime', 'status')
    list_filter = ('meeting_type', 'status')
    search_fields = ('title', 'lead__company_name')
    date_hierarchy = 'meeting_datetime'
