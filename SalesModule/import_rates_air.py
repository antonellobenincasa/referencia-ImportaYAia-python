"""
Import Air Freight Rates from CSV
Script para importar tarifas aéreas desde archivo CSV.
"""
import pandas as pd
from decimal import Decimal
from datetime import date

DEFAULT_VALIDITY_DATE = date(2025, 12, 31)


def clean_air_cost(value):
    """Limpia valores de costos aéreos."""
    if pd.isna(value) or value is None:
        return None
    val = str(value).strip()
    if val == '/' or val == '' or val == '-':
        return None
    try:
        return Decimal(val)
    except:
        return None


def import_air_rates(csv_path: str, clear_existing: bool = False):
    """
    Importa tarifas aéreas desde archivo CSV.
    """
    from SalesModule.models import FreightRateFCL
    
    print(f"Leyendo archivo: {csv_path}")
    
    try:
        df = pd.read_csv(csv_path, delimiter=';', encoding='utf-8-sig')
    except:
        df = pd.read_csv(csv_path, delimiter=';', encoding='latin-1')
    
    print(f"Columnas encontradas: {list(df.columns)}")
    print(f"Total de filas: {len(df)}")
    
    df['Airport of destination'] = df['Airport of destination'].ffill()
    df['airport of origin'] = df['airport of origin'].ffill()
    
    if clear_existing:
        deleted = FreightRateFCL.objects.filter(transport_type='AEREO').delete()[0]
        print(f"Eliminadas {deleted} tarifas aéreas existentes")
    
    imported = 0
    errors = 0
    
    for idx, row in df.iterrows():
        try:
            pod_name = str(row.get('Airport of destination', '')).strip().upper()
            pol_name = str(row.get('airport of origin', '')).strip().upper()
            carrier_name = str(row.get('CARRIER', '')).strip().upper()
            routing = str(row.get('ROUTING', '')).strip()
            transit_time = str(row.get('Transit time', '')).strip()
            frequency = str(row.get('Flight schedule', '')).strip()
            packaging_type = str(row.get('PACKAGING ACCEPTED', '')).strip()
            
            cost_45 = clean_air_cost(row.get('+45KGS'))
            cost_100 = clean_air_cost(row.get('+100KGS'))
            cost_300 = clean_air_cost(row.get('+300KGS'))
            cost_500 = clean_air_cost(row.get('+500KGS'))
            cost_1000 = clean_air_cost(row.get('+1000KGS'))
            
            if not pol_name or not pod_name or not carrier_name:
                errors += 1
                continue
            
            FreightRateFCL.objects.create(
                transport_type='AEREO',
                pol_name=pol_name,
                pod_name=pod_name,
                carrier_name=carrier_name,
                validity_date=DEFAULT_VALIDITY_DATE,
                transit_time=transit_time,
                free_days=0,
                currency='USD',
                cost_20gp=Decimal('0.00'),
                cost_40gp=Decimal('0.00'),
                cost_40hc=Decimal('0.00'),
                cost_45=cost_45,
                cost_100=cost_100,
                cost_300=cost_300,
                cost_500=cost_500,
                cost_1000=cost_1000,
                routing=routing,
                frequency=frequency,
                packaging_type=packaging_type,
                is_active=True
            )
            imported += 1
                
        except Exception as e:
            print(f"Error en fila {idx+2}: {e}")
            errors += 1
    
    print(f"\n{'='*50}")
    print(f"Proceso completado. Se han importado {imported} tarifas AEREAS.")
    print(f"Errores: {errors}")
    print(f"{'='*50}")
    
    return imported
