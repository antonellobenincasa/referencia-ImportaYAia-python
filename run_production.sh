#!/bin/bash

echo "Starting NELLOGISTICS production server..."

# Try to run fix_migrations.sh if it exists (to handle first deployment)
if [ -f "fix_migrations.sh" ]; then
    echo "Running migration fixes..."
    ./fix_migrations.sh || echo "Migration fix completed or skipped"
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Gunicorn server immediately to open port
echo "Starting Gunicorn server on port 5000..."
exec gunicorn --bind=0.0.0.0:5000 --reuse-port --workers=2 --timeout=120 --access-logfile - --error-logfile - hsamp.wsgi:application
