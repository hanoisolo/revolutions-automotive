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
    appointmentDate: '',
    appointmentTime: '',
    bookingMode: 'drop_off',
    lastConfirmedBooking: null
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
    var result = Engine.calculateEstimate(currentEstimateOptions());

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
    serviceIds.forEach(function (id) {
      if (state.selectedServiceIds.indexOf(id) === -1) {
        state.selectedServiceIds.push(id);
      }
    });
    saveState();
    renderServiceGrid();
    recalculateAndRenderEstimate();
    runLiveBookingValidation(false);
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
        saveState();
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
    document.getElementById('booking-date').value = state.appointmentDate;
    document.getElementById('booking-time').value = state.appointmentTime;
    document.getElementById('booking-mode').value = state.bookingMode;
  }

  /* -------------------------------------------------------------- */
  /* Init                                                             */
  /* -------------------------------------------------------------- */

  function renderAll() {
    renderSymptomChips();
    renderSymptomRecommendations();
    renderCategoryFilter();
    renderServiceGrid();
    renderCouponWallet();
    recalculateAndRenderEstimate();
  }

  function init() {
    if (!window.RevolutionsEngine) return;
    loadState();
    bindVehicleInputs();
    bindCouponSelect();
    bindBookingInputs();
    bindLoadSample();
    syncVehicleAndCouponInputs();
    syncBookingInputs();
    renderAll();
    runLiveBookingValidation(false);
  }

  init();
})();
