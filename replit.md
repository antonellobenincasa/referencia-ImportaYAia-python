# IntegralCargoSolutions ICS - Hyperautomation Sales & Marketing Platform

## Overview
IntegralCargoSolutions ICS is a comprehensive Django REST Framework platform for the International Cargo Logistics market in Ecuador. With the slogan "Servicio logistico integral, que impulsa tu negocio!" (Integral logistics service that drives your business!), it automates the commercial cycle from lead generation to quote follow-up, centralizes communication, and manages marketing automation. The platform aims to streamline operations and enhance sales and marketing efforts for logistics providers.

## User Preferences
- Ecuador-focused logistics platform
- Automated 1-hour follow-up after sending quotes (not 48 hours)
- On-demand report generation with multiple export formats
- Mock integrations for external services (WhatsApp, SendGrid, Google Calendar, social media APIs)
- Landing page complementary services with clear VAT treatment and transparent pricing

## Recent Changes (November 23, 2025)
### Brand Rebranding
- Changed platform name from NELLOGISTICS to IntegralCargoSolutions ICS
- Updated slogan to "Servicio logistico integral, que impulsa tu negocio!" (displayed throughout the app)
- Updated all branding elements, titles, and documentation

### Landing Page Port Selection Updates
- Changed form fields to properly labeled shipping ports:
  - "País de Origen" → "POL Puerto de Origen" (dropdown with origin ports from import zones list)
  - "Puerto de Destino" → "POD Puerto de Destino" (dropdown with Ecuador ports)
- **Dynamic port lists based on transport type**:
  - **Marítimo FCL**: Shows 34 countries/zones from Excel "LISTADO PUERTOS POR ZONA - IMPORT hacia ECUADOR"
  - **Marítimo LCL**: Shows 37 port regions/zones from Excel "LISTADO PUERTOS - IMPORT hacia ECUADOR"
- Destination ports now include: Guayaquil, Posorja, Manta, Puerto Bolívar, Esmeraldas
- Both port fields now start blank (no default selection) - users must select their desired ports

### Maritime FCL Form Field Updates
- **Tipo de Contenedor**: Now displays 11 container types from Excel list:
  - 1x20GP, 1x40GP, 1x40HC, 1x40NOR, 1x20 REEFER, 1x40 REEFER, 1x40 OT HC, 1x20 FLAT RACK, 1x40 FLAT RACK, 1x40 OPEN TOP, 1x20 OPEN TOP
- **Incoterm**: Now displays 12 incoterm options from Excel list:
  - FOB, FCA, EXW, CIF, CFR, DAP, DDP, DPU, FAS, CPT, CIP, DAT
- **Peso Bruto estimado (KG)**: 
  - Renamed from "Peso Estimado (kg)"
  - Changed from required to optional field
  - Placeholder text shows "Opcional"

### Landing Page Updates
- Updated complementary service labels for clarity:
  - "Desaduanización" → "Honorarios Agenciamiento Aduanero"
  - "Seguro" → "Seguro con cobertura TODO riesgo SIN deducible"
  - Description: "A ciudad de destino en Ecuador" → "Favor escoger ciudad de destino en Ecuador"
- Implemented real-time inline rate display for inland transport by city selection
- Added VAT exemption notice for inland transport (NOT subject to 15% IVA local tax)
- Inland transport rates are fetched dynamically from API and displayed in USD:
  - Quito: $1,150.00, Ambato: $895.00, Cuenca: $785.00, Manta: $585.00, Machala: $595.00, Guayaquil: $275.00

## System Architecture

### Core Modules
The platform is built with three modular Django apps:

1.  **SalesModule (CRM, Quoting & Scheduling)**: Manages Leads, Opportunities, automated Quote generation with parametrized profit margins, status tracking, and automatic 1-hour follow-up task creation. Includes meeting scheduling with mock calendar sync.
2.  **CommsModule (Centralized Inbox & Integrations)**: Provides a centralized `InboxMessage` system for all communications (WhatsApp, Facebook, Instagram, TikTok, Email, Web forms), linking messages to Lead records and tracking message direction and status. Includes mock WhatsApp webhook for lead creation.
3.  **MarketingModule (Outbound Automation & Landing Pages)**: Handles Email Templates and Campaigns with segment filtering, Social Media Post scheduling, and a comprehensive Landing Page System for automated quote collection. Landing pages feature multi-channel distribution, customer qualification (RUC lookup), transport-specific data collection (Air, Ocean LCL/FCL, DG cargo), smart quote validity, and automatic creation of Lead → Opportunity → Quote from submissions.

### UI/UX Decisions
The frontend is a React application built with Vite, TypeScript, and Tailwind CSS. It features a complete Spanish localization for the Ecuador market, a responsive mobile-first design, and interactive components like a quote request form, CRM dashboard with stats, a centralized messages inbox, and a reports page with date range pickers.

**IntegralCargoSolutions ICS Corporate Identity**: Modern tech-forward branding with Aqua Flow (#14B8A6 teal) as primary color, Velocity Green (#84CC16 lime) as accent, and Inter font family for clean typography. Complete Corporate Identity Manual available in `IntegralCargoSolutions_Corporate_Identity_Manual.md`.

### Technical Implementation
-   **Backend**: Django 4.2.7 + Django REST Framework 3.14.0
-   **Frontend**: React + Vite + TypeScript + Tailwind CSS
-   **Database**: PostgreSQL
-   **Language**: Python 3.11
-   **API Documentation**: DRF Spectacular (OpenAPI/Swagger) at `/api/docs/`
-   **Localization**: Spanish (Ecuador) `es-ec`, America/Guayaquil timezone, USD currency.
-   **Report Generation**: Supports JSON, Excel, and PDF formats for sales metrics, lead conversion, communication stats, and quote analytics.
-   **Media Uploads**: Configured for MSDS documents.
-   **Workflow**: The active workflow starts the Django API server on port 8000.

### Key Features
-   **Automated Quoting**: Generates quotes with custom profit margins and unique numbering.
-   **Centralized Communication**: Consolidates messages from various channels into a single inbox.
-   **Marketing Automation**: Mass email campaigns, social media scheduling, and dynamic landing pages for lead capture.
-   **Landing Page Quote System**: Interactive forms collecting detailed transport data, including `SERVICIO INTEGRAL` complementary services:
    - **Honorarios Agenciamiento Aduanero**: USD 339.25 (USD 295 + 15% IVA)
    - **Seguro con cobertura TODO riesgo SIN deducible**: 0.35% of CIF value (minimum USD 50 + 15% IVA)
    - **Transporte Terrestre**: Dynamic rates by destination city in Ecuador (USD rates vary from $275 to $1,150), NOT subject to 15% local VAT
-   **Automatic Lead Processing**: Submissions from landing pages automatically create Leads, Opportunities, and Quotes.
-   **Scheduled Tasks**: Automatic 1-hour follow-up task creation after a quote is sent.
-   **Comprehensive Reporting**: On-demand reports with various export formats.
-   **Real-time Inland Transport Pricing**: Display of USD rates for each destination city (Quito, Ambato, Cuenca, Manta, Machala, Guayaquil) with VAT exemption notice.

## External Dependencies
-   **Database**: PostgreSQL (via Replit integration)
-   **Task Scheduling**: `celery` + `django-celery-beat`
-   **PDF Generation**: `reportlab`
-   **Excel Export**: `openpyxl`
-   **Environment Variables**: `python-decouple`
-   **CORS Management**: `django-cors-headers`
-   **Mock Integrations**: WhatsApp webhook, SendGrid/Mailgun, Google Calendar, Outlook, social media APIs (Facebook, Instagram, TikTok, Twitter/X, LinkedIn).