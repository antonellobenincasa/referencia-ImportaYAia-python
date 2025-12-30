from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError
from datetime import date, timedelta # <--- IMPORTANTE: Necesario para el cálculo

# --- 1. VALIDADOR DE RUC ---
def validar_ruc_ecuador(value):
    """
    Valida que el RUC tenga 13 dígitos, sea numérico y termine en 001.
    """
    if not value.isdigit():
        raise ValidationError('El RUC debe contener solo números.')
    
    if len(value) != 13:
        raise ValidationError('El RUC debe tener exactamente 13 dígitos.')
    
    if not value.endswith('001'):
        raise ValidationError('El RUC inválido. Debe terminar obligatoriamente en "001".')

# --- 2. MODELO DE USUARIO PERSONALIZADO (Con Roles y Marketing) ---
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    
    ROLE_CHOICES = [
        ('lead_importer', 'Lead / Importador'),
        ('freight_forwarder', 'Freight Forwarder'),
        ('staff', 'Staff de la App'),
    ]
    
    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default='lead_importer',
        verbose_name="Rol en la Plataforma",
        help_text="Define el tipo de usuario y sus permisos básicos."
    )

    # --- CAMPOS DE MARKETING ---
    birth_date = models.DateField(
        null=True, blank=True, 
        verbose_name="Fecha de Nacimiento (Cumpleaños)",
        help_text="El sistema calculará automáticamente el vencimiento del regalo."
    )

    has_active_gift = models.BooleanField(
        default=False, 
        verbose_name="¿Tiene Regalo Digital Activo?",
        help_text="Se activa automáticamente en el cumpleaños."
    )
    
    gift_expiry_date = models.DateField(
        null=True, blank=True, 
        verbose_name="Vencimiento del Regalo ($100 OFF)",
        help_text="Cálculo automático: 30 días después del cumpleaños."
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email

    # --- LÓGICA DE NEGOCIO AUTOMÁTICA ---
    def save(self, *args, **kwargs):
        # Si se ingresó una fecha de nacimiento, calculamos el vencimiento
        if self.birth_date:
            today = date.today()
            try:
                # Intentamos poner el cumpleaños en este año
                next_birthday = self.birth_date.replace(year=today.year)
            except ValueError:
                # Caso especial: Nació un 29 de febrero y este año no es bisiesto
                next_birthday = self.birth_date.replace(year=today.year, month=3, day=1)

            # Si el cumpleaños ya pasó este año, calculamos para el siguiente para el regalo futuro
            # NOTA: Si queremos dar el regalo ESTE año aunque ya haya pasado el cumple (ej: se registra hoy y su cumple fue ayer),
            # la lógica cambia. Pero asumiendo lógica de "próximo cumpleaños":
            if next_birthday < today:
                next_birthday = next_birthday.replace(year=today.year + 1)
            
            # REGLA DE NEGOCIO: Vence 30 días después del cumpleaños calculado
            self.gift_expiry_date = next_birthday + timedelta(days=30)
            
            # Opcional: Si hoy es exactamente el cumpleaños, activamos el regalo
            if today == next_birthday:
                 self.has_active_gift = True

        super().save(*args, **kwargs)

# --- 3. MODELO DE RUCs DE CLIENTES ---
class CustomerRUC(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rucs',
        verbose_name="Usuario Propietario"
    )
    
    ruc = models.CharField(
        max_length=13, 
        unique=True, 
        verbose_name="Número de RUC",
        validators=[validar_ruc_ecuador],
        help_text="Ingrese los 13 dígitos. Debe terminar en 001."
    )
    
    company_name = models.CharField(max_length=255, verbose_name="Razón Social")
    
    is_primary = models.BooleanField(
        default=True, 
        verbose_name="Es RUC Principal",
        help_text="Si marca esto, cualquier otro RUC de este usuario dejará de ser principal."
    )
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente Aprobación'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Estado"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")

    class Meta:
        verbose_name = "RUC de Cliente"
        verbose_name_plural = "RUCs de Clientes"

    def __str__(self):
        return f"{self.ruc} - {self.company_name}"

    def save(self, *args, **kwargs):
        # Si este RUC se marca como principal, desmarcar otros
        if self.is_primary:
            CustomerRUC.objects.filter(user=self.user).exclude(pk=self.pk).update(is_primary=False)
        
        super().save(*args, **kwargs)