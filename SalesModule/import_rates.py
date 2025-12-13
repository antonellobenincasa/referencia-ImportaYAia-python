"""
Import FCL Freight Rates from CSV
Script para importar tarifas marítimas FCL desde archivo CSV.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hsamp.settings')
django.setup()

import pandas as pd
from decimal import Decimal
from datetime import datetime
from SalesModule.models import FreightRateFCL


def clean_price(value):
    """
    Limpia valores de precio eliminando comas de miles.
    Ej: "1,920.00" -> 1920.00
    """
    if pd.isna(value) or value == '' or value is None:
        return Decimal('0.00')
    
    try:
        cleaned = str(value).replace(',', '').strip()
        return Decimal(cleaned)
    except:
        return Decimal('0.00')


def parse_date(value):
    """
    Parsea fecha en formato dd/mm/yyyy.
    """
    if pd.isna(value) or value == '':
        return None
    
    try:
        return datetime.strptime(str(value).strip(), '%d/%m/%Y').date()
    except:
        try:
            return datetime.strptime(str(value).strip(), '%Y-%m-%d').date()
        except:
            return None


def import_fcl_rates(csv_path: str, clear_existing: bool = False):
    """
    Importa tarifas FCL desde archivo CSV.
    
    Args:
        csv_path: Ruta al archivo CSV
        clear_existing: Si True, elimina tarifas existentes antes de importar
    
    Returns:
        Número de tarifas importadas
    """
    print(f"Leyendo archivo: {csv_path}")
    
    df = pd.read_csv(csv_path, delimiter=';', encoding='utf-8-sig')
    
    print(f"Columnas encontradas: {list(df.columns)}")
    print(f"Total de filas: {len(df)}")
    
    column_mapping = {
        'POL o Puerto de origen': 'pol_name',
        'POD o Puerto de destino': 'pod_name',
        'NAVIERA FCL': 'carrier_name',
        'VIGENCIA HASTA': 'validity_date',
        'TIEMPO DE TRANSITO': 'transit_time',
        'DIAS LIBRES': 'free_days',
        '20 GP': 'cost_20gp',
        '40 GP': 'cost_40gp',
        '40 HC': 'cost_40hc',
        '40 NOR': 'cost_nor',
        'AGENTE': 'agent_name',
        'CONTRATO': 'contract_number',
    }
    
    if clear_existing:
        deleted_count = FreightRateFCL.objects.all().delete()[0]
        print(f"Eliminadas {deleted_count} tarifas existentes")
    
    imported = 0
    errors = 0
    
    for idx, row in df.iterrows():
        try:
            pol_name = str(row.get('POL o Puerto de origen', '')).strip().upper()
            pod_name = str(row.get('POD o Puerto de destino', '')).strip().upper()
            carrier_name = str(row.get('NAVIERA FCL', '')).strip()
            validity_date = parse_date(row.get('VIGENCIA HASTA'))
            transit_time = str(row.get('TIEMPO DE TRANSITO', '')).strip()
            
            free_days_val = row.get('DIAS LIBRES', 21)
            try:
                free_days = int(free_days_val) if pd.notna(free_days_val) else 21
            except:
                free_days = 21
            
            cost_20gp = clean_price(row.get('20 GP'))
            cost_40gp = clean_price(row.get('40 GP'))
            cost_40hc = clean_price(row.get('40 HC'))
            cost_nor = clean_price(row.get('40 NOR'))
            if cost_nor == Decimal('0.00'):
                cost_nor = None
            
            agent_name = str(row.get('AGENTE', '')).strip()
            contract_number = str(row.get('CONTRATO', '')).strip()
            
            if not pol_name or not pod_name or not carrier_name:
                print(f"Fila {idx+2}: Datos incompletos, saltando...")
                errors += 1
                continue
            
            if not validity_date:
                print(f"Fila {idx+2}: Fecha inválida, saltando...")
                errors += 1
                continue
            
            FreightRateFCL.objects.create(
                transport_type='MARITIMO FCL',
                pol_name=pol_name,
                pod_name=pod_name,
                carrier_name=carrier_name,
                validity_date=validity_date,
                transit_time=transit_time,
                free_days=free_days,
                currency='USD',
                cost_20gp=cost_20gp,
                cost_40gp=cost_40gp,
                cost_40hc=cost_40hc,
                cost_nor=cost_nor,
                includes_thc=False,
                agent_name=agent_name,
                contract_number=contract_number,
                is_active=True
            )
            imported += 1
            
            if imported % 100 == 0:
                print(f"Procesadas {imported} tarifas...")
                
        except Exception as e:
            print(f"Error en fila {idx+2}: {e}")
            errors += 1
    
    print(f"\n{'='*50}")
    print(f"Proceso completado. Se han importado {imported} tarifas de MARITIMO FCL.")
    print(f"Errores: {errors}")
    print(f"{'='*50}")
    
    return imported


if __name__ == '__main__':
    csv_file = 'attached_assets/prueba_tarifas_IMPORT_-_UPLOAD_1765649798329.csv'
    
    if not os.path.exists(csv_file):
        print(f"Error: No se encontró el archivo {csv_file}")
        sys.exit(1)
    
    import_fcl_rates(csv_file, clear_existing=True)
