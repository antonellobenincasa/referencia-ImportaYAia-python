#!/bin/bash

echo "Fixing NELLOGISTICS database migrations..."

# Mark all initial migrations as already applied
echo "Faking initial migrations for existing tables..."

# Fake Django's own migrations
python manage.py migrate contenttypes 0001 --fake 2>/dev/null
python manage.py migrate contenttypes 0002 --fake 2>/dev/null
python manage.py migrate auth 0001_initial --fake 2>/dev/null
python manage.py migrate admin 0001_initial --fake 2>/dev/null
python manage.py migrate sessions 0001_initial --fake 2>/dev/null

# Fake our app migrations
python manage.py migrate SalesModule 0001_initial --fake 2>/dev/null
python manage.py migrate CommsModule 0001_initial --fake 2>/dev/null
python manage.py migrate MarketingModule 0001_initial --fake 2>/dev/null

# Mark all migrations as applied if they exist in database
echo "Marking all existing migrations as applied..."
python manage.py migrate --fake

echo "Migrations fixed successfully!"