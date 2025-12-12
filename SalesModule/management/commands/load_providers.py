"""
Management command to load logistics providers from Excel file.
Usage: python manage.py load_providers
"""
from django.core.management.base import BaseCommand
from SalesModule.models import LogisticsProvider
import re


class Command(BaseCommand):
    help = 'Load logistics providers from PROVEEDORES_LOGISTICOS Excel data'

    FCL_PROVIDERS = [
        'MAERSK', 'MSC', 'CMA-CGM', 'EMC', 'HPL', 'OOCL', 'WHL', 'COSCO',
        'DOLE', 'MARFRET', 'YANG MING', 'PIL', 'ZIM', 'SBM SEABOARD MARINE',
        'HMM', 'KING OCEAN'
    ]

    LCL_PROVIDERS = [
        ('SACO SHIPPING S.A.', 'SACO'),
        ('CHARTER LINK LOGISTICS ECUADOR S.A.S.', 'CHARTERLINK'),
        ('INCA LINES DEL ECUADOR INCALINES S.A.', 'INCALINES'),
        ('CRAFT ECUADOR MULTIMODAL CRAFTECMUL S.A.', 'CRAFTECMUL'),
        ('MARITIME SERVICES LINE DEL ECUADOR MSL DEL ECUADOR S.A.', 'MSL'),
        ('ECU - WORLDWIDE - (ECUADOR) S.A.', 'ECUWORLDWIDE'),
    ]

    AEREO_PROVIDERS = [
        'AVIANCA', 'AMERICAN AIRLINES', 'COPA',
        'DHL EXPRESS ECUADOR S.A. - DHL AERO EXPRESO SA',
        'EQUINOXAIR S.A.S.', 'LAN CARGO S.A.', 'LATAM-AIRLINES ECUADOR S.A.',
        'LUFTHANSA CARGO AKTIENGESELLSCHAFT', 'SANTA BARBARA AIRLINES',
        'MARTIN AIR', 'AEROTRANSPORTES MAS DE CARGA S.A. DE C.V. DBA MASAIR',
        'TAM LINHAS AEREAS S.A. DBA LATAM AIRLINES BRASIL', 'CATHAY PACIFIC',
        'AIR EUROPA', 'AIR PORTUGAL', 'POLAR AIR CARGO',
        'CARGOLUX GROUP / CARGOLUX AIRLINES INTERNATIONAL S.A',
        'QATAR AIRLINES', 'TAP PORTGAL', 'PLUS ULTRA LÍNEAS AÉREAS S.A.',
        'MASAIR CARGO AIRLINE', 'BRITISH AIRWAYS', 'EMIRATES',
        'TAMPA CARGO S.A.S.', 'AIR FRANCE.', 'CHINA AIRLINES',
        'TURK HAVA YOLLARI ANONIM O. (Turkish Airlines)', 'AIR CANADA',
        'DELTA AIR LINES', 'UNITED AIRLINES',
        'UPS UNITED PARCEL SERVICE / UNITED PARCEL SERVICE',
        'KLM', 'IBERIA', 'ATLAS AIR INC', 'AEROMEXICO', 'PRIME AIR S.A.'
    ]

    def generate_code(self, name, transport_type, existing_codes):
        name_clean = re.sub(r'[^A-Za-z0-9\s]', '', name.upper())
        words = name_clean.split()
        
        if len(words) == 1:
            code = words[0][:6]
        elif len(words) == 2:
            code = words[0][:3] + words[1][:3]
        else:
            code = ''.join([w[0] for w in words[:4]])
        
        code = code[:8]
        
        base_code = code
        counter = 1
        while code in existing_codes:
            code = f"{base_code[:6]}{counter}"
            counter += 1
        
        return code

    def handle(self, *args, **options):
        self.stdout.write('Loading logistics providers...')
        
        existing_codes = set(LogisticsProvider.objects.values_list('code', flat=True))
        created_count = 0
        updated_count = 0
        
        for idx, name in enumerate(self.FCL_PROVIDERS):
            code = self.generate_code(name, 'FCL', existing_codes)
            provider, created = LogisticsProvider.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'transport_type': 'FCL',
                    'priority': idx + 1,
                    'is_active': True,
                }
            )
            existing_codes.add(code)
            if created:
                created_count += 1
                self.stdout.write(f'  Created FCL: {name} ({code})')
            else:
                updated_count += 1
        
        for idx, (name, code) in enumerate(self.LCL_PROVIDERS):
            if code in existing_codes:
                code = self.generate_code(name, 'LCL', existing_codes)
            provider, created = LogisticsProvider.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'transport_type': 'LCL',
                    'priority': idx + 1,
                    'is_active': True,
                }
            )
            existing_codes.add(code)
            if created:
                created_count += 1
                self.stdout.write(f'  Created LCL: {name} ({code})')
            else:
                updated_count += 1
        
        for idx, name in enumerate(self.AEREO_PROVIDERS):
            code = self.generate_code(name, 'AEREO', existing_codes)
            provider, created = LogisticsProvider.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'transport_type': 'AEREO',
                    'priority': idx + 1,
                    'is_active': True,
                }
            )
            existing_codes.add(code)
            if created:
                created_count += 1
                self.stdout.write(f'  Created AEREO: {name} ({code})')
            else:
                updated_count += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully loaded providers: {created_count} created, {updated_count} updated'
        ))
        
        self.stdout.write('\nSummary by transport type:')
        for transport_type in ['FCL', 'LCL', 'AEREO']:
            count = LogisticsProvider.objects.filter(transport_type=transport_type).count()
            self.stdout.write(f'  {transport_type}: {count} providers')
