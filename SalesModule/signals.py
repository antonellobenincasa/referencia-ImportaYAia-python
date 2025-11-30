from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Lead

@receiver(post_save, sender=Lead)
def auto_update_lead_status(sender, instance, created, **kwargs):
    """
    Automatically change NUEVO status to PROSPECTO after 7 days
    """
    if instance.status == 'nuevo':
        days_since_creation = (timezone.now() - instance.created_at).days
        if days_since_creation >= 7:
            # Update without triggering signal again
            Lead.objects.filter(id=instance.id).update(status='prospecto')

@receiver(pre_save, sender=Lead)
def update_lead_status_signal(sender, instance, **kwargs):
    """
    Pre-save check to ensure automatic status updates
    """
    if instance.pk:  # Only for existing leads
        try:
            old_instance = Lead.objects.get(pk=instance.pk)
            if old_instance.status == 'nuevo' and instance.status == 'nuevo':
                days_since_creation = (timezone.now() - instance.created_at).days
                if days_since_creation >= 7:
                    instance.status = 'prospecto'
        except Lead.DoesNotExist:
            pass
