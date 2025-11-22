from django.core.management.base import BaseCommand
from MarketingModule.models import InlandTransportRate
import pandas as pd
from decimal import Decimal
import re
import unicodedata


class Command(BaseCommand):
    help = 'Carga las tarifas de transporte terrestre desde un archivo Excel'
    
    def normalize_text(self, text):
        """Normaliza el texto removiendo acentos y convirtiendo a mayúsculas"""
        nfkd_form = unicodedata.normalize('NFKD', text)
        return ''.join([c for c in nfkd_form if not unicodedata.combining(c)]).upper()
    
    def extract_city_from_description(self, description, city_mapping):
        """Extrae la ciudad de destino de la descripción de manera robusta"""
        normalized = self.normalize_text(description)
        
        if 'PERIMETRO URBANO' in normalized:
            return 'GUAYAQUIL'
        
        pattern = r'\bA\s+([A-Z]+(?:\s+[A-Z]+)?)'
        matches = re.findall(pattern, normalized)
        
        for match in matches:
            city_candidate = match.strip()
            if city_candidate in city_mapping:
                return city_mapping[city_candidate]
            
            for city_key in city_mapping.keys():
                if city_key in city_candidate or city_candidate in city_key:
                    return city_mapping[city_key]
        
        return None

    def handle(self, *args, **options):
        excel_file = 'attached_assets/TRANSPORTE TERRESTRE x CNTR = 1x20GP 1x40GP 1x40HC x CIUDAD DE ENTREGA_1763849573661.xlsx'
        
        self.stdout.write('Leyendo archivo Excel...')
        df = pd.read_excel(excel_file)
        
        city_mapping = {
            'GYE': 'GUAYAQUIL',
            'MANTA': 'MANTA',
            'MACHALA': 'MACHALA',
            'CUENCA': 'CUENCA',
            'AMBATO': 'AMBATO',
            'QUITO': 'QUITO'
        }
        
        container_types = ['20gp', '40gp', '40hc']
        
        rates_data = []
        
        for index, row in df.iterrows():
            if index == 0:
                continue
            
            try:
                rate_value = row.iloc[1]
                description = str(row.iloc[2])
                
                rate_numeric = float(rate_value)
                
                city_found = self.extract_city_from_description(description, city_mapping)
                
                if city_found and rate_numeric > 0:
                    rates_data.append({
                        'city': city_found,
                        'rate': rate_numeric,
                        'description': description
                    })
                    self.stdout.write(f'  Extraído: {city_found} - USD {rate_numeric} - {description[:50]}...')
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  Error procesando fila {index}: {e}'))
                continue
        
        if len(rates_data) == 0:
            self.stdout.write(self.style.ERROR('ERROR: No se encontraron tarifas válidas en el archivo Excel.'))
            self.stdout.write(self.style.ERROR('No se realizaron cambios en la base de datos.'))
            return
        
        required_cities = set(city_mapping.values())
        found_cities = set(rate['city'] for rate in rates_data)
        missing_cities = required_cities - found_cities
        
        if missing_cities:
            self.stdout.write(self.style.ERROR(f'ERROR: Faltan las siguientes ciudades en el archivo Excel: {", ".join(missing_cities)}'))
            self.stdout.write(self.style.ERROR(f'Se esperaban 6 ciudades, pero solo se encontraron {len(found_cities)}: {", ".join(found_cities)}'))
            self.stdout.write(self.style.ERROR('No se realizaron cambios en la base de datos.'))
            return
        
        if len(rates_data) != 6:
            self.stdout.write(self.style.ERROR(f'ERROR: Se esperaban 6 tarifas (una por ciudad), pero se encontraron {len(rates_data)}'))
            self.stdout.write(self.style.ERROR('No se realizaron cambios en la base de datos.'))
            return
        
        expected_total_rates = len(required_cities) * len(container_types)
        if expected_total_rates != 18:
            self.stdout.write(self.style.ERROR(f'ERROR: Configuración inválida. Se esperaban 18 tarifas totales.'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Validación exitosa: {len(found_cities)} ciudades encontradas'))
        self.stdout.write(f'  Ciudades: {", ".join(sorted(found_cities))}')
        
        InlandTransportRate.objects.all().delete()
        self.stdout.write('Registros anteriores eliminados.')
        
        created_count = 0
        for rate_info in rates_data:
            city = rate_info['city']
            rate = Decimal(str(rate_info['rate']))
            
            for container_type in container_types:
                InlandTransportRate.objects.create(
                    city=city,
                    container_type=container_type,
                    rate_usd=rate
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ {city} - {container_type.upper()}: USD {rate}'))
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ {created_count} tarifas de transporte terrestre cargadas exitosamente.'))
        self.stdout.write(f'Ciudades: {len(found_cities)} | Tipos de contenedor: {len(container_types)}')
