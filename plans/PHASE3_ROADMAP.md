# PHASE 3 ARCHITECTURAL ROADMAP — Revolutions Automotive

**Document Path:** `plans/PHASE3_ROADMAP.md`  
**Architect:** Gemini 4 Argon (Architect Mode)  
**Client:** Revolutions Automotive — 1-15A Fisherman Dr, Brampton, ON L7A 1B7 | (905) 846-8351  
**Baseline State:** Phases 1 & 2 Complete — `148 / 148` headless Node assertions passing (`node test_revolutions.js`)  
**Target State:** Phase 3 Complete — `195+ / 195+` headless Node assertions passing, zero weakened/removed tests, 100% DOM selector anti-drift parity.

---

## STAGE 1: CONTEXT MAP & BASELINE INVENTORY

### 1.1 Business & Jurisdiction Context
- **Entity:** Revolutions Automotive (Midas-style retail automotive service, estimator, diagnostic & appointment platform)
- **Address:** 1-15A Fisherman Dr, Brampton, ON L7A 1B7, Canada (`43.7196, -79.7946`)
- **Phone:** `(905) 846-8351` (last 4 digits `8351` serve as the default Owner Config PIN)
- **Jurisdiction & Financial Rules:** Ontario, Canada — `CAD` currency, `13%` HST (`0.13`), base shop labor rate `$130.00 CAD/hr`, shop supplies `5%` of labor capped at `$35.00 CAD`.
- **Core Specialties:** Auto repairs, preventive maintenance, A/C service (`R134a` & `R1234yf`), synthetic & conventional oil changes, computer diagnostics & repair, tune-ups, 4-wheel laser alignments, brake services, tires (sales, mounting, balancing, seasonal swaps), suspension & steering, exhaust systems, Ontario Safety Standards Certificates (`MTO SSC`) for domestic & import vehicles.

### 1.2 Existing Architecture & Test Baseline (Phases 1–2)
| File | Role | Current State |
| :--- | :--- | :--- |
| `revolutions_engine.js` | Pure ES6+ dual UMD engine (`window.RevolutionsEngine` / `module.exports`) | Exports `SHOP_INFO`, `VEHICLE_MULTIPLIERS`, `SERVICE_CATALOG` (12 services), `COUPON_CATALOG` (5 coupons), `calculateEstimate`, `validateBooking`, `recommendServicesBySymptoms`, `DIAGNOSTIC_DECISION_TREE` (5 branches, 33 terminals), `MTO_SSC_CHECKLIST_ITEMS` (11 items, weight sum 100), `WORK_ORDER_STATES` (6 states), `SEED_WORK_ORDERS` (`REV-2048`, `REV-3105`, `REV-4092`), `evaluateDiagnosticWizard`, `evaluateSafetyPreCheck`, `lookupWorkOrder`, `createWorkOrder`. |
| `index.html` | Semantic HTML5 responsive shell | Contains Phase 1 (Hero, Service Catalog, Estimator, Coupon Wallet, Booking Modal/Form) and Phase 2 (Interactive Symptom Wizard, MTO SSC Pre-Check Calculator, Live Bay Work-Order Tracker). |
| `styles.css` | Midas industrial design system | Carbon-black (`#111315`), Midas gold (`#F5B800`), crimson alert (`#D92B2B`), safety green (`#1F9D55`), responsive grid, badges, gauge, 6-stage timeline. |
| `app.js` | Browser DOM controller | Wires Phase 1 + Phase 2 interactivity, appointment-to-tracker bridge, and `localStorage` persistence under `revolutions_automotive_state_v1`. |
| `test_revolutions.js` | Headless Node test runner | **148 assertions passing** (Phase 1: 91; Phase 2 Seg 1: 27; Phase 2 Seg 2: 15; Phase 2 Seg 3: 15). |

---

## STAGE 2: PHASE 3 ARCHITECTURAL BLUEPRINT

Phase 3 delivers four integrated production capabilities without external dependencies or build steps:
1. **Printable Midas Voucher Generator:** Deterministic `REV-VOUCH-XXXX` code generation, 30-day rolling expiration calculation, itemized CAD/HST breakdown, Ontario consumer disclaimer, modal preview, and `@media print` isolation of `#voucher-print-area`.
2. **Seasonal Tire & Rim Size Calculator:** Metric tire string parser (`parseTireSize`) and comparison engine (`compareTireSizes`) computing overall diameter, sidewall height, circumference, speedometer reading at actual 100 km/h, and a `±3.0%` diameter variance compliance rating (`"safe"` vs `"caution"`).
3. **LocalBusiness / AutoRepair JSON-LD SEO Schema:** Frozen `SEO_SCHEMA_DATA` constant in the engine and embedded `<script type="application/ld+json" id="seo-schema-json">` in `index.html` with Brampton geo-coordinates (`43.7196, -79.7946`), opening hours, and the 12-item OfferCatalog.
4. **Shop Owner Config Drawer & RFC-4180 CSV Lead Exporter:** PIN-protected (`8351` default via `validateOwnerPin`) drawer allowing live override of hourly labor rate, shop supplies cap, and promotional banner text (persisted in `revolutions_automotive_state_v1`), plus one-click RFC-4180 CSV export (`exportBookingsToCsv`) of all active work orders and bookings.

### Test-Count Trajectory
| Milestone | Cumulative Passing Tests | Delta | Scope |
| :--- | :--- | :--- | :--- |
| **Baseline (Phases 1–2)** | `148` | — | Engine + UI + Controller + Phase 1/2 Anti-Drift |
| **Phase 3 — Segment 1** | `173+` | `+25+` | Phase 3 Engine Constants & 5 Pure Functions |
| **Phase 3 — Segment 2** | `185+` | `+12+` | Phase 3 HTML5 DOM IDs, Print CSS & JSON-LD Schema |
| **Phase 3 — Segment 3** | `195+` | `+10+` | Phase 3 Controller Wiring, State Persistence & Full Anti-Drift |

---

## STAGE 3 & 4: SEGMENTED EXECUTION PLAN (3 SEGMENTS)

### Mandatory Execution Rules
- **File Limit:** Maximum 1–3 code files modified per segment.
- **Verification Gate:** Every segment terminates with `node test_revolutions.js` in a plain shell.
- **Zero Test Weakening:** None of the existing 148 tests in `test_revolutions.js` may be deleted, skipped, commented out, or loosened. All Phase 3 tests are strictly appended.
- **Shell Hygiene:** All commands must use relative parent paths with forward slashes, zero shell redirects, and zero shell variables.

---

### SEGMENT 1 — PHASE 3 ENGINE EXTENSIONS

#### 1. File Inventory (2 Files)
1. `revolutions_engine.js` (Modify: add 2 frozen constants and 5 pure functions; export them on `RevolutionsEngine`)
2. `test_revolutions.js` (Modify: append 25+ unit assertions for Segment 1 exports)

#### 2. Exact Data Schemas

##### 2.1 `TIER_CONFIG_DEFAULTS` (Deep-Frozen Constant)
```javascript
const TIER_CONFIG_DEFAULTS = deepFreeze({
  laborRatePerHour: 130.00,
  shopSuppliesRate: 0.05,
  shopSuppliesCap: 35.00,
  hstRate: 0.13,
  currency: "CAD",
  defaultOwnerPin: "8351",
  bannerText: "Seasonal Tire Swap & Ontario Safety (MTO SSC) Specials Active — Call (905) 846-8351",
  activeCoupons: COUPON_CATALOG.map(function (c) { return c.code; }) // ["SYNTH20", "BRAKE50", "ALIGN15", "ACFREE", "MTO10"]
});
```
- **Invariants:** `Object.isFrozen(TIER_CONFIG_DEFAULTS)` and `Object.isFrozen(TIER_CONFIG_DEFAULTS.activeCoupons)` must both be `true`. `laborRatePerHour === 130.00`, `shopSuppliesRate === 0.05`, `shopSuppliesCap === 35.00`, `defaultOwnerPin === "8351"`, `activeCoupons.length === 5`.

##### 2.2 `SEO_SCHEMA_DATA` (Deep-Frozen Schema.org `AutoRepair` Constant)
```javascript
const SEO_SCHEMA_DATA = deepFreeze({
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  "@id": "https://revolutionsautomotive.ca/#autorepair",
  name: "Revolutions Automotive",
  description: "Midas-style full-service auto repair, maintenance, computer diagnostics, 4-wheel laser alignments, brakes, tires, air conditioning (R134a & R1234yf), and Ontario Safety Standards Certificates (MTO SSC) in Brampton, ON.",
  telephone: "(905) 846-8351",
  priceRange: "$$",
  currenciesAccepted: "CAD",
  paymentAccepted: "Cash, Debit, Visa, Mastercard, American Express",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1-15A Fisherman Dr",
    addressLocality: "Brampton",
    addressRegion: "ON",
    postalCode: "L7A 1B7",
    addressCountry: "CA"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.7196,
    longitude: -79.7946
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "08:30",
      closes: "15:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday"],
      opens: "00:00",
      closes: "00:00"
    }
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Revolutions Automotive Service Catalog",
    itemListElement: SERVICE_CATALOG.map(function (service) {
      return {
        "@type": "Offer",
        priceCurrency: "CAD",
        itemOffered: {
          "@type": "Service",
          identifier: service.id,
          name: service.name,
          category: service.category,
          description: service.description
        }
      };
    })
  }
});
```

#### 3. Exact Pure Function Contracts

##### 3.1 `parseTireSize(sizeStr)`
- **Signature:** `parseTireSize(sizeStr)`
- **Validation & Normalization:**
  - Returns `null` if `typeof sizeStr !== "string"`.
  - Strips leading/trailing whitespace and internal spaces around `/` or `R`: `const cleaned = sizeStr.trim().toUpperCase().replace(/\s+/g, "");`
  - Matches regex `/^(?:P|LT)?(\d{3})\/(\d{2,3})(?:Z?R)(\d{2})$/`. Returns `null` if no match.
  - Parses integers: `width` (`125 <= width <= 405`), `aspectRatio` (`20 <= aspectRatio <= 100`), `rimDiameter` (`10 <= rimDiameter <= 28`). If outside bounds, returns `null`.
- **Formulas & Rounding (`roundCurrency(val)` = `Math.round((val + Number.EPSILON) * 100) / 100`):**
  - `sidewallHeightMm = roundCurrency(width * (aspectRatio / 100))`
  - `overallDiameterMm = roundCurrency((2 * sidewallHeightMm) + (rimDiameter * 25.4))`
  - `overallDiameterInches = roundCurrency(overallDiameterMm / 25.4)`
  - `circumferenceMm = roundCurrency(Math.PI * overallDiameterMm)`
- **Return Schema:**
  ```javascript
  {
    normalized: `${width}/${aspectRatio}R${rimDiameter}`,
    width: Number,
    aspectRatio: Number,
    rimDiameter: Number,
    sidewallHeightMm: Number,
    overallDiameterMm: Number,
    overallDiameterInches: Number,
    circumferenceMm: Number
  }
  ```

##### 3.2 `compareTireSizes(currentSizeStr, targetSizeStr)`
- **Signature:** `compareTireSizes(currentSizeStr, targetSizeStr)`
- **Validation:**
  - Calls `const current = parseTireSize(currentSizeStr)` and `const target = parseTireSize(targetSizeStr)`.
  - If `!current || !target`, returns `null`.
- **Formulas & Rounding (2 decimal places via `roundCurrency`):**
  - `diameterDiffMm = roundCurrency(target.overallDiameterMm - current.overallDiameterMm)`
  - `diameterDiffInches = roundCurrency(target.overallDiameterInches - current.overallDiameterInches)`
  - `diameterDiffPercent = roundCurrency(((target.overallDiameterMm - current.overallDiameterMm) / current.overallDiameterMm) * 100)`
  - `sidewallDiffMm = roundCurrency(target.sidewallHeightMm - current.sidewallHeightMm)`
  - `circumferenceDiffMm = roundCurrency(target.circumferenceMm - current.circumferenceMm)`
  - **Speedometer Variance at Actual 100 km/h:**
    - When actual vehicle road speed is `100.00 km/h`, the axle rotates according to the ratio `current.overallDiameterMm / target.overallDiameterMm`:
      `speedometerReadingAt100Kmh = roundCurrency(100 * (current.overallDiameterMm / target.overallDiameterMm))`
    - Also include `actualSpeedAt100Kmh = roundCurrency(100 * (target.overallDiameterMm / current.overallDiameterMm))` and `speedoDiffKmh = roundCurrency(speedometerReadingAt100Kmh - 100)`.
  - **Compliance Rating:**
    - `complianceRating = Math.abs(diameterDiffPercent) <= 3.0 ? "safe" : "caution"`
    - `isWithinTolerance = Math.abs(diameterDiffPercent) <= 3.0`
- **Return Schema:**
  ```javascript
  {
    current: Object, // output of parseTireSize(currentSizeStr)
    target: Object,  // output of parseTireSize(targetSizeStr)
    diameterDiffMm: Number,
    diameterDiffInches: Number,
    diameterDiffPercent: Number,
    sidewallDiffMm: Number,
    circumferenceDiffMm: Number,
    speedometerReadingAt100Kmh: Number,
    actualSpeedAt100Kmh: Number,
    speedoDiffKmh: Number,
    complianceRating: "safe" | "caution",
    isWithinTolerance: Boolean,
    recommendation: String
  }
  ```

##### 3.3 `generateVoucherData(estimatePayload, bookingPayload)`
- **Signature:** `generateVoucherData(estimatePayload, bookingPayload)`
- **Input Handling:**
  - `est = estimatePayload && typeof estimatePayload === "object" ? estimatePayload : {}`
  - `book = bookingPayload && typeof bookingPayload === "object" ? bookingPayload : {}`
  - If `est` is raw estimator input (e.g., has `serviceIds` but not `subtotal`), compute via `calculateEstimate(est)`. Otherwise normalize numeric fields (`subtotal`, `laborTotal`, `partsTotal`, `shopSuppliesFee`, `discountAmount`, `hstAmount`, `totalAmount`), ensuring `hstAmount = roundCurrency(subtotalAfterDiscount * 0.13)` and `totalAmount = roundCurrency(subtotalAfterDiscount + hstAmount)` when derived from a partial payload.
- **Deterministic Reference Date & 30-Day Rolling Expiry:**
  - Uses `book.issuedDate || est.issuedDate || "2026-05-01"` if valid `YYYY-MM-DD` string; if a Date-compatible string is not passed in `book.issuedDate` / `est.issuedDate`, checks `book.preferredDate` if valid `YYYY-MM-DD`, or falls back to `new Date().toISOString().slice(0, 10)`.
  - Parses `issuedDate` as UTC midnight (`Date.UTC(year, month - 1, day)`) and adds exactly `30 * 86400000` ms (`30` calendar days) to produce `expiryDate` in `YYYY-MM-DD` format.
- **Deterministic Voucher Code (`REV-VOUCH-XXXX`):**
  - Computes a deterministic 32-bit DJB2/FNV-style hash over `customerName + "|" + vehicleSummary + "|" + couponCode + "|" + totalAmount.toFixed(2) + "|" + issuedDate` and maps it into 4 characters from the alphabet `"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"`, prefixed with `"REV-VOUCH-"`.
- **Return Schema:**
  ```javascript
  {
    voucherCode: String,       // Matches /^REV-VOUCH-[0-9A-Z]{4}$/
    issuedDate: String,        // "YYYY-MM-DD"
    expiryDate: String,        // "YYYY-MM-DD" (+30 calendar days from issuedDate)
    validDays: 30,
    customerName: String,      // Default "Valued Customer"
    customerPhone: String,     // Default "(905) 846-8351"
    vehicleSummary: String,    // e.g. "2022 Honda Civic (sedan)"
    couponCode: String | null,
    lineItems: Array,
    laborTotal: Number,
    partsTotal: Number,
    shopSuppliesFee: Number,
    discountAmount: Number,
    subtotal: Number,
    hstRate: 0.13,
    hstAmount: Number,
    totalAmount: Number,
    currency: "CAD",
    shopInfo: SHOP_INFO,
    disclaimer: "Present this voucher at Revolutions Automotive (1-15A Fisherman Dr, Brampton, ON). Valid for 30 days from issue date. Shop supplies billed at 5% of labor up to a maximum of $35.00 CAD. Subject to 13% Ontario HST. Cannot be combined with other offers unless specified."
  }
  ```

##### 3.4 `exportBookingsToCsv(bookingsArray)`
- **Signature:** `exportBookingsToCsv(bookingsArray)`
- **RFC-4180 Compliance Rules:**
  - Header row: `"WorkOrderId,CustomerName,CustomerPhone,Vehicle,PreferredDate,Status,Services,CouponCode,EstimateTotalCAD,Notes"`
  - Line separator: `"\r\n"` (CRLF).
  - If `!Array.isArray(bookingsArray)` or `bookingsArray.length === 0`, returns the header row (or header row with no data lines).
  - Field extraction per record `item`:
    1. `WorkOrderId`: `item.workOrderId || item.id || "PENDING"`
    2. `CustomerName`: `item.customerName || ""`
    3. `CustomerPhone`: `item.customerPhone || item.phone || ""`
    4. `Vehicle`: `item.vehicle || item.vehicleSummary || item.vehicleClass || ""`
    5. `PreferredDate`: `item.preferredDate || item.createdAt || ""`
    6. `Status`: `item.status || item.currentState || "BOOKED"`
    7. `Services`: `Array.isArray(item.services || item.serviceIds) ? (item.services || item.serviceIds).join("; ") : (item.services || "")`
    8. `CouponCode`: `item.couponCode || ""`
    9. `EstimateTotalCAD`: `typeof item.estimateTotal === "number" ? item.estimateTotal.toFixed(2) : (typeof item.totalAmount === "number" ? item.totalAmount.toFixed(2) : (item.estimateTotal || "0.00"))`
    10. `Notes`: `item.notes || item.symptomsNotes || ""`
  - **Cell Escaping:** Any field containing `,`, `"`, `\r`, or `\n` MUST have internal `"` doubled (`""`) and the entire field wrapped in `"..."`.

##### 3.5 `validateOwnerPin(enteredPin, currentPin)`
- **Signature:** `validateOwnerPin(enteredPin, currentPin)`
- **Contract:**
  - Returns `false` if `enteredPin === null || enteredPin === undefined` or `typeof enteredPin === "boolean"` or `typeof enteredPin === "object"`.
  - Converts `enteredPin` to string and trims whitespace: `const candidate = String(enteredPin).trim();`
  - Determines target PIN: `const active = (currentPin !== undefined && currentPin !== null && String(currentPin).trim() !== "") ? String(currentPin).trim() : TIER_CONFIG_DEFAULTS.defaultOwnerPin;`
  - Validates format: both `candidate` and `active` must match `/^\d{4,8}$/`. If either fails, returns `false`.
  - Performs constant-time comparison across character codes (`candidate.length === active.length` and bitwise XOR accumulator `diff === 0`). Returns `Boolean`.

#### 4. Segment 1 Acceptance Criteria & Verification Gate
- **Additive Tests:** Append 25+ assertions in `test_revolutions.js` covering:
  - `TIER_CONFIG_DEFAULTS` deep-freeze, `$130.00` labor rate, `5%` supplies rate, `$35.00` cap, `"8351"` PIN, 5 coupon codes.
  - `SEO_SCHEMA_DATA` deep-freeze, `AutoRepair` `@type`, Brampton address, geo (`43.7196`, `-79.7946`), opening hours, 12 OfferCatalog services.
  - `parseTireSize` valid sizes (`"205/55R16"`, `"225/45R17"`, `"275/65R18"`, `"P215/60R16"`) and invalid inputs (`""`, `"invalid"`, `"205/55-16"`, `null`, out-of-range numbers).
  - `compareTireSizes` identical sizes (`0%`, `"safe"`), within `±3.0%` (`"205/55R16"` vs `"225/45R17"` -> `"safe"`), exceeding `±3.0%` (`"205/55R16"` vs `"275/65R18"` -> `"caution"`), boundary `±3.0%`, speedometer reading at 100 km/h, and invalid size handling (`null`).
  - `generateVoucherData` code format (`/^REV-VOUCH-[0-9A-Z]{4}$/`), determinism, 30-day rolling expiration math (`"2026-05-01"` -> `"2026-05-31"`), 13% HST calculation, and disclaimer text.
  - `exportBookingsToCsv` empty array header, standard booking rows, RFC-4180 escaping of embedded commas, double quotes, and newlines, and `\r\n` line endings.
  - `validateOwnerPin` default `"8351"`, trimmed `" 8351\n"`, custom PIN `"9942"`, wrong PIN `"0000"`, non-numeric/short/null inputs.
- **Gate Command:**
  ```
  node test_revolutions.js
  ```
  *Expected Output:* `173+ PASSED, 0 FAILED`.

---

### SEGMENT 2 — PHASE 3 UI, PRINT STYLESHEET & JSON-LD SCHEMA

#### 1. File Inventory (3 Files)
1. `index.html` (Modify: add JSON-LD script, Tire & Rim Calculator section, Printable Voucher Modal, `#btn-print-estimate` trigger in estimator actions, and Shop Owner Config Drawer)
2. `styles.css` (Modify: add responsive styling for Tire Calculator, Voucher Modal, Owner Config Drawer, and `@media print` rules isolating `#voucher-print-area`)
3. `test_revolutions.js` (Modify: append 12+ DOM presence and JSON-LD validation assertions)

#### 2. Exact Verbatim DOM ID Specification
Every ID listed in the table below MUST exist verbatim in `index.html` and be verified in `test_revolutions.js`:

| Feature Group | Exact DOM ID / Selector | HTML Element & Semantic Role |
| :--- | :--- | :--- |
| **Estimator Trigger** | `#btn-print-estimate` | `<button type="button" id="btn-print-estimate">` inside the Estimator summary card to open the Printable Voucher Modal for the active estimate. |
| **Printable Voucher Modal** | `#voucher-modal` | `<div id="voucher-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="voucher-modal-title" hidden>` container for printable voucher preview. |
| **Printable Voucher Modal** | `#voucher-print-area` | `<article id="voucher-print-area" class="voucher-sheet">` printable voucher sheet containing shop header, customer/vehicle summary, line items, subtotal/HST/total, code, expiry, and Ontario Midas-style disclaimer. |
| **Printable Voucher Modal** | `#voucher-code-display` | `<span id="voucher-code-display">` displays the generated `REV-VOUCH-XXXX` code. |
| **Printable Voucher Modal** | `#voucher-expiry-date` | `<span id="voucher-expiry-date">` displays the 30-day rolling expiration date (`YYYY-MM-DD`). |
| **Printable Voucher Modal** | `#btn-print-voucher` | `<button type="button" id="btn-print-voucher">` triggers `window.print()`. |
| **Printable Voucher Modal** | `#btn-close-voucher` | `<button type="button" id="btn-close-voucher">` closes `#voucher-modal`. |
| **Tire & Rim Calculator** | `#tire-calc-section` | `<section id="tire-calc-section" class="section tire-calc-section" aria-labelledby="tire-calc-heading">` main section for Seasonal Tire & Rim Size Calculator. |
| **Tire & Rim Calculator** | `#tire-input-current` | `<input type="text" id="tire-input-current" value="205/55R16">` current OEM tire size input. |
| **Tire & Rim Calculator** | `#tire-input-target` | `<input type="text" id="tire-input-target" value="225/45R17">` target aftermarket/winter tire size input. |
| **Tire & Rim Calculator** | `#btn-calc-tires` | `<button type="button" id="btn-calc-tires">` button to trigger tire comparison. |
| **Tire & Rim Calculator** | `#tire-comparison-results` | `<div id="tire-comparison-results" aria-live="polite">` container rendering side-by-side tire dimensions, diameter delta, sidewall delta, and circumference delta. |
| **Tire & Rim Calculator** | `#tire-speedo-diff` | `<div id="tire-speedo-diff">` displays speedometer reading at actual `100 km/h` and variance. |
| **Tire & Rim Calculator** | `#tire-fitment-badge` | `<span id="tire-fitment-badge" class="fitment-badge">` displays compliance badge (`SAFE FITMENT (≤ 3.0%)` or `CAUTION (> 3.0% VARIANCE)`). |
| **Local SEO Schema** | `#seo-schema-json` | `<script type="application/ld+json" id="seo-schema-json">` containing valid JSON matching `SEO_SCHEMA_DATA` (`AutoRepair`, `1-15A Fisherman Dr`, `Brampton`, `(905) 846-8351`, `43.7196`, `-79.7946`). |
| **Owner Config Drawer** | `#owner-drawer-toggle` | `<button type="button" id="owner-drawer-toggle" aria-controls="owner-drawer" aria-expanded="false">` footer/header trigger button to open/close the Shop Owner Config Drawer. |
| **Owner Config Drawer** | `#owner-drawer` | `<aside id="owner-drawer" class="owner-drawer" aria-label="Shop Owner Configuration Drawer" hidden>` slide-out configuration drawer. |
| **Owner Config Drawer** | `#owner-pin-input` | `<input type="password" id="owner-pin-input" maxlength="8" inputmode="numeric">` owner PIN input field. |
| **Owner Config Drawer** | `#btn-owner-unlock` | `<button type="button" id="btn-owner-unlock">` verifies PIN via `validateOwnerPin`. |
| **Owner Config Drawer** | `#owner-panel-content` | `<div id="owner-panel-content" hidden>` protected configuration controls unlocked after valid PIN entry. |
| **Owner Config Drawer** | `#owner-labor-rate-input` | `<input type="number" id="owner-labor-rate-input" step="0.50" min="50" max="300" value="130.00">` live hourly shop labor rate override (`CAD/hr`). |
| **Owner Config Drawer** | `#owner-supplies-cap-input` | `<input type="number" id="owner-supplies-cap-input" step="1.00" min="0" max="150" value="35.00">` live shop supplies cap override (`CAD`). |
| **Owner Config Drawer** | `#owner-banner-text-input` | `<input type="text" id="owner-banner-text-input">` live promotional banner notice text override. |
| **Owner Config Drawer** | `#btn-owner-save` | `<button type="button" id="btn-owner-save">` saves owner configuration to `revolutions_automotive_state_v1` and refreshes live UI calculations. |
| **Owner Config Drawer** | `#btn-owner-export-csv` | `<button type="button" id="btn-owner-export-csv">` exports bookings and work orders as an RFC-4180 CSV download via `exportBookingsToCsv`. |
| **Owner Config Drawer** | `#owner-status-feedback` | `<div id="owner-status-feedback" role="status" aria-live="polite">` displays unlock/save/export status messages. |

*(Note: Any additional sub-containers inside `#voucher-print-area` that `app.js` updates can either be rendered dynamically via `#voucher-print-area` or use explicit IDs present in `index.html`. Every ID queried via `getElementById` or `querySelector` in `app.js` MUST exist in `index.html`.)*

#### 3. Print Stylesheet Specification (`styles.css`)
- Must include an explicit `@media print` block that:
  - Hides site header, navigation, hero, estimator controls, tire calculator, diagnostic wizard, MTO checklist, bay tracker, owner drawer, and modal action buttons (`#btn-print-voucher`, `#btn-close-voucher`).
  - Displays `#voucher-modal` and `#voucher-print-area` full-width on white paper with high-contrast black text and crisp dashed coupon border.

#### 4. Segment 2 Acceptance Criteria & Verification Gate
- **Additive Tests:** Append 12+ assertions in `test_revolutions.js` verifying:
  - Presence of all 26 Phase 3 DOM IDs in `index.html`.
  - `<script type="application/ld+json" id="seo-schema-json">` exists in `index.html`, parses via `JSON.parse()` without throwing, has `"@type": "AutoRepair"`, `"telephone": "(905) 846-8351"`, `"streetAddress": "1-15A Fisherman Dr"`, `"addressLocality": "Brampton"`, `"latitude": 43.7196`, `"longitude": -79.7946`, and 12 services in `hasOfferCatalog.itemListElement`.
  - `styles.css` contains `@media print` and `#voucher-print-area` styling rules plus `.fitment-badge` and `.owner-drawer` rules.
- **Gate Command:**
  ```
  node test_revolutions.js
  ```
  *Expected Output:* `185+ PASSED, 0 FAILED`.

---

### SEGMENT 3 — INTERACTIVE WIRING (`app.js`) & FULL ANTI-DRIFT GATE

#### 1. File Inventory (2 Files)
1. `app.js` (Modify: wire Tire & Rim Calculator, Printable Voucher Modal, Shop Owner Config Drawer, live labor rate / supplies cap estimator overrides, state persistence under `revolutions_automotive_state_v1`, and CSV lead download)
2. `test_revolutions.js` (Modify: append 10+ controller integration & Phase 3 DOM anti-drift assertions)

#### 2. Controller Wiring Requirements (`app.js`)

##### 2.1 Seasonal Tire & Rim Size Calculator Wiring
- Bind click on `#btn-calc-tires` and `input`/`change` on `#tire-input-current` and `#tire-input-target`.
- Call `Engine.compareTireSizes(currentVal, targetVal)`.
- When valid:
  - Render comparison table/cards into `#tire-comparison-results` (showing width, sidewall height mm, overall diameter mm/inches, circumference mm, and deltas).
  - Render speedometer variance summary into `#tire-speedo-diff` (e.g., `"At 100 km/h actual speed, speedometer reads XX.XX km/h"`).
  - Update `#tire-fitment-badge` text and CSS class (`fitment-safe` when `complianceRating === "safe"`, `fitment-caution` when `complianceRating === "caution"`).
- When invalid:
  - Render clear validation guidance inside `#tire-comparison-results` and set `#tire-fitment-badge` to invalid state without throwing.
- Run initial calculation on boot using default inputs (`205/55R16` vs `225/45R17`).

##### 2.2 Printable Midas Voucher Generator Wiring
- Bind `#btn-print-estimate` and coupon card print triggers to generate a voucher via `Engine.generateVoucherData(currentEstimate, currentBookingDraft)`.
- Populate `#voucher-code-display` with `voucher.voucherCode` and `#voucher-expiry-date` with `voucher.expiryDate`.
- Render itemized breakdown (customer name, vehicle summary, selected services, labor, parts, shop supplies fee, discount, 13% HST, CAD total, and Midas-style disclaimer) into `#voucher-print-area`.
- Unhide `#voucher-modal` (`hidden = false`, `classList.add("active")`).
- Bind `#btn-close-voucher` to hide `#voucher-modal`.
- Bind `#btn-print-voucher` to invoke `window.print()` (guarded via `if (typeof window !== "undefined" && typeof window.print === "function") window.print();`).

##### 2.3 Shop Owner Config Drawer & Persistence Wiring
- Extend `state.ownerConfig` persisted under `localStorage` key `revolutions_automotive_state_v1`:
  ```javascript
  ownerConfig: {
    unlocked: false,
    laborRatePerHour: 130.00,
    shopSuppliesCap: 35.00,
    bannerText: TIER_CONFIG_DEFAULTS.bannerText,
    customPin: "8351"
  }
  ```
- Bind `#owner-drawer-toggle` to toggle `#owner-drawer` visibility and `aria-expanded`.
- Bind `#btn-owner-unlock` to read `#owner-pin-input`, verify via `Engine.validateOwnerPin(enteredPin, state.ownerConfig.customPin)`, unhide `#owner-panel-content` on success, and update `#owner-status-feedback`.
- Bind `#btn-owner-save` (when unlocked) to read `#owner-labor-rate-input`, `#owner-supplies-cap-input`, and `#owner-banner-text-input`:
  - Validate numeric bounds (`laborRatePerHour > 0`, `shopSuppliesCap >= 0`).
  - Save updated `ownerConfig` to `revolutions_automotive_state_v1`.
  - Apply `ownerConfig.laborRatePerHour` and `ownerConfig.shopSuppliesCap` to live estimator recalculations and update the promotional notice banner and `#owner-status-feedback`.
- Bind `#btn-owner-export-csv` to gather all work orders (`state.workOrders` + `SEED_WORK_ORDERS`) and bookings, call `Engine.exportBookingsToCsv(records)`, trigger a browser `Blob` download (`revolutions_bookings_export.csv`) when `Blob` and `URL.createObjectURL` exist, and update `#owner-status-feedback`.

##### 2.4 Static Anti-Drift Gate (`test_revolutions.js`)
- Preserve all existing Phase 1 and Phase 2 anti-drift assertions untouched.
- Add a dedicated Phase 3 Anti-Drift verification block in `test_revolutions.js` that:
  1. Extracts every static `getElementById("...")` and `querySelector("#...")` ID referenced in `app.js` and asserts 100% exist in `index.html`.
  2. Verifies every one of the 25 interactive Phase 3 DOM IDs (all 26 Phase 3 IDs minus the static `#seo-schema-json` script tag, or all 26 verified in `index.html` and all 25 interactive IDs wired in `app.js`) is explicitly referenced in `app.js`.

#### 3. Segment 3 Acceptance Criteria & Verification Gate
- **Additive Tests:** Append 10+ assertions in `test_revolutions.js` covering:
  - `app.js` references all interactive Phase 3 DOM IDs (`#tire-input-current`, `#tire-input-target`, `#btn-calc-tires`, `#tire-comparison-results`, `#tire-speedo-diff`, `#tire-fitment-badge`, `#btn-print-estimate`, `#voucher-modal`, `#voucher-print-area`, `#voucher-code-display`, `#voucher-expiry-date`, `#btn-print-voucher`, `#btn-close-voucher`, `#owner-drawer-toggle`, `#owner-drawer`, `#owner-pin-input`, `#btn-owner-unlock`, `#owner-panel-content`, `#owner-labor-rate-input`, `#owner-supplies-cap-input`, `#owner-banner-text-input`, `#btn-owner-save`, `#btn-owner-export-csv`, `#owner-status-feedback`).
  - `app.js` invokes `compareTireSizes`, `generateVoucherData`, `exportBookingsToCsv`, `validateOwnerPin`, and `window.print`.
  - 100% static anti-drift check between `app.js` queried IDs and `index.html` defined `id="..."` attributes.
- **Gate Command:**
  ```
  node test_revolutions.js
  ```
  *Expected Output:* `195+ PASSED, 0 FAILED`.

---

## STAGE 5: FULL VERIFICATION PROTOCOL

After completing Segment 3, run the complete verification suite in a plain shell (zero redirects, zero shell variables):

```
node test_revolutions.js
```

Verify:
1. Total passing assertions is **195 or higher** (`0 FAILED`).
2. `git status -s` shows only expected roadmap and source modifications (`plans/PHASE3_ROADMAP.md`, `revolutions_engine.js`, `index.html`, `styles.css`, `app.js`, `test_revolutions.js`).

---

## STAGE 6: ASSERTION INTEGRITY AUDIT & GIT MILESTONE GATE

### 6.1 Independent Gemini 4 Argon Audit Protocol
Upon completion of Segment 3, the executor must invoke an independent Gemini 4 Argon architectural audit using relative parent paths with forward slashes, zero redirects, and zero shell variables:

1. Inspect `git diff test_revolutions.js` to confirm there are zero `-` lines removing or altering any of the first 148 assertions from Phases 1 and 2.
2. Confirm that the test count increased strictly through genuine additive assertions (`148 -> 173+ -> 185+ -> 195+`).
3. Confirm that the anti-drift check covers 100% of Phase 3 selectors between `app.js` and `index.html`.
4. Require the auditor output to contain the verdict line:
   - `AUDIT VERDICT: PASS` (or `AUDIT VERDICT: FAIL` if any assertion was weakened).

### 6.2 Git Commit Milestone Sequence
Once `node test_revolutions.js` reports `195+ PASSED, 0 FAILED` and the Stage 6 audit returns `AUDIT VERDICT: PASS`, execute the plain milestone commands:

```
git status -s
git add plans/PHASE3_ROADMAP.md revolutions_engine.js index.html styles.css app.js test_revolutions.js
git commit -m "Complete Phase 3: Printable Midas Voucher, Tire Calculator, AutoRepair JSON-LD Schema, and Owner Config Drawer (195+ tests green)"
git log -n 1
```

---

## STAGE 6 ASSERTION INTEGRITY AUDIT (ARCHITECTURAL PLAN REVIEW)

- **Baseline Protection:** All 148 existing Phase 1 and Phase 2 assertions in `test_revolutions.js` are locked against modification, deletion, skipping, or broadening.
- **Additive Verification Trajectory:** Segment 1 (`+25+` engine tests -> `173+`), Segment 2 (`+12+` DOM/CSS/JSON-LD tests -> `185+`), Segment 3 (`+10+` controller & anti-drift tests -> `195+`).
- **Selector Parity:** All 26 Phase 3 DOM IDs are explicitly tabulated and bound to static anti-drift assertions between `index.html` and `app.js`.
- **Audit Gate Verdict Format:** `AUDIT VERDICT: PASS`

AUDIT: PASS - assertions intact, no weakening detected