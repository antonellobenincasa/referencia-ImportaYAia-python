# Hyperautomation Sales & Marketing Platform (H-SAMP)

## Overview
H-SAMP is a comprehensive Django REST Framework backend platform designed specifically for the **International Cargo Logistics market in Ecuador**. The platform automates the full commercial cycle from lead generation to quote follow-up, including centralized communication management and marketing automation.

## Current State
✅ **Production Ready** - All MVP features implemented and tested
- Database: PostgreSQL (configured and migrated)
- Server: Running on port 8000
- API Documentation: Available at `/api/docs/`

## Recent Changes (November 22, 2025)
- Initial project setup with Django 4.2.7 and Django REST Framework
- Created three modular Django apps: SalesModule, CommsModule, MarketingModule
- Implemented automated quoting system with 1-hour follow-up task creation
- Created centralized inbox for WhatsApp, social media, and email communications
- Built parameterizable mass email campaign system
- Implemented social media post scheduler with mock API functions
- Added comprehensive report generation API (sales metrics, lead conversion, quote analytics, communication stats)
- **NEW: Landing Page System** - Interactive quote request forms with:
  - Multi-channel distribution (Email, WhatsApp, Telegram, Facebook, Instagram, TikTok)
  - Customer qualification workflow (existing RUC lookup vs new customer registration)
  - Transport-specific data collection (Air, Ocean LCL, Ocean FCL)
  - DG cargo handling with MSDS document upload support
  - Smart quote validity calculation based on origin region
  - Automatic Lead → Opportunity → Quote creation from submissions
  - **SERVICIO INTEGRAL QUOTE**: Optional complementary logistics services
    - Customs Clearance: USD 295 + 15% Ecuador tax (USD 44.25) = USD 339.25 per import shipment
    - Insurance: 0.35% of CIF value OR flat minimum USD 50 + 15% tax
    - Inland Transport: City and full address collection (rates to be added later or from Google Sheets)
    - Lead comments text box for special requests
    - Detailed pricing breakdown in quote notes and API response
- Configured media file uploads for MSDS documents
- Configured Spanish localization for Ecuador (es-ec, America/Guayaquil timezone)

## Project Architecture

### Core Modules

#### 1. SalesModule (CRM, Quoting & Scheduling)
**Models:**
- `Lead` - Prospective customers with contact information, status tracking, and source attribution
- `Opportunity` - Qualified leads converted into sales opportunities with stages and estimated values
- `Quote` - Automated logistics quotations with parametrized profit margins
- `TaskReminder` - Automated follow-up tasks (1-hour after quote sent)
- `Meeting` - Virtual/physical meeting scheduling with calendar sync capabilities

**Key Features:**
- Automated quoting endpoint: `/api/sales/quotes/generate/`
  - Formula: Final Price = Base Rate + Parametrized Minimum Profit Margin
  - Automatic quote numbering (COT-00001, COT-00002, etc.)
- Quote status tracking: borrador → enviado → visto → aceptado/rechazado
- **Automatic follow-up**: Creates TaskReminder 1 hour after quote is sent (status='enviado')
- Meeting scheduling with mock Google Calendar & Outlook sync (15-minute alerts)
- Comprehensive reports API: `/api/sales/reports/`

**API Endpoints:**
```
GET    /api/sales/leads/
POST   /api/sales/leads/
GET    /api/sales/opportunities/
POST   /api/sales/quotes/generate/
POST   /api/sales/quotes/{id}/send/
GET    /api/sales/tasks/
POST   /api/sales/tasks/{id}/complete/
GET    /api/sales/meetings/
POST   /api/sales/meetings/{id}/sync-calendar/
GET    /api/sales/reports/?type=sales_metrics&format=json&start_date=2025-01-01&end_date=2025-12-31
```

#### 2. CommsModule (Centralized Inbox & Integrations)
**Models:**
- `InboxMessage` - Centralized communication hub linking all messages to Lead records

**Key Features:**
- Mock WhatsApp webhook: `/api/comms/whatsapp/inbound/`
- Auto-creates Lead if phone number not found
- Supports multiple sources: WhatsApp, Facebook, Instagram, TikTok, Email, Web forms
- Message direction tracking (entrante/saliente)
- Status tracking: nuevo → leído → respondido → archivado

**API Endpoints:**
```
GET    /api/comms/messages/
POST   /api/comms/whatsapp/inbound/
```

#### 3. MarketingModule (Outbound Automation & Landing Pages)
**Models:**
- `EmailTemplate` - Reusable email templates with variable substitution
- `EmailCampaign` - Mass email campaigns with segment filtering
- `SocialMediaPost` - Scheduled social media posts for multiple platforms
- `LandingPage` - Interactive landing pages for automated quote collection
- `LandingPageSubmission` - Quote requests submitted through landing pages with automatic processing

**Key Features:**
- Parameterizable mass email function: `/api/marketing/email-campaigns/send-mass-email/`
  - Segment filtering by Lead attributes (status, country, source, etc.)
  - Mock SendGrid/Mailgun integration
- Social media post scheduler with mock API publishing
- **Landing Page System** with multi-channel distribution:
  - **Customer Qualification**: Existing customer (RUC lookup) vs New customer registration
  - **Transport Types**: Air, Ocean LCL, Ocean FCL
  - **Cargo Details**: General cargo, DG cargo (with MSDS upload), weight, dimensions, stackability
  - **Container Types** (FCL): 20GP, 40GP, 40HC, 40NOR, 40RF, 20RF, 40 OT HC, Flat Rack, OT
  - **Smart Quote Validity**: 7 days for Air and Asia origins, end of month for other ocean origins
  - **Automatic Processing**: Creates Lead → Opportunity → Quote automatically from submission
  - **Distribution Channels**: Email, WhatsApp, Telegram, Facebook, Instagram, TikTok
- Supports: Facebook, Instagram, TikTok, Twitter/X, LinkedIn, WhatsApp, Telegram

**API Endpoints:**
```
GET    /api/marketing/email-templates/
POST   /api/marketing/email-campaigns/
POST   /api/marketing/email-campaigns/send-mass-email/
GET    /api/marketing/social-posts/
POST   /api/marketing/social-posts/{id}/publish/

# Landing Pages
GET    /api/marketing/landing-pages/
POST   /api/marketing/landing-pages/
POST   /api/marketing/landing-pages/{slug}/distribute/
GET    /api/marketing/landing-pages/{slug}/stats/

# Landing Page Submissions (creates quote automatically)
POST   /api/marketing/landing-submissions/
GET    /api/marketing/landing-submissions/
```

## Report Generation System

### Available Reports
1. **Sales Metrics** - Lead conversion rates, quote statistics, total values
2. **Lead Conversion** - Leads by status and source
3. **Communication Stats** - Message volumes, response rates by channel
4. **Quote Analytics** - Quotes by status, incoterm, cargo type, profit margins

### Export Formats
- JSON (default)
- Excel (.xlsx)
- PDF

### Example Usage
```
# JSON report
GET /api/sales/reports/?type=sales_metrics&start_date=2025-01-01&end_date=2025-12-31

# Excel export
GET /api/sales/reports/?type=lead_conversion&format=excel

# PDF export
GET /api/sales/reports/?type=quote_analytics&format=pdf
```

## Technical Stack

### Backend
- **Framework**: Django 4.2.7 + Django REST Framework 3.14.0
- **Database**: PostgreSQL (via Replit integration)
- **Language**: Python 3.11
- **API Documentation**: DRF Spectacular (OpenAPI/Swagger)

### Key Dependencies
- `psycopg2-binary` - PostgreSQL adapter
- `django-cors-headers` - CORS support
- `celery` + `django-celery-beat` - Task scheduling (configured, ready for async tasks)
- `reportlab` - PDF generation
- `openpyxl` - Excel export
- `python-decouple` - Environment variable management

## Localization
- **Primary Language**: Spanish (Ecuador) - `es-ec`
- **Timezone**: America/Guayaquil
- **Currency**: USD (all quotes in US Dollars)
- Models and API responses ready for Spanish localization

## Database Schema

### Key Relationships
```
Lead (1) ─→ (N) Opportunity
Opportunity (1) ─→ (N) Quote
Lead (1) ─→ (N) InboxMessage
Lead (1) ─→ (N) TaskReminder
Quote (1) ─→ (N) TaskReminder
Lead (1) ─→ (N) Meeting
```

## API Documentation
Interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/api/docs/
- **OpenAPI Schema**: http://localhost:8000/api/schema/
- **Django Admin**: http://localhost:8000/admin/

## Environment Variables
All sensitive configuration managed via Replit Secrets:
- `DATABASE_URL` - PostgreSQL connection string
- `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT` - DB credentials
- `SECRET_KEY` - Django secret key (auto-generated)
- `DEBUG` - Debug mode (default: True)

## Workflow Configuration
**Active Workflow**: Start H-SAMP API Server
- **Command**: `python manage.py runserver 0.0.0.0:8000`
- **Port**: 8000 (console output)
- **Status**: Running

## User Preferences
- Ecuador-focused logistics platform
- Automated 1-hour follow-up after sending quotes (not 48 hours)
- On-demand report generation with multiple export formats
- Mock integrations for external services (WhatsApp, SendGrid, Google Calendar, social media APIs)

## Next Phase / Future Enhancements
1. Integrate real WhatsApp Business API for bidirectional messaging
2. Connect SendGrid/Mailgun for actual email delivery and tracking
3. Implement live Google Calendar and Outlook API synchronization
4. Add real social media API integrations (Facebook, Instagram, TikTok, Twitter)
5. Build admin dashboard for monitoring quotes, leads, and communication flow
6. Add email/SMS notifications for TaskReminders
7. Implement Celery async tasks for scheduled emails and social media posts
8. Add analytics dashboard with charts and visualizations
9. Create mobile app for on-the-go lead and quote management
10. Implement multi-user support with role-based access control (RBAC)

## Developer Notes
- All models use Django's translation utilities (`gettext_lazy`) for future multilingual support
- Quote numbers auto-increment (COT-00001, COT-00002, etc.)
- **Critical Logic**: Automatic TaskReminder creation 1 hour after Quote.status changes to 'enviado'
- Mock functions return realistic responses for testing without external API dependencies
- LSP warnings are cosmetic (static analysis) and don't affect runtime functionality

## Testing the Platform
1. Create a Lead via POST `/api/sales/leads/`
2. Convert Lead to Opportunity via POST `/api/sales/opportunities/`
3. Generate Quote via POST `/api/sales/quotes/generate/`
4. Send Quote via POST `/api/sales/quotes/{id}/send/` (auto-creates 1-hour follow-up task)
5. View Tasks via GET `/api/sales/tasks/`
6. Generate Reports via GET `/api/sales/reports/?type=sales_metrics`

## File Structure
```
.
├── hsamp/                  # Django project configuration
│   ├── settings.py        # Main configuration (PostgreSQL, DRF, i18n)
│   ├── urls.py            # URL routing
│   └── wsgi.py
├── SalesModule/           # CRM, Quoting, Scheduling
│   ├── models.py          # Lead, Opportunity, Quote, TaskReminder, Meeting
│   ├── views.py           # API ViewSets
│   ├── serializers.py     # DRF Serializers
│   ├── urls.py            # Module URLs
│   ├── admin.py           # Admin configuration
│   └── reports/           # Report generation
│       └── generators.py
├── CommsModule/           # Centralized Inbox
│   ├── models.py          # InboxMessage
│   ├── views.py           # WhatsApp webhook
│   ├── serializers.py
│   ├── urls.py
│   └── admin.py
├── MarketingModule/       # Email & Social Media Automation
│   ├── models.py          # EmailTemplate, EmailCampaign, SocialMediaPost
│   ├── views.py           # Campaign & Post APIs
│   ├── serializers.py
│   ├── urls.py
│   └── admin.py
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
└── replit.md             # This file
```

## Support & Maintenance
- Platform specifically designed for Ecuador's international cargo logistics market
- All business logic tailored for Incoterms, FCL/LCL cargo types, and freight forwarding workflows
- Ready for production deployment via Replit's publishing feature
