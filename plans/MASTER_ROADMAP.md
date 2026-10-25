# Revolutions Automotive — Master Roadmap

## Stage 1: Context Map & System Architecture

### 1.1 Client & Domain Context
- **Business Name:** Revolutions Automotive
- **Location:** 1-15A Fisherman Dr, Brampton, ON L7A 1B7
- **Phone:** (905) 846-8351
- **Operating Hours (Brampton Shop Schedule):**
  - Monday – Friday: `08:00` – `18:00` (8:00 AM – 6:00 PM)
  - Saturday: `08:30` – `15:00` (8:30 AM – 3:00 PM)
  - Sunday: Closed
- **Core Specialties:** Auto Repairs, Auto Maintenance, Automobile Air Conditioning (R134a & R1234yf), Oil Change (Synthetic & Conventional), State-of-the-Art Computer Diagnostics & Repair, Auto Tune-Ups, 4-Wheel Laser Alignments, Brake Services, Tires (Sales, Mounting, Balancing, Seasonal Swap), Suspensions & Steering, Exhaust Systems, Ontario Safety Standards Certificates (MTO SSC), Domestic & Import Vehicles.
- **Tax & Pricing Jurisdiction:** Ontario, Canada (CAD currency, 13% Harmonized Sales Tax / HST, environmental & shop supplies fee capped at $35.00 CAD).

### 1.2 Active Technology Stack (Fixed)
- **Frontend Markup & Styling:** Semantic HTML5 (`index.html`), modern responsive CSS3 (`styles.css`) using high-contrast Midas-inspired gold, carbon-black, and crimson safety accents. Zero external CSS/JS frameworks; zero build step.
- **Core Business Logic Engine:** Dual UMD Vanilla ES6+ JavaScript module (`revolutions_engine.js`) exporting `window.RevolutionsEngine` in browser environments and `module.exports` in Node.js environments.
- **UI Controller:** Vanilla ES6+ DOM controller (`app.js`) managing interactive state, live estimation, coupon application, symptom mapping, and `localStorage` persistence under key `revolutions_automotive_state_v1`.
- **Verification & Quality Gate:** Headless Node.js `assert` test suite (`test_revolutions.js`) runnable via plain shell command `node test_revolutions.js`.
- **Visual Assets:** Custom AI-generated `.jpg` assets produced via `python ..\generate_image.py` and verified for JPEG magic bytes (`FF D8 FF`) and non-empty file size.

---

## Stage 2: 3-Phase Master Overview (9 Segments Total)

Every phase is structured into **3 sequential segments**. Each segment touches **1 to 3 code files maximum** and terminates in the canonical headless Node verification gate: `node test_revolutions.js`.

### Phase 1 (MVP): Midas-Style Service Hub, Multi-Service & Diagnostic Estimator, Coupon Wallet & Bay Booking Engine

- **Phase 1 — Segment 1: Core Pricing, Diagnostic & Booking Engine**
  - **Code Files (2):** `revolutions_engine.js`, `test_revolutions.js`
  - **Scope:** Build the Dual UMD engine containing `SHOP_INFO`, `SERVICE_CATALOG` (12 services across 6 categories), `COUPON_CATALOG` (5 Midas-style promotional codes), `calculateEstimate(options)`, `validateBooking(bookingPayload)`, and `recommendServicesBySymptoms(symptomsArray)`. Author 35+ unit assertions in `test_revolutions.js`.
  - **Headless Gate Command:** `node test_revolutions.js`

- **Phase 1 — Segment 2: Semantic UI Shell, Midas Industrial Styling & Custom AI Visual Assets**
  - **Code Files (3):** `index.html`, `styles.css`, `test_revolutions.js` *(plus 3 `.jpg` assets generated via `python ..\generate_image.py`: `assets\hero_bay.jpg`, `assets\diagnostics_tech.jpg`, `assets\safety_badge.jpg`)*
  - **Scope:** Generate the 3 bespoke automotive photography/emblem assets, construct the complete responsive HTML5 application shell with all mandatory DOM IDs, implement the industrial gold/charcoal/crimson stylesheet, and append asset magic-byte (`FF D8 FF`) + DOM ID presence checks to `test_revolutions.js`.
  - **Headless Gate Command:** `node test_revolutions.js`

- **Phase 1 — Segment 3: Interactive Controller, Persistence & Anti-Drift Verification**
  - **Code Files (2):** `app.js`, `test_revolutions.js`
  - **Scope:** Wire `app.js` to `window.RevolutionsEngine` and the DOM. Implement interactive vehicle origin/class selectors, service selection cards, symptom chip filters, one-click Midas coupon wallet, live CAD + 13% HST estimate drawer, appointment validation/submission with `localStorage` (`revolutions_automotive_state_v1`), `#btn-load-sample` 1-click populate, and the static AST/regex anti-drift test in `test_revolutions.js` confirming every DOM ID queried in `app.js` exists verbatim in `index.html`.
  - **Headless Gate Command:** `node test_revolutions.js`

---

### Phase 2: Symptom-to-Diagnostic Wizard, Ontario MTO Safety Certificate Pre-Check & Live Bay Tracker

- **Phase 2 — Segment 1: Diagnostic Decision Tree, MTO SSC Inspection Matrix & Work Order State Machine**
  - **Code Files (2):** `revolutions_engine.js`, `test_revolutions.js`
  - **Scope:** Extend `revolutions_engine.js` with `DIAGNOSTIC_WIZARD_TREE` ("What's That Noise/Warning Light?" multi-step narrowing logic), `MTO_SAFETY_CHECKLIST` (official Ontario Safety Standards Certificate inspection criteria across brakes, tires, steering, lighting, windshield, and exhaust with pass/advisory/fail scoring), and `lookupWorkOrder(workOrderIdOrPhone)` for live bay status tracking (`CHECKED_IN`, `ON_HOIST_DIAGNOSTICS`, `PARTS_ORDERED`, `IN_REPAIR_BAY`, `QUALITY_ROAD_TEST`, `READY_FOR_PICKUP`). Add headless unit tests for all Phase 2 engine functions.
  - **Headless Gate Command:** `node test_revolutions.js`

- **Phase 2 — Segment 2: Phase 2 UI Sections & Interactive Bay Tracker Layout**
  - **Code Files (3):** `index.html`, `styles.css`, `test_revolutions.js`
  - **Scope:** Add dedicated semantic sections and modal/drawer containers in `index.html` and `styles.css` for the Interactive Symptom Wizard, Ontario MTO Safety Pre-Check Checklist, and the 6-stage visual Bay Progress Bar ("Track My Vehicle"). Extend `test_revolutions.js` with Phase 2 DOM ID presence checks.
  - **Headless Gate Command:** `node test_revolutions.js`

- **Phase 2 — Segment 3: Phase 2 Interactive Wiring & Cross-Module Integration**
  - **Code Files (2):** `app.js`, `test_revolutions.js`
  - **Scope:** Wire the step-by-step Diagnostic Wizard so completing it auto-populates the Phase 1 Estimator; wire the interactive MTO SSC Pre-Check so failed items dynamically suggest corrective services; connect the Live Work Order Bay Tracker with sample Brampton work orders; verify zero selector drift in `test_revolutions.js`.
  - **Headless Gate Command:** `node test_revolutions.js`

---

### Phase 3: Printable Midas Voucher Generator, Tire & Rim Size Calculator, Local SEO Schema & Owner Config Drawer

- **Phase 3 — Segment 1: Tire/Rim Plus-Sizing Math Engine, Voucher Serializer & Rate Override Engine**
  - **Code Files (2):** `revolutions_engine.js`, `test_revolutions.js`
  - **Scope:** Add `calculateTireComparison(oemSpec, targetSpec)` (computing sidewall height, overall diameter, circumference, speedometer error percentage, and +/- 3% safe fitment tolerance), `generatePrintableVoucherModel(estimate, customer, coupon)`, and `applyShopConfigOverrides(customRates)` to `revolutions_engine.js`. Add comprehensive unit tests in `test_revolutions.js`.
  - **Headless Gate Command:** `node test_revolutions.js`

- **Phase 3 — Segment 2: Print Media Stylesheet, Tire Calculator UI, Owner Config Drawer & Brampton JSON-LD Schema**
  - **Code Files (3):** `index.html`, `styles.css`, `test_revolutions.js`
  - **Scope:** Embed structured `AutoRepair` / `LocalBusiness` JSON-LD schema for `1-15A Fisherman Dr, Brampton, ON L7A 1B7` inside `index.html`, build the Seasonal Tire & Rim Size Calculator UI and Shop Owner Rate/Promo Config Drawer, add `@media print` rules in `styles.css` for clean Midas-style estimate & barcode coupon printing, and validate JSON-LD validity and DOM selectors in `test_revolutions.js`.
  - **Headless Gate Command:** `node test_revolutions.js`

- **Phase 3 — Segment 3: Phase 3 Controller Wiring & Full End-to-End Regression Suite**
  - **Code Files (2):** `app.js`, `test_revolutions.js`
  - **Scope:** Wire the Tire & Rim Size Calculator controls, Printable Voucher trigger (`window.print()` preview and serialized voucher card), and Shop Owner Rate/Promo Config Drawer (persisting custom shop labor rates and promo toggles to `localStorage`). Run full regression and anti-drift verification across all 3 phases.
  - **Headless Gate Command:** `node test_revolutions.js`

---

## Stage 3: Phase 1 Granular 3-Segment Blueprint

---

### Phase 1 — Segment 1 Blueprint: `revolutions_engine.js` & `test_revolutions.js`

#### File Inventory (2 Code Files)
1. `revolutions_engine.js`
2. `test_revolutions.js`

#### 1. Dual UMD Pattern Specification (`revolutions_engine.js`)
`revolutions_engine.js` must wrap its exports in an IIFE supporting both Node.js CommonJS (`typeof module !== 'undefined' && module.exports`) and Browser globals (`root.RevolutionsEngine = api`), with strict mode (`'use strict';`) enabled and zero external dependencies.

#### 2. Exact Exported Constants & Pure Functions Contract

##### A. `SHOP_INFO` (Frozen Object)
- `name`: `"Revolutions Automotive"`
- `tagline`: `"Brampton's Trusted Domestic & Import Repair, Diagnostics & Safety Centre"`
- `address`: `"1-15A Fisherman Dr"`
- `city`: `"Brampton"`
- `province`: `"ON"`
- `postalCode`: `"L7A 1B7"`
- `fullAddress`: `"1-15A Fisherman Dr, Brampton, ON L7A 1B7"`
- `phone`: `"(905) 846-8351"`
- `phoneTel`: `"+19058468351"`
- `hstRate`: `0.13`
- `shopSuppliesRate`: `0.05`
- `shopSuppliesCap`: `35.00`
- `hours`:
  - `monday`: `{ open: "08:00", close: "18:00", closed: false }`
  - `tuesday`: `{ open: "08:00", close: "18:00", closed: false }`
  - `wednesday`: `{ open: "08:00", close: "18:00", closed: false }`
  - `thursday`: `{ open: "08:00", close: "18:00", closed: false }`
  - `friday`: `{ open: "08:00", close: "18:00", closed: false }`
  - `saturday`: `{ open: "08:30", close: "15:00", closed: false }`
  - `sunday`: `{ open: null, close: null, closed: true }`
- `specialties`: Array of 12 strings covering Auto Repairs, Auto Maintenance, Automobile Air Conditioning (R134a & R1234yf), Oil Change (Synthetic & Conventional), State-of-the-Art Computer Diagnostics & Repair, Auto Tune-Ups, 4-Wheel Laser Alignments, Brake Services, Tires (Sales, Mounting, Balancing, Seasonal Swap), Suspensions & Steering, Exhaust Systems, Ontario Safety Standards Certificates (MTO SSC).

##### B. `VEHICLE_MULTIPLIERS` (Frozen Object)
- `origin`:
  - `domestic`: `{ label: "Domestic (Ford, GM, Stellantis)", partsMultiplier: 1.00, laborMultiplier: 1.00 }`
  - `asian_import`: `{ label: "Asian Import (Toyota, Honda, Mazda, Hyundai, Subaru, Nissan)", partsMultiplier: 1.08, laborMultiplier: 1.05 }`
  - `euro_import`: `{ label: "European Import (BMW, Mercedes-Benz, Audi, VW, Volvo)", partsMultiplier: 1.25, laborMultiplier: 1.20 }`
- `vehicleClass`:
  - `sedan`: `{ label: "Compact / Sedan / Coupe", partsMultiplier: 1.00, laborMultiplier: 1.00 }`
  - `suv`: `{ label: "Crossover / Mid-Size SUV / Minivan", partsMultiplier: 1.12, laborMultiplier: 1.10 }`
  - `truck`: `{ label: "Full-Size Pickup / Heavy SUV / Commercial Van", partsMultiplier: 1.20, laborMultiplier: 1.18 }`

##### C. `SERVICE_CATALOG` (Frozen Array of 12 Core Services across 6 Categories)
Every service object must have the exact schema:
`{ id, name, category, baseParts, baseLabor, durationHours, rangeVariance, warranty, description, popular }`

1. **Category: `"Brakes"`**
   - `brk_pads_rotors`: `"Complete Front or Rear Brake Pads & Rotors"` (`baseParts: 210.00`, `baseLabor: 150.00`, `durationHours: 2.0`, `rangeVariance: 0.10`, `popular: true`)
   - `brk_fluid_caliper`: `"Brake Fluid Flush & Caliper Service"` (`baseParts: 45.00`, `baseLabor: 95.00`, `durationHours: 1.0`, `rangeVariance: 0.08`, `popular: false`)
2. **Category: `"Tires & Alignment"`**
   - `tir_align_4whl`: `"4-Wheel Computerized Laser Alignment"` (`baseParts: 0.00`, `baseLabor: 129.99`, `durationHours: 1.2`, `rangeVariance: 0.05`, `popular: true`)
   - `tir_mount_balance`: `"Seasonal Tire Swap, Mount & Precision Balance (Set of 4)"` (`baseParts: 20.00`, `baseLabor: 100.00`, `durationHours: 1.0`, `rangeVariance: 0.05`, `popular: true`)
3. **Category: `"Computer Diagnostics"`**
   - `diag_computer_scan`: `"State-of-the-Art OEM Computer Diagnostic & Pinpoint Test"` (`baseParts: 0.00`, `baseLabor: 130.00`, `durationHours: 1.0`, `rangeVariance: 0.05`, `popular: true`)
   - `diag_elec_parasitic`: `"Electrical System, Alternator & Parasitic Draw Diagnosis"` (`baseParts: 15.00`, `baseLabor: 145.00`, `durationHours: 1.5`, `rangeVariance: 0.10`, `popular: false`)
4. **Category: `"Oil & Tune-Up"`**
   - `oil_full_synth`: `"Full Synthetic Oil & Filter Change + 50-Point Midas-Grade Inspection"` (`baseParts: 62.00`, `baseLabor: 38.00`, `durationHours: 0.75`, `rangeVariance: 0.06`, `popular: true`)
   - `tune_spark_induction`: `"Complete Ignition Tune-Up (Iridium Plugs & Fuel Induction Clean)"` (`baseParts: 140.00`, `baseLabor: 160.00`, `durationHours: 2.0`, `rangeVariance: 0.10`, `popular: false`)
5. **Category: `"Air Conditioning"`**
   - `ac_ evac_recharge`: *(ID: `ac_evac_recharge`)* `"A/C System Evacuation, Leak Test & Refrigerant Recharge (R134a/R1234yf)"` (`baseParts: 85.00`, `baseLabor: 135.00`, `durationHours: 1.5`, `rangeVariance: 0.12`, `popular: true`)
   - `ac_compressor_cond`: `"A/C Compressor or Condenser Replacement Package"` (`baseParts: 420.00`, `baseLabor: 280.00`, `durationHours: 3.5`, `rangeVariance: 0.15`, `popular: false`)
6. **Category: `"Suspension/Exhaust/Safety Certificate"`**
   - `sus_strut_control`: `"Front Strut, Ball Joint or Control Arm Replacement (Per Axle)"` (`baseParts: 260.00`, `baseLabor: 220.00`, `durationHours: 2.5`, `rangeVariance: 0.12`, `popular: false`)
   - `mto_safety_exhaust`: `"Ontario Safety Standards Certificate (MTO SSC) & Exhaust Inspection"` (`baseParts: 0.00`, `baseLabor: 149.99`, `durationHours: 1.5`, `rangeVariance: 0.05`, `popular: true`)

##### D. `COUPON_CATALOG` (Frozen Array of 5 Midas-Style Promos)
Every coupon object must include `{ code, title, description, discountType, amount, eligibleServiceIds, requiresAdditionalRepair, badgeText }`:
1. `SYNTH15`:
   - `title`: `"$15 Off Full Synthetic Oil Change"`
   - `discountType`: `"fixed"`
   - `amount`: `15.00`
   - `eligibleServiceIds`: `["oil_full_synth"]`
   - `requiresAdditionalRepair`: `false`
2. `ALIGN25`:
   - `title`: `"$25 Off 4-Wheel Alignment with Tire Service"`
   - `discountType`: `"fixed"`
   - `amount`: `25.00`
   - `eligibleServiceIds`: `["tir_align_4whl"]`
   - `prerequisiteServiceIds`: `["tir_mount_balance"]` *(or valid standalone if `tir_align_4whl` is selected alongside `tir_mount_balance` or any suspension service `sus_strut_control`; if `tir_align_4whl` is selected alone without tire/suspension service, returns `couponApplied: false` with clear reason `"ALIGN25 requires 4-Wheel Alignment combined with Tire or Suspension service"`)*
3. `DIAG50`:
   - `title`: `"50% Off Computer Diagnostic with Any Repair Service"`
   - `discountType`: `"percentage_service_labor"`
   - `amount`: `0.50`
   - `eligibleServiceIds`: `["diag_computer_scan", "diag_elec_parasitic"]`
   - `requiresAdditionalRepair`: `true` *(Applies 50% off the scaled labor of the diagnostic service when at least 1 other service is also selected in `serviceIds`)*
4. `BRAKE50`:
   - `title`: `"$50 Off Complete Front or Rear Brake Job"`
   - `discountType`: `"fixed"`
   - `amount`: `50.00`
   - `eligibleServiceIds`: `["brk_pads_rotors"]`
   - `requiresAdditionalRepair`: `false`
5. `SAFETY10`:
   - `title`: `"$10 Off Ontario Safety Standards Certificate"`
   - `discountType`: `"fixed"`
   - `amount`: `10.00`
   - `eligibleServiceIds`: `["mto_safety_exhaust"]`
   - `requiresAdditionalRepair`: `false`

##### E. `calculateEstimate(options)` Specification
- **Input `options`:**
  ```
  {
    serviceIds: string[],          // Array of selected service IDs
    origin: string,                // 'domestic' | 'asian_import' | 'euro_import' (defaults to 'domestic')
    vehicleClass: string,          // 'sedan' | 'suv' | 'truck' (defaults to 'sedan')
    couponCode: string | null      // Optional promo code string (case-insensitive, trimmed)
  }
  ```
- **Deterministic Calculation Steps (All monetary outputs rounded to 2 decimal places via `Math.round((val + Number.EPSILON) * 100) / 100`):**
  1. **Filter & Resolve Services:** Match valid `serviceIds` against `SERVICE_CATALOG` (deduplicated). If `serviceIds` is empty or contains no valid services, return zeroed estimate object with `serviceCount: 0`.
  2. **Resolve Multipliers:**
     - `combinedPartsMultiplier = originObj.partsMultiplier * classObj.partsMultiplier`
     - `combinedLaborMultiplier = originObj.laborMultiplier * classObj.laborMultiplier`
  3. **Per-Service Line Items & Base Totals:**
     - For each selected service:
       - `adjustedParts = round2(service.baseParts * combinedPartsMultiplier)`
       - `adjustedLabor = round2(service.baseLabor * combinedLaborMultiplier)`
     - `partsTotal = round2(sum of adjustedParts)`
     - `rawLaborTotal = round2(sum of adjustedLabor)`
  4. **Multi-Service Shared-Hoist Combo Labor Discount:**
     - If `serviceCount === 2`: `comboDiscountRate = 0.10` (10% off `rawLaborTotal`)
     - If `serviceCount >= 3`: `comboDiscountRate = 0.15` (15% off `rawLaborTotal`)
     - Else (`serviceCount <= 1`): `comboDiscountRate = 0.00`
     - `comboLaborDiscount = round2(rawLaborTotal * comboDiscountRate)`
     - `netLaborTotal = round2(rawLaborTotal - comboLaborDiscount)`
  5. **Shop Supplies & Environmental Fee:**
     - `rawShopSupplies = round2(rawLaborTotal * 0.05)` (5% of labor)
     - `shopSuppliesFee = Math.min(35.00, rawShopSupplies)` (strictly capped at `$35.00 CAD`)
  6. **Coupon Validation & Discount Calculation:**
     - Normalize `couponCode` (uppercase, trimmed).
     - Check eligibility against selected `serviceIds`:
       - `SYNTH15`: `$15.00` if `oil_full_synth` is selected.
       - `BRAKE50`: `$50.00` if `brk_pads_rotors` is selected.
       - `SAFETY10`: `$10.00` if `mto_safety_exhaust` is selected.
       - `ALIGN25`: `$25.00` if `tir_align_4whl` is selected AND (`tir_mount_balance` OR `sus_strut_control` is also selected).
       - `DIAG50`: `50%` of the adjusted labor of `diag_computer_scan` (or `diag_elec_parasitic` if `diag_computer_scan` not present) when `serviceCount >= 2` (i.e., paired with at least one other service).
     - Produce `couponDiscount` (number), `couponApplied` (boolean), `couponMessage` (string).
  7. **Totals, Ontario 13% HST, and Range:**
     - `totalDiscount = round2(comboLaborDiscount + couponDiscount)`
     - `subtotalBeforeTax = Math.max(0, round2(partsTotal + netLaborTotal + shopSuppliesFee - couponDiscount))`
     - `hstAmount = round2(subtotalBeforeTax * 0.13)`
     - `grandTotal = round2(subtotalBeforeTax + hstAmount)`
     - **Low / High Estimate Range:**
       - Compute weighted average `rangeVariance` across selected services (or default `0.08`).
       - `totalRangeLow = round2(grandTotal * (1 - weightedVariance * 0.5))`
       - `totalRangeHigh = round2(grandTotal * (1 + weightedVariance))`
- **Returned Object Contract:**
  ```
  {
    serviceCount,
    lineItems,
    origin,
    vehicleClass,
    combinedPartsMultiplier,
    combinedLaborMultiplier,
    partsTotal,
    rawLaborTotal,
    comboDiscountRate,
    comboLaborDiscount,
    netLaborTotal,
    shopSuppliesFee,
    couponCode: normalizedCode || null,
    couponApplied,
    couponDiscount,
    couponMessage,
    totalDiscount,
    subtotalBeforeTax,
    hstRate: 0.13,
    hstAmount,
    grandTotal,
    totalRangeLow,
    totalRangeHigh,
    estimatedDurationHours
  }
  ```

##### F. `validateBooking(bookingPayload)` Specification
- **Input `bookingPayload`:**
  ```
  {
    customerName: string,
    phone: string,
    vehicleYear: number | string,
    vehicleMake: string,
    vehicleModel: string,
    origin: string,
    vehicleClass: string,
    serviceIds: string[],
    appointmentDate: string, // "YYYY-MM-DD"
    appointmentTime: string, // "HH:MM" (24-hour format)
    bookingMode: string      // "drop_off" | "wait_in_lounge"
  }
  ```
- **Validation Rules:**
  1. `customerName`: Required, trimmed length >= 2 chars.
  2. `phone`: Required, must contain at least 10 digits (North American phone validation supporting `(905) 846-8351`, `905-846-8351`, `9058468351`, `+19058468351`).
  3. `vehicleYear`: Numeric integer between `1980` and `2027`.
  4. `vehicleMake` & `vehicleModel`: Required non-empty strings (trimmed length >= 2 chars for Make, >= 1 char for Model).
  5. `origin`: Must be one of `["domestic", "asian_import", "euro_import"]`.
  6. `serviceIds`: Non-empty array containing at least 1 valid service ID from `SERVICE_CATALOG`.
  7. `appointmentDate` & `appointmentTime`:
     - Parse `"YYYY-MM-DD"` safely in local/UTC calendar terms (`new Date(year, month - 1, day).getDay()`) so timezone offsets never shift the day of the week:
       - `0` = Sunday -> **Reject** with error `"Shop is closed on Sundays. Please select Monday through Saturday."`
       - `1..5` = Monday–Friday -> Valid time window is `08:00` to `18:00` inclusive (`480` to `1080` minutes from midnight; last appointment slot `17:30` or `<= 18:00` closing boundary — specifically reject any time `< 08:00` or `>= 18:00`, or if `appointmentTime > "17:30"` reject as after-hours/past last bay check-in). *Rule for exact determinism:* Convert `"HH:MM"` to minutes since midnight. On Mon–Fri, valid check-in times are `08:00` (`480`) through `17:30` (`1050`), with shop closing at `18:00` (`1080`). Any time `< 08:00` or `>= 18:00` (or `> 17:30`) is rejected with a clear after-hours message.
       - `6` = Saturday -> Valid check-in times are `08:30` (`510`) through `14:30` (`870`), with shop closing at `15:00` (`900`). Any time `< 08:30` or `>= 15:00` (or `> 14:30`) is rejected with a Saturday hours error message.
  8. `bookingMode`: Must be `"drop_off"` or `"wait_in_lounge"`. Additionally, if `bookingMode === "wait_in_lounge"` and total estimated duration of selected services exceeds `3.0` hours, include a helpful `advisory` note recommending `"drop_off"` while still keeping `valid: true` (or if invalid mode string, `valid: false`).
- **Return Contract:**
  `{ valid: boolean, errors: string[], normalizedBooking: object | null, confirmationCode: string | null, advisory: string | null }`

##### G. `recommendServicesBySymptoms(symptomsArray)` Specification
- **Supported Symptom Keys (`SYMPTOM_CATALOG` exported as well for UI rendering):**
  1. `squealing_brakes` -> Label: `"Squealing or Grinding Brakes"` -> Recommends `["brk_pads_rotors", "brk_fluid_caliper"]` (Priority: `"HIGH - Safety Critical"`)
  2. `pulling_steering` -> Label: `"Vehicle Pulling / Uneven Tire Wear"` -> Recommends `["tir_align_4whl", "sus_strut_control"]` (Priority: `"MEDIUM - Alignment & Handling"`)
  3. `check_engine_light` -> Label: `"Check Engine / Warning Light On"` -> Recommends `["diag_computer_scan", "tune_spark_induction"]` (Priority: `"HIGH - Powertrain Diagnostics"`)
  4. `warm_ac` -> Label: `"A/C Blowing Warm or Weak Air"` -> Recommends `["ac_evac_recharge", "ac_compressor_cond"]` (Priority: `"MEDIUM - Climate Comfort"`)
  5. `clunking_bumps` -> Label: `"Clunking Noise Over Bumps"` -> Recommends `["sus_strut_control", "tir_align_4whl"]` (Priority: `"HIGH - Suspension & Steering Safety"`)
  6. `loud_exhaust` -> Label: `"Loud Exhaust Roar or Rattling"` -> Recommends `["mto_safety_exhaust", "diag_computer_scan"]` (Priority: `"MEDIUM - Exhaust & Emissions"`)
  7. `buying_used_car` -> Label: `"Buying / Registering a Used Vehicle"` -> Recommends `["mto_safety_exhaust", "oil_full_synth"]` (Priority: `"HIGH - Ontario MTO Compliance"`)
- **Return Contract:**
  Returns `{ matchedSymptoms: string[], recommendedServiceIds: string[], recommendedServices: object[], primaryServiceIds: string[], diagnosticSummary: string }` where `primaryServiceIds` contains the top-priority first service from each matched symptom so 1-click symptom selection in the UI can either select primary services or show all recommended services without duplicate IDs.

#### Segment 1 Verification Gate & Acceptance Criteria
- **Gate Command:** `node test_revolutions.js`
- **Acceptance Criteria:**
  - `test_revolutions.js` executes 35+ independent `assert` unit tests covering:
    - `SHOP_INFO` Brampton address, phone `(905) 846-8351`, `hstRate: 0.13`, and shop hours.
    - All 12 services across all 6 required categories in `SERVICE_CATALOG`.
    - All 5 promo codes (`SYNTH15`, `ALIGN25`, `DIAG50`, `BRAKE50`, `SAFETY10`) in `COUPON_CATALOG`.
    - Vehicle origin multipliers (`domestic`, `asian_import`, `euro_import`) and class multipliers (`sedan`, `suv`, `truck`).
    - Multi-service shared-hoist labor discount: 0% for 1 service, 10% for 2 services, 15% for 3+ services.
    - Shop supplies fee calculation at 5% of labor and strict cap at `$35.00 CAD` on large jobs.
    - Coupon eligibility edge cases (e.g., `DIAG50` rejected when only 1 service is selected, accepted when paired with a repair; `ALIGN25` rejected when alignment is standalone, accepted when paired with tire service; invalid coupon code gracefully ignored).
    - Exact 13% Ontario HST calculation and low/high estimate range bounds.
    - `validateBooking` acceptance of valid weekday (`08:00`–`17:30`) and Saturday (`08:30`–`14:30`) slots, and strict rejection of Sunday dates, before-open times (`07:30`), after-hours weekday times (`18:30`), after-hours Saturday times (`15:30`), bad phone numbers, and empty service lists.
    - `recommendServicesBySymptoms` mapping single and multiple symptoms to deduplicated prioritized services.

---

### Phase 1 — Segment 2 Blueprint: `index.html`, `styles.css`, & 3 Custom AI Assets

#### File Inventory (3 Code Files + 3 AI Image Assets)
1. `index.html`
2. `styles.css`
3. `test_revolutions.js` *(updated with Stage 2 asset & DOM verification tests)*
- **Generated Image Assets:**
  - `assets\hero_bay.jpg`
  - `assets\diagnostics_tech.jpg`
  - `assets\safety_badge.jpg`

#### 1. Custom AI Asset Generation Protocol
Execute `python ..\generate_image.py` for each of the 3 required `.jpg` assets:
1. `assets\hero_bay.jpg`: *"Wide cinematic photo of a state-of-the-art automotive diagnostic and laser wheel alignment service bay at Revolutions Automotive, clean industrial yellow and charcoal hydraulic hoists, a modern performance import sedan on the lift, bright LED shop lighting, photorealistic, high contrast."*
2. `assets\diagnostics_tech.jpg`: *"Close-up photorealistic shot of an advanced digital automotive computer diagnostic tablet scanner connected via OBD-II cable to a modern clean engine bay, live telemetry waveforms on screen, professional mechanic gloved hands, shallow depth of field."*
3. `assets\safety_badge.jpg`: *"High-contrast metallic gold, carbon black, and crimson emblem badge for Ontario Certified Auto Repair and Safety Standards Inspection Center, precision gear and shield crest, luxury studio lighting."*

#### 2. Mandatory DOM ID Contract (`index.html`)
To guarantee zero drift between `index.html`, `app.js`, and `test_revolutions.js`, `index.html` **must** contain every one of the following DOM IDs verbatim:

| Category | Exact DOM ID | HTML Element Type & Purpose |
| :--- | :--- | :--- |
| **Header & Identity** | `#shop-phone-header` | `<a>` or `<span>` displaying `(905) 846-8351` in top bar |
| | `#shop-address-header` | `<span>` displaying `1-15A Fisherman Dr, Brampton, ON L7A 1B7` |
| | `#btn-load-sample` | `<button>` for 1-click sample customer & vehicle data load |
| **Vehicle Selector** | `#vehicle-origin-select` | `<select>` with options `domestic`, `asian_import`, `euro_import` |
| | `#vehicle-class-select` | `<select>` with options `sedan`, `suv`, `truck` |
| | `#vehicle-year-input` | `<input type="number">` for vehicle year (e.g., `2021`) |
| | `#vehicle-make-input` | `<input type="text">` for vehicle make (e.g., `Honda`) |
| | `#vehicle-model-input` | `<input type="text">` for vehicle model (e.g., `Civic Touring`) |
| **Symptoms & Catalog** | `#symptom-chips` | `<div>` container for interactive symptom recommender chips |
| | `#symptom-recommendation-banner` | `<div>` live feedback banner showing symptom diagnostic advice |
| | `#category-filter-bar` | `<div>` category filter tabs (`All`, `Brakes`, `Tires & Alignment`, etc.) |
| | `#service-grid` | `<div>` grid container where the 12 service cards are rendered |
| **Coupons & Estimator** | `#coupon-wallet-grid` | `<div>` interactive Midas-style clickable coupon cards |
| | `#coupon-select` | `<select>` dropdown for promo codes (`""`, `SYNTH15`, `ALIGN25`, `DIAG50`, `BRAKE50`, `SAFETY10`) |
| | `#estimate-summary-card` | `<aside>` / `<div>` sticky live CAD + 13% HST estimate summary card |
| | `#est-selected-count` | `<span>` count of selected services |
| | `#est-line-items` | `<ul>` or `<div>` breakdown of selected services |
| | `#est-parts-total` | `<span>` formatted CAD parts total |
| | `#est-labor-total` | `<span>` formatted CAD base labor total |
| | `#est-shop-supplies` | `<span>` formatted CAD shop supplies fee (capped at $35.00) |
| | `#est-subtotal` | `<span>` formatted CAD subtotal before tax |
| | `#est-discount` | `<span>` formatted CAD combined combo + coupon discount |
| | `#est-coupon-status` | `<div>` status message for active/ineligible coupon |
| | `#est-hst` | `<span>` formatted CAD 13% Ontario HST amount |
| | `#est-total-range` | `<div>` or `<span>` formatted CAD final total & low–high range |
| **Bay Booking Engine** | `#booking-form` | `<form>` bay appointment booking form |
| | `#booking-customer-name` | `<input type="text">` customer full name |
| | `#booking-customer-phone` | `<input type="tel">` customer phone number |
| | `#booking-date` | `<input type="date">` appointment date picker |
| | `#booking-time` | `<input type="time">` or `<select>` appointment time slot |
| | `#booking-mode` | `<select>` (`drop_off` vs. `wait_in_lounge`) |
| | `#booking-submit-btn` | `<button type="submit">` submit bay booking button |
| | `#booking-feedback` | `<div>` live validation error or confirmed booking card |

#### 3. Visual & Responsive Design System (`styles.css`)
- **Color Palette:**
  - Carbon Asphalt Background: `#0f1217` and `#171b22`
  - Card Surface: `#1e242d` with `#2e3744` industrial steel borders
  - Midas Championship Gold Accent: `#f5b700` (hover `#ffca2c`)
  - Crimson Safety & Diagnostic Red: `#e63946`
  - Emerald Pass/Savings Badge: `#10b981`
  - High-Contrast Typography: `#f8fafc` primary text, `#94a3b8` muted technical metadata
- **Layout Architecture:**
  - Sticky top utility bar featuring Brampton address, hours badge, `#shop-phone-header`, and `#btn-load-sample`.
  - Hero split banner showcasing `assets\hero_bay.jpg`, `assets\diagnostics_tech.jpg`, and `assets\safety_badge.jpg` with trust metrics (MTO Certified Inspection Station, R134a & R1234yf A/C Certified, 10%–15% Multi-Service Hoist Discount).
  - 2-column main workspace on desktop (`grid-template-columns: 1fr 390px`), collapsing cleanly to 1 column below `1024px`:
    - Left Column: Vehicle Configurator bar -> Interactive Symptom Chips (`#symptom-chips`) -> Category Filter & 12-Service Interactive Grid (`#service-grid`) -> Midas-Style Dashed Coupon Wallet (`#coupon-wallet-grid`).
    - Right Sticky Column: Live Estimate Summary Card (`#estimate-summary-card`) + Bay Appointment Booking Form (`#booking-form`).

#### Segment 2 Verification Gate & Acceptance Criteria
- **Gate Command:** `node test_revolutions.js`
- **Acceptance Criteria:**
  - All 3 `.jpg` files (`assets\hero_bay.jpg`, `assets\diagnostics_tech.jpg`, `assets\safety_badge.jpg`) exist on disk, have size `> 10,000` bytes, and begin with exact JPEG magic bytes `0xFF 0xD8 0xFF`.
  - `index.html` exists, references `styles.css`, `revolutions_engine.js`, `app.js`, and all 3 `.jpg` assets, displays `1-15A Fisherman Dr`, `Brampton`, and `(905) 846-8351`, and contains every mandatory DOM ID listed in the Segment 2 table.
  - `styles.css` defines custom properties, responsive breakpoints, Midas coupon perforation styles, and active states.

---

### Phase 1 — Segment 3 Blueprint: `app.js` & Anti-Drift Integration Tests in `test_revolutions.js`

#### File Inventory (2 Code Files)
1. `app.js`
2. `test_revolutions.js` *(updated with Segment 3 integration & anti-drift DOM verification tests)*

#### 1. Interactive Controller Architecture (`app.js`)
- **State Model & Persistence (`localStorage` key: `revolutions_automotive_state_v1`):**
  ```
  {
    origin: "domestic",
    vehicleClass: "sedan",
    vehicleYear: "2020",
    vehicleMake: "Honda",
    vehicleModel: "CR-V",
    selectedServiceIds: ["oil_full_synth"],
    activeSymptoms: [],
    activeCategory: "All",
    couponCode: "",
    customerName: "",
    customerPhone: "",
    appointmentDate: "2025-05-14",
    appointmentTime: "09:30",
    bookingMode: "drop_off",
    lastConfirmedBooking: null
  }
  ```
- **Core Controller Flows:**
  1. **Initialization (`initApp`):**
     - Load saved state from `localStorage.getItem('revolutions_automotive_state_v1')` (wrapped in `try/catch` for safe fallback).
     - Render `#symptom-chips`, `#category-filter-bar`, `#service-grid`, `#coupon-wallet-grid`, and populate `#coupon-select`.
     - Sync form inputs (`#vehicle-origin-select`, `#vehicle-class-select`, `#vehicle-year-input`, `#vehicle-make-input`, `#vehicle-model-input`, `#coupon-select`, `#booking-date`, `#booking-time`, `#booking-mode`).
     - Run `recalculateAndRenderEstimate()` immediately so the estimate drawer is never blank on load.
  2. **Service Selection & Category Filtering:**
     - Clicking any service card in `#service-grid` toggles its ID in `state.selectedServiceIds`, updates `aria-pressed` / `.selected` styling, saves state, and triggers `recalculateAndRenderEstimate()`.
  3. **Symptom Chip Recommender (`#symptom-chips`):**
     - Clicking a symptom chip toggles that symptom key in `state.activeSymptoms`, calls `RevolutionsEngine.recommendServicesBySymptoms(state.activeSymptoms)`, automatically adds the primary recommended service IDs to `state.selectedServiceIds`, highlights recommended cards in `#service-grid`, updates `#symptom-recommendation-banner`, and recalculates the live estimate.
  4. **Midas-Style Coupon Wallet & Select Sync:**
     - Clicking a coupon card in `#coupon-wallet-grid` or changing `#coupon-select` sets `state.couponCode`, auto-adds the coupon's eligible service if the user clicks "Apply Coupon & Add Service" (or applies immediately to current selection), and updates `#est-discount` and `#est-coupon-status`.
  5. **Live Estimate Rendering (`recalculateAndRenderEstimate`):**
     - Calls `RevolutionsEngine.calculateEstimate(...)`.
     - Formats all figures in Canadian Dollars (`$XX.XX CAD`) and updates `#est-selected-count`, `#est-line-items`, `#est-parts-total`, `#est-labor-total`, `#est-shop-supplies`, `#est-subtotal`, `#est-discount`, `#est-coupon-status`, `#est-hst`, and `#est-total-range`.
  6. **Bay Appointment Booking (`#booking-form`):**
     - On submit (`e.preventDefault()`), gathers customer, vehicle, selected services, date, time, and mode into `bookingPayload`.
     - Calls `RevolutionsEngine.validateBooking(bookingPayload)`.
     - If `valid === false`, renders itemized error alerts inside `#booking-feedback` with `.feedback-error` class.
     - If `valid === true`, saves `lastConfirmedBooking` to `localStorage` and renders a rich confirmation voucher inside `#booking-feedback` with confirmation number, Brampton shop address (`1-15A Fisherman Dr, Brampton, ON L7A 1B7`), vehicle summary, appointment slot, and estimated total range.
  7. **1-Click Sample Customer Data Loader (`#btn-load-sample`):**
     - Clicking `#btn-load-sample` populates a realistic Brampton customer scenario:
       - Customer: `"Marcus Vance"`, Phone: `"(905) 555-0194"`
       - Vehicle: `2021` `Toyota` `RAV4 XLE`, Origin: `asian_import`, Class: `suv`
       - Selected Services: `["brk_pads_rotors", "oil_full_synth", "tir_align_4whl"]` (triggers the 15% 3-service shared-hoist labor discount)
       - Coupon: `"BRAKE50"` (`$50.00` off brake job)
       - Symptoms: `["squealing_brakes", "pulling_steering"]`
       - Booking Date/Time: Next valid Wednesday `"2025-05-14"` at `"10:00"`, Mode: `"drop_off"`
     - Automatically syncs all inputs, recalculates the estimate, and displays a confirmation toast/banner in `#booking-feedback`.

#### 2. Anti-Drift Verification Contract (`test_revolutions.js`)
- `test_revolutions.js` must read `app.js` and `index.html` as UTF-8 text and extract:
  - Every `document.getElementById('...')` call in `app.js`.
  - Every `querySelector('#...')` / `querySelectorAll('#...')` ID reference in `app.js`.
- Assert that **100% of DOM IDs referenced in `app.js` exist as `id="..."` attributes in `index.html`**.
- Assert that `app.js` references the exact storage key `revolutions_automotive_state_v1` and invokes `calculateEstimate`, `validateBooking`, and `recommendServicesBySymptoms`.

#### Segment 3 Verification Gate & Acceptance Criteria
- **Gate Command:** `node test_revolutions.js`
- **Acceptance Criteria:**
  - All Segment 1 unit tests (35+), Segment 2 asset & DOM tests, and Segment 3 controller integration & anti-drift tests pass with zero warnings or errors.
  - Zero missing DOM IDs between `app.js` and `index.html`.

---

## Stage 4 & Stage 5: Segmented Execution & Full Verification Summary

| Segment | Target Files (Max 3 Code Files) | Primary Verification Focus | CLI Gate |
| :--- | :--- | :--- | :--- |
| **Phase 1 - Seg 1** | `revolutions_engine.js`, `test_revolutions.js` | 35+ unit assertions on pricing, multipliers, 10%/15% combo labor discount, $35 shop supplies cap, 5 coupons, 13% HST, Brampton shop hours validation, symptom mapping | `node test_revolutions.js` |
| **Phase 1 - Seg 2** | `index.html`, `styles.css`, `test_revolutions.js` (+ 3 `.jpg` assets) | JPEG magic-byte (`FF D8 FF`) validation on `hero_bay.jpg`, `diagnostics_tech.jpg`, `safety_badge.jpg`; presence of all mandatory DOM IDs and Brampton shop metadata | `node test_revolutions.js` |
| **Phase 1 - Seg 3** | `app.js`, `test_revolutions.js` | Static AST/regex anti-drift check ensuring every DOM ID queried in `app.js` exists verbatim in `index.html`; `localStorage` key `revolutions_automotive_state_v1` and sample loader wiring | `node test_revolutions.js` |

---

## Stage 6: Assertion Integrity Audit

1. **No Weakened or Broadened Assertions:** All unit tests in `test_revolutions.js` are required to use exact `assert.strictEqual`, `assert.deepStrictEqual`, and deterministic numeric bounds rather than truthy/falsy placeholders.
2. **No Skipped or Deleted Tests:** Each subsequent segment in Phase 1 appends new test suites (Segment 2 Asset/DOM suite, Segment 3 Controller & Anti-Drift suite) to `test_revolutions.js` without deleting, commenting out, or skipping any Segment 1 unit assertions.
3. **Full Edge-Case Coverage Preserved:** Sunday closures, before/after-hours weekday and Saturday boundaries, `$35.00 CAD` shop supplies cap, 10% (2-service) and 15% (3-service) shared-hoist labor discounts, 13% Ontario HST math, and conditional coupon prerequisites (`DIAG50`, `ALIGN25`) are all enforced with strict assertions.

AUDIT: PASS - assertions intact, no weakening detected