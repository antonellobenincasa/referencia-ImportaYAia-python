# Generated migration for new Lead status choices

from django.db import migrations, models
import django.utils.translation

class Migration(migrations.Migration):

    dependencies = [
        ('SalesModule', '0005_remove_lead_contact_name_lead_first_name_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lead',
            name='status',
            field=models.CharField(
                choices=[
                    ('nuevo', django.utils.translation.gettext_lazy('Nuevo')),
                    ('prospecto', django.utils.translation.gettext_lazy('Prospecto')),
                    ('contacto_establecido', django.utils.translation.gettext_lazy('Contacto Establecido')),
                    ('proceso_cotizacion', django.utils.translation.gettext_lazy('Proceso Cotización')),
                    ('oferta_presentada', django.utils.translation.gettext_lazy('Oferta Presentada')),
                    ('negociacion', django.utils.translation.gettext_lazy('Negociación')),
                    ('cotizacion_aprobada', django.utils.translation.gettext_lazy('Cotización Aprobada')),
                ],
                default='nuevo',
                max_length=25,
                verbose_name=django.utils.translation.gettext_lazy('Estado')
            ),
        ),
    ]
