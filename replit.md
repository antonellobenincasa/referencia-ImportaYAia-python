# ImportaYa.ia - Plataforma Inteligente de Logística de Carga

## Overview
ImportaYa.ia is a comprehensive Django REST Framework platform designed for the International Cargo Logistics market in Ecuador. Its primary purpose is to provide importers (LEADs) with an intelligent self-service platform for requesting quotes, tracking shipments, and managing logistics operations. The platform features the slogan "La logística de carga integral, ahora es Inteligente!" emphasizing intelligent automation and aims to streamline logistics for Ecuadorian importers.

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
1.  **SalesModule**: Manages Leads, automated Quote generation with parametrized profit margins, status tracking, and 1-hour follow-up task creation. Includes RUC validation and customs email automation.
2.  **CommsModule**: Provides a centralized `InboxMessage` system for all communications (WhatsApp, Facebook, Instagram, TikTok, Email, Web forms), linking messages to Lead records.
3.  **MarketingModule**: Handles Email Templates and Campaigns, Social Media Post scheduling, and Landing Pages for automated quote collection.

### UI/UX Decisions
The frontend is a React application built with Vite, TypeScript, and Tailwind CSS, featuring complete Spanish localization for the Ecuador market and a responsive mobile-first design. The corporate identity uses Primary: Aqua Flow (#00C9B7), Accent: Velocity Green (#A4FF00), Deep: Ocean Blue (#0A2540), and Inter font family. The logo is a Gradient IA badge.

### Technical Implementation
-   **Backend**: Django 4.2.7 + Django REST Framework 3.14.0
-   **Frontend**: React + Vite + TypeScript + Tailwind CSS
-   **Database**: PostgreSQL
-   **Language**: Python 3.11
-   **Authentication**: djangorestframework-simplejwt for JWT-based authentication
-   **API Documentation**: DRF Spectacular (OpenAPI/Swagger) at `/api/docs/`
-   **Localization**: Spanish (Ecuador) `es-ec`, America/Guayaquil timezone, USD currency

### Feature Specifications
-   **Intelligent Quoting**: 24/7 automated quote generation with competitive rates, multi-option scenarios (economico, estandar, express), and detailed cost breakdowns.
-   **Lead Qualification**: RUC validation and automatic customs email for non-importers.
-   **Quote Management**: Approve quotes, generate Routing Order (RO) numbers, and track status through a state machine flow (pendiente → cotizado → aprobada → ro_generado → en_transito → completada).
-   **Shipment Tracking**: Real-time tracking from origin to final delivery in Ecuador with 9 status states and auto-generated tracking numbers (IYA-YYYYMMDD-XXXX).
-   **Pre-liquidation**: Customs pre-liquidation with AI-powered HS code suggestion, full duty breakdown, and confirmation workflow.
-   **Dashboard Workflow**: A 4-step intelligent workflow for quote request, quote management, shipping instructions (RO generation), and SENAE pre-liquidation.
-   **Master Admin Module**: A super administrator role with unrestricted permissions, a hidden URL path, token-based authentication, and CRUD access to all system data, including financial reporting and KPIs.

### System Design Choices
-   **Cost Database**: Utilizes five rate tables (FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate, CustomsBrokerageRate) with calculation methods for comprehensive cost estimation.
-   **Data Models**: Includes models for LeadProfile, QuoteScenario, QuoteLineItem, Shipment, ShipmentTracking, and PreLiquidation, facilitating detailed logistics management.
-   **API Endpoints**: Comprehensive set of RESTful APIs for profile management, quote generation/selection, shipment tracking, pre-liquidation, and dashboard analytics.
-   **Gating Logic**: Workflow pages validate prerequisites and auto-redirect users with a loading spinner.

## External Dependencies
-   **Database**: PostgreSQL
-   **AI Integration**: Google Gemini AI via `google-genai` SDK (user's own GEMINI_API_KEY)
-   **Task Scheduling**: `celery` + `django-celery-beat`
-   **PDF Generation**: `reportlab`
-   **Excel Export**: `openpyxl`
-   **Environment Variables**: `python-decouple`
-   **CORS Management**: `django-cors-headers`
-   **Email**: Django `send_mail`
-   **Mock Integrations**: WhatsApp webhook, SendGrid/Mailgun, Google Calendar, social media APIs

## AI Integration (Gemini)
-   **Service**: `SalesModule/gemini_service.py` provides HS code classification, customs analysis, and AI assistant chat
-   **Model**: gemini-2.5-flash with structured JSON output and multimodal support
-   **SENAE 2025 Knowledge**: Enhanced prompts with current Ecuadorian customs regulations
-   **Permit Detection**: Identifies requirements from ARCSA, AGROCALIDAD, INEN, and other institutions
-   **Tributos 2025**: IVA 15%, FODINFA 0.5%, Ad-Valorem variable (0-45%)
-   **Fallback Mechanism**: Graceful degradation to keyword-based classification (100+ product types) with scenario generation
-   **FCL Container Support**: 11 container types with specific rates and capacities: 1x20GP, 1x40GP, 1x40HC, 1x40NOR, 1x20/40 REEFER, 1x40 OT HC, 1x20/40 FLAT RACK, 1x40/20 OPEN TOP
-   **PDF Quote Generation**: Professional quote PDFs with corporate branding for all transport types (FCL, LCL, Aéreo) including freight tables, local costs with IVA indicators, totals, and transport-specific notes
-   **Status Tracking**: `ai_status` field tracks classification source ('success', 'fallback_keyword', 'fallback_error', etc.)
-   **Error Handling**: All API calls wrapped with try/except, safe JSON parsing, field defaults via .get()
-   **Automatic Quote Generation**: `generate_intelligent_quote()` triggers automatically when leads submit quote requests:
    - HS code classification with SENAE 2025 norms
    - Customs duty calculation (Ad-Valorem, IVA 15%, FODINFA 0.5%)
    - Permit detection (ARCSA, AGROCALIDAD, INEN)
    - Multi-scenario pricing (económico/estándar/express) based on transport type (FCL/LCL/Aéreo)
    - QuoteSubmission model stores AI fields: ai_hs_code, ai_category, ai_hs_confidence, ai_ad_valorem_pct, ai_requires_permit, ai_permit_institutions, ai_response, ai_status
-   **AI Assistant Chat**: Floating chat widget with two modes:
    - **Mode A**: Text queries about tariffs, regulations, SENAE processes
    - **Mode B**: Document analysis (invoices, B/L, AWB) with structured data extraction

## Permit Institutions (Ecuador)
-   **ARCSA**: Alimentos procesados, cosmeticos, medicamentos, dispositivos medicos
-   **AGROCALIDAD**: Productos agropecuarios, plantas, semillas, animales
-   **INEN**: Certificados de conformidad para textiles, electrodomesticos, juguetes
-   **Ministerio Interior/CONSEP**: Sustancias quimicas controladas
-   **MAG/MAATE**: Productos forestales y madereros

## Logistics Provider Database
-   **Models**: `LogisticsProvider` and `ProviderRate` for managing real logistics providers
-   **Provider Types**: FCL (16 navieras), LCL (6 consolidadores), AEREO (36 aerolíneas)
-   **Rate Validation**: Maritime (FCL/LCL) restricted to GYE/PSJ ports; Air (AEREO) to GYE/UIO airports
-   **Integration**: Providers automatically included in AI-generated quote scenarios with real company names
-   **API Endpoints**: `/api/sales/logistics-providers/` and `/api/sales/provider-rates/`
-   **Load Command**: `python manage.py load_providers <excel_file>`

## World Ports Database
-   **Model**: `Port` for organizing world maritime ports by region/country
-   **Standard**: Uses UN/LOCODE (5-character) for unique port identification
-   **Fields**: un_locode (unique), name, country, region, is_active
-   **Indexes**: Optimized for un_locode, name, country, and region searches
-   **Regions**: Norteamérica, Latinoamérica, Europa, África, Asia, Oceanía
-   **API Endpoints**:
    - `GET /api/sales/ports/` - Lista todos los puertos
    - `GET /api/sales/ports/search/?q=<query>` - Búsqueda por nombre/país/código
    - `GET /api/sales/ports/by-region/?region=Asia` - Puertos por región
    - `GET /api/sales/ports/by-locode/<LOCODE>/` - Búsqueda por UN/LOCODE
    - `GET /api/sales/ports/by-country/?country=China` - Puertos por país
    - `GET /api/sales/ports/summary/` - Estadísticas de la base de datos
-   **Load Command**: `python manage.py load_ports` (idempotente, no duplica)
-   **Current Data**: 82 puertos de 40 países (Norteamérica 14, Latinoamérica 14, Europa 15, África 9, Asia 24, Oceanía 6)
-   **Ecuador Port**: ECGYE (Guayaquil) - Puerto principal de destino

## World Airports Database
-   **Models**: `Airport` and `AirportRegion` for organizing world airports by region/country
-   **Search Logic**: 
    - Users search by `ciudad_exacta` (user-friendly city names in Spanish)
    - System uses `iata_code` internally for freight rate lookups
-   **Fields**: region_name, country, ciudad_exacta, name, iata_code, icao_code, coordinates, timezone
-   **Indexes**: Optimized for ciudad_exacta search and iata_code lookups
-   **Regions**: Asia, Europa, Norteamérica, Centroamérica, Sudamérica, África, Oceanía, Medio Oriente
-   **API Endpoints**:
    - `GET /api/sales/airports/search/?q=<query>` - Search by city (primary user search)
    - `GET /api/sales/airports/by-iata/<IATA>/` - Internal lookup by IATA code
    - `GET /api/sales/airports/summary/` - Database statistics
    - `GET /api/sales/airports/by-country/` - Airports grouped by country
-   **Load Command**: `python manage.py load_airports <excel_file>`
-   **Current Data**: 65 airports from 5 regions (Asia 21, Norteamérica 14, Europa 15, Sudamérica 11, Medio Oriente 4)

## Calculator Module (Peso Cobrable)
-   **Location**: `SalesModule/calculator.py`
-   **Purpose**: Motor de cálculo para normalizar unidades y calcular Peso Cobrable (Chargeable Weight)
-   **Functions**:
    - `normalizar_dimensiones(largo, ancho, alto, unidad)` - Convierte a CMT
    - `normalizar_peso(peso, unidad)` - Convierte a KGM
    - `calcular_peso_cobrable(largo_cm, ancho_cm, alto_cm, peso_kg, tipo_transporte)` - Cálculo principal
    - `calcular_peso_cobrable_completo(...)` - Función todo-en-uno con conversión
-   **Unidades Soportadas**:
    - Peso: KGM, LBR, TNE (y aliases: kg, lb, ton)
    - Longitud: CMT, MTR, INH (y aliases: cm, m, inch, pulgadas)
    - Volumen: MTQ, FTQ (CBM, CFT)
-   **Lógica de Negocio**:
    - AÉREO: Peso Volumétrico = (L×A×H cm) / 6000. Cobra MAYOR entre Bruto y Volumétrico
    - LCL (W/M): Compara Peso (TON) vs Volumen (CBM). Factor estiba: 1 CBM = 1 TON
    - FCL: Flete por contenedor completo

## Container Logic Module (Optimizador de Contenedores)
-   **Location**: `SalesModule/container_logic.py`
-   **Purpose**: Determina la mejor opción de contenedor (LCL vs FCL) y selecciona el tipo óptimo
-   **Functions**:
    - `optimizar_contenedor(volumen_cbm, peso_kg)` - Función principal que retorna ResultadoOptimizacion
    - `optimizar_contenedor_json(volumen_cbm, peso_kg)` - Versión JSON-serializable para API
    - `calcular_ows(volumen_cbm, peso_kg)` - Calcula OWS (Overweight Surcharge) para LCL
    - `calcular_contenedores_necesarios(volumen, peso, contenedor)` - Calcula cantidad necesaria
    - `evaluar_opcion_contenedor(volumen, peso, contenedor)` - Evalúa métricas por tipo
-   **Constantes del Sistema MARÍTIMO LCL**:
    - LCL estándar: volumen <= 15 CBM Y peso <= 4.99 TON (sin recargos)
    - LCL con OWS (Overweight Surcharge):
      - 5.00 a 7.99 TON: USD 10 por CBM/TON extra
      - 8.00 a 9.99 TON: USD 15 por CBM/TON extra
      - 10.00 a 11.99 TON: USD 25 por CBM/TON extra
    - LCL > 12 TON: Requiere cotización manual (caso a caso)
-   **Constantes del Sistema FCL**:
    - 20GP: Max 30 CBM, 27,000 kg
    - 40GP: Max 62 CBM, 27,000 kg
    - 40HC: Max 68 CBM, 27,000 kg (priorizado para carga voluminosa)
-   **Lógica de Decisión**:
    1. Si volumen <= 15 CBM Y peso <= 4.99 TON → LCL estándar
    2. Si volumen <= 15 CBM Y peso 5-11.99 TON → LCL + OWS
    3. Si peso >= 12 TON → Cotización manual + alternativas sugeridas
    4. Sino, evaluar contenedores FCL (prioriza 40HC para voluminoso, 2x20GP para pesado)
    5. CRÍTICO: Si peso excede 27 TON por contenedor, dividir en múltiples
-   **Alternativas para peso > 12 TON**:
    - Opción A: Partir en 2 embarques LCL separados (~6 TON cada uno)
    - Opción B: Cotizar como FCL 1x20GP (si vol <= 30 CBM y peso <= 27 TON)