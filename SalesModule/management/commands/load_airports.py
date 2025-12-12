"""
Management command to load world airports from Excel file.
Usage: python manage.py load_airports attached_assets/AEROPUERTOS_PRINCIPALES_DEL_MUNDO.xlsx
"""

import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from SalesModule.models import Airport, AirportRegion


REGION_MAPPING = {
    'Asia': 'ASIA',
    'Europa': 'EUROPA',
    'Europe': 'EUROPA',
    'Norteamérica': 'NORTEAMERICA',
    'North America': 'NORTEAMERICA',
    'Centroamérica': 'CENTROAMERICA',
    'Central America': 'CENTROAMERICA',
    'Sudamérica': 'SUDAMERICA',
    'South America': 'SUDAMERICA',
    'África': 'AFRICA',
    'Africa': 'AFRICA',
    'Oceanía': 'OCEANIA',
    'Oceania': 'OCEANIA',
    'Medio Oriente': 'MEDIO_ORIENTE',
    'Middle East': 'MEDIO_ORIENTE',
}


class Command(BaseCommand):
    help = 'Load world airports from Excel file into database'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'file_path',
            type=str,
            help='Path to Excel file with airport data'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing airports before loading'
        )
    
    def handle(self, *args, **options):
        file_path = options['file_path']
        clear_existing = options.get('clear', False)
        
        self.stdout.write(f'Loading airports from: {file_path}')
        
        try:
            df = pd.read_excel(file_path, header=1)
            df = df.dropna(how='all', axis=1)
        except Exception as e:
            raise CommandError(f'Error reading Excel file: {e}')
        
        required_columns = ['Región', 'País', 'Ciudad Exacta', 'Nombre del Aeropuerto', 'Código IATA']
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            raise CommandError(f'Missing required columns: {missing}')
        
        if clear_existing:
            deleted_count = Airport.objects.all().delete()[0]
            self.stdout.write(self.style.WARNING(f'Deleted {deleted_count} existing airports'))
        
        self._ensure_regions()
        
        created_count = 0
        updated_count = 0
        errors = []
        
        with transaction.atomic():
            for idx, row in df.iterrows():
                try:
                    region_name = str(row['Región']).strip()
                    country = str(row['País']).strip()
                    ciudad_exacta = str(row['Ciudad Exacta']).strip()
                    airport_name = str(row['Nombre del Aeropuerto']).strip()
                    iata_code = str(row['Código IATA']).strip().upper()
                    
                    if not iata_code or len(iata_code) != 3:
                        errors.append(f'Row {idx}: Invalid IATA code "{iata_code}"')
                        continue
                    
                    region_code = REGION_MAPPING.get(region_name, 'ASIA')
                    region = AirportRegion.objects.filter(code=region_code).first()
                    
                    airport, created = Airport.objects.update_or_create(
                        iata_code=iata_code,
                        defaults={
                            'region': region,
                            'region_name': region_name,
                            'country': country,
                            'ciudad_exacta': ciudad_exacta,
                            'name': airport_name,
                            'is_cargo_capable': True,
                            'is_active': True,
                        }
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(f'  + {iata_code}: {ciudad_exacta} - {airport_name}')
                    else:
                        updated_count += 1
                        self.stdout.write(f'  ~ {iata_code}: {ciudad_exacta} - {airport_name} (updated)')
                        
                except Exception as e:
                    errors.append(f'Row {idx}: {e}')
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Created: {created_count} airports'))
        self.stdout.write(self.style.SUCCESS(f'Updated: {updated_count} airports'))
        
        if errors:
            self.stdout.write(self.style.WARNING(f'Errors: {len(errors)}'))
            for error in errors[:10]:
                self.stdout.write(self.style.ERROR(f'  {error}'))
        
        total = Airport.objects.filter(is_active=True).count()
        self.stdout.write(self.style.SUCCESS(f'\nTotal active airports in database: {total}'))
    
    def _ensure_regions(self):
        """Create default airport regions if they don't exist."""
        regions = [
            ('ASIA', 'Asia', 1),
            ('EUROPA', 'Europa', 2),
            ('NORTEAMERICA', 'Norteamérica', 3),
            ('CENTROAMERICA', 'Centroamérica y Caribe', 4),
            ('SUDAMERICA', 'Sudamérica', 5),
            ('AFRICA', 'África', 6),
            ('OCEANIA', 'Oceanía', 7),
            ('MEDIO_ORIENTE', 'Medio Oriente', 8),
        ]
        
        for code, name, order in regions:
            AirportRegion.objects.get_or_create(
                code=code,
                defaults={'name': name, 'display_order': order}
            )
        
        self.stdout.write(f'Ensured {len(regions)} airport regions exist')
