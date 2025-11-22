#!/bin/bash

echo "Starting NELLOGISTICS production server..."

# Run migrations with fake-initial flag to handle existing tables
echo "Running database migrations..."
python manage.py migrate --fake-initial || {
    echo "Initial migration failed, trying to fake specific migrations..."
    python manage.py migrate SalesModule 0001 --fake
    python manage.py migrate CommsModule 0001 --fake
    python manage.py migrate MarketingModule 0001 --fake
    python manage.py migrate
}

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Gunicorn server
echo "Starting Gunicorn server on port 5000..."
exec gunicorn --bind=0.0.0.0:5000 --reuse-port --workers=2 --timeout=120 --access-logfile - --error-logfile - hsamp.wsgi:application