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

/* ================================================================== */
/* Phase 3 - Segment 1: Engine extensions                              */
/* ================================================================== */

group('Phase 3 - Segment 1 Engine Tests');

var CSV_HEADER_LINE = 'Work Order Code,Customer Name,Phone,Vehicle Year,Vehicle Make,Vehicle Model,Origin,Class,Date,Time,Mode,Status,Total Low,Total High,Services';

test('TIER_CONFIG_DEFAULTS is deep-frozen with the Brampton shop defaults', function () {
  assert.ok(Object.isFrozen(Engine.TIER_CONFIG_DEFAULTS), 'the tier config root must be frozen');
  assert.ok(Object.isFrozen(Engine.TIER_CONFIG_DEFAULTS.activeCoupons), 'activeCoupons must be frozen');
  assert.strictEqual(Engine.TIER_CONFIG_DEFAULTS.laborRatePerHour, 130.00);
  assert.strictEqual(Engine.TIER_CONFIG_DEFAULTS.shopSuppliesRate, 0.05);
  assert.strictEqual(Engine.TIER_CONFIG_DEFAULTS.shopSuppliesCap, 35.00);
  assert.strictEqual(Engine.TIER_CONFIG_DEFAULTS.defaultOwnerPin, '8351');
  assert.strictEqual(Engine.TIER_CONFIG_DEFAULTS.currency, 'CAD');
  assert.strictEqual(Engine.TIER_CONFIG_DEFAULTS.hstRate, 0.13);
  assert.strictEqual(typeof Engine.TIER_CONFIG_DEFAULTS.bannerText, 'string');
  assert.ok(Engine.TIER_CONFIG_DEFAULTS.bannerText.length > 0);
});

test('TIER_CONFIG_DEFAULTS.activeCoupons mirrors the live coupon catalog', function () {
  assert.strictEqual(Engine.TIER_CONFIG_DEFAULTS.activeCoupons.length, 5);
  assert.deepStrictEqual(Engine.TIER_CONFIG_DEFAULTS.activeCoupons,
    Engine.COUPON_CATALOG.map(function (c) { return c.code; }));
});

test('SEO_SCHEMA_DATA is a frozen Schema.org AutoRepair object for the Brampton shop', function () {
  assert.ok(Object.isFrozen(Engine.SEO_SCHEMA_DATA));
  assert.strictEqual(Engine.SEO_SCHEMA_DATA['@context'], 'https://schema.org');
  assert.strictEqual(Engine.SEO_SCHEMA_DATA['@type'], 'AutoRepair');
  assert.strictEqual(Engine.SEO_SCHEMA_DATA.name, 'Revolutions Automotive');
  assert.strictEqual(Engine.SEO_SCHEMA_DATA.priceRange, '$$');
});

test('SEO_SCHEMA_DATA carries the full Brampton postal address', function () {
  var addr = Engine.SEO_SCHEMA_DATA.address;
  assert.strictEqual(addr.streetAddress, '1-15A Fisherman Dr');
  assert.strictEqual(addr.addressLocality, 'Brampton');
  assert.strictEqual(addr.addressRegion, 'ON');
  assert.strictEqual(addr.postalCode, 'L7A 1B7');
  assert.strictEqual(addr.addressCountry, 'CA');
});

test('SEO_SCHEMA_DATA geo-coordinates match the Brampton location', function () {
  assert.strictEqual(Engine.SEO_SCHEMA_DATA.geo.latitude, 43.7196);
  assert.strictEqual(Engine.SEO_SCHEMA_DATA.geo.longitude, -79.7946);
});

test('SEO_SCHEMA_DATA exposes the shop phone and opening hours', function () {
  assert.strictEqual(Engine.SEO_SCHEMA_DATA.telephone, '+1-905-846-8351');
  var specs = Engine.SEO_SCHEMA_DATA.openingHoursSpecification;
  assert.strictEqual(specs.length, 2);
  assert.deepStrictEqual(specs[0].dayOfWeek, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  assert.strictEqual(specs[0].opens, '08:00');
  assert.strictEqual(specs[0].closes, '18:00');
  assert.deepStrictEqual(specs[1].dayOfWeek, ['Saturday']);
  assert.strictEqual(specs[1].opens, '08:30');
  assert.strictEqual(specs[1].closes, '15:00');
  assert.ok(Engine.SEO_SCHEMA_DATA.openingHours.indexOf('Mo-Fr 08:00-18:00') !== -1);
});

test('SEO_SCHEMA_DATA offer catalog lists all 12 services', function () {
  var offers = Engine.SEO_SCHEMA_DATA.hasOfferCatalog.itemListElement;
  assert.strictEqual(offers.length, Engine.SERVICE_CATALOG.length);
  assert.strictEqual(offers.length, 12);
  var names = offers.map(function (o) { return o.itemOffered.name; });
  Engine.SERVICE_CATALOG.forEach(function (svc) {
    assert.ok(names.indexOf(svc.name) !== -1, 'catalog must expose ' + svc.name);
  });
});

test('parseTireSize computes the full metric math for 205/55R16', function () {
  var t = Engine.parseTireSize('205/55R16');
  assert.strictEqual(t.width, 205);
  assert.strictEqual(t.aspectRatio, 55);
  assert.strictEqual(t.rimDiameter, 16);
  assert.strictEqual(t.normalized, '205/55R16');
  assert.strictEqual(t.sidewallHeightMm, 112.75);
  assert.strictEqual(t.overallDiameterMm, 631.9);
  assert.strictEqual(t.overallDiameterInches, 24.88);
  assert.strictEqual(t.circumferenceMm, round2(Math.PI * 631.9));
});

test('parseTireSize computes 225/45R17 sizing', function () {
  var t = Engine.parseTireSize('225/45R17');
  assert.strictEqual(t.width, 225);
  assert.strictEqual(t.rimDiameter, 17);
  assert.strictEqual(t.sidewallHeightMm, 101.25);
  assert.strictEqual(t.overallDiameterMm, 634.3);
});

test('parseTireSize accepts P/LT prefixes and the 215/60/16 slash notation', function () {
  var p = Engine.parseTireSize('P215/60R16');
  assert.strictEqual(p.normalized, '215/60R16');
  assert.strictEqual(p.width, 215);
  var lt = Engine.parseTireSize('LT275/65R18');
  assert.strictEqual(lt.width, 275);
  assert.strictEqual(lt.aspectRatio, 65);
  assert.strictEqual(lt.rimDiameter, 18);
  var slash = Engine.parseTireSize('215/60/16');
  assert.strictEqual(slash.normalized, p.normalized);
  assert.strictEqual(slash.overallDiameterMm, p.overallDiameterMm);
});

test('parseTireSize returns null for malformed inputs', function () {
  assert.strictEqual(Engine.parseTireSize('abc'), null);
  assert.strictEqual(Engine.parseTireSize('205-55-16'), null);
  assert.strictEqual(Engine.parseTireSize(''), null);
  assert.strictEqual(Engine.parseTireSize(null), null);
  assert.strictEqual(Engine.parseTireSize(205), null);
  assert.strictEqual(Engine.parseTireSize('205/55R'), null);
});

test('parseTireSize returns null for out-of-range dimensions', function () {
  assert.strictEqual(Engine.parseTireSize('120/55R16'), null);
  assert.strictEqual(Engine.parseTireSize('410/55R16'), null);
  assert.strictEqual(Engine.parseTireSize('205/15R16'), null);
  assert.strictEqual(Engine.parseTireSize('205/110R16'), null);
  assert.strictEqual(Engine.parseTireSize('205/55R9'), null);
});

test('compareTireSizes reports zero variance for identical sizes', function () {
  var r = Engine.compareTireSizes('205/55R16', '205/55R16');
  assert.strictEqual(r.diameterDiffMm, 0);
  assert.strictEqual(r.diameterDiffPercent, 0);
  assert.strictEqual(r.speedometerReadingAt100, 100);
  assert.strictEqual(r.speedoDiffKmh, 0);
  assert.strictEqual(r.complianceRating, 'safe');
  assert.strictEqual(r.isWithinTolerance, true);
});

test('compareTireSizes rates a mild 225/45R17 upsize as safe', function () {
  var r = Engine.compareTireSizes('205/55R16', '225/45R17');
  assert.strictEqual(r.diameterDiffMm, 2.4);
  assert.strictEqual(r.diameterDiffPercent, 0.38);
  assert.strictEqual(r.sidewallDiffMm, -11.5);
  assert.strictEqual(r.complianceRating, 'safe');
  assert.strictEqual(r.isWithinTolerance, true);
  assert.ok(r.speedometerReadingAt100 > 99 && r.speedometerReadingAt100 < 100,
    'a taller target tire must make the speedometer read below 100 km/h');
  assert.strictEqual(r.circumferenceDiffMm, round2(r.target.circumferenceMm - r.current.circumferenceMm));
});

test('compareTireSizes rates an aggressive 275/65R18 upsize as caution', function () {
  var r = Engine.compareTireSizes('205/55R16', '275/65R18');
  assert.strictEqual(r.diameterDiffMm, 182.8);
  assert.strictEqual(r.diameterDiffPercent, 28.93);
  assert.strictEqual(r.complianceRating, 'caution');
  assert.strictEqual(r.isWithinTolerance, false);
  assert.ok(r.speedometerReadingAt100 > 77 && r.speedometerReadingAt100 < 78);
  assert.ok(r.recommendation.indexOf('3.0%') !== -1);
});

test('compareTireSizes returns null when either size is invalid', function () {
  assert.strictEqual(Engine.compareTireSizes('205/55R16', 'not-a-size'), null);
  assert.strictEqual(Engine.compareTireSizes('nope', '205/55R16'), null);
  assert.strictEqual(Engine.compareTireSizes('', ''), null);
});

var VOUCHER_BOOKING = {
  customerName: 'Dana Osei',
  phone: '905-555-0147',
  vehicleYear: 2022,
  vehicleMake: 'Honda',
  vehicleModel: 'Civic',
  vehicleClass: 'sedan',
  preferredDate: '2026-05-01',
  preferredTime: '10:00'
};
var VOUCHER_ESTIMATE_OPTIONS = {
  serviceIds: ['tir_mount_balance', 'tir_align_4whl'],
  vehicleOrigin: 'domestic',
  vehicleClass: 'sedan'
};

test('generateVoucherData produces a deterministic REV-VOUCH-XXXX code', function () {
  var a = Engine.generateVoucherData(VOUCHER_ESTIMATE_OPTIONS, VOUCHER_BOOKING);
  var b = Engine.generateVoucherData(VOUCHER_ESTIMATE_OPTIONS, VOUCHER_BOOKING);
  assert.ok(/^REV-VOUCH-[0-9A-Z]{4}$/.test(a.voucherCode), 'voucher code format: ' + a.voucherCode);
  assert.strictEqual(a.voucherCode, b.voucherCode, 'identical payloads must produce identical codes');
});

test('generateVoucherData computes a rolling 30-day expiry in UTC', function () {
  var v = Engine.generateVoucherData(VOUCHER_ESTIMATE_OPTIONS, VOUCHER_BOOKING);
  assert.strictEqual(v.issuedDate, '2026-05-01');
  assert.strictEqual(v.expiryDate, '2026-05-31');
  assert.strictEqual(v.validDays, 30);
  var v2 = Engine.generateVoucherData(VOUCHER_ESTIMATE_OPTIONS, { preferredDate: '2026-12-01' });
  assert.strictEqual(v2.issuedDate, '2026-12-01');
  assert.strictEqual(v2.expiryDate, '2026-12-31');
});

test('generateVoucherData itemizes pricing straight from the estimator', function () {
  var calc = Engine.calculateEstimate(VOUCHER_ESTIMATE_OPTIONS);
  var v = Engine.generateVoucherData(VOUCHER_ESTIMATE_OPTIONS, VOUCHER_BOOKING);
  assert.strictEqual(v.lineItems.length, calc.lineItems.length);
  assert.strictEqual(v.subtotalLow, calc.subtotalLow);
  assert.strictEqual(v.subtotalHigh, calc.subtotalHigh);
  assert.strictEqual(v.totalLow, calc.totalLow);
  assert.strictEqual(v.totalHigh, calc.totalHigh);
  assert.strictEqual(v.couponCode, calc.couponCode);
});

test('generateVoucherData applies 13% Ontario HST consistently', function () {
  var v = Engine.generateVoucherData(VOUCHER_ESTIMATE_OPTIONS, VOUCHER_BOOKING);
  assert.strictEqual(v.hstRate, 0.13);
  assert.strictEqual(v.hstLow, round2(v.subtotalLow * 0.13));
  assert.strictEqual(v.hstAmount, v.hstLow);
  assert.strictEqual(v.totalLow, round2(v.subtotalLow + v.hstLow));
  assert.strictEqual(v.totalAmount, v.totalLow);
  assert.strictEqual(v.currency, 'CAD');
});

test('generateVoucherData carries shop, customer, vehicle and disclaimer text', function () {
  var v = Engine.generateVoucherData(VOUCHER_ESTIMATE_OPTIONS, VOUCHER_BOOKING);
  assert.strictEqual(v.customerName, 'Dana Osei');
  assert.strictEqual(v.customerPhone, '905-555-0147');
  assert.strictEqual(v.vehicleSummary, '2022 Honda Civic (sedan)');
  assert.strictEqual(v.shopInfo, Engine.SHOP_INFO);
  assert.ok(v.disclaimer.indexOf('Revolutions Automotive') !== -1);
  assert.ok(v.disclaimer.indexOf('30 days') !== -1);
});

test('exportBookingsToCsv returns just the CRLF header for empty or invalid input', function () {
  var headerCsv = CSV_HEADER_LINE + '\r\n';
  assert.strictEqual(Engine.exportBookingsToCsv([]), headerCsv);
  assert.strictEqual(Engine.exportBookingsToCsv(null), headerCsv);
  assert.strictEqual(Engine.exportBookingsToCsv('nope'), headerCsv);
});

test('exportBookingsToCsv renders a standard booking row', function () {
  var csv = Engine.exportBookingsToCsv([{
    code: 'REV-2048',
    customerName: 'Jordan Fields',
    phone: '905-555-0123',
    vehicleYear: 2022,
    vehicleMake: 'Honda',
    vehicleModel: 'Civic',
    origin: 'import',
    vehicleClass: 'sedan',
    preferredDate: '2026-06-01',
    preferredTime: '10:00',
    bookingMode: 'drop_off',
    currentState: 'IN_REPAIR_BAY',
    estimatedTotal: 142.9,
    serviceIds: ['tir_mount_balance', 'tir_align_4whl']
  }]);
  var expectedRow = ['REV-2048', 'Jordan Fields', '905-555-0123', '2022', 'Honda', 'Civic',
    'import', 'sedan', '2026-06-01', '10:00', 'drop_off', 'IN_REPAIR_BAY',
    '142.90', '142.90', 'tir_mount_balance; tir_align_4whl'].join(',');
  assert.strictEqual(csv, CSV_HEADER_LINE + '\r\n' + expectedRow + '\r\n');
});

test('exportBookingsToCsv wraps fields containing commas in RFC-4180 quotes', function () {
  var csv = Engine.exportBookingsToCsv([{
    code: 'REV-3105',
    customerName: 'Fields, Jordan',
    phone: '905-555-0188',
    serviceIds: ['Brake Service', 'Alignment, Road Test']
  }]);
  var expectedRow = ['REV-3105', '"Fields, Jordan"', '905-555-0188', '', '', '', '', '', '', '', '',
    'BOOKED', '', '', '"Brake Service; Alignment, Road Test"'].join(',');
  assert.strictEqual(csv, CSV_HEADER_LINE + '\r\n' + expectedRow + '\r\n');
});

test('exportBookingsToCsv doubles embedded quotes and preserves newlines inside quotes', function () {
  var csv = Engine.exportBookingsToCsv([{
    code: 'REV-4092',
    customerName: 'O"Brien',
    vehicleModel: 'Civic\nSport'
  }]);
  assert.ok(csv.indexOf('"O""Brien"') !== -1);
  assert.ok(csv.indexOf('"Civic\nSport"') !== -1);
  var rows = csv.split('\r\n');
  assert.strictEqual(rows.length, 3);
});

test('exportBookingsToCsv formats the total range and falls back to estimatedTotal', function () {
  var csv = Engine.exportBookingsToCsv([
    { code: 'REV-1000', totalLow: 142.9, totalHigh: 180.1 },
    { code: 'REV-2000', estimatedTotal: 99.999 }
  ]);
  var lines = csv.split('\r\n');
  assert.strictEqual(lines[1],
    ['REV-1000', '', '', '', '', '', '', '', '', '', '', 'BOOKED', '142.90', '180.10', ''].join(','));
  assert.strictEqual(lines[2],
    ['REV-2000', '', '', '', '', '', '', '', '', '', '', 'BOOKED', '100.00', '100.00', ''].join(','));
});

test('exportBookingsToCsv exports the seed work orders end-to-end', function () {
  var csv = Engine.exportBookingsToCsv(Engine.SEED_WORK_ORDERS);
  var lines = csv.split('\r\n');
  assert.strictEqual(lines.length, Engine.SEED_WORK_ORDERS.length + 2);
  assert.strictEqual(lines[1].slice(0, 8), 'REV-2048');
  assert.strictEqual(lines[2].slice(0, 8), 'REV-3105');
  assert.strictEqual(lines[3].slice(0, 8), 'REV-4092');
  assert.ok(lines[3].indexOf('READY_FOR_PICKUP') !== -1);
});

test('validateOwnerPin accepts the default 8351 PIN in string, numeric and padded forms', function () {
  assert.strictEqual(Engine.validateOwnerPin('8351'), true);
  assert.strictEqual(Engine.validateOwnerPin(8351), true);
  assert.strictEqual(Engine.validateOwnerPin('  8351\n'), true);
});

test('validateOwnerPin rejects wrong, malformed and missing entries', function () {
  assert.strictEqual(Engine.validateOwnerPin('0000'), false);
  assert.strictEqual(Engine.validateOwnerPin('835'), false);
  assert.strictEqual(Engine.validateOwnerPin('abcd'), false);
  assert.strictEqual(Engine.validateOwnerPin(null), false);
  assert.strictEqual(Engine.validateOwnerPin({}), false);
});

test('validateOwnerPin verifies against a custom configured PIN', function () {
  assert.strictEqual(Engine.validateOwnerPin('9942', '9942'), true);
  assert.strictEqual(Engine.validateOwnerPin('8351', '9942'), false);
  assert.strictEqual(Engine.validateOwnerPin('8351', ''), true);
});

/* ================================================================== */
/* Phase 3 - Segment 2: DOM, JSON-LD & print integrity tests          */
/* ================================================================== */

group('Phase 3 - Segment 2 DOM & Print Integrity Tests');

var PHASE3_REQUIRED_IDS = [
  'tire-calc-section', 'tire-input-current', 'tire-input-target', 'btn-calc-tires',
  'tire-comparison-results', 'tire-speedo-diff', 'tire-fitment-badge',
  'btn-print-estimate', 'voucher-modal', 'voucher-print-area', 'btn-print-voucher',
  'btn-close-voucher', 'voucher-code-display', 'voucher-expiry-date',
  'announcement-banner', 'owner-drawer-toggle', 'owner-drawer', 'owner-pin-input',
  'btn-owner-unlock', 'owner-panel-content', 'owner-labor-rate-input',
  'owner-supplies-cap-input', 'owner-banner-text-input', 'btn-owner-save',
  'btn-owner-export-csv', 'owner-status-feedback'
];

test('index.html contains every required Phase 3 DOM ID verbatim', function () {
  PHASE3_REQUIRED_IDS.forEach(function (id) {
    assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1,
      'index.html is missing required Phase 3 DOM ID: #' + id);
  });
  assert.strictEqual(PHASE3_REQUIRED_IDS.length, 26);
});

test('the print-estimate trigger lives inside the live estimate summary card', function () {
  var cardAt = INDEX_HTML.indexOf('id="estimate-summary-card"');
  var btnAt = INDEX_HTML.indexOf('id="btn-print-estimate"');
  assert.ok(cardAt !== -1 && btnAt !== -1, 'both the card and the trigger must exist');
  assert.ok(btnAt > cardAt, '#btn-print-estimate must sit inside #estimate-summary-card');
  var cardEnd = INDEX_HTML.indexOf('</aside>', cardAt);
  assert.ok(btnAt < cardEnd, '#btn-print-estimate must sit inside the card markup');
});

test('the JSON-LD SEO script tag exists with the exact type and id', function () {
  assert.ok(INDEX_HTML.indexOf('<script type="application/ld+json" id="seo-schema-json">') !== -1,
    'the seo-schema-json ld+json script tag must exist verbatim');
});

test('the embedded JSON-LD payload parses via JSON.parse without error', function () {
  var match = /<script type="application\/ld\+json" id="seo-schema-json">([\s\S]*?)<\/script>/.exec(INDEX_HTML);
  assert.ok(match, 'the JSON-LD script block must be extractable');
  JSON.parse(match[1]);
});

test('the JSON-LD payload is the AutoRepair entity for Revolutions Automotive', function () {
  var payload = JSON.parse(/<script type="application\/ld\+json" id="seo-schema-json">([\s\S]*?)<\/script>/.exec(INDEX_HTML)[1]);
  assert.strictEqual(payload['@context'], 'https://schema.org');
  assert.strictEqual(payload['@type'], 'AutoRepair');
  assert.strictEqual(payload.name, 'Revolutions Automotive');
  assert.strictEqual(payload.telephone, '+1-905-846-8351');
  assert.strictEqual(payload.priceRange, '$$');
});

test('the JSON-LD payload carries the full Brampton postal address', function () {
  var payload = JSON.parse(/<script type="application\/ld\+json" id="seo-schema-json">([\s\S]*?)<\/script>/.exec(INDEX_HTML)[1]);
  assert.strictEqual(payload.address['@type'], 'PostalAddress');
  assert.strictEqual(payload.address.streetAddress, '1-15A Fisherman Dr');
  assert.strictEqual(payload.address.addressLocality, 'Brampton');
  assert.strictEqual(payload.address.addressRegion, 'ON');
  assert.strictEqual(payload.address.postalCode, 'L7A 1B7');
  assert.strictEqual(payload.address.addressCountry, 'CA');
});

test('the JSON-LD payload carries the Brampton geo-coordinates and hours', function () {
  var payload = JSON.parse(/<script type="application\/ld\+json" id="seo-schema-json">([\s\S]*?)<\/script>/.exec(INDEX_HTML)[1]);
  assert.strictEqual(payload.geo['@type'], 'GeoCoordinates');
  assert.strictEqual(payload.geo.latitude, 43.7196);
  assert.strictEqual(payload.geo.longitude, -79.7946);
  assert.strictEqual(payload.openingHoursSpecification.length, 2);
  assert.strictEqual(payload.openingHoursSpecification[0].opens, '08:00');
  assert.strictEqual(payload.openingHoursSpecification[0].closes, '18:00');
  assert.strictEqual(payload.openingHoursSpecification[1].opens, '08:30');
  assert.strictEqual(payload.openingHoursSpecification[1].closes, '15:00');
});

test('the JSON-LD offer catalog lists all 12 engine services', function () {
  var payload = JSON.parse(/<script type="application\/ld\+json" id="seo-schema-json">([\s\S]*?)<\/script>/.exec(INDEX_HTML)[1]);
  var offers = payload.hasOfferCatalog.itemListElement;
  assert.strictEqual(offers.length, 12);
  var identifiers = offers.map(function (o) { return o.itemOffered.identifier; });
  Engine.SERVICE_CATALOG.forEach(function (svc) {
    assert.ok(identifiers.indexOf(svc.id) !== -1, 'JSON-LD catalog must expose ' + svc.id);
  });
});

test('the embedded JSON-LD payload matches SEO_SCHEMA_DATA from the engine', function () {
  var payload = JSON.parse(/<script type="application\/ld\+json" id="seo-schema-json">([\s\S]*?)<\/script>/.exec(INDEX_HTML)[1]);
  assert.deepStrictEqual(payload.address, Engine.SEO_SCHEMA_DATA.address);
  assert.deepStrictEqual(payload.geo, Engine.SEO_SCHEMA_DATA.geo);
  assert.deepStrictEqual(payload.openingHoursSpecification, Engine.SEO_SCHEMA_DATA.openingHoursSpecification);
  assert.strictEqual(payload.telephone, Engine.SEO_SCHEMA_DATA.telephone);
});

test('styles.css declares a print media block that isolates the voucher sheet', function () {
  assert.ok(STYLES_CSS.indexOf('@media print') !== -1, 'styles.css must contain @media print');
  var printBlock = STYLES_CSS.slice(STYLES_CSS.indexOf('@media print'));
  assert.ok(printBlock.indexOf('#voucher-print-area') !== -1,
    'the print block must style #voucher-print-area');
  assert.ok(printBlock.indexOf('width: 100%') !== -1,
    'the print block must expand the voucher sheet to full width');
});

test('the print block hides site chrome, interactive sections and the owner drawer', function () {
  var printBlock = STYLES_CSS.slice(STYLES_CSS.indexOf('@media print'));
  ['.site-header', '.quick-nav', '.site-footer', '#owner-drawer', '#tire-calc-section',
    '#wizard-section', '#safety-precheck-section', '#bay-tracker-section',
    '.voucher-modal-actions', 'display: none'
  ].forEach(function (selector) {
    assert.ok(printBlock.indexOf(selector) !== -1,
      'the print block must reference ' + selector);
  });
});

test('styles.css styles the fitment badge with safe and caution variants', function () {
  assert.ok(STYLES_CSS.indexOf('.fitment-badge') !== -1);
  assert.ok(STYLES_CSS.indexOf('.fitment-badge.is-safe') !== -1);
  assert.ok(STYLES_CSS.indexOf('.fitment-badge.is-caution') !== -1);
});

test('styles.css styles the slide-out owner config drawer and status feedback', function () {
  assert.ok(STYLES_CSS.indexOf('.owner-drawer') !== -1);
  assert.ok(STYLES_CSS.indexOf('.owner-status-feedback') !== -1);
  assert.ok(STYLES_CSS.indexOf('.announcement-banner') !== -1);
  assert.ok(STYLES_CSS.indexOf('.tire-calc-panel') !== -1);
  assert.ok(STYLES_CSS.indexOf('.voucher-sheet') !== -1);
});

test('the voucher modal and owner drawer are hidden by default', function () {
  var modalAt = INDEX_HTML.indexOf('id="voucher-modal"');
  assert.ok(modalAt !== -1);
  assert.ok(INDEX_HTML.slice(modalAt - 200, modalAt + 200).indexOf('hidden') !== -1,
    '#voucher-modal must carry the hidden attribute');
  var drawerAt = INDEX_HTML.indexOf('id="owner-drawer"');
  assert.ok(drawerAt !== -1);
  assert.ok(INDEX_HTML.slice(drawerAt - 200, drawerAt + 200).indexOf('hidden') !== -1,
    '#owner-drawer must carry the hidden attribute');
  assert.ok(INDEX_HTML.indexOf('id="owner-panel-content"') !== -1 &&
    INDEX_HTML.slice(INDEX_HTML.indexOf('id="owner-panel-content"') - 100,
      INDEX_HTML.indexOf('id="owner-panel-content"') + 100).indexOf('hidden') !== -1,
    '#owner-panel-content must be locked behind the hidden attribute until unlocked');
});

test('the printable voucher sheet carries shop branding, code and expiry slots', function () {
  var sheetStart = INDEX_HTML.indexOf('id="voucher-print-area"');
  var sheet = INDEX_HTML.slice(sheetStart, INDEX_HTML.indexOf('</article>', sheetStart));
  assert.ok(sheet.indexOf('Revolutions Automotive') !== -1, 'sheet must show the shop name');
  assert.ok(sheet.indexOf('Brampton') !== -1, 'sheet must show the shop city');
  assert.ok(sheet.indexOf('(905) 846-8351') !== -1, 'sheet must show the shop phone');
  assert.ok(sheet.indexOf('id="voucher-code-display"') !== -1);
  assert.ok(sheet.indexOf('id="voucher-expiry-date"') !== -1);
  assert.ok(sheet.indexOf('HST (13%)') !== -1, 'sheet must show the Ontario HST line');
  assert.ok(sheet.indexOf('voucher-disclaimer') !== -1, 'sheet must include the disclaimer block');
});

test('the owner drawer inputs use secure and correctly defaulted controls', function () {
  assert.ok(INDEX_HTML.indexOf('type="password" id="owner-pin-input"') !== -1,
    'the PIN input must be masked');
  assert.ok(INDEX_HTML.indexOf('id="owner-pin-input" maxlength="8"') !== -1 ||
    INDEX_HTML.indexOf('maxlength="8" id="owner-pin-input"') !== -1,
    'the PIN input must cap entry at 8 characters');
  assert.ok(INDEX_HTML.indexOf('id="owner-labor-rate-input"') !== -1);
  assert.ok(INDEX_HTML.indexOf('value="130.00"') !== -1, 'labor rate defaults to $130.00');
  assert.ok(INDEX_HTML.indexOf('value="35.00"') !== -1, 'supplies cap defaults to $35.00');
  assert.ok(INDEX_HTML.indexOf('id="owner-supplies-cap-input"') !== -1);
  assert.ok(INDEX_HTML.indexOf('id="owner-banner-text-input"') !== -1);
});

test('the tire calculator ships OEM defaults and a quick-nav anchor', function () {
  assert.ok(INDEX_HTML.indexOf('id="tire-input-current"') !== -1 &&
    INDEX_HTML.indexOf('value="205/55R16"') !== -1, 'current size defaults to 205/55R16');
  assert.ok(INDEX_HTML.indexOf('id="tire-input-target"') !== -1 &&
    INDEX_HTML.indexOf('value="225/45R17"') !== -1, 'target size defaults to 225/45R17');
  assert.ok(INDEX_HTML.indexOf('href="#tire-calc-section"') !== -1,
    'the quick-nav must anchor the tire calculator section');
  assert.ok(INDEX_HTML.indexOf('Brampton Drivers: Book Winter Tire Changeovers') !== -1,
    'the announcement banner must ship its default Brampton message');
});

/* ================================================================== */
/* Phase 3 - Segment 3: Controller wiring & anti-drift tests          */
/* ================================================================== */

group('Phase 3 - Segment 3 Controller & Anti-Drift Tests');

test('anti-drift: every DOM ID referenced in app.js exists verbatim in index.html', function () {
  var ids = [];
  var reGetById = /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  var reQueryId = /querySelector(?:All)?\(\s*['"]#([A-Za-z0-9_-]+)['"]\s*\)/g;
  var match;
  while ((match = reGetById.exec(APP_JS)) !== null) ids.push(match[1]);
  while ((match = reQueryId.exec(APP_JS)) !== null) ids.push(match[1]);
  assert.ok(ids.length >= 60, 'expected at least 60 DOM references in app.js, found ' + ids.length);
  ids.forEach(function (id) {
    assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1,
      'app.js references missing DOM ID: #' + id);
  });
});

test('all 24 interactive Phase 3 DOM IDs are wired inside app.js', function () {
  [
    'tire-input-current', 'tire-input-target', 'btn-calc-tires',
    'tire-comparison-results', 'tire-speedo-diff', 'tire-fitment-badge',
    'btn-print-estimate', 'voucher-modal', 'voucher-print-area',
    'voucher-code-display', 'voucher-expiry-date', 'btn-print-voucher',
    'btn-close-voucher', 'owner-drawer-toggle', 'owner-drawer',
    'owner-pin-input', 'btn-owner-unlock', 'owner-panel-content',
    'owner-labor-rate-input', 'owner-supplies-cap-input',
    'owner-banner-text-input', 'btn-owner-save', 'btn-owner-export-csv',
    'owner-status-feedback'
  ].forEach(function (id) {
    assert.ok(APP_JS.indexOf(id) !== -1, 'app.js must wire #' + id);
  });
});

test('app.js integrates the full Phase 3 engine API surface', function () {
  [
    'parseTireSize',
    'compareTireSizes',
    'generateVoucherData',
    'exportBookingsToCsv',
    'validateOwnerPin',
    'TIER_CONFIG_DEFAULTS',
    'window.print'
  ].forEach(function (symbol) {
    assert.ok(APP_JS.indexOf(symbol) !== -1,
      'app.js must invoke the engine function ' + symbol);
  });
});

test('owner config persists under the canonical state key with CSV download support', function () {
  [
    'ownerConfig',
    'revolutions_automotive_state_v1',
    'revolutions_automotive_bookings.csv',
    'window.Blob',
    'text/csv;charset=utf-8;',
    'createObjectURL'
  ].forEach(function (symbol) {
    assert.ok(APP_JS.indexOf(symbol) !== -1,
      'app.js must persist/export via ' + symbol);
  });
});

test('exportBookingsToCsv emits the 15-column header and RFC-4180 escaping at runtime', function () {
  var HEADER = 'Work Order Code,Customer Name,Phone,Vehicle Year,Vehicle Make,Vehicle Model,Origin,Class,Date,Time,Mode,Status,Total Low,Total High,Services';
  var csv = Engine.exportBookingsToCsv([
    { code: 'REV-9001', customerName: 'Chan, Wei', vehicleModel: 'Civic\nSi', serviceIds: ['tir_mount_balance', 'tir_align_4whl'] },
    { code: 'REV-9002', customerName: 'O"Brien', totalLow: 12.5, totalHigh: 20 }
  ]);
  assert.ok(csv.indexOf(HEADER) === 0, 'CSV must start with the standard 15-column header');
  assert.ok(csv.indexOf('"Chan, Wei"') !== -1, 'comma fields must be quoted');
  assert.ok(csv.indexOf('"Civic\nSi"') !== -1, 'multiline fields must stay quoted on one row');
  assert.ok(csv.indexOf('"O""Brien"') !== -1, 'embedded quotes must be doubled');
  assert.ok(csv.indexOf('tir_mount_balance; tir_align_4whl') !== -1,
    'service lists join with semicolons without forced quoting');
  var lines = csv.split('\r\n');
  assert.strictEqual(lines.length, 4, 'header + 2 data rows + trailing CRLF');
  assert.ok(lines[1].indexOf('BOOKED') !== -1, 'missing status defaults to BOOKED');
});

test('the voucher modal populates every printable slot and guards empty estimates', function () {
  assert.ok(APP_JS.indexOf('select at least one service') !== -1,
    'printing without services must alert the customer');
  [
    'voucher-code-display', 'voucher-expiry-date', 'voucher-line-items',
    'voucher-supplies', 'voucher-subtotal', 'voucher-hst', 'voucher-total',
    'voucher-print-area'
  ].forEach(function (id) {
    assert.ok(APP_JS.indexOf(id) !== -1, 'app.js must populate #' + id);
    assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1,
      'index.html must define #' + id + ' verbatim');
  });
});

test('the native print trigger is guarded and close restores the hidden modal', function () {
  assert.ok(APP_JS.indexOf('typeof window.print') !== -1,
    'window.print must be guarded before invocation');
  assert.ok(APP_JS.indexOf('modal.hidden = true') !== -1,
    'closing must hide #voucher-modal');
  assert.ok(APP_JS.indexOf('modal.hidden = false') !== -1,
    'opening must unhide #voucher-modal');
});

test('the tire calculator renders safe and caution fitment badges with format hints', function () {
  [
    'OEM FITMENT SAFE', 'FITMENT CAUTION', 'is-safe', 'is-caution',
    'Please enter standard metric sizes like 205/55R16',
    'Speedometer reads', 'actual speed is faster'
  ].forEach(function (fragment) {
    assert.ok(APP_JS.indexOf(fragment) !== -1,
      'tire calculator must render: ' + fragment);
  });
  assert.ok(APP_JS.indexOf("'change', runComparison") !== -1,
    'tire inputs must recalculate on change');
});

test('the announcement banner initializes from the tier config defaults', function () {
  assert.ok(APP_JS.indexOf('announcement-banner-text') !== -1,
    'app.js must update the banner text slot');
  assert.ok(APP_JS.indexOf('TIER_CONFIG_DEFAULTS.bannerText') !== -1,
    'banner fallback must come from the engine tier config');
  assert.ok(INDEX_HTML.indexOf('id="announcement-banner-text"') !== -1,
    'index.html must define the banner text slot');
});

test('the owner drawer toggles with aria state and unlocks via the engine PIN gate', function () {
  [
    'aria-expanded', 'owner-drawer-toggle', 'owner-pin-input',
    'validateOwnerPin', 'Admin Unlocked', 'Invalid PIN. Contact shop administrator.'
  ].forEach(function (fragment) {
    assert.ok(APP_JS.indexOf(fragment) !== -1,
      'owner drawer must implement: ' + fragment);
  });
});

test('owner overrides re-run the live estimate and persist on save', function () {
  [
    'ownerAdjustedEstimate',
    'owner-labor-rate-input', 'owner-supplies-cap-input', 'owner-banner-text-input',
    'recalculateAndRenderEstimate',
    'Labor rate must be greater than $0.00 CAD/hr.',
    'Configuration saved. Live estimates and announcement banner updated.'
  ].forEach(function (fragment) {
    assert.ok(APP_JS.indexOf(fragment) !== -1,
      'owner save flow must include: ' + fragment);
  });
});

test('the CSV export gathers confirmed bookings, live work orders and seed orders', function () {
  assert.ok(APP_JS.indexOf('lastConfirmedBooking') !== -1,
    'export must include the last confirmed booking');
  assert.ok(APP_JS.indexOf('SEED_WORK_ORDERS') !== -1,
    'export must include the seed work orders');
  assert.ok(APP_JS.indexOf('state.workOrders') !== -1,
    'export must include user-created work orders');
});

/* ================================================================== */
/* Phase 4: Page extraction, clear controls & multi-sensory feedback  */
/* ================================================================== */

group('Phase 4 - Page Extraction & Feedback');

var TRACK_HTML = fs.readFileSync('track.html', 'utf8');
var SAFETY_HTML = fs.readFileSync('safety.html', 'utf8');

test('track.html exists and is a valid standalone HTML document', function () {
  assert.ok(TRACK_HTML.length > 500, 'track.html is only ' + TRACK_HTML.length + ' chars');
  assert.ok(TRACK_HTML.indexOf('<!DOCTYPE html>') !== -1, 'track.html must declare doctype');
  assert.ok(TRACK_HTML.indexOf('Revolutions Automotive') !== -1, 'track.html must carry the brand');
});

test('track.html links styles.css and loads the engine before app.js', function () {
  assert.ok(TRACK_HTML.indexOf('styles.css') !== -1, 'track.html must reference styles.css');
  var engineAt = TRACK_HTML.indexOf('<script src="revolutions_engine.js"></script>');
  var appAt = TRACK_HTML.indexOf('<script src="app.js"></script>');
  var bodyAt = TRACK_HTML.indexOf('</body>');
  assert.ok(engineAt !== -1, 'track.html must link the engine');
  assert.ok(appAt !== -1, 'track.html must link app.js');
  assert.ok(engineAt < appAt && appAt < bodyAt, 'engine must load before app.js before </body>');
});

test('track.html carries the full bay tracker ID contract including the clear control', function () {
  [
    'tracker-input-code', 'tracker-input-phone', 'btn-track-vehicle',
    'btn-track-clear', 'btn-track-sample-1', 'btn-track-sample-2',
    'tracker-status-timeline', 'tracker-technician-notes', 'tracker-feedback'
  ].forEach(function (id) {
    assert.ok(TRACK_HTML.indexOf('id="' + id + '"') !== -1,
      'track.html must define #' + id + ' verbatim');
  });
});

test('track.html ships the 6-stage timeline, home nav, shop hours and direct call button', function () {
  var timelineStart = TRACK_HTML.indexOf('id="tracker-status-timeline"');
  var timelineEnd = TRACK_HTML.indexOf('</ol>', timelineStart);
  assert.ok(timelineStart !== -1 && timelineEnd !== -1, 'timeline list required');
  var timelineHtml = TRACK_HTML.slice(timelineStart, timelineEnd);
  ['Checked In', 'Inspection &amp; Diagnostics', 'Parts Ordered',
    'In Bay / Repairing', 'Quality &amp; Alignment', 'Ready for Pickup'].forEach(function (label) {
    assert.ok(timelineHtml.indexOf(label) !== -1, 'timeline stage missing: ' + label);
  });
  assert.strictEqual((timelineHtml.match(/<li class="tl-step">/g) || []).length, 6,
    'track.html must render exactly 6 stage steps');
  assert.ok(TRACK_HTML.indexOf('href="index.html"') !== -1, 'header nav must link back to Home');
  assert.ok(TRACK_HTML.indexOf('href="tel:+19058468351"') !== -1, 'direct call button required');
  assert.ok(TRACK_HTML.indexOf('Mon&ndash;Fri: 8:00 AM &ndash; 6:00 PM') !== -1,
    'shop hours must be listed');
  assert.ok(TRACK_HTML.indexOf('track.html?code=REV-2048') !== -1,
    'the URL parameter deep-link pattern must be documented');
});

test('safety.html exists and is a valid standalone HTML document', function () {
  assert.ok(SAFETY_HTML.length > 500, 'safety.html is only ' + SAFETY_HTML.length + ' chars');
  assert.ok(SAFETY_HTML.indexOf('<!DOCTYPE html>') !== -1, 'safety.html must declare doctype');
  assert.ok(SAFETY_HTML.indexOf('Revolutions Automotive') !== -1, 'safety.html must carry the brand');
});

test('safety.html links styles.css and loads the engine before app.js', function () {
  assert.ok(SAFETY_HTML.indexOf('styles.css') !== -1, 'safety.html must reference styles.css');
  var engineAt = SAFETY_HTML.indexOf('<script src="revolutions_engine.js"></script>');
  var appAt = SAFETY_HTML.indexOf('<script src="app.js"></script>');
  var bodyAt = SAFETY_HTML.indexOf('</body>');
  assert.ok(engineAt !== -1 && appAt !== -1, 'engine and controller scripts required');
  assert.ok(engineAt < appAt && appAt < bodyAt, 'engine must load before app.js before </body>');
});

test('safety.html carries the MTO checklist, gauge, alert and all three action buttons', function () {
  [
    'safety-checklist-container', 'safety-score-gauge', 'safety-summary-alert',
    'btn-safety-book-inspection', 'btn-safety-reset', 'btn-safety-cancel'
  ].forEach(function (id) {
    assert.ok(SAFETY_HTML.indexOf('id="' + id + '"') !== -1,
      'safety.html must define #' + id + ' verbatim');
  });
  assert.ok(SAFETY_HTML.indexOf('href="index.html"') !== -1, 'must link back to Home');
  assert.ok(SAFETY_HTML.indexOf('assets/safety_badge.jpg') !== -1,
    'the safety badge asset must be featured');
  assert.ok(SAFETY_HTML.indexOf('Book Official MTO Safety Inspection') !== -1,
    'the book CTA label must match the index contract');
});

test('index.html defines the Phase 4 clear controls and the toast element', function () {
  ['btn-clear-symptoms', 'btn-clear-services', 'btn-track-clear', 'toast-notification']
    .forEach(function (id) {
      assert.ok(INDEX_HTML.indexOf('id="' + id + '"') !== -1,
        'index.html must define #' + id + ' verbatim');
    });
  assert.ok(INDEX_HTML.indexOf('Clear All Symptoms') !== -1,
    'the symptom clear button must be labelled');
  assert.ok(INDEX_HTML.indexOf('Clear Selected Services') !== -1,
    'the services clear button must be labelled');
});

test('index.html links the dedicated pages and retains hidden legacy panels', function () {
  assert.ok(INDEX_HTML.indexOf('href="track.html"') !== -1, 'tracker banner must link track.html');
  assert.ok(INDEX_HTML.indexOf('href="safety.html"') !== -1, 'safety CTA must link safety.html');
  assert.ok(INDEX_HTML.indexOf('Live Bay Status on Fisherman Dr') !== -1,
    'the tracker banner must carry the Fisherman Dr CTA copy');
  assert.ok(INDEX_HTML.indexOf('Launch Interactive MTO Pre-Check') !== -1,
    'the safety showcase must carry the MTO Pre-Check CTA copy');
  assert.ok(INDEX_HTML.indexOf('class="tracker-panel" hidden') !== -1,
    'the legacy tracker panel must stay hidden but present');
  assert.ok(INDEX_HTML.indexOf('class="safety-layout" hidden') !== -1,
    'the legacy safety layout must stay hidden but present');
});

test('app.js wires the clear controls, safety reset/cancel and page-aware guards', function () {
  ['btn-clear-symptoms', 'btn-clear-services', 'btn-track-clear',
    'btn-safety-reset', 'btn-safety-cancel', 'toast-notification'
  ].forEach(function (id) {
    assert.ok(APP_JS.indexOf(id) !== -1, 'app.js must wire #' + id);
  });
  ['clearAllSymptoms', 'clearSelectedServices', 'clearTrackerPanel',
    'resetSafetyChecklist', 'trackFromUrl'
  ].forEach(function (fn) {
    assert.ok(APP_JS.indexOf(fn) !== -1, 'app.js must implement ' + fn);
  });
  assert.ok(APP_JS.indexOf("getElementById('service-grid')") !== -1,
    'page-aware guards must probe for the service grid');
  assert.ok(APP_JS.indexOf("getElementById('booking-feedback')") !== -1,
    'page-aware guards must probe for the booking feedback box');
});

test('app.js plays the 587-880 Hz Web Audio chime and toasts the add-service feedback', function () {
  ['AudioContext', '587', '880', 'playAddServiceChime', 'notifyAddedServices',
    'est-highlight-pulse', 'Recommended Service', 'to Estimate!'
  ].forEach(function (token) {
    assert.ok(APP_JS.indexOf(token) !== -1, 'add-service feedback must include: ' + token);
  });
  assert.ok(APP_JS.indexOf('toast.classList') !== -1,
    'the toast visibility class must be toggled');
});

test('app.js supports track.html URL parameters and cross-page safety booking', function () {
  assert.ok(APP_JS.indexOf('URLSearchParams') !== -1,
    'URL query parsing must use URLSearchParams');
  assert.ok(APP_JS.indexOf('track.html?code=') !== -1,
    'the booking-to-tracker bridge must deep-link track.html with the code');
  assert.ok(APP_JS.indexOf('index.html#booking-form') !== -1,
    'the safety book CTA must redirect to the homepage booking form');
  assert.ok(APP_JS.indexOf('mto_safety_exhaust') !== -1,
    'the safety book CTA must pre-select the MTO inspection service');
});

test('styles.css ships the toast, estimate pulse and dedicated-page banner styles', function () {
  ['.toast-notification', '.toast-notification.is-visible', '.est-highlight-pulse',
    '@keyframes estimate-pulse', '.tracker-banner-card', '.safety-banner-card',
    '.safety-actions', '.tracker-shop-card'
  ].forEach(function (selector) {
    assert.ok(STYLES_CSS.indexOf(selector) !== -1, 'styles.css missing: ' + selector);
  });
  assert.ok(STYLES_CSS.indexOf('[hidden] { display: none !important; }') !== -1,
    'the hidden attribute must override author display rules');
});

test('anti-drift: every DOM ID referenced in app.js exists in at least one page', function () {
  var pages = [INDEX_HTML, TRACK_HTML, SAFETY_HTML];
  var ids = [];
  var reGetById = /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  var reQueryId = /querySelector(?:All)?\(\s*['"]#([A-Za-z0-9_-]+)['"]\s*\)/g;
  var match;
  while ((match = reGetById.exec(APP_JS)) !== null) ids.push(match[1]);
  while ((match = reQueryId.exec(APP_JS)) !== null) ids.push(match[1]);
  assert.ok(ids.length >= 60, 'expected at least 60 DOM references in app.js, found ' + ids.length);
  ids.forEach(function (id) {
    var found = pages.some(function (html) {
      return html.indexOf('id="' + id + '"') !== -1;
    });
    assert.ok(found, 'app.js references DOM ID missing from all pages: #' + id);
  });
});

test('anti-drift: every tracker-page ID in app.js exists verbatim in track.html', function () {
  var trackerIds = [
    'tracker-input-code', 'tracker-input-phone', 'btn-track-vehicle',
    'btn-track-clear', 'btn-track-sample-1', 'btn-track-sample-2',
    'tracker-status-timeline', 'tracker-technician-notes', 'tracker-feedback'
  ];
  trackerIds.forEach(function (id) {
    assert.ok(TRACK_HTML.indexOf('id="' + id + '"') !== -1,
      'track.html is missing tracker ID: #' + id);
  });
});

test('anti-drift: every safety-page ID in app.js exists verbatim in safety.html', function () {
  var safetyIds = [
    'safety-checklist-container', 'safety-score-gauge', 'safety-summary-alert',
    'btn-safety-book-inspection', 'btn-safety-reset', 'btn-safety-cancel'
  ];
  safetyIds.forEach(function (id) {
    assert.ok(SAFETY_HTML.indexOf('id="' + id + '"') !== -1,
      'safety.html is missing safety ID: #' + id);
  });
});

test('simulation: clearing state resets the engine estimate to a zeroed card', function () {
  var cleared = Engine.calculateEstimate({ serviceIds: [], origin: 'asian_import', vehicleClass: 'suv' });
  assert.strictEqual(cleared.serviceCount, 0);
  assert.strictEqual(cleared.partsLow, 0);
  assert.strictEqual(cleared.laborLow, 0);
  assert.strictEqual(cleared.subtotalLow, 0);
  assert.strictEqual(cleared.hstLow, 0);
  assert.strictEqual(cleared.totalLow, 0);
  assert.strictEqual(cleared.totalHigh, 0);
  assert.ok(cleared.comboDiscountRate === 0, 'no combo discount with an empty selection');
});

/* ================================================================== */
/* Phase 5: PIPEDA privacy redaction on the public bay tracker        */
/* ================================================================== */

group('Phase 5 - Privacy Redaction (PIPEDA)');

test('maskCustomerName formats first name plus last-name initial', function () {
  assert.strictEqual(Engine.maskCustomerName('Priya Grewal'), 'Priya G.');
  assert.strictEqual(Engine.maskCustomerName('Marcus Vance'), 'Marcus V.');
  assert.strictEqual(Engine.maskCustomerName('  Don   Miller '), 'Don M.');
  assert.strictEqual(Engine.maskCustomerName('Mary Jane Watson'), 'Mary W.');
  assert.strictEqual(Engine.maskCustomerName('Madonna'), 'Madonna');
});

test('maskCustomerName falls back to Customer Vehicle for empty or invalid input', function () {
  assert.strictEqual(Engine.maskCustomerName(''), 'Customer Vehicle');
  assert.strictEqual(Engine.maskCustomerName('   '), 'Customer Vehicle');
  assert.strictEqual(Engine.maskCustomerName(null), 'Customer Vehicle');
  assert.strictEqual(Engine.maskCustomerName(undefined), 'Customer Vehicle');
  assert.strictEqual(Engine.maskCustomerName(42), 'Customer Vehicle');
});

test('maskLicensePlate masks leading letters and keeps trailing identifiers', function () {
  assert.strictEqual(Engine.maskLicensePlate('CJKD 905'), '*** 905');
  assert.strictEqual(Engine.maskLicensePlate('CJDK 905'), '*** 905');
  assert.strictEqual(Engine.maskLicensePlate('BVXK 482'), '*** 482');
  assert.strictEqual(Engine.maskLicensePlate('bvxk 482'), '*** 482');
  assert.strictEqual(Engine.maskLicensePlate('DTRM 118'), '*** 118');
  assert.strictEqual(Engine.maskLicensePlate('SIMB-177'), '***-177');
  assert.strictEqual(Engine.maskLicensePlate('482'), '482');
  assert.strictEqual(Engine.maskLicensePlate(''), '\u2014');
  assert.strictEqual(Engine.maskLicensePlate(null), '\u2014');
});

test('maskPhoneNumber keeps only the last four digits', function () {
  assert.strictEqual(Engine.maskPhoneNumber('(905) 555-0192'), '***-***-0192');
  assert.strictEqual(Engine.maskPhoneNumber('905-555-0192'), '***-***-0192');
  assert.strictEqual(Engine.maskPhoneNumber('9055550192'), '***-***-0192');
  assert.strictEqual(Engine.maskPhoneNumber('0148'), '***-***-0148');
  assert.strictEqual(Engine.maskPhoneNumber(''), '***');
  assert.strictEqual(Engine.maskPhoneNumber(null), '***');
});

test('unauthenticated lookupWorkOrder returns a sanitized public view', function () {
  var view = Engine.lookupWorkOrder('REV-3105');
  assert.strictEqual(view.code, 'REV-3105');
  assert.strictEqual(view.customerName, 'Priya G.');
  assert.strictEqual(view.licensePlate, '*** 905');
  assert.strictEqual(view.phone, '***-***-0192');
  assert.strictEqual(view.estimatedTotal, null,
    'financial invoice totals must be omitted from the public view');
  assert.strictEqual(view.sanitized, true);
  assert.strictEqual(view.currentState, 'PARTS_ORDERED',
    'operational status stays visible for tracking');
  var serialized = JSON.stringify(view);
  assert.ok(serialized.indexOf('Priya Grewal') === -1,
    'the full customer name must never appear in the public view');
  assert.ok(serialized.indexOf('555-0192') === -1,
    'the unmasked phone number must never appear in the public view');
  assert.ok(serialized.indexOf('CJDK') === -1,
    'the unmasked license plate letters must never appear in the public view');
  assert.ok(serialized.indexOf('1128.6') === -1,
    'the invoice total must never appear in the public view');
});

test('unauthenticated lookups by phone query or bare code are also sanitized', function () {
  var byPhone = Engine.lookupWorkOrder('(905) 555-0192');
  assert.strictEqual(byPhone.customerName, 'Priya G.');
  assert.strictEqual(byPhone.sanitized, true);
  var bareNumber = Engine.lookupWorkOrder(' 2048 ');
  assert.strictEqual(bareNumber.customerName, 'Marcus V.');
  assert.strictEqual(bareNumber.sanitized, true);
  assert.ok(JSON.stringify(bareNumber).indexOf('Marcus Vance') === -1);
});

test('phone-verified lookupWorkOrder still returns the full work order', function () {
  var full = Engine.lookupWorkOrder('REV-2048', 'BVXK 482');
  assert.strictEqual(full.customerName, 'Marcus Vance');
  assert.strictEqual(full.licensePlate, 'BVXK 482');
  assert.strictEqual(full.estimatedTotal, 615.84);
  assert.strictEqual(full.sanitized, undefined,
    'authenticated views must not be flagged as sanitized');
});

test('lookupWorkOrder public view never leaks seed PII across all three seeds', function () {
  ['REV-2048', 'REV-3105', 'REV-4092'].forEach(function (code) {
    var view = Engine.lookupWorkOrder(code);
    assert.strictEqual(view.sanitized, true);
    var serialized = JSON.stringify(view);
    ['Marcus Vance', 'Priya Grewal', 'Elena Rostova',
      'BVXK 482', 'CJDK 905', 'DTRM 118'].forEach(function (leak) {
      assert.ok(serialized.indexOf(leak) === -1,
        code + ' public view must not contain: ' + leak);
    });
  });
});

test('app.js tracker notes render masked PII only', function () {
  ['Engine.maskCustomerName', 'Engine.maskLicensePlate',
    '| Customer: ', '| Plate: '
  ].forEach(function (fragment) {
    assert.ok(APP_JS.indexOf(fragment) !== -1,
      'tracker notes must render: ' + fragment);
  });
  assert.ok(APP_JS.indexOf("typeof workOrder.estimatedTotal === 'number'") !== -1,
    'invoice totals must be guarded so sanitized views omit them');
  ['Marcus Vance', 'Priya Grewal', 'Elena Rostova'].forEach(function (name) {
    assert.ok(APP_JS.indexOf(name) === -1,
      'app.js must never embed the unmasked seed customer name: ' + name);
  });
});

test('app.js routes blank verification through the sanitized public view', function () {
  assert.ok(APP_JS.indexOf('var verification') !== -1,
    'trackVehicle must normalize the phone/plate verification value');
  assert.ok(APP_JS.indexOf('lookupWorkOrder(code, verification') !== -1,
    'trackVehicle must pass the normalized verification to lookupWorkOrder');
  assert.ok(APP_JS.indexOf("phoneOrPlate.trim()) ? phoneOrPlate : null") !== -1,
    'a blank phone/plate field must be treated as an unauthenticated query');
});

test('demo presets are collapsed behind the staff toggle on both tracker surfaces', function () {
  [INDEX_HTML, TRACK_HTML].forEach(function (html) {
    assert.ok(html.indexOf('id="tracker-demo-tools"') !== -1, '#tracker-demo-tools required');
    assert.ok(html.indexOf('id="btn-toggle-demo"') !== -1, '#btn-toggle-demo required');
    assert.ok(html.indexOf('class="tracker-demo-tools is-collapsed"') !== -1,
      'the demo tools must ship collapsed by default');
    assert.ok(html.indexOf('Staff / Demo Presets') !== -1,
      'the toggle must be labelled Staff / Demo Presets');
    assert.ok(html.indexOf('id="btn-track-sample-1"') !== -1,
      'sample button 1 ID must be preserved');
    assert.ok(html.indexOf('id="btn-track-sample-2"') !== -1,
      'sample button 2 ID must be preserved');
  });
});

test('app.js implements the demo toggle and the ?demo=1 auto-open', function () {
  ['bindDemoTools', 'isDemoModeFromUrl', "get('demo') === '1'",
    'is-collapsed', 'aria-expanded', 'aria-controls'
  ].forEach(function (fragment) {
    assert.ok(APP_JS.indexOf(fragment) !== -1,
      'demo tooling must implement: ' + fragment);
  });
});

test('styles.css keeps the demo presets hidden until toggled', function () {
  assert.ok(STYLES_CSS.indexOf('.tracker-demo-tools.is-collapsed .tracker-samples') !== -1,
    'collapsed demo tools must hide the sample buttons');
  assert.ok(STYLES_CSS.indexOf('.tracker-demo-tools') !== -1,
    'the demo tools container must be styled');
});

test('anti-drift: the Phase 5 DOM IDs exist verbatim on every surface that uses them', function () {
  ['tracker-demo-tools', 'btn-toggle-demo'].forEach(function (id) {
    [INDEX_HTML, TRACK_HTML].forEach(function (html) {
      assert.ok(html.indexOf('id="' + id + '"') !== -1,
        'missing Phase 5 DOM ID on a tracker surface: #' + id);
    });
  });
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
