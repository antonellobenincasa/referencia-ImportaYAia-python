"""
Notification Service for ImportaYa.ia
Handles email and push notifications for cargo tracking updates.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from accounts.models import NotificationPreference
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending notifications to users about cargo tracking updates."""
    
    @staticmethod
    def get_user_preferences(user):
        """Get or create notification preferences for a user."""
        return NotificationPreference.get_or_create_for_user(user)
    
    @classmethod
    def send_milestone_notification(cls, milestone, old_status=None):
        """
        Send notification when a milestone is updated.
        Checks user preferences before sending.
        """
        try:
            shipping_instruction = milestone.shipping_instruction
            quote = shipping_instruction.quote
            user = quote.user
            
            if not user:
                logger.warning(f"No user found for milestone {milestone.id}")
                return False
            
            prefs = cls.get_user_preferences(user)
            
            if not prefs.milestone_updates:
                logger.info(f"User {user.email} has disabled milestone notifications")
                return False
            
            milestone_label = milestone.get_milestone_key_display()
            ro_number = shipping_instruction.ro_number or 'N/A'
            
            subject = f"[ImportaYa.ia] Actualización de Tracking - {milestone_label}"
            
            context = {
                'user_name': user.get_full_name() or user.email,
                'ro_number': ro_number,
                'milestone_label': milestone_label,
                'milestone_status': milestone.get_status_display(),
                'actual_date': milestone.actual_date,
                'planned_date': milestone.planned_date,
                'notes': milestone.notes,
                'current_year': timezone.now().year,
            }
            
            if prefs.email_alerts_enabled:
                cls._send_email_notification(user.email, subject, context)
            
            if prefs.push_alerts_enabled:
                cls._send_push_notification(user, milestone_label, ro_number)
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending milestone notification: {e}")
            return False
    
    @classmethod
    def send_bulk_milestone_update_notification(cls, shipping_instruction, updated_milestones):
        """
        Send a consolidated notification for bulk milestone updates.
        """
        try:
            quote = shipping_instruction.quote
            user = quote.user
            
            if not user:
                return False
            
            prefs = cls.get_user_preferences(user)
            
            if not prefs.milestone_updates:
                return False
            
            ro_number = shipping_instruction.ro_number or 'N/A'
            subject = f"[ImportaYa.ia] Actualización Masiva de Tracking - RO: {ro_number}"
            
            milestone_summaries = []
            for milestone in updated_milestones:
                milestone_summaries.append({
                    'label': milestone.get_milestone_key_display(),
                    'status': milestone.get_status_display(),
                    'actual_date': milestone.actual_date,
                })
            
            context = {
                'user_name': user.get_full_name() or user.email,
                'ro_number': ro_number,
                'milestones': milestone_summaries,
                'update_count': len(updated_milestones),
                'current_year': timezone.now().year,
            }
            
            if prefs.email_alerts_enabled:
                cls._send_bulk_email_notification(user.email, subject, context)
            
            if prefs.push_alerts_enabled:
                cls._send_push_notification(
                    user, 
                    f"{len(updated_milestones)} hitos actualizados", 
                    ro_number
                )
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending bulk milestone notification: {e}")
            return False
    
    @staticmethod
    def _send_email_notification(email, subject, context):
        """Send email notification for single milestone update."""
        try:
            message = f"""
Estimado/a {context['user_name']},

Su embarque con RO: {context['ro_number']} ha alcanzado un nuevo hito:

📍 Hito: {context['milestone_label']}
📌 Estado: {context['milestone_status']}
"""
            if context.get('actual_date'):
                message += f"📅 Fecha: {context['actual_date'].strftime('%d/%m/%Y %H:%M')}\n"
            
            if context.get('notes'):
                message += f"📝 Notas: {context['notes']}\n"
            
            message += """

Puede ver el estado completo de su embarque en el portal de ImportaYa.ia.

Saludos cordiales,
El equipo de ImportaYa.ia

---
ImportaYa.ia - La logística de carga integral, ahora es Inteligente!
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@importaya.ia',
                recipient_list=[email],
                fail_silently=True,
            )
            logger.info(f"Email notification sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {e}")
            return False
    
    @staticmethod
    def _send_bulk_email_notification(email, subject, context):
        """Send email notification for bulk milestone updates."""
        try:
            message = f"""
Estimado/a {context['user_name']},

Su embarque con RO: {context['ro_number']} ha recibido {context['update_count']} actualizaciones:

"""
            for m in context['milestones']:
                message += f"  ✓ {m['label']} - {m['status']}"
                if m.get('actual_date'):
                    message += f" ({m['actual_date'].strftime('%d/%m/%Y')})"
                message += "\n"
            
            message += """

Puede ver el estado completo de su embarque en el portal de ImportaYa.ia.

Saludos cordiales,
El equipo de ImportaYa.ia

---
ImportaYa.ia - La logística de carga integral, ahora es Inteligente!
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@importaya.ia',
                recipient_list=[email],
                fail_silently=True,
            )
            logger.info(f"Bulk email notification sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send bulk email to {email}: {e}")
            return False
    
    @staticmethod
    def _send_push_notification(user, title, ro_number):
        """
        Send push notification (mock implementation).
        In production, integrate with FCM, OneSignal, or similar service.
        """
        try:
            logger.info(f"[MOCK PUSH] User: {user.email}, Title: {title}, RO: {ro_number}")
            return True
        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
            return False
