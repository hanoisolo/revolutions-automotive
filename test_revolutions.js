/*
 * Revolutions Automotive - Segment 1 headless test suite.
 * Gate command: node test_revolutions.js
 */
'use strict';

var assert = require('assert');
var fs = require('fs');
var Engine = require('./revolutions_engine.js');

var total = 0;
var passed = 0;
var failures = [];
var currentGroup = 'UNGROUPED';
var groupStats = {};

function group(name) {
  currentGroup = name;
  groupStats[name] = { passed: 0, total: 0 };
}

function test(name, fn) {
  total++;
  groupStats[currentGroup].total++;
  try {
    fn();
    passed++;
    groupStats[currentGroup].passed++;
  } catch (err) {
    failures.push({ group: currentGroup, name: name, message: err.message });
  }
}

function round2(v) {
  return Math.floor(v * 100 + 0.5 + 1e-9) / 100;
}

function est(opts) {
  return Engine.calculateEstimate(opts);
}

function makeBooking(overrides) {
  return Object.assign({
    customerName: 'Marcus Vance',
    phone: '(905) 555-0194',
    vehicleYear: 2021,
    vehicleMake: 'Toyota',
    vehicleModel: 'RAV4 XLE',
    origin: 'asian_import',
    vehicleClass: 'suv',
    serviceIds: ['oil_full_synth'],
    appointmentDate: '2026-10-26',
    appointmentTime: '10:00',
    bookingMode: 'drop_off'
  }, overrides || {});
}

/* ------------------------------------------------------------------ */
/* SHOP_INFO                                                           */
/* ------------------------------------------------------------------ */

group('SHOP_INFO');

test('shop name, address, city, province, postal code', function () {
  assert.strictEqual(Engine.SHOP_INFO.name, 'Revolutions Automotive');
  assert.strictEqual(Engine.SHOP_INFO.address, '1-15A Fisherman Dr');
  assert.strictEqual(Engine.SHOP_INFO.city, 'Brampton');
  assert.strictEqual(Engine.SHOP_INFO.province, 'ON');
  assert.strictEqual(Engine.SHOP_INFO.postalCode, 'L7A 1B7');
  assert.strictEqual(Engine.SHOP_INFO.fullAddress, '1-15A Fisherman Dr, Brampton, ON L7A 1B7');
});

test('shop phone display and tel formats', function () {
  assert.strictEqual(Engine.SHOP_INFO.phone, '(905) 846-8351');
  assert.strictEqual(Engine.SHOP_INFO.phoneTel, '+19058468351');
});

test('HST rate, shop supplies rate and cap', function () {
  assert.strictEqual(Engine.SHOP_INFO.hstRate, 0.13);
  assert.strictEqual(Engine.SHOP_INFO.shopSuppliesRate, 0.05);
  assert.strictEqual(Engine.SHOP_INFO.shopSuppliesCap, 35);
});

test('shop hours: weekday, Saturday, Sunday closed', function () {
  assert.strictEqual(Engine.SHOP_INFO.hours.monday.open, '08:00');
  assert.strictEqual(Engine.SHOP_INFO.hours.monday.close, '18:00');
  assert.strictEqual(Engine.SHOP_INFO.hours.monday.closed, false);
  assert.strictEqual(Engine.SHOP_INFO.hours.friday.close, '18:00');
  assert.strictEqual(Engine.SHOP_INFO.hours.saturday.open, '08:30');
  assert.strictEqual(Engine.SHOP_INFO.hours.saturday.close, '15:00');
  assert.strictEqual(Engine.SHOP_INFO.hours.sunday.closed, true);
  assert.strictEqual(Engine.SHOP_INFO.hours.sunday.open, null);
});

test('specialties list has 12 entries including MTO SSC', function () {
  assert.strictEqual(Engine.SHOP_INFO.specialties.length, 12);
  assert.ok(Engine.SHOP_INFO.specialties.indexOf('Ontario Safety Standards Certificates (MTO SSC)') !== -1);
  assert.ok(Engine.SHOP_INFO.specialties.indexOf('4-Wheel Laser Alignments') !== -1);
});

/* ------------------------------------------------------------------ */
/* SERVICE_CATALOG / COUPON_CATALOG                                    */
/* ------------------------------------------------------------------ */

group('SERVICE_CATALOG / COUPON_CATALOG');

test('catalog contains exactly 12 services', function () {
  assert.strictEqual(Engine.SERVICE_CATALOG.length, 12);
});

test('catalog ids match the required 12 in order', function () {
  var ids = Engine.SERVICE_CATALOG.map(function (s) { return s.id; });
  assert.deepStrictEqual(ids, [
    'brk_pads_rotors', 'brk_fluid_caliper',
    'tir_align_4whl', 'tir_mount_balance',
    'diag_computer_scan', 'diag_elec_parasitic',
    'oil_full_synth', 'tune_spark_induction',
    'ac_evac_recharge', 'ac_compressor_cond',
    'sus_strut_control', 'mto_safety_exhaust'
  ]);
});

test('catalog spans exactly the 6 required categories', function () {
  var categories = [];
  Engine.SERVICE_CATALOG.forEach(function (s) {
    if (categories.indexOf(s.category) === -1) categories.push(s.category);
  });
  assert.deepStrictEqual(categories, [
    'Brakes',
    'Tires & Alignment',
    'Computer Diagnostics',
    'Oil & Tune-Up',
    'Air Conditioning',
    'Suspension/Exhaust/Safety Certificate'
  ]);
});

test('every service has a valid schema with low <= high ranges', function () {
  Engine.SERVICE_CATALOG.forEach(function (s) {
    assert.strictEqual(typeof s.id, 'string', 'id must be string: ' + s.id);
    assert.strictEqual(typeof s.name, 'string', 'name must be string: ' + s.id);
    assert.strictEqual(typeof s.category, 'string', 'category must be string: ' + s.id);
    assert.ok(s.basePartsLow >= 0 && s.basePartsHigh >= 0, 'parts must be >= 0: ' + s.id);
    assert.ok(s.baseLaborLow >= 0 && s.baseLaborHigh >= 0, 'labor must be >= 0: ' + s.id);
    assert.ok(s.basePartsLow <= s.basePartsHigh, 'parts low <= high: ' + s.id);
    assert.ok(s.baseLaborLow <= s.baseLaborHigh, 'labor low <= high: ' + s.id);
    assert.ok(s.durationHours > 0, 'duration must be > 0: ' + s.id);
    assert.strictEqual(typeof s.warranty, 'string', 'warranty must be string: ' + s.id);
    assert.strictEqual(typeof s.description, 'string', 'description must be string: ' + s.id);
  });
});

test('coupon catalog has all 5 Midas-style codes with valid schema', function () {
  var codes = Engine.COUPON_CATALOG.map(function (c) { return c.code; });
  assert.deepStrictEqual(codes, ['SYNTH15', 'ALIGN25', 'DIAG50', 'BRAKE50', 'SAFETY10']);
  Engine.COUPON_CATALOG.forEach(function (c) {
    assert.ok(c.amount > 0, 'amount must be > 0: ' + c.code);
    assert.ok(c.eligibleServiceIds.length >= 1, 'eligible services required: ' + c.code);
    assert.ok(c.discountType === 'fixed' || c.discountType === 'percentage_service_labor',
      'discount type must be recognized: ' + c.code);
    assert.strictEqual(typeof c.title, 'string', 'title required: ' + c.code);
    assert.strictEqual(typeof c.minSpend, 'number', 'minSpend required: ' + c.code);
  });
});

test('BRAKE50 carries a $250 minimum spend and DIAG50 requires a repair', function () {
  var brake = Engine.COUPON_CATALOG.filter(function (c) { return c.code === 'BRAKE50'; })[0];
  var diag = Engine.COUPON_CATALOG.filter(function (c) { return c.code === 'DIAG50'; })[0];
  assert.strictEqual(brake.minSpend, 250);
  assert.strictEqual(diag.requiresAdditionalRepair, true);
});

/* ------------------------------------------------------------------ */
/* calculateEstimate - base math                                       */
/* ------------------------------------------------------------------ */

group('calculateEstimate - base math');

test('no services returns a zeroed estimate', function () {
  var r = est({ serviceIds: [], couponCode: 'SYNTH15' });
  assert.strictEqual(r.serviceCount, 0);
  assert.strictEqual(r.partsLow, 0);
  assert.strictEqual(r.laborLow, 0);
  assert.strictEqual(r.subtotalLow, 0);
  assert.strictEqual(r.hstLow, 0);
  assert.strictEqual(r.totalLow, 0);
  assert.strictEqual(r.couponApplied, false);
  assert.strictEqual(r.couponMessage, 'No services selected.');
  assert.deepStrictEqual(r.lineItems, []);
});

test('unknown service ids are ignored', function () {
  var r = est({ serviceIds: ['brk_pads_rotors', 'zzz_fake_service'] });
  assert.strictEqual(r.serviceCount, 1);
  assert.strictEqual(r.partsLow, 210);
});

test('single brake job domestic sedan: parts, labor, duration', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'], origin: 'domestic', vehicleClass: 'sedan' });
  assert.strictEqual(r.serviceCount, 1);
  assert.strictEqual(r.partsLow, 210);
  assert.strictEqual(r.partsHigh, 290);
  assert.strictEqual(r.laborLow, 150);
  assert.strictEqual(r.laborHigh, 210);
  assert.strictEqual(r.comboDiscountRate, 0);
  assert.strictEqual(r.estimatedDurationHours, 2);
});

test('single brake job: shop supplies at 5% of labor (no cap hit)', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'] });
  assert.strictEqual(r.shopSuppliesLow, 7.5);
  assert.strictEqual(r.shopSuppliesHigh, 10.5);
});

test('single brake job: subtotal, 13% HST and total (low range)', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'] });
  assert.strictEqual(r.subtotalLow, 367.5);
  assert.strictEqual(r.hstLow, 47.78);
  assert.strictEqual(r.totalLow, 415.28);
});

test('single brake job: high range values', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'] });
  assert.strictEqual(r.subtotalHigh, 510.5);
  assert.strictEqual(r.hstHigh, 66.37);
  assert.strictEqual(r.totalHigh, 576.87);
});

test('two services trigger the 10% shared-hoist labor discount', function () {
  var r = est({ serviceIds: ['brk_pads_rotors', 'oil_full_synth'] });
  assert.strictEqual(r.serviceCount, 2);
  assert.strictEqual(r.comboDiscountRate, 0.1);
  assert.strictEqual(r.laborLow, 188);
  assert.strictEqual(r.comboDiscountLow, 18.8);
  assert.strictEqual(r.netLaborLow, 169.2);
});

test('two services: supplies on post-discount labor, subtotal, HST, total', function () {
  var r = est({ serviceIds: ['brk_pads_rotors', 'oil_full_synth'] });
  assert.strictEqual(r.shopSuppliesLow, 8.46);
  assert.strictEqual(r.subtotalLow, 449.66);
  assert.strictEqual(r.hstLow, 58.46);
  assert.strictEqual(r.totalLow, 508.12);
});

test('three services trigger the 15% shared-hoist labor discount', function () {
  var r = est({ serviceIds: ['brk_pads_rotors', 'oil_full_synth', 'tir_align_4whl'] });
  assert.strictEqual(r.serviceCount, 3);
  assert.strictEqual(r.comboDiscountRate, 0.15);
  assert.strictEqual(r.laborLow, 317.99);
  assert.strictEqual(r.comboDiscountLow, 47.7);
  assert.strictEqual(r.netLaborLow, 270.29);
});

test('three services: supplies, subtotal, HST, total and duration', function () {
  var r = est({ serviceIds: ['brk_pads_rotors', 'oil_full_synth', 'tir_align_4whl'] });
  assert.strictEqual(r.shopSuppliesLow, 13.51);
  assert.strictEqual(r.subtotalLow, 555.8);
  assert.strictEqual(r.hstLow, 72.25);
  assert.strictEqual(r.totalLow, 628.05);
  assert.strictEqual(r.estimatedDurationHours, 3.95);
});

test('four services still use the 15% combo rate (never higher)', function () {
  var r = est({ serviceIds: ['brk_pads_rotors', 'oil_full_synth', 'tir_align_4whl', 'brk_fluid_caliper'] });
  assert.strictEqual(r.comboDiscountRate, 0.15);
});

test('HST is exactly 13% of the rounded subtotal', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'] });
  assert.strictEqual(r.hstLow, round2(r.subtotalLow * 0.13));
  assert.strictEqual(r.hstHigh, round2(r.subtotalHigh * 0.13));
  assert.strictEqual(r.totalLow, round2(r.subtotalLow + r.hstLow));
});

/* ------------------------------------------------------------------ */
/* calculateEstimate - vehicle multipliers                             */
/* ------------------------------------------------------------------ */

group('calculateEstimate - multipliers');

test('asian_import suv multipliers raise parts and labor', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'], origin: 'asian_import', vehicleClass: 'suv' });
  assert.ok(Math.abs(r.combinedPartsMultiplier - 1.2096) < 1e-9);
  assert.ok(Math.abs(r.combinedLaborMultiplier - 1.155) < 1e-9);
  assert.strictEqual(r.partsLow, 254.02);
  assert.strictEqual(r.laborLow, 173.25);
});

test('euro_import truck multipliers are the highest tier', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'], origin: 'euro_import', vehicleClass: 'truck' });
  assert.ok(Math.abs(r.combinedPartsMultiplier - 1.5) < 1e-9);
  assert.ok(Math.abs(r.combinedLaborMultiplier - 1.416) < 1e-9);
  assert.strictEqual(r.partsLow, 315);
  assert.strictEqual(r.laborLow, 212.4);
});

test('defaults are domestic sedan when origin/class omitted', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'] });
  assert.strictEqual(r.origin, 'domestic');
  assert.strictEqual(r.vehicleClass, 'sedan');
  assert.strictEqual(r.laborLow, 150);
  assert.strictEqual(r.partsLow, 210);
});

test('shop supplies fee is capped at $35.00 CAD on large jobs', function () {
  var ids = ['ac_compressor_cond', 'tune_spark_induction', 'sus_strut_control', 'brk_pads_rotors', 'brk_fluid_caliper'];
  var r = est({ serviceIds: ids });
  assert.strictEqual(r.serviceCount, 5);
  assert.strictEqual(r.laborLow, 905);
  assert.strictEqual(r.shopSuppliesLow, 35);
  assert.strictEqual(r.shopSuppliesHigh, 35);
  assert.ok(r.shopSuppliesLow <= 35);
});

/* ------------------------------------------------------------------ */
/* calculateEstimate - coupons                                         */
/* ------------------------------------------------------------------ */

group('calculateEstimate - coupons');

test('SYNTH15 applies $15 off a synthetic oil change', function () {
  var r = est({ serviceIds: ['oil_full_synth'], couponCode: 'SYNTH15' });
  assert.strictEqual(r.couponApplied, true);
  assert.strictEqual(r.couponDiscount, 15);
  assert.strictEqual(r.couponDiscountLow, 15);
  assert.strictEqual(r.couponDiscountHigh, 15);
  assert.strictEqual(r.subtotalLow, 86.9);
  assert.strictEqual(r.hstLow, 11.3);
  assert.strictEqual(r.totalLow, 98.2);
  assert.ok(r.couponMessage.indexOf('SYNTH15') !== -1);
});

test('SYNTH15 is ineligible without an oil change', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'], couponCode: 'SYNTH15' });
  assert.strictEqual(r.couponApplied, false);
  assert.strictEqual(r.couponDiscount, 0);
  assert.strictEqual(r.subtotalLow, 367.5);
  assert.ok(r.couponMessage.indexOf('SYNTH15') !== -1);
});

test('coupon codes are case-insensitive and trimmed', function () {
  var r = est({ serviceIds: ['oil_full_synth'], couponCode: ' synth15 ' });
  assert.strictEqual(r.couponApplied, true);
  assert.strictEqual(r.couponDiscount, 15);
});

test('BRAKE50 applies $50 off a brake job meeting the $250 minimum', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'], couponCode: 'BRAKE50' });
  assert.strictEqual(r.couponApplied, true);
  assert.strictEqual(r.couponDiscount, 50);
  assert.strictEqual(r.subtotalLow, 317.5);
  assert.strictEqual(r.hstLow, 41.28);
  assert.strictEqual(r.totalLow, 358.78);
});

test('ALIGN25 is rejected when alignment is standalone', function () {
  var r = est({ serviceIds: ['tir_align_4whl'], couponCode: 'ALIGN25' });
  assert.strictEqual(r.couponApplied, false);
  assert.strictEqual(r.couponDiscount, 0);
  assert.strictEqual(r.subtotalLow, 136.49);
  assert.ok(r.couponMessage.indexOf('ALIGN25') !== -1);
});

test('ALIGN25 applies when alignment is paired with tire service', function () {
  var r = est({ serviceIds: ['tir_align_4whl', 'tir_mount_balance'], couponCode: 'ALIGN25' });
  assert.strictEqual(r.couponApplied, true);
  assert.strictEqual(r.couponDiscount, 25);
});

test('DIAG50 is rejected for a diagnostic with no repair', function () {
  var r = est({ serviceIds: ['diag_computer_scan'], couponCode: 'DIAG50' });
  assert.strictEqual(r.couponApplied, false);
  assert.strictEqual(r.couponDiscount, 0);
});

test('DIAG50 halves diagnostic labor per range when paired with a repair', function () {
  var r = est({ serviceIds: ['diag_computer_scan', 'oil_full_synth'], couponCode: 'DIAG50' });
  assert.strictEqual(r.couponApplied, true);
  assert.strictEqual(r.couponDiscountLow, 65);
  assert.strictEqual(r.couponDiscountHigh, 80);
  assert.strictEqual(r.couponDiscount, 65);
  assert.strictEqual(r.subtotalLow, 155.76);
});

test('SAFETY10 applies $10 off the MTO Safety Certificate', function () {
  var r = est({ serviceIds: ['mto_safety_exhaust'], couponCode: 'SAFETY10' });
  assert.strictEqual(r.couponApplied, true);
  assert.strictEqual(r.couponDiscount, 10);
  assert.strictEqual(r.subtotalLow, 147.49);
});

test('unknown coupon codes are ignored with a clear message', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'], couponCode: 'FREE99' });
  assert.strictEqual(r.couponApplied, false);
  assert.strictEqual(r.couponDiscount, 0);
  assert.strictEqual(r.subtotalLow, 367.5);
  assert.ok(r.couponMessage.indexOf('not recognized') !== -1);
});

test('no coupon code reports "No coupon selected."', function () {
  var r = est({ serviceIds: ['brk_pads_rotors'] });
  assert.strictEqual(r.couponApplied, false);
  assert.strictEqual(r.couponMessage, 'No coupon selected.');
});

/* ------------------------------------------------------------------ */
/* validateBooking                                                     */
/* ------------------------------------------------------------------ */

group('validateBooking');

test('valid weekday booking passes with confirmation code', function () {
  var r = Engine.validateBooking(makeBooking());
  assert.strictEqual(r.valid, true);
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.advisory, null);
  assert.ok(r.confirmationCode);
  assert.ok(r.normalizedBooking);
});

test('confirmation code format and normalized fields', function () {
  var r = Engine.validateBooking(makeBooking({ customerName: '  Marcus Vance  ' }));
  assert.ok(/^REV-\d{8}-\d{4}-[A-Z]{2}\d{3}$/.test(r.confirmationCode));
  assert.strictEqual(r.normalizedBooking.customerName, 'Marcus Vance');
  assert.strictEqual(r.normalizedBooking.vehicleYear, 2021);
  assert.deepStrictEqual(r.normalizedBooking.serviceIds, ['oil_full_synth']);
});

test('weekday 5:30 PM (last check-in) is valid', function () {
  var r = Engine.validateBooking(makeBooking({ appointmentTime: '17:30' }));
  assert.strictEqual(r.valid, true);
});

test('weekday 5:45 PM is rejected as after-hours', function () {
  var r = Engine.validateBooking(makeBooking({ appointmentTime: '17:45' }));
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some(function (e) { return e.indexOf('Weekday') !== -1; }));
});

test('weekday 7:30 AM is rejected as before opening', function () {
  var r = Engine.validateBooking(makeBooking({ appointmentTime: '07:30' }));
  assert.strictEqual(r.valid, false);
});

test('weekday 6:00 PM is rejected (shop closes at 6:00 PM)', function () {
  var r = Engine.validateBooking(makeBooking({ appointmentTime: '18:00' }));
  assert.strictEqual(r.valid, false);
});

test('Saturday 8:30 AM opening slot is valid', function () {
  var r = Engine.validateBooking(makeBooking({ appointmentDate: '2026-10-31', appointmentTime: '08:30' }));
  assert.strictEqual(r.valid, true);
});

test('Saturday 8:00 AM is rejected (opens 8:30 AM)', function () {
  var r = Engine.validateBooking(makeBooking({ appointmentDate: '2026-10-31', appointmentTime: '08:00' }));
  assert.strictEqual(r.valid, false);
});

test('Saturday 2:30 PM (last check-in) is valid', function () {
  var r = Engine.validateBooking(makeBooking({ appointmentDate: '2026-10-31', appointmentTime: '14:30' }));
  assert.strictEqual(r.valid, true);
});

test('Saturday 3:00 PM is rejected (shop closes at 3:00 PM)', function () {
  var r = Engine.validateBooking(makeBooking({ appointmentDate: '2026-10-31', appointmentTime: '15:00' }));
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some(function (e) { return e.indexOf('Saturday') !== -1; }));
});

test('Sunday dates are rejected with a closed message', function () {
  var r = Engine.validateBooking(makeBooking({ appointmentDate: '2026-11-01', appointmentTime: '10:00' }));
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some(function (e) { return e.indexOf('Sunday') !== -1; }));
});

test('phone with fewer than 10 digits is rejected', function () {
  var r = Engine.validateBooking(makeBooking({ phone: '905 846' }));
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some(function (e) { return e.indexOf('phone') !== -1; }));
});

test('North American phone format variants are accepted', function () {
  ['9058468351', '(905) 846-8351', '+1 905 846 8351', '905-846-8351'].forEach(function (phone) {
    var r = Engine.validateBooking(makeBooking({ phone: phone }));
    assert.strictEqual(r.valid, true, 'phone should be valid: ' + phone);
  });
});

test('vehicle years outside 1980-2027 are rejected', function () {
  assert.strictEqual(Engine.validateBooking(makeBooking({ vehicleYear: 1975 })).valid, false);
  assert.strictEqual(Engine.validateBooking(makeBooking({ vehicleYear: 2028 })).valid, false);
});

test('vehicle years 1980 and 2027 are accepted, including string input', function () {
  assert.strictEqual(Engine.validateBooking(makeBooking({ vehicleYear: 1980 })).valid, true);
  assert.strictEqual(Engine.validateBooking(makeBooking({ vehicleYear: 2027 })).valid, true);
  assert.strictEqual(Engine.validateBooking(makeBooking({ vehicleYear: '2021' })).valid, true);
});

test('empty service selection is rejected', function () {
  var r = Engine.validateBooking(makeBooking({ serviceIds: [] }));
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some(function (e) { return e.indexOf('service') !== -1; }));
});

test('only unknown service ids are rejected', function () {
  var r = Engine.validateBooking(makeBooking({ serviceIds: ['fake_service'] }));
  assert.strictEqual(r.valid, false);
});

test('a known service mixed with an unknown id is rejected', function () {
  var r = Engine.validateBooking(makeBooking({ serviceIds: ['brk_pads_rotors', 'fake_service'] }));
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some(function (e) { return e.indexOf('unknown service') !== -1; }));
});

test('invalid booking mode is rejected', function () {
  var r = Engine.validateBooking(makeBooking({ bookingMode: 'teleport' }));
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some(function (e) { return e.indexOf('Booking mode') !== -1; }));
});

test('wait_in_lounge with a long job stays valid but gets a drop-off advisory', function () {
  var r = Engine.validateBooking(makeBooking({
    bookingMode: 'wait_in_lounge',
    serviceIds: ['brk_pads_rotors', 'tune_spark_induction', 'oil_full_synth']
  }));
  assert.strictEqual(r.valid, true);
  assert.ok(r.advisory);
  assert.ok(r.advisory.indexOf('drop-off') !== -1);
});

test('single-character customer name is rejected', function () {
  var r = Engine.validateBooking(makeBooking({ customerName: ' M ' }));
  assert.strictEqual(r.valid, false);
});

test('missing vehicle make is rejected', function () {
  var r = Engine.validateBooking(makeBooking({ vehicleMake: '' }));
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some(function (e) { return e.indexOf('make') !== -1; }));
});

/* ------------------------------------------------------------------ */
/* recommendServicesBySymptoms                                         */
/* ------------------------------------------------------------------ */

group('recommendServicesBySymptoms');

test('squealing brakes map to brake services with HIGH urgency', function () {
  var r = Engine.recommendServicesBySymptoms(['squealing_brakes']);
  assert.deepStrictEqual(r.matchedSymptoms, ['squealing_brakes']);
  assert.deepStrictEqual(r.recommendedServiceIds, ['brk_pads_rotors', 'brk_fluid_caliper']);
  assert.deepStrictEqual(r.primaryServiceIds, ['brk_pads_rotors']);
  assert.strictEqual(r.urgency, 'HIGH');
});

test('overdue oil maps to oil change and tune-up', function () {
  var r = Engine.recommendServicesBySymptoms(['overdue_oil']);
  assert.ok(r.recommendedServiceIds.indexOf('oil_full_synth') !== -1);
  assert.strictEqual(r.urgency, 'MEDIUM');
});

test('multiple symptoms deduplicate recommended services in order', function () {
  var r = Engine.recommendServicesBySymptoms(['squealing_brakes', 'clunking_bumps']);
  assert.deepStrictEqual(r.recommendedServiceIds, [
    'brk_pads_rotors', 'brk_fluid_caliper', 'sus_strut_control', 'tir_align_4whl'
  ]);
  assert.strictEqual(r.recommendedServiceIds.length, 4);
});

test('mixed symptoms report the highest urgency', function () {
  var r = Engine.recommendServicesBySymptoms(['overdue_oil', 'squealing_brakes']);
  assert.strictEqual(r.urgency, 'HIGH');
});

test('unknown symptoms are ignored', function () {
  var r = Engine.recommendServicesBySymptoms(['squealing_brakes', 'warp_drive']);
  assert.deepStrictEqual(r.matchedSymptoms, ['squealing_brakes']);
});

test('empty symptom list returns empty results', function () {
  var r = Engine.recommendServicesBySymptoms([]);
  assert.deepStrictEqual(r.matchedSymptoms, []);
  assert.deepStrictEqual(r.recommendedServiceIds, []);
  assert.deepStrictEqual(r.primaryServiceIds, []);
  assert.strictEqual(r.urgency, null);
  assert.strictEqual(typeof r.diagnosticSummary, 'string');
});

test('technician notes and diagnostic summary are populated', function () {
  var r = Engine.recommendServicesBySymptoms(['check_engine_light']);
  assert.strictEqual(r.technicianNotes.length, 1);
  assert.strictEqual(typeof r.technicianNotes[0], 'string');
  assert.ok(r.technicianNotes[0].length > 20);
  assert.ok(r.diagnosticSummary.length > 20);
});

test('buying a used car maps to MTO SSC as primary', function () {
  var r = Engine.recommendServicesBySymptoms(['buying_used_car']);
  assert.ok(r.recommendedServiceIds.indexOf('mto_safety_exhaust') !== -1);
  assert.deepStrictEqual(r.primaryServiceIds, ['mto_safety_exhaust']);
});

/* ------------------------------------------------------------------ */
/* Segment 2 Asset & DOM Integrity Tests                                */
/* ------------------------------------------------------------------ */

group('Segment 2 Assets & DOM');

var MANDATORY_ASSETS = ['assets/hero_bay.jpg', 'assets/diagnostics_tech.jpg', 'assets/safety_badge.jpg'];

MANDATORY_ASSETS.forEach(function (assetPath) {
  test('asset exists on disk and exceeds 10,000 bytes: ' + assetPath, function () {
    assert.ok(fs.existsSync(assetPath), 'missing asset: ' + assetPath);
    var stats = fs.statSync(assetPath);
    assert.ok(stats.size > 10000, assetPath + ' is only ' + stats.size + ' bytes');
  });

  test('asset starts with JPEG magic bytes FF D8 FF: ' + assetPath, function () {
    var fd = fs.openSync(assetPath, 'r');
    var buf = Buffer.alloc(3);
    var bytesRead = fs.readSync(fd, buf, 0, 3, 0);
    fs.closeSync(fd);
    assert.strictEqual(bytesRead, 3, assetPath + ' is too small to read a header');
    assert.strictEqual(buf[0], 0xFF, assetPath + ' byte 0 is not 0xFF');
    assert.strictEqual(buf[1], 0xD8, assetPath + ' byte 1 is not 0xD8');
    assert.strictEqual(buf[2], 0xFF, assetPath + ' byte 2 is not 0xFF');
  });
});

var INDEX_HTML = fs.readFileSync('index.html', 'utf8');
var STYLES_CSS = fs.readFileSync('styles.css', 'utf8');

test('index.html exists and is a substantial document (> 500 chars)', function () {
  assert.ok(INDEX_HTML.length > 500, 'index.html is only ' + INDEX_HTML.length + ' chars');
  assert.ok(INDEX_HTML.indexOf('<!DOCTYPE html>') !== -1, 'index.html must declare doctype');
});

test('styles.css exists and is a substantial stylesheet (> 500 chars)', function () {
  assert.ok(STYLES_CSS.length > 500, 'styles.css is only ' + STYLES_CSS.length + ' chars');
});

var MANDATORY_DOM_IDS = [
  'shop-phone-header',
  'shop-address-header',
  'shop-hours-badge',
  'btn-load-sample',
  'vehicle-origin-select',
  'vehicle-class-select',
  'vehicle-year-input',
  'vehicle-make-input',
  'vehicle-model-input',
  'symptom-chips',
  'symptom-recommendations',
  'category-filter-bar',
  'service-grid',
  'coupon-wallet-grid',
  'coupon-select',
  'estimate-summary-card',
  'est-selected-count',
  'est-line-items',
  'est-parts',
  'est-labor',
  'est-combo-discount',
  'est-shop-supplies',
  'est-discount',
  'est-coupon-status',
  'est-subtotal',
  'est-hst',
  'est-total-range',
  'booking-form',
  'cust-name',
  'cust-phone',
  'booking-date',
  'booking-time',
  'booking-mode',
  'booking-submit-btn',
  'booking-feedback'
];

test('every mandatory DOM ID exists verbatim in index.html', function () {
  MANDATORY_DOM_IDS.forEach(function (id) {
    assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1,
      'index.html is missing mandatory DOM ID: #' + id);
  });
});

test('index.html links styles.css and the engine script before closing body', function () {
  assert.ok(INDEX_HTML.indexOf('styles.css') !== -1, 'index.html must reference styles.css');
  assert.ok(INDEX_HTML.indexOf('<script src="revolutions_engine.js"></script>') !== -1,
    'index.html must link revolutions_engine.js');
  assert.ok(INDEX_HTML.indexOf('<script src="revolutions_engine.js"></script>') <
    INDEX_HTML.indexOf('</body>'), 'engine script must load before closing body tag');
});

test('index.html features all 3 generated assets', function () {
  assert.ok(INDEX_HTML.indexOf('assets/hero_bay.jpg') !== -1, 'hero_bay.jpg must be referenced');
  assert.ok(INDEX_HTML.indexOf('assets/diagnostics_tech.jpg') !== -1, 'diagnostics_tech.jpg must be referenced');
  assert.ok(INDEX_HTML.indexOf('assets/safety_badge.jpg') !== -1, 'safety_badge.jpg must be referenced');
});

test('index.html carries the Revolutions Automotive branding verbatim', function () {
  assert.ok(INDEX_HTML.indexOf('Revolutions Automotive') !== -1);
  assert.ok(INDEX_HTML.indexOf('1-15A Fisherman Dr, Brampton, ON L7A 1B7') !== -1);
  assert.ok(INDEX_HTML.indexOf('(905) 846-8351') !== -1);
});

test('vehicle origin and class selects expose every engine option', function () {
  ['domestic', 'asian_import', 'euro_import'].forEach(function (value) {
    assert.ok(INDEX_HTML.indexOf('value="' + value + '"') !== -1, 'origin option missing: ' + value);
  });
  ['sedan', 'suv', 'truck'].forEach(function (value) {
    assert.ok(INDEX_HTML.indexOf('value="' + value + '"') !== -1, 'class option missing: ' + value);
  });
  ['drop_off', 'wait_in_lounge'].forEach(function (value) {
    assert.ok(INDEX_HTML.indexOf('value="' + value + '"') !== -1, 'booking mode option missing: ' + value);
  });
});

test('coupon select exposes all 5 promo codes', function () {
  ['SYNTH15', 'ALIGN25', 'DIAG50', 'BRAKE50', 'SAFETY10'].forEach(function (code) {
    assert.ok(INDEX_HTML.indexOf('value="' + code + '"') !== -1, 'coupon option missing: ' + code);
  });
});

/* ------------------------------------------------------------------ */
/* Segment 3 Controller & Anti-Drift Tests                              */
/* ------------------------------------------------------------------ */

group('Segment 3 Controller & Anti-Drift');

var APP_JS = fs.readFileSync('app.js', 'utf8');

test('app.js exists and is a substantial controller (> 1000 chars)', function () {
  assert.ok(APP_JS.length > 1000, 'app.js is only ' + APP_JS.length + ' chars');
});

test('anti-drift: every DOM ID referenced in app.js exists verbatim in index.html', function () {
  var ids = [];
  var reGetById = /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  var reQuery = /querySelector(?:All)?\(\s*['"]#([A-Za-z0-9_-]+)['"]\s*\)/g;
  var match;
  while ((match = reGetById.exec(APP_JS)) !== null) ids.push(match[1]);
  while ((match = reQuery.exec(APP_JS)) !== null) ids.push(match[1]);
  assert.ok(ids.length >= 25, 'expected at least 25 DOM references in app.js, found ' + ids.length);
  ids.forEach(function (id) {
    assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1,
      'app.js references missing DOM ID: #' + id);
  });
});

test('engine integration: app.js wires the full RevolutionsEngine API', function () {
  [
    'RevolutionsEngine',
    'calculateEstimate',
    'validateBooking',
    'recommendServicesBySymptoms',
    'SERVICE_CATALOG',
    'COUPON_CATALOG',
    'SYMPTOM_CATALOG',
    'SHOP_INFO'
  ].forEach(function (token) {
    assert.ok(APP_JS.indexOf(token) !== -1, 'app.js must use ' + token);
  });
});

test('app.js persists state under the required localStorage key', function () {
  assert.ok(APP_JS.indexOf('revolutions_automotive_state_v1') !== -1,
    'app.js must use the revolutions_automotive_state_v1 storage key');
  assert.ok(APP_JS.indexOf('localStorage') !== -1, 'app.js must use localStorage');
});

test('index.html loads app.js after the engine script and before closing body', function () {
  var enginePos = INDEX_HTML.indexOf('<script src="revolutions_engine.js"></script>');
  var appPos = INDEX_HTML.indexOf('<script src="app.js"></script>');
  var bodyPos = INDEX_HTML.indexOf('</body>');
  assert.ok(enginePos !== -1, 'engine script tag missing');
  assert.ok(appPos !== -1, 'app.js script tag missing');
  assert.ok(enginePos < appPos, 'app.js must load after revolutions_engine.js');
  assert.ok(appPos < bodyPos, 'app.js must load before closing body');
});

test('sample scenario: engine output for the btn-load-sample inputs', function () {
  var r = Engine.calculateEstimate({
    serviceIds: ['brk_pads_rotors', 'tir_align_4whl', 'oil_full_synth'],
    origin: 'asian_import',
    vehicleClass: 'sedan',
    couponCode: 'BRAKE50'
  });
  assert.strictEqual(r.serviceCount, 3);
  assert.strictEqual(r.comboDiscountRate, 0.15);
  assert.strictEqual(r.comboDiscountLow, 50.08);
  assert.strictEqual(r.couponApplied, true);
  assert.strictEqual(r.couponDiscount, 50);
  assert.strictEqual(r.subtotalLow, 541.76);
  assert.strictEqual(r.hstLow, 70.43);
  assert.strictEqual(r.totalLow, 612.19);
});

test('sample booking payload validates with a wait-in-lounge advisory', function () {
  var r = Engine.validateBooking({
    customerName: 'Don Miller',
    phone: '(905) 555-0149',
    vehicleYear: '2021',
    vehicleMake: 'Honda',
    vehicleModel: 'Civic',
    origin: 'asian_import',
    vehicleClass: 'sedan',
    serviceIds: ['brk_pads_rotors', 'tir_align_4whl', 'oil_full_synth'],
    appointmentDate: '2026-10-27',
    appointmentTime: '10:00',
    bookingMode: 'wait_in_lounge'
  });
  assert.strictEqual(r.valid, true);
  assert.deepStrictEqual(r.errors, []);
  assert.ok(r.advisory, 'long job in lounge mode must produce an advisory');
  assert.ok(r.advisory.indexOf('drop-off') !== -1);
  assert.ok(/^REV-\d{8}-\d{4}-[A-Z]{2}\d{3}$/.test(r.confirmationCode));
});

test('app.js embeds the exact sample scenario data', function () {
  [
    'Don Miller',
    '(905) 555-0149',
    'BRAKE50',
    'brk_pads_rotors',
    'tir_align_4whl',
    'oil_full_synth',
    'Honda',
    'Civic',
    'asian_import',
    'sedan',
    'wait_in_lounge',
    '10:00'
  ].forEach(function (token) {
    assert.ok(APP_JS.indexOf(token) !== -1, 'app.js sample scenario must include ' + token);
  });
});

test('app.js renders every catalog surface the UI depends on', function () {
  [
    'symptom-chips',
    'symptom-recommendations',
    'category-filter-bar',
    'service-grid',
    'coupon-wallet-grid',
    'coupon-select',
    'estimate-summary-card'.replace('estimate-summary-card', 'est-total-range'),
    'booking-form',
    'booking-feedback',
    'btn-load-sample'
  ].forEach(function (id) {
    assert.ok(APP_JS.indexOf(id) !== -1, 'app.js must render or wire #' + id);
  });
  assert.ok(APP_JS.indexOf('Add Recommended Services to Estimate') !== -1,
    'symptom recommendations must offer an add button');
});

/* ------------------------------------------------------------------ */
/* report                                                              */
/* ------------------------------------------------------------------ */

console.log('Revolutions Automotive - Segment 1 Engine Test Suite');
console.log('--------------------------------------------------');
Object.keys(groupStats).forEach(function (g) {
  console.log(g + ': ' + groupStats[g].passed + '/' + groupStats[g].total + ' passed');
});
console.log('--------------------------------------------------');

if (failures.length > 0) {
  console.log('FAILURES (' + failures.length + '):');
  failures.forEach(function (f) {
    console.log(' - [' + f.group + '] ' + f.name + ': ' + f.message);
  });
  console.log('TOTAL: ' + passed + '/' + total + ' PASSED - TEST GATE RED');
  process.exitCode = 1;
} else {
  console.log('TOTAL: ' + passed + '/' + total + ' PASSED');
  console.log('TEST GATE GREEN');
}
