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