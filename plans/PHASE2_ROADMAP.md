# PHASE 2 ARCHITECTURAL ROADMAP — Revolutions Automotive

**Target File:** `plans/PHASE2_ROADMAP.md`  
**Architect:** Gemini 4 Argon (Architect Mode)  
**Client:** Revolutions Automotive — 1-15A Fisherman Dr, Brampton, ON L7A 1B7 — (905) 846-8351  
**Baseline State:** Phase 1 Complete (`91/91` headless assertions green via `node test_revolutions.js`)  
**Phase 2 Target State:** `142/142` headless assertions green (`117` after Segment 1, `132` after Segment 2, `142` after Segment 3; minimum gate requirement `116+`)

---

## STAGE 1: CONTEXT MAP & BASELINE INVARIANTS

### 1.1 Business & Jurisdiction Invariants
- **Shop Identity:** Revolutions Automotive, 1-15A Fisherman Dr, Brampton, ON L7A 1B7, Phone `(905) 846-8351`.
- **Core Capabilities:** Auto repairs & maintenance, A/C service (`R134a` & `R1234yf`), synthetic & conventional oil changes, OEM-level computer diagnostics & parasitic draw testing, tune-ups, 4-wheel laser alignments, complete brake services, tire sales/mounting/balancing/seasonal swaps, front & rear suspension/steering, exhaust fabrication & repair, Ontario Ministry of Transportation Safety Standards Certificates (MTO SSC), domestic & import fleet/passenger vehicles.
- **Tax & Fee Rules:** Ontario jurisdiction (`CAD`), `13%` HST (`0.13`), shop supplies fee calculation capped at `$35.00 CAD`.

### 1.2 Phase 1 Technical Baseline (Immutable Contracts)
| Artifact | Role | Phase 1 Baseline Status | Phase 2 Modification Policy |
| :--- | :--- | :--- | :--- |
| `revolutions_engine.js` | Pure ES6+ dual UMD engine (`window.RevolutionsEngine` / `module.exports`) | Exports `SHOP_INFO`, `VEHICLE_MULTIPLIERS`, `SERVICE_CATALOG` (12 services), `COUPON_CATALOG` (5 codes), `calculateEstimate`, `validateBooking`, `recommendServicesBySymptoms` | **Strictly Additive:** Append Phase 2 frozen constants and pure functions; do not alter existing exports or signatures |
| `index.html` | Semantic responsive HTML5 shell | Hero, Services, Price Estimator, Coupon Bar, Appointment Form, Footer | **Strictly Additive:** Insert Phase 2 sections (`#diagnostic-wizard-section`, `#safety-precheck-section`, `#bay-tracker-section`) with exact verbatim DOM IDs |
| `styles.css` | Midas industrial gold / carbon-black / crimson stylesheet | Responsive grid, industrial cards, form controls, badges | **Strictly Additive:** Append Phase 2 component rules (wizard step cards, safety gauge, 6-state bay timeline) |
| `app.js` | Browser DOM controller & `localStorage` manager | Persists under key `revolutions_automotive_state_v1` | **Strictly Additive:** Extend state envelope to store `workOrders`, wire Phase 2 sections, bridge booking submission to `createWorkOrder` |
| `test_revolutions.js` | Headless Node test suite (`node test_revolutions.js`) | **91/91 assertions passing** (68 engine + 14 DOM/asset + 9 controller/anti-drift) | **Zero Weakening Allowed:** All 91 existing assertions remain untouched; append 51 new assertions (`91 -> 142`) |

---

## STAGE 2: PHASE 2 ARCHITECTURAL BLUEPRINT

### 2.1 Functional Architecture Overview
Phase 2 introduces three tightly integrated customer-facing workflows backed by pure deterministic functions in `revolutions_engine.js`:

1. **Symptom-to-Diagnostic Decision Wizard ("What's That Noise / Warning Light?"):**
   - Guides vehicle owners through a multi-step decision tree (`DIAGNOSTIC_DECISION_TREE`) narrowing down symptoms by primary system, specific manifestation, and operating condition.
   - Evaluates selections via `evaluateDiagnosticWizard(answersObject)` into an actionable triage level (`"tow_now" | "schedule_urgent" | "routine_inspect"`), likely mechanical causes, technician notes, and a direct `recommendedServiceId` pointer into `SERVICE_CATALOG`.
   - Allows one-click injection (`#btn-wizard-add-service`) of the recommended service directly into the Phase 1 interactive estimator.

2. **Ontario MTO Safety Standards Certificate (SSC) Pre-Check:**
   - Models the **11 official Ontario MTO inspection areas** (`MTO_SSC_CHECKLIST_ITEMS`) with plain-language homeowner self-check prompts, relative inspection weights summing to `100`, and `"critical" | "major" | "minor"` severity classifications.
   - Computes real-time readiness via `evaluateSafetyPreCheck(answersObject)` returning `{ scorePercentage, status, criticalFailures, recommendedServices }`.
   - Enforces Ontario MTO auto-fail rules: any failed `"critical"` inspection item immediately forces `status: "fail"` regardless of numeric score.

3. **Live Bay Tracker ("Track My Vehicle"):**
   - Tracks active shop work orders across a 6-stage bay state machine (`WORK_ORDER_STATES`):
     `CHECKED_IN` $\rightarrow$ `ON_HOIST_DIAGNOSTICS` $\rightarrow$ `PARTS_ORDERED` $\rightarrow$ `IN_REPAIR_BAY` $\rightarrow$ `QUALITY_ROAD_TEST` $\rightarrow$ `READY_FOR_PICKUP`.
   - Ships with frozen `SEED_WORK_ORDERS` (`REV-2048`, `REV-3105`, `REV-4092`) for instant demonstration via quick-fill buttons (`#btn-track-sample-1`, `#btn-track-sample-2`) and supports live lookup via `lookupWorkOrder(query, phoneOrPlate)`.
   - Connects to the Phase 1 appointment booking form via `createWorkOrder(bookingPayload, estimatePayload)` so every newly booked appointment generates a persistent `REV-XXXX` work order under `localStorage` key `revolutions_automotive_state_v1`.

### 2.2 Test Count Trajectory
| Milestone | Engine Tests | DOM / Asset Tests | Controller & Anti-Drift Tests | Total Assertions | Gate Command |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Phase 1 Baseline** | 68 | 14 | 9 | **91** | `node test_revolutions.js` |
| **After Phase 2 Segment 1** | 94 (+26) | 14 | 9 | **117** | `node test_revolutions.js` |
| **After Phase 2 Segment 2** | 94 | 29 (+15) | 9 | **132** | `node test_revolutions.js` |
| **After Phase 2 Segment 3** | 94 | 29 | 19 (+10) | **142** | `node test_revolutions.js` |

---

## STAGE 3: SEGMENTED EXECUTION PLAN (3 SEGMENTS)

---

### SEGMENT 1 — ENGINE EXTENSIONS (`revolutions_engine.js` + `test_revolutions.js`)

#### 1.1 File Inventory (Maximum 3 Files Rule: 2 Files Touched)
1. `revolutions_engine.js` — Add frozen data structures (`DIAGNOSTIC_DECISION_TREE`, `MTO_SSC_CHECKLIST_ITEMS`, `WORK_ORDER_STATES`, `SEED_WORK_ORDERS`) and pure functions (`evaluateDiagnosticWizard`, `evaluateSafetyPreCheck`, `lookupWorkOrder`, `createWorkOrder`), and export them on the UMD namespace.
2. `test_revolutions.js` — Append **26 new unit test assertions** (`Test 92` through `Test 117`) validating Phase 2 engine schemas, decision rules, edge cases, and determinism.

#### 1.2 Exact Data Schemas

##### A. `DIAGNOSTIC_DECISION_TREE`
Must be deeply frozen (`deepFreeze`). Designed to support both interactive node-by-node UI traversal (`rootNodeId` + `nodes[nodeId]`) and direct key-based evaluation in `evaluateDiagnosticWizard(answersObject)`. Every `recommendedServiceId` must exist in `SERVICE_CATALOG` (verified against existing Phase 1 service IDs; if a fallback lookup is needed, verify against `SERVICE_CATALOG.map(s => s.id)`).

```javascript
/* Schema Structure for DIAGNOSTIC_DECISION_TREE */
{
  rootNodeId: "step_category",
  nodes: {
    // ROOT NODE (Step 1: Primary Symptom Category)
    step_category: {
      id: "step_category",
      type: "question",
      questionType: "single_select",
      answerKey: "category",
      stepNumber: 1,
      prompt: "What primary symptom or warning is your vehicle exhibiting?",
      options: [
        { value: "warning_light", label: "Dashboard Warning Light or Gauge Alert", nextNodeId: "step_warning_type" },
        { value: "braking_noise", label: "Braking Noise, Vibration, or Soft Pedal", nextNodeId: "step_brake_symptom" },
        { value: "steering_suspension", label: "Pulling, Drifting, Clunking, or Bouncing Ride", nextNodeId: "step_chassis_symptom" },
        { value: "engine_drivetrain", label: "Rough Idle, Hesitation, Overheating, or No-Start", nextNodeId: "step_engine_symptom" },
        { value: "climate_exhaust", label: "Weak A/C Cooling or Loud Exhaust / Cabin Fumes", nextNodeId: "step_climate_exhaust_symptom" }
      ]
    },

    // BRANCH 1: WARNING LIGHTS (Step 2)
    step_warning_type: {
      id: "step_warning_type",
      type: "question",
      questionType: "single_select",
      answerKey: "symptom",
      stepNumber: 2,
      prompt: "How is the dashboard warning light behaving?",
      options: [
        { value: "flashing_cel", label: "Flashing Check Engine Light or Red Oil/Temp Light", nextNodeId: "term_flashing_cel_tow" },
        { value: "solid_cel", label: "Solid Check Engine / ABS / Traction Light (Drives Normally)", nextNodeId: "term_solid_cel_scan" },
        { value: "battery_light", label: "Battery / Charging Light or Overnight Dead Battery", nextNodeId: "term_battery_parasitic" }
      ]
    },

    // BRANCH 2: BRAKING (Step 2)
    step_brake_symptom: {
      id: "step_brake_symptom",
      type: "question",
      questionType: "single_select",
      answerKey: "symptom",
      stepNumber: 2,
      prompt: "What happens when you apply the brakes?",
      options: [
        { value: "pedal_to_floor", label: "Brake Pedal Sinks to Floor or Red Brake Fluid Warning", nextNodeId: "term_brake_hydraulic_tow" },
        { value: "grinding_pulsation", label: "Metal-on-Metal Grinding or Steering Wheel Shaking When Braking", nextNodeId: "term_brake_grind_urgent" },
        { value: "light_squeak", label: "Occasional High-Pitched Squeak at Low Speeds", nextNodeId: "term_brake_squeak_routine" }
      ]
    },

    // BRANCH 3: STEERING & SUSPENSION (Step 2)
    step_chassis_symptom: {
      id: "step_chassis_symptom",
      type: "question",
      questionType: "single_select",
      answerKey: "symptom",
      stepNumber: 2,
      prompt: "How does the steering or suspension feel on the road?",
      options: [
        { value: "pulls_uneven_wear", label: "Vehicle Pulls Left/Right or Steering Wheel Off-Center", nextNodeId: "term_pull_alignment" },
        { value: "clunk_over_bumps", label: "Loud Clunking Over Bumps or Loose/Wandering Steering", nextNodeId: "term_clunk_suspension" },
        { value: "high_speed_shimmy", label: "Seat or Floor Vibration at Highway Speeds (80–100 km/h)", nextNodeId: "term_tire_balance" }
      ]
    },

    // BRANCH 4: ENGINE & DRIVETRAIN (Step 2)
    step_engine_symptom: {
      id: "step_engine_symptom",
      type: "question",
      questionType: "single_select",
      answerKey: "symptom",
      stepNumber: 2,
      prompt: "Which engine or starting condition best matches your vehicle?",
      options: [
        { value: "overheating_steam", label: "Temperature Gauge in Red Zone or Steam from Hood", nextNodeId: "term_overheat_tow" },
        { value: "rough_idle_misfire", label: "Rough Idle, Hard Cold Starts, or Sluggish Acceleration", nextNodeId: "term_misfire_tuneup" },
        { value: "overdue_maintenance", label: "Oil Life Monitor at 0% or Overdue for Oil Service", nextNodeId: "term_oil_routine" }
      ]
    },

    // BRANCH 5: CLIMATE & EXHAUST (Step 2)
    step_climate_exhaust_symptom: {
      id: "step_climate_exhaust_symptom",
      type: "question",
      questionType: "single_select",
      answerKey: "symptom",
      stepNumber: 2,
      prompt: "Is the issue related to cabin air conditioning or exhaust noise/fumes?",
      options: [
        { value: "exhaust_fumes_cabin", label: "Strong Exhaust Smell Inside Cabin or Loud Roar Under Floor", nextNodeId: "term_exhaust_urgent" },
        { value: "ac_blowing_warm", label: "A/C Blows Warm Air or Clicking Compressor Clutch", nextNodeId: "term_ac_routine" }
      ]
    },

    // TERMINAL DIAGNOSIS NODES
    term_flashing_cel_tow: {
      id: "term_flashing_cel_tow",
      type: "terminal",
      triageLevel: "tow_now",
      likelyCauses: [
        "Active catalyst-damaging cylinder misfire",
        "Critical oil pressure loss or severe engine overheating"
      ],
      recommendedServiceId: "diag_computer_scan",
      technicianNotes: "CRITICAL STOP-DRIVE: Flashing MIL indicates raw fuel entering catalytic converter or critical lubrication/thermal fault. Do not drive; arrange tow to Fisherman Dr bay for immediate OEM scan."
    },
    term_solid_cel_scan: {
      id: "term_solid_cel_scan",
      type: "terminal",
      triageLevel: "routine_inspect",
      likelyCauses: [
        "EVAP emissions purge/vent solenoid fault",
        "Oxygen (O2) sensor heater circuit or mass airflow drift",
        "Wheel speed sensor implausible signal (ABS/Traction)"
      ],
      recommendedServiceId: "diag_computer_scan",
      technicianNotes: "Solid MIL with normal drivability. Perform full OBD-II / OEM bi-directional module scan and freeze-frame analysis."
    },
    term_battery_parasitic: {
      id: "term_battery_parasitic",
      type: "terminal",
      triageLevel: "schedule_urgent",
      likelyCauses: [
        "Alternator voltage regulator failure or worn brushes",
        "Parasitic key-off battery drain exceeding 50 mA",
        "Sulfated AGM/lead-acid battery cell"
      ],
      recommendedServiceId: "diag_elec_parasitic",
      technicianNotes: "Perform AVR charging system load test and amp-clamp parasitic draw isolation across fuse blocks."
    },
    term_brake_hydraulic_tow: {
      id: "term_brake_hydraulic_tow",
      type: "terminal",
      triageLevel: "tow_now",
      likelyCauses: [
        "Ruptured flexible brake hose or corroded steel brake line",
        "Master cylinder internal bypass failure"
      ],
      recommendedServiceId: "brk_pads_rotors",
      technicianNotes: "CRITICAL SAFETY HAZARD: Loss of hydraulic brake pressure. Do not operate vehicle on public roads; tow required."
    },
    term_brake_grind_urgent: {
      id: "term_brake_grind_urgent",
      type: "terminal",
      triageLevel: "schedule_urgent",
      likelyCauses: [
        "Friction pad material worn to steel backing plate",
        "Excessive rotor lateral runout or thermal disc thickness variation",
        "Seized caliper slide pins"
      ],
      recommendedServiceId: "brk_pads_rotors",
      technicianNotes: "Inspect friction thickness, measure rotor discard spec with micrometer, service caliper hardware, and replace pads/rotors."
    },
    term_brake_squeak_routine: {
      id: "term_brake_squeak_routine",
      type: "terminal",
      triageLevel: "routine_inspect",
      likelyCauses: [
        "Audible pad wear indicator tab contacting rotor",
        "Glazed brake pads or dry abutment clip contact points"
      ],
      recommendedServiceId: "brk_pads_rotors",
      technicianNotes: "Measure remaining pad lining in mm and inspect rotor surface finish."
    },
    term_pull_alignment: {
      id: "term_pull_alignment",
      type: "terminal",
      triageLevel: "routine_inspect",
      likelyCauses: [
        "Camber, caster, or total toe out of OEM specification",
        "Uneven tire shoulder wear or radial tire pull"
      ],
      recommendedServiceId: "tir_align_4whl",
      technicianNotes: "Mount 4-wheel laser alignment heads, inspect suspension bushings, and adjust front/rear toe and camber to spec."
    },
    term_clunk_suspension: {
      id: "term_clunk_suspension",
      type: "terminal",
      triageLevel: "schedule_urgent",
      likelyCauses: [
        "Worn lower ball joint or outer tie-rod end play",
        "Broken sway bar stabilizer link or leaking MacPherson strut"
      ],
      recommendedServiceId: "susp_front_end",
      technicianNotes: "Perform hoist dial-indicator ball joint axial/radial play check and pry-bar bushing inspection."
    },
    term_tire_balance: {
      id: "term_tire_balance",
      type: "terminal",
      triageLevel: "routine_inspect",
      likelyCauses: [
        "Thrown wheel balance weight or dynamic wheel imbalance",
        "Bent alloy rim or irregular tread cupping"
      ],
      recommendedServiceId: "tir_mount_balance",
      technicianNotes: "Road-force / high-speed spin balance all four wheels and inspect rims for runout."
    },
    term_overheat_tow: {
      id: "term_overheat_tow",
      type: "terminal",
      triageLevel: "tow_now",
      likelyCauses: [
        "Stuck-closed thermostat or failed electric cooling fan",
        "Coolant leak from water pump, radiator, or ruptured hose"
      ],
      recommendedServiceId: "diag_computer_scan",
      technicianNotes: "CRITICAL THERMAL RISK: Continued operation risks cylinder head warpage or head gasket failure. Tow to shop for cooling system pressure test."
    },
    term_misfire_tuneup: {
      id: "term_misfire_tuneup",
      type: "terminal",
      triageLevel: "schedule_urgent",
      likelyCauses: [
        "Fouled or worn iridium spark plugs and weak ignition coils",
        "Carbon-fouled throttle body or dirty fuel injectors"
      ],
      recommendedServiceId: "tune_spark_induction",
      technicianNotes: "Inspect spark plug electrode gap/insulator, test coil secondary output, and perform upper induction cleaning."
    },
    term_oil_routine: {
      id: "term_oil_routine",
      type: "terminal",
      triageLevel: "routine_inspect",
      likelyCauses: [
        "Scheduled engine oil viscosity breakdown and filter saturation"
      ],
      recommendedServiceId: "oil_full_synthetic",
      technicianNotes: "Perform full synthetic dexos1/OEM-spec oil and filter service with multi-point hoist inspection."
    },
    term_exhaust_urgent: {
      id: "term_exhaust_urgent",
      type: "terminal",
      triageLevel: "schedule_urgent",
      likelyCauses: [
        "Corroded exhaust flex pipe, flange gasket leak, or rusted muffler seam"
      ],
      recommendedServiceId: "exh_muffler_pipe",
      technicianNotes: "CO intrusion hazard: hoist vehicle, smoke-test exhaust path from manifold to tailpipe, and replace compromised section."
    },
    term_ac_routine: {
      id: "term_ac_routine",
      type: "terminal",
      triageLevel: "routine_inspect",
      likelyCauses: [
        "Low R134a / R1234yf refrigerant charge from condenser or O-ring micro-leak",
        "A/C pressure transducer or compressor clutch relay fault"
      ],
      recommendedServiceId: "ac_evac_recharge",
      technicianNotes: "Connect manifold gauges, recover remaining refrigerant, vacuum leak-test, and recharge with UV dye."
    }
  }
}
```
*(Note: If any `recommendedServiceId` in the tree differs from the exact Phase 1 `SERVICE_CATALOG` IDs in `revolutions_engine.js`, bind each terminal node's `recommendedServiceId` to the exact matching ID in `SERVICE_CATALOG`—specifically verifying `diag_computer_scan`, `diag_elec_parasitic`, `brk_pads_rotors`, `tir_align_4whl`, `tune_spark_induction`, `oil_full_synthetic`, `ac_evac_recharge`, `tir_mount_balance`, `susp_front_end`, `exh_muffler_pipe`, `safe_mto_ssc` against `SERVICE_CATALOG` at module load so every terminal node guarantees `SERVICE_CATALOG.some(s => s.id === node.recommendedServiceId)` is `true`.)*

##### B. `MTO_SSC_CHECKLIST_ITEMS`
Frozen array of **exactly 11 objects** representing the Ontario Ministry of Transportation Safety Standards Certificate (SSC) inspection categories, with weights summing to **100**:

| Index | `id` | `areaLabel` | `question` | `weight` | `severity` | `recommendedServiceId` |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `mto_brakes` | `Brakes & Hydraulic System` | `Does the vehicle stop straight and firmly without grinding, pulsating, brake warning lights, or a soft/spongy pedal?` | `15` | `"critical"` | `"brk_pads_rotors"` |
| 2 | `mto_tires` | `Tires, Wheels & Tread Depth` | `Do all four tires have at least 2.0 mm of tread depth with zero exposed cords, sidewall bulges, or missing lug nuts?` | `12` | `"critical"` | `"tir_mount_balance"` |
| 3 | `mto_front_steering` | `Front Steering & Suspension` | `Is the steering tight and responsive without clunking over bumps, excessive play, or leaking power steering fluid?` | `12` | `"critical"` | `"susp_front_end"` |
| 4 | `mto_rear_suspension` | `Rear Suspension & Subframe` | `Does the vehicle sit level at all four corners without broken coil/leaf springs, leaking shocks, or rear-end sway?` | `10` | `"major"` | `"tir_align_4whl"` |
| 5 | `mto_lighting` | `Lighting & Electrical Signals` | `Do all low/high beams, turn signals, hazard flashers, brake lamps, reverse lights, and license plate lamps work?` | `8` | `"major"` | `"diag_elec_parasitic"` |
| 6 | `mto_windshield` | `Windshield & Driver Glazing` | `Is the windshield sweep area free of cracks, star chips larger than 13 mm, or aftermarket tint obstructing vision?` | `9` | `"critical"` | `"safe_mto_ssc"` |
| 7 | `mto_wipers` | `Windshield Wipers & Washers` | `Do both front wipers clear the glass cleanly on all speeds and does the washer pump spray fluid onto the windshield?` | `5` | `"minor"` | `"safe_mto_ssc"` |
| 8 | `mto_horn` | `Horn & Audible Warning` | `Does the horn sound loudly and reliably when pressed from the steering wheel pad?` | `5` | `"minor"` | `"diag_elec_parasitic"` |
| 9 | `mto_mirrors` | `Rearview & Side Mirrors` | `Are the interior rearview mirror and exterior driver/passenger mirrors securely mounted and free of cracked glass?` | `6` | `"minor"` | `"safe_mto_ssc"` |
| 10 | `mto_exhaust` | `Exhaust & Emissions Integrity` | `Is the exhaust quiet and completely free of leaks, missing heat shields, or fumes entering the passenger cabin?` | `9` | `"critical"` | `"exh_muffler_pipe"` |
| 11 | `mto_body` | `Body Structure, Latches & Frame` | `Do all doors, hood, trunk, and seatbelts latch securely with zero perforated rust holes in the floor pan or rocker panels?` | `9` | `"critical"` | `"safe_mto_ssc"` |

*(Note: Every `recommendedServiceId` on `MTO_SSC_CHECKLIST_ITEMS` must match an existing ID in `SERVICE_CATALOG`.)*

##### C. `WORK_ORDER_STATES` & `SEED_WORK_ORDERS`
- **`WORK_ORDER_STATES`** (frozen array of 6 state strings in lifecycle order):
  ```javascript
  Object.freeze([
    "CHECKED_IN",
    "ON_HOIST_DIAGNOSTICS",
    "PARTS_ORDERED",
    "IN_REPAIR_BAY",
    "QUALITY_ROAD_TEST",
    "READY_FOR_PICKUP"
  ]);
  ```
- **`SEED_WORK_ORDERS`** (frozen array of 3 sample work orders):
  1. **`REV-2048`**:
     - `code`: `"REV-2048"`
     - `customerName`: `"Marcus Vance"`
     - `phone`: `"905-555-0148"`
     - `licensePlate`: `"BVXK 482"`
     - `vehicle`: `"2019 Honda Civic Touring (sedan)"`
     - `vehicleType`: `"sedan"`
     - `serviceIds`: `["brk_pads_rotors", "tir_align_4whl"]`
     - `currentState`: `"IN_REPAIR_BAY"`
     - `bayNumber`: `"Bay 2"`
     - `technicianName`: `"Devon K. (310S Red Seal)"`
     - `technicianNotes`: `"Front and rear ceramic pads & coated rotors installed; caliper slides lubricated. Moving to 4-wheel laser alignment rack next."`
     - `estimatedTotal`: `615.84`
     - `createdAt`: `"2025-05-12T08:30:00.000Z"`
     - `updatedAt`: `"2025-05-12T10:45:00.000Z"`
  2. **`REV-3105`**:
     - `code`: `"REV-3105"`
     - `customerName`: `"Priya Grewal"`
     - `phone`: `"905-555-0192"`
     - `licensePlate`: `"CJDK 905"`
     - `vehicle`: `"2021 Ford F-150 XLT (truck_van)"`
     - `vehicleType`: `"truck_van"`
     - `serviceIds`: `["diag_computer_scan", "tune_spark_induction"]`
     - `currentState`: `"PARTS_ORDERED"`
     - `bayNumber`: `"Bay 4"`
     - `technicianName`: `"Tariq M. (310S Diagnostic Lead)"`
     - `technicianNotes`: `"Confirmed Cylinder #4 ignition coil secondary breakdown and worn iridium plugs. OEM Motorcraft coil & plug set en route from Brampton distributor (ETA 45 mins)."`
     - `estimatedTotal`: `512.45`
     - `createdAt`: `"2025-05-12T09:15:00.000Z"`
     - `updatedAt`: `"2025-05-12T11:10:00.000Z"`
  3. **`REV-4092`**:
     - `code`: `"REV-4092"`
     - `customerName`: `"Elena Rostova"`
     - `phone`: `"416-555-0177"`
     - `licensePlate`: `"DTRM 118"`
     - `vehicle`: `"2020 Toyota RAV4 XLE (suv_crossover)"`
     - `vehicleType`: `"suv_crossover"`
     - `serviceIds`: `["safe_mto_ssc", "oil_full_synthetic"]`
     - `currentState`: `"READY_FOR_PICKUP"`
     - `bayNumber`: `"Front Lot — Ready Stall 1"`
     - `technicianName`: `"Devon K. (310S Red Seal)"`
     - `technicianNotes`: `"Ontario MTO Safety Standards Inspection passed (all pads > 7mm, tires 6/32\"). Full synthetic 0W-20 oil service complete. Signed SSC certificate waiting at front desk."`
     - `estimatedTotal`: `276.84`
     - `createdAt`: `"2025-05-12T07:45:00.000Z"`
     - `updatedAt`: `"2025-05-12T11:30:00.000Z"`

#### 1.3 Exact Pure Function Contracts

##### 1. `evaluateDiagnosticWizard(answersObject)`
- **Input Schema:** `answersObject` (object, may be null/undefined/empty). Supports three flexible resolution modes in priority order:
  1. Direct terminal reference: `{ terminalNodeId: "term_..." }` or `{ nodeId: "term_..." }`.
  2. Tree traversal: `{ category: "<option.value>", symptom: "<option.value>" }` (or `answersObject.path` array of option values) walking `DIAGNOSTIC_DECISION_TREE.nodes` starting at `DIAGNOSTIC_DECISION_TREE.rootNodeId`.
  3. Direct shorthand flags/keywords for emergency override: if `answersObject.flashingWarningLight === true` or `answersObject.brakeFailure === true` or `answersObject.overheating === true`, routes immediately to the corresponding `"tow_now"` terminal node.
- **Fallback Behavior:** If `answersObject` is missing, malformed, or stops at an incomplete non-terminal branch, return a deterministic fallback result:
  - `triageLevel`: `"routine_inspect"` (or if `category === "warning_light"` / `category === "braking_noise"`, `"schedule_urgent"`)
  - `likelyCauses`: `["Requires hands-on hoist & OBD-II computer diagnostic inspection to isolate root cause"]`
  - `recommendedServiceId`: `"diag_computer_scan"`
  - `technicianNotes`: `"Customer symptom selection incomplete or general; perform baseline computer diagnostic scan and road test."`
- **Return Contract:**
  ```javascript
  {
    triageLevel: "tow_now" | "schedule_urgent" | "routine_inspect",
    likelyCauses: string[],          // Non-empty array of strings
    recommendedServiceId: string,    // Guaranteed valid ID in SERVICE_CATALOG
    technicianNotes: string          // Non-empty string
  }
  ```

##### 2. `evaluateSafetyPreCheck(answersObject)`
- **Input Schema:** `answersObject` mapping each MTO item `id` (from `MTO_SSC_CHECKLIST_ITEMS`) to a boolean or status string:
  - Passing values: `true`, `"pass"`, `"yes"`, `"ok"`
  - Failing values: `false`, `"fail"`, `"no"`, `"defect"`
  - Unanswered/advisory values: `undefined`, `null`, `"unsure"`, `"unknown"`
- **Scoring & Classification Formula:**
  - Total possible weight = $\sum \text{item.weight} = 100$.
  - For each item in `MTO_SSC_CHECKLIST_ITEMS`:
    - If explicitly passed (`true` / `"pass"` / `"yes"`): award `100%` of `item.weight`.
    - If unanswered/unsure (`undefined` / `null` / `"unsure"`): award `50%` of `item.weight` (`item.weight * 0.5`) and record as advisory.
    - If explicitly failed (`false` / `"fail"` / `"no"`): award `0` points; if `item.severity === "critical"`, push `{ id: item.id, areaLabel: item.areaLabel, severity: item.severity, recommendedServiceId: item.recommendedServiceId }` (or the item ID/label; to satisfy both string and object consumers cleanly, store `criticalFailures` as an array of objects `{ id, areaLabel, severity, recommendedServiceId }` with a custom `toString()` returning `id`, OR check how tests inspect `criticalFailures`—let's specify exact object structure `{ id, areaLabel, severity, recommendedServiceId }` and deduplicated `recommendedServices` array of valid `SERVICE_CATALOG` service IDs).
  - `scorePercentage`: `Math.round((earnedWeight / totalWeight) * 100)` clamped to `[0, 100]`.
  - **Status Determination Rules:**
    1. If `answersObject` is empty/null (`Object.keys(answersObject).length === 0`), return `scorePercentage: 0`, `status: "advisory"`, `criticalFailures: []`, `recommendedServices: ["safe_mto_ssc"]`.
    2. **Auto-Fail Rule:** If `criticalFailures.length > 0` OR `scorePercentage < 70`, `status = "fail"`.
    3. **Advisory Rule:** Else if any item failed (major/minor) OR any item was left unanswered/unsure OR `scorePercentage < 100`, `status = "advisory"`.
    4. **Pass Rule:** Else (all 11 items explicitly passed, `scorePercentage === 100` and `criticalFailures.length === 0`), `status = "pass"`.
  - `recommendedServices`: Deduplicated array of `recommendedServiceId` strings for all failed/unsure items; always includes `"safe_mto_ssc"` if not already present when `status !== "pass"`, or includes `"safe_mto_ssc"` as the final certification service.
- **Return Contract:**
  ```javascript
  {
    scorePercentage: number,         // Integer 0..100
    status: "pass" | "fail" | "advisory",
    criticalFailures: Array<{ id: string, areaLabel: string, severity: string, recommendedServiceId: string }>,
    recommendedServices: string[]    // Array of SERVICE_CATALOG IDs
  }
  ```

##### 3. `lookupWorkOrder(query, phoneOrPlate, customWorkOrders)`
- **Input Schema:**
  - `query`: string (Work order code e.g. `"rev-2048"`, `"2048"`, or direct phone/plate when single-argument search is used).
  - `phoneOrPlate`: optional string (secondary verification filter or primary search term if `query` is empty).
  - `customWorkOrders`: optional array of dynamic work orders (merged with `SEED_WORK_ORDERS`, with `customWorkOrders` taking precedence on matching `code`).
- **Normalization Rules:**
  - **Work Order Code Normalization:** Trim, uppercase, strip spaces (`" rev - 2048 "` $\rightarrow$ `"REV-2048"`; if a bare 4-digit number `"2048"` is passed, normalize to `"REV-2048"`).
  - **Phone Normalization:** Strip all non-digits (`"(905) 555-0148"` $\rightarrow$ `"9055550148"`); allow matching full 10 digits or last 4 digits (`"0148"`) when paired with a valid code.
  - **License Plate Normalization:** Trim, uppercase, strip all spaces and hyphens (`"bvxk-482"` $\rightarrow$ `"BVXK482"`).
- **Matching Logic:**
  1. If both `query` and `phoneOrPlate` are empty/non-strings, return `null`.
  2. Search pool = `[...(Array.isArray(customWorkOrders) ? customWorkOrders : []), ...SEED_WORK_ORDERS]`.
  3. If `query` matches a work order `code`:
     - If `phoneOrPlate` is non-empty, verify that `phoneOrPlate` matches the work order's normalized `phone` (full or last 4 digits) OR normalized `licensePlate`. If `phoneOrPlate` is provided and mismatches both, return `null`.
     - If `phoneOrPlate` is omitted/empty, return the matched work order directly.
  4. If `query` is not a work order code (or is empty), check if `query` or `phoneOrPlate` matches a work order's normalized `phone` (full 10-digit) or normalized `licensePlate`.
  5. Return a shallow copy/reference of the matched work order object, or `null` if no match is found.

##### 4. `createWorkOrder(bookingPayload, estimatePayload, options)`
- **Input Schema:**
  - `bookingPayload`: `{ customerName, phone, email, vehicleInfo, vehicleType, licensePlate, preferredDate, preferredTime, serviceIds, notes }`
  - `estimatePayload`: optional output of `calculateEstimate` (`{ grandTotal, selectedServices, ... }`) or `{ estimatedTotal }`.
  - `options`: optional `{ nowTimestamp, existingCodes }` for 100% deterministic unit testing without mocking global `Date`.
- **Deterministic Code Generation (`REV-XXXX`):**
  - Derive a deterministic 4-digit numeric suffix (`1000`–`9999`) by hashing `(customerName + phone + preferredDate + preferredTime + (options?.nowTimestamp || ""))`, or if collision occurs against `SEED_WORK_ORDERS` (`2048`, `3105`, `4092`) or `options?.existingCodes`, increment until a collision-free `REV-XXXX` code is produced.
- **Return Contract:**
  ```javascript
  {
    code: "REV-XXXX",                // Guaranteed /^REV-\d{4}$/ and not in SEED_WORK_ORDERS
    customerName: string,
    phone: string,
    licensePlate: string,
    vehicle: string,
    vehicleType: string,
    serviceIds: string[],
    currentState: "CHECKED_IN",      // Initial state is always CHECKED_IN
    bayNumber: "Bay 1 (Reception)",
    technicianName: "Pending Dispatch (310S Team)",
    technicianNotes: string,
    estimatedTotal: number,
    createdAt: string,               // ISO-8601 timestamp
    updatedAt: string                // ISO-8601 timestamp
  }
  ```

#### 1.4 Segment 1 Acceptance Criteria & Verification Gate
- All 91 Phase 1 tests pass unchanged.
- 26 new unit tests (`Test 92`–`Test 117`) pass, covering:
  - Deep freeze verification on `DIAGNOSTIC_DECISION_TREE`, `MTO_SSC_CHECKLIST_ITEMS`, `WORK_ORDER_STATES`, `SEED_WORK_ORDERS`.
  - `MTO_SSC_CHECKLIST_ITEMS` has exactly 11 items, weights sum to `100`, all `recommendedServiceId` values exist in `SERVICE_CATALOG`.
  - `SEED_WORK_ORDERS` contains `REV-2048` (`IN_REPAIR_BAY`), `REV-3105` (`PARTS_ORDERED`), and `REV-4092` (`READY_FOR_PICKUP`).
  - `evaluateDiagnosticWizard` produces `"tow_now"`, `"schedule_urgent"`, and `"routine_inspect"` outcomes accurately and handles empty/invalid inputs gracefully.
  - `evaluateSafetyPreCheck` returns `100` / `"pass"` when all 11 items pass, returns `"fail"` when a single critical item (e.g. `mto_brakes`) fails despite `85%` score, and returns `0` / `"fail"` when all items fail.
  - `lookupWorkOrder` matches by code (`"rev-2048"`), license plate (`"bvxk 482"`), phone (`"(905) 555-0192"`), rejects mismatched secondary verification, and returns `null` for unknown queries.
  - `createWorkOrder` generates a valid `REV-XXXX` code that never collides with seed codes, initializes `currentState: "CHECKED_IN"`, and preserves deterministic timestamps when `options.nowTimestamp` is supplied.
- **CLI Gate Command:**
  ```
  node test_revolutions.js
  ```

---

### SEGMENT 2 — PHASE 2 UI SECTIONS (`index.html` + `styles.css` + `test_revolutions.js`)

#### 2.1 File Inventory (Maximum 3 Files Rule: 3 Files Touched)
1. `index.html` — Insert the three Phase 2 interactive sections (`Diagnostic Wizard`, `Ontario Safety Standards Pre-Check`, and `Live Bay Tracker`) with all 16 required DOM IDs verbatim.
2. `styles.css` — Add responsive Midas-industrial styling for the wizard step indicator, option cards, triage badges (`tow_now` crimson pulse, `schedule_urgent` amber-gold, `routine_inspect` steel-green), MTO checklist toggles, circular/bar safety score gauge, and 6-step horizontal/vertical bay status timeline.
3. `test_revolutions.js` — Append **15 new DOM & CSS verification assertions** (`Test 118` through `Test 132`) verifying every verbatim Phase 2 DOM ID and CSS rule group.

#### 2.2 Verbatim DOM ID Specification Table
Every ID listed below must exist in `index.html` with exact spelling and casing:

| Section | Exact DOM Selector / ID | HTML Element | Semantic Purpose & Accessibility Role |
| :--- | :--- | :--- | :--- |
| **Diagnostic Wizard** | `#wizard-container` | `<div id="wizard-container">` | Outer interactive container for the multi-step symptom-to-diagnostic wizard (`role="region"`, `aria-labelledby`) |
| **Diagnostic Wizard** | `#wizard-step-indicator` | `<div id="wizard-step-indicator">` | Displays current step progress (e.g., `"Step 1 of 2 — Select Primary Symptom"`) with `aria-live="polite"` |
| **Diagnostic Wizard** | `#wizard-options` | `<div id="wizard-options">` | Dynamic button/radio-card group rendering options for the active `DIAGNOSTIC_DECISION_TREE` node |
| **Diagnostic Wizard** | `#wizard-result-card` | `<div id="wizard-result-card">` | Displays triage badge (`tow_now` / `schedule_urgent` / `routine_inspect`), likely causes, recommended service, and technician notes |
| **Diagnostic Wizard** | `#btn-wizard-add-service` | `<button id="btn-wizard-add-service" type="button">` | Action button inside result card that checks the recommended service in the Phase 1 estimator and scrolls to `#estimator` |
| **MTO Safety Pre-Check** | `#safety-checklist-container` | `<div id="safety-checklist-container">` | Container rendering all 11 Ontario MTO SSC inspection items with Pass / Fail / Unsure controls |
| **MTO Safety Pre-Check** | `#safety-score-gauge` | `<div id="safety-score-gauge">` | Live visual readiness meter displaying `0%`–`100%` score and MTO status badge (`PASS` / `ADVISORY` / `FAIL`) |
| **MTO Safety Pre-Check** | `#safety-summary-alert` | `<div id="safety-summary-alert">` | Alert banner listing any critical MTO auto-fail items and recommended corrective services (`aria-live="polite"`) |
| **MTO Safety Pre-Check** | `#btn-safety-book-inspection` | `<button id="btn-safety-book-inspection" type="button">` | Pre-selects `"safe_mto_ssc"` plus any failed corrective services and scrolls smoothly to the booking form |
| **Live Bay Tracker** | `#tracker-input-code` | `<input id="tracker-input-code" type="text">` | Text input for work order code (e.g. `REV-2048`) |
| **Live Bay Tracker** | `#tracker-input-phone` | `<input id="tracker-input-phone" type="text">` | Text input for customer phone number or Ontario license plate verification |
| **Live Bay Tracker** | `#btn-track-vehicle` | `<button id="btn-track-vehicle" type="button">` | Triggers `lookupWorkOrder` and updates the timeline and technician notes panel |
| **Live Bay Tracker** | `#tracker-status-timeline` | `<ol id="tracker-status-timeline">` | 6-stage visual progress bar representing `WORK_ORDER_STATES` (`CHECKED_IN` through `READY_FOR_PICKUP`) |
| **Live Bay Tracker** | `#tracker-technician-notes` | `<div id="tracker-technician-notes">` | Displays customer vehicle summary, assigned Red Seal technician, bay number, estimated total, and live bay notes |
| **Live Bay Tracker** | `#btn-track-sample-1` | `<button id="btn-track-sample-1" type="button">` | Quick-demo button that populates and tracks `REV-2048` (`IN_REPAIR_BAY`) |
| **Live Bay Tracker** | `#btn-track-sample-2` | `<button id="btn-track-sample-2" type="button">` | Quick-demo button that populates and tracks `REV-3105` (`PARTS_ORDERED`) |

#### 2.3 Segment 2 Acceptance Criteria & Verification Gate
- All 117 assertions from Phase 1 + Phase 2 Segment 1 remain green.
- 15 new assertions (`Test 118`–`Test 132`) verify:
  - Presence of all 5 Diagnostic Wizard DOM IDs in `index.html`.
  - Presence of all 4 Ontario MTO Safety Pre-Check DOM IDs in `index.html`.
  - Presence of all 7 Live Bay Tracker DOM IDs in `index.html`.
  - Presence of navigation links to the new Phase 2 sections and responsive CSS classes in `styles.css`.
- **CLI Gate Command:**
  ```
  node test_revolutions.js
  ```

---

### SEGMENT 3 — INTERACTIVE WIRING (`app.js` + ANTI-DRIFT TESTS in `test_revolutions.js`)

#### 3.1 File Inventory (Maximum 3 Files Rule: 2 Files Touched)
1. `app.js` — Wire the Diagnostic Wizard, MTO Safety Pre-Check, Live Bay Tracker, Appointment-to-Tracker bridge, and `localStorage` persistence (`revolutions_automotive_state_v1`).
2. `test_revolutions.js` — Append **10 new controller & bidirectional anti-drift assertions** (`Test 133` through `Test 142`).

#### 3.2 Controller Wiring Specification (`app.js`)

1. **State Schema Extension (`revolutions_automotive_state_v1`):**
   - Preserve existing keys (`vehicleType`, `selectedServiceIds`, `couponCode`, `selectedSymptoms`, `appointments`).
   - Add Phase 2 keys with safe fallbacks:
     - `wizardAnswers`: `{}` (current wizard path)
     - `wizardCurrentNodeId`: `"step_category"`
     - `safetyAnswers`: `{}` (map of `mto_*` item IDs to `true | false`)
     - `workOrders`: `[]` (array of user-created work orders from booking submissions)
     - `activeTrackedCode`: `"REV-2048"` (default initial display in tracker)

2. **Diagnostic Wizard Controller (`initDiagnosticWizard`):**
   - Renders the current node from `RevolutionsEngine.DIAGNOSTIC_DECISION_TREE` into `#wizard-step-indicator` and `#wizard-options`.
   - Clicking an option records `[node.answerKey]: option.value` in `state.wizardAnswers` and advances `state.wizardCurrentNodeId` to `option.nextNodeId`.
   - Includes a `"Start Over / Reset Wizard"` control inside `#wizard-step-indicator` or `#wizard-options` when past step 1.
   - When a terminal node is reached, invokes `RevolutionsEngine.evaluateDiagnosticWizard(state.wizardAnswers)` and renders the outcome inside `#wizard-result-card`, storing `data-recommended-service-id` on `#btn-wizard-add-service`.
   - Clicking `#btn-wizard-add-service` adds `recommendedServiceId` to `state.selectedServiceIds`, triggers estimator recalculation, saves state, and scrolls to the estimator section.

3. **Ontario MTO Safety Pre-Check Controller (`initSafetyPreCheck`):**
   - Dynamically renders all 11 items from `RevolutionsEngine.MTO_SSC_CHECKLIST_ITEMS` inside `#safety-checklist-container`, each with Pass (`true`) and Fail (`false`) interactive toggle buttons.
   - On any toggle change, updates `state.safetyAnswers[item.id]`, calls `RevolutionsEngine.evaluateSafetyPreCheck(state.safetyAnswers)`, and updates `#safety-score-gauge` and `#safety-summary-alert`.
   - Clicking `#btn-safety-book-inspection` adds `"safe_mto_ssc"` plus all `evaluation.recommendedServices` into `state.selectedServiceIds`, recalculates the estimate, syncs the booking form, and scrolls to `#booking-form`.

4. **Live Bay Tracker Controller (`initBayTracker`) & Booking Integration:**
   - Renders the 6 states from `RevolutionsEngine.WORK_ORDER_STATES` inside `#tracker-status-timeline`, marking states prior to `workOrder.currentState` as completed (`is-complete`), `workOrder.currentState` as active (`is-active`), and subsequent states as pending (`is-pending`).
   - Renders technician details, bay number, vehicle description, service list, and `technicianNotes` inside `#tracker-technician-notes`.
   - Clicking `#btn-track-vehicle` reads `#tracker-input-code` and `#tracker-input-phone`, invokes `RevolutionsEngine.lookupWorkOrder(codeInput, phoneInput, state.workOrders)`, and renders either the matched work order or a clear "Work Order Not Found" message inside `#tracker-technician-notes`.
   - Clicking `#btn-track-sample-1` populates `#tracker-input-code` with `"REV-2048"`, clears `#tracker-input-phone`, and renders `REV-2048`.
   - Clicking `#btn-track-sample-2` populates `#tracker-input-code` with `"REV-3105"`, clears `#tracker-input-phone`, and renders `REV-3105`.
   - **Appointment-to-Tracker Bridge:** When `#booking-form` is submitted and passes `RevolutionsEngine.validateBooking(payload)`, invoke `RevolutionsEngine.createWorkOrder(payload, currentEstimate)` to create a new work order, push it to `state.workOrders`, persist to `localStorage` (`revolutions_automotive_state_v1`), display the generated `REV-XXXX` code in the booking confirmation banner, and automatically load the new work order into the Live Bay Tracker (`#tracker-input-code`, `#tracker-status-timeline`, `#tracker-technician-notes`).

#### 3.3 Anti-Drift Verification Specification (`test_revolutions.js`)
- Extend the static anti-drift test block in `test_revolutions.js` with **10 new assertions** (`Test 133`–`Test 142`):
  1. Every `getElementById('...')` or `#id` selector queried in `app.js` (across both Phase 1 and Phase 2) exists verbatim as `id="..."` in `index.html`.
  2. All 16 Phase 2 required DOM IDs are referenced and wired inside `app.js`.
  3. `app.js` invokes `evaluateDiagnosticWizard`, `evaluateSafetyPreCheck`, `lookupWorkOrder`, and `createWorkOrder`.
  4. `app.js` persists `workOrders` under `revolutions_automotive_state_v1`.

#### 3.4 Segment 3 Acceptance Criteria & Verification Gate
- All 132 assertions from Segments 1 & 2 pass.
- All 10 new controller & anti-drift assertions (`Test 133`–`Test 142`) pass.
- Total test count reaches **142/142 PASSED**.
- **CLI Gate Command:**
  ```
  node test_revolutions.js
  ```

---

## STAGE 4 & 5: SEGMENTED IMPLEMENTATION & FULL VERIFICATION PROTOCOL

During execution by the implementation agent, each segment must be completed in strict sequence:
1. Edit only the files listed in that segment's File Inventory (never exceeding 3 files per segment).
2. Run `node test_revolutions.js` immediately at the end of each segment.
3. Do not proceed to the next segment until the current segment's gate reports `0 failed`.

---

## STAGE 6: ASSERTION INTEGRITY AUDIT GATE & MILESTONE COMMIT

### 6.1 Post-Segment 3 Independent Audit Specification
Upon completion of Segment 3, Gemini 4 Argon will perform a mandatory Stage 6 Assertion Integrity Audit verifying:
1. **Zero Test Deletion or Weakening:** All 91 Phase 1 assertions (`Test 1` through `Test 91`) remain intact in `test_revolutions.js` with identical assertion strictness (`assert.strictEqual`, `assert.deepStrictEqual`, `assert.ok`).
2. **Genuine Additive Coverage:** At least 25+ new assertions (51 planned: `91 -> 142`) genuinely test `DIAGNOSTIC_DECISION_TREE`, `MTO_SSC_CHECKLIST_ITEMS`, `SEED_WORK_ORDERS`, `evaluateDiagnosticWizard`, `evaluateSafetyPreCheck`, `lookupWorkOrder`, `createWorkOrder`, all 16 Phase 2 DOM IDs, and bidirectional `app.js` $\leftrightarrow$ `index.html` selector parity.
3. **Audit Verdict Line Requirement:** The post-implementation audit must emit `AUDIT VERDICT: PASS` (or `AUDIT VERDICT: FAIL`) followed by the standard Stage 6 audit line.
4. **Milestone Git Commit Sequence (Plain CLI Commands Only):**
   ```
   git status -s
   git add plans/PHASE2_ROADMAP.md revolutions_engine.js index.html styles.css app.js test_revolutions.js
   git commit -m "Phase 2 complete: diagnostic wizard, Ontario MTO safety pre-check, and live bay tracker (142 tests passing)"
   ```

### 6.2 Stage 6 Architectural Plan Audit Verdict
- Pre-existing Phase 1 assertions modified or weakened by this plan: **0**
- Planned additive assertions across Segments 1–3: **+51** (`91 -> 142`)
- Selector anti-drift coverage: **100% of Phase 1 and Phase 2 DOM IDs**

AUDIT VERDICT: PASS  
AUDIT: PASS - assertions intact, no weakening detected