# Hyperautomation Sales & Marketing Platform (H-SAMP)

## Overview
H-SAMP is a comprehensive Django REST Framework platform for the International Cargo Logistics market in Ecuador. It automates the commercial cycle from lead generation to quote follow-up, centralizes communication, and manages marketing automation. The platform aims to streamline operations and enhance sales and marketing efforts for logistics providers.

## User Preferences
- Ecuador-focused logistics platform
- Automated 1-hour follow-up after sending quotes (not 48 hours)
- On-demand report generation with multiple export formats
- Mock integrations for external services (WhatsApp, SendGrid, Google Calendar, social media APIs)

## System Architecture

### Core Modules
The platform is built with three modular Django apps:

1.  **SalesModule (CRM, Quoting & Scheduling)**: Manages Leads, Opportunities, automated Quote generation with parametrized profit margins, status tracking, and automatic 1-hour follow-up task creation. Includes meeting scheduling with mock calendar sync.
2.  **CommsModule (Centralized Inbox & Integrations)**: Provides a centralized `InboxMessage` system for all communications (WhatsApp, Facebook, Instagram, TikTok, Email, Web forms), linking messages to Lead records and tracking message direction and status. Includes mock WhatsApp webhook for lead creation.
3.  **MarketingModule (Outbound Automation & Landing Pages)**: Handles Email Templates and Campaigns with segment filtering, Social Media Post scheduling, and a comprehensive Landing Page System for automated quote collection. Landing pages feature multi-channel distribution, customer qualification (RUC lookup), transport-specific data collection (Air, Ocean LCL/FCL, DG cargo), smart quote validity, and automatic creation of Lead → Opportunity → Quote from submissions.

### UI/UX Decisions
The frontend is a React application built with Vite, TypeScript, and Tailwind CSS. It features a complete Spanish localization for the Ecuador market, a responsive mobile-first design, and interactive components like a quote request form, CRM dashboard with stats, a centralized messages inbox, and a reports page with date range pickers.

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
-   **Landing Page Quote System**: Interactive forms collecting detailed transport data, including `SERVICIO INTEGRAL` complementary services (Customs Clearance, Insurance, Inland Transport with automatic pricing).
-   **Automatic Lead Processing**: Submissions from landing pages automatically create Leads, Opportunities, and Quotes.
-   **Scheduled Tasks**: Automatic 1-hour follow-up task creation after a quote is sent.
-   **Comprehensive Reporting**: On-demand reports with various export formats.

## External Dependencies
-   **Database**: PostgreSQL (via Replit integration)
-   **Task Scheduling**: `celery` + `django-celery-beat`
-   **PDF Generation**: `reportlab`
-   **Excel Export**: `openpyxl`
-   **Environment Variables**: `python-decouple`
-   **CORS Management**: `django-cors-headers`
-   **Mock Integrations**: WhatsApp webhook, SendGrid/Mailgun, Google Calendar, Outlook, social media APIs (Facebook, Instagram, TikTok, Twitter/X, LinkedIn).