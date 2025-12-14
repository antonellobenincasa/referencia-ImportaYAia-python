# ImportaYa.ia - Plataforma Inteligente de Logística de Carga

## Overview
ImportaYa.ia is a comprehensive Django REST Framework platform for the International Cargo Logistics market in Ecuador. It provides importers with an intelligent self-service platform for requesting quotes, tracking shipments, and managing logistics operations. The platform aims to streamline logistics for Ecuadorian importers through intelligent automation, embodied by its slogan: "La logística de carga integral, ahora es Inteligente!".

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
-   **SalesModule**: Manages Leads, automated Quote generation, status tracking, and follow-up task creation. Includes RUC validation and customs email automation.
-   **CommsModule**: Centralized `InboxMessage` system for all communications (WhatsApp, Facebook, Instagram, TikTok, Email, Web forms), linking messages to Lead records.
-   **MarketingModule**: Handles Email Templates, Campaigns, Social Media Post scheduling, and Landing Pages for automated quote collection.

### UI/UX Decisions
The frontend is a React application built with Vite, TypeScript, and Tailwind CSS, featuring complete Spanish localization for the Ecuador market and a responsive mobile-first design. The corporate identity uses Primary: Aqua Flow (#00C9B7), Accent: Velocity Green (#A4FF00), Deep: Ocean Blue (#0A2540), and Inter font family. The logo is a Gradient IA badge.

### Technical Implementation
-   **Backend**: Django 4.2.7 + Django REST Framework 3.14.0
-   **Frontend**: React + Vite + TypeScript + Tailwind CSS
-   **Database**: PostgreSQL
-   **Language**: Python 3.11
-   **Authentication**: djangorestframework-simplejwt (JWT)
-   **API Documentation**: DRF Spectacular (OpenAPI/Swagger)
-   **Localization**: Spanish (Ecuador) `es-ec`, America/Guayaquil timezone, USD currency

### Feature Specifications
-   **Intelligent Quoting**: 24/7 automated quote generation with multi-option scenarios (economico, estandar, express) and detailed cost breakdowns.
-   **Lead Qualification**: RUC validation and automatic customs email for non-importers.
-   **Quote Management**: Approve quotes, generate Routing Order (RO) numbers, and track status through a state machine flow.
-   **Shipment Tracking**: Real-time tracking from origin to final delivery in Ecuador with 9 status states and auto-generated tracking numbers.
-   **Pre-liquidation**: Customs pre-liquidation with AI-powered HS code suggestion, full duty breakdown, and confirmation workflow.
-   **Dashboard Workflow**: A 4-step intelligent workflow for quote request, quote management, shipping instructions (RO generation), and SENAE pre-liquidation.
-   **Master Admin Module**: Super administrator role with unrestricted permissions and CRUD access to all system data, including financial reporting and KPIs.

### System Design Choices
-   **Cost Database**: Utilizes five rate tables (FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate, CustomsBrokerageRate) for comprehensive cost estimation.
-   **Data Models**: Includes models for LeadProfile, QuoteScenario, QuoteLineItem, Shipment, ShipmentTracking, and PreLiquidation.
-   **API Endpoints**: Comprehensive set of RESTful APIs for profile management, quote generation/selection, shipment tracking, pre-liquidation, and dashboard analytics.
-   **Gating Logic**: Workflow pages validate prerequisites and auto-redirect users with a loading spinner.
-   **Calculator Module**: Normalizes units and calculates Chargeable Weight (`Peso Cobrable`) for different transport types (Aéreo, LCL, FCL).
-   **Container Logic Module**: Determines optimal container option (LCL vs FCL) and type, including logic for Overweight Surcharge (OWS) and handling critical weight/volume scenarios.
-   **Financial Logistics System**: Includes an Exchange Rate Module with a 3% banking spread, a Currency Manager Module for real-time updates (yfinance, database fallback), and a Quotation Engine Module for currency conversion and dynamic IVA calculation based on transport type. A Legal Footer Generator dynamically creates disclaimers for exchange rates and taxes.

## External Dependencies
-   **Database**: PostgreSQL
-   **AI Integration**: Google Gemini AI via `google-genai` SDK (for HS code classification, customs analysis, AI assistant chat, and automatic quote generation)
-   **Task Scheduling**: `celery` + `django-celery-beat`
-   **PDF Generation**: `reportlab`
-   **Excel Export**: `openpyxl`
-   **Environment Variables**: `python-decouple`
-   **CORS Management**: `django-cors-headers`
-   **Email**: Django `send_mail`
-   **Mock Integrations**: WhatsApp webhook, SendGrid/Mailgun, Google Calendar, social media APIs
-   **Financial Data**: yfinance (for exchange rates)

## Freight Rate Integration System (NEW - Dec 2025)

### Data Models
-   **FreightRateFCL**: Tarifas de flete marítimo/aéreo (1,775 registros: FCL 1314, LCL 438, AÉREO 23)
    - Campos: pol_name, pod_name, carrier_name, validity_date, transit_time, free_days
    - Costos por contenedor: cost_20gp, cost_40gp, cost_40hc, cost_40nor, cost_20reefer, cost_40reefer
    - LCL: lcl_rate_per_cbm, lcl_min_charge
    - AÉREO: air_rate_min, air_rate_45, air_rate_100, air_rate_300, air_rate_500, air_rate_1000
-   **ProfitMarginConfig**: Configuración de márgenes de ganancia por tipo de transporte y rubro
    - margin_type: PERCENTAGE o FIXED
    - Fallback por defecto: 15% si no hay configuración
-   **LocalDestinationCost**: Gastos locales en destino (THC, handling, etc.)
    - is_iva_exempt: Propagado al cálculo de IVA

### Quotation Engine Integration
-   **Location**: `SalesModule/quotation_engine.py`
-   **Functions**:
    - obtener_tarifa_flete(): Busca mejor tarifa en BD, hard-fail solo si tarifa es None (0 es válido)
    - aplicar_margen_ganancia(): Aplica margen configurado o fallback 15%
    - obtener_gastos_locales_db(): Obtiene gastos locales con propagación de IVA exempt
    - generar_cotizacion_automatica(): Genera cotización completa automáticamente
    - generar_escenarios_cotizacion(): Genera 3 escenarios con navieras distintas

### MasterAdmin CRUD
-   **Endpoints**: `/api/admin/freight-rates-fcl/`, `/api/admin/profit-margins/`, `/api/admin/local-costs/`
-   **Features**: Filtrado, paginación, importación masiva, exportación

## Insurance Bracket System (NEW - Dec 2025)

### Data Model
-   **InsuranceBracket**: Tramos de seguro por valor de mercancía (6 registros)
    - Campos: min_value, max_value, fixed_fee, rate_percentage (0.35%), iva_percentage (15%)
    - Método: get_bracket_for_value() para búsqueda por valor de mercancía
    - Método: calculate_total_premium() para cálculo con IVA

### Tramos Configurados
| Rango (USD) | Prima Fija | Con IVA |
|-------------|------------|---------|
| 0 - 20,000 | $70 | $80.50 |
| 20,001 - 30,000 | $105 | $120.75 |
| 30,001 - 50,000 | $175 | $201.25 |
| 50,001 - 100,000 | $350 | $402.50 |
| 100,001 - 300,000 | $1,050 | $1,207.50 |
| 300,001 - 500,000 | $1,750 | $2,012.50 |

### Quotation Engine Integration
-   **Función**: `calcular_seguro(goods_value, include_iva=True)`
-   **Retorna**: Dict con prima_base, iva_monto, total, tramo info
-   **Script**: `scripts/import_insurance.py` con regex parsing para CSV

## Notes Generator Module (NEW - Dec 2025)

### Data Models
-   **CarrierContract**: Contratos con navieras (carrier_code, free_demurrage_days, contract_validity, route_type)
-   **TransitTimeAverage**: Tiempos de tránsito por ruta (pol, pod, carrier_code, estimated_days)

### Notes Generator
-   **Location**: `SalesModule/notes_generator.py`
-   **Functions**: get_fcl_notes(), get_lcl_notes(), get_aereo_notes(), format_notes_for_pdf()
-   **Notas Estáticas FCL**: 10 notas fijas (tarifas all-in, exoneración, APP tracking, IVA 15%)
-   **Notas Dinámicas**: Validez, Tipo Ruta, Demurrage, Detención, Tiempo de Tránsito
-   **Nota de Seguro**: Promoción seguro ImportaYa.IA sin deducible

## Customer RUC Management System (NEW - Dec 2025)

### Data Model
-   **CustomerRUC**: RUCs registrados por clientes (accounts/models.py)
    - Campos: user (FK), ruc (13 dígitos), company_name, is_primary, status
    - Estados: pending, approved, rejected
    - Constraint: Un usuario no puede tener el mismo RUC duplicado
    - Métodos: get_primary_ruc(), get_approved_rucs()

### API Endpoints
-   **GET/POST** `/api/accounts/my-rucs/`: Ver y registrar RUCs del usuario
-   **GET** `/api/accounts/check-ruc/?ruc=XXX`: Verificar disponibilidad de RUC
-   **GET** `/api/accounts/pending-ruc-approvals/`: Cola de aprobación (Master Admin)
-   **POST** `/api/accounts/pending-ruc-approvals/{id}/`: Aprobar/rechazar RUC

### Workflow
1. Primer RUC se registra automáticamente como `is_primary=True` y `status=approved`
2. RUCs adicionales entran en estado `pending` para aprobación de Master Admin
3. Al aprobar, si el usuario no tiene RUC primario, el aprobado se convierte en primario
4. Frontend muestra RUC principal pre-poblado en formulario de cotización

## Pre-liquidación Documents System (UPDATED - Dec 2025)

### File Upload Support
-   **Endpoint**: `/api/sales/pre-liquidations/{id}/documentos/`
-   **Parsers**: MultiPartParser, FormParser
-   **Validación**: Máximo 10MB, tipos permitidos (PDF, imágenes, Word, Excel)
-   **Storage**: Django default_storage en `pre_liquidation_docs/{pre_liq_id}/`
-   **Fallback**: Soporte para registro de metadatos sin archivo físico