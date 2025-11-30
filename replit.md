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

## Recent Changes (November 30, 2025)

### API Key Management & Bulk Lead Import (November 30, 2025)
- **APIKey Model**: New model for managing API Keys with support for multiple services (Zapier, Stripe, SendGrid, WhatsApp, custom webhooks)
- **BulkLeadImport Model**: Tracks bulk import operations with file parsing for CSV, Excel (.xlsx, .xls), and TXT formats
- **API Endpoints**: 
  - `/api/sales/api-keys/` - Full CRUD for managing API Keys with auto-generated `ic_[token]` format
  - `/api/sales/bulk-import/upload/` - Endpoint for uploading and processing bulk lead files
- **Bulk Lead Import Page**: Tab-based UI with two sections:
  - **Importar Leads Masivamente**: Upload files, select format, see column guide
  - **Gestionar API Keys**: Create, view, and delete API Keys for external integrations
- **Manual Lead Creation**: New dedicated page `/crear-lead` with complete form:
  - Company name, contact name, email, phone, WhatsApp
  - Country, city, source (manual_entry, landing_page, Facebook, WhatsApp, Email, referral)
  - Additional notes field
  - "Nuevo Lead" button added to Dashboard for quick access
  - Form automatically submits to `/api/sales/leads/` endpoint
- **Database Migrations**: Applied successfully - tables for APIKey and BulkLeadImport created

## Previous Changes (November 23-29, 2025)

### Enhanced Landing Page Cargo Information Collection (November 23, 2025)
- **Mandatory Cargo Weight**: "Peso Bruto estimado (KG)" now marked as REQUIRED field
- **Cargo Dimensions**: Added mandatory fields for Largo, Ancho, Altura
- **Unit Selection**: Lead can choose between CM (Centímetros) or Inches (Pulgadas)
- **CBM Calculation**: Field for total CBM entry (mandatory)
- **Stackability**: Mandatory dropdown - "¿La carga es APILABLE?" (Yes/No)
- **Cargo Classification**: Mandatory dropdown - "¿Es carga PELIGROSA/DG CARGO/IMO?" with options:
  - "Carga General"
  - "Carga Peligrosa - DG Cargo IMO"
- **DG Document Upload**: When "Carga Peligrosa - DG Cargo IMO" selected, optional file upload appears for MSDS and supporting documents (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG)
- **Additional Comments**: New optional textarea at end of form for lead to add any additional cargo information
- **Hidden Fields for FCL**: When transport type is Maritime FCL, dimension fields (length, width, height, CBM, stackability) are hidden and not sent to backend

### Brand Rebranding & Air Transport Implementation (November 23, 2025)
- Changed platform name from NELLOGISTICS to IntegralCargoSolutions ICS
- Updated slogan to "Logística integral que impulsa tu negocio!" (displayed below company name)
- Updated all branding elements, titles, and documentation
- Slogan repositioned to display below company name in header (not on the side)
- **Air Transport Feature**: When lead selects "AÉREO" transport type:
  - Origin field label changes from "POL Puerto de Origen" to "AOL Aeropuerto de Origen"
  - Destination field label changes from "POD Puerto de Destino" to "AOD Aeropuerto de destino"
  - Shows 15 international airports from Excel file: Hong Kong, Memphis, Shanghai Pudong, Anchorage, Incheon, Louisville, Miami, Doha, Paris CDG, Frankfurt, Taipei, London Heathrow, Los Angeles, Amsterdam, Sydney
  - Destination shows only 2 Ecuador airports: Guayaquil, Quito
  - Ports (POL/POD) automatically hidden when air transport selected
  - Maritime FCL/LCL shows ports as before

### Menu Navigation Updates (November 29, 2025)
- Renamed "Solicitar Cotización" button to "Vista Previa de Solicitud"
- Added new "Enviar al Lead" button (highlighted in green)
- Added "Importar Leads" button (last item in menu with Upload icon)

## System Architecture

### Core Modules
The platform is built with three modular Django apps:

1.  **SalesModule (CRM, Quoting & Scheduling)**: Manages Leads, Opportunities, automated Quote generation with parametrized profit margins, status tracking, and automatic 1-hour follow-up task creation. Includes meeting scheduling with mock calendar sync. NEW: APIKey management for external integrations and BulkLeadImport tracking for CSV/Excel imports.
2.  **CommsModule (Centralized Inbox & Integrations)**: Provides a centralized `InboxMessage` system for all communications (WhatsApp, Facebook, Instagram, TikTok, Email, Web forms), linking messages to Lead records and tracking message direction and status. Includes mock WhatsApp webhook for lead creation.
3.  **MarketingModule (Outbound Automation & Landing Pages)**: Handles Email Templates and Campaigns with segment filtering, Social Media Post scheduling, and a comprehensive Landing Page System for automated quote collection. Landing pages feature multi-channel distribution, customer qualification (RUC lookup), transport-specific data collection (Air, Ocean LCL/FCL, DG cargo), smart quote validity, and automatic creation of Lead → Opportunity → Quote from submissions.

### UI/UX Decisions
The frontend is a React application built with Vite, TypeScript, and Tailwind CSS. It features a complete Spanish localization for the Ecuador market, a responsive mobile-first design, and interactive components like:
- Quote request form with conditional fields based on transport type
- CRM dashboard with stats and "Nuevo Lead" button
- Centralized messages inbox
- Reports page with date range pickers
- Bulk lead import page with file upload and API Key management
- Manual lead creation form

**IntegralCargoSolutions ICS Corporate Identity**: Modern tech-forward branding with Aqua Flow (#14B8A6 teal) as primary color, Velocity Green (#84CC16 lime) as accent, and Inter font family for clean typography. Complete Corporate Identity Manual available in `IntegralCargoSolutions_Corporate_Identity_Manual.md`.

### Technical Implementation
-   **Backend**: Django 4.2.7 + Django REST Framework 3.14.0
-   **Frontend**: React + Vite + TypeScript + Tailwind CSS
-   **Database**: PostgreSQL
-   **Language**: Python 3.11
-   **API Documentation**: DRF Spectacular (OpenAPI/Swagger) at `/api/docs/`
-   **Localization**: Spanish (Ecuador) `es-ec`, America/Guayaquil timezone, USD currency.
-   **Report Generation**: Supports JSON, Excel, and PDF formats for sales metrics, lead conversion, communication stats, and quote analytics.
-   **Media Uploads**: Configured for MSDS documents and bulk import files.
-   **Server**: Django development server on port 5000 (serves both API and frontend React build)

### Key Features
-   **Manual Lead Entry**: Form to create leads with complete contact information
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
-   **Mock Integrations**: WhatsApp webhook, SendGrid/Mailgun, Google Calendar, Outlook, social media APIs (Facebook, Instagram, TikTok, Twitter/X, LinkedIn)

## Routes & Pages
- `/` - Panel de Control CRM (Dashboard)
- `/solicitar-cotizacion` - Vista Previa de Solicitud (Landing Page Quote Form)
- `/enviar-al-lead` - Enviar al Lead (Coming Soon)
- `/mensajes` - Mensajes (Inbox)
- `/reportes` - Reportes (Reports)
- `/bulk-import-leads` - Importar Leads (Bulk Import + API Key Management)
- `/crear-lead` - Crear Lead (Manual Lead Creation)
