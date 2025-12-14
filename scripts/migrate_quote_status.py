#!/usr/bin/env python
"""
Script de migración: Actualiza cotizaciones de procesando_costos a cotizacion_generada
Ejecutado: Dec 14, 2025

Este script actualiza las solicitudes de cotización que tienen ai_status='success'
pero quedaron atrapadas en estado 'procesando_costos' al estado correcto 'cotizacion_generada'.

Resultado: 6 registros actualizados.
"""

import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hsamp.settings')
django.setup()

from SalesModule.models import QuoteSubmission


def migrate_quote_status():
    """Actualiza cotizaciones de procesando_costos a cotizacion_generada"""
    updated = QuoteSubmission.objects.filter(
        status='procesando_costos',
        ai_status='success'
    ).update(status='cotizacion_generada')
    
    print(f"Registros actualizados: {updated}")
    return updated


if __name__ == '__main__':
    migrate_quote_status()
