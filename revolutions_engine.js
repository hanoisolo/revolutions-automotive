/*
 * Revolutions Automotive - Core estimation, booking and diagnostic engine.
 * Dual UMD module: window.RevolutionsEngine (browser) / module.exports (Node).
 * Pure JavaScript, zero dependencies.
 */
(function (root) {
  'use strict';

  function round2(value) {
    if (typeof value !== 'number' || !isFinite(value)) return 0;
    // Decimal half-up rounding with a tolerance that absorbs IEEE-754 noise.
    return Math.floor(value * 100 + 0.5 + 1e-9) / 100;
  }

  var SHOP_INFO = Object.freeze({
    name: 'Revolutions Automotive',
    tagline: "Brampton's Trusted Domestic & Import Repair, Diagnostics & Safety Centre",
    address: '1-15A Fisherman Dr',
    city: 'Brampton',
    province: 'ON',
    postalCode: 'L7A 1B7',
    fullAddress: '1-15A Fisherman Dr, Brampton, ON L7A 1B7',
    phone: '(905) 846-8351',
    phoneTel: '+19058468351',
    currency: 'CAD',
    hstRate: 0.13,
    shopSuppliesRate: 0.05,
    shopSuppliesCap: 35,
    hours: Object.freeze({
      monday: Object.freeze({ open: '08:00', close: '18:00', closed: false }),
      tuesday: Object.freeze({ open: '08:00', close: '18:00', closed: false }),
      wednesday: Object.freeze({ open: '08:00', close: '18:00', closed: false }),
      thursday: Object.freeze({ open: '08:00', close: '18:00', closed: false }),
      friday: Object.freeze({ open: '08:00', close: '18:00', closed: false }),
      saturday: Object.freeze({ open: '08:30', close: '15:00', closed: false }),
      sunday: Object.freeze({ open: null, close: null, closed: true })
    }),
    specialties: Object.freeze([
      'Auto Repairs',
      'Auto Maintenance',
      'Automobile Air Conditioning (R134a & R1234yf)',
      'Oil Change (Synthetic & Conventional)',
      'State-of-the-Art Computer Diagnostics & Repair',
      'Auto Tune-Ups',
      '4-Wheel Laser Alignments',
      'Brake Services',
      'Tires (Sales, Mounting, Balancing, Seasonal Swap)',
      'Suspensions & Steering',
      'Exhaust Systems',
      'Ontario Safety Standards Certificates (MTO SSC)'
    ])
  });

  var VEHICLE_MULTIPLIERS = Object.freeze({
    origin: Object.freeze({
      domestic: Object.freeze({
        label: 'Domestic (Ford, GM, Stellantis)',
        partsMultiplier: 1.00,
        laborMultiplier: 1.00
      }),
      asian_import: Object.freeze({
        label: 'Asian Import (Toyota, Honda, Mazda, Hyundai, Subaru, Nissan)',
        partsMultiplier: 1.08,
        laborMultiplier: 1.05
      }),
      euro_import: Object.freeze({
        label: 'European Import (BMW, Mercedes-Benz, Audi, VW, Volvo)',
        partsMultiplier: 1.25,
        laborMultiplier: 1.20
      })
    }),
    vehicleClass: Object.freeze({
      sedan: Object.freeze({
        label: 'Compact / Sedan / Coupe',
        partsMultiplier: 1.00,
        laborMultiplier: 1.00
      }),
      suv: Object.freeze({
        label: 'Crossover / Mid-Size SUV / Minivan',
        partsMultiplier: 1.12,
        laborMultiplier: 1.10
      }),
      truck: Object.freeze({
        label: 'Full-Size Pickup / Heavy SUV / Commercial Van',
        partsMultiplier: 1.20,
        laborMultiplier: 1.18
      })
    })
  });

  var SERVICE_CATALOG = Object.freeze([
    {
      id: 'brk_pads_rotors',
      name: 'Complete Front or Rear Brake Pads & Rotors',
      category: 'Brakes',
      basePartsLow: 210.00,
      basePartsHigh: 290.00,
      baseLaborLow: 150.00,
      baseLaborHigh: 210.00,
      durationHours: 2.0,
      warranty: '2-Year / 40,000 km',
      description: 'Premium ceramic pads, new rotors, caliper service and road test on one axle.',
      popular: true
    },
    {
      id: 'brk_fluid_caliper',
      name: 'Brake Fluid Flush & Caliper Service',
      category: 'Brakes',
      basePartsLow: 45.00,
      basePartsHigh: 70.00,
      baseLaborLow: 95.00,
      baseLaborHigh: 130.00,
      durationHours: 1.0,
      warranty: '1-Year / 20,000 km',
      description: 'Full brake fluid exchange, caliper slide service and anti-lock brake system check.',
      popular: false
    },
    {
      id: 'tir_align_4whl',
      name: '4-Wheel Computerized Laser Alignment',
      category: 'Tires & Alignment',
      basePartsLow: 0.00,
      basePartsHigh: 0.00,
      baseLaborLow: 129.99,
      baseLaborHigh: 149.99,
      durationHours: 1.2,
      warranty: '1-Year / 20,000 km',
      description: 'State-of-the-art 4-wheel laser alignment with before/after printout.',
      popular: true
    },
    {
      id: 'tir_mount_balance',
      name: 'Seasonal Tire Swap, Mount & Precision Balance (Set of 4)',
      category: 'Tires & Alignment',
      basePartsLow: 20.00,
      basePartsHigh: 40.00,
      baseLaborLow: 100.00,
      baseLaborHigh: 140.00,
      durationHours: 1.0,
      warranty: '1-Year / 20,000 km',
      description: 'Seasonal tire changeover, mounting, road-force balancing and TPMS relearn.',
      popular: true
    },
    {
      id: 'diag_computer_scan',
      name: 'State-of-the-Art OEM Computer Diagnostic & Pinpoint Test',
      category: 'Computer Diagnostics',
      basePartsLow: 0.00,
      basePartsHigh: 0.00,
      baseLaborLow: 130.00,
      baseLaborHigh: 160.00,
      durationHours: 1.0,
      warranty: 'Diagnostic fee credited toward repair',
      description: 'Full-system scan with OEM-level software, pinpoint test and technician report.',
      popular: true
    },
    {
      id: 'diag_elec_parasitic',
      name: 'Electrical System, Alternator & Parasitic Draw Diagnosis',
      category: 'Computer Diagnostics',
      basePartsLow: 15.00,
      basePartsHigh: 30.00,
      baseLaborLow: 145.00,
      baseLaborHigh: 190.00,
      durationHours: 1.5,
      warranty: 'Diagnostic fee credited toward repair',
      description: 'Charging system test and parasitic draw isolation for battery drain faults.',
      popular: false
    },
    {
      id: 'oil_full_synth',
      name: 'Full Synthetic Oil & Filter Change + 50-Point Inspection',
      category: 'Oil & Tune-Up',
      basePartsLow: 62.00,
      basePartsHigh: 85.00,
      baseLaborLow: 38.00,
      baseLaborHigh: 55.00,
      durationHours: 0.75,
      warranty: '90-Day / 5,000 km',
      description: 'Full synthetic oil and premium filter with a 50-point Midas-grade inspection.',
      popular: true
    },
    {
      id: 'tune_spark_induction',
      name: 'Complete Ignition Tune-Up (Iridium Plugs & Fuel Induction Clean)',
      category: 'Oil & Tune-Up',
      basePartsLow: 140.00,
      basePartsHigh: 195.00,
      baseLaborLow: 160.00,
      baseLaborHigh: 210.00,
      durationHours: 2.0,
      warranty: '2-Year / 40,000 km',
      description: 'Iridium spark plugs, ignition check and fuel/air induction system cleaning.',
      popular: false
    },
    {
      id: 'ac_evac_recharge',
      name: 'A/C System Evacuation, Leak Test & Refrigerant Recharge (R134a/R1234yf)',
      category: 'Air Conditioning',
      basePartsLow: 85.00,
      basePartsHigh: 120.00,
      baseLaborLow: 135.00,
      baseLaborHigh: 175.00,
      durationHours: 1.5,
      warranty: '1-Year / 20,000 km',
      description: 'Full A/C evacuation, electronic leak test and recharge with R134a or R1234yf.',
      popular: true
    },
    {
      id: 'ac_compressor_cond',
      name: 'A/C Compressor or Condenser Replacement Package',
      category: 'Air Conditioning',
      basePartsLow: 420.00,
      basePartsHigh: 650.00,
      baseLaborLow: 280.00,
      baseLaborHigh: 390.00,
      durationHours: 3.5,
      warranty: '2-Year / 40,000 km',
      description: 'Compressor or condenser replacement with receiver/drier, flush and recharge.',
      popular: false
    },
    {
      id: 'sus_strut_control',
      name: 'Front Strut, Ball Joint or Control Arm Replacement (Per Axle)',
      category: 'Suspension/Exhaust/Safety Certificate',
      basePartsLow: 260.00,
      basePartsHigh: 380.00,
      baseLaborLow: 220.00,
      baseLaborHigh: 300.00,
      durationHours: 2.5,
      warranty: '2-Year / 40,000 km',
      description: 'Strut, ball joint or control arm replacement per axle with alignment check.',
      popular: false
    },
    {
      id: 'mto_safety_exhaust',
      name: 'Ontario Safety Standards Certificate (MTO SSC) & Exhaust Inspection',
      category: 'Suspension/Exhaust/Safety Certificate',
      basePartsLow: 0.00,
      basePartsHigh: 0.00,
      baseLaborLow: 149.99,
      baseLaborHigh: 179.99,
      durationHours: 1.5,
      warranty: 'MTO certificate issued on pass',
      description: 'Full Ontario Safety Standards inspection with exhaust system check and MTO certificate on pass.',
      popular: true
    }
  ]);

  var COUPON_CATALOG = Object.freeze([
    {
      code: 'SYNTH15',
      title: '$15 Off Full Synthetic Oil Change',
      description: 'Save $15 on our full synthetic oil and filter change with 50-point inspection.',
      discountType: 'fixed',
      amount: 15.00,
      eligibleServiceIds: Object.freeze(['oil_full_synth']),
      prerequisiteServiceIds: null,
      requiresAdditionalRepair: false,
      minSpend: 0,
      badgeText: '$15 OFF'
    },
    {
      code: 'ALIGN25',
      title: '$25 Off 4-Wheel Alignment with Tire Service',
      description: 'Save $25 on a 4-wheel laser alignment when combined with any tire or suspension service.',
      discountType: 'fixed',
      amount: 25.00,
      eligibleServiceIds: Object.freeze(['tir_align_4whl']),
      prerequisiteServiceIds: Object.freeze(['tir_mount_balance', 'sus_strut_control']),
      requiresAdditionalRepair: false,
      minSpend: 0,
      badgeText: '$25 OFF'
    },
    {
      code: 'DIAG50',
      title: '50% Off Computer Diagnostic with Any Repair',
      description: 'Half off our OEM computer diagnostic when performed together with any repair service.',
      discountType: 'percentage_service_labor',
      amount: 0.5,
      eligibleServiceIds: Object.freeze(['diag_computer_scan', 'diag_elec_parasitic']),
      prerequisiteServiceIds: null,
      requiresAdditionalRepair: true,
      minSpend: 0,
      badgeText: '50% OFF'
    },
    {
      code: 'BRAKE50',
      title: '$50 Off Complete Front or Rear Brake Job',
      description: 'Save $50 on a complete front or rear brake pads and rotors job.',
      discountType: 'fixed',
      amount: 50.00,
      eligibleServiceIds: Object.freeze(['brk_pads_rotors']),
      prerequisiteServiceIds: null,
      requiresAdditionalRepair: false,
      minSpend: 250.00,
      badgeText: '$50 OFF'
    },
    {
      code: 'SAFETY10',
      title: '$10 Off Ontario Safety Standards Certificate',
      description: 'Save $10 on your MTO Safety Standards Certificate inspection.',
      discountType: 'fixed',
      amount: 10.00,
      eligibleServiceIds: Object.freeze(['mto_safety_exhaust']),
      prerequisiteServiceIds: null,
      requiresAdditionalRepair: false,
      minSpend: 0,
      badgeText: '$10 OFF'
    }
  ]);

  var SYMPTOM_CATALOG = Object.freeze([
    {
      key: 'squealing_brakes',
      label: 'Squealing or Grinding Brakes',
      urgency: 'HIGH',
      priority: 'HIGH - Safety Critical',
      recommendedServiceIds: Object.freeze(['brk_pads_rotors', 'brk_fluid_caliper']),
      technicianNote: 'Squealing or grinding under braking usually means worn pads contacting the rotors. Avoid highway driving and book a brake inspection right away.'
    },
    {
      key: 'pulling_steering',
      label: 'Vehicle Pulling / Uneven Tire Wear',
      urgency: 'MEDIUM',
      priority: 'MEDIUM - Alignment & Handling',
      recommendedServiceIds: Object.freeze(['tir_align_4whl', 'sus_strut_control']),
      technicianNote: 'Pulling or uneven tire wear points to alignment or worn steering and suspension components. A 4-wheel laser alignment and inspection will pinpoint the cause.'
    },
    {
      key: 'check_engine_light',
      label: 'Check Engine / Warning Light On',
      urgency: 'HIGH',
      priority: 'HIGH - Powertrain Diagnostics',
      recommendedServiceIds: Object.freeze(['diag_computer_scan', 'tune_spark_induction']),
      technicianNote: 'A check engine light stores trouble codes in the computer. We perform an OEM-level scan and pinpoint test before recommending any repair.'
    },
    {
      key: 'warm_ac',
      label: 'A/C Blowing Warm or Weak Air',
      urgency: 'MEDIUM',
      priority: 'MEDIUM - Climate Comfort',
      recommendedServiceIds: Object.freeze(['ac_evac_recharge', 'ac_compressor_cond']),
      technicianNote: 'Warm or weak A/C is usually low refrigerant or a leak. We evacuate, leak-test, and recharge with the correct R134a or R1234yf refrigerant.'
    },
    {
      key: 'clunking_bumps',
      label: 'Clunking Noise Over Bumps',
      urgency: 'HIGH',
      priority: 'HIGH - Suspension & Steering Safety',
      recommendedServiceIds: Object.freeze(['sus_strut_control', 'tir_align_4whl']),
      technicianNote: 'Clunking over bumps suggests worn struts, ball joints, or control arms. This affects steering control and should be inspected promptly.'
    },
    {
      key: 'loud_exhaust',
      label: 'Loud Exhaust Roar or Rattling',
      urgency: 'MEDIUM',
      priority: 'MEDIUM - Exhaust & Emissions',
      recommendedServiceIds: Object.freeze(['mto_safety_exhaust', 'diag_computer_scan']),
      technicianNote: 'A loud exhaust roar or rattle can mean a leaking manifold, pipe, or muffler, and can affect an Ontario safety inspection.'
    },
    {
      key: 'buying_used_car',
      label: 'Buying / Registering a Used Vehicle',
      urgency: 'HIGH',
      priority: 'HIGH - Ontario MTO Compliance',
      recommendedServiceIds: Object.freeze(['mto_safety_exhaust', 'oil_full_synth']),
      technicianNote: 'Registering a used vehicle in Ontario requires a Safety Standards Certificate. We also recommend a fresh oil change and full inspection before registration.'
    },
    {
      key: 'overdue_oil',
      label: 'Overdue for an Oil Change',
      urgency: 'MEDIUM',
      priority: 'MEDIUM - Engine Protection',
      recommendedServiceIds: Object.freeze(['oil_full_synth', 'tune_spark_induction']),
      technicianNote: 'Overdue oil changes accelerate engine wear. A full synthetic oil and filter change with our 50-point inspection protects the engine.'
    }
  ]);

  function findService(serviceId) {
    for (var i = 0; i < SERVICE_CATALOG.length; i++) {
      if (SERVICE_CATALOG[i].id === serviceId) return SERVICE_CATALOG[i];
    }
    return null;
  }

  function findCoupon(code) {
    for (var i = 0; i < COUPON_CATALOG.length; i++) {
      if (COUPON_CATALOG[i].code === code) return COUPON_CATALOG[i];
    }
    return null;
  }

  function findSymptom(key) {
    for (var i = 0; i < SYMPTOM_CATALOG.length; i++) {
      if (SYMPTOM_CATALOG[i].key === key) return SYMPTOM_CATALOG[i];
    }
    return null;
  }

  function resolveServices(serviceIds) {
    var seen = {};
    var out = [];
    for (var i = 0; i < serviceIds.length; i++) {
      var id = serviceIds[i];
      if (!seen[id]) {
        seen[id] = true;
        var svc = findService(id);
        if (svc) out.push(svc);
      }
    }
    return out;
  }

  function normalizeCouponCode(code) {
    if (typeof code !== 'string') return null;
    var normalized = code.trim().toUpperCase();
    return normalized.length > 0 ? normalized : null;
  }

  function eligibleNames(coupon) {
    return coupon.eligibleServiceIds
      .map(function (id) { var s = findService(id); return s ? s.name : id; })
      .join(' or ');
  }

  /*
   * calculateEstimate(options)
   * options: {
   *   serviceIds: string[],
   *   origin: 'domestic' | 'asian_import' | 'euro_import',   (default 'domestic')
   *   vehicleClass: 'sedan' | 'suv' | 'truck',                (default 'sedan')
   *   couponCode: string | null
   * }
   */
  function calculateEstimate(options) {
    options = options || {};
    var rawIds = Array.isArray(options.serviceIds) ? options.serviceIds : [];
    var originKey = VEHICLE_MULTIPLIERS.origin[options.origin] ? options.origin : 'domestic';
    var classKey = VEHICLE_MULTIPLIERS.vehicleClass[options.vehicleClass] ? options.vehicleClass : 'sedan';
    var originObj = VEHICLE_MULTIPLIERS.origin[originKey];
    var classObj = VEHICLE_MULTIPLIERS.vehicleClass[classKey];
    var partsMult = originObj.partsMultiplier * classObj.partsMultiplier;
    var laborMult = originObj.laborMultiplier * classObj.laborMultiplier;

    var services = resolveServices(rawIds);
    var couponCode = normalizeCouponCode(options.couponCode);
    var coupon = couponCode ? findCoupon(couponCode) : null;

    if (services.length === 0) {
      return {
        serviceCount: 0,
        lineItems: [],
        origin: originKey,
        vehicleClass: classKey,
        combinedPartsMultiplier: partsMult,
        combinedLaborMultiplier: laborMult,
        partsLow: 0, partsHigh: 0,
        laborLow: 0, laborHigh: 0,
        comboDiscountRate: 0,
        comboDiscountLow: 0, comboDiscountHigh: 0,
        netLaborLow: 0, netLaborHigh: 0,
        shopSuppliesLow: 0, shopSuppliesHigh: 0,
        couponCode: couponCode,
        couponApplied: false,
        couponDiscount: 0,
        couponDiscountLow: 0, couponDiscountHigh: 0,
        couponMessage: 'No services selected.',
        totalDiscountLow: 0, totalDiscountHigh: 0,
        subtotalLow: 0, subtotalHigh: 0,
        hstRate: SHOP_INFO.hstRate,
        hstLow: 0, hstHigh: 0,
        totalLow: 0, totalHigh: 0,
        estimatedDurationHours: 0,
        currency: 'CAD'
      };
    }

    var comboDiscountRate = services.length >= 3 ? 0.15 : (services.length === 2 ? 0.10 : 0);

    var partsTotals = { low: 0, high: 0 };
    var laborTotals = { low: 0, high: 0 };
    var durationTotal = 0;
    var lineItems = [];

    services.forEach(function (svc) {
      var adjPartsLow = round2(svc.basePartsLow * partsMult);
      var adjPartsHigh = round2(svc.basePartsHigh * partsMult);
      var adjLaborLow = round2(svc.baseLaborLow * laborMult);
      var adjLaborHigh = round2(svc.baseLaborHigh * laborMult);
      partsTotals.low += adjPartsLow;
      partsTotals.high += adjPartsHigh;
      laborTotals.low += adjLaborLow;
      laborTotals.high += adjLaborHigh;
      durationTotal += svc.durationHours;
      lineItems.push({
        serviceId: svc.id,
        name: svc.name,
        category: svc.category,
        partsLow: adjPartsLow,
        partsHigh: adjPartsHigh,
        laborLow: adjLaborLow,
        laborHigh: adjLaborHigh,
        durationHours: svc.durationHours,
        popular: !!svc.popular
      });
    });

    function rangeResult(parts, labor) {
      var combo = round2(labor * comboDiscountRate);
      var net = round2(labor - combo);
      var supplies = Math.min(SHOP_INFO.shopSuppliesCap, round2(net * SHOP_INFO.shopSuppliesRate));
      var preCoupon = round2(parts + net + supplies);
      return {
        parts: round2(parts),
        labor: round2(labor),
        combo: combo,
        net: net,
        supplies: supplies,
        preCoupon: preCoupon
      };
    }

    var low = rangeResult(partsTotals.low, laborTotals.low);
    var high = rangeResult(partsTotals.high, laborTotals.high);

    var couponApplied = false;
    var couponMessage = 'No coupon selected.';
    var couponDiscountLow = 0;
    var couponDiscountHigh = 0;

    if (couponCode && !coupon) {
      couponMessage = 'Coupon code "' + couponCode + '" is not recognized.';
    } else if (coupon) {
      var selectedIds = services.map(function (svc) { return svc.id; });
      var eligiblePresent = coupon.eligibleServiceIds.some(function (id) {
        return selectedIds.indexOf(id) !== -1;
      });
      var prereqOk = !coupon.prerequisiteServiceIds || coupon.prerequisiteServiceIds.some(function (id) {
        return selectedIds.indexOf(id) !== -1;
      });
      var repairOk = !coupon.requiresAdditionalRepair || services.length >= 2;
      var minOk = low.preCoupon >= coupon.minSpend;

      if (!eligiblePresent) {
        couponMessage = 'Coupon ' + coupon.code + ' requires service: ' + eligibleNames(coupon) + '.';
      } else if (!prereqOk) {
        couponMessage = 'Coupon ' + coupon.code + ' requires 4-Wheel Alignment combined with a tire or suspension service.';
      } else if (!repairOk) {
        couponMessage = 'Coupon ' + coupon.code + ' requires the diagnostic to be paired with at least one repair service.';
      } else if (!minOk) {
        couponMessage = 'Coupon ' + coupon.code + ' requires a minimum pre-discount spend of $' + coupon.minSpend.toFixed(2) + ' CAD.';
      } else {
        couponApplied = true;
        couponMessage = 'Coupon ' + coupon.code + ' applied - ' + coupon.title + '.';
        if (coupon.discountType === 'fixed') {
          couponDiscountLow = coupon.amount;
          couponDiscountHigh = coupon.amount;
        } else if (coupon.discountType === 'percentage_service_labor') {
          var targetId = selectedIds.indexOf('diag_computer_scan') !== -1
            ? 'diag_computer_scan'
            : coupon.eligibleServiceIds.filter(function (id) { return selectedIds.indexOf(id) !== -1; })[0];
          var targetLine = lineItems.filter(function (li) { return li.serviceId === targetId; })[0];
          if (targetLine) {
            couponDiscountLow = round2(targetLine.laborLow * coupon.amount);
            couponDiscountHigh = round2(targetLine.laborHigh * coupon.amount);
          }
        }
      }
    }

    var subtotalLow = Math.max(0, round2(low.preCoupon - couponDiscountLow));
    var subtotalHigh = Math.max(0, round2(high.preCoupon - couponDiscountHigh));
    var hstLow = round2(subtotalLow * SHOP_INFO.hstRate);
    var hstHigh = round2(subtotalHigh * SHOP_INFO.hstRate);
    var totalLow = round2(subtotalLow + hstLow);
    var totalHigh = round2(subtotalHigh + hstHigh);

    return {
      serviceCount: services.length,
      lineItems: lineItems,
      origin: originKey,
      vehicleClass: classKey,
      combinedPartsMultiplier: partsMult,
      combinedLaborMultiplier: laborMult,
      partsLow: low.parts,
      partsHigh: high.parts,
      laborLow: low.labor,
      laborHigh: high.labor,
      comboDiscountRate: comboDiscountRate,
      comboDiscountLow: low.combo,
      comboDiscountHigh: high.combo,
      netLaborLow: low.net,
      netLaborHigh: high.net,
      shopSuppliesLow: low.supplies,
      shopSuppliesHigh: high.supplies,
      couponCode: couponCode,
      couponApplied: couponApplied,
      couponDiscount: couponDiscountLow,
      couponDiscountLow: couponDiscountLow,
      couponDiscountHigh: couponDiscountHigh,
      couponMessage: couponMessage,
      totalDiscountLow: round2(low.combo + couponDiscountLow),
      totalDiscountHigh: round2(high.combo + couponDiscountHigh),
      subtotalLow: subtotalLow,
      subtotalHigh: subtotalHigh,
      hstRate: SHOP_INFO.hstRate,
      hstLow: hstLow,
      hstHigh: hstHigh,
      totalLow: totalLow,
      totalHigh: totalHigh,
      estimatedDurationHours: round2(durationTotal),
      currency: 'CAD'
    };
  }

  /*
   * validateBooking(bookingPayload)
   * Shop hours: Mon-Fri 8:00 AM - 6:00 PM (last bay check-in 5:30 PM),
   * Sat 8:30 AM - 3:00 PM (last check-in 2:30 PM), Sunday closed.
   */
  function validateBooking(payload) {
    payload = payload || {};
    var errors = [];

    var customerName = typeof payload.customerName === 'string' ? payload.customerName.trim() : '';
    if (customerName.length < 2) {
      errors.push('Customer name is required (minimum 2 characters).');
    }

    var phoneDigits = typeof payload.phone === 'string' ? payload.phone.replace(/\D/g, '') : '';
    if (phoneDigits.length < 10) {
      errors.push('A valid phone number with at least 10 digits is required.');
    }

    var vehicleYear = Number(payload.vehicleYear);
    if (!Number.isInteger(vehicleYear) || vehicleYear < 1980 || vehicleYear > 2027) {
      errors.push('Vehicle year must be between 1980 and 2027.');
    }

    var vehicleMake = typeof payload.vehicleMake === 'string' ? payload.vehicleMake.trim() : '';
    if (vehicleMake.length < 2) {
      errors.push('Vehicle make is required (minimum 2 characters).');
    }

    var vehicleModel = typeof payload.vehicleModel === 'string' ? payload.vehicleModel.trim() : '';
    if (vehicleModel.length < 1) {
      errors.push('Vehicle model is required.');
    }

    var origin = payload.origin;
    if (!VEHICLE_MULTIPLIERS.origin[origin]) {
      errors.push('Vehicle origin must be domestic, asian_import, or euro_import.');
    }

    var vehicleClass = payload.vehicleClass;
    if (!VEHICLE_MULTIPLIERS.vehicleClass[vehicleClass]) {
      errors.push('Vehicle class must be sedan, suv, or truck.');
    }

    var requestedIds = Array.isArray(payload.serviceIds) ? payload.serviceIds : [];
    var validServices = resolveServices(requestedIds);
    var uniqueRequested = requestedIds.filter(function (id, i) {
      return requestedIds.indexOf(id) === i;
    });
    if (validServices.length === 0) {
      errors.push('Please select at least one service.');
    } else if (validServices.length !== uniqueRequested.length) {
      errors.push('Selected services include an unknown service ID.');
    }

    var dayOfWeek = -1;
    var dateValid = false;
    var dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof payload.appointmentDate === 'string' ? payload.appointmentDate : '');
    if (!dateMatch) {
      errors.push('Appointment date is required (YYYY-MM-DD).');
    } else {
      var yy = parseInt(dateMatch[1], 10);
      var mm = parseInt(dateMatch[2], 10);
      var dd = parseInt(dateMatch[3], 10);
      var dt = new Date(yy, mm - 1, dd);
      if (dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) {
        errors.push('Appointment date is not a valid calendar date.');
      } else {
        dayOfWeek = dt.getDay();
        dateValid = true;
      }
    }

    var minutes = -1;
    var timeMatch = /^(\d{1,2}):(\d{2})$/.exec(typeof payload.appointmentTime === 'string' ? payload.appointmentTime : '');
    if (!timeMatch) {
      errors.push('Appointment time is required (HH:MM).');
    } else {
      var hh = parseInt(timeMatch[1], 10);
      var mi = parseInt(timeMatch[2], 10);
      if (hh > 23 || mi > 59) {
        errors.push('Appointment time is not a valid time.');
      } else {
        minutes = hh * 60 + mi;
      }
    }

    if (dateValid && minutes >= 0) {
      if (dayOfWeek === 0) {
        errors.push('Shop is closed on Sundays. Please select Monday through Saturday.');
      } else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (minutes < 480 || minutes > 1050) {
          errors.push('Weekday appointments are available 8:00 AM to 5:30 PM (last bay check-in 5:30 PM).');
        }
      } else if (dayOfWeek === 6) {
        if (minutes < 510 || minutes > 870) {
          errors.push('Saturday appointments are available 8:30 AM to 2:30 PM (last bay check-in 2:30 PM).');
        }
      }
    }

    var bookingMode = payload.bookingMode;
    if (bookingMode !== 'drop_off' && bookingMode !== 'wait_in_lounge') {
      errors.push('Booking mode must be drop_off or wait_in_lounge.');
    }

    var valid = errors.length === 0;
    var normalizedBooking = null;
    var confirmationCode = null;
    var advisory = null;

    if (valid) {
      var durationTotal = 0;
      validServices.forEach(function (svc) { durationTotal += svc.durationHours; });
      durationTotal = round2(durationTotal);

      if (bookingMode === 'wait_in_lounge' && durationTotal > 3.0) {
        advisory = 'Estimated service duration is about ' + durationTotal.toFixed(2) +
          ' hours. We recommend drop-off; our lounge is reserved for shorter visits.';
      }

      var initials = customerName.split(/\s+/)
        .map(function (word) { return word.charAt(0); })
        .join('')
        .toUpperCase()
        .slice(0, 2);
      while (initials.length < 2) initials += 'X';
      var last3 = phoneDigits.slice(-3);
      confirmationCode = 'REV-' +
        payload.appointmentDate.replace(/-/g, '') + '-' +
        payload.appointmentTime.replace(':', '') + '-' +
        initials + last3;

      normalizedBooking = {
        customerName: customerName,
        phone: typeof payload.phone === 'string' ? payload.phone.trim() : payload.phone,
        vehicleYear: vehicleYear,
        vehicleMake: vehicleMake,
        vehicleModel: vehicleModel,
        origin: origin,
        vehicleClass: vehicleClass,
        serviceIds: validServices.map(function (svc) { return svc.id; }),
        appointmentDate: payload.appointmentDate,
        appointmentTime: payload.appointmentTime,
        bookingMode: bookingMode,
        estimatedDurationHours: durationTotal,
        confirmationCode: confirmationCode
      };
    }

    return {
      valid: valid,
      errors: errors,
      normalizedBooking: normalizedBooking,
      confirmationCode: confirmationCode,
      advisory: advisory
    };
  }

  /*
   * recommendServicesBySymptoms(symptomsArray)
   */
  function recommendServicesBySymptoms(symptomsArray) {
    var input = Array.isArray(symptomsArray) ? symptomsArray : [];
    var matched = [];
    var seenKeys = {};
    input.forEach(function (rawKey) {
      if (typeof rawKey === 'string') {
        var key = rawKey.trim().toLowerCase();
        if (key && !seenKeys[key]) {
          seenKeys[key] = true;
          var entry = findSymptom(key);
          if (entry) matched.push(entry);
        }
      }
    });

    var recommendedServiceIds = [];
    var primaryServiceIds = [];
    var technicianNotes = [];
    var recSeen = {};
    var priSeen = {};

    matched.forEach(function (entry) {
      entry.recommendedServiceIds.forEach(function (id) {
        if (!recSeen[id]) {
          recSeen[id] = true;
          recommendedServiceIds.push(id);
        }
      });
      var primary = entry.recommendedServiceIds[0];
      if (primary && !priSeen[primary]) {
        priSeen[primary] = true;
        primaryServiceIds.push(primary);
      }
      technicianNotes.push(entry.technicianNote);
    });

    var urgency = null;
    if (matched.some(function (e) { return e.urgency === 'HIGH'; })) {
      urgency = 'HIGH';
    } else if (matched.some(function (e) { return e.urgency === 'MEDIUM'; })) {
      urgency = 'MEDIUM';
    }

    var diagnosticSummary;
    if (matched.length === 0) {
      diagnosticSummary = 'No symptoms selected yet. Choose what your vehicle is experiencing to get a service recommendation.';
    } else {
      var labels = matched.map(function (e) { return e.label; }).join('; ');
      var primaryNames = primaryServiceIds.map(function (id) {
        var s = findService(id);
        return s ? s.name : id;
      }).join(', ');
      diagnosticSummary = 'Technician review for: ' + labels + '. Recommended starting point: ' + primaryNames +
        '. Urgency: ' + urgency + '.';
    }

    return {
      matchedSymptoms: matched.map(function (e) { return e.key; }),
      recommendedServiceIds: recommendedServiceIds,
      recommendedServices: recommendedServiceIds.map(function (id) { return findService(id); }),
      primaryServiceIds: primaryServiceIds,
      urgency: urgency,
      technicianNotes: technicianNotes,
      diagnosticSummary: diagnosticSummary
    };
  }

  var api = Object.freeze({
    SHOP_INFO: SHOP_INFO,
    VEHICLE_MULTIPLIERS: VEHICLE_MULTIPLIERS,
    SERVICE_CATALOG: SERVICE_CATALOG,
    COUPON_CATALOG: COUPON_CATALOG,
    SYMPTOM_CATALOG: SYMPTOM_CATALOG,
    calculateEstimate: calculateEstimate,
    validateBooking: validateBooking,
    recommendServicesBySymptoms: recommendServicesBySymptoms
  });

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.RevolutionsEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
