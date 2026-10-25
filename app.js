/*
 * Revolutions Automotive - interactive UI controller.
 * Requires revolutions_engine.js loaded first (window.RevolutionsEngine).
 */
(function () {
  'use strict';

  var Engine = window.RevolutionsEngine;
  var STORAGE_KEY = 'revolutions_automotive_state_v1';

  var state = {
    origin: 'domestic',
    classType: 'sedan',
    year: '',
    make: '',
    model: '',
    selectedServiceIds: [],
    activeSymptoms: [],
    activeCategory: 'All',
    couponCode: '',
    customerName: '',
    customerPhone: '',
    customerPlate: '',
    appointmentDate: '',
    appointmentTime: '',
    bookingMode: 'drop_off',
    lastConfirmedBooking: null,
    wizardAnswers: {},
    wizardCurrentNodeId: 'step_anomaly',
    safetyAnswers: {},
    workOrders: [],
    activeTrackedCode: 'REV-2048',
    ownerConfig: {
      unlocked: false,
      laborRatePerHour: 130.00,
      shopSuppliesCap: 35.00,
      bannerText: '',
      customPin: ''
    }
  };

  /* -------------------------------------------------------------- */
  /* Persistence                                                      */
  /* -------------------------------------------------------------- */

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* storage unavailable - keep in-memory state only */
    }
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      Object.keys(state).forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(saved, key)) {
          state[key] = saved[key];
        }
      });
    } catch (err) {
      /* corrupted or unavailable - start fresh */
    }
  }

  /* -------------------------------------------------------------- */
  /* Formatting                                                       */
  /* -------------------------------------------------------------- */

  function fmtCAD(value) {
    return '$' + Number(value).toFixed(2) + ' CAD';
  }

  function fmtRange(low, high) {
    if (low === high) return fmtCAD(low);
    return fmtCAD(low) + ' - ' + fmtCAD(high);
  }

  /* -------------------------------------------------------------- */
  /* Live estimate                                                    */
  /* -------------------------------------------------------------- */

  function currentEstimateOptions() {
    return {
      serviceIds: state.selectedServiceIds.slice(),
      origin: state.origin,
      vehicleClass: state.classType,
      couponCode: state.couponCode || null
    };
  }

  function recalculateAndRenderEstimate() {
    var result = ownerAdjustedEstimate(Engine.calculateEstimate(currentEstimateOptions()));
    lastEstimate = result;

    document.getElementById('est-selected-count').textContent =
      result.serviceCount + (result.serviceCount === 1 ? ' service selected' : ' services selected');

    var list = document.getElementById('est-line-items');
    list.innerHTML = '';
    result.lineItems.forEach(function (item) {
      var li = document.createElement('li');
      var name = document.createElement('span');
      name.textContent = item.name;
      var price = document.createElement('span');
      price.textContent = fmtRange(item.partsLow + item.laborLow, item.partsHigh + item.laborHigh);
      li.appendChild(name);
      li.appendChild(price);
      list.appendChild(li);
    });

    document.getElementById('est-parts').textContent = fmtRange(result.partsLow, result.partsHigh);
    document.getElementById('est-labor').textContent = fmtRange(result.laborLow, result.laborHigh);

    var combo = document.getElementById('est-combo-discount');
    combo.textContent = '-' + fmtRange(result.comboDiscountLow, result.comboDiscountHigh);
    if (result.comboDiscountRate > 0) {
      combo.textContent += ' (' + Math.round(result.comboDiscountRate * 100) + '% shared-hoist savings)';
    }

    var supplies = document.getElementById('est-shop-supplies');
    supplies.textContent = fmtRange(result.shopSuppliesLow, result.shopSuppliesHigh);
    if (result.shopSuppliesLow >= Engine.SHOP_INFO.shopSuppliesCap) {
      supplies.textContent += ' (capped at $' + Engine.SHOP_INFO.shopSuppliesCap.toFixed(0) + ')';
    }

    document.getElementById('est-discount').textContent = result.couponDiscount > 0
      ? '-' + fmtCAD(result.couponDiscount)
      : fmtCAD(0);
    document.getElementById('est-coupon-status').textContent = result.couponMessage;
    document.getElementById('est-subtotal').textContent = fmtCAD(result.subtotalLow);
    document.getElementById('est-hst').textContent = fmtCAD(result.hstLow);
    document.getElementById('est-total-range').textContent = fmtRange(result.totalLow, result.totalHigh);

    return result;
  }

  /* -------------------------------------------------------------- */
  /* Symptom recommender                                              */
  /* -------------------------------------------------------------- */

  function renderSymptomChips() {
    var wrap = document.getElementById('symptom-chips');
    wrap.innerHTML = '';
    Engine.SYMPTOM_CATALOG.forEach(function (symptom) {
      var active = state.activeSymptoms.indexOf(symptom.key) !== -1;
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'symptom-chip' + (active ? ' active' : '');
      chip.textContent = symptom.label;
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      chip.addEventListener('click', function () {
        toggleSymptom(symptom.key);
      });
      wrap.appendChild(chip);
    });
  }

  function toggleSymptom(key) {
    var idx = state.activeSymptoms.indexOf(key);
    if (idx === -1) {
      state.activeSymptoms.push(key);
    } else {
      state.activeSymptoms.splice(idx, 1);
    }
    saveState();
    renderSymptomChips();
    renderSymptomRecommendations();
  }

  function renderSymptomRecommendations() {
    var box = document.getElementById('symptom-recommendations');
    box.innerHTML = '';
    if (state.activeSymptoms.length === 0) return;

    var rec = Engine.recommendServicesBySymptoms(state.activeSymptoms);

    var heading = document.createElement('h3');
    heading.textContent = 'Technician Recommendation - Urgency: ' + (rec.urgency || 'ROUTINE');
    if (rec.urgency === 'HIGH') heading.classList.add('rec-urgency-high');
    if (rec.urgency === 'MEDIUM') heading.classList.add('rec-urgency-medium');
    box.appendChild(heading);

    var list = document.createElement('ul');
    rec.recommendedServices.forEach(function (svc) {
      var li = document.createElement('li');
      li.textContent = svc.name + ' (' + svc.category + ')';
      list.appendChild(li);
    });
    box.appendChild(list);

    rec.technicianNotes.forEach(function (note) {
      var p = document.createElement('p');
      p.textContent = note;
      box.appendChild(p);
    });

    var addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn btn-primary';
    addButton.textContent = 'Add Recommended Services to Estimate';
    addButton.addEventListener('click', function () {
      addServices(rec.recommendedServiceIds);
    });
    box.appendChild(addButton);
  }

  function addServices(serviceIds) {
    /* Duplicate-aware intake: split the requested ids into services still
       missing from the estimate (toAdd) and services already selected
       (alreadySelected) so the customer gets precise feedback either way. */
    var toAdd = [];
    var alreadySelected = [];
    (serviceIds || []).forEach(function (id) {
      if (state.selectedServiceIds.indexOf(id) === -1) {
        toAdd.push(id);
      } else {
        alreadySelected.push(id);
      }
    });

    if (toAdd.length > 0) {
      toAdd.forEach(function (id) {
        state.selectedServiceIds.push(id);
      });
      saveState();
      if (document.getElementById('service-grid')) renderServiceGrid();
      if (document.getElementById('estimate-summary-card')) recalculateAndRenderEstimate();
      runLiveBookingValidation(false);
      notifyAddedServices(toAdd.length, alreadySelected.length);
    } else if (alreadySelected.length > 0) {
      notifyAlreadyAddedServices();
    }
    return toAdd.length;
  }

  /* -------------------------------------------------------------- */
  /* Phase 4: Multi-sensory add-service feedback                     */
  /* -------------------------------------------------------------- */

  /* Subtle two-tone synthetic chime (587 Hz -> 880 Hz, ~150 ms) using the
     native Web Audio API. Silent no-op when the API is unavailable. */
  function playAddServiceChime() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (typeof AudioCtx !== 'function') return false;
      var audioCtx = new AudioCtx();
      var oscillator = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      var now = audioCtx.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587, now);
      oscillator.frequency.setValueAtTime(880, now + 0.075);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.16);
      return true;
    } catch (err) {
      return false;
    }
  }

  function notifyAddedServices(count, alreadyCount) {
    playAddServiceChime();
    var toast = document.getElementById('toast-notification');
    if (toast) {
      toast.textContent = alreadyCount > 0
        ? '\u2713 Added ' + count + ' service(s) (' + alreadyCount + ' already in estimate)'
        : '\u2713 Added ' + count + ' Recommended Service' + (count === 1 ? '' : 's') + ' to Estimate!';
      toast.classList.remove('is-visible');
      void toast.offsetWidth;
      toast.classList.add('is-visible');
      window.setTimeout(function () {
        toast.classList.remove('is-visible');
      }, 3200);
    }
    var estimateCard = document.getElementById('estimate-summary-card');
    if (estimateCard) {
      estimateCard.classList.add('est-highlight-pulse');
      window.setTimeout(function () {
        estimateCard.classList.remove('est-highlight-pulse');
      }, 900);
    }
  }

  /* Nothing new to add - do not stay silent: pulse the estimate card so the
     customer sees where the services already live, and say so in the toast. */
  function notifyAlreadyAddedServices() {
    var toast = document.getElementById('toast-notification');
    if (toast) {
      toast.textContent = '\u2139 Recommended service(s) are already added to your estimate';
      toast.classList.remove('is-visible');
      void toast.offsetWidth;
      toast.classList.add('is-visible');
      window.setTimeout(function () {
        toast.classList.remove('is-visible');
      }, 3200);
    }
    var estimateCard = document.getElementById('estimate-summary-card');
    if (estimateCard) {
      estimateCard.classList.add('est-highlight-pulse');
      window.setTimeout(function () {
        estimateCard.classList.remove('est-highlight-pulse');
      }, 900);
    }
  }

  /* -------------------------------------------------------------- */
  /* Phase 4: Clear All controls                                     */
  /* -------------------------------------------------------------- */

  function clearAllSymptoms() {
    state.activeSymptoms = [];
    saveState();
    renderSymptomChips();
    renderSymptomRecommendations();
  }

  function clearSelectedServices() {
    state.selectedServiceIds = [];
    saveState();
    if (document.getElementById('service-grid')) renderServiceGrid();
    if (document.getElementById('estimate-summary-card')) recalculateAndRenderEstimate();
    runLiveBookingValidation(false);
  }

  function bindClearControls() {
    var clearSymptomsBtn = document.getElementById('btn-clear-symptoms');
    if (clearSymptomsBtn) {
      clearSymptomsBtn.addEventListener('click', clearAllSymptoms);
    }
    var clearServicesBtn = document.getElementById('btn-clear-services');
    if (clearServicesBtn) {
      clearServicesBtn.addEventListener('click', clearSelectedServices);
    }
  }

  /* -------------------------------------------------------------- */
  /* Service catalog grid                                             */
  /* -------------------------------------------------------------- */

  function renderCategoryFilter() {
    var bar = document.getElementById('category-filter-bar');
    bar.innerHTML = '';
    var categories = ['All'];
    Engine.SERVICE_CATALOG.forEach(function (svc) {
      if (categories.indexOf(svc.category) === -1) categories.push(svc.category);
    });
    categories.forEach(function (category) {
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'filter-tab' + (state.activeCategory === category ? ' active' : '');
      tab.textContent = category;
      tab.setAttribute('role', 'tab');
      tab.addEventListener('click', function () {
        state.activeCategory = category;
        saveState();
        renderCategoryFilter();
        renderServiceGrid();
      });
      bar.appendChild(tab);
    });
  }

  function renderServiceGrid() {
    var grid = document.getElementById('service-grid');
    grid.innerHTML = '';
    Engine.SERVICE_CATALOG.forEach(function (svc) {
      if (state.activeCategory !== 'All' && svc.category !== state.activeCategory) return;
      var selected = state.selectedServiceIds.indexOf(svc.id) !== -1;

      var card = document.createElement('article');
      card.className = 'service-card' + (selected ? ' selected' : '');
      card.setAttribute('aria-pressed', selected ? 'true' : 'false');
      card.dataset.serviceId = svc.id;

      var top = document.createElement('div');
      top.className = 'service-card-top';
      var category = document.createElement('span');
      category.className = 'service-category';
      category.textContent = svc.category;
      var popular = document.createElement('span');
      popular.className = 'service-popular';
      popular.textContent = svc.popular ? 'POPULAR' : '';
      top.appendChild(category);
      top.appendChild(popular);

      var name = document.createElement('h4');
      name.className = 'service-name';
      name.textContent = svc.name;

      var desc = document.createElement('p');
      desc.className = 'service-desc';
      desc.textContent = svc.description;

      var price = document.createElement('p');
      price.className = 'service-price';
      price.textContent = fmtRange(svc.basePartsLow + svc.baseLaborLow, svc.basePartsHigh + svc.baseLaborHigh);

      var meta = document.createElement('p');
      meta.className = 'service-duration';
      meta.textContent = svc.durationHours + ' h in-bay';
      var warranty = document.createElement('span');
      warranty.className = 'service-warranty';
      warranty.textContent = ' | ' + svc.warranty;
      meta.appendChild(warranty);

      var pick = document.createElement('p');
      pick.className = 'service-pick';
      pick.textContent = selected ? 'Added to estimate' : 'Tap to add to estimate';

      card.appendChild(top);
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(price);
      card.appendChild(meta);
      card.appendChild(pick);

      card.addEventListener('click', function () {
        toggleService(svc.id);
      });
      grid.appendChild(card);
    });
  }

  function toggleService(serviceId) {
    var idx = state.selectedServiceIds.indexOf(serviceId);
    if (idx === -1) {
      state.selectedServiceIds.push(serviceId);
    } else {
      state.selectedServiceIds.splice(idx, 1);
    }
    saveState();
    renderServiceGrid();
    recalculateAndRenderEstimate();
    runLiveBookingValidation(false);
  }

  /* -------------------------------------------------------------- */
  /* Coupon wallet                                                    */
  /* -------------------------------------------------------------- */

  function renderCouponWallet() {
    var wallet = document.getElementById('coupon-wallet-grid');
    wallet.innerHTML = '';
    Engine.COUPON_CATALOG.forEach(function (coupon) {
      var active = state.couponCode === coupon.code;

      var card = document.createElement('article');
      card.className = 'coupon-card' + (active ? ' active' : '');

      var badge = document.createElement('span');
      badge.className = 'coupon-badge';
      badge.textContent = coupon.badgeText;

      var title = document.createElement('h4');
      title.className = 'coupon-title';
      title.textContent = coupon.title;

      var desc = document.createElement('p');
      desc.className = 'coupon-desc';
      desc.textContent = coupon.description;

      var apply = document.createElement('button');
      apply.type = 'button';
      apply.className = 'btn btn-sample';
      apply.textContent = active ? 'Coupon Applied' : 'Apply Coupon';
      apply.addEventListener('click', function () {
        applyCoupon(coupon.code);
      });

      card.appendChild(badge);
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(apply);
      wallet.appendChild(card);
    });
  }

  function applyCoupon(code) {
    state.couponCode = state.couponCode === code ? '' : code;
    document.getElementById('coupon-select').value = state.couponCode;
    saveState();
    renderCouponWallet();
    recalculateAndRenderEstimate();
    runLiveBookingValidation(false);
  }

  /* -------------------------------------------------------------- */
  /* Vehicle profile                                                  */
  /* -------------------------------------------------------------- */

  function bindVehicleInputs() {
    document.getElementById('vehicle-origin-select').addEventListener('change', function (event) {
      state.origin = event.target.value;
      saveState();
      recalculateAndRenderEstimate();
    });
    document.getElementById('vehicle-class-select').addEventListener('change', function (event) {
      state.classType = event.target.value;
      saveState();
      recalculateAndRenderEstimate();
    });
    document.getElementById('vehicle-year-input').addEventListener('input', function (event) {
      state.year = event.target.value;
      saveState();
    });
    document.getElementById('vehicle-make-input').addEventListener('input', function (event) {
      state.make = event.target.value;
      saveState();
    });
    document.getElementById('vehicle-model-input').addEventListener('input', function (event) {
      state.model = event.target.value;
      saveState();
    });
  }

  function bindCouponSelect() {
    document.getElementById('coupon-select').addEventListener('change', function (event) {
      state.couponCode = event.target.value;
      saveState();
      renderCouponWallet();
      recalculateAndRenderEstimate();
      runLiveBookingValidation(false);
    });
  }

  function syncVehicleAndCouponInputs() {
    document.getElementById('vehicle-origin-select').value = state.origin;
    document.getElementById('vehicle-class-select').value = state.classType;
    document.getElementById('vehicle-year-input').value = state.year;
    document.getElementById('vehicle-make-input').value = state.make;
    document.getElementById('vehicle-model-input').value = state.model;
    document.getElementById('coupon-select').value = state.couponCode || '';
  }

  /* -------------------------------------------------------------- */
  /* Booking                                                          */
  /* -------------------------------------------------------------- */

  function bindBookingInputs() {
    document.getElementById('cust-name').addEventListener('input', function (event) {
      state.customerName = event.target.value;
      saveState();
      runLiveBookingValidation(false);
    });
    document.getElementById('cust-phone').addEventListener('input', function (event) {
      state.customerPhone = event.target.value;
      saveState();
      runLiveBookingValidation(false);
    });
    var plateField = document.getElementById('cust-plate');
    if (plateField) {
      plateField.addEventListener('input', function (event) {
        state.customerPlate = event.target.value;
        saveState();
        runLiveBookingValidation(false);
      });
    }
    document.getElementById('booking-date').addEventListener('input', function (event) {
      state.appointmentDate = event.target.value;
      saveState();
      runLiveBookingValidation(false);
    });
    document.getElementById('booking-time').addEventListener('input', function (event) {
      state.appointmentTime = event.target.value;
      saveState();
      runLiveBookingValidation(false);
    });
    document.getElementById('booking-mode').addEventListener('change', function (event) {
      state.bookingMode = event.target.value;
      saveState();
      runLiveBookingValidation(false);
    });
    document.getElementById('booking-form').addEventListener('submit', function (event) {
      event.preventDefault();
      var result = Engine.validateBooking(bookingPayload());
      renderBookingFeedback(result, true);
      if (result.valid) {
        state.lastConfirmedBooking = result.normalizedBooking;
        var estimate = recalculateAndRenderEstimate();
        var workOrder = Engine.createWorkOrder(bookingPayload(), estimate);
        state.workOrders.push(workOrder);
        state.activeTrackedCode = workOrder.code;
        saveState();
        renderWorkOrderConfirmation(workOrder);
      }
    });
  }

  function bindLoadSample() {
    document.getElementById('btn-load-sample').addEventListener('click', function () {
      loadSampleScenario();
    });
  }

  function bookingPayload() {
    return {
      customerName: state.customerName,
      phone: state.customerPhone,
      plate: state.customerPlate,
      vehicleYear: state.year,
      vehicleMake: state.make,
      vehicleModel: state.model,
      origin: state.origin,
      vehicleClass: state.classType,
      serviceIds: state.selectedServiceIds.slice(),
      appointmentDate: state.appointmentDate,
      appointmentTime: state.appointmentTime,
      bookingMode: state.bookingMode
    };
  }

  function bookingStarted() {
    return !!(state.customerName || state.customerPhone || state.appointmentDate || state.appointmentTime);
  }

  function runLiveBookingValidation(isSubmit) {
    var box = document.getElementById('booking-feedback');
    if (!box) return;
    if (!isSubmit && !bookingStarted()) {
      box.innerHTML = '';
      return;
    }
    renderBookingFeedback(Engine.validateBooking(bookingPayload()), isSubmit);
  }

  function renderBookingFeedback(result, isSubmit) {
    var box = document.getElementById('booking-feedback');
    box.innerHTML = '';

    if (!result.valid) {
      result.errors.forEach(function (message) {
        var line = document.createElement('div');
        line.className = 'feedback-error';
        line.textContent = message;
        box.appendChild(line);
      });
      return;
    }

    var summary = result.normalizedBooking;
    var modeLabel = summary.bookingMode === 'wait_in_lounge' ? 'wait in lounge' : 'drop-off';

    var ok = document.createElement('div');
    ok.className = 'feedback-success';
    ok.textContent = (isSubmit
      ? 'Appointment requested - Confirmation ' + result.confirmationCode + '. '
      : 'Ready to request - ') +
      summary.appointmentDate + ' at ' + summary.appointmentTime + ' (' + modeLabel + '), ' +
      Engine.SHOP_INFO.fullAddress + '. Estimated total: see live range on this page.';
    box.appendChild(ok);

    if (result.advisory) {
      var advisory = document.createElement('div');
      advisory.className = 'feedback-success';
      advisory.textContent = result.advisory;
      box.appendChild(advisory);
    }
  }

  /* -------------------------------------------------------------- */
  /* 1-click sample scenario                                          */
  /* -------------------------------------------------------------- */

  function nextTuesdayISO() {
    var now = new Date();
    var diff = (2 - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    var target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    var mm = String(target.getMonth() + 1).padStart(2, '0');
    var dd = String(target.getDate()).padStart(2, '0');
    return target.getFullYear() + '-' + mm + '-' + dd;
  }

  function loadSampleScenario() {
    state.origin = 'asian_import';
    state.classType = 'sedan';
    state.year = '2021';
    state.make = 'Honda';
    state.model = 'Civic';
    state.selectedServiceIds = ['brk_pads_rotors', 'tir_align_4whl', 'oil_full_synth'];
    state.activeSymptoms = ['squealing_brakes', 'pulling_steering'];
    state.activeCategory = 'All';
    state.couponCode = 'BRAKE50';
    state.customerName = 'Don Miller';
    state.customerPhone = '(905) 555-0149';
    state.customerPlate = 'CJDK 905';
    state.appointmentDate = nextTuesdayISO();
    state.appointmentTime = '10:00';
    state.bookingMode = 'wait_in_lounge';
    saveState();
    syncVehicleAndCouponInputs();
    syncBookingInputs();
    renderAll();
    runLiveBookingValidation(true);
  }

  function syncBookingInputs() {
    document.getElementById('cust-name').value = state.customerName;
    document.getElementById('cust-phone').value = state.customerPhone;
    var plateField = document.getElementById('cust-plate');
    if (plateField) plateField.value = state.customerPlate;
    document.getElementById('booking-date').value = state.appointmentDate;
    document.getElementById('booking-time').value = state.appointmentTime;
    document.getElementById('booking-mode').value = state.bookingMode;
  }

  /* -------------------------------------------------------------- */
  /* Phase 2: Diagnostic wizard                                      */
  /* -------------------------------------------------------------- */

  var WIZARD_STEP_PROMPTS = {
    1: 'Step 1 of 3: Select Anomaly Type',
    2: 'Step 2 of 3: Identify Location',
    3: 'Step 3 of 3: Driving Condition'
  };

  var TRIAGE_BADGE_CLASSES = {
    tow_now: 'triage-badge triage-tow_now',
    schedule_urgent: 'triage-badge triage-schedule_urgent',
    routine_inspect: 'triage-badge triage-routine_inspect'
  };

  function findServiceById(serviceId) {
    var match = Engine.SERVICE_CATALOG.filter(function (svc) { return svc.id === serviceId; });
    return match.length > 0 ? match[0] : null;
  }

  function resetWizard() {
    state.wizardAnswers = {};
    state.wizardCurrentNodeId = Engine.DIAGNOSTIC_DECISION_TREE.rootNodeId;
    saveState();
    renderWizardStep();
  }

  function renderWizardStep() {
    var node = Engine.DIAGNOSTIC_DECISION_TREE.nodes[state.wizardCurrentNodeId];
    if (!node) {
      resetWizard();
      return;
    }
    var container = document.getElementById('wizard-container');
    var indicator = document.getElementById('wizard-step-indicator');
    var optionsBox = document.getElementById('wizard-options');
    var resultCard = document.getElementById('wizard-result-card');

    container.dataset.currentNodeId = state.wizardCurrentNodeId;
    optionsBox.innerHTML = '';
    resultCard.hidden = true;

    if (node.type === 'question') {
      indicator.textContent = WIZARD_STEP_PROMPTS[node.stepNumber] || WIZARD_STEP_PROMPTS[3];
      node.options.forEach(function (option) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'wizard-option';
        card.textContent = option.label;
        card.addEventListener('click', function () {
          state.wizardAnswers[node.answerKey] = option.value;
          state.wizardCurrentNodeId = option.nextNodeId;
          saveState();
          renderWizardStep();
        });
        optionsBox.appendChild(card);
      });
      return;
    }
    renderWizardResult();
  }

  function renderWizardResult() {
    var outcome = Engine.evaluateDiagnosticWizard(state.wizardAnswers);
    var service = findServiceById(outcome.serviceId);
    var indicator = document.getElementById('wizard-step-indicator');
    var optionsBox = document.getElementById('wizard-options');
    var resultCard = document.getElementById('wizard-result-card');
    var addButton = document.getElementById('btn-wizard-add-service');

    indicator.textContent = 'Diagnosis complete - ' + (service ? service.name : outcome.serviceId);
    optionsBox.innerHTML = '';
    resultCard.innerHTML = '';

    var badge = document.createElement('span');
    badge.className = TRIAGE_BADGE_CLASSES[outcome.triageLevel] || TRIAGE_BADGE_CLASSES.routine_inspect;
    badge.textContent = outcome.triageLevel.replace(/_/g, ' ').toUpperCase();
    resultCard.appendChild(badge);

    var urgency = document.createElement('p');
    urgency.className = 'wizard-tech-notes';
    urgency.textContent = outcome.recommendedUrgency;
    resultCard.appendChild(urgency);

    var causeTitle = document.createElement('h4');
    causeTitle.textContent = 'Probable Root Causes';
    resultCard.appendChild(causeTitle);

    var causes = document.createElement('ul');
    causes.className = 'wizard-cause-list';
    outcome.rootCauses.forEach(function (cause) {
      var li = document.createElement('li');
      li.textContent = cause;
      causes.appendChild(li);
    });
    resultCard.appendChild(causes);

    var recommended = document.createElement('p');
    recommended.textContent = 'Recommended service: ' +
      (service ? service.name + ' (' + service.category + ')' : outcome.serviceId);
    resultCard.appendChild(recommended);

    var notes = document.createElement('p');
    notes.className = 'wizard-tech-notes';
    notes.textContent = 'Technician notes: ' + outcome.technicianNotes;
    resultCard.appendChild(notes);

    addButton.dataset.recommendedServiceId = outcome.serviceId;
    resultCard.appendChild(addButton);

    var startOver = document.createElement('button');
    startOver.type = 'button';
    startOver.className = 'btn btn-sample-alt';
    startOver.textContent = 'Start Over';
    startOver.addEventListener('click', function () {
      resetWizard();
    });
    resultCard.appendChild(startOver);

    resultCard.hidden = false;
  }

  function bindWizard() {
    document.getElementById('btn-wizard-add-service').addEventListener('click', function () {
      var addButton = document.getElementById('btn-wizard-add-service');
      var serviceId = addButton.dataset.recommendedServiceId;
      if (!serviceId) return;
      addServices([serviceId]);
      var service = findServiceById(serviceId);
      document.getElementById('wizard-step-indicator').textContent =
        'Added to estimate: ' + (service ? service.name : serviceId) + ' - see the live estimate breakdown.';
      document.getElementById('estimate-summary-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    renderWizardStep();
  }

  /* -------------------------------------------------------------- */
  /* Phase 2: Ontario MTO safety pre-check                          */
  /* -------------------------------------------------------------- */

  var SAFETY_ANSWER_VALUES = { pass: true, fail: false, unsure: 'unsure' };

  var SAFETY_TOGGLE_DEFS = [
    { choice: 'pass', className: 'toggle-pass', label: 'Pass' },
    { choice: 'fail', className: 'toggle-fail', label: 'Fail' },
    { choice: 'unsure', className: 'toggle-unsure', label: 'Unsure' }
  ];

  function safetyVerdictClass(status) {
    if (status === 'pass') return 'is-pass';
    if (status === 'advisory') return 'is-advisory';
    return 'is-fail';
  }

  function gaugeColor(status) {
    if (status === 'pass') return 'var(--emerald)';
    if (status === 'advisory') return 'var(--gold)';
    return 'var(--crimson)';
  }

  function renderSafetyChecklist() {
    var container = document.getElementById('safety-checklist-container');
    container.innerHTML = '';
    Engine.MTO_SSC_CHECKLIST_ITEMS.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'safety-item';

      var text = document.createElement('div');
      text.className = 'safety-item-text';
      var title = document.createElement('h4');
      title.className = 'safety-item-title';
      title.textContent = item.areaLabel;
      var sev = document.createElement('span');
      sev.className = 'sev-' + item.severity;
      sev.textContent = ' [' + item.severity.toUpperCase() + ']';
      title.appendChild(sev);
      var question = document.createElement('p');
      question.className = 'safety-item-question';
      question.textContent = item.question;
      text.appendChild(title);
      text.appendChild(question);

      var toggles = document.createElement('div');
      toggles.className = 'safety-toggle-group';
      SAFETY_TOGGLE_DEFS.forEach(function (def) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'safety-toggle ' + def.className;
        btn.textContent = def.label;
        var current = state.safetyAnswers[item.id];
        var isActive = (def.choice === 'pass' && current === true) ||
          (def.choice === 'fail' && current === false) ||
          (def.choice === 'unsure' && current === 'unsure');
        if (isActive) btn.classList.add('active');
        btn.addEventListener('click', function () {
          state.safetyAnswers[item.id] = SAFETY_ANSWER_VALUES[def.choice];
          saveState();
          renderSafetyChecklist();
          renderSafetyVerdict();
        });
        toggles.appendChild(btn);
      });

      card.appendChild(text);
      card.appendChild(toggles);
      container.appendChild(card);
    });
  }

  function renderSafetyVerdict() {
    var evaluation = Engine.evaluateSafetyPreCheck(state.safetyAnswers);
    var gauge = document.getElementById('safety-score-gauge');
    var alertBox = document.getElementById('safety-summary-alert');

    gauge.classList.remove('is-pass', 'is-advisory', 'is-fail');
    gauge.classList.add(safetyVerdictClass(evaluation.status));
    gauge.style.background =
      'radial-gradient(closest-side, var(--surface-2) 79%, transparent 80% 100%),' +
      'conic-gradient(' + gaugeColor(evaluation.status) + ' ' + evaluation.score + '%, var(--surface-2) 0)';
    gauge.querySelector('.gauge-percent').textContent = evaluation.score + '%';

    alertBox.classList.remove('is-pass', 'is-advisory', 'is-fail');
    alertBox.classList.add(safetyVerdictClass(evaluation.status));
    alertBox.innerHTML = '';

    var verdict = document.createElement('p');
    verdict.style.margin = '0 0 0.35rem';
    verdict.textContent = evaluation.status.toUpperCase() + ' - Score ' + evaluation.score + '%. ' + evaluation.notes;
    alertBox.appendChild(verdict);

    if (evaluation.criticalFails.length > 0) {
      var critical = document.createElement('p');
      critical.style.margin = '0 0 0.35rem';
      critical.style.fontWeight = '700';
      critical.textContent = 'Instant-fail for Ontario MTO certification: ' +
        evaluation.criticalFails.map(function (fail) { return fail.areaLabel; }).join(', ') +
        '. Critical defects must be repaired before a Safety Standards Certificate can be issued - this includes used-vehicle sales and Brampton rideshare licensing.';
      alertBox.appendChild(critical);
    }

    if (evaluation.recommendedServiceIds.length > 0) {
      var recs = document.createElement('p');
      recs.style.margin = '0';
      recs.textContent = 'Recommended corrective services: ' + evaluation.recommendedServiceIds.map(function (id) {
        var svc = findServiceById(id);
        return svc ? svc.name : id;
      }).join('; ') + '.';
      alertBox.appendChild(recs);
    }
  }

  function resetSafetyChecklist() {
    state.safetyAnswers = {};
    saveState();
    if (!document.getElementById('safety-checklist-container')) return;
    renderSafetyChecklist();
    renderSafetyVerdict();
  }

  function bindSafetyPreCheck() {
    document.getElementById('btn-safety-book-inspection').addEventListener('click', function () {
      var evaluation = Engine.evaluateSafetyPreCheck(state.safetyAnswers);
      addServices(['mto_safety_exhaust'].concat(evaluation.recommendedServiceIds));
      if (document.getElementById('booking-form')) {
        document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('cust-name').focus();
      } else {
        window.location.href = 'index.html#booking-form';
      }
    });
    var resetBtn = document.getElementById('btn-safety-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetSafetyChecklist);
    }
    var cancelBtn = document.getElementById('btn-safety-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        window.location.href = 'index.html';
      });
    }
    renderSafetyChecklist();
    renderSafetyVerdict();
  }

  /* -------------------------------------------------------------- */
  /* Phase 2: Live repair bay & work order tracker                   */
  /* -------------------------------------------------------------- */

  var TIMELINE_LABELS = [
    'Checked In',
    'Inspection & Diagnostics',
    'Parts Ordered',
    'In Bay / Repairing',
    'Quality & Alignment',
    'Ready for Pickup'
  ];

  var STAGE_ETA = {
    CHECKED_IN: 'Estimated completion: 1-2 business days.',
    INSPECTION_DIAGNOSTIC: 'Estimated completion: 1-2 business days.',
    PARTS_ORDERED: 'Estimated completion: later today or tomorrow, depending on parts arrival.',
    IN_BAY_REPAIRING: 'Estimated completion: end of day.',
    QUALITY_ALIGNMENT_TEST: 'Estimated completion: within the hour.',
    READY_FOR_PICKUP: 'Ready for pickup now.'
  };

  function renderTimeline(workOrder) {
    var timeline = document.getElementById('tracker-status-timeline');
    timeline.innerHTML = '';
    var currentIndex = workOrder ? Engine.WORK_ORDER_STATES.indexOf(workOrder.currentState) : -1;
    Engine.WORK_ORDER_STATES.forEach(function (stageName, index) {
      var li = document.createElement('li');
      li.className = 'tl-step';
      if (currentIndex === -1 || index > currentIndex) {
        li.classList.add('is-pending');
      } else if (index < currentIndex) {
        li.classList.add('is-complete');
      } else {
        li.classList.add('is-active');
      }
      li.textContent = TIMELINE_LABELS[index];
      timeline.appendChild(li);
    });
  }

  function renderTechnicianNotes(workOrder) {
    var panel = document.getElementById('tracker-technician-notes');
    panel.innerHTML = '';

    var title = document.createElement('p');
    title.className = 'tracker-notes-title';
    title.textContent = 'Work Order ' + workOrder.code + ' - ' + workOrder.currentState.replace(/_/g, ' ');
    panel.appendChild(title);

    var meta = document.createElement('p');
    meta.className = 'tracker-notes-meta';
    /* PIPEDA: the public tracker never renders the customer's full last
       name or unmasked plate - always the masked forms. */
    meta.textContent = workOrder.vehicle + ' | Customer: ' +
      Engine.maskCustomerName(workOrder.customerName) + ' | Plate: ' +
      Engine.maskLicensePlate(workOrder.licensePlate);
    panel.appendChild(meta);

    var bay = document.createElement('p');
    bay.className = 'tracker-notes-meta';
    bay.textContent = 'Bay: ' + workOrder.bayNumber + ' | Technician: ' + workOrder.technicianName +
      (typeof workOrder.estimatedTotal === 'number'
        ? ' | Estimated total: ' + fmtCAD(workOrder.estimatedTotal)
        : '') + '.';
    panel.appendChild(bay);

    var services = document.createElement('p');
    services.className = 'tracker-notes-meta';
    services.textContent = 'Services: ' + workOrder.serviceIds.map(function (id) {
      var svc = findServiceById(id);
      return svc ? svc.name : id;
    }).join('; ') + '.';
    panel.appendChild(services);

    var eta = document.createElement('p');
    eta.className = 'tracker-notes-meta';
    eta.textContent = STAGE_ETA[workOrder.currentState] || 'Estimated completion: call the shop for details.';
    panel.appendChild(eta);

    var notes = document.createElement('p');
    notes.textContent = 'Bay notes: ' + workOrder.technicianNotes;
    panel.appendChild(notes);
  }

  function trackVehicle(code, phoneOrPlate) {
    var feedback = document.getElementById('tracker-feedback');
    /* PIPEDA: a blank phone/plate field is an unauthenticated query - the
       engine then returns the sanitized public view (masked name, phone and
       plate, invoice totals omitted). A provided value acts as secondary
       verification and unlocks the full record. */
    var verification = (typeof phoneOrPlate === 'string' && phoneOrPlate.trim()) ? phoneOrPlate : null;
    if (verification) {
      /* Universal normalization before lookup: phone-shaped values collapse
         to 10 digits, everything else is treated as a plate. */
      var normalizedPhone = Engine.normalizePhoneNumber(verification);
      verification = normalizedPhone.replace(/\D/g, '').length >= 10
        ? normalizedPhone
        : Engine.normalizePlateNumber(verification);
    }
    var workOrder = Engine.lookupWorkOrder(code, verification, state.workOrders);

    if (!workOrder) {
      renderTimeline(null);
      document.getElementById('tracker-technician-notes').innerHTML = '';
      feedback.innerHTML = '';
      var miss = document.createElement('div');
      miss.className = 'feedback-error';
      miss.textContent = 'No work order found matching that code or phone number. Call our Brampton shop at (905) 846-8351 for live bay updates.';
      feedback.appendChild(miss);
      return null;
    }

    state.activeTrackedCode = workOrder.code;
    saveState();
    renderTimeline(workOrder);
    renderTechnicianNotes(workOrder);
    feedback.innerHTML = '';
    document.getElementById('tracker-input-code').value = workOrder.code;
    return workOrder;
  }

  function clearTrackerPanel() {
    var codeInput = document.getElementById('tracker-input-code');
    if (codeInput) codeInput.value = '';
    var phoneInput = document.getElementById('tracker-input-phone');
    if (phoneInput) phoneInput.value = '';
    var notes = document.getElementById('tracker-technician-notes');
    if (notes) notes.innerHTML = '';
    renderTimeline(null);
    var feedback = document.getElementById('tracker-feedback');
    if (feedback) feedback.innerHTML = '';
  }

  /* Phase 4: URL query parameter support on track.html
     (e.g. track.html?code=REV-2048 auto-runs the lookup). */
  function trackFromUrl() {
    if (typeof window.URLSearchParams !== 'function') return false;
    var params = new window.URLSearchParams(window.location.search);
    var code = params.get('code');
    if (!code) return false;
    var phone = params.get('phone') || '';
    var codeInput = document.getElementById('tracker-input-code');
    if (codeInput) codeInput.value = code;
    var phoneInput = document.getElementById('tracker-input-phone');
    if (phoneInput) phoneInput.value = phone;
    trackVehicle(code, phone);
    return true;
  }

  /* Phase 5: Staff / demo preset tools stay out of the customer's way -
     collapsed behind #btn-toggle-demo unless ?demo=1 is in the URL or the
     toggle is clicked. */
  function isDemoModeFromUrl() {
    if (typeof window.URLSearchParams !== 'function') return false;
    return new window.URLSearchParams(window.location.search).get('demo') === '1';
  }

  function bindDemoTools() {
    var tools = document.getElementById('tracker-demo-tools');
    var toggle = document.getElementById('btn-toggle-demo');
    if (!tools || !toggle) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'tracker-demo-tools');
    if (isDemoModeFromUrl()) {
      tools.classList.remove('is-collapsed');
      toggle.setAttribute('aria-expanded', 'true');
    }
    toggle.addEventListener('click', function () {
      var collapsed = tools.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  }

  function bindBayTracker() {
    document.getElementById('btn-track-vehicle').addEventListener('click', function () {
      trackVehicle(
        document.getElementById('tracker-input-code').value,
        document.getElementById('tracker-input-phone').value
      );
    });
    var trackClearBtn = document.getElementById('btn-track-clear');
    if (trackClearBtn) {
      trackClearBtn.addEventListener('click', clearTrackerPanel);
    }
    document.getElementById('btn-track-sample-1').addEventListener('click', function () {
      document.getElementById('tracker-input-code').value = 'REV-2048';
      document.getElementById('tracker-input-phone').value = '';
      trackVehicle('REV-2048', '');
    });
    document.getElementById('btn-track-sample-2').addEventListener('click', function () {
      document.getElementById('tracker-input-code').value = 'REV-3105';
      document.getElementById('tracker-input-phone').value = '';
      trackVehicle('REV-3105', '');
    });
    if (!trackFromUrl()) {
      trackVehicle(state.activeTrackedCode || 'REV-2048', '');
    }
  }

  /* -------------------------------------------------------------- */
  /* Phase 2: Appointment-to-tracker bridge                          */
  /* -------------------------------------------------------------- */

  function renderWorkOrderConfirmation(workOrder) {
    var box = document.getElementById('booking-feedback');
    var panel = document.createElement('div');
    panel.className = 'feedback-success';

    var codeLine = document.createElement('p');
    codeLine.style.margin = '0 0 0.4rem';
    codeLine.textContent = 'Your live work order has been created: ' + workOrder.code +
      ' (' + workOrder.currentState.replace(/_/g, ' ') + ', ' + workOrder.bayNumber + ').';
    panel.appendChild(codeLine);

    var trackBtn = document.createElement('button');
    trackBtn.type = 'button';
    trackBtn.className = 'btn btn-primary';
    trackBtn.textContent = 'Track My Vehicle Now';
    trackBtn.addEventListener('click', function () {
      window.location.href = 'track.html?code=' + encodeURIComponent(workOrder.code);
    });
    panel.appendChild(trackBtn);

    box.appendChild(panel);
  }

  /* -------------------------------------------------------------- */
  /* Init                                                             */
  /* -------------------------------------------------------------- */

  /* ================================================================== */
  /* Phase 3: Tire calculator, printable voucher and owner admin drawer */
  /* ================================================================== */

  var lastEstimate = null;

  function round2(value) {
    if (typeof value !== 'number' || !isFinite(value)) return 0;
    return Math.floor(value * 100 + 0.5 + 1e-9) / 100;
  }

  /* Applies the shop owner's live labor rate / supplies cap overrides to the
     engine estimate without mutating the frozen catalog or engine state. */
  function ownerAdjustedEstimate(result) {
    var cfg = state.ownerConfig || {};
    var baseRate = Engine.TIER_CONFIG_DEFAULTS.laborRatePerHour;
    var baseCap = Engine.TIER_CONFIG_DEFAULTS.shopSuppliesCap;
    var rate = Number(cfg.laborRatePerHour) > 0 ? Number(cfg.laborRatePerHour) : baseRate;
    var rawCap = Number(cfg.shopSuppliesCap);
    var cap = (isFinite(rawCap) && rawCap >= 0) ? rawCap : baseCap;
    var scale = rate / baseRate;
    if (scale === 1 && cap === baseCap) return result;

    var bounds = {};
    ['Low', 'High'].forEach(function (key) {
      var labor = round2(result['labor' + key] * scale);
      var combo = round2(labor * result.comboDiscountRate);
      var net = round2(labor - combo);
      var supplies = Math.min(cap, round2(net * Engine.SHOP_INFO.shopSuppliesRate));
      var preCoupon = round2(result['parts' + key] + net + supplies);
      var subtotal = Math.max(0, round2(preCoupon - result['couponDiscount' + key]));
      var hst = round2(subtotal * Engine.SHOP_INFO.hstRate);
      bounds[key] = {
        labor: labor,
        combo: combo,
        supplies: supplies,
        subtotal: subtotal,
        hst: hst,
        total: round2(subtotal + hst)
      };
    });

    var adjusted = {};
    for (var prop in result) {
      if (Object.prototype.hasOwnProperty.call(result, prop)) adjusted[prop] = result[prop];
    }
    adjusted.laborLow = bounds.Low.labor;
    adjusted.laborHigh = bounds.High.labor;
    adjusted.comboDiscountLow = bounds.Low.combo;
    adjusted.comboDiscountHigh = bounds.High.combo;
    adjusted.shopSuppliesLow = bounds.Low.supplies;
    adjusted.shopSuppliesHigh = bounds.High.supplies;
    adjusted.subtotalLow = bounds.Low.subtotal;
    adjusted.subtotalHigh = bounds.High.subtotal;
    adjusted.hstLow = bounds.Low.hst;
    adjusted.hstHigh = bounds.High.hst;
    adjusted.totalLow = bounds.Low.total;
    adjusted.totalHigh = bounds.High.total;
    adjusted.lineItems = result.lineItems.map(function (li) {
      var copy = {};
      for (var p in li) {
        if (Object.prototype.hasOwnProperty.call(li, p)) copy[p] = li[p];
      }
      copy.laborLow = round2(li.laborLow * scale);
      copy.laborHigh = round2(li.laborHigh * scale);
      return copy;
    });
    return adjusted;
  }

  function renderAnnouncementBanner() {
    var slot = document.getElementById('announcement-banner-text');
    if (!slot) return;
    var text = (state.ownerConfig && state.ownerConfig.bannerText) ||
      Engine.TIER_CONFIG_DEFAULTS.bannerText;
    slot.textContent = text;
  }

  /* --- Seasonal tire & rim size calculator ------------------------- */

  function bindTireCalculator() {
    var results = document.getElementById('tire-comparison-results');

    function signed(value, unit) {
      var sign = value > 0 ? '+' : '';
      return sign + value + (unit || '');
    }

    function metricCard(label, valueText, deltaText) {
      var card = document.createElement('div');
      card.className = 'tire-metric-card';
      var labelEl = document.createElement('p');
      labelEl.className = 'tire-metric-label';
      labelEl.textContent = label;
      var valueEl = document.createElement('p');
      valueEl.className = 'tire-metric-value';
      valueEl.textContent = valueText;
      card.appendChild(labelEl);
      card.appendChild(valueEl);
      if (deltaText) {
        var deltaEl = document.createElement('p');
        deltaEl.className = 'tire-metric-delta';
        deltaEl.textContent = deltaText;
        card.appendChild(deltaEl);
      }
      return card;
    }

    function runComparison() {
      var currentVal = document.getElementById('tire-input-current').value;
      var targetVal = document.getElementById('tire-input-target').value;
      var current = Engine.parseTireSize(currentVal);
      var target = Engine.parseTireSize(targetVal);
      var comparison = Engine.compareTireSizes(currentVal, targetVal);
      var badge = document.getElementById('tire-fitment-badge');
      results.innerHTML = '';

      if (!current || !target || !comparison) {
        var hint = document.createElement('p');
        hint.className = 'tire-format-hint';
        hint.textContent = 'Please enter standard metric sizes like 205/55R16, 225/45R17, or P215/60R16.';
        results.appendChild(hint);
        badge.className = 'fitment-badge';
        badge.textContent = 'ENTER VALID TIRE SIZES';
        document.getElementById('tire-speedo-diff').textContent = 'Speedometer at 100 km/h: —';
        return;
      }

      results.appendChild(metricCard('Section Width',
        current.width + ' mm → ' + target.width + ' mm',
        signed(target.width - current.width, ' mm')));
      results.appendChild(metricCard('Overall Diameter',
        current.overallDiameterMm + ' mm → ' + target.overallDiameterMm + ' mm',
        signed(comparison.diameterDiffMm, ' mm') + ' (' + signed(comparison.diameterDiffPercent, '%') + ')'));
      results.appendChild(metricCard('Sidewall Height',
        current.sidewallHeightMm + ' mm → ' + target.sidewallHeightMm + ' mm',
        signed(comparison.sidewallDiffMm, ' mm')));
      results.appendChild(metricCard('Circumference',
        current.circumferenceMm + ' mm → ' + target.circumferenceMm + ' mm',
        signed(comparison.circumferenceDiffMm, ' mm')));

      var speedoMessage = 'Speedometer reads ' + comparison.speedometerReadingAt100 +
        ' km/h when traveling 100 km/h';
      if (comparison.diameterDiffPercent > 0) {
        speedoMessage += ' (actual speed is faster)';
      } else if (comparison.diameterDiffPercent < 0) {
        speedoMessage += ' (actual speed is slower)';
      }
      document.getElementById('tire-speedo-diff').textContent = speedoMessage;

      if (comparison.complianceRating === 'safe') {
        badge.className = 'fitment-badge is-safe';
        badge.textContent = 'OEM FITMENT SAFE (±3.0% GUIDELINE)';
      } else {
        badge.className = 'fitment-badge is-caution';
        badge.textContent = 'FITMENT CAUTION (> 3.0% VARIANCE - SPEEDO / GEARING CALIBRATION REQUIRED)';
      }
    }

    document.getElementById('btn-calc-tires').addEventListener('click', runComparison);
    document.getElementById('tire-input-current').addEventListener('change', runComparison);
    document.getElementById('tire-input-target').addEventListener('change', runComparison);
    runComparison();
  }

  /* --- Printable voucher modal -------------------------------------- */

  function bindVoucherModal() {
    var modal = document.getElementById('voucher-modal');

    function openVoucherModal() {
      if (state.selectedServiceIds.length === 0) {
        window.alert('Please select at least one service before printing your estimate voucher.');
        return;
      }
      if (!lastEstimate) lastEstimate = recalculateAndRenderEstimate();
      var voucher = Engine.generateVoucherData(lastEstimate, bookingPayload());

      document.getElementById('voucher-code-display').textContent = voucher.voucherCode;
      document.getElementById('voucher-expiry-date').textContent = voucher.expiryDate +
        ' (' + voucher.validDays + '-day rolling validity)';

      var tbody = document.getElementById('voucher-line-items');
      tbody.innerHTML = '';
      var intro = document.createElement('tr');
      var introCell = document.createElement('td');
      introCell.setAttribute('colspan', '3');
      introCell.textContent = 'Customer: ' + voucher.customerName +
        ' — Vehicle: ' + voucher.vehicleSummary +
        (voucher.couponCode ? ' — Coupon: ' + voucher.couponCode : '');
      intro.appendChild(introCell);
      tbody.appendChild(intro);
      voucher.lineItems.forEach(function (item) {
        var row = document.createElement('tr');
        var name = document.createElement('td');
        name.textContent = item.name;
        var parts = document.createElement('td');
        parts.textContent = fmtRange(item.partsLow, item.partsHigh);
        var labor = document.createElement('td');
        labor.textContent = fmtRange(item.laborLow, item.laborHigh);
        row.appendChild(name);
        row.appendChild(parts);
        row.appendChild(labor);
        tbody.appendChild(row);
      });

      document.getElementById('voucher-supplies').textContent = fmtCAD(voucher.shopSuppliesFee);
      document.getElementById('voucher-subtotal').textContent = fmtRange(voucher.subtotalLow, voucher.subtotalHigh);
      document.getElementById('voucher-hst').textContent = fmtRange(voucher.hstLow, voucher.hstHigh);
      document.getElementById('voucher-total').textContent = fmtRange(voucher.totalLow, voucher.totalHigh) +
        ' (13% Ontario HST included)';
      document.getElementById('voucher-print-area').setAttribute('data-voucher-code', voucher.voucherCode);

      modal.hidden = false;
      modal.classList.add('active');
    }

    document.getElementById('btn-print-estimate').addEventListener('click', openVoucherModal);
    document.getElementById('btn-close-voucher').addEventListener('click', function () {
      modal.hidden = true;
      modal.classList.remove('active');
    });
    document.getElementById('btn-print-voucher').addEventListener('click', function () {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
    });
  }

  /* --- Shop owner config drawer ------------------------------------- */

  function setOwnerFeedback(message, kind) {
    var box = document.getElementById('owner-status-feedback');
    box.textContent = message;
    box.className = 'owner-status-feedback ' + (kind || '');
  }

  function downloadCsv(csv) {
    try {
      if (typeof window.Blob === 'function' && typeof window.URL !== 'undefined' &&
          typeof window.URL.createObjectURL === 'function') {
        var blob = new window.Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'revolutions_automotive_bookings.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
      }
    } catch (err) {
      /* download unsupported in this environment - CSV stays in memory */
    }
    return false;
  }

  function bindOwnerDrawer() {
    if (!state.ownerConfig) {
      state.ownerConfig = {
        unlocked: false,
        laborRatePerHour: 130.00,
        shopSuppliesCap: 35.00,
        bannerText: '',
        customPin: ''
      };
    }
    if (!state.ownerConfig.bannerText) {
      state.ownerConfig.bannerText = Engine.TIER_CONFIG_DEFAULTS.bannerText;
    }
    if (!state.ownerConfig.customPin) {
      state.ownerConfig.customPin = Engine.TIER_CONFIG_DEFAULTS.defaultOwnerPin;
    }

    renderAnnouncementBanner();
    document.getElementById('owner-labor-rate-input').value = String(state.ownerConfig.laborRatePerHour);
    document.getElementById('owner-supplies-cap-input').value = String(state.ownerConfig.shopSuppliesCap);
    document.getElementById('owner-banner-text-input').value = state.ownerConfig.bannerText;

    if (state.ownerConfig.unlocked) {
      document.getElementById('owner-panel-content').hidden = false;
      document.getElementById('owner-pin-input').hidden = true;
    }

    var drawer = document.getElementById('owner-drawer');
    var toggle = document.getElementById('owner-drawer-toggle');
    toggle.addEventListener('click', function () {
      var opening = drawer.hidden;
      drawer.hidden = !opening;
      toggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
    });

    document.getElementById('btn-owner-unlock').addEventListener('click', function () {
      var entered = document.getElementById('owner-pin-input').value;
      if (Engine.validateOwnerPin(entered, state.ownerConfig.customPin)) {
        state.ownerConfig.unlocked = true;
        saveState();
        document.getElementById('owner-panel-content').hidden = false;
        document.getElementById('owner-pin-input').hidden = true;
        setOwnerFeedback('Admin Unlocked', 'is-success');
      } else {
        setOwnerFeedback('Invalid PIN. Contact shop administrator.', 'is-error');
      }
    });

    document.getElementById('btn-owner-save').addEventListener('click', function () {
      var rate = Number(document.getElementById('owner-labor-rate-input').value);
      var cap = Number(document.getElementById('owner-supplies-cap-input').value);
      var banner = document.getElementById('owner-banner-text-input').value.trim();

      if (!(rate > 0)) {
        setOwnerFeedback('Labor rate must be greater than $0.00 CAD/hr.', 'is-error');
        return;
      }
      if (!(cap >= 0)) {
        setOwnerFeedback('Shop supplies cap must be $0.00 CAD or more.', 'is-error');
        return;
      }

      state.ownerConfig.laborRatePerHour = round2(rate);
      state.ownerConfig.shopSuppliesCap = round2(cap);
      if (banner) state.ownerConfig.bannerText = banner;
      saveState();
      renderAnnouncementBanner();
      recalculateAndRenderEstimate();
      setOwnerFeedback('Configuration saved. Live estimates and announcement banner updated.', 'is-success');
    });

    document.getElementById('btn-owner-export-csv').addEventListener('click', function () {
      var records = [];
      if (state.lastConfirmedBooking) records.push(state.lastConfirmedBooking);
      records = records.concat(state.workOrders || []).concat(Engine.SEED_WORK_ORDERS);
      var csv = Engine.exportBookingsToCsv(records);
      var downloaded = downloadCsv(csv);
      setOwnerFeedback(
        'Bookings export ready: revolutions_automotive_bookings.csv (' + records.length +
        ' records)' + (downloaded ? ' - download started.' : ''),
        'is-success'
      );
    });
  }

  function renderAll() {
    renderSymptomChips();
    renderSymptomRecommendations();
    renderCategoryFilter();
    renderServiceGrid();
    renderCouponWallet();
    recalculateAndRenderEstimate();
  }

  /* Page-aware init: app.js is shared by index.html, track.html and
     safety.html - each module only binds when its anchor element exists on
     the current page. */
  function init() {
    if (!window.RevolutionsEngine) return;
    loadState();
    if (document.getElementById('vehicle-origin-select')) {
      bindVehicleInputs();
      syncVehicleAndCouponInputs();
    }
    if (document.getElementById('coupon-select')) bindCouponSelect();
    if (document.getElementById('booking-form')) {
      bindBookingInputs();
      syncBookingInputs();
    }
    if (document.getElementById('btn-load-sample')) bindLoadSample();
    bindClearControls();
    if (document.getElementById('wizard-container')) bindWizard();
    if (document.getElementById('safety-checklist-container')) bindSafetyPreCheck();
    if (document.getElementById('btn-track-vehicle')) bindBayTracker();
    bindDemoTools();
    if (document.getElementById('tire-calc-section')) bindTireCalculator();
    if (document.getElementById('voucher-modal')) bindVoucherModal();
    if (document.getElementById('owner-drawer-toggle')) bindOwnerDrawer();
    renderAnnouncementBanner();
    if (document.getElementById('estimate-summary-card')) renderAll();
    runLiveBookingValidation(false);
  }

  init();
})();
