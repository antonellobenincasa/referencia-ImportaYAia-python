"""
Import Simple Air Freight Rates from CSV
Script para importar tarifas aéreas simplificadas (tarifa única por Kg).
"""
import pandas as pd
from decimal import Decimal
from datetime import datetime


def parse_date(value):
    """Parsea fecha en formato dd/mm/yyyy."""
    if pd.isna(value) or value == '':
        return None
    try:
        return datetime.strptime(str(value).strip(), '%d/%m/%Y').date()
    except:
        return None


def normalize_currency(value):
    """Normaliza moneda a ISO 4217."""
    if pd.isna(value) or value == '':
        return 'USD'
    val = str(value).strip().upper()
    if val in ['DOLAR', 'DOLLAR', 'USD']:
        return 'USD'
    elif val in ['EURO', 'EUROS', 'EUR']:
        return 'EUR'
    return 'USD'


def clean_cost(value):
    """Limpia valores de costo."""
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        return Decimal(str(value).replace(',', '.').strip())
    except:
        return None


def import_air_others_rates(csv_path: str, clear_existing: bool = False):
    """
    Importa tarifas aéreas simplificadas desde archivo CSV.
    """
    from SalesModule.models import FreightRateFCL
    
    print(f"Leyendo archivo: {csv_path}")
    
    df = pd.read_csv(csv_path, delimiter=';', encoding='utf-8-sig')
    df.columns = df.columns.str.strip()
    
    print(f"Columnas encontradas: {list(df.columns)}")
    print(f"Total de filas: {len(df)}")
    
    imported = 0
    errors = 0
    
    for idx, row in df.iterrows():
        try:
            pol_name = str(row.get('ORIGEN', '')).strip().upper()
            pod_name = str(row.get('DESTINO', '')).strip().upper()
            carrier_name = str(row.get('LINEA', '')).strip()
            validity_date = parse_date(row.get('VIGENCIA HASTA'))
            transit_time = str(row.get('Tiempo de transito', '')).strip()
            currency = normalize_currency(row.get('MONEDA'))
            agent_name = str(row.get('AGENTE', '')).strip()
            cost_45 = clean_cost(row.get('FLETE AEREO'))
            
            if not pol_name or not pod_name or not carrier_name:
                errors += 1
                continue
            
            if cost_45 is None:
                errors += 1
                continue
            
            FreightRateFCL.objects.create(
                transport_type='AEREO',
                pol_name=pol_name,
                pod_name=pod_name,
                carrier_name=carrier_name,
                validity_date=validity_date,
                transit_time=transit_time,
                currency=currency,
                agent_name=agent_name,
                cost_20gp=Decimal('0.00'),
                cost_40gp=Decimal('0.00'),
                cost_40hc=Decimal('0.00'),
                cost_45=cost_45,
                is_active=True
            )
            imported += 1
                
        except Exception as e:
            print(f"Error en fila {idx+2}: {e}")
            errors += 1
    
    print(f"\n{'='*50}")
    print(f"Proceso completado. Se han procesado {imported} tarifas aéreas (Formato Simple).")
    print(f"Errores: {errors}")
    print(f"{'='*50}")
    
    return imported
