"""
load_ports.py - Comando de Django para poblar la tabla de Puertos Mundiales

Uso:
    python manage.py load_ports

Este script es idempotente: verifica si el UN/LOCODE ya existe antes de insertar.
"""

from django.core.management.base import BaseCommand
from SalesModule.models import Port


DATA_PUERTOS = [
    # --- NORTEAMÉRICA ---
    {"locode": "USLAX", "name": "Los Angeles", "country": "Estados Unidos", "region": "Norteamérica"},
    {"locode": "USLGB", "name": "Long Beach", "country": "Estados Unidos", "region": "Norteamérica"},
    {"locode": "USNYC", "name": "New York / New Jersey", "country": "Estados Unidos", "region": "Norteamérica"},
    {"locode": "USSAV", "name": "Savannah", "country": "Estados Unidos", "region": "Norteamérica"},
    {"locode": "USHOU", "name": "Houston", "country": "Estados Unidos", "region": "Norteamérica"},
    {"locode": "USSEA", "name": "Seattle", "country": "Estados Unidos", "region": "Norteamérica"},
    {"locode": "USTIW", "name": "Tacoma", "country": "Estados Unidos", "region": "Norteamérica"},
    {"locode": "USMIA", "name": "Miami", "country": "Estados Unidos", "region": "Norteamérica"},
    {"locode": "CAVAN", "name": "Vancouver", "country": "Canadá", "region": "Norteamérica"},
    {"locode": "CAMTR", "name": "Montreal", "country": "Canadá", "region": "Norteamérica"},
    {"locode": "CAPRR", "name": "Prince Rupert", "country": "Canadá", "region": "Norteamérica"},
    {"locode": "MXZLO", "name": "Manzanillo", "country": "México", "region": "Norteamérica"},
    {"locode": "MXVER", "name": "Veracruz", "country": "México", "region": "Norteamérica"},
    {"locode": "MXLZC", "name": "Lázaro Cárdenas", "country": "México", "region": "Norteamérica"},

    # --- LATINOAMÉRICA ---
    {"locode": "PABLB", "name": "Balboa", "country": "Panamá", "region": "Latinoamérica"},
    {"locode": "PAONX", "name": "Colón", "country": "Panamá", "region": "Latinoamérica"},
    {"locode": "PAMIT", "name": "Manzanillo (Panamá)", "country": "Panamá", "region": "Latinoamérica"},
    {"locode": "BRSSZ", "name": "Santos", "country": "Brasil", "region": "Latinoamérica"},
    {"locode": "BRPNG", "name": "Paranaguá", "country": "Brasil", "region": "Latinoamérica"},
    {"locode": "BRRIO", "name": "Rio de Janeiro", "country": "Brasil", "region": "Latinoamérica"},
    {"locode": "ARBUE", "name": "Buenos Aires", "country": "Argentina", "region": "Latinoamérica"},
    {"locode": "CLSAI", "name": "San Antonio", "country": "Chile", "region": "Latinoamérica"},
    {"locode": "CLVAP", "name": "Valparaíso", "country": "Chile", "region": "Latinoamérica"},
    {"locode": "PECLL", "name": "Callao", "country": "Perú", "region": "Latinoamérica"},
    {"locode": "COCTG", "name": "Cartagena", "country": "Colombia", "region": "Latinoamérica"},
    {"locode": "COBUN", "name": "Buenaventura", "country": "Colombia", "region": "Latinoamérica"},
    {"locode": "ECGYE", "name": "Guayaquil", "country": "Ecuador", "region": "Latinoamérica"},
    {"locode": "DOCAU", "name": "Caucedo", "country": "Rep. Dominicana", "region": "Latinoamérica"},

    # --- EUROPA ---
    {"locode": "NLRTM", "name": "Rotterdam", "country": "Países Bajos", "region": "Europa"},
    {"locode": "BEANR", "name": "Amberes (Antwerp)", "country": "Bélgica", "region": "Europa"},
    {"locode": "DEHAM", "name": "Hamburgo", "country": "Alemania", "region": "Europa"},
    {"locode": "DEBRV", "name": "Bremerhaven", "country": "Alemania", "region": "Europa"},
    {"locode": "GBFXT", "name": "Felixstowe", "country": "Reino Unido", "region": "Europa"},
    {"locode": "GBLGP", "name": "London Gateway", "country": "Reino Unido", "region": "Europa"},
    {"locode": "GBSOU", "name": "Southampton", "country": "Reino Unido", "region": "Europa"},
    {"locode": "FRLEH", "name": "Le Havre", "country": "Francia", "region": "Europa"},
    {"locode": "FRMRS", "name": "Marsella", "country": "Francia", "region": "Europa"},
    {"locode": "ESVLC", "name": "Valencia", "country": "España", "region": "Europa"},
    {"locode": "ESALG", "name": "Algeciras", "country": "España", "region": "Europa"},
    {"locode": "ESBCN", "name": "Barcelona", "country": "España", "region": "Europa"},
    {"locode": "ITGOA", "name": "Génova", "country": "Italia", "region": "Europa"},
    {"locode": "ITGIT", "name": "Gioia Tauro", "country": "Italia", "region": "Europa"},
    {"locode": "GRPIR", "name": "El Pireo", "country": "Grecia", "region": "Europa"},

    # --- ÁFRICA ---
    {"locode": "MAPTM", "name": "Tanger Med", "country": "Marruecos", "region": "África"},
    {"locode": "EGPSD", "name": "Port Said", "country": "Egipto", "region": "África"},
    {"locode": "EGALY", "name": "Alejandría", "country": "Egipto", "region": "África"},
    {"locode": "NGLOS", "name": "Lagos", "country": "Nigeria", "region": "África"},
    {"locode": "GHTEM", "name": "Tema", "country": "Ghana", "region": "África"},
    {"locode": "ZADUR", "name": "Durban", "country": "Sudáfrica", "region": "África"},
    {"locode": "ZACPT", "name": "Ciudad del Cabo", "country": "Sudáfrica", "region": "África"},
    {"locode": "ZAZBA", "name": "Ngqura (Coega)", "country": "Sudáfrica", "region": "África"},
    {"locode": "KEMBA", "name": "Mombasa", "country": "Kenia", "region": "África"},

    # --- ASIA ---
    {"locode": "CNSHA", "name": "Shanghái", "country": "China", "region": "Asia"},
    {"locode": "CNNBG", "name": "Ningbo-Zhoushan", "country": "China", "region": "Asia"},
    {"locode": "CNSZX", "name": "Shenzhen", "country": "China", "region": "Asia"},
    {"locode": "CNGGZ", "name": "Guangzhou", "country": "China", "region": "Asia"},
    {"locode": "CNQGD", "name": "Qingdao", "country": "China", "region": "Asia"},
    {"locode": "CNTSN", "name": "Tianjin", "country": "China", "region": "Asia"},
    {"locode": "CNXMN", "name": "Xiamen", "country": "China", "region": "Asia"},
    {"locode": "HKHKG", "name": "Hong Kong", "country": "Hong Kong", "region": "Asia"},
    {"locode": "KRPUS", "name": "Busan", "country": "Corea del Sur", "region": "Asia"},
    {"locode": "JPTYO", "name": "Tokio", "country": "Japón", "region": "Asia"},
    {"locode": "JPYOK", "name": "Yokohama", "country": "Japón", "region": "Asia"},
    {"locode": "JPUKB", "name": "Kobe", "country": "Japón", "region": "Asia"},
    {"locode": "TWKHH", "name": "Kaohsiung", "country": "Taiwán", "region": "Asia"},
    {"locode": "SGSIN", "name": "Singapur", "country": "Singapur", "region": "Asia"},
    {"locode": "MYPKG", "name": "Port Klang", "country": "Malasia", "region": "Asia"},
    {"locode": "MYTPP", "name": "Tanjung Pelepas", "country": "Malasia", "region": "Asia"},
    {"locode": "THLCH", "name": "Laem Chabang", "country": "Tailandia", "region": "Asia"},
    {"locode": "VNSGN", "name": "Ho Chi Minh (Cat Lai)", "country": "Vietnam", "region": "Asia"},
    {"locode": "INNSA", "name": "Nhava Sheva", "country": "India", "region": "Asia"},
    {"locode": "INMUN", "name": "Mundra", "country": "India", "region": "Asia"},
    {"locode": "INMAA", "name": "Chennai", "country": "India", "region": "Asia"},
    {"locode": "LKCMB", "name": "Colombo", "country": "Sri Lanka", "region": "Asia"},
    {"locode": "AEJEA", "name": "Jebel Ali", "country": "EAU", "region": "Asia"},
    {"locode": "SAJED", "name": "Jeddah", "country": "Arabia Saudita", "region": "Asia"},

    # --- OCEANÍA ---
    {"locode": "AUSYD", "name": "Sídney", "country": "Australia", "region": "Oceanía"},
    {"locode": "AUMEL", "name": "Melbourne", "country": "Australia", "region": "Oceanía"},
    {"locode": "AUBNE", "name": "Brisbane", "country": "Australia", "region": "Oceanía"},
    {"locode": "AUFRE", "name": "Fremantle", "country": "Australia", "region": "Oceanía"},
    {"locode": "NZAKL", "name": "Auckland", "country": "Nueva Zelanda", "region": "Oceanía"},
    {"locode": "NZTRG", "name": "Tauranga", "country": "Nueva Zelanda", "region": "Oceanía"},
]


class Command(BaseCommand):
    help = 'Carga los puertos mundiales en la base de datos (idempotente)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Actualiza los datos existentes si el UN/LOCODE ya existe',
        )

    def handle(self, *args, **options):
        force_update = options.get('force', False)
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        self.stdout.write(self.style.NOTICE(
            f'Iniciando carga de {len(DATA_PUERTOS)} puertos...'
        ))
        
        for puerto in DATA_PUERTOS:
            un_locode = puerto['locode']
            
            existing = Port.objects.filter(un_locode=un_locode).first()
            
            if existing:
                if force_update:
                    existing.name = puerto['name']
                    existing.country = puerto['country']
                    existing.region = puerto['region']
                    existing.save()
                    updated_count += 1
                    self.stdout.write(f'  Actualizado: {un_locode} - {puerto["name"]}')
                else:
                    skipped_count += 1
            else:
                Port.objects.create(
                    un_locode=un_locode,
                    name=puerto['name'],
                    country=puerto['country'],
                    region=puerto['region'],
                    is_active=True
                )
                created_count += 1
                self.stdout.write(f'  Creado: {un_locode} - {puerto["name"]}')
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'✓ Carga completada:'
        ))
        self.stdout.write(self.style.SUCCESS(f'  - Puertos creados: {created_count}'))
        if updated_count:
            self.stdout.write(self.style.SUCCESS(f'  - Puertos actualizados: {updated_count}'))
        if skipped_count:
            self.stdout.write(self.style.WARNING(f'  - Puertos omitidos (ya existen): {skipped_count}'))
        
        total = Port.objects.count()
        self.stdout.write(self.style.SUCCESS(f'  - Total puertos en BD: {total}'))
        
        self.stdout.write('')
        self.stdout.write('Resumen por región:')
        for region in ['Norteamérica', 'Latinoamérica', 'Europa', 'África', 'Asia', 'Oceanía']:
            count = Port.objects.filter(region=region).count()
            self.stdout.write(f'  - {region}: {count} puertos')
