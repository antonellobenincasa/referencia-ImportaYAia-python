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

### Sprint 2 - Quote Workflow (December 10, 2024)
- **QuoteScenario Model**: Multi-option quote scenarios (economico, estandar, express) with FK links to rate tables
- **QuoteLineItem Model**: Detailed cost breakdown per scenario with categories (flete, seguro, arancel, IVA, FODINFA, etc.)
- **Scenario Generation API**: `/api/sales/lead-cotizaciones/{id}/generar-escenarios/`
  - Creates 3 scenarios (air, sea, standard) with route-based rate lookup
  - Calculates CIF-based customs duties using CustomsDutyRate
  - Generates line items for full cost transparency (flete, seguro, arancel, fodinfa, iva, agenciamiento, transporte_interno)
  - Returns error with actionable message if no freight rates exist for the route
  - Tracks missing rate types in response for transparency
- **Scenario Selection API**: `/api/sales/lead-cotizaciones/{id}/seleccionar-escenario/`
  - Selects preferred scenario and syncs totals to cotizacion
- **Quote Status API**: `/api/sales/lead-cotizaciones/por-estado/`
  - Returns quote counts grouped by status for dashboard
- **State Machine Flow**: pendiente → cotizado → aprobada → ro_generado → en_transito → completada
- **RO Generation**: Automatic Routing Order number upon shipping instruction submission
- **BACKLOG**: Enhanced route matching (destino_ciudad, transport subtype, incoterm fields on FreightRate)

### Sprint 3 - Tracking & Pre-liquidation (December 10, 2024)
- **Shipment Model**: Full shipment tracking with 9 status states
  - States: booking_confirmado → en_origen → en_transito → en_aduana → nacionalizado → en_distribucion → entregado
  - Auto-generated tracking numbers (IYA-YYYYMMDD-XXXX format)
  - Transport types: aereo, maritimo, terrestre, multimodal
  - Full route tracking: origin/destination country and city
  - BL/AWB numbers, container info, carrier details
  - Date tracking: estimated/actual for departure, arrival, delivery
- **ShipmentTracking Model**: Event log for status updates
  - Auto-updates parent Shipment's current_status and location on save
- **PreLiquidation Model**: Customs pre-liquidation with AI HS classification
  - AI-powered HS code suggestion with confidence scores
  - Full duty breakdown: ad_valorem, fodinfa, ice, salvaguardia, iva
  - CIF calculation from FOB + freight + insurance
  - Confirmation workflow with user tracking
- **Shipment API**: `/api/sales/shipments/`
  - CRUD operations with tracking history
  - `por-estado/`: Dashboard counts by status
  - `agregar-evento/`: Add tracking event
  - `historial/`: Full tracking history for shipment
  - `buscar/?tracking_number=XXX`: Search by tracking number
- **Pre-liquidation API**: `/api/sales/pre-liquidations/`
  - CRUD operations with auto HS suggestion on create
  - `confirmar-hs/`: Confirm HS code and calculate full duty breakdown using CustomsDutyRate
  - `sugerir-hs/`: AI endpoint for HS code suggestion (mock keyword-based with fallback)
  - Fallback to estimated rates (10% ad valorem, 0.5% FODINFA, 12% IVA) if no CustomsDutyRate exists

### Sprint 4 - Analytics & Dashboard Inteligente (December 10, 2024)
- **Dashboard Summary API**: `/api/sales/dashboard/`
  - Consolidated endpoint for LEAD portal widgets
  - Cotizaciones por estado (pendiente, aprobada, etc.)
  - Embarques activos y por estado
  - Métricas del mes (cotizaciones nuevas, valor cotizado)
  - Resumen financiero (tributos pagados, valor CIF total)
- **Cost Analytics Report**: `/api/sales/reports/?type=cost_analytics`
  - Análisis de costos por ruta principal
  - Desglose por tipo de transporte
  - Desglose de costos por categoría (flete, seguro, arancel, etc.)
  - Tributos aduaneros pagados
- **Operational KPIs Report**: `/api/sales/reports/?type=operational_kpis`
  - Tiempos de tránsito promedio por tipo de transporte
  - Tasa de entrega a tiempo
  - Conteos por estado de embarque
  - Métricas de rendimiento operacional
- **Import Trends Report**: `/api/sales/reports/?type=import_trends`
  - Tendencias por capítulo HS (categorías de productos)
  - Top países de origen
  - Valores FOB/CIF totales por período
- **Financial Summary Report**: `/api/sales/reports/?type=financial_summary`
  - Desglose completo de tributos (Ad Valorem, FODINFA, ICE, Salvaguardia, IVA)
  - Valores FOB y CIF totales
  - Resumen de cotizaciones aprobadas
  - Desglose de costos por categoría

### QA & Testing (December 10, 2024)
- **Comprehensive Test Suite** (SalesModule/tests.py):
  - TestDataFactory: Factory for generating realistic Ecuador-specific test data
  - LeadCotizacionAPITests: 6 tests for cotización lifecycle
  - RoutingOrderAPITests: 3 tests for RO generation workflow
  - ShipmentTrackingAPITests: 6 tests for tracking endpoints
  - PreLiquidationAPITests: 4 tests for HS classification and SENAE duty calculations
  - DashboardAPITests: 5 tests for dashboard and reports
  - SecurityTests: 9 tests for authentication, authorization, SQL injection, XSS
  - DataIntegrityTests: 4 tests for database constraints
  - RateCalculationTests: 4 tests for rate calculation logic
- **Test Data Generation**: `python manage.py generate_test_data`
  - Creates 3 test LEAD users with complete profiles
  - Generates realistic freight, insurance, customs duty rates
  - Creates cotizaciones in all workflow states
  - Seeds shipments with tracking history
  - Pre-liquidations with calculated tributes
- **Test Credentials** (dev only): carlos.mendez@test.importaya.ia / TestPass123!

### MASTER ADMIN Module (December 10, 2024)
- **Super Administrator Role**: Exclusive access for system owner with unrestricted permissions
- **Security Architecture**:
  - Hidden URL path: `/xm7k9p2v4q8n/` (obfuscated, not discoverable)
  - Credentials stored in Replit Secrets (MASTER_ADMIN_USERNAME, MASTER_ADMIN_PASSWORD)
  - Completely isolated from regular JWT authentication system
  - Token-based sessions with 8-hour expiration
  - Custom `X-Master-Admin-Token` header authentication
- **Dashboard Features**:
  - High-level KPIs: Total LEADs, cotizaciones, ROs activos, embarques, valor cotizado, tributos
  - Full CRUD access to all database tables (Users, Cotizaciones, Shipments, Rates)
  - System logs viewer with API status monitoring
- **Financial Reporting (Profit Review)**:
  - Margin analysis per RO/Freight Forwarder
  - Cost breakdown and profit percentage calculations
  - CSV export functionality for financial auditing
- **API Endpoints**:
  - `POST /api/xm7k9p2v4q8n/auth/login/` - Exclusive authentication
  - `GET /api/xm7k9p2v4q8n/dashboard/` - System KPIs
  - `GET/PUT/DELETE /api/xm7k9p2v4q8n/users/` - User management
  - `GET/PUT/DELETE /api/xm7k9p2v4q8n/cotizaciones/` - Quote management
  - `GET/PUT /api/xm7k9p2v4q8n/shipments/` - Shipment management
  - `GET /api/xm7k9p2v4q8n/rates/?type=freight|insurance|customs|inland|brokerage` - Rate tables
  - `GET /api/xm7k9p2v4q8n/profit-review/` - Financial analysis
  - `GET /api/xm7k9p2v4q8n/logs/` - System logs
  - `GET /api/xm7k9p2v4q8n/export/?type=profit` - CSV export

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
