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
/* Phase 2 - Segment 1 Engine Tests                                     */
/* ------------------------------------------------------------------ */

group('Phase 2 - Segment 1 Engine Tests');

test('DIAGNOSTIC_DECISION_TREE exposes a rooted, deep-frozen node graph', function () {
  var tree = Engine.DIAGNOSTIC_DECISION_TREE;
  assert.strictEqual(tree.rootNodeId, 'step_anomaly');
  assert.ok(tree.nodes.step_anomaly, 'root node must exist');
  assert.ok(Object.isFrozen(tree), 'tree must be frozen');
  assert.ok(Object.isFrozen(tree.nodes), 'nodes map must be frozen');
  var terminalIds = Object.keys(tree.nodes).filter(function (id) {
    return tree.nodes[id].type === 'terminal';
  });
  assert.ok(terminalIds.length >= 20, 'expected at least 20 terminal nodes, found ' + terminalIds.length);
  terminalIds.forEach(function (id) {
    assert.ok(Object.isFrozen(tree.nodes[id]), 'terminal node must be frozen: ' + id);
  });
});

test('wizard root branches into the 5 anomaly types with zero dangling pointers', function () {
  var tree = Engine.DIAGNOSTIC_DECISION_TREE;
  var root = tree.nodes[tree.rootNodeId];
  assert.strictEqual(root.type, 'question');
  assert.strictEqual(root.answerKey, 'anomaly');
  assert.deepStrictEqual(root.options.map(function (o) { return o.value; }),
    ['sound', 'vibration', 'warning_light', 'smell', 'fluid_leak']);
  Object.keys(tree.nodes).forEach(function (id) {
    var node = tree.nodes[id];
    if (node.type === 'question') {
      assert.ok(Array.isArray(node.options) && node.options.length >= 2, 'question node needs options: ' + id);
      node.options.forEach(function (opt) {
        assert.ok(tree.nodes[opt.nextNodeId], 'dangling nextNodeId "' + opt.nextNodeId + '" on node ' + id);
      });
    }
  });
});

test('every wizard terminal prescribes a verbatim SERVICE_CATALOG service id', function () {
  var tree = Engine.DIAGNOSTIC_DECISION_TREE;
  var catalogIds = Engine.SERVICE_CATALOG.map(function (s) { return s.id; });
  var terminalCount = 0;
  Object.keys(tree.nodes).forEach(function (id) {
    var node = tree.nodes[id];
    if (node.type !== 'terminal') return;
    terminalCount++;
    assert.ok(catalogIds.indexOf(node.serviceId) !== -1,
      'terminal ' + id + ' points at unknown service: ' + node.serviceId);
  });
  assert.ok(terminalCount >= 20);
});

test('every wizard terminal carries a valid triage level, causes and technician notes', function () {
  var levels = { tow_now: 0, schedule_urgent: 0, routine_inspect: 0 };
  Object.keys(Engine.DIAGNOSTIC_DECISION_TREE.nodes).forEach(function (id) {
    var node = Engine.DIAGNOSTIC_DECISION_TREE.nodes[id];
    if (node.type !== 'terminal') return;
    assert.ok(['tow_now', 'schedule_urgent', 'routine_inspect'].indexOf(node.triageLevel) !== -1,
      'bad triage level on ' + id + ': ' + node.triageLevel);
    levels[node.triageLevel]++;
    assert.ok(Array.isArray(node.rootCauses) && node.rootCauses.length >= 1, 'rootCauses required on ' + id);
    node.rootCauses.forEach(function (cause) {
      assert.strictEqual(typeof cause, 'string', 'cause must be a string on ' + id);
    });
    assert.strictEqual(typeof node.technicianNotes, 'string');
    assert.ok(node.technicianNotes.length > 20, 'technicianNotes too short on ' + id);
  });
  assert.ok(levels.tow_now >= 1 && levels.schedule_urgent >= 1 && levels.routine_inspect >= 1,
    'all three triage levels must be reachable');
});

test('MTO_SSC_CHECKLIST_ITEMS covers exactly the 11 Ontario inspection areas', function () {
  assert.strictEqual(Engine.MTO_SSC_CHECKLIST_ITEMS.length, 11);
  assert.deepStrictEqual(Engine.MTO_SSC_CHECKLIST_ITEMS.map(function (i) { return i.id; }), [
    'mto_brakes', 'mto_steering', 'mto_suspension', 'mto_tires_wheels', 'mto_body_frame',
    'mto_lighting', 'mto_glass_mirrors', 'mto_wipers', 'mto_exhaust_emissions',
    'mto_seatbelts_airbags', 'mto_fuel_system'
  ]);
});

test('MTO weights sum to exactly 100 with tiered severities and valid service ids', function () {
  var sum = 0;
  var severities = { critical: 0, major: 0, minor: 0 };
  var catalogIds = Engine.SERVICE_CATALOG.map(function (s) { return s.id; });
  Engine.MTO_SSC_CHECKLIST_ITEMS.forEach(function (item) {
    assert.ok(item.weight > 0, 'weight must be positive: ' + item.id);
    assert.ok(['critical', 'major', 'minor'].indexOf(item.severity) !== -1, 'bad severity: ' + item.id);
    assert.strictEqual(typeof item.question, 'string', 'question required: ' + item.id);
    assert.ok(item.question.length > 20, 'question too short: ' + item.id);
    assert.strictEqual(typeof item.areaLabel, 'string', 'areaLabel required: ' + item.id);
    assert.ok(catalogIds.indexOf(item.recommendedServiceId) !== -1,
      'MTO item ' + item.id + ' recommends unknown service: ' + item.recommendedServiceId);
    severities[item.severity]++;
    sum += item.weight;
  });
  assert.strictEqual(sum, 100, 'MTO item weights must sum to exactly 100');
  assert.ok(severities.critical >= 3 && severities.major >= 2 && severities.minor >= 2,
    'expected a full spread of severity tiers');
  assert.ok(Object.isFrozen(Engine.MTO_SSC_CHECKLIST_ITEMS), 'checklist must be frozen');
  assert.ok(Object.isFrozen(Engine.MTO_SSC_CHECKLIST_ITEMS[0]), 'checklist items must be frozen');
});

test('WORK_ORDER_STATES defines the 6 lifecycle states in exact order', function () {
  assert.deepStrictEqual(Engine.WORK_ORDER_STATES, [
    'CHECKED_IN',
    'INSPECTION_DIAGNOSTIC',
    'PARTS_ORDERED',
    'IN_BAY_REPAIRING',
    'QUALITY_ALIGNMENT_TEST',
    'READY_FOR_PICKUP'
  ]);
  assert.ok(Object.isFrozen(Engine.WORK_ORDER_STATES));
});

test('SEED_WORK_ORDERS ships the 3 required sample orders in distinct stages', function () {
  var seeds = Engine.SEED_WORK_ORDERS;
  assert.strictEqual(seeds.length, 3);
  assert.ok(Object.isFrozen(seeds), 'seed work orders must be frozen');
  var byCode = {};
  seeds.forEach(function (wo) { byCode[wo.code] = wo; });
  assert.ok(byCode['REV-2048'], 'REV-2048 seed required');
  assert.ok(byCode['REV-3105'], 'REV-3105 seed required');
  assert.ok(byCode['REV-4092'], 'REV-4092 seed required');
  assert.strictEqual(byCode['REV-2048'].currentState, 'IN_BAY_REPAIRING');
  assert.strictEqual(byCode['REV-3105'].currentState, 'PARTS_ORDERED');
  assert.strictEqual(byCode['REV-4092'].currentState, 'READY_FOR_PICKUP');
});

test('SEED_WORK_ORDERS entries satisfy the full work order schema', function () {
  var catalogIds = Engine.SERVICE_CATALOG.map(function (s) { return s.id; });
  Engine.SEED_WORK_ORDERS.forEach(function (wo) {
    assert.ok(/^REV-\d{4}$/.test(wo.code), 'bad code format: ' + wo.code);
    assert.ok(wo.customerName.length > 1, 'customerName required: ' + wo.code);
    assert.strictEqual(wo.phone.replace(/\D/g, '').length, 10, 'phone needs 10 digits: ' + wo.code);
    assert.ok(wo.licensePlate.length > 3, 'licensePlate required: ' + wo.code);
    assert.ok(wo.vehicle.length > 5, 'vehicle description required: ' + wo.code);
    assert.ok(wo.serviceIds.length >= 1, 'at least one service required: ' + wo.code);
    wo.serviceIds.forEach(function (id) {
      assert.ok(catalogIds.indexOf(id) !== -1, 'unknown service on ' + wo.code + ': ' + id);
    });
    assert.ok(Engine.WORK_ORDER_STATES.indexOf(wo.currentState) !== -1,
      'currentState must be a lifecycle state: ' + wo.code);
    assert.ok(wo.bayNumber.length > 2, 'bayNumber required: ' + wo.code);
    assert.ok(wo.technicianName.length > 2, 'technicianName required: ' + wo.code);
    assert.ok(wo.technicianNotes.length > 20, 'technicianNotes required: ' + wo.code);
    assert.ok(typeof wo.estimatedTotal === 'number' && wo.estimatedTotal > 0,
      'estimatedTotal must be positive CAD: ' + wo.code);
    assert.ok(!Number.isNaN(Date.parse(wo.createdAt)), 'createdAt must parse: ' + wo.code);
    assert.ok(!Number.isNaN(Date.parse(wo.updatedAt)), 'updatedAt must parse: ' + wo.code);
  });
});

test('evaluateDiagnosticWizard: knocking engine sound triages tow_now with full contract', function () {
  var r = Engine.evaluateDiagnosticWizard({
    anomaly: 'sound', location: 'engine_bay', condition: 'knocking_or_ticking'
  });
  assert.strictEqual(r.triageLevel, 'tow_now');
  assert.strictEqual(r.serviceId, 'diag_computer_scan');
  assert.ok(Array.isArray(r.rootCauses) && r.rootCauses.length >= 1);
  assert.strictEqual(typeof r.technicianNotes, 'string');
  assert.ok(r.technicianNotes.length > 20);
  assert.strictEqual(typeof r.recommendedUrgency, 'string');
  assert.ok(r.recommendedUrgency.length > 10);
});

test('evaluateDiagnosticWizard: grinding brakes triage schedule_urgent with brake service', function () {
  var r = Engine.evaluateDiagnosticWizard({
    anomaly: 'sound', location: 'wheels_or_brakes', condition: 'grind_when_braking'
  });
  assert.strictEqual(r.triageLevel, 'schedule_urgent');
  assert.strictEqual(r.serviceId, 'brk_pads_rotors');
  assert.ok(r.recommendedUrgency.indexOf('24-48') !== -1);
});

test('evaluateDiagnosticWizard: brake squeal stays routine_inspect', function () {
  var r = Engine.evaluateDiagnosticWizard({
    anomaly: 'sound', location: 'wheels_or_brakes', condition: 'squeal_when_braking'
  });
  assert.strictEqual(r.triageLevel, 'routine_inspect');
  assert.strictEqual(r.serviceId, 'brk_pads_rotors');
});

test('evaluateDiagnosticWizard: flashing CEL is tow_now, solid CEL stays routine', function () {
  var flashing = Engine.evaluateDiagnosticWizard({
    anomaly: 'warning_light', location: 'check_engine', condition: 'flashing'
  });
  assert.strictEqual(flashing.triageLevel, 'tow_now');
  assert.strictEqual(flashing.serviceId, 'diag_computer_scan');
  var solid = Engine.evaluateDiagnosticWizard({
    anomaly: 'warning_light', location: 'check_engine', condition: 'solid'
  });
  assert.strictEqual(solid.triageLevel, 'routine_inspect');
  assert.strictEqual(solid.serviceId, 'diag_computer_scan');
});

test('evaluateDiagnosticWizard: brake fluid leak is tow_now; condensation is a routine A/C check', function () {
  var leak = Engine.evaluateDiagnosticWizard({
    anomaly: 'fluid_leak', location: 'under_front_wheel_area', condition: 'low_brake_fluid_warning'
  });
  assert.strictEqual(leak.triageLevel, 'tow_now');
  assert.strictEqual(leak.serviceId, 'brk_pads_rotors');
  var drip = Engine.evaluateDiagnosticWizard({
    anomaly: 'fluid_leak', location: 'under_vehicle_middle', condition: 'clear_water'
  });
  assert.strictEqual(drip.triageLevel, 'routine_inspect');
  assert.strictEqual(drip.serviceId, 'ac_evac_recharge');
});

test('evaluateDiagnosticWizard falls back safely on empty, null and malformed answers', function () {
  [null, undefined, {}, { anomaly: 'sound' }, { anomaly: 'nonsense' }, 'garbage-input'].forEach(function (bad) {
    var r = Engine.evaluateDiagnosticWizard(bad);
    assert.strictEqual(r.triageLevel, 'routine_inspect', 'fallback must be routine_inspect');
    assert.strictEqual(r.serviceId, 'diag_computer_scan', 'fallback must prescribe a diagnostic scan');
    assert.ok(Array.isArray(r.rootCauses) && r.rootCauses.length >= 1);
    assert.strictEqual(typeof r.technicianNotes, 'string');
    assert.strictEqual(typeof r.recommendedUrgency, 'string');
  });
});

test('evaluateDiagnosticWizard supports direct terminalNodeId and emergency overrides', function () {
  var direct = Engine.evaluateDiagnosticWizard({ terminalNodeId: 'term_flashing_cel' });
  assert.strictEqual(direct.triageLevel, 'tow_now');
  assert.strictEqual(direct.serviceId, 'diag_computer_scan');
  assert.strictEqual(Engine.evaluateDiagnosticWizard({ brakeFailure: true }).triageLevel, 'tow_now');
  assert.strictEqual(Engine.evaluateDiagnosticWizard({ overheating: true }).triageLevel, 'tow_now');
  assert.strictEqual(Engine.evaluateDiagnosticWizard({ flashingWarningLight: true }).triageLevel, 'tow_now');
});

function allSafetyPassExcept(overrides) {
  var answers = {};
  Engine.MTO_SSC_CHECKLIST_ITEMS.forEach(function (item) { answers[item.id] = 'pass'; });
  return Object.assign(answers, overrides || {});
}

test('evaluateSafetyPreCheck: all 11 areas pass scores 100 with pass status', function () {
  var r = Engine.evaluateSafetyPreCheck(allSafetyPassExcept());
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.status, 'pass');
  assert.deepStrictEqual(r.criticalFails, []);
  assert.ok(r.recommendedServiceIds.indexOf('mto_safety_exhaust') !== -1,
    'the certification inspection must always be recommended');
  assert.strictEqual(typeof r.notes, 'string');
  assert.ok(r.notes.length > 10);
});

test('evaluateSafetyPreCheck: a single critical failure overrides to fail despite an 85 score', function () {
  var r = Engine.evaluateSafetyPreCheck(allSafetyPassExcept({ mto_brakes: 'fail' }));
  assert.strictEqual(r.score, 85);
  assert.strictEqual(r.status, 'fail');
  assert.strictEqual(r.criticalFails.length, 1);
  assert.strictEqual(r.criticalFails[0].id, 'mto_brakes');
  assert.strictEqual(r.criticalFails[0].severity, 'critical');
  assert.ok(r.recommendedServiceIds.indexOf('brk_pads_rotors') !== -1);
});

test('evaluateSafetyPreCheck: major-only failures inside the 70-84 band are advisory', function () {
  var r = Engine.evaluateSafetyPreCheck(allSafetyPassExcept({ mto_suspension: 'fail', mto_lighting: 'no' }));
  assert.strictEqual(r.score, 82);
  assert.strictEqual(r.status, 'advisory');
  assert.deepStrictEqual(r.criticalFails, []);
});

test('evaluateSafetyPreCheck: every failing area drives a corrective service id', function () {
  var r = Engine.evaluateSafetyPreCheck(allSafetyPassExcept({ mto_tires_wheels: false, mto_steering: 'defect' }));
  assert.strictEqual(r.status, 'fail');
  assert.strictEqual(r.criticalFails.length, 2);
  assert.ok(r.recommendedServiceIds.indexOf('tir_mount_balance') !== -1);
  assert.ok(r.recommendedServiceIds.indexOf('sus_strut_control') !== -1);
});

test('evaluateSafetyPreCheck: all areas failing scores 0 and flags every critical item', function () {
  var answers = {};
  Engine.MTO_SSC_CHECKLIST_ITEMS.forEach(function (item) { answers[item.id] = 'fail'; });
  var r = Engine.evaluateSafetyPreCheck(answers);
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.status, 'fail');
  var criticalCount = Engine.MTO_SSC_CHECKLIST_ITEMS.filter(function (item) {
    return item.severity === 'critical';
  }).length;
  assert.strictEqual(r.criticalFails.length, criticalCount);
  assert.ok(r.recommendedServiceIds.length >= 5);
});

test('evaluateSafetyPreCheck: unanswered items earn half weight and mixed representations work', function () {
  var empty = Engine.evaluateSafetyPreCheck({});
  assert.strictEqual(empty.score, 50, '11 items at half weight must score 50');
  assert.strictEqual(empty.status, 'fail', 'a 50 score is below the 70 fail line');
  assert.deepStrictEqual(empty.criticalFails, []);
  var mixed = Engine.evaluateSafetyPreCheck(allSafetyPassExcept({
    mto_brakes: true,
    mto_steering: 'yes',
    mto_glass_mirrors: 'ok',
    mto_wipers: null,
    mto_fuel_system: 'unknown'
  }));
  assert.strictEqual(mixed.score, 95);
  assert.strictEqual(mixed.status, 'pass');
});

test('lookupWorkOrder matches by code, bare number, phone and license plate', function () {
  assert.strictEqual(Engine.lookupWorkOrder('rev-2048').code, 'REV-2048');
  assert.strictEqual(Engine.lookupWorkOrder(' 2048 ').code, 'REV-2048');
  assert.strictEqual(Engine.lookupWorkOrder('REV-4092').currentState, 'READY_FOR_PICKUP');
  assert.strictEqual(Engine.lookupWorkOrder('(905) 555-0192').code, 'REV-3105');
  assert.strictEqual(Engine.lookupWorkOrder('bvxk 482').code, 'REV-2048');
  assert.strictEqual(Engine.lookupWorkOrder('dtrm-118').code, 'REV-4092');
});

test('lookupWorkOrder enforces secondary verification and returns null for unknowns', function () {
  assert.strictEqual(Engine.lookupWorkOrder('REV-2048', '9055550148').code, 'REV-2048');
  assert.strictEqual(Engine.lookupWorkOrder('REV-2048', '0148').code, 'REV-2048');
  assert.strictEqual(Engine.lookupWorkOrder('REV-2048', 'BVXK 482').code, 'REV-2048');
  assert.strictEqual(Engine.lookupWorkOrder('REV-2048', '416-555-0177'), null,
    'a matching code with a mismatched phone must return null');
  assert.strictEqual(Engine.lookupWorkOrder('REV-9999'), null);
  assert.strictEqual(Engine.lookupWorkOrder('9999'), null);
  assert.strictEqual(Engine.lookupWorkOrder(''), null);
  assert.strictEqual(Engine.lookupWorkOrder('', ''), null);
  assert.strictEqual(Engine.lookupWorkOrder(null, null), null);
  var custom = [{
    code: 'REV-7777',
    customerName: 'Test Driver',
    phone: '289-555-0123',
    licensePlate: 'TEST 001',
    vehicle: '2015 Mazda 3 GX',
    vehicleType: 'sedan',
    serviceIds: ['oil_full_synth'],
    currentState: 'CHECKED_IN',
    bayNumber: 'Bay 1',
    technicianName: 'Queue',
    technicianNotes: 'Just checked in for testing.',
    estimatedTotal: 98.2,
    createdAt: '2026-10-24T09:00:00.000Z',
    updatedAt: '2026-10-24T09:00:00.000Z'
  }];
  assert.strictEqual(Engine.lookupWorkOrder('rev-7777', null, custom).code, 'REV-7777');
  assert.strictEqual(Engine.lookupWorkOrder('289-555-0123', null, custom).code, 'REV-7777');
  assert.strictEqual(Engine.lookupWorkOrder('TEST 001', null, custom).code, 'REV-7777');
  assert.strictEqual(Engine.lookupWorkOrder('REV-7777'), null, 'custom orders must not leak into the seed pool');
});

test('createWorkOrder builds a CHECKED_IN order with estimate-derived total and timestamps', function () {
  var estimate = Engine.calculateEstimate({
    serviceIds: ['brk_pads_rotors', 'tir_align_4whl'],
    origin: 'domestic',
    vehicleClass: 'sedan'
  });
  var wo = Engine.createWorkOrder({
    customerName: 'Sam Rivera',
    phone: '(905) 555-0180',
    licensePlate: 'SAMR 180',
    vehicleYear: 2020,
    vehicleMake: 'Honda',
    vehicleModel: 'Civic Touring',
    vehicleClass: 'sedan',
    serviceIds: ['brk_pads_rotors', 'tir_align_4whl'],
    appointmentDate: '2026-10-27',
    appointmentTime: '09:00'
  }, estimate, { nowTimestamp: '2026-10-24T12:00:00.000Z' });
  assert.ok(/^REV-\d{4}$/.test(wo.code), 'code must match REV-XXXX: ' + wo.code);
  assert.strictEqual(wo.currentState, 'CHECKED_IN');
  assert.strictEqual(wo.customerName, 'Sam Rivera');
  assert.strictEqual(wo.phone, '(905) 555-0180');
  assert.strictEqual(wo.licensePlate, 'SAMR 180');
  assert.strictEqual(wo.vehicle.indexOf('2020 Honda Civic'), 0);
  assert.strictEqual(wo.vehicleType, 'sedan');
  assert.deepStrictEqual(wo.serviceIds, ['brk_pads_rotors', 'tir_align_4whl']);
  assert.strictEqual(wo.estimatedTotal, round2((estimate.totalLow + estimate.totalHigh) / 2));
  assert.strictEqual(wo.createdAt, '2026-10-24T12:00:00.000Z');
  assert.strictEqual(wo.updatedAt, wo.createdAt);
  assert.strictEqual(typeof wo.technicianNotes, 'string');
  assert.ok(wo.bayNumber.length > 2);
  assert.ok(wo.technicianName.length > 2);
});

test('createWorkOrder codes never collide with seeds, stay unique and stay deterministic', function () {
  var seedCodes = Engine.SEED_WORK_ORDERS.map(function (wo) { return wo.code; });
  var estimate = Engine.calculateEstimate({ serviceIds: ['oil_full_synth'] });
  var payloads = [
    { customerName: 'Ava One', phone: '905-555-0101', serviceIds: ['oil_full_synth'], appointmentDate: '2026-10-27', appointmentTime: '09:00' },
    { customerName: 'Ben Two', phone: '905-555-0102', serviceIds: ['ac_evac_recharge'], appointmentDate: '2026-10-28', appointmentTime: '10:30' },
    { customerName: 'Cy Three', phone: '905-555-0103', serviceIds: ['mto_safety_exhaust'], appointmentDate: '2026-10-29', appointmentTime: '13:15' }
  ];
  var seen = {};
  payloads.forEach(function (p) {
    var wo = Engine.createWorkOrder(p, estimate, { nowTimestamp: '2026-10-24T12:00:00.000Z' });
    assert.ok(seedCodes.indexOf(wo.code) === -1, 'code collided with a seed: ' + wo.code);
    assert.ok(!seen[wo.code], 'duplicate code generated: ' + wo.code);
    seen[wo.code] = true;
  });
  var repeat = {
    customerName: 'Dana Repeat',
    phone: '905-555-0104',
    serviceIds: ['tir_mount_balance'],
    appointmentDate: '2026-11-02',
    appointmentTime: '11:00'
  };
  var first = Engine.createWorkOrder(repeat, { estimatedTotal: 254.3 }, { nowTimestamp: '2026-10-24T08:00:00.000Z' });
  var second = Engine.createWorkOrder(repeat, { estimatedTotal: 254.3 }, { nowTimestamp: '2026-10-24T08:00:00.000Z' });
  assert.strictEqual(first.code, second.code, 'identical payloads must generate identical codes');
  assert.strictEqual(second.estimatedTotal, 254.3);
});

test('createWorkOrder handles a missing estimate and filters unknown service ids', function () {
  var wo = Engine.createWorkOrder({
    customerName: 'Eve Noestimate',
    phone: '905-555-0105',
    serviceIds: ['oil_full_synth', 'not_a_real_service'],
    appointmentDate: '2026-11-03',
    appointmentTime: '14:00'
  });
  assert.deepStrictEqual(wo.serviceIds, ['oil_full_synth']);
  assert.strictEqual(wo.estimatedTotal, 0);
  assert.ok(/^REV-\d{4}$/.test(wo.code));
  assert.strictEqual(wo.currentState, 'CHECKED_IN');
  assert.strictEqual(typeof wo.createdAt, 'string');
  assert.ok(!Number.isNaN(Date.parse(wo.createdAt)));
});

/* ------------------------------------------------------------------ */
/* Phase 2 - Segment 2 DOM Integrity Tests                             */
/* ------------------------------------------------------------------ */

group('Phase 2 - Segment 2 DOM Integrity Tests');

var PHASE2_DOM_IDS = [
  'wizard-section',
  'wizard-container',
  'wizard-step-indicator',
  'wizard-options',
  'wizard-result-card',
  'btn-wizard-add-service',
  'safety-precheck-section',
  'safety-checklist-container',
  'safety-score-gauge',
  'safety-summary-alert',
  'btn-safety-book-inspection',
  'bay-tracker-section',
  'tracker-input-code',
  'tracker-input-phone',
  'btn-track-vehicle',
  'tracker-status-timeline',
  'tracker-technician-notes',
  'btn-track-sample-1',
  'btn-track-sample-2',
  'tracker-feedback'
];

test('every required Phase 2 DOM ID exists verbatim in index.html', function () {
  PHASE2_DOM_IDS.forEach(function (id) {
    assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1,
      'index.html is missing required Phase 2 DOM ID: #' + id);
  });
  assert.strictEqual(PHASE2_DOM_IDS.length, 20, 'the full Phase 2 ID inventory must be covered');
});

test('the 17 contract-mandated interactive IDs are all present', function () {
  [
    'wizard-container', 'wizard-step-indicator', 'wizard-options',
    'wizard-result-card', 'btn-wizard-add-service',
    'safety-checklist-container', 'safety-score-gauge', 'safety-summary-alert',
    'btn-safety-book-inspection',
    'tracker-input-code', 'tracker-input-phone', 'btn-track-vehicle',
    'tracker-status-timeline', 'tracker-technician-notes',
    'btn-track-sample-1', 'btn-track-sample-2', 'tracker-feedback'
  ].forEach(function (id) {
    assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1, 'missing contract DOM ID: #' + id);
  });
});

test('wizard section copy, containers and CTA are wired for app.js', function () {
  assert.ok(INDEX_HTML.indexOf('id="wizard-section"') < INDEX_HTML.indexOf('id="wizard-container"'),
    'the wizard wrapper section must come first');
  assert.ok(INDEX_HTML.indexOf('Add Diagnostic Service to Estimate') !== -1,
    'the wizard CTA must read "Add Diagnostic Service to Estimate"');
  assert.ok(INDEX_HTML.indexOf('What&rsquo;s That Noise / Warning Light?') !== -1,
    'the wizard heading must match the What-Is-That-Noise concept');
  assert.ok(INDEX_HTML.indexOf('id="btn-wizard-add-service" type="button"') !== -1,
    'the wizard CTA must be a type="button" button');
});

test('safety pre-check section copy, gauge, alert and CTA are in place', function () {
  assert.ok(INDEX_HTML.indexOf('Book Official MTO Safety Inspection') !== -1,
    'the safety CTA must read "Book Official MTO Safety Inspection"');
  assert.ok(INDEX_HTML.indexOf('Ontario Safety Standards Certificate (MTO SSC) Pre-Check') !== -1,
    'the safety section heading must name the MTO SSC pre-check');
  assert.ok(INDEX_HTML.indexOf('id="safety-score-gauge"') !== -1 &&
    INDEX_HTML.indexOf('id="safety-summary-alert"') !== -1,
    'gauge and summary alert must both exist');
});

test('tracker inputs carry the required placeholders and button labels', function () {
  assert.ok(INDEX_HTML.indexOf('placeholder="REV-2048"') !== -1,
    'the code input must use the REV-2048 placeholder');
  assert.ok(INDEX_HTML.indexOf('placeholder="Phone or Plate"') !== -1,
    'the verification input must use the Phone or Plate placeholder');
  assert.ok(INDEX_HTML.indexOf('Load REV-2048: In Bay') !== -1,
    'sample button 1 must be labelled Load REV-2048: In Bay');
  assert.ok(INDEX_HTML.indexOf('Load REV-3105: Parts Ordered') !== -1,
    'sample button 2 must be labelled Load REV-3105: Parts Ordered');
});

test('the bay tracker timeline is a 6-stage ordered list with verbatim stage labels', function () {
  var timelineStart = INDEX_HTML.indexOf('id="tracker-status-timeline"');
  var timelineEnd = INDEX_HTML.indexOf('</ol>', timelineStart);
  assert.ok(timelineStart !== -1 && timelineEnd !== -1, 'tracker-status-timeline must be a list');
  assert.ok(INDEX_HTML.indexOf('<ol id="tracker-status-timeline"') !== -1,
    'the timeline must be an <ol>');
  var timelineHtml = INDEX_HTML.slice(timelineStart, timelineEnd);
  var stageLabels = ['Checked In', 'Inspection &amp; Diagnostics', 'Parts Ordered',
    'In Bay / Repairing', 'Quality &amp; Alignment', 'Ready for Pickup'];
  stageLabels.forEach(function (label) {
    assert.ok(timelineHtml.indexOf(label) !== -1, 'timeline stage label missing: ' + label);
  });
  assert.strictEqual((timelineHtml.match(/<li class="tl-step">/g) || []).length, 6,
    'the timeline must render exactly 6 stage steps');
});

test('the six timeline stages mirror the engine WORK_ORDER_STATES lifecycle', function () {
  assert.strictEqual(Engine.WORK_ORDER_STATES.length, 6,
    'the engine lifecycle and the timeline must both have 6 stages');
  ['Checked In', 'Inspection &amp; Diagnostics', 'Parts Ordered',
    'In Bay / Repairing', 'Quality &amp; Alignment', 'Ready for Pickup'].forEach(function (label) {
    assert.ok(INDEX_HTML.indexOf(label) !== -1, 'stage label must exist in index.html: ' + label);
  });
});

test('quick-nav links point at all three new Phase 2 sections', function () {
  ['wizard-section', 'safety-precheck-section', 'bay-tracker-section'].forEach(function (sectionId) {
    assert.ok(INDEX_HTML.indexOf('href="#' + sectionId + '"') !== -1,
      'quick-nav must link to #' + sectionId);
  });
});

test('every Phase 1 mandatory DOM ID remains present and uncorrupted', function () {
  MANDATORY_DOM_IDS.forEach(function (id) {
    assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1,
      'Phase 1 DOM ID was lost or corrupted: #' + id);
  });
});

test('Phase 1 asset paths and branding remain intact after the Phase 2 insert', function () {
  ['assets/hero_bay.jpg', 'assets/diagnostics_tech.jpg', 'assets/safety_badge.jpg'].forEach(function (asset) {
    assert.ok(INDEX_HTML.indexOf(asset) !== -1, 'asset reference lost: ' + asset);
  });
  assert.ok(INDEX_HTML.indexOf('Revolutions Automotive') !== -1);
  assert.ok(INDEX_HTML.indexOf('1-15A Fisherman Dr, Brampton, ON L7A 1B7') !== -1);
  assert.ok(INDEX_HTML.indexOf('(905) 846-8351') !== -1);
  assert.ok(INDEX_HTML.indexOf('<script src="revolutions_engine.js"></script>') !== -1);
  assert.ok(INDEX_HTML.indexOf('<script src="app.js"></script>') !== -1);
});

test('styles.css ships the wizard container, step indicator, options and result card rules', function () {
  ['.wizard-container', '.wizard-step-indicator', '.wizard-options',
    '.wizard-option', '.wizard-result-card', '.btn-wizard-cta'].forEach(function (selector) {
    assert.ok(STYLES_CSS.indexOf(selector) !== -1, 'styles.css missing selector: ' + selector);
  });
});

test('styles.css color-codes all three diagnostic triage levels', function () {
  ['.triage-tow_now', '.triage-schedule_urgent', '.triage-routine_inspect',
    '.triage-badge'].forEach(function (selector) {
    assert.ok(STYLES_CSS.indexOf(selector) !== -1, 'styles.css missing triage selector: ' + selector);
  });
  assert.ok(STYLES_CSS.indexOf('@keyframes triage-pulse') !== -1,
    'the tow_now badge must carry a pulsating animation');
});

test('styles.css ships the MTO gauge and summary alert with pass/advisory/fail colors', function () {
  ['.safety-score-gauge', '.safety-summary-alert', '.safety-item',
    '.safety-toggle', '.toggle-pass', '.toggle-fail', '.toggle-unsure'].forEach(function (selector) {
    assert.ok(STYLES_CSS.indexOf(selector) !== -1, 'styles.css missing safety selector: ' + selector);
  });
  ['.is-pass', '.is-advisory', '.is-fail'].forEach(function (state) {
    assert.ok(STYLES_CSS.indexOf('.safety-score-gauge' + state) !== -1,
      'styles.css missing gauge state: ' + state);
    assert.ok(STYLES_CSS.indexOf('.safety-summary-alert' + state) !== -1,
      'styles.css missing alert state: ' + state);
  });
});

test('styles.css ships the bay tracker timeline with complete, active and pending states', function () {
  ['.tracker-status-timeline', '.tl-step', '.tl-step.is-complete',
    '.tl-step.is-active', '.tl-step.is-pending'].forEach(function (selector) {
    assert.ok(STYLES_CSS.indexOf(selector) !== -1, 'styles.css missing timeline selector: ' + selector);
  });
  assert.ok(STYLES_CSS.indexOf('@keyframes bay-pulse') !== -1,
    'the active timeline stage must carry the pulsating gold glow');
  assert.ok(STYLES_CSS.indexOf('.tracker-technician-notes') !== -1,
    'technician notes panel must be styled');
});

test('Phase 2 layouts stay responsive on tablet and phone breakpoints', function () {
  assert.ok(STYLES_CSS.indexOf('.safety-layout') !== -1, 'safety layout grid required');
  assert.ok(STYLES_CSS.indexOf('.tracker-form') !== -1, 'tracker form grid required');
  assert.ok(STYLES_CSS.indexOf('.tracker-samples') !== -1, 'tracker sample row required');
  var tabletRule = '@media (max-width: 1024px)';
  var phoneRule = '@media (max-width: 720px)';
  assert.ok(STYLES_CSS.indexOf(tabletRule, STYLES_CSS.indexOf('Phase 2')) !== -1,
    'Phase 2 tablet breakpoint required');
  assert.ok(STYLES_CSS.indexOf(phoneRule, STYLES_CSS.indexOf('Phase 2')) !== -1,
    'Phase 2 phone breakpoint required');
});

/* ------------------------------------------------------------------ */
/* Phase 2 - Segment 3 Controller & Anti-Drift Tests                   */
/* ------------------------------------------------------------------ */

group('Phase 2 - Segment 3 Controller & Anti-Drift Tests');

test('anti-drift: every DOM ID referenced in app.js exists verbatim in index.html', function () {
  var ids = [];
  var reGetById = /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  var reQueryId = /querySelector(?:All)?\(\s*['"]#([A-Za-z0-9_-]+)['"]\s*\)/g;
  var match;
  while ((match = reGetById.exec(APP_JS)) !== null) ids.push(match[1]);
  while ((match = reQueryId.exec(APP_JS)) !== null) ids.push(match[1]);
  assert.ok(ids.length >= 40, 'expected at least 40 DOM references in app.js, found ' + ids.length);
  ids.forEach(function (id) {
    assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1,
      'app.js references missing DOM ID: #' + id);
  });
});

test('all 17 Phase 2 interactive DOM IDs are wired inside app.js', function () {
  [
    'wizard-container', 'wizard-step-indicator', 'wizard-options',
    'wizard-result-card', 'btn-wizard-add-service',
    'safety-checklist-container', 'safety-score-gauge', 'safety-summary-alert',
    'btn-safety-book-inspection',
    'tracker-input-code', 'tracker-input-phone', 'btn-track-vehicle',
    'tracker-status-timeline', 'tracker-technician-notes',
    'btn-track-sample-1', 'btn-track-sample-2', 'tracker-feedback'
  ].forEach(function (id) {
    assert.ok(APP_JS.indexOf(id) !== -1, 'app.js must wire #' + id);
  });
});

test('app.js integrates the full Phase 2 engine API surface', function () {
  [
    'DIAGNOSTIC_DECISION_TREE',
    'MTO_SSC_CHECKLIST_ITEMS',
    'WORK_ORDER_STATES',
    'evaluateDiagnosticWizard',
    'evaluateSafetyPreCheck',
    'lookupWorkOrder',
    'createWorkOrder'
  ].forEach(function (token) {
    assert.ok(APP_JS.indexOf(token) !== -1, 'app.js must call ' + token);
  });
});

test('wizard step indicator renders the three verbatim step prompts', function () {
  [
    'Step 1 of 3: Select Anomaly Type',
    'Step 2 of 3: Identify Location',
    'Step 3 of 3: Driving Condition'
  ].forEach(function (prompt) {
    assert.ok(APP_JS.indexOf(prompt) !== -1, 'app.js must render "' + prompt + '"');
  });
  assert.ok(APP_JS.indexOf('renderWizardResult') !== -1, 'the wizard must render its result card');
  assert.ok(APP_JS.indexOf('Start Over') !== -1, 'the wizard must offer a Start Over reset');
});

test('wizard result card renders all three color-coded triage badges', function () {
  assert.ok(APP_JS.indexOf('triage-badge') !== -1, 'triage badge class required');
  [
    'triage-tow_now',
    'triage-schedule_urgent',
    'triage-routine_inspect'
  ].forEach(function (cls) {
    assert.ok(APP_JS.indexOf(cls) !== -1, 'app.js must apply the ' + cls + ' badge class');
  });
  assert.ok(APP_JS.indexOf('Probable Root Causes') !== -1, 'root causes must be rendered');
  assert.ok(APP_JS.indexOf('Technician notes:') !== -1, 'technician notes must be rendered');
});

test('wizard CTA stores the recommended service and scrolls to the estimate', function () {
  assert.ok(APP_JS.indexOf('recommendedServiceId') !== -1,
    'the CTA must carry the recommended service id');
  assert.ok(APP_JS.indexOf('estimate-summary-card') !== -1,
    'the CTA must scroll to the estimate summary card');
  assert.ok(APP_JS.indexOf('scrollIntoView') !== -1, 'smooth scroll is required');
  assert.ok(APP_JS.indexOf('Added to estimate:') !== -1,
    'the CTA must confirm the service was added');
});

test('safety checklist renders pass/fail/unsure toggles and verdict styling', function () {
  ['toggle-pass', 'toggle-fail', 'toggle-unsure'].forEach(function (cls) {
    assert.ok(APP_JS.indexOf(cls) !== -1, 'app.js must render ' + cls + ' toggles');
  });
  ['is-pass', 'is-advisory', 'is-fail'].forEach(function (cls) {
    assert.ok(APP_JS.indexOf(cls) !== -1, 'app.js must apply the ' + cls + ' verdict class');
  });
  assert.ok(APP_JS.indexOf('Instant-fail for Ontario MTO certification') !== -1,
    'critical failures must trigger the instant-fail compliance warning');
});

test('safety CTA books the MTO inspection service and focuses the booking form', function () {
  assert.ok(APP_JS.indexOf('mto_safety_exhaust') !== -1,
    'the safety CTA must select the Ontario Safety Inspection service');
  assert.ok(APP_JS.indexOf('btn-safety-book-inspection') !== -1,
    'the safety CTA button must be wired');
  assert.ok(APP_JS.indexOf('booking-form') !== -1,
    'the safety CTA must lead to the booking form');
});

test('bay tracker renders the 6-state timeline with complete, active and pending states', function () {
  ['is-complete', 'is-active', 'is-pending'].forEach(function (cls) {
    assert.ok(APP_JS.indexOf(cls) !== -1, 'app.js must apply the ' + cls + ' timeline state');
  });
  assert.ok(APP_JS.indexOf('WORK_ORDER_STATES') !== -1,
    'the timeline must iterate the engine lifecycle states');
  ['Checked In', 'Inspection & Diagnostics', 'Parts Ordered',
    'In Bay / Repairing', 'Quality & Alignment', 'Ready for Pickup'].forEach(function (label) {
    assert.ok(APP_JS.indexOf(label) !== -1, 'timeline label must be rendered by app.js: ' + label);
  });
});

test('tracker notes display bay, vehicle, technician, total and estimated completion', function () {
  ['bayNumber', 'technicianName', 'estimatedTotal', 'Estimated completion'].forEach(function (token) {
    assert.ok(APP_JS.indexOf(token) !== -1, 'tracker notes must include ' + token);
  });
  assert.ok(APP_JS.indexOf('Bay notes:') !== -1, 'technician bay notes must be shown');
});

test('tracker not-found feedback carries the shop phone; samples load the seed orders', function () {
  assert.ok(APP_JS.indexOf('No work order found matching that code or phone number') !== -1,
    'the not-found advisory must be present');
  assert.ok(APP_JS.indexOf('(905) 846-8351') !== -1,
    'the not-found advisory must include the Brampton shop phone');
  assert.ok(APP_JS.indexOf('REV-2048') !== -1 && APP_JS.indexOf('REV-3105') !== -1,
    'both quick sample buttons must reference the seed work orders');
});

test('appointment submission creates a work order with a Track My Vehicle Now link', function () {
  assert.ok(APP_JS.indexOf('createWorkOrder') !== -1,
    'booking submission must call createWorkOrder');
  assert.ok(APP_JS.indexOf('state.workOrders.push') !== -1,
    'created work orders must be stored in the workOrders array');
  assert.ok(APP_JS.indexOf('Track My Vehicle Now') !== -1,
    'the booking feedback must offer a Track My Vehicle Now link');
  assert.ok(APP_JS.indexOf('Your live work order has been created:') !== -1,
    'the generated REV-XXXX code must be displayed prominently');
});

test('app.js persists wizard, safety and work order state under the storage key', function () {
  assert.ok(APP_JS.indexOf('revolutions_automotive_state_v1') !== -1);
  ['wizardAnswers', 'wizardCurrentNodeId', 'safetyAnswers', 'workOrders', 'activeTrackedCode']
    .forEach(function (key) {
      assert.ok(APP_JS.indexOf(key) !== -1, 'state must persist ' + key);
    });
});

test('simulation: a created work order is immediately trackable through lookupWorkOrder', function () {
  var booking = {
    customerName: 'Sim Bridge',
    phone: '905-555-0177',
    licensePlate: 'SIMB 177',
    vehicleYear: 2019,
    vehicleMake: 'Hyundai',
    vehicleModel: 'Elantra',
    origin: 'asian_import',
    vehicleClass: 'sedan',
    serviceIds: ['diag_computer_scan', 'brk_pads_rotors'],
    appointmentDate: '2026-11-04',
    appointmentTime: '09:30',
    bookingMode: 'drop_off'
  };
  var validation = Engine.validateBooking(booking);
  assert.strictEqual(validation.valid, true);
  assert.deepStrictEqual(validation.errors, []);
  var estimate = Engine.calculateEstimate({
    serviceIds: booking.serviceIds,
    origin: 'asian_import',
    vehicleClass: 'sedan'
  });
  var workOrder = Engine.createWorkOrder(validation.normalizedBooking, estimate, {
    nowTimestamp: '2026-11-04T09:30:00.000Z'
  });
  var pool = [workOrder];
  assert.ok(/^REV-\d{4}$/.test(workOrder.code), 'bridge must generate a REV-XXXX code');
  assert.strictEqual(workOrder.currentState, 'CHECKED_IN');
  assert.strictEqual(Engine.lookupWorkOrder(workOrder.code.toLowerCase(), '', pool), workOrder,
    'the created order must be trackable by code, case-insensitively');
  assert.strictEqual(Engine.lookupWorkOrder('', workOrder.phone, pool), workOrder,
    'the created order must be trackable by the customer phone');
  assert.strictEqual(Engine.lookupWorkOrder(workOrder.code, workOrder.phone, pool), workOrder,
    'the created order must verify against its own phone');
  assert.strictEqual(Engine.lookupWorkOrder('REV-9999', '', pool), null,
    'unknown codes must not resolve inside the custom pool');
});

test('simulation: the booking-to-tracker pool coexists with the seed work orders', function () {
  var workOrder = Engine.createWorkOrder({
    customerName: 'Pool Mate',
    phone: '289-555-0166',
    serviceIds: ['tir_mount_balance'],
    appointmentDate: '2026-11-05',
    appointmentTime: '10:00'
  }, { estimatedTotal: 142.9 }, { nowTimestamp: '2026-11-05T10:00:00.000Z' });
  var pool = [workOrder];
  assert.ok(Engine.lookupWorkOrder('REV-2048', '', pool), 'seed REV-2048 must still resolve');
  assert.strictEqual(Engine.lookupWorkOrder(workOrder.code, '', pool), workOrder,
    'the user-created order must resolve alongside the seeds');
  assert.notStrictEqual(workOrder.code, 'REV-2048');
  assert.notStrictEqual(workOrder.code, 'REV-3105');
  assert.notStrictEqual(workOrder.code, 'REV-4092');
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
