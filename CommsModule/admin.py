from django.contrib import admin
from .models import InboxMessage


@admin.register(InboxMessage)
class InboxMessageAdmin(admin.ModelAdmin):
    list_display = ('sender_name', 'lead', 'source', 'direction', 'status', 'created_at')
    list_filter = ('source', 'direction', 'status')
    search_fields = ('sender_name', 'sender_identifier', 'message_body', 'lead__company_name')
    date_hierarchy = 'created_at'
    readonly_fields = ('external_message_id',)
