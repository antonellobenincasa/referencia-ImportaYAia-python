"""
Currency Manager for ImportaYa.ia
Manages real-time exchange rates with bank spread protection.
Prepared as a Tool for Gemini AI integration.
"""
import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

SPREAD_BANCARIO = Decimal('0.03')

SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'JPY']

YAHOO_FINANCE_PAIRS = {
    'EUR': 'EURUSD=X',
    'GBP': 'GBPUSD=X',
    'CNY': 'USDCNY=X',
    'JPY': 'USDJPY=X',
}


def _get_market_rate_yfinance(currency_code: str) -> Optional[Decimal]:
    """
    Fetch real-time market rate from Yahoo Finance using yfinance.
    Returns the rate as 1 USD = X foreign currency (or inverse for EUR/GBP).
    """
    if currency_code == 'USD':
        return Decimal('1.0')
    
    ticker_symbol = YAHOO_FINANCE_PAIRS.get(currency_code.upper())
    if not ticker_symbol:
        logger.warning(f"No Yahoo Finance ticker for {currency_code}")
        return None
    
    try:
        import yfinance as yf
        
        ticker = yf.Ticker(ticker_symbol)
        data = ticker.history(period='1d')
        
        if data.empty:
            logger.warning(f"No data returned for {ticker_symbol}")
            return None
        
        close_price = float(data['Close'].iloc[-1])
        
        if currency_code in ['EUR', 'GBP']:
            rate = Decimal(str(1 / close_price)).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        else:
            rate = Decimal(str(close_price)).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        
        logger.info(f"Fetched market rate for {currency_code}: {rate}")
        return rate
        
    except ImportError:
        logger.warning("yfinance not installed, using fallback")
        return None
    except Exception as e:
        logger.error(f"Error fetching rate from yfinance: {e}")
        return None


def _get_fallback_rate_from_db(currency_code: str) -> Optional[Tuple[Decimal, Decimal]]:
    """
    Get the last known rate from database as fallback.
    Returns tuple of (market_rate, app_rate) or None.
    """
    try:
        from .models import ExchangeRate
        rate = ExchangeRate.objects.filter(
            currency_code=currency_code.upper(),
            is_active=True
        ).first()
        
        if rate:
            return (rate.market_rate, rate.app_rate)
    except Exception as e:
        logger.error(f"Error fetching fallback rate from DB: {e}")
    
    return None


def _get_hardcoded_fallback(currency_code: str) -> Decimal:
    """
    Last resort hardcoded rates for when all else fails.
    These should be updated periodically.
    """
    HARDCODED_RATES = {
        'USD': Decimal('1.0'),
        'EUR': Decimal('0.92'),
        'GBP': Decimal('0.79'),
        'CNY': Decimal('7.25'),
        'JPY': Decimal('149.50'),
    }
    return HARDCODED_RATES.get(currency_code.upper(), Decimal('1.0'))


def calcular_tasa_app(market_rate: Decimal, moneda: str) -> Decimal:
    """
    Calculate the app exchange rate with bank spread.
    
    For currencies where 1 USD = X currency (CNY, JPY):
        App rate = Market rate * (1 + SPREAD)
        This means we give less foreign currency per USD
    
    For currencies where X currency = 1 USD (EUR, GBP):
        App rate = Market rate * (1 + SPREAD)
        This means customer pays more foreign currency per USD
    """
    if moneda.upper() == 'USD':
        return Decimal('1.0')
    
    spread_factor = Decimal('1.0') + SPREAD_BANCARIO
    app_rate = (market_rate * spread_factor).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
    
    return app_rate


def actualizar_tasa(currency_code: str, force_update: bool = False) -> Dict:
    """
    Update exchange rate for a currency.
    Fetches from yfinance first, falls back to DB, then hardcoded.
    
    Args:
        currency_code: ISO 4217 currency code
        force_update: Force update even if recent rate exists
        
    Returns:
        Dict with currency info and status
    """
    from .models import ExchangeRate
    from django.utils import timezone
    
    currency_code = currency_code.upper()
    
    if currency_code == 'USD':
        rate, created = ExchangeRate.objects.update_or_create(
            currency_code='USD',
            defaults={
                'market_rate': Decimal('1.0'),
                'app_rate': Decimal('1.0'),
                'spread_applied': Decimal('0.0'),
                'source': 'base_currency',
                'is_active': True
            }
        )
        return {
            'currency_code': 'USD',
            'market_rate': 1.0,
            'app_rate': 1.0,
            'source': 'base_currency',
            'status': 'success'
        }
    
    if not force_update:
        existing = ExchangeRate.objects.filter(
            currency_code=currency_code,
            is_active=True
        ).first()
        
        if existing:
            time_diff = timezone.now() - existing.last_updated
            if time_diff < timedelta(hours=4):
                return {
                    'currency_code': currency_code,
                    'market_rate': float(existing.market_rate),
                    'app_rate': float(existing.app_rate),
                    'source': existing.source,
                    'last_updated': existing.last_updated.isoformat(),
                    'status': 'cached'
                }
    
    market_rate = _get_market_rate_yfinance(currency_code)
    source = 'yfinance'
    status = 'success'
    
    if market_rate is None:
        db_rates = _get_fallback_rate_from_db(currency_code)
        if db_rates:
            market_rate, app_rate = db_rates
            source = 'database_fallback'
            status = 'fallback_db'
        else:
            market_rate = _get_hardcoded_fallback(currency_code)
            source = 'hardcoded_fallback'
            status = 'fallback_hardcoded'
            app_rate = calcular_tasa_app(market_rate, currency_code)
    else:
        app_rate = calcular_tasa_app(market_rate, currency_code)
    
    rate, created = ExchangeRate.objects.update_or_create(
        currency_code=currency_code,
        defaults={
            'market_rate': market_rate,
            'app_rate': app_rate,
            'spread_applied': SPREAD_BANCARIO,
            'source': source,
            'is_active': True
        }
    )
    
    logger.info(f"Updated {currency_code}: market={market_rate}, app={app_rate}, source={source}")
    
    return {
        'currency_code': currency_code,
        'market_rate': float(market_rate),
        'app_rate': float(app_rate),
        'spread_bancario': float(SPREAD_BANCARIO),
        'source': source,
        'last_updated': rate.last_updated.isoformat(),
        'status': status
    }


def obtener_tasa_app(moneda_origen: str, moneda_destino: str = 'USD') -> Dict:
    """
    Get the app exchange rate between two currencies.
    Primary function for the quotation engine.
    
    Args:
        moneda_origen: Source currency code (e.g., 'EUR', 'GBP')
        moneda_destino: Target currency code (default: 'USD')
        
    Returns:
        Dict with conversion rate and metadata
    """
    moneda_origen = moneda_origen.upper()
    moneda_destino = moneda_destino.upper()
    
    if moneda_origen == moneda_destino:
        return {
            'moneda_origen': moneda_origen,
            'moneda_destino': moneda_destino,
            'tasa_conversion': 1.0,
            'status': 'same_currency'
        }
    
    result_origen = actualizar_tasa(moneda_origen)
    
    if moneda_destino != 'USD':
        result_destino = actualizar_tasa(moneda_destino)
        tasa_origen_usd = Decimal(str(result_origen['app_rate']))
        tasa_destino_usd = Decimal(str(result_destino['app_rate']))
        tasa_conversion = (tasa_destino_usd / tasa_origen_usd).quantize(
            Decimal('0.000001'), rounding=ROUND_HALF_UP
        )
    else:
        if moneda_origen in ['EUR', 'GBP']:
            tasa_conversion = Decimal('1.0') / Decimal(str(result_origen['app_rate']))
        else:
            tasa_conversion = Decimal(str(result_origen['app_rate']))
    
    return {
        'moneda_origen': moneda_origen,
        'moneda_destino': moneda_destino,
        'tasa_conversion': float(tasa_conversion),
        'tasa_origen': result_origen,
        'status': 'success'
    }


def actualizar_todas_las_tasas() -> Dict:
    """
    Update all supported currency rates.
    Useful for batch updates or scheduled tasks.
    """
    results = {}
    for currency in SUPPORTED_CURRENCIES:
        results[currency] = actualizar_tasa(currency, force_update=True)
    
    return {
        'updated_at': datetime.now().isoformat(),
        'currencies': results,
        'total': len(results)
    }


def gemini_tool_obtener_tasa(moneda: str) -> str:
    """
    Gemini AI Tool: Get exchange rate for currency conversion.
    Returns a formatted string for AI responses.
    
    Args:
        moneda: Currency code (EUR, GBP, CNY, JPY)
        
    Returns:
        Formatted string with rate info
    """
    result = obtener_tasa_app(moneda, 'USD')
    
    if result['status'] == 'same_currency':
        return f"USD es la moneda base, no requiere conversión."
    
    tasa = result['tasa_conversion']
    spread_info = f"(incluye spread bancario de {float(SPREAD_BANCARIO)*100:.1f}%)"
    
    return f"Tasa de cambio {moneda} a USD: {tasa:.4f} {spread_info}"
