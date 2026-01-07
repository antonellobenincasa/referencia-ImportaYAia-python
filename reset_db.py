import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hsamp.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("Deleting all users...")
User.objects.all().delete()
print("Users deleted.")

print("Creating Admin user...")
admin = User.objects.create_superuser(
    username='admin',
    email='admin@importaya.com', 
    password='AdminPass123!',
    first_name='Master',
    last_name='Admin'
)
print(f"Admin created: {admin.email}")

print("Creating Test Importer User...")
user = User.objects.create_user(
    username='testuser',
    email='test@importaya.com', 
    password='UserPass123!',
    first_name='Juan',
    last_name='Perez',
    company_name='Importadora Test',
    phone='0991234567',
    role='lead_importer',
    platform='web'
)
print(f"Test User created: {user.email}")
