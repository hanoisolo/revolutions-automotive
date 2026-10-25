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

  /* ================================================================== */
  /* Phase 2 - Segment 1: Diagnostic wizard, Ontario MTO safety        */
  /* pre-check and live bay tracker engine extensions.                 */
  /* ================================================================== */

  function deepFreeze(value) {
    if (value && typeof value === 'object') {
      Object.getOwnPropertyNames(value).forEach(function (key) {
        deepFreeze(value[key]);
      });
      Object.freeze(value);
    }
    return value;
  }

  var DIAGNOSTIC_DECISION_TREE = deepFreeze({
    rootNodeId: 'step_anomaly',
    nodes: {
      step_anomaly: {
        id: 'step_anomaly',
        type: 'question',
        stepNumber: 1,
        answerKey: 'anomaly',
        prompt: 'What kind of anomaly is your vehicle exhibiting?',
        options: [
          { value: 'sound', label: 'A noise I can hear', nextNodeId: 'step_location_sound' },
          { value: 'vibration', label: 'A vibration or shake I can feel', nextNodeId: 'step_location_vibration' },
          { value: 'warning_light', label: 'A dashboard warning light', nextNodeId: 'step_location_warning' },
          { value: 'smell', label: 'An unusual smell', nextNodeId: 'step_location_smell' },
          { value: 'fluid_leak', label: 'A fluid leak or puddle', nextNodeId: 'step_location_fluid' }
        ]
      },

      step_location_sound: {
        id: 'step_location_sound',
        type: 'question',
        stepNumber: 2,
        answerKey: 'location',
        prompt: 'Where is the noise coming from?',
        options: [
          { value: 'wheels_or_brakes', label: 'Around the wheels or when braking', nextNodeId: 'step_condition_sound_brakes' },
          { value: 'engine_bay', label: 'From the engine bay', nextNodeId: 'step_condition_sound_engine' },
          { value: 'under_vehicle_exhaust', label: 'Under the vehicle or from the exhaust', nextNodeId: 'step_condition_sound_exhaust' }
        ]
      },
      step_condition_sound_brakes: {
        id: 'step_condition_sound_brakes',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'Which condition best matches the noise?',
        options: [
          { value: 'squeal_when_braking', label: 'High-pitched squeal when braking', nextNodeId: 'term_squeal_brakes' },
          { value: 'grind_when_braking', label: 'Metal-on-metal grinding when braking', nextNodeId: 'term_grind_brakes' },
          { value: 'clunk_over_bumps', label: 'Clunking over bumps or potholes', nextNodeId: 'term_clunk_suspension' }
        ]
      },
      step_condition_sound_engine: {
        id: 'step_condition_sound_engine',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'Which condition best matches the noise?',
        options: [
          { value: 'knocking_or_ticking', label: 'Knocking or ticking from the engine', nextNodeId: 'term_knock_tick' },
          { value: 'hissing_or_whistling', label: 'Hissing or whistling at idle', nextNodeId: 'term_vacuum_hiss' },
          { value: 'rattle_on_acceleration', label: 'Rattling on acceleration', nextNodeId: 'term_exhaust_rattle' }
        ]
      },
      step_condition_sound_exhaust: {
        id: 'step_condition_sound_exhaust',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'Which condition best matches the noise?',
        options: [
          { value: 'roar_under_floor', label: 'Loud roar under the floor while driving', nextNodeId: 'term_exhaust_roar' },
          { value: 'boom_on_start', label: 'Boom or rumble on start-up', nextNodeId: 'term_exhaust_boom' }
        ]
      },

      step_location_vibration: {
        id: 'step_location_vibration',
        type: 'question',
        stepNumber: 2,
        answerKey: 'location',
        prompt: 'Where do you feel the vibration?',
        options: [
          { value: 'steering_wheel', label: 'In the steering wheel', nextNodeId: 'step_condition_vibration_steering' },
          { value: 'seat_or_floor', label: 'In the seat or floor', nextNodeId: 'step_condition_vibration_floor' },
          { value: 'brake_pedal', label: 'In the brake pedal', nextNodeId: 'step_condition_vibration_pedal' }
        ]
      },
      step_condition_vibration_steering: {
        id: 'step_condition_vibration_steering',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'Which condition best matches the vibration?',
        options: [
          { value: 'shakes_when_braking', label: 'Steering wheel shakes when braking', nextNodeId: 'term_pulsating_brakes' },
          { value: 'shakes_at_highway_speed', label: 'Shakes at highway speed (80-100 km/h)', nextNodeId: 'term_high_speed_shimmy' }
        ]
      },
      step_condition_vibration_floor: {
        id: 'step_condition_vibration_floor',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'Which condition best matches the vibration?',
        options: [
          { value: 'hum_grows_with_speed', label: 'Hum that grows with speed', nextNodeId: 'term_wheel_bearing_hum' },
          { value: 'bounces_over_bumps', label: 'Bounces and floats over bumps', nextNodeId: 'term_worn_struts' }
        ]
      },
      step_condition_vibration_pedal: {
        id: 'step_condition_vibration_pedal',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'Which condition best matches the vibration?',
        options: [
          { value: 'pulsates_when_braking', label: 'Pedal pulsates up and down when braking', nextNodeId: 'term_pedal_pulsation' },
          { value: 'vibrates_constantly', label: 'Pedal vibrates constantly while driving', nextNodeId: 'term_pedal_vibration' }
        ]
      },

      step_location_warning: {
        id: 'step_location_warning',
        type: 'question',
        stepNumber: 2,
        answerKey: 'location',
        prompt: 'Which warning light or gauge is involved?',
        options: [
          { value: 'check_engine', label: 'Check Engine light', nextNodeId: 'step_condition_warning_cel' },
          { value: 'red_oil_or_temp', label: 'Red oil pressure or temperature light', nextNodeId: 'step_condition_warning_red' },
          { value: 'abs_or_traction', label: 'ABS or Traction Control light', nextNodeId: 'step_condition_warning_abs' },
          { value: 'battery_charging', label: 'Battery or Charging light', nextNodeId: 'step_condition_warning_battery' }
        ]
      },
      step_condition_warning_cel: {
        id: 'step_condition_warning_cel',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'How is the Check Engine light behaving?',
        options: [
          { value: 'flashing', label: 'Flashing while driving', nextNodeId: 'term_flashing_cel' },
          { value: 'solid', label: 'Solid and the vehicle drives normally', nextNodeId: 'term_solid_cel' }
        ]
      },
      step_condition_warning_red: {
        id: 'step_condition_warning_red',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'How is the gauge or light behaving?',
        options: [
          { value: 'gauge_in_red_zone', label: 'Gauge in the red zone or steam from the hood', nextNodeId: 'term_overheat_tow' },
          { value: 'gauge_climbing', label: 'Gauge climbing above normal but not in the red', nextNodeId: 'term_overheat_early' }
        ]
      },
      step_condition_warning_abs: {
        id: 'step_condition_warning_abs',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'How is the ABS or Traction light behaving?',
        options: [
          { value: 'with_grinding_or_noise', label: 'On together with brake noise or grinding', nextNodeId: 'term_abs_with_noise' },
          { value: 'intermittent_or_alone', label: 'Intermittent or on by itself', nextNodeId: 'term_abs_scan' }
        ]
      },
      step_condition_warning_battery: {
        id: 'step_condition_warning_battery',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'How is the electrical system behaving?',
        options: [
          { value: 'light_while_driving', label: 'Battery light on while driving', nextNodeId: 'term_alternator_fault' },
          { value: 'dead_overnight', label: 'Battery dead in the morning', nextNodeId: 'term_parasitic_draw' }
        ]
      },

      step_location_smell: {
        id: 'step_location_smell',
        type: 'question',
        stepNumber: 2,
        answerKey: 'location',
        prompt: 'Where is the smell strongest?',
        options: [
          { value: 'exhaust_fumes_in_cabin', label: 'Exhaust fumes inside the cabin', nextNodeId: 'step_condition_smell_exhaust' },
          { value: 'burning_odor', label: 'A burning odour', nextNodeId: 'step_condition_smell_burning' }
        ]
      },
      step_condition_smell_exhaust: {
        id: 'step_condition_smell_exhaust',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'When do you notice the fumes?',
        options: [
          { value: 'fumes_while_driving', label: 'While driving or idling', nextNodeId: 'term_exhaust_fumes_cabin' },
          { value: 'fumes_on_cold_start', label: 'Only on cold start-up', nextNodeId: 'term_cold_start_rich' }
        ]
      },
      step_condition_smell_burning: {
        id: 'step_condition_smell_burning',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'Which burning odour best matches?',
        options: [
          { value: 'after_hard_braking', label: 'After hard braking', nextNodeId: 'term_seized_caliper' },
          { value: 'burning_oil', label: 'Burning oil smell from the engine', nextNodeId: 'term_oil_burn_smell' },
          { value: 'electrical_or_plastic', label: 'Electrical or burning plastic', nextNodeId: 'term_electrical_burn' }
        ]
      },

      step_location_fluid: {
        id: 'step_location_fluid',
        type: 'question',
        stepNumber: 2,
        answerKey: 'location',
        prompt: 'Where is the puddle or leak?',
        options: [
          { value: 'under_front_wheel_area', label: 'Under a front wheel area', nextNodeId: 'step_condition_fluid_front' },
          { value: 'under_engine', label: 'Under the middle of the engine', nextNodeId: 'step_condition_fluid_engine' },
          { value: 'under_vehicle_middle', label: 'Under the middle or rear of the vehicle', nextNodeId: 'step_condition_fluid_middle' }
        ]
      },
      step_condition_fluid_front: {
        id: 'step_condition_fluid_front',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'Which condition best matches the leak?',
        options: [
          { value: 'slick_reddish_fluid', label: 'Slick reddish fluid near the steering', nextNodeId: 'term_ps_leak' },
          { value: 'low_brake_fluid_warning', label: 'Brake fluid warning or a sinking pedal', nextNodeId: 'term_brake_fluid_leak' }
        ]
      },
      step_condition_fluid_engine: {
        id: 'step_condition_fluid_engine',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'What does the leaked fluid look like?',
        options: [
          { value: 'brown_or_black_oil', label: 'Brown or black oily fluid', nextNodeId: 'term_engine_oil_leak' },
          { value: 'bright_green_or_pink', label: 'Bright green or pink fluid', nextNodeId: 'term_coolant_leak' }
        ]
      },
      step_condition_fluid_middle: {
        id: 'step_condition_fluid_middle',
        type: 'question',
        stepNumber: 3,
        answerKey: 'condition',
        prompt: 'What does the leaked fluid look like?',
        options: [
          { value: 'clear_water', label: 'Clear water, mostly on hot days', nextNodeId: 'term_ac_condensate' },
          { value: 'dark_heavy_oil', label: 'Dark, thick, heavy oil', nextNodeId: 'term_gearbox_leak' }
        ]
      },

      term_squeal_brakes: {
        id: 'term_squeal_brakes',
        type: 'terminal',
        triageLevel: 'routine_inspect',
        rootCauses: [
          'Pad wear indicator tab contacting the rotor face',
          'Glazed or lightly scored friction material'
        ],
        serviceId: 'brk_pads_rotors',
        technicianNotes: 'Measure remaining pad lining in mm and inspect rotor surface finish before any replacement.'
      },
      term_grind_brakes: {
        id: 'term_grind_brakes',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Friction material fully consumed - steel backing plate on the rotor',
          'Scored or heat-cracked rotors from continued driving'
        ],
        serviceId: 'brk_pads_rotors',
        technicianNotes: 'Stop driving: replace pads and rotors, service caliper hardware and road test before returning the vehicle.'
      },
      term_clunk_suspension: {
        id: 'term_clunk_suspension',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Worn ball joints or stabilizer bar links',
          'Fatigued strut mounts or control arm bushings'
        ],
        serviceId: 'sus_strut_control',
        technicianNotes: 'Perform a hoist inspection of ball joints, stabilizer links and strut mounts with a pry-bar and dial indicator.'
      },
      term_knock_tick: {
        id: 'term_knock_tick',
        type: 'terminal',
        triageLevel: 'tow_now',
        rootCauses: [
          'Internal engine knock from bearing or piston wear',
          'Low oil pressure starving the valvetrain'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'CRITICAL: internal engine knock risks catastrophic failure. Tow in for an oil pressure test and internal inspection.'
      },
      term_vacuum_hiss: {
        id: 'term_vacuum_hiss',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Vacuum or intake manifold leak',
          'Failing PCV valve or loose booster hose connection'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'Smoke-test the intake for vacuum leaks and run an OBD-II fuel trim analysis to pinpoint the leak.'
      },
      term_exhaust_rattle: {
        id: 'term_exhaust_rattle',
        type: 'terminal',
        triageLevel: 'routine_inspect',
        rootCauses: [
          'Loose heat shield or failed exhaust hanger',
          'Corroded flex pipe joint rattling under load'
        ],
        serviceId: 'mto_safety_exhaust',
        technicianNotes: 'Hoist the vehicle and secure or replace the failed heat shield, hanger or flex section.'
      },
      term_exhaust_roar: {
        id: 'term_exhaust_roar',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Perforated muffler or detached pipe joint',
          'Broken exhaust manifold gasket seal'
        ],
        serviceId: 'mto_safety_exhaust',
        technicianNotes: 'Smoke-test the exhaust path from manifold to tailpipe and replace the perforated or detached section.'
      },
      term_exhaust_boom: {
        id: 'term_exhaust_boom',
        type: 'terminal',
        triageLevel: 'routine_inspect',
        rootCauses: [
          'Damaged muffler baffle resonance',
          'Loose tailpipe vibrating on start-up'
        ],
        serviceId: 'mto_safety_exhaust',
        technicianNotes: 'Inspect the muffler baffle and tailpipe mounts; repair the resonating section.'
      },
      term_pulsating_brakes: {
        id: 'term_pulsating_brakes',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Disc thickness variation (warped rotors)',
          'Uneven pad transfer film on the rotor face'
        ],
        serviceId: 'brk_pads_rotors',
        technicianNotes: 'Measure rotor disc thickness variation and runout with a micrometer; resurface or replace rotors as needed.'
      },
      term_high_speed_shimmy: {
        id: 'term_high_speed_shimmy',
        type: 'terminal',
        triageLevel: 'routine_inspect',
        rootCauses: [
          'Lost wheel weight or dynamic wheel imbalance',
          'Bent rim or out-of-round tire'
        ],
        serviceId: 'tir_mount_balance',
        technicianNotes: 'Road-force balance all four wheels and check rims for runout and tire uniformity.'
      },
      term_wheel_bearing_hum: {
        id: 'term_wheel_bearing_hum',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Worn wheel bearing growl that rises with speed',
          'Uneven tire cupping mimicking a bearing noise'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'Road test with chassis ears to isolate the worn bearing, then replace the hub assembly.'
      },
      term_worn_struts: {
        id: 'term_worn_struts',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Blown struts or shock absorbers losing damping',
          'Broken coil spring or collapsed strut mount'
        ],
        serviceId: 'sus_strut_control',
        technicianNotes: 'Perform a bounce test and hoist inspection; replace blown struts or shocks in pairs.'
      },
      term_pedal_pulsation: {
        id: 'term_pedal_pulsation',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Rotor runout beyond factory specification',
          'Hot spots from deposited friction material'
        ],
        serviceId: 'brk_pads_rotors',
        technicianNotes: 'Measure pedal pulsation against rotor runout spec; replace rotors and the pad set on the affected axle.'
      },
      term_pedal_vibration: {
        id: 'term_pedal_vibration',
        type: 'terminal',
        triageLevel: 'routine_inspect',
        rootCauses: [
          'Seized or dragging caliper slide pins',
          'Contaminated or aerated brake fluid'
        ],
        serviceId: 'brk_fluid_caliper',
        technicianNotes: 'Inspect caliper slide pins for seizure and test brake fluid condition and moisture content.'
      },
      term_flashing_cel: {
        id: 'term_flashing_cel',
        type: 'terminal',
        triageLevel: 'tow_now',
        rootCauses: [
          'Active catalyst-damaging cylinder misfire',
          'Critical fuel, ignition or injector fault'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'CRITICAL STOP-DRIVE: a flashing MIL means raw fuel is entering the catalytic converter. Tow in for an OEM scan.'
      },
      term_solid_cel: {
        id: 'term_solid_cel',
        type: 'terminal',
        triageLevel: 'routine_inspect',
        rootCauses: [
          'Stored emissions or sensor fault code',
          'EVAP purge solenoid or oxygen sensor drift'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'Perform a full OBD-II scan with freeze-frame analysis before recommending any repair.'
      },
      term_overheat_tow: {
        id: 'term_overheat_tow',
        type: 'terminal',
        triageLevel: 'tow_now',
        rootCauses: [
          'Stuck-closed thermostat or failed cooling fan',
          'Coolant loss from the water pump, radiator or a hose'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'CRITICAL THERMAL RISK: continued operation risks head gasket failure. Tow in for a cooling system pressure test.'
      },
      term_overheat_early: {
        id: 'term_overheat_early',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Weak water pump impeller or restricted radiator',
          'Depleted coolant or a failing radiator cap'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'Pressure-test the cooling system, verify fan and thermostat function before the gauge reaches red.'
      },
      term_abs_with_noise: {
        id: 'term_abs_with_noise',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'ABS wheel speed sensor contaminated by brake dust',
          'Worn brakes triggering ABS and traction warnings'
        ],
        serviceId: 'brk_pads_rotors',
        technicianNotes: 'Inspect brake wear and wheel speed sensors; clean or replace contaminated ABS tone rings.'
      },
      term_abs_scan: {
        id: 'term_abs_scan',
        type: 'terminal',
        triageLevel: 'routine_inspect',
        rootCauses: [
          'Intermittent wheel speed sensor signal',
          'ABS module code stored without an active brake fault'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'Scan ABS and traction modules for stored codes and perform a wheel speed sensor signal test.'
      },
      term_alternator_fault: {
        id: 'term_alternator_fault',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Alternator voltage regulator failure',
          'Slipped or glazed serpentine belt on the pulley'
        ],
        serviceId: 'diag_elec_parasitic',
        technicianNotes: 'Perform a charging system load test (AVR) and inspect the serpentine belt and tensioner.'
      },
      term_parasitic_draw: {
        id: 'term_parasitic_draw',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Key-off parasitic draw above 50 mA',
          'Aged battery with a dead cell or sulfation'
        ],
        serviceId: 'diag_elec_parasitic',
        technicianNotes: 'Perform an amp-clamp parasitic draw test across the fuse blocks and a battery conductance test.'
      },
      term_exhaust_fumes_cabin: {
        id: 'term_exhaust_fumes_cabin',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Exhaust leak forward of the cabin air intake - CO intrusion risk',
          'Perforated downpipe or manifold gasket leak'
        ],
        serviceId: 'mto_safety_exhaust',
        technicianNotes: 'CO INTRUSION HAZARD: locate the exhaust leak with a smoke test and repair it before driving again.'
      },
      term_cold_start_rich: {
        id: 'term_cold_start_rich',
        type: 'terminal',
        triageLevel: 'routine_inspect',
        rootCauses: [
          'Rich fuel mixture on cold start (cold-start enrichment)',
          'Leaking injector or faulty engine temperature sensor'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'Scan for rich-mixture codes, test the engine coolant temperature sensor and inspect injector spray.'
      },
      term_seized_caliper: {
        id: 'term_seized_caliper',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Seized caliper dragging the pads against the rotor',
          'Boiled brake fluid from sustained heat'
        ],
        serviceId: 'brk_pads_rotors',
        technicianNotes: 'Inspect the dragging caliper, service or replace it, and flush the heat-cycled brake fluid.'
      },
      term_oil_burn_smell: {
        id: 'term_oil_burn_smell',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Engine oil leaking onto hot exhaust surfaces',
          'Overfilled or degraded engine oil burning off'
        ],
        serviceId: 'oil_full_synth',
        technicianNotes: 'Degrease and trace the oil leak source; repair the gasket or seal leaking onto the exhaust.'
      },
      term_electrical_burn: {
        id: 'term_electrical_burn',
        type: 'terminal',
        triageLevel: 'tow_now',
        rootCauses: [
          'Shorted wiring harness or melting connector',
          'Failed blower motor resistor or seized fan motor'
        ],
        serviceId: 'diag_elec_parasitic',
        technicianNotes: 'CRITICAL FIRE RISK: isolate the shorted circuit, inspect the harness and connector, and repair before driving.'
      },
      term_ps_leak: {
        id: 'term_ps_leak',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Power steering rack or pressure hose leak at the front wheels',
          'Worn steering rack seals'
        ],
        serviceId: 'sus_strut_control',
        technicianNotes: 'Pressure-test the power steering system; replace the leaking hose, rack seal or pump as required.'
      },
      term_brake_fluid_leak: {
        id: 'term_brake_fluid_leak',
        type: 'terminal',
        triageLevel: 'tow_now',
        rootCauses: [
          'Leaking wheel cylinder, caliper or brake line',
          'Master cylinder reservoir dropping below minimum'
        ],
        serviceId: 'brk_pads_rotors',
        technicianNotes: 'CRITICAL SAFETY HAZARD: loss of hydraulic brake pressure. Tow in; repair the leaking line, caliper or master cylinder.'
      },
      term_engine_oil_leak: {
        id: 'term_engine_oil_leak',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Valve cover or oil pan gasket seepage',
          'Timing cover or crank seal leak'
        ],
        serviceId: 'oil_full_synth',
        technicianNotes: 'Degrease the engine, trace the seepage from the valve cover or oil pan gasket and reseal.'
      },
      term_coolant_leak: {
        id: 'term_coolant_leak',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Water pump weep hole or radiator seam leak',
          'Bypass hose or thermostat housing leak'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'Pressure-test the cooling system to pinpoint the water pump, hose or radiator leak.'
      },
      term_ac_condensate: {
        id: 'term_ac_condensate',
        type: 'terminal',
        triageLevel: 'routine_inspect',
        rootCauses: [
          'Normal A/C evaporator condensate drip (harmless)',
          'Verify the evaporator drain tube position before any repair'
        ],
        serviceId: 'ac_evac_recharge',
        technicianNotes: 'Verify the puddle is clear water from the A/C evaporator drain - a normal condition; inspect if coolant is suspected.'
      },
      term_gearbox_leak: {
        id: 'term_gearbox_leak',
        type: 'terminal',
        triageLevel: 'schedule_urgent',
        rootCauses: [
          'Transmission or differential output shaft seal leak',
          'Overfilled gear oil pushed through a vent'
        ],
        serviceId: 'diag_computer_scan',
        technicianNotes: 'Identify the fluid type, then reseal the transmission or differential output shaft leaking gear oil.'
      }
    }
  });

  var TRIAGE_URGENCY = Object.freeze({
    tow_now: 'Do not drive - arrange a tow to the shop immediately.',
    schedule_urgent: 'Book an appointment within 24-48 hours.',
    routine_inspect: 'Book at your earliest convenience.'
  });

  /*
   * evaluateDiagnosticWizard(answersObject)
   * answersObject: {
   *   anomaly: 'sound' | 'vibration' | 'warning_light' | 'smell' | 'fluid_leak',
   *   location: '<option value at step 2>',
   *   condition: '<option value at step 3>'
   * }
   * Also accepts { terminalNodeId } / { nodeId } for direct terminal lookup and
   * emergency overrides (flashingWarningLight / brakeFailure / overheating).
   * Returns { triageLevel, rootCauses, serviceId, technicianNotes, recommendedUrgency }.
   */
  var WIZARD_FALLBACK_CAUSES = Object.freeze([
    'Requires hands-on hoist and OBD-II computer diagnostic inspection to isolate root cause'
  ]);

  function wizardFallbackResult() {
    return {
      triageLevel: 'routine_inspect',
      rootCauses: WIZARD_FALLBACK_CAUSES.slice(),
      serviceId: 'diag_computer_scan',
      technicianNotes: 'Customer symptom selection incomplete or general; perform baseline computer diagnostic scan and road test.',
      recommendedUrgency: TRIAGE_URGENCY.routine_inspect
    };
  }

  function wizardTerminalResult(terminal) {
    return {
      triageLevel: terminal.triageLevel,
      rootCauses: terminal.rootCauses.slice(),
      serviceId: terminal.serviceId,
      technicianNotes: terminal.technicianNotes,
      recommendedUrgency: TRIAGE_URGENCY[terminal.triageLevel] || TRIAGE_URGENCY.routine_inspect
    };
  }

  function evaluateDiagnosticWizard(answersObject) {
    if (!answersObject || typeof answersObject !== 'object') {
      return wizardFallbackResult();
    }

    var nodes = DIAGNOSTIC_DECISION_TREE.nodes;

    if (typeof answersObject.terminalNodeId === 'string' &&
        nodes[answersObject.terminalNodeId] &&
        nodes[answersObject.terminalNodeId].type === 'terminal') {
      return wizardTerminalResult(nodes[answersObject.terminalNodeId]);
    }
    if (typeof answersObject.nodeId === 'string' &&
        nodes[answersObject.nodeId] &&
        nodes[answersObject.nodeId].type === 'terminal') {
      return wizardTerminalResult(nodes[answersObject.nodeId]);
    }
    if (answersObject.flashingWarningLight === true) return wizardTerminalResult(nodes.term_flashing_cel);
    if (answersObject.brakeFailure === true) return wizardTerminalResult(nodes.term_brake_fluid_leak);
    if (answersObject.overheating === true) return wizardTerminalResult(nodes.term_overheat_tow);

    var currentId = DIAGNOSTIC_DECISION_TREE.rootNodeId;
    for (var hop = 0; hop < 8; hop++) {
      var node = nodes[currentId];
      if (!node) return wizardFallbackResult();
      if (node.type === 'terminal') return wizardTerminalResult(node);
      var answer = answersObject[node.answerKey];
      if (typeof answer !== 'string') return wizardFallbackResult();
      var next = null;
      for (var i = 0; i < node.options.length; i++) {
        if (node.options[i].value === answer) {
          next = node.options[i].nextNodeId;
          break;
        }
      }
      if (!next) return wizardFallbackResult();
      currentId = next;
    }
    return wizardFallbackResult();
  }

  var MTO_SSC_CHECKLIST_ITEMS = deepFreeze([
    {
      id: 'mto_brakes',
      areaLabel: 'Brakes & Hydraulic System',
      question: 'Does the vehicle stop straight and firmly without grinding, a brake warning light, or a soft pedal?',
      weight: 15,
      severity: 'critical',
      recommendedServiceId: 'brk_pads_rotors'
    },
    {
      id: 'mto_steering',
      areaLabel: 'Front Steering & Linkage',
      question: 'Is the steering tight and responsive without clunking, excessive play, or leaking power steering fluid?',
      weight: 12,
      severity: 'critical',
      recommendedServiceId: 'sus_strut_control'
    },
    {
      id: 'mto_suspension',
      areaLabel: 'Suspension, Springs & Shock Absorbers',
      question: 'Does the vehicle sit and ride level without broken springs, leaking shocks, or rear-end sway?',
      weight: 10,
      severity: 'major',
      recommendedServiceId: 'tir_align_4whl'
    },
    {
      id: 'mto_tires_wheels',
      areaLabel: 'Tires, Wheels & Tread Depth',
      question: 'Do all four tires have at least 2.0 mm of tread with no exposed cords, sidewall bulges, or missing lug nuts?',
      weight: 12,
      severity: 'critical',
      recommendedServiceId: 'tir_mount_balance'
    },
    {
      id: 'mto_body_frame',
      areaLabel: 'Body Structure, Latches & Frame',
      question: 'Do all doors, hood and trunk latch securely with no perforated rust holes in the floor pan or rockers?',
      weight: 9,
      severity: 'major',
      recommendedServiceId: 'mto_safety_exhaust'
    },
    {
      id: 'mto_lighting',
      areaLabel: 'Lighting & Electrical Signals',
      question: 'Do all headlights, turn signals, brake lamps, hazards and licence plate lamps work properly?',
      weight: 8,
      severity: 'major',
      recommendedServiceId: 'diag_elec_parasitic'
    },
    {
      id: 'mto_glass_mirrors',
      areaLabel: 'Windshield Glass & Mirrors',
      question: 'Is the windshield free of cracks or chips larger than 13 mm in the driver view, with secure unbroken mirrors?',
      weight: 7,
      severity: 'minor',
      recommendedServiceId: 'mto_safety_exhaust'
    },
    {
      id: 'mto_wipers',
      areaLabel: 'Windshield Wipers & Washers',
      question: 'Do both front wipers clear the glass cleanly on all speeds and does the washer spray reach the windshield?',
      weight: 4,
      severity: 'minor',
      recommendedServiceId: 'mto_safety_exhaust'
    },
    {
      id: 'mto_exhaust_emissions',
      areaLabel: 'Exhaust & Emissions Integrity',
      question: 'Is the exhaust quiet and leak-free with no fumes entering the passenger cabin?',
      weight: 8,
      severity: 'critical',
      recommendedServiceId: 'mto_safety_exhaust'
    },
    {
      id: 'mto_seatbelts_airbags',
      areaLabel: 'Seatbelts & Airbag System',
      question: 'Do all seatbelts latch, retract and lock securely with no airbag warning light on the dash?',
      weight: 9,
      severity: 'critical',
      recommendedServiceId: 'mto_safety_exhaust'
    },
    {
      id: 'mto_fuel_system',
      areaLabel: 'Fuel System Integrity',
      question: 'Is the fuel system leak-free with no fuel odour, damaged filler neck, or loose fuel cap or lines?',
      weight: 6,
      severity: 'major',
      recommendedServiceId: 'diag_computer_scan'
    }
  ]);

  /*
   * evaluateSafetyPreCheck(answersObject)
   * answersObject maps each MTO_SSC_CHECKLIST_ITEMS id to a pass/fail/unsure
   * value: passing (true, 'pass', 'yes', 'ok'), failing (false, 'fail', 'no',
   * 'defect'), unsure/answered (undefined, null, 'unsure', 'unknown').
   * Unsure answers earn half the item weight. Any critical failure or a score
   * below 70 is an automatic fail; 85+ with zero critical failures passes.
   * Returns { score, status, criticalFails, recommendedServiceIds, notes }.
   */
  function interpretSafetyAnswer(raw) {
    if (raw === true || raw === 'pass' || raw === 'yes' || raw === 'ok') return 'pass';
    if (raw === false || raw === 'fail' || raw === 'no' || raw === 'defect') return 'fail';
    return 'unsure';
  }

  function evaluateSafetyPreCheck(answersObject) {
    var earned = 0;
    var criticalFails = [];
    var recommendedServiceIds = [];
    var seenService = {};
    var unsureCount = 0;

    function pushRecommended(serviceId) {
      if (serviceId && !seenService[serviceId]) {
        seenService[serviceId] = true;
        recommendedServiceIds.push(serviceId);
      }
    }

    MTO_SSC_CHECKLIST_ITEMS.forEach(function (item) {
      var interpretation = interpretSafetyAnswer(answersObject ? answersObject[item.id] : undefined);
      if (interpretation === 'pass') {
        earned += item.weight;
      } else if (interpretation === 'unsure') {
        earned += item.weight * 0.5;
        unsureCount++;
        pushRecommended(item.recommendedServiceId);
      } else {
        if (item.severity === 'critical') {
          criticalFails.push({
            id: item.id,
            areaLabel: item.areaLabel,
            severity: item.severity,
            recommendedServiceId: item.recommendedServiceId
          });
        }
        pushRecommended(item.recommendedServiceId);
      }
    });

    var score = Math.max(0, Math.min(100, Math.round(earned)));
    var status;
    if (criticalFails.length > 0 || score < 70) {
      status = 'fail';
    } else if (score >= 85) {
      status = 'pass';
    } else {
      status = 'advisory';
    }

    // The certification inspection is always the final recommended service.
    pushRecommended('mto_safety_exhaust');

    var notes;
    if (status === 'pass') {
      notes = 'All answered Ontario MTO inspection areas pass. Book the Safety Standards Certificate inspection to certify the vehicle.';
    } else if (status === 'advisory') {
      notes = 'Advisory items detected (' + unsureCount + ' area(s) to review). Review the recommended corrections before booking the certification inspection.';
    } else {
      notes = 'Critical inspection failures detected. The vehicle will not pass an Ontario Safety Standards inspection until the flagged areas are repaired.';
    }

    return {
      score: score,
      status: status,
      criticalFails: criticalFails,
      recommendedServiceIds: recommendedServiceIds,
      notes: notes
    };
  }

  var WORK_ORDER_STATES = Object.freeze([
    'CHECKED_IN',
    'INSPECTION_DIAGNOSTIC',
    'PARTS_ORDERED',
    'IN_BAY_REPAIRING',
    'QUALITY_ALIGNMENT_TEST',
    'READY_FOR_PICKUP'
  ]);

  var SEED_WORK_ORDERS = deepFreeze([
    {
      code: 'REV-2048',
      customerName: 'Marcus Vance',
      phone: '905-555-0148',
      licensePlate: 'BVXK 482',
      vehicle: '2020 Honda Civic Touring',
      vehicleType: 'sedan',
      serviceIds: Object.freeze(['brk_pads_rotors', 'tir_align_4whl']),
      currentState: 'IN_BAY_REPAIRING',
      bayNumber: 'Bay 2',
      technicianName: 'Devon K. (310S Red Seal)',
      technicianNotes: 'Ceramic pads and coated rotors installed on both axles; caliper slides lubricated. Vehicle moves to the 4-wheel laser alignment rack next.',
      estimatedTotal: 615.84,
      createdAt: '2025-05-12T08:30:00.000Z',
      updatedAt: '2025-05-12T10:45:00.000Z'
    },
    {
      code: 'REV-3105',
      customerName: 'Priya Grewal',
      phone: '905-555-0192',
      licensePlate: 'CJDK 905',
      vehicle: '2018 Ford F-150 XLT',
      vehicleType: 'truck',
      serviceIds: Object.freeze(['ac_compressor_cond', 'ac_evac_recharge']),
      currentState: 'PARTS_ORDERED',
      bayNumber: 'Bay 4',
      technicianName: 'Tariq M. (310S Diagnostic Lead)',
      technicianNotes: 'A/C compressor clutch failed the electronic leak test. OEM compressor and receiver/drier ordered from the Brampton distributor - ETA 45 minutes.',
      estimatedTotal: 1128.60,
      createdAt: '2025-05-12T09:15:00.000Z',
      updatedAt: '2025-05-12T11:10:00.000Z'
    },
    {
      code: 'REV-4092',
      customerName: 'Elena Rostova',
      phone: '416-555-0177',
      licensePlate: 'DTRM 118',
      vehicle: '2022 Toyota RAV4 XLE',
      vehicleType: 'suv',
      serviceIds: Object.freeze(['mto_safety_exhaust', 'oil_full_synth']),
      currentState: 'READY_FOR_PICKUP',
      bayNumber: 'Front Lot - Ready Stall 1',
      technicianName: 'Devon K. (310S Red Seal)',
      technicianNotes: 'Ontario MTO Safety Standards inspection passed - all pads above 7 mm and tires at 6/32. Full synthetic 0W-20 oil service complete; signed SSC certificate waiting at the front desk.',
      estimatedTotal: 276.84,
      createdAt: '2025-05-12T07:45:00.000Z',
      updatedAt: '2025-05-12T11:30:00.000Z'
    }
  ]);

  function normalizeWorkOrderCode(raw) {
    if (typeof raw !== 'string') return null;
    var normalized = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!normalized) return null;
    if (/^\d{4}$/.test(normalized)) return 'REV' + normalized;
    return normalized;
  }

  function phoneDigits(raw) {
    if (typeof raw !== 'string') return '';
    return raw.replace(/\D/g, '');
  }

  function normalizePlate(raw) {
    if (typeof raw !== 'string') return '';
    return raw.trim().toUpperCase().replace(/[\s-]/g, '');
  }

  function phoneOrPlateMatches(workOrder, term) {
    if (typeof term !== 'string' || term.trim() === '') return false;
    var digits = phoneDigits(term);
    var orderDigits = phoneDigits(workOrder.phone);
    if (digits.length >= 10 && orderDigits.length >= 10) {
      if (digits === orderDigits) return true;
    } else if (digits.length === 4) {
      if (orderDigits.slice(-4) === digits) return true;
    }
    return normalizePlate(term) === normalizePlate(workOrder.licensePlate);
  }

  /* ================================================================== */
  /* Phase 5: PIPEDA privacy redaction helpers                          */
  /* ================================================================== */

  /*
   * maskCustomerName(name)
   * Redacts a customer name to the first name plus the last-name initial
   * ("Priya Grewal" -> "Priya G."). Empty or invalid input falls back to
   * the neutral label "Customer Vehicle".
   */
  function maskCustomerName(name) {
    if (typeof name !== 'string') return 'Customer Vehicle';
    var parts = name.trim().split(/\s+/).filter(function (part) { return part.length > 0; });
    if (parts.length === 0) return 'Customer Vehicle';
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.';
  }

  /*
   * maskLicensePlate(plate)
   * Masks the leading letter block of every token ("CJKD 905" -> "*** 905",
   * "DTRM-118" -> "***-118") while keeping trailing identifiers visible.
   * Empty or invalid input falls back to an em dash placeholder.
   */
  function maskLicensePlate(plate) {
    if (typeof plate !== 'string') return '\u2014';
    var tokens = plate.trim().split(/\s+/).filter(function (token) { return token.length > 0; });
    if (tokens.length === 0) return '\u2014';
    return tokens.map(function (token) {
      return token.replace(/^[A-Za-z]+/, '***');
    }).join(' ');
  }

  /*
   * maskPhoneNumber(phone)
   * Keeps only the last four digits of a phone number
   * ("(905) 555-0192" -> "***-***-0192"). Inputs with fewer than four
   * digits collapse to "***".
   */
  function maskPhoneNumber(phone) {
    if (typeof phone !== 'string') return '***';
    var digits = phoneDigits(phone);
    if (digits.length < 4) return '***';
    return '***-***-' + digits.slice(-4);
  }

  /*
   * toPublicWorkOrderView(workOrder)
   * Builds the sanitized unauthenticated view of a work order: customer
   * name and license plate are masked, the phone number keeps only the
   * last four digits, and the financial invoice total is omitted.
   */
  function toPublicWorkOrderView(workOrder) {
    var view = {};
    for (var prop in workOrder) {
      if (Object.prototype.hasOwnProperty.call(workOrder, prop)) view[prop] = workOrder[prop];
    }
    view.customerName = maskCustomerName(workOrder.customerName);
    view.phone = maskPhoneNumber(workOrder.phone);
    view.licensePlate = maskLicensePlate(workOrder.licensePlate);
    view.estimatedTotal = null;
    view.sanitized = true;
    return view;
  }

  /*
   * lookupWorkOrder(query, phoneOrPlate, customWorkOrders)
   * Matches a work order by code (case/spacing-insensitive, bare 4-digit
   * numbers allowed), by 10-digit phone, by last-4 phone digits, or by
   * normalized Ontario license plate. When phoneOrPlate is supplied together
   * with a matching code it acts as a verification filter: a mismatch on both
   * phone and plate returns null. Returns the work order object or null.
   * PIPEDA: when phoneOrPlate is not provided (undefined or null) the lookup
   * is unauthenticated and a sanitized public view is returned instead of
   * the raw record - the full customer name, unmasked phone and financial
   * invoice totals are omitted. Passing an empty string preserves the
   * legacy internal bridge semantics (raw record) for the booking flow.
   */
  function lookupWorkOrder(query, phoneOrPlate, customWorkOrders) {
    var queryRaw = typeof query === 'string' ? query.trim() : '';
    var secondaryRaw = typeof phoneOrPlate === 'string' ? phoneOrPlate.trim() : '';
    var unauthenticated = phoneOrPlate === undefined || phoneOrPlate === null;
    if (!queryRaw && !secondaryRaw) return null;

    var pool = (Array.isArray(customWorkOrders) ? customWorkOrders.slice() : []).concat(SEED_WORK_ORDERS);
    var queryCode = normalizeWorkOrderCode(query);

    if (queryCode) {
      for (var i = 0; i < pool.length; i++) {
        var candidate = pool[i];
        if (normalizeWorkOrderCode(candidate.code) === queryCode) {
          if (!secondaryRaw) {
            return unauthenticated ? toPublicWorkOrderView(candidate) : candidate;
          }
          if (phoneOrPlateMatches(candidate, secondaryRaw)) return candidate;
          return null;
        }
      }
    }

    for (var j = 0; j < pool.length; j++) {
      if (queryRaw && phoneOrPlateMatches(pool[j], queryRaw)) {
        return unauthenticated ? toPublicWorkOrderView(pool[j]) : pool[j];
      }
    }
    for (var k = 0; k < pool.length; k++) {
      if (secondaryRaw && phoneOrPlateMatches(pool[k], secondaryRaw)) return pool[k];
    }
    return null;
  }

  function hashString(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
    }
    return hash >>> 0;
  }

  function generateWorkOrderCode(hashInput, taken) {
    var suffix = 1000 + (hashString(hashInput) % 9000);
    var attempts = 0;
    while (attempts < 9000) {
      var code = 'REV-' + String(suffix);
      if (!taken[code]) return code;
      suffix = suffix >= 9999 ? 1000 : suffix + 1;
      attempts++;
    }
    return 'REV-' + String(1000 + (hashString(hashInput + 'X') % 9000));
  }

  /*
   * createWorkOrder(bookingPayload, estimatePayload, options)
   * bookingPayload follows the validateBooking shape (customerName, phone,
   * vehicleYear/Make/Model or vehicleInfo, vehicleClass, licensePlate,
   * appointmentDate/appointmentTime or preferredDate/preferredTime,
   * serviceIds). estimatePayload is a calculateEstimate result or
   * { estimatedTotal } / { grandTotal }. options: { nowTimestamp,
   * existingCodes } for deterministic testing. Returns a new CHECKED_IN work
   * order with a unique REV-XXXX code that never collides with the seeds.
   */
  function createWorkOrder(bookingPayload, estimatePayload, options) {
    options = options || {};
    var b = bookingPayload || {};
    var estimate = estimatePayload || {};

    var customerName = typeof b.customerName === 'string' ? b.customerName.trim() : '';
    var phone = typeof b.phone === 'string' ? b.phone.trim() : '';
    var licensePlate = typeof b.licensePlate === 'string' ? b.licensePlate.trim().toUpperCase() : '';

    var vehicleParts = [];
    if (b.vehicleYear !== undefined && b.vehicleYear !== null) vehicleParts.push(String(b.vehicleYear).trim());
    if (typeof b.vehicleMake === 'string' && b.vehicleMake.trim()) vehicleParts.push(b.vehicleMake.trim());
    if (typeof b.vehicleModel === 'string' && b.vehicleModel.trim()) vehicleParts.push(b.vehicleModel.trim());
    var vehicle = (typeof b.vehicleInfo === 'string' && b.vehicleInfo.trim())
      ? b.vehicleInfo.trim()
      : vehicleParts.join(' ');

    var serviceIds = [];
    resolveServices(Array.isArray(b.serviceIds) ? b.serviceIds : []).forEach(function (svc) {
      serviceIds.push(svc.id);
    });

    var estimatedTotal = 0;
    if (typeof estimate.estimatedTotal === 'number' && isFinite(estimate.estimatedTotal)) {
      estimatedTotal = round2(estimate.estimatedTotal);
    } else if (typeof estimate.grandTotal === 'number' && isFinite(estimate.grandTotal)) {
      estimatedTotal = round2(estimate.grandTotal);
    } else if (typeof estimate.totalLow === 'number' && typeof estimate.totalHigh === 'number' &&
               isFinite(estimate.totalLow) && isFinite(estimate.totalHigh)) {
      estimatedTotal = round2((estimate.totalLow + estimate.totalHigh) / 2);
    }

    var taken = {};
    SEED_WORK_ORDERS.forEach(function (wo) { taken[wo.code] = true; });
    if (Array.isArray(options.existingCodes)) {
      options.existingCodes.forEach(function (code) { taken[code] = true; });
    }

    var date = b.preferredDate || b.appointmentDate || '';
    var time = b.preferredTime || b.appointmentTime || '';
    var hashInput = [customerName, phone, date, time, options.nowTimestamp !== undefined ? String(options.nowTimestamp) : ''].join('|');
    var code = generateWorkOrderCode(hashInput, taken);

    var createdAt = options.nowTimestamp !== undefined && options.nowTimestamp !== null
      ? new Date(options.nowTimestamp).toISOString()
      : new Date().toISOString();

    return {
      code: code,
      customerName: customerName,
      phone: phone,
      licensePlate: licensePlate,
      vehicle: vehicle,
      vehicleType: b.vehicleClass || b.vehicleType || 'sedan',
      serviceIds: serviceIds,
      currentState: 'CHECKED_IN',
      bayNumber: 'Bay 1 (Reception)',
      technicianName: 'Pending Dispatch (310S Team)',
      technicianNotes: 'Vehicle checked in at reception. Awaiting bay assignment and technician dispatch.',
      estimatedTotal: estimatedTotal,
      createdAt: createdAt,
      updatedAt: createdAt
    };
  }

  /* ================================================================== */
  /* Phase 3 - Segment 1: Owner tier configuration, local SEO schema,   */
  /* tire size calculator, printable voucher, CSV export and owner PIN. */
  /* ================================================================== */

  var TIER_CONFIG_DEFAULTS = deepFreeze({
    laborRatePerHour: 130.00,
    shopSuppliesRate: 0.05,
    shopSuppliesCap: 35.00,
    hstRate: 0.13,
    currency: 'CAD',
    defaultOwnerPin: '8351',
    bannerText: 'Seasonal Tire Swap & Ontario Safety (MTO SSC) Specials Active - Call (905) 846-8351',
    activeCoupons: COUPON_CATALOG.map(function (coupon) { return coupon.code; })
  });

  var SEO_SCHEMA_DATA = deepFreeze({
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': 'https://revolutionsautomotive.ca/#autorepair',
    name: 'Revolutions Automotive',
    description: 'Full-service auto repair, maintenance, computer diagnostics, 4-wheel laser alignments, brakes, tires, air conditioning (R134a & R1234yf) and Ontario Safety Standards Certificates (MTO SSC) in Brampton, ON.',
    telephone: '+1-905-846-8351',
    priceRange: '$$',
    currenciesAccepted: 'CAD',
    paymentAccepted: 'Cash, Debit, Visa, Mastercard, American Express',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1-15A Fisherman Dr',
      addressLocality: 'Brampton',
      addressRegion: 'ON',
      postalCode: 'L7A 1B7',
      addressCountry: 'CA'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 43.7196,
      longitude: -79.7946
    },
    openingHours: ['Mo-Fr 08:00-18:00', 'Sa 08:30-15:00'],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '08:30',
        closes: '15:00'
      }
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Revolutions Automotive Service Catalog',
      itemListElement: SERVICE_CATALOG.map(function (service) {
        return {
          '@type': 'Offer',
          priceCurrency: 'CAD',
          itemOffered: {
            '@type': 'Service',
            identifier: service.id,
            name: service.name,
            category: service.category,
            description: service.description
          }
        };
      })
    }
  });

  var TIRE_SIZE_PATTERN = /^(?:P|LT)?(\d{3})\/(\d{2,3})(?:ZR|R|\/)(\d{2})$/;

  function parseTireSize(sizeStr) {
    if (typeof sizeStr !== 'string') return null;
    var cleaned = sizeStr.trim().toUpperCase().replace(/\s+/g, '');
    var match = TIRE_SIZE_PATTERN.exec(cleaned);
    if (!match) return null;

    var width = parseInt(match[1], 10);
    var aspectRatio = parseInt(match[2], 10);
    var rimDiameter = parseInt(match[3], 10);
    if (width < 125 || width > 405) return null;
    if (aspectRatio < 20 || aspectRatio > 100) return null;
    if (rimDiameter < 10 || rimDiameter > 28) return null;

    var sidewallHeightMm = round2(width * (aspectRatio / 100));
    var overallDiameterMm = round2((2 * sidewallHeightMm) + (rimDiameter * 25.4));
    var overallDiameterInches = round2(overallDiameterMm / 25.4);
    var circumferenceMm = round2(Math.PI * overallDiameterMm);

    return {
      normalized: width + '/' + aspectRatio + 'R' + rimDiameter,
      width: width,
      aspectRatio: aspectRatio,
      rimDiameter: rimDiameter,
      sidewallHeightMm: sidewallHeightMm,
      overallDiameterMm: overallDiameterMm,
      overallDiameterInches: overallDiameterInches,
      circumferenceMm: circumferenceMm
    };
  }

  function compareTireSizes(currentSizeStr, targetSizeStr) {
    var current = parseTireSize(currentSizeStr);
    var target = parseTireSize(targetSizeStr);
    if (!current || !target) return null;

    var diameterDiffMm = round2(target.overallDiameterMm - current.overallDiameterMm);
    var diameterDiffPercent = round2((diameterDiffMm / current.overallDiameterMm) * 100);
    var isWithinTolerance = Math.abs(diameterDiffPercent) <= 3.0;
    var speedometerReadingAt100 = Math.round(100 * (current.circumferenceMm / target.circumferenceMm) * 10) / 10;

    return {
      current: current,
      target: target,
      diameterDiffMm: diameterDiffMm,
      diameterDiffInches: round2(target.overallDiameterInches - current.overallDiameterInches),
      diameterDiffPercent: diameterDiffPercent,
      sidewallDiffMm: round2(target.sidewallHeightMm - current.sidewallHeightMm),
      circumferenceDiffMm: round2(target.circumferenceMm - current.circumferenceMm),
      speedometerReadingAt100: speedometerReadingAt100,
      speedometerReadingAt100Kmh: speedometerReadingAt100,
      actualSpeedAt100Kmh: round2(100 * (target.circumferenceMm / current.circumferenceMm)),
      speedoDiffKmh: round2(speedometerReadingAt100 - 100),
      complianceRating: isWithinTolerance ? 'safe' : 'caution',
      isWithinTolerance: isWithinTolerance,
      recommendation: isWithinTolerance
        ? 'Target size is within the OEM +/- 3.0% overall diameter tolerance. Speedometer variance is minimal.'
        : 'Target size exceeds the OEM +/- 3.0% overall diameter tolerance. Speedometer and ABS calibration may be affected; consult a technician.'
    };
  }

  function isValidIsoDate(value) {
    if (typeof value !== 'string') return false;
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    var probe = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return !isNaN(probe.getTime()) &&
      probe.getUTCMonth() === Number(match[2]) - 1 &&
      probe.getUTCDate() === Number(match[3]);
  }

  function voucherCodeFromSeed(seed) {
    var hash = 5381;
    for (var i = 0; i < seed.length; i++) {
      hash = (((hash << 5) + hash) + seed.charCodeAt(i)) >>> 0;
    }
    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var chars = '';
    var remaining = hash >>> 0;
    for (var c = 0; c < 4; c++) {
      chars = alphabet.charAt(remaining % 36) + chars;
      remaining = Math.floor(remaining / 36);
    }
    return 'REV-VOUCH-' + chars;
  }

  function generateVoucherData(estimatePayload, bookingPayload) {
    var book = (bookingPayload && typeof bookingPayload === 'object') ? bookingPayload : {};
    var est;
    if (estimatePayload && typeof estimatePayload === 'object' &&
        typeof estimatePayload.subtotalLow === 'number' && typeof estimatePayload.totalLow === 'number') {
      est = estimatePayload;
    } else if (estimatePayload && typeof estimatePayload === 'object') {
      est = calculateEstimate(estimatePayload);
    } else {
      est = {
        lineItems: [],
        couponCode: null,
        partsLow: 0, partsHigh: 0,
        laborLow: 0, laborHigh: 0,
        shopSuppliesLow: 0, shopSuppliesHigh: 0,
        couponDiscountLow: 0, couponDiscountHigh: 0,
        totalDiscountLow: 0, totalDiscountHigh: 0,
        subtotalLow: 0, subtotalHigh: 0,
        hstLow: 0, hstHigh: 0,
        totalLow: 0, totalHigh: 0,
        currency: 'CAD'
      };
    }

    var issuedDate = null;
    var issuedCandidates = [
      book.issuedDate,
      (estimatePayload && typeof estimatePayload === 'object') ? estimatePayload.issuedDate : null,
      book.preferredDate
    ];
    for (var i = 0; i < issuedCandidates.length; i++) {
      if (isValidIsoDate(issuedCandidates[i])) {
        issuedDate = issuedCandidates[i];
        break;
      }
    }
    if (!issuedDate) issuedDate = new Date().toISOString().slice(0, 10);
    var issuedParts = issuedDate.split('-');
    var expiryMs = Date.UTC(Number(issuedParts[0]), Number(issuedParts[1]) - 1, Number(issuedParts[2])) + 30 * 86400000;

    var customerName = (typeof book.customerName === 'string' && book.customerName.trim())
      ? book.customerName.trim()
      : 'Valued Customer';
    var customerPhone = (typeof book.phone === 'string' && book.phone.trim())
      ? book.phone.trim()
      : SHOP_INFO.phone;

    var vehicleParts = [];
    if (book.vehicleYear !== undefined && book.vehicleYear !== null) vehicleParts.push(String(book.vehicleYear).trim());
    if (typeof book.vehicleMake === 'string' && book.vehicleMake.trim()) vehicleParts.push(book.vehicleMake.trim());
    if (typeof book.vehicleModel === 'string' && book.vehicleModel.trim()) vehicleParts.push(book.vehicleModel.trim());
    var vehicleClass = book.vehicleClass || book.vehicleType || '';
    var vehicleSummary = (typeof book.vehicleInfo === 'string' && book.vehicleInfo.trim())
      ? book.vehicleInfo.trim()
      : vehicleParts.join(' ');
    if (vehicleClass && vehicleSummary.indexOf('(') === -1) {
      vehicleSummary = vehicleSummary + ' (' + vehicleClass + ')';
    }
    if (!vehicleSummary) vehicleSummary = 'Vehicle to be confirmed at check-in';

    var couponCode = est.couponCode || null;
    var voucherCode = voucherCodeFromSeed(
      [customerName, vehicleSummary, couponCode || '', round2(est.totalLow).toFixed(2), issuedDate].join('|')
    );

    return {
      voucherCode: voucherCode,
      issuedDate: issuedDate,
      expiryDate: new Date(expiryMs).toISOString().slice(0, 10),
      validDays: 30,
      customerName: customerName,
      customerPhone: customerPhone,
      vehicleSummary: vehicleSummary,
      couponCode: couponCode,
      lineItems: Array.isArray(est.lineItems) ? est.lineItems : [],
      laborTotal: round2(est.laborLow),
      partsTotal: round2(est.partsLow),
      shopSuppliesFee: round2(est.shopSuppliesLow),
      discountAmount: round2(est.totalDiscountLow),
      subtotalLow: round2(est.subtotalLow),
      subtotalHigh: round2(est.subtotalHigh),
      subtotal: round2(est.subtotalLow),
      hstRate: SHOP_INFO.hstRate,
      hstLow: round2(est.hstLow),
      hstHigh: round2(est.hstHigh),
      hstAmount: round2(est.hstLow),
      totalLow: round2(est.totalLow),
      totalHigh: round2(est.totalHigh),
      totalAmount: round2(est.totalLow),
      currency: 'CAD',
      shopInfo: SHOP_INFO,
      disclaimer: 'Present this voucher at Revolutions Automotive (1-15A Fisherman Dr, Brampton, ON). Valid for 30 days from issue date. Shop supplies billed at 5% of labor up to a maximum of $35.00 CAD. Subject to 13% Ontario HST. Cannot be combined with other offers unless specified.'
    };
  }

  var CSV_EXPORT_HEADERS = [
    'Work Order Code', 'Customer Name', 'Phone', 'Vehicle Year', 'Vehicle Make',
    'Vehicle Model', 'Origin', 'Class', 'Date', 'Time', 'Mode', 'Status',
    'Total Low', 'Total High', 'Services'
  ];

  function csvEscapeField(value) {
    var str = (value === null || value === undefined) ? '' : String(value);
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 ||
        str.indexOf('\r') !== -1 || str.indexOf('\n') !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function exportBookingsToCsv(bookingsArray) {
    var lines = [CSV_EXPORT_HEADERS.join(',') + '\r\n'];
    if (!Array.isArray(bookingsArray)) return lines.join('');

    bookingsArray.forEach(function (item) {
      item = (item && typeof item === 'object') ? item : {};

      var services = item.services !== undefined ? item.services : item.serviceIds;
      var servicesField = '';
      if (Array.isArray(services)) servicesField = services.join('; ');
      else if (typeof services === 'string') servicesField = services;

      var totalLowStr = '';
      if (typeof item.totalLow === 'number' && isFinite(item.totalLow)) {
        totalLowStr = round2(item.totalLow).toFixed(2);
      } else if (typeof item.estimatedTotal === 'number' && isFinite(item.estimatedTotal)) {
        totalLowStr = round2(item.estimatedTotal).toFixed(2);
      }
      var totalHighStr = '';
      if (typeof item.totalHigh === 'number' && isFinite(item.totalHigh)) {
        totalHighStr = round2(item.totalHigh).toFixed(2);
      } else if (typeof item.estimatedTotal === 'number' && isFinite(item.estimatedTotal)) {
        totalHighStr = round2(item.estimatedTotal).toFixed(2);
      }

      var dateField = item.preferredDate || item.appointmentDate || '';
      if (!dateField && typeof item.createdAt === 'string') dateField = item.createdAt.slice(0, 10);

      var fields = [
        item.workOrderCode || item.code || item.confirmationCode || 'PENDING',
        item.customerName || '',
        item.customerPhone || item.phone || '',
        (item.vehicleYear !== undefined && item.vehicleYear !== null) ? String(item.vehicleYear) : '',
        item.vehicleMake || '',
        item.vehicleModel || '',
        item.origin || '',
        item.vehicleClass || item.vehicleType || '',
        dateField,
        item.preferredTime || item.appointmentTime || '',
        item.bookingMode || item.dropOffMode || '',
        item.currentState || item.status || 'BOOKED',
        totalLowStr,
        totalHighStr,
        servicesField
      ];
      lines.push(fields.map(csvEscapeField).join(',') + '\r\n');
    });

    return lines.join('');
  }

  function validateOwnerPin(enteredPin, currentPin) {
    if (enteredPin === null || enteredPin === undefined) return false;
    if (typeof enteredPin === 'boolean' || typeof enteredPin === 'object') return false;

    var candidate = String(enteredPin).trim();
    var active = (currentPin !== undefined && currentPin !== null && String(currentPin).trim() !== '')
      ? String(currentPin).trim()
      : TIER_CONFIG_DEFAULTS.defaultOwnerPin;

    if (!/^\d{4,8}$/.test(candidate)) return false;
    if (!/^\d{4,8}$/.test(active)) return false;
    if (candidate.length !== active.length) return false;

    var diff = 0;
    for (var i = 0; i < candidate.length; i++) {
      diff |= candidate.charCodeAt(i) ^ active.charCodeAt(i);
    }
    return diff === 0;
  }

  var api = Object.freeze({
    SHOP_INFO: SHOP_INFO,
    VEHICLE_MULTIPLIERS: VEHICLE_MULTIPLIERS,
    SERVICE_CATALOG: SERVICE_CATALOG,
    COUPON_CATALOG: COUPON_CATALOG,
    SYMPTOM_CATALOG: SYMPTOM_CATALOG,
    calculateEstimate: calculateEstimate,
    validateBooking: validateBooking,
    recommendServicesBySymptoms: recommendServicesBySymptoms,
    DIAGNOSTIC_DECISION_TREE: DIAGNOSTIC_DECISION_TREE,
    MTO_SSC_CHECKLIST_ITEMS: MTO_SSC_CHECKLIST_ITEMS,
    WORK_ORDER_STATES: WORK_ORDER_STATES,
    SEED_WORK_ORDERS: SEED_WORK_ORDERS,
    evaluateDiagnosticWizard: evaluateDiagnosticWizard,
    evaluateSafetyPreCheck: evaluateSafetyPreCheck,
    lookupWorkOrder: lookupWorkOrder,
    createWorkOrder: createWorkOrder,
    maskCustomerName: maskCustomerName,
    maskLicensePlate: maskLicensePlate,
    maskPhoneNumber: maskPhoneNumber,
    TIER_CONFIG_DEFAULTS: TIER_CONFIG_DEFAULTS,
    SEO_SCHEMA_DATA: SEO_SCHEMA_DATA,
    parseTireSize: parseTireSize,
    compareTireSizes: compareTireSizes,
    generateVoucherData: generateVoucherData,
    exportBookingsToCsv: exportBookingsToCsv,
    validateOwnerPin: validateOwnerPin
  });

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.RevolutionsEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
