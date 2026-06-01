# YantraSetu Repository Suggestions

This document summarizes security/rate-limiting findings, backend and UI improvement opportunities, current issues, and product feature ideas based on a static review of the YantraSetu backend and React application.

## 1. Security and Rate-Limiting Vulnerabilities

### Critical / High Priority

1. **Clients can self-assign privileged account types during registration and profile updates.**
   - `register` accepts `userType` directly from the request body and stores it without restricting allowed public roles. This can let a user register as `admin` or `super_admin` if model validation permits the value.
   - The account-upgrade UI also sends `userType` to `authApi.updateProfile`, and backend profile update should be checked to ensure users cannot promote themselves to seller/admin roles without verification.
   - Recommendation: Only allow safe public roles at registration (`individual`, possibly `operator`/`mechanic` pending verification), force account upgrades through a review workflow, and restrict `admin`/`super_admin` changes to admin-only endpoints with audit logs.

2. **JWT access and refresh tokens are bearer tokens stored in `localStorage`.**
   - The frontend stores `ys_token` and `ys_refresh_token` in `localStorage`, which exposes them to any successful XSS payload.
   - Recommendation: Move refresh tokens to `HttpOnly`, `Secure`, `SameSite=Lax/Strict` cookies, keep access tokens short-lived, add CSRF protection for cookie-backed auth, and rotate refresh tokens with server-side reuse detection.

3. **Refresh tokens are stateless and not revocable.**
   - The refresh-token endpoint accepts any valid signed refresh token and immediately issues a new token pair. There is no server-side token family, token hash, device/session table, logout invalidation, or reuse detection.
   - Recommendation: Store hashed refresh tokens or session IDs, rotate on every refresh, revoke previous tokens, invalidate all tokens on password change, and add a logout endpoint.

4. **OTP generation uses `Math.random()` and logs OTP values.**
   - OTPs are generated with `Math.random()`, which is not cryptographically secure, and the OTP is logged to the console. In non-production mode it is also returned to the client.
   - Recommendation: Use `crypto.randomInt(100000, 1000000)`, remove OTP logging in shared environments, integrate SMS/email providers, and gate any demo OTP response behind an explicit `ALLOW_DEV_OTP_RESPONSE=true` flag.

5. **User enumeration exists in registration, OTP, and password login flows.**
   - Registration returns distinct “phone already registered” / “email already registered” responses, OTP returns “user not found,” and login validates phone format before looking up users.
   - Recommendation: For public auth flows, return generic responses where possible, add server-side audit events, and use progressive friction (CAPTCHA, cooldowns) for suspicious patterns.

6. **Password policy is weaker than the UI suggests and lacks breach checks.**
   - Backend requires only eight characters with a letter and number; the register UI placeholder still says “Min 6 characters,” causing inconsistent user expectations.
   - Recommendation: Align UI and API, require stronger password rules or passphrases, check against breached-password datasets, and consider optional MFA.

7. **CSP allows `unsafe-inline` scripts/styles.**
   - Helmet is configured with inline script/style allowances, which weakens XSS protection.
   - Recommendation: Use nonces/hashes for inline scripts, remove `unsafe-inline` where possible, and review third-party script needs.

8. **Uploads/base64 images and document payloads are accepted through JSON without deep validation.**
   - Listing creation allows large JSON payloads and passes `images` and `documentImages` through to the database. The sanitizer intentionally skips image fields, and there is no server-side MIME sniffing, image transcoding, malware scanning, pixel dimension limit, or total per-listing media limit visible in the controller.
   - Recommendation: Move uploads to object storage with signed URLs, validate file type via magic bytes, transcode images, strip metadata, virus-scan documents, and enforce total media count/size limits server-side.

9. **Public static `/uploads` has no obvious access controls or cache/security policy.**
   - Uploaded files are served directly from `/uploads` if present. Sensitive documents should not be public static files.
   - Recommendation: Separate public marketing/listing images from private verification documents; use signed URLs for private assets and strict content-disposition/content-type headers.

10. **Database schema synchronization runs at app startup in production-like code.**
    - The server uses `sequelize.sync({ alter: true })` for non-SQLite databases and falls back to `sync()`. Automatic schema alteration at startup can cause data loss, lock contention, and unreviewed production migrations.
    - Recommendation: Disable auto-sync in production and use explicit migrations with rollback plans.

11. **Raw SQL literals interpolate numeric query parameters after `parseFloat` but without strict finite/range validation.**
    - Location sorting inserts `latFloat` and `lngFloat` into SQL literals. `parseFloat` can produce `NaN`, `Infinity`, or out-of-range coordinates.
    - Recommendation: Validate latitude/longitude/radius with finite-number checks and allowed ranges before building distance expressions.

12. **Booking double-booking prevention is race-prone.**
    - The booking controller checks for overlapping bookings and then inserts a booking outside a transaction or lock. Concurrent requests can pass the check and create overlapping bookings.
    - Recommendation: Use a DB transaction with row-level/advisory locks, exclusion constraints where supported, or a serialized booking creation queue per listing.

13. **Admin UI is reachable by any authenticated user before API calls fail.**
    - The UI calculates `isAdmin`, but initial data loading only checks `isAuthenticated`. Non-admin users can hit admin endpoints from the admin page and see error states rather than being routed away.
    - Recommendation: Add route guards that check admin role before loading admin data, show a proper 403 page, and keep server-side `requireAdmin` as the source of truth.

14. **Unauthenticated high-compute/public endpoints have only the broad general limiter.**
    - Public endpoints such as ML estimation, equipment health, market trends, fleet optimization, analytics tracking, newsletter subscription, enquiry submission, and listing detail view increments can be automated under the general IP limit.
    - Recommendation: Add endpoint-specific limiters for expensive/abusable public endpoints, CAPTCHA or proof-of-work for lead/enquiry/newsletter flows, and per-identity/per-phone/per-email quotas where applicable.

15. **Rate limiting is likely not proxy-aware unless Express `trust proxy` is configured by deployment.**
    - Limiters key by `req.ip`, but the server does not set `app.set('trust proxy', ...)`. Behind a load balancer, this can either collapse all traffic to a proxy IP or make limits unreliable depending on infrastructure.
    - Recommendation: Configure `trust proxy` explicitly for known proxy hops, validate `X-Forwarded-For` handling, and use a shared Redis-backed rate-limit store in multi-instance deployments.

### Medium Priority

16. **Rate limits use the default in-memory store.**
    - `express-rate-limit` without an external store does not share counters across app instances and resets on restart.
    - Recommendation: Use Redis/Valkey for distributed rate limiting and include per-user and per-resource dimensions for authenticated routes.

17. **The refresh-token endpoint is not protected by the auth limiter.**
    - `/auth/refresh-token` has no route-level limiter and only receives the global limiter.
    - Recommendation: Add a dedicated refresh-token limiter keyed by IP and refresh-token/session fingerprint.

18. **Chat creation has no route-level rate limiter.**
    - Sending chat messages is limited, but starting chats is not. Attackers can create many chat records/notifications.
    - Recommendation: Add a chat-start limiter and block duplicate/inactive spam patterns.

19. **Booking creation, fraud reports, certifications, profile upgrades, newsletter subscriptions, enquiries, analytics tracking, and ML endpoints need granular quotas.**
    - Several state-changing or write-heavy endpoints lack dedicated throttles.
    - Recommendation: Add endpoint-specific limiters and abuse heuristics for each write surface.

20. **Sort fields are accepted from query parameters without visible allowlists.**
    - Machinery and parts list endpoints pass `sortBy`/`sortOrder` into Sequelize `order`. This can cause SQL errors, unexpected columns, or potential ORM-specific injection surfaces.
    - Recommendation: Map allowed sort keys to known model columns and normalize sort direction to `ASC`/`DESC` only.

21. **Public list/detail APIs include contact information in some responses.**
    - Parts and booking includes expose user phone numbers in responses. Ensure this is intentional and gated behind authentication/authorization where needed.
    - Recommendation: Mask phone numbers by default, reveal contact details only after authenticated enquiry/booking/chat initiation, and log contact reveals.

22. **Input sanitizer is not a complete validation layer.**
    - The sanitizer strips HTML with regex and trims strings, but controllers still need schema validation for each route. Some fields skip sanitization, and errors in sanitization call `next()` instead of failing closed.
    - Recommendation: Add Zod/Joi/express-validator schemas per endpoint; validate types, enum values, ranges, object shapes, and array lengths before controllers run.

23. **Error responses can disclose implementation details.**
    - Several controllers return `error.message` to clients on 500 responses.
    - Recommendation: Return generic errors to clients in production and log structured details server-side with request IDs.

24. **Admin role changes need stronger controls.**
    - Admin endpoints can change roles. Ensure only `super_admin` can grant/revoke admin roles, require re-authentication/MFA for role changes, and prevent self-demotion/privilege escalation mistakes.

25. **Activity/analytics endpoints may collect IP/user-agent data without retention controls.**
    - View tracking logs IP address and user agent.
    - Recommendation: Add privacy policy alignment, retention limits, anonymization where possible, and consent handling for analytics.

26. **No obvious CSRF strategy for future cookie-based auth.**
    - Current bearer-token flow avoids classic cookie CSRF, but if tokens move to cookies, CSRF protection must be introduced.

27. **No visible request ID/correlation ID middleware.**
    - Troubleshooting and abuse investigations are harder without request IDs propagated to logs and client errors.

28. **No dependency audit policy is documented.**
    - Both backend and app use many dependencies. Security scanning should be automated.
    - Recommendation: Add `npm audit --omit=dev`, Dependabot/Renovate, SCA in CI, and a patch SLA.

## 2. Backend Improvements and Current Issues

### Backend Issues Found

1. **`rateLimit` is imported in `server.js` but unused.**
   - Remove unused imports to keep code clean and avoid confusion.

2. **`mlController.workEstimate` returns a function in JSON for `confidence`.**
   - The response sets `confidence: listings => ...`; functions are not serializable and will be omitted or behave unexpectedly. It should compute confidence from available unit counts or sample size.

3. **`TRANSITIONS` includes `disputed: { resolved: 'admin' }`, but `canTransition` never supports the `admin` role.**
   - Disputed bookings cannot be resolved by admins through this state machine unless additional code handles it elsewhere.

4. **Admin page uses APIs for all authenticated users instead of checking `isAdmin` before data loading.**
   - Backend guards are present, but frontend UX should avoid unnecessary failing requests.

5. **`UpgradeAccountPage` destructures `setAuthState` from `useAuth()`, but the context type does not expose it.**
   - This is a TypeScript/runtime issue and may break the upgrade flow.

6. **Registration UI says “Min 6 characters,” while backend requires eight characters plus a letter and a number.**
   - Align text and validation for better UX and fewer failed submissions.

7. **`sequelize.sync({ alter: true })` is risky outside local development.**
   - Use migrations instead of auto-altering production schemas.

8. **Newsletter route creates a table inline and uses SQLite-specific SQL.**
   - `INTEGER PRIMARY KEY AUTOINCREMENT` and `INSERT OR IGNORE` are SQLite-specific and conflict with the app’s PostgreSQL production direction.
   - Move this to a Sequelize model and migration with dialect-neutral logic.

9. **Several endpoints lack consistent pagination helpers.**
   - Chat has local pagination logic; reviews parse `limit` directly; some list endpoints use the helper. Standardize on `parsePagination` everywhere.

10. **Many controllers return raw model objects.**
    - Raw Sequelize models may expose fields unintentionally when models evolve.
    - Add response DTO serializers for users, listings, bookings, reviews, and admin views.

11. **No explicit OpenAPI schema appears to be generated from route validation.**
    - API docs exist, but route contracts and validation can drift.
    - Add OpenAPI generation from schemas or tests that assert docs match implementation.

12. **Mixed demo/prod behavior remains in runtime paths.**
    - Examples include returning OTP in non-production and inline newsletter table creation.
    - Isolate demo-only code behind explicit feature flags.

13. **Search uses multiple `%LIKE%` queries that may not scale.**
    - Add full-text search, trigram indexes, or a dedicated search service for machinery/parts.

14. **No background job queue is visible.**
    - Notifications, SMS/email sending, image processing, analytics aggregation, and fraud checks should be moved off request paths.

15. **No obvious idempotency keys for booking/payment-like flows.**
    - Retry behavior can create duplicate bookings or duplicate subscription actions.

16. **No payment/escrow integration hardening is visible.**
    - Subscription and booking financial flows should use provider webhooks, signed event verification, idempotency, ledger records, and reconciliation.

17. **Model field validation is uneven.**
    - Add database constraints and model validators for price ranges, years, status enums, dates, image counts, phone numbers, GST format, pincode, coordinates, and required fields per listing type.

18. **Insufficient authorization granularity in business flows.**
    - Listing creation is available to any authenticated user on the backend, while the UI restricts seller roles. Backend should enforce seller role/account-tier eligibility too.

19. **No visible automated tests for many critical controllers.**
    - Existing tests cover middleware/env/ML, but booking races, auth edge cases, role escalation, admin routes, listing ownership, refresh-token rotation, and OTP attempt limits need coverage.

20. **Logs may contain sensitive data.**
    - OTPs and potentially request errors are logged. Add PII redaction and structured logging.

### Backend Improvement Recommendations

- Add centralized schema validation for every route using Zod/Joi/express-validator and generate OpenAPI from schemas.
- Split route modules by domain (`auth`, `machinery`, `bookings`, `admin`, `analytics`) instead of one large `routes/index.js`.
- Add service layers for business logic so controllers stay thin and testable.
- Add transaction boundaries for bookings, subscriptions, role changes, listing approvals, and review/rating updates.
- Add request-scoped context: request ID, authenticated user ID, IP, user-agent, and audit metadata.
- Add production-grade rate limiting: Redis store, per-IP + per-user keys, endpoint categories, and adaptive blocking.
- Add a permission matrix and policy helpers (`canCreateListing`, `canApproveListing`, `canViewBooking`, etc.).
- Add a notification queue and delivery preferences for SMS, email, WhatsApp, and in-app notifications.
- Add image/document processing pipeline with object storage, signed URLs, AV scanning, and metadata stripping.
- Add observability: metrics, structured logs, error tracking, database slow-query logging, and health/readiness probes.
- Add CI checks: lint, tests, audit, type checks, migration checks, and Docker build.
- Add seed-data isolation so demo data cannot be accidentally run in production.
- Add data-retention and anonymization jobs for logs/analytics/OTP/session data.

## 3. UI Improvements and Current Issues

### UI Issues Found

1. **Missing route guards at router level.**
   - Protected pages manually redirect inside each component, which causes duplication and inconsistent behavior.
   - Add `ProtectedRoute` and `RoleRoute` wrappers in the router.

2. **Admin page loads admin APIs before checking admin role.**
   - Non-admin users should see a clean 403 page and avoid unnecessary API calls.

3. **Account upgrade page references `setAuthState`, which is not exposed by the auth context.**
   - Fix by exposing a safe `refreshUser()` call after profile update or adding a typed context method such as `setUser`.

4. **Password text mismatch.**
   - Registration UI says “Min 6 characters,” while API requires at least eight characters plus a letter and number.

5. **Tokens in `localStorage`.**
   - This is a security issue but also a UI architecture issue. Move to safer auth handling with refresh cookies.

6. **Create listing page requests geolocation on mount.**
   - This may surprise users and trigger browser permission prompts before they understand why location is needed.
   - Ask only after the user clicks “Use my location.”

7. **Large base64 image/document previews are kept in React state and sent in JSON.**
   - This increases memory usage and request size, especially on mobile devices.
   - Use object URLs for preview and upload files via multipart/signed URLs.

8. **No visible centralized form validation layer.**
   - Many forms rely on local checks. Use `react-hook-form` + Zod consistently.

9. **Inconsistent loading/error/empty states.**
   - Admin, listing, booking, and marketplace pages should use a consistent design system for skeletons, retries, and empty states.

10. **No accessibility audit is visible.**
    - Review color contrast, focus outlines, keyboard navigation, dialog labels, ARIA attributes, and reduced-motion handling.

11. **No global API error strategy.**
    - Token refresh is centralized, but user-facing toasts, 403 handling, offline messages, and retry behavior should also be centralized.

12. **Potential overuse of inline styles.**
    - Several components contain repeated inline font/color styles, making design changes harder.

13. **Potential bundle size concerns.**
    - The app has many heavy UI/animation dependencies. Lazy routes help, but charts/animations/maps should be analyzed with a bundle visualizer.

14. **No visible E2E tests.**
    - Critical user journeys like register/login, create listing, browse/search, booking, chat, admin approval, and subscription should have Playwright/Cypress tests.

15. **No screenshot/regression workflow is documented.**
    - Add visual regression for core pages and key responsive breakpoints.

### UI Improvement Recommendations

- Introduce router-level route protection and role-based route guards.
- Create a shared form toolkit using `react-hook-form`, Zod schemas, field error components, and submit-state handling.
- Replace `localStorage` tokens with cookie-backed refresh auth and in-memory access tokens.
- Add a global error boundary plus API error/toast mapping for 401, 403, 409, 429, and 500 responses.
- Add mobile-first improvements: sticky contact/booking CTA, compressed cards, thumb-friendly filters, and offline-friendly saved searches.
- Add clearer verification badges for equipment, sellers, operators, and mechanics.
- Add skeleton loaders and empty states for every data-driven page.
- Add accessible modals, keyboard navigation checks, skip links, and reduced-motion support for animation-heavy sections.
- Add a design-token layer for colors, typography, spacing, and shadows.
- Add SEO metadata per route and social sharing previews for listing detail pages.
- Add image optimization: responsive image sizes, lazy loading, blur placeholders, and CDN-ready URLs.
- Add analytics event naming conventions and privacy-aware consent controls.
- Add PWA enhancements for saved listings, offline browsing history, and push notifications.
- Add bundle-size monitoring and remove unused dependencies/components.

## 4. Suggested New Application Features

### Marketplace Trust and Safety

1. **Verified seller/KYC workflow** with GST/PAN/Aadhaar/business-document verification and tiered trust badges.
2. **Equipment inspection marketplace** where certified inspectors upload standardized reports, photos, videos, and condition scores.
3. **Escrow and milestone payments** for rentals, deposits, and high-value purchases.
4. **Fraud-risk scoring** for listings, sellers, and suspicious messages using rules plus ML.
5. **Ownership and lien checks** for financed/heavy machinery assets.
6. **Dispute resolution center** with evidence uploads, timeline, mediation, and admin decision tracking.
7. **Safety compliance badges** for operators, mechanics, machine certification, and insurance.

### Rental and Fleet Operations

8. **Real-time availability calendar** with owner-controlled blackout dates and booking approvals.
9. **Dynamic rental pricing** based on demand, city, season, availability, machine age, and utilization.
10. **Fleet owner dashboard** showing utilization, revenue, upcoming maintenance, idle assets, and lead funnel.
11. **Telematics integration** for GPS, engine hours, fuel usage, geofencing, and unauthorized movement alerts.
12. **Maintenance scheduler** with service reminders, mechanic booking, spare parts recommendations, and service history.
13. **Operator matching** bundled with machine rentals, including skills, certificates, languages, and ratings.
14. **Transport/logistics booking** for equipment movement with route planning and oversized-load requirements.
15. **Rental contract generation and e-signing** with configurable clauses, deposits, insurance, and late fees.

### Buyer/Seller Experience

16. **Saved searches and price alerts** for equipment categories, locations, and budgets.
17. **Advanced comparison tool** for machines by price, year, hours, condition, owner rating, and estimated operating cost.
18. **AI listing assistant** that improves titles, descriptions, photos, price suggestions, and SEO score before submission.
19. **AR/360-degree machine views** or guided photo checklist for sellers.
20. **Lead management CRM** for sellers with lead scoring, reminders, call notes, and conversion tracking.
21. **Negotiation/offers module** with counteroffers, expiry, and accepted-offer workflows.
22. **Watchlist and recently viewed listings** synchronized across devices.
23. **Verified contact reveal flow** to reduce spam and improve lead quality.

### Financing, Insurance, and Services

24. **Loan pre-approval integration** with NBFC/bank partners and EMI calculators.
25. **Insurance quote marketplace** for rentals, transit, theft, damage, and third-party liability.
26. **Warranty and AMC marketplace** for used machinery and spare parts.
27. **Spare parts compatibility engine** based on make/model/year and OEM part numbers.
28. **Mechanic dispatch and emergency repair** with SLA, location tracking, and upfront estimates.
29. **Fuel and consumables marketplace** for job-site operations.

### Analytics and Intelligence

30. **Market price index by category/city** with historical trends and forecast confidence.
31. **Demand heatmaps** for rentals and sales across Indian states/cities.
32. **Seller performance analytics** including listing views, enquiries, conversion rate, response time, and pricing competitiveness.
33. **Project cost estimator** that combines rental, operator, fuel, logistics, tax, and contingency costs.
34. **Residual value/depreciation forecast** for purchase decisions.
35. **Procurement recommendation engine** for contractors based on project type, region, and timeline.

### Community and Content

36. **Operator/mechanic job board** with verified skill tests and employer reviews.
37. **Training and certification portal** for safety, machine operation, and maintenance.
38. **Owner community forum** for maintenance tips, machine comparisons, and local vendor recommendations.
39. **Regional language support** for Hindi and major Indian languages, with localized search synonyms.
40. **Knowledge center** with buying guides, rental checklists, inspection templates, GST/tax explainers, and safety content.

## 5. Recommended Implementation Roadmap

### Immediate Hardening (1–2 weeks)

- Block public self-assignment of `admin`/`super_admin` and enforce backend seller eligibility for listing creation.
- Add route-level limiters for refresh tokens, enquiries, bookings, newsletter, chat creation, analytics tracking, and ML endpoints.
- Replace OTP generation with `crypto.randomInt`, remove OTP logging, and add generic OTP responses.
- Add strict query allowlists for sorting and numeric validation for coordinates/radius.
- Fix the `UpgradeAccountPage` auth-context issue and password placeholder mismatch.
- Add production-safe error responses and remove raw `error.message` from client-facing 500s.

### Foundation Improvements (1 month)

- Add schema validation for all endpoints and generate OpenAPI docs.
- Move refresh token/session state server-side and add logout/revoke flows.
- Replace startup schema sync with migrations.
- Move media uploads to signed object storage with validation/scanning.
- Add Redis-backed rate limiting and request IDs.
- Add tests for auth, booking, listing authorization, admin permissions, and rate limits.

### Product Expansion (2–3 months)

- Launch verified seller/KYC, inspection reports, saved searches, lead CRM, and availability calendar.
- Add escrow/payment provider integration with webhook verification and ledger records.
- Add seller analytics, price alerts, dynamic pricing suggestions, and maintenance reminders.
- Add PWA/offline improvements and localized language support.

### Scale and Trust (3–6 months)

- Add telematics integrations, logistics booking, dispute center, fraud scoring, and financing/insurance partners.
- Add search infrastructure, recommendation ranking, and market intelligence dashboards.
- Add visual regression, E2E coverage, SLOs, observability dashboards, and incident response runbooks.
