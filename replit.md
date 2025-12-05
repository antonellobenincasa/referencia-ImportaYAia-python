# IntegralCargoSolutions ICS - Hyperautomation Sales & Marketing Platform

## Overview
IntegralCargoSolutions ICS is a comprehensive Django REST Framework platform designed for the International Cargo Logistics market in Ecuador. Its primary purpose is to automate the commercial cycle from lead generation to quote follow-up, centralize communication, and manage marketing automation. The platform aims to streamline operations, enhance sales and marketing efforts for logistics providers, and drive business growth with the slogan "Servicio logistico integral, que impulsa tu negocio!".

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

## System Architecture

### Core Modules
1.  **SalesModule**: Manages Leads, Opportunities, automated Quote generation with parametrized profit margins, status tracking, and automatic 1-hour follow-up task creation. Includes APIKey management, BulkLeadImport, RUC validation, and customs email automation.
2.  **CommsModule**: Provides a centralized `InboxMessage` system for all communications (WhatsApp, Facebook, Instagram, TikTok, Email, Web forms), linking messages to Lead records. Includes mock WhatsApp webhook for lead creation.
3.  **MarketingModule**: Handles Email Templates and Campaigns, Social Media Post scheduling, and a comprehensive Landing Page System for automated quote collection and lead qualification. Landing pages support multi-channel distribution, transport-specific data collection, and automatic creation of Lead → Opportunity → Quote from submissions.

### UI/UX Decisions
The frontend is a React application built with Vite, TypeScript, and Tailwind CSS, featuring a complete Spanish localization for the Ecuador market and a responsive mobile-first design. Key components include a quote request form, CRM dashboard, centralized messages inbox, reports page, bulk lead import, and manual lead creation form. The corporate identity uses Aqua Flow (#14B8A6 teal) as primary, Velocity Green (#84CC16 lime) as accent, and Inter font family. Users can also customize themes via a modal with real-time preview. A fixed bottom navigation bar ensures key features are always accessible.

### Technical Implementation
-   **Backend**: Django 4.2.7 + Django REST Framework 3.14.0
-   **Frontend**: React + Vite + TypeScript + Tailwind CSS
-   **Database**: PostgreSQL
-   **Language**: Python 3.11
-   **Authentication**: djangorestframework-simplejwt for JWT-based authentication with custom `CustomUser` model and full data isolation via `OwnerFilterMixin`.
-   **Email**: Django `send_mail`
-   **API Documentation**: DRF Spectacular (OpenAPI/Swagger) at `/api/docs/`
-   **Localization**: Spanish (Ecuador) `es-ec`, America/Guayaquil timezone, USD currency.
-   **Report Generation**: Supports JSON, Excel, and PDF formats.
-   **Media Uploads**: Configured for MSDS documents and bulk import files.
-   **Server**: Django development server on port 5000 (serves both API and frontend React build).

### Key Features
-   **Lead Qualification**: Two-step lead creation with RUC validation (13 digits) and automatic customs email for non-importers.
-   **Bulk Lead Import**: Supports CSV, Excel (.xlsx, .xls), and TXT with automatic parsing and validation (including BOM handling and delimiter detection).
-   **API Key Management**: Centralized management for various external integrations.
-   **Automated Quoting**: Generates quotes with custom profit margins and unique numbering.
-   **Centralized Communication**: Consolidates messages from multiple channels.
-   **Marketing Automation**: Mass email campaigns, social media scheduling, and dynamic landing pages.
-   **Landing Page Quote System**: Interactive forms for detailed transport data collection, including `SERVICIO INTEGRAL` complementary services with specific VAT treatment (Honorarios Agenciamiento Aduanero, Seguro, Transporte Terrestre).
-   **Automatic Lead Processing**: Landing page submissions create Leads, Opportunities, and Quotes automatically.
-   **Scheduled Tasks**: Automatic 1-hour follow-up task creation after a quote is sent.
-   **Comprehensive Reporting**: On-demand reports with various export formats.
-   **Real-time Inland Transport Pricing**: Dynamic USD rates for destination cities with VAT exemption.

## External Dependencies
-   **Database**: PostgreSQL
-   **Task Scheduling**: `celery` + `django-celery-beat`
-   **PDF Generation**: `reportlab`
-   **Excel Export**: `openpyxl`
-   **Environment Variables**: `python-decouple`
-   **CORS Management**: `django-cors-headers`
-   **File Parsing**: `csv`, `openpyxl`
-   **Email**: Django `send_mail` (mock integration for development)
-   **Mock Integrations**: WhatsApp webhook, SendGrid/Mailgun, Google Calendar, Outlook, social media APIs (Facebook, Instagram, TikTok, Twitter/X, LinkedIn).