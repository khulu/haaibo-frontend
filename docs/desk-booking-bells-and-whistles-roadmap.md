# Desk Booking SaaS Bells and Whistles Roadmap

This roadmap converts the currently-unchecked expansion checklist into an execution plan.

## Assumptions

- Current strengths already in place include floorplan-based reservations, QR check-in, reservation exports, bulk imports, and tenant branding controls.
- Existing role model is fixed (SuperAdmin/Admin/Security/Employee), and no public integration platform is exposed yet.
- Effort estimates are for end-to-end delivery (frontend, backend, QA, rollout) and assume a small cross-functional team.

## Prioritization Framework

- Priority signal: revenue impact + enterprise deal unblock + engineering dependency chain.
- Effort scale: S (1-2 weeks), M (2-5 weeks), L (5-10 weeks), XL (10+ weeks).
- Confidence: High means straightforward from existing architecture, Medium means backend and policy ambiguity, Low means large unknowns.

## NOW (0-90 days)

Goal: close enterprise blockers and improve product maturity for near-term sales.

### 1) Enterprise Identity and Access

- Deliverables:
  - SSO/SAML (Okta, Entra ID/Azure AD, Google Workspace) for login.
  - SCIM user/group provisioning and deprovisioning.
  - Granular custom roles and permission matrix beyond the fixed role enum.
- Effort: XL
- Confidence: Medium
- Dependencies:
  - Identity provider metadata handling and certificate rotation.
  - Centralized authorization middleware and per-feature permission checks.
- Why now:
  - Biggest enterprise procurement blocker.

### 2) Full Exportable Audit Log

- Deliverables:
  - Immutable audit trail for auth events, booking lifecycle, policy changes, admin actions.
  - Search/filter UI and CSV export.
  - Tenant-scoped retention policy.
- Effort: M
- Confidence: High
- Dependencies:
  - Standard event schema and actor/resource model.
  - Write-once logging pipeline.
- Why now:
  - Common security/legal requirement in procurement.

### 3) Trust and Compliance Surface (customer-visible)

- Deliverables:
  - Public security page and DPA template.
  - SOC 2/ISO status page (in progress, milestones, controls summary).
  - Pen-test cadence policy and reporting summary process.
- Effort: S-M (engineering) + GRC/legal track
- Confidence: Medium
- Dependencies:
  - Security/legal content owners.
  - Basic document publishing workflow.
- Why now:
  - Removes objection loops in security review.

### 4) Guided Admin Onboarding and Setup Checklist

- Deliverables:
  - First-run wizard (locations, floorplan import, marker placement, team setup, policy setup).
  - Progress checklist and completion state.
  - Contextual upgrade prompts where capabilities are plan-gated.
- Effort: M
- Confidence: High
- Dependencies:
  - Tenant setup state model and onboarding progress API.
- Why now:
  - Faster activation and lower implementation burden.

### 5) In-App Billing Foundation

- Deliverables:
  - Tiered plans and seat/license metering (including hot-desk licenses and location caps).
  - Checkout, subscription status pages, invoice history, failed-payment retries (dunning basics).
- Effort: L
- Confidence: Medium
- Dependencies:
  - Payment provider integration (Stripe or equivalent).
  - Tenant entitlement service and feature flag linkage.
- Why now:
  - Unlocks self-serve and clean enterprise expansions.

## NEXT (3-6 months)

Goal: increase differentiation through automation and platform extensibility.

### 6) Public Platform Layer

- Deliverables:
  - Public REST API docs (OpenAPI) for bookings, check-ins, users, locations, resources.
  - Webhooks for booking/check-in/check-out/cancel events.
  - API keys, webhook secret signing, replay protection.
- Effort: L
- Confidence: Medium
- Dependencies:
  - Audit log/event model from NOW.
  - Rate limiting and API versioning strategy.
- Why next:
  - Enables integrations and partner ecosystem.

### 7) Occupancy Intelligence v1

- Deliverables:
  - Predictive no-show detection and auto-release policy engine.
  - Policy-abuse detection (serial no-shows, hoarding) with admin alerts.
  - Plain-English occupancy and utilization summaries.
- Effort: L
- Confidence: Medium
- Dependencies:
  - Reliable event data and policy execution safeguards.
  - Explainability for policy actions.
- Why next:
  - High differentiation while leveraging existing reservation/check-in data.

### 8) Team Attendance and Engagement Basics

- Deliverables:
  - Who-is-in-today team visibility.
  - Weekly attendance digest and nudge emails.
  - In-app announcements/news feed.
- Effort: M
- Confidence: High
- Dependencies:
  - Notification/event delivery service.
  - Team membership model consistency.
- Why next:
  - Improves habitual use and manager value.

### 9) Data and Reporting Expansion

- Deliverables:
  - Custom report builder with scheduled exports.
  - BI connectors starter pack (Power BI first, then Tableau/Looker).
- Effort: L
- Confidence: Medium
- Dependencies:
  - Stable analytics schema and tenant-safe extract endpoints.
- Why next:
  - Expands value to operations and leadership stakeholders.

## LATER (6-12+ months)

Goal: defensibility and ecosystem depth.

### 10) Conversational Booking and Recommendations

- Deliverables:
  - Natural-language booking in Slack/Teams.
  - Smart recommendations for desks/rooms and suggested in-office days.
- Effort: XL
- Confidence: Medium-Low
- Dependencies:
  - Platform APIs/webhooks from NEXT.
  - Preference model and team graph.
  - Guardrails for ambiguous intents.
- Why later:
  - High upside, but depends on platform and data maturity.

### 11) Real-time IoT and Building Integrations

- Deliverables:
  - Sensor-backed live occupancy.
  - Occupied-but-unbooked detection on map.
  - Optional HVAC/lighting occupancy tie-ins.
- Effort: XL
- Confidence: Low
- Dependencies:
  - Hardware standards, site deployment model, facilities integrations.
- Why later:
  - Significant operational complexity and partner coordination.

### 12) Global/Enterprise Scale Features

- Deliverables:
  - Data residency choice (EU/US).
  - SLA tiering and public uptime status page.
  - Sandbox environments for integrators.
  - Multi-language and multi-currency billing.
  - Native iOS/Android apps and push notifications.
- Effort: XL
- Confidence: Medium-Low
- Dependencies:
  - Platform and billing maturity.
  - Multi-region infra and support model.
- Why later:
  - Scale-phase multipliers after core enterprise and platform are proven.

## Suggested Delivery Sequence (Dependency-aware)

1. SSO/SAML + SCIM + RBAC expansion
2. Audit log + compliance surface
3. Onboarding wizard + setup checklist
4. Billing foundation + entitlements
5. Public API + webhooks
6. Occupancy intelligence and policy automation
7. Engagement and reporting expansions
8. AI assistants, IoT, and global scale features

## Success Metrics by Phase

- NOW:
  - Enterprise win-rate uplift on security/IT review stage.
  - Time-to-first-booking for new tenants.
  - Trial-to-paid conversion and admin setup completion rate.
- NEXT:
  - % of bookings created via integrations.
  - No-show rate reduction and auto-release recovery minutes.
  - Weekly active manager/admin rate.
- LATER:
  - Retention improvement for enterprise accounts.
  - Expansion revenue from add-ons and integrations.
  - Occupancy efficiency gains per tenant.

## Immediate Engineering Kickoff Backlog (first 4 sprints)

- Sprint 1:
  - Design auth/permission domain model and migration plan.
  - Define audit event schema and retention strategy.
- Sprint 2:
  - Implement SSO login flow and tenant IdP config screens.
  - Start audit event capture for booking and admin events.
- Sprint 3:
  - Implement SCIM user lifecycle endpoints.
  - Ship audit log UI with filters and CSV export.
- Sprint 4:
  - Add onboarding wizard for first tenant setup.
  - Add billing provider integration skeleton and entitlement checks.
