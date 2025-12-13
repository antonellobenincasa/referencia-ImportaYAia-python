"""
Import LCL Freight Rates from CSV
Script para importar tarifas marítimas LCL desde archivo CSV.
"""
import pandas as pd
from decimal import Decimal
from datetime import datetime


def clean_price(value):
    """Limpia valores de precio."""
    if pd.isna(value) or value == '' or value is None:
        return Decimal('0.00')
    try:
        cleaned = str(value).replace(',', '').strip()
        return Decimal(cleaned)
    except:
        return Decimal('0.00')


def parse_date(value):
    """Parsea fecha en formato dd/mm/yyyy."""
    if pd.isna(value) or value == '':
        return None
    try:
        return datetime.strptime(str(value).strip(), '%d/%m/%Y').date()
    except:
        try:
            return datetime.strptime(str(value).strip(), '%Y-%m-%d').date()
        except:
            return None


def normalize_currency(value):
    """Normaliza moneda: DOLAR->USD, EUROS->EUR"""
    if pd.isna(value) or value == '':
        return 'USD'
    val = str(value).strip().upper()
    if val in ['DOLAR', 'DOLLAR', 'USD', 'US$']:
        return 'USD'
    elif val in ['EURO', 'EUROS', 'EUR', '€']:
        return 'EUR'
    return 'USD'


def import_lcl_rates(csv_path: str, clear_existing: bool = False):
    """
    Importa tarifas LCL desde archivo CSV.
    """
    from SalesModule.models import FreightRateFCL
    
    print(f"Leyendo archivo: {csv_path}")
    
    df = pd.read_csv(csv_path, delimiter=';', encoding='utf-8-sig')
    
    print(f"Columnas encontradas: {list(df.columns)}")
    print(f"Total de filas: {len(df)}")
    
    if clear_existing:
        deleted = FreightRateFCL.objects.filter(transport_type='MARITIMO LCL').delete()[0]
        print(f"Eliminadas {deleted} tarifas LCL existentes")
    
    imported = 0
    errors = 0
    
    for idx, row in df.iterrows():
        try:
            pol_name = str(row.get('ORIGEN', '')).strip().upper()
            pod_name = str(row.get('DESTINO', '')).strip().upper()
            carrier_name = str(row.get('NAVIERA LCL', '')).strip()
            validity_date = parse_date(row.get('VIGENCIA HASTA'))
            transit_time = str(row.get('TIEMPO DE TRANSITO', '')).strip()
            currency = normalize_currency(row.get('MONEDA'))
            cost_lcl = clean_price(row.get('FLETE MARITIMO LCL'))
            
            if not pol_name or not pod_name or not carrier_name:
                errors += 1
                continue
            
            if not validity_date:
                errors += 1
                continue
            
            FreightRateFCL.objects.create(
                transport_type='MARITIMO LCL',
                pol_name=pol_name,
                pod_name=pod_name,
                carrier_name=carrier_name,
                validity_date=validity_date,
                transit_time=transit_time,
                free_days=0,
                currency=currency,
                cost_20gp=Decimal('0.00'),
                cost_40gp=Decimal('0.00'),
                cost_40hc=Decimal('0.00'),
                cost_nor=None,
                cost_lcl=cost_lcl,
                includes_thc=False,
                is_active=True
            )
            imported += 1
            
            if imported % 50 == 0:
                print(f"Procesadas {imported} tarifas...")
                
        except Exception as e:
            print(f"Error en fila {idx+2}: {e}")
            errors += 1
    
    print(f"\n{'='*50}")
    print(f"Proceso completado. Se han importado {imported} tarifas de MARITIMO LCL.")
    print(f"Errores: {errors}")
    print(f"{'='*50}")
    
    return imported
