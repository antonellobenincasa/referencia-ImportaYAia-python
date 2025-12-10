# ImportaYa.ia - Plataforma Inteligente de Logística de Carga

## Overview
ImportaYa.ia is a comprehensive Django REST Framework platform designed for the International Cargo Logistics market in Ecuador. Its primary purpose is to provide importers (LEADs) with an intelligent self-service platform for requesting quotes, tracking shipments, and managing logistics operations. The platform features the slogan "La logística de carga integral, ahora es Inteligente!" emphasizing the intelligent automation capabilities.

## Recent Changes (December 2024)
- **Complete Rebranding**: Transformed from IntegralCargoSolutions/ICS.APP to ImportaYa.ia
- **New Logo**: Gradient IA logo (from #00C9B7 Aqua Flow to #A4FF00 Velocity Green)
- **New Slogan**: "La logística de carga integral, ahora es Inteligente!"
- **LEAD-Only Focus**: Removed all ASESOR (commercial advisor) functionality and references
- **Updated Contact**: info@importaya.ia
- **Simplified User Flow**: Platform now exclusively serves importers (LEADs)

### Sprint 1 - Intelligent Dashboard (December 10, 2024)
- **LeadProfile Model**: Extended user profile with RUC validation, legal type, SENAE code, trade preferences, business address, customs broker info
- **Logistics Rate Database**: 5 rate tables with calculation methods:
  - FreightRate (air/sea transport with surcharges)
  - InsuranceRate (cargo insurance with premium calculation)
  - CustomsDutyRate (SENAE tariffs: ad valorem, IVA, FODINFA, ICE, salvaguardia)
  - InlandTransportQuoteRate (domestic transport by city/vehicle)
  - CustomsBrokerageRate (customs brokerage fees)
- **Profile API**: `/api/accounts/profile/complete/` with GET/PUT/PATCH for complete importer profile management
- **Cost Database API**: Full CRUD for all rate tables with calculation endpoints

## User Preferences
- Ecuador-focused logistics platform for importers
- Automated 1-hour follow-up after sending quotes
- On-demand report generation with multiple export formats
- Mock integrations for external services (WhatsApp, SendGrid, Google Calendar, social media APIs)
- Landing page complementary services with clear VAT treatment and transparent pricing
- RUC validation for importers (exactly 13 numeric digits)
- Multi-platform support: iOS, Android, Windows Desktop
- Corporate Branding: Deep Ocean Blue (#0A2540), Aqua Flow (#00C9B7), Velocity Green (#A4FF00)
- Gradient IA Logo: from-[#00C9B7] to-[#A4FF00]

## System Architecture

### Core Modules
1.  **SalesModule**: Manages Leads, Opportunities, automated Quote generation with parametrized profit margins, status tracking, and automatic 1-hour follow-up task creation. Includes RUC validation and customs email automation.
2.  **CommsModule**: Provides a centralized `InboxMessage` system for all communications (WhatsApp, Facebook, Instagram, TikTok, Email, Web forms), linking messages to Lead records.
3.  **MarketingModule**: Handles Email Templates and Campaigns, Social Media Post scheduling, and Landing Pages for automated quote collection.

### UI/UX Decisions
The frontend is a React application built with Vite, TypeScript, and Tailwind CSS, featuring complete Spanish localization for the Ecuador market and a responsive mobile-first design. Key components include:
- Quote request form with step-by-step flow
- LEAD portal dashboard with intelligent workflow
- Quote tracking and management
- Shipment tracking

The corporate identity uses:
- Primary: Aqua Flow (#00C9B7 teal)
- Accent: Velocity Green (#A4FF00 lime)
- Deep: Ocean Blue (#0A2540)
- Font: Inter family
- Logo: Gradient IA badge

### Technical Implementation
-   **Backend**: Django 4.2.7 + Django REST Framework 3.14.0
-   **Frontend**: React + Vite + TypeScript + Tailwind CSS
-   **Database**: PostgreSQL
-   **Language**: Python 3.11
-   **Authentication**: djangorestframework-simplejwt for JWT-based authentication
-   **Email**: Django `send_mail`
-   **API Documentation**: DRF Spectacular (OpenAPI/Swagger) at `/api/docs/`
-   **Localization**: Spanish (Ecuador) `es-ec`, America/Guayaquil timezone, USD currency
-   **Server**: Django development server on port 5000 (serves both API and frontend React build)

### Key Features
-   **Intelligent Quoting**: 24/7 automated quote generation with competitive rates
-   **Lead Qualification**: RUC validation (13 digits) and automatic customs email for non-importers
-   **Quote Management**: Approve quotes, generate RO (Routing Order) numbers
-   **Shipment Tracking**: Real-time tracking from origin to final delivery in Ecuador
-   **Multi-modal Transport**: Air (2-5 days), Sea (15-30 days), and Land transport options
-   **Customs Agency**: Professional SENAE-certified customs brokerage

### Routing Structure
-   `/` - Landing page with ImportaYa.ia branding and call-to-action
-   `/nosotros` - About page showcasing intelligent logistics services
-   `/contacto` - Contact page with info@importaya.ia
-   `/descargar-app` - Multi-platform download page (iOS, Android, Windows Desktop)
-   `/login` - User authentication
-   `/register` - User registration for importers
-   `/portal` - LEAD portal dashboard (protected)
-   `/portal/solicitar-cotizacion` - LEAD quote request form
-   `/portal/mis-cotizaciones` - LEAD quote manager with approval and RO workflow
-   `/portal/rastrear` - Shipment tracking
-   `/portal/servicios` - Available services

### LEAD Portal Features
The LEAD portal (`/portal/*` routes) provides importers with self-service capabilities:
1. **Dashboard**: Overview of quotation status and quick actions
2. **Quote Request**: Intelligent quote form with pre-filled contact data
3. **Quote Manager**: View all quotations, approve quotes, send shipping instructions
4. **RO Generation**: Automatic Routing Order number generation upon shipping instruction submission
5. **Shipment Tracking**: Track cargo from origin to Ecuador
6. **Services Overview**: Available logistics services and pricing

## External Dependencies
-   **Database**: PostgreSQL
-   **Task Scheduling**: `celery` + `django-celery-beat`
-   **PDF Generation**: `reportlab`
-   **Excel Export**: `openpyxl`
-   **Environment Variables**: `python-decouple`
-   **CORS Management**: `django-cors-headers`
-   **Email**: Django `send_mail` (mock integration for development)
-   **Mock Integrations**: WhatsApp webhook, SendGrid/Mailgun, Google Calendar, social media APIs
