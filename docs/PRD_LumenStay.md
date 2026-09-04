# Product Requirements Document (PRD) — LumenStay

**Platform:** LumenStay Guest Experience & Revenue Platform  
**Client:** Lumen Hospitality Group LLC (Marcus Weil, Founder/CEO)  
**Date:** August 2026  
**Document Version:** 1.0.0  
**Target Milestone 1 Delivery:** Core Multi-Property PMS & Direct Booking Engine MVP  

---

## 1. Executive Summary & Problem Statement

Lumen Hospitality Group operates six distinct boutique hotels across Colorado and Utah (totaling 197 rooms). The properties range from heritage ski lodges to quiet-luxury hideaways and desert adventure hubs. The current operations are hindered by a sunsetting legacy PMS, disconnected Squarespace booking widgets, manual spreadsheet-based housekeeping and maintenance tracking, and manual extranet rate updates for OTAs.

**LumenStay** is a modern, unified multi-property hospitality platform designed to replace legacy systems with:
1. A centralized multi-property reservation engine with direct guest booking and custom rate plans.
2. A high-efficiency Property Management System (PMS) core for front-desk check-in/out, room assignments, and folio management.
3. A tablet-first, real-time staff operations board for housekeeping (with English/Spanish support) and maintenance ticketing (capturing tribal knowledge on room quirks).
4. A mobile-first guest web portal supporting contactless check-in, simulated digital keys (Salto/Assa Abloy), and in-stay service requests.
5. An intelligent revenue management & channel manager syncing inventory with OTAs (Expedia, Booking.com, Airbnb, Google Hotel Ads) and suggesting occupancy-based dynamic rates.
6. A custom boutique loyalty program and consolidated ownership analytics (occupancy, ADR, RevPAR, pace).

---

## 2. Property Portfolio & Brand Identity

The system provides centralized multi-tenant management while dynamically theming guest touchpoints for each property's distinct brand:

| Property Name | Location | Rooms | Character & Seasonality | Primary Aesthetic / Theme |
| :--- | :--- | :--- | :--- | :--- |
| **The Birchwood** | Aspen, CO | 42 | 1920s historic luxury lodge; high ski winter + summer weddings | Forest Green, Warm Amber Wood, Brass |
| **Copperline Inn** | Breckenridge, CO | 28 | Rustic alpine; ski winter + mountain biking summer | Copper Ochre, Mountain Slate, Charcoal |
| **The Wren House** | Telluride, CO | 19 | Quiet luxury, high ADR, white-glove bespoke service | Warm Alabaster, Champagne Gold, Deep Noir |
| **Sundowner Lodge** | Park City, UT | 51 | Flagship resort, conference & group events | Sunset Terracotta, Pine Needle, Warm Cream |
| **Cedar & Salt** | Moab, UT | 24 | Desert adventure hub; peak spring/fall, quiet winter | Sandstone Red, Sagebrush Green, Clay |
| **The Ledger** | Salt Lake City, UT | 33 | Modern urban boutique, business & transit travelers | Ink Navy, Burnished Brass, Crisp Linen |

---

## 3. Technology Architecture & Stack

### 3.1 Tech Stack
- **Frontend:** React 18+ with TypeScript, Vite, Tailwind CSS with customized luxury color tokens, Lucide icons, Framer Motion for micro-interactions, responsive tablet & mobile views.
- **Backend:** Node.js + Express with TypeScript, RESTful JSON API endpoints, and WebSocket server (`ws` / `socket.io`) for instant room status and staff synchronization.
- **Database & ORM:** SQLite with **Drizzle ORM** (lightweight, zero-config local run, strict type-safety, seamless path to PostgreSQL in production).
- **Shared Package:** `shared/` directory defining shared TypeScript schemas, validation logic (Zod), models, and role permissions.
- **Integration Layer:** Adapter pattern with simulation drivers for:
  - Payment Tokenization & Folio Settlement (Square / Elavon emulation).
  - Digital Door Lock BLE simulator (Salto & Assa Abloy protocol abstractions).
  - OTA Two-way Channel Manager simulator (Expedia, Booking.com, Airbnb, Google Hotel Ads).
  - Transactional Guest Communications (SMS / Email notification dispatcher).

### 3.2 User Roles & Access Matrix (RBAC)

| Role | Permissions & Primary Interface |
| :--- | :--- |
| **Ownership / Executive** (Marcus & Finance) | Group-wide consolidated reporting, RevPAR/ADR/Occupancy pace, high-level portfolio oversight. |
| **General Manager (GM)** | Full property-level control, staff shifts, emergency broadcasts, shift checklists, rate overrides. |
| **Front Desk Agent** | Rapid reservation lookup, check-in/out, folio charge additions, room status overrides, room moves. |
| **Housekeeping** | Daily room assignment board, 1-tap Clean/Dirty/Inspected updates, bilingual EN/ES interface. |
| **Maintenance Lead** | Ticket triage, quirky room history, photo attachments, preventive maintenance tasks. |
| **Revenue Manager** | Rate plan editor, dynamic pricing rules, competitor rate monitor, OTA channel sync dashboard. |
| **Guest** | Direct booking cart, stay modification, mobile check-in, digital room key, in-stay requests, loyalty profile. |

*Development Feature:* An interactive **Role & Property Switcher Bar** to immediately test any role across all 6 properties without friction.

---

## 4. System Functional Specifications

### 4.1 Central Inventory & Direct Booking Engine
- Multi-property search with date pickers, adult/child counts, and filter by amenities (views, accessibility, pet-friendly).
- Real-time room availability across room types (e.g. Standard King, Deluxe Mountain View, Luxury Suite).
- Multi-room, multi-night cart checkout flow with promo code support, rate-plan selection (Standard, Non-Refundable, Member), and optional instant guest profile creation.
- Self-service booking lookup, modification, and cancellation based on policy rules.

### 4.2 Property Management Core (PMS)
- Real-time Room Status Grid (Clean, Dirty, Inspected, Out of Order) color-coded by floor and building.
- Front Desk Check-in / Check-out flows with automated room key allocation and passport/ID recording.
- Guest Profile & Central CRM tracking past stays across all 6 properties, VIP tags, preferences, and special occasions (birthdays, anniversaries).
- Live Guest Folio: Running itemized bill for room rate, taxes, resort fees, minibar, parking, dining, with 1-click tokenized payment capture and print-friendly receipt generation.

### 4.3 Staff Operations, Housekeeping & Maintenance
- Drag-and-drop daily housekeeping assignment board by room and attendant.
- One-tap status updates optimized for shared tablets with offline-resilient UI and instant bilingual (English / Spanish) toggle.
- Maintenance Ticketing with priority tags (Low, Medium, Urgent, Emergency), room assignment, photo attachments, and permanent "Room Quirks / Tribal Knowledge" logs (e.g., Room 214 radiator bleeding schedule).
- GM Shift Checklist and property-wide staff announcement broadcast.

### 4.4 Guest Mobile Portal (PWA / Mobile Web)
- Contactless mobile check-in with digital guest registration.
- Digital Key Simulator (Bluetooth Low Energy unlock animation for Salto / Assa Abloy locks).
- In-stay service requests: Extra towels, late checkout request, maintenance dispatch, concierge messaging.
- Property Local Guide: curated dining, mountain conditions, and trail recommendations.
- Post-stay 1-tap feedback survey.

### 4.5 Revenue Management & Channel Manager
- Dynamic pricing recommendation engine: calculates optimal rate adjustments based on occupancy velocity, day of week, seasonal curves, and local events.
- Competitor rate comparison view.
- 2-way OTA Channel Manager Simulator with live push/pull logs for Expedia, Booking.com, Airbnb, and Google Hotel Ads with automatic inventory decrementing to prevent double bookings.
- Consolidated Group Analytics: ADR (Average Daily Rate), RevPAR (Revenue per Available Room), Occupancy %, Booking Pace vs Last Year, and downloadable CSV exports.

### 4.6 Loyalty Program ("Lumen Elite")
- Tiered loyalty program (Silver, Gold, Platinum) with automatic points calculation (10 pts per $1 spent).
- Tier perks: automatic room upgrade flags, complimentary late checkout, welcome amenity dispatch.
- Exclusive Member Rate plans automatically unlocked upon sign-in.

---

## 5. Implementation Roadmap & Milestones

### Milestone Breakdown:

- **Milestone 1 (MVP — Core Multi-Property PMS & Booking Engine):**
  - Project structure (`client/`, `server/`, `shared/`), Drizzle ORM schema, SQLite DB setup.
  - Comprehensive seed data for all 6 properties (rooms, rates, amenities, photos, initial reservations).
  - Direct Booking Engine with multi-property search, room selection, promo codes, rate plans, and checkout.
  - Front-desk PMS core: Room grid, Check-in / Check-out modal, Guest Profiles, Folio Manager with billing and printable invoice.
  - Role & Property switcher bar for seamless testing.

- **Milestone 2 (Staff Operations & Real-Time Housekeeping/Maintenance):**
  - WebSocket real-time event pipeline for room updates.
  - Housekeeping drag-and-drop board & room attendant mobile view.
  - English / Spanish instant localization toggle.
  - Maintenance ticketing system with photo upload & room quirk / history log.
  - GM shift checklist & property broadcast notice.

- **Milestone 3 (Guest Mobile Experience & Digital Key):**
  - Responsive Guest PWA / Portal with dynamic property branding.
  - Contactless check-in flow with digital ID capture.
  - Salto / Assa Abloy Digital Key BLE unlock simulator.
  - In-stay service request hub (towels, late checkout, concierge chat).
  - Curated local destination guides per property.

- **Milestone 4 (Revenue Management & OTA Channel Sync):**
  - Dynamic pricing engine with occupancy pace algorithms.
  - Competitor rate comparison board.
  - 2-way OTA Channel Manager simulator (Expedia, Booking.com, Airbnb, Google Hotel Ads) with live sync ledger.
  - Overbooking prevention & walk resolution workflows.

- **Milestone 5 (Loyalty Program, Ownership Analytics & System Polish):**
  - Lumen Elite Loyalty Tiering & Points Engine with Member Rates.
  - Group-wide executive dashboard with RevPAR, ADR, Occupancy, Pace charts, and CSV exports.
  - AI Weekly Executive Summary digest generator.
  - Performance audit, security review, and end-to-end verification.

---

## 6. Success Metrics & Verification Criteria

1. **Multi-Property Integrity:** Switching properties updates all room numbers, rates, staff, branding, and folios instantly with zero cross-tenant data leakage.
2. **Double-Booking Prevention:** Central inventory locks rooms immediately upon reservation, reflecting across front-desk and simulated OTA feeds in real-time.
3. **Operational Speed:** Front desk agent can complete a guest check-in, allocate room key, and open a folio in under 3 clicks.
4. **Design Excellence:** Guest interfaces evoke a warm, boutique, luxury hospitality feel with custom typography, bespoke color schemes, and fluid responsive design.
