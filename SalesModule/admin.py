from django.contrib import admin
from .models import (
    Lead, Opportunity, Quote, TaskReminder, Meeting, APIKey, BulkLeadImport,
    QuoteSubmission, QuoteSubmissionDocument, CostRate, LeadCotizacion, QuoteScenario, QuoteLineItem,
    FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate, CustomsBrokerageRate,
    Shipment, ShipmentTracking, PreLiquidation, PreLiquidationDocument, Port,
    ShippingInstruction, ShippingInstructionDocument, ShipmentMilestone,
    FreightForwarderConfig, FFQuoteCost, InlandFCLTariff, InlandSecurityTariff,
    LogisticsProvider, ProviderRate, Airport, AirportRegion, Container, 
    ManualQuoteRequest, TrackingTemplate
)

# --- CRM ---

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('lead_number', 'company_name', 'email', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('company_name', 'email', 'lead_number')

@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ('opportunity_name', 'lead', 'stage', 'estimated_value')
    list_filter = ('stage',)

@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    # Corregido: Quitamos 'sent_at' que no existe
    list_display = ('quote_number', 'opportunity', 'status', 'final_price', 'created_at')
    list_filter = ('status',)

@admin.register(TaskReminder)
class TaskReminderAdmin(admin.ModelAdmin):
    # Corregido: Quitamos 'task_type' y 'priority'
    list_display = ('title', 'lead', 'due_date', 'status')
    list_filter = ('status',)

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    # Corregido: Quitamos 'meeting_type'
    list_display = ('title', 'lead', 'meeting_datetime', 'status')
    list_filter = ('status',)

# --- COTIZADOR APP ---

@admin.register(QuoteSubmission)
class QuoteSubmissionAdmin(admin.ModelAdmin):
    list_display = ('submission_number', 'company_name', 'origin', 'destination', 'transport_type', 'status')
    list_filter = ('status', 'transport_type')
    search_fields = ('submission_number', 'company_name')

@admin.register(LeadCotizacion)
class LeadCotizacionAdmin(admin.ModelAdmin):
    list_display = ('numero_cotizacion', 'lead_user', 'origen_pais', 'destino_ciudad', 'total_usd', 'estado')
    list_filter = ('estado',)

@admin.register(ManualQuoteRequest)
class ManualQuoteRequestAdmin(admin.ModelAdmin):
    # CORREGIDO: Cambiamos 'company_name' (que no existe) por 'origin' y 'destination'
    list_display = ('request_number', 'origin', 'destination', 'status', 'created_at')
    list_filter = ('status',)

# --- LOGÍSTICA Y TARIFAS ---

@admin.register(FreightRate)
class FreightRateAdmin(admin.ModelAdmin):
    list_display = ('origin_port', 'destination_port', 'transport_type', 'rate_usd', 'is_active')
    list_filter = ('transport_type', 'is_active')

@admin.register(LogisticsProvider)
class LogisticsProviderAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'transport_type', 'is_active')

@admin.register(Port)
class PortAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'un_locode')
    search_fields = ('name', 'un_locode')

@admin.register(Airport)
class AirportAdmin(admin.ModelAdmin):
    list_display = ('name', 'iata_code', 'ciudad_exacta', 'country')
    search_fields = ('iata_code', 'ciudad_exacta')

@admin.register(Container)
class ContainerAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'volume_capacity_cbm', 'is_active')

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('tracking_number', 'lead_user', 'current_status', 'carrier_name')
    list_filter = ('current_status',)

@admin.register(ShippingInstruction)
class ShippingInstructionAdmin(admin.ModelAdmin):
    list_display = ('ro_number', 'shipper_name', 'consignee_name', 'status')

# --- REGISTRO SIMPLE DEL RESTO DE MODELOS ---
# (Para que aparezcan en el panel sin configuración especial)

admin.site.register(APIKey)
admin.site.register(BulkLeadImport)
admin.site.register(QuoteSubmissionDocument)
admin.site.register(CostRate)
admin.site.register(QuoteScenario)
admin.site.register(QuoteLineItem)
admin.site.register(InsuranceRate)
admin.site.register(CustomsDutyRate)
admin.site.register(InlandTransportQuoteRate)
admin.site.register(CustomsBrokerageRate)
admin.site.register(ShipmentTracking)
admin.site.register(PreLiquidation)
admin.site.register(PreLiquidationDocument)
admin.site.register(ShippingInstructionDocument)
admin.site.register(ShipmentMilestone)
admin.site.register(FreightForwarderConfig)
admin.site.register(FFQuoteCost)
admin.site.register(InlandFCLTariff)
admin.site.register(InlandSecurityTariff)
admin.site.register(ProviderRate)
admin.site.register(AirportRegion)
admin.site.register(TrackingTemplate)