from django.apps import AppConfig

class SalesModuleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'SalesModule'
    verbose_name = 'Sales Module'

    def ready(self):
        import SalesModule.signals
