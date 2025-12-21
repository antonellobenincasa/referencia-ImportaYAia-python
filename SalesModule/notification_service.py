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
    
    @classmethod
    def send_quote_request_notification(cls, quote):
        """Send notification when a quote request is submitted."""
        try:
            user = quote.owner
            if not user or not user.email:
                return False
            
            prefs = cls.get_user_preferences(user)
            if not prefs.email_alerts_enabled:
                return False
            
            base_url = cls._get_base_url()
            quote_link = f"{base_url}/portal/cotizaciones"
            
            fob_value = quote.fob_value_usd or 0
            
            subject = "[ImportaYa.ia] Su solicitud de cotización ha sido recibida"
            message = f"""
Estimado/a {user.get_full_name() or user.email},

Hemos recibido su solicitud de cotización con los siguientes datos:

📦 Tipo de carga: {quote.transport_type or 'N/A'}
🌍 Origen: {quote.origin or 'N/A'}
📍 Destino: {quote.destination or 'Guayaquil, Ecuador'}
💰 Valor FOB: ${fob_value:,.2f} USD

Nuestro sistema está procesando su solicitud. Le notificaremos cuando su cotización esté lista.

👉 Ver mis cotizaciones: {quote_link}

Saludos cordiales,
El equipo de ImportaYa.ia

---
ImportaYa.ia - La logística de carga integral, ahora es Inteligente!
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@importaya.ia',
                recipient_list=[user.email],
                fail_silently=True,
            )
            logger.info(f"Quote request notification sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Error sending quote request notification: {e}")
            return False
    
    @classmethod
    def send_quote_generated_notification(cls, quote):
        """Send notification when a quote has been generated with scenarios."""
        try:
            user = quote.owner
            if not user or not user.email:
                return False
            
            prefs = cls.get_user_preferences(user)
            if not prefs.email_alerts_enabled:
                return False
            
            base_url = cls._get_base_url()
            quote_link = f"{base_url}/portal/cotizaciones"
            
            scenario_count = quote.scenarios.count() if hasattr(quote, 'scenarios') else 0
            
            subject = "[ImportaYa.ia] Su cotización está lista"
            message = f"""
Estimado/a {user.get_full_name() or user.email},

¡Excelentes noticias! Su cotización ha sido generada y está lista para su revisión.

📋 Número de solicitud: {quote.submission_number or 'N/A'}
📦 Tipo de carga: {quote.transport_type or 'N/A'}
🌍 Origen: {quote.origin or 'N/A'}
📍 Destino: {quote.destination or 'Guayaquil, Ecuador'}
🎯 Escenarios disponibles: {scenario_count}

Revise las diferentes opciones y seleccione la que mejor se adapte a sus necesidades.

👉 Ver mi cotización: {quote_link}

Saludos cordiales,
El equipo de ImportaYa.ia

---
ImportaYa.ia - La logística de carga integral, ahora es Inteligente!
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@importaya.ia',
                recipient_list=[user.email],
                fail_silently=True,
            )
            logger.info(f"Quote generated notification sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Error sending quote generated notification: {e}")
            return False
    
    @classmethod
    def send_quote_approved_notification(cls, quote, scenario):
        """Send notification when a quote scenario is approved."""
        try:
            user = quote.owner
            if not user or not user.email:
                return False
            
            prefs = cls.get_user_preferences(user)
            if not prefs.email_alerts_enabled:
                return False
            
            base_url = cls._get_base_url()
            instructions_link = f"{base_url}/portal/instrucciones"
            
            scenario_name = scenario.scenario_type if hasattr(scenario, 'scenario_type') else 'Seleccionado'
            total = scenario.total_price if hasattr(scenario, 'total_price') else 0
            
            subject = "[ImportaYa.ia] Cotización aprobada - Siguiente paso: Instrucciones de Embarque"
            message = f"""
Estimado/a {user.get_full_name() or user.email},

¡Felicitaciones! Ha aprobado su cotización. Aquí está el resumen:

📋 Número de solicitud: {quote.submission_number or 'N/A'}
🎯 Escenario seleccionado: {scenario_name}
💵 Total: ${total:,.2f} USD

📌 SIGUIENTE PASO:
Ahora puede proceder a completar las instrucciones de embarque (Shipping Instructions) para generar su Orden de Ruteo (RO).

👉 Completar instrucciones: {instructions_link}

Saludos cordiales,
El equipo de ImportaYa.ia

---
ImportaYa.ia - La logística de carga integral, ahora es Inteligente!
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@importaya.ia',
                recipient_list=[user.email],
                fail_silently=True,
            )
            logger.info(f"Quote approved notification sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Error sending quote approved notification: {e}")
            return False
    
    @classmethod
    def send_ro_issued_notification(cls, shipping_instruction):
        """Send notification when a Routing Order is issued."""
        try:
            quote = shipping_instruction.quote_submission
            user = quote.owner
            if not user or not user.email:
                return False
            
            prefs = cls.get_user_preferences(user)
            if not prefs.email_alerts_enabled:
                return False
            
            base_url = cls._get_base_url()
            tracking_link = f"{base_url}/portal/tracking"
            
            ro_number = shipping_instruction.ro_number or 'N/A'
            
            subject = f"[ImportaYa.ia] Orden de Ruteo generada - RO: {ro_number}"
            message = f"""
Estimado/a {user.get_full_name() or user.email},

Su Orden de Ruteo (RO) ha sido generada exitosamente:

🚢 Número de RO: {ro_number}
📦 Tipo de carga: {quote.transport_type or 'N/A'}
🌍 Origen: {quote.origin or 'N/A'}
📍 Destino: {quote.destination or 'Guayaquil, Ecuador'}

📌 ¿QUÉ SIGUE?
Nuestro equipo de operaciones coordinará el embarque de su carga. Podrá seguir el estado de su envío en tiempo real desde el portal.

👉 Ver tracking de mi carga: {tracking_link}

Saludos cordiales,
El equipo de ImportaYa.ia

---
ImportaYa.ia - La logística de carga integral, ahora es Inteligente!
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@importaya.ia',
                recipient_list=[user.email],
                fail_silently=True,
            )
            logger.info(f"RO issued notification sent to {user.email} for RO: {ro_number}")
            return True
        except Exception as e:
            logger.error(f"Error sending RO issued notification: {e}")
            return False
    
    @staticmethod
    def _get_base_url():
        """Get the base URL for deep links."""
        import os
        domain = os.environ.get('REPLIT_DEV_DOMAIN', os.environ.get('REPLIT_DOMAINS', 'importaya.ia'))
        return f"https://{domain}"
