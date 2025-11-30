# IntegralCargoSolutions ICS - Hyperautomation Sales & Marketing Platform

## Overview
IntegralCargoSolutions ICS is a comprehensive Django REST Framework platform for the International Cargo Logistics market in Ecuador. With the slogan "Servicio logistico integral, que impulsa tu negocio!" (Integral logistics service that drives your business!), it automates the commercial cycle from lead generation to quote follow-up, centralizes communication, and manages marketing automation. The platform aims to streamline operations and enhance sales and marketing efforts for logistics providers.

## User Preferences
- Ecuador-focused logistics platform
- Automated 1-hour follow-up after sending quotes (not 48 hours)
- On-demand report generation with multiple export formats
- Mock integrations for external services (WhatsApp, SendGrid, Google Calendar, social media APIs)
- Landing page complementary services with clear VAT treatment and transparent pricing
- Manual lead entry + bulk import from CSV/Excel/TXT
- API Key management for external integrations and webhooks
- RUC validation for importers (exactly 13 numeric digits)
- Automatic email notifications to customs department for non-importer leads

## Recent Changes (November 30, 2025)

### Navigation Menu Consolidation (November 30, 2025)
- **Quotation Menu Dropdown**: Replaced two separate menu buttons ("Vista Previa de Solicitud" and "Enviar al Lead") with single "Solicitudes" button featuring dropdown
  - Menu displays two options: "Vista Previa de Solicitud" and "Enviar al Lead"
  - Dropdown closes after selection or when clicking outside
  - Better UX with cleaner navigation
- **Leads Menu Dropdown**: Already in place with two options:
  - "Crear Lead Manualmente" → /crear-lead
  - "Importar Leads Masivamente" → /bulk-import-leads
- **Streamlined Navigation**: Menu now features consistent dropdown patterns for lead and quotation management

### Lead Creation with RUC Validation & Customs Email (November 30, 2025)
- **Lead Model Updates**: 
  - `is_active_importer`: Boolean field to identify active importers
  - `ruc`: CharField for 13-digit Ecuador RUC numbers
- **Two-Step Lead Creation Flow**:
  - **Step 1**: Mandatory question "¿Es importador actualmente?"
  - **Step 2 (If YES)**: Only RUC field with strict validation (must be exactly 13 numeric digits)
  - **Step 2 (If NO)**: Full contact information form
- **Customs Email Automation**: 
  - When non-importer lead is created, automatic email is sent to customs department (aduanas@integralcargosolutions.ec)
  - Email includes lead details: company name, contact, email, phone, WhatsApp, city, notes
  - Offers RUC registration service with SENAE (Ecuador customs authority)
- **Database Migrations**: Successfully applied - new columns for Lead model

### API Key Management & Bulk Lead Import (November 30, 2025)
- **APIKey Model**: New model for managing API Keys with support for multiple services (Zapier, Stripe, SendGrid, WhatsApp, custom webhooks)
- **BulkLeadImport Model**: Tracks bulk import operations with file parsing for CSV, Excel (.xlsx, .xls), and TXT formats
- **Bulk Lead Import Page**: Tab-based UI with two sections:
  - **Importar Leads Masivamente**: Upload files, select format, see column guide
  - **Gestionar API Keys**: Create, view, and delete API Keys for external integrations
- **Manual Lead Creation**: New dedicated page `/crear-lead` with complete form

## System Architecture

### Core Modules
The platform is built with three modular Django apps:

1.  **SalesModule (CRM, Quoting & Scheduling)**: Manages Leads, Opportunities, automated Quote generation with parametrized profit margins, status tracking, and automatic 1-hour follow-up task creation. Includes meeting scheduling with mock calendar sync. NEW: APIKey management for external integrations, BulkLeadImport tracking for CSV/Excel imports, RUC validation, and customs email automation.
2.  **CommsModule (Centralized Inbox & Integrations)**: Provides a centralized `InboxMessage` system for all communications (WhatsApp, Facebook, Instagram, TikTok, Email, Web forms), linking messages to Lead records and tracking message direction and status. Includes mock WhatsApp webhook for lead creation.
3.  **MarketingModule (Outbound Automation & Landing Pages)**: Handles Email Templates and Campaigns with segment filtering, Social Media Post scheduling, and a comprehensive Landing Page System for automated quote collection. Landing pages feature multi-channel distribution, customer qualification (RUC lookup), transport-specific data collection (Air, Ocean LCL/FCL, DG cargo), smart quote validity, and automatic creation of Lead → Opportunity → Quote from submissions.

### UI/UX Decisions
The frontend is a React application built with Vite, TypeScript, and Tailwind CSS. It features a complete Spanish localization for the Ecuador market, a responsive mobile-first design, and interactive components like:
- Quote request form with conditional fields based on transport type
- CRM dashboard with stats and "Nuevo Lead" button
- Centralized messages inbox
- Reports page with date range pickers
- Bulk lead import page with file upload and API Key management
- Manual lead creation form with RUC validation
- Navigation dropdowns for lead and quotation management options

**IntegralCargoSolutions ICS Corporate Identity**: Modern tech-forward branding with Aqua Flow (#14B8A6 teal) as primary color, Velocity Green (#84CC16 lime) as accent, and Inter font family for clean typography.

### Technical Implementation
-   **Backend**: Django 4.2.7 + Django REST Framework 3.14.0
-   **Frontend**: React + Vite + TypeScript + Tailwind CSS
-   **Database**: PostgreSQL with Django ORM
-   **Language**: Python 3.11
-   **Email**: Django send_mail with configurable customs department email
-   **API Documentation**: DRF Spectacular (OpenAPI/Swagger) at `/api/docs/`
-   **Localization**: Spanish (Ecuador) `es-ec`, America/Guayaquil timezone, USD currency.
-   **Report Generation**: Supports JSON, Excel, and PDF formats for sales metrics, lead conversion, communication stats, and quote analytics.
-   **Media Uploads**: Configured for MSDS documents and bulk import files.
-   **Server**: Django development server on port 5000 (serves both API and frontend React build)

### Key Features
-   **Lead Qualification**: Two-step lead creation with RUC validation (13 digits) for importers
-   **Manual Lead Entry**: Form to create leads with complete contact information
-   **RUC-Based Lead Routing**: Automatic email to customs department for non-importer leads
-   **Bulk Lead Import**: CSV, Excel (.xlsx, .xls), TXT file upload with automatic parsing and validation
-   **API Key Management**: Create and manage API Keys for external integrations (Zapier, Stripe, SendGrid, etc.)
-   **Webhook Support**: Configurable webhook URLs for each API Key integration
-   **Automated Quoting**: Generates quotes with custom profit margins and unique numbering
-   **Centralized Communication**: Consolidates messages from various channels into a single inbox
-   **Marketing Automation**: Mass email campaigns, social media scheduling, and dynamic landing pages for lead capture
-   **Landing Page Quote System**: Interactive forms collecting detailed transport data, including `SERVICIO INTEGRAL` complementary services:
    - **Honorarios Agenciamiento Aduanero**: USD 339.25 (USD 295 + 15% IVA)
    - **Seguro con cobertura TODO riesgo SIN deducible**: 0.35% of CIF value (minimum USD 50 + 15% IVA)
    - **Transporte Terrestre**: Dynamic rates by destination city in Ecuador (USD rates vary from $275 to $1,150), NOT subject to 15% local VAT
-   **Automatic Lead Processing**: Submissions from landing pages automatically create Leads, Opportunities, and Quotes
-   **Scheduled Tasks**: Automatic 1-hour follow-up task creation after a quote is sent
-   **Comprehensive Reporting**: On-demand reports with various export formats
-   **Real-time Inland Transport Pricing**: Display of USD rates for each destination city with VAT exemption notice

## External Dependencies
-   **Database**: PostgreSQL (via Replit integration)
-   **Task Scheduling**: `celery` + `django-celery-beat`
-   **PDF Generation**: `reportlab`
-   **Excel Export**: `openpyxl`
-   **Environment Variables**: `python-decouple`
-   **CORS Management**: `django-cors-headers`
-   **File Parsing**: `csv`, `openpyxl` (built-in + third-party)
-   **Email**: Django send_mail (mock integration for development)
-   **Mock Integrations**: WhatsApp webhook, SendGrid/Mailgun, Google Calendar, Outlook, social media APIs (Facebook, Instagram, TikTok, Twitter/X, LinkedIn)

## Routes & Pages
- `/` - Panel de Control CRM (Dashboard)
- `/solicitar-cotizacion` - Vista Previa de Solicitud (Landing Page Quote Form)
- `/enviar-al-lead` - Enviar al Lead (Coming Soon)
- `/mensajes` - Mensajes (Inbox)
- `/reportes` - Reportes (Reports)
- `/leads` - Leads Dropdown Menu (Navigate to manual or bulk import)
- `/crear-lead` - Crear Lead (Manual Lead Creation with RUC validation)
- `/bulk-import-leads` - Importar Leads (Bulk Import + API Key Management)

## Environment Variables Required
- `CUSTOMS_DEPARTMENT_EMAIL`: Email address for customs department (default: aduanas@integralcargosolutions.ec)
- `DEFAULT_FROM_EMAIL`: Sender email for automated messages
- Standard Django database connection variables (DATABASE_URL, PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)
