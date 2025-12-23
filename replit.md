# ImportaYa.ia - Plataforma Inteligente de Logística de Carga

## Overview
ImportaYa.ia is a comprehensive Django REST Framework platform designed for the International Cargo Logistics market in Ecuador. Its primary purpose is to provide importers with an intelligent self-service platform for requesting quotes, tracking shipments, and managing their logistics operations. The platform aims to streamline logistics through intelligent automation, embodied by its slogan: "La logística de carga integral, ahora es Inteligente!". Key capabilities include automated quote generation, real-time shipment tracking, and intelligent pre-liquidation processes.

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

### UI/UX Decisions
The frontend is a React application built with Vite, TypeScript, and Tailwind CSS. It features complete Spanish localization for the Ecuadorian market and a responsive, mobile-first design. The corporate identity uses Aqua Flow (#00C9B7) as primary, Velocity Green (#A4FF00) as accent, and Deep Ocean Blue (#0A2540). The Inter font family is used, and the logo is a Gradient IA badge.

### Technical Implementations
The backend is built with Django 4.2.7 and Django REST Framework 3.14.0, using Python 3.11. PostgreSQL serves as the database. Authentication is handled via `djangorestframework-simplejwt` (JWT), and API documentation is provided by DRF Spectacular (OpenAPI/Swagger). The system is localized for Spanish (Ecuador) (`es-ec`), uses the America/Guayaquil timezone, and USD currency.

### Feature Specifications
The platform provides 24/7 automated intelligent quoting with multi-option scenarios and detailed cost breakdowns. It includes lead qualification with RUC validation and customs email automation. Quote management supports approval, Routing Order (RO) generation, and status tracking. Real-time shipment tracking from origin to final delivery in Ecuador includes 9 status states and auto-generated tracking numbers. An AI-powered pre-liquidation system offers HS code suggestion, full duty breakdown, and workflow confirmation. The dashboard features a 4-step workflow for quote requests, quote management, shipping instructions, and SENAE pre-liquidation. A Master Admin Module provides full CRUD access and financial reporting.

Key modules include:
-   **SalesModule**: Manages Leads, automated Quote generation, status tracking, and follow-up task creation.
-   **CommsModule**: Centralized `InboxMessage` system for all communications (WhatsApp, social media, Email, Web forms), linked to Lead records.
-   **MarketingModule**: Handles Email Templates, Campaigns, Social Media Post scheduling, and Landing Pages for automated quote collection.

### System Design Choices
The system uses five rate tables (FreightRate, InsuranceRate, CustomsDutyRate, InlandTransportQuoteRate, CustomsBrokerageRate) for comprehensive cost estimation. Core data models include LeadProfile, QuoteScenario, QuoteLineItem, Shipment, ShipmentTracking, and PreLiquidation. Comprehensive RESTful APIs are provided for all functionalities. Gating logic ensures workflow prerequisites are met. A Calculator Module normalizes units and calculates Chargeable Weight, while a Container Logic Module determines optimal container options. The Financial Logistics System includes an Exchange Rate Module, Currency Manager, and a Quotation Engine for dynamic currency conversion and IVA calculation.

New functionalities include:
-   **Freight Rate Integration System**: Manages detailed freight rates for FCL, LCL, and Air, profit margins, and local destination costs. The Quotation Engine integrates these for automatic quote generation.
-   **Insurance Bracket System**: Calculates insurance premiums based on cargo value brackets, including fixed fees and percentages with IVA.
-   **Notes Generator Module**: Dynamically generates quote notes based on carrier contracts, transit times, and service types.
-   **Customer RUC Management System**: Allows users to register and manage multiple RUCs, with an approval workflow for additional RUCs and a fallback system for existing customers.
-   **Mi Cuenta - User Profile Management**: Provides a dashboard for users to view and edit personal information, manage RUCs, and access fallback RUC data.
-   **Pre-liquidation System Enhancements**: Access control based on quote status, automatic cost extraction from approved quotes, enhanced insurance calculation, and file upload support.
-   **Port Service Classification System**: Classifies port services by transit time and consolidates port names for display.
-   **Workflow Email Notifications**: Automated email notifications for key workflow stages like quote request, generation, approval, and RO issuance with deep links.
-   **FCL Security Services System**: Integrates inland FCL transport tariffs and optional security services (armed custody, satellite lock) with dynamic pricing based on destination city.
-   **AduanaExpertoIA Module**: Full-featured customs expert AI assistant with:
    - Chat interface with Markdown rendering, file attachment support (PDF, images)
    - Cost Simulator with complete Ecuador tax engine: Ad-Valorem (variable), IVA (15%), FODINFA (0.5%), ICE (variable), ISD (5% toggle)
    - 8 Incoterms supported: FOB, FCA, EXW, CIF, CFR, DAP, DDP, CPT with seller/buyer responsibilities
    - Insurance brackets by FOB value with fixed fees and percentages
    - LCL/FCL local costs (handling, storage, THC, documentation, B/L fee, customs broker)
    - Transport to 10 Ecuador cities with optional armed custody and satellite lock
    - Access control: requires RUC approved + at least one completed quote
    - Toggle view between "Chat IA" and "Simulador" for mobile responsiveness
-   **Freight Forwarder Portal System**: Dedicated portal for FF users to manage cargo tracking:
    - Invitation-based registration system with secure tokens and expiration
    - FF users can login at `/ff-portal` with their credentials
    - Interactive milestone update interface (replaces Excel template workflow)
    - Master Admin can invite FF companies via `/api/xm7k9p2v4q8n/ff-invitations/`
    - Master Admin can assign ROs to specific FF users via `/api/xm7k9p2v4q8n/ff-assignments/`
    - FF users only see and can update ROs assigned to them
    - Real-time progress tracking with milestone completion notifications
    - Models: `FFInvitation`, `FreightForwarderProfile`, `CustomUser.role='freight_forwarder'`
    - Portal tab in Master Admin Dashboard for invitation and assignment management

## External Dependencies
-   **Database**: PostgreSQL
-   **AI Integration**: Google Gemini AI (`google-genai` SDK) for HS code classification, customs analysis, AI assistant, and automatic quote generation.
-   **Task Scheduling**: `celery` + `django-celery-beat`
-   **PDF Generation**: `reportlab`
-   **Excel Export**: `openpyxl`
-   **Environment Variables**: `python-decouple`
-   **CORS Management**: `django-cors-headers`
-   **Email**: Django `send_mail`
-   **Mock Integrations**: WhatsApp webhook, SendGrid/Mailgun, Google Calendar, social media APIs.
-   **Financial Data**: `yfinance` (for exchange rates).