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