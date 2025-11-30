from django.db import migrations, models
import django.utils.timezone
from django.utils.translation import gettext_lazy as _

class Migration(migrations.Migration):

    dependencies = [
        ('SalesModule', '0003_apikey_bulkleadimport'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lead',
            name='status',
            field=models.CharField(
                _('Estado'), 
                max_length=25, 
                choices=[
                    ('nuevo', _('Nuevo')),
                    ('prospecto', _('Prospecto')),
                    ('contacto_establecido', _('Contacto Establecido')),
                    ('proceso_cotizacion', _('Proceso Cotización')),
                    ('oferta_presentada', _('Oferta Presentada')),
                    ('negociacion', _('Negociación')),
                    ('cotizacion_aprobada', _('Cotización Aprobada')),
                ],
                default='nuevo'
            ),
        ),
    ]
