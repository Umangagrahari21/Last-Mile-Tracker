const assert = require('assert');
const Module = require('module');

// Mock data definition first
const mockZones = {
  'Zone-North': { id: 'zone-n', name: 'Zone-North' },
  'Zone-South': { id: 'zone-s', name: 'Zone-South' }
};

const mockAreas = {
  '110001': { pincode: '110001', name: 'North Area', zone: mockZones['Zone-North'] },
  '110004': { pincode: '110004', name: 'South Area', zone: mockZones['Zone-South'] }
};

const mockRateCards = {
  'zone-n_zone-s_B2C': { id: 'rc-1', ratePerKg: 50, codSurcharge: 25 },
  'zone-n_zone-n_B2C': { id: 'rc-2', ratePerKg: 30, codSurcharge: 25 }
};

// Intercept require('@prisma/client') to return mock database operations
const originalRequire = Module.prototype.require;
Module.prototype.require = function (path) {
  if (path === '@prisma/client') {
    class MockPrismaClient {
      constructor() {
        this.area = {
          findUnique: async (args) => {
            const pin = args.where.pincode;
            return mockAreas[pin] || null;
          }
        };
        this.rateCard = {
          findUnique: async (args) => {
            const { zoneFromId, zoneToId, orderType } = args.where.zoneFromId_zoneToId_orderType;
            const key = `${zoneFromId}_${zoneToId}_${orderType}`;
            return mockRateCards[key] || null;
          }
        };
      }
      $disconnect() {}
    }
    return { PrismaClient: MockPrismaClient };
  }
  return originalRequire.apply(this, arguments);
};

console.log('--- STARTING LAST-MILE DELIVERY TRACKER INTEGRATION TESTS ---');

// Import services which will now use the mocked Prisma client
const { calculateRate } = require('../services/rateCalculator');

async function testRateCalculation() {
  console.log('Testing rate calculation logic...');

  // Test 1: Inter-zone, Prepaid, B2C
  // Dimensions: 10x20x30, actualWeight: 5kg, B2C, PREPAID
  const result1 = await calculateRate({
    pickupPincode: '110001',
    dropPincode: '110004',
    length: 10,
    breadth: 20,
    height: 30,
    actualWeight: 5,
    orderType: 'B2C',
    paymentType: 'PREPAID'
  });

  assert.strictEqual(result1.volumetricWeight, 1.2, 'Volumetric weight should be 1.2');
  assert.strictEqual(result1.billedWeight, 5, 'Billed weight should be max of 5 and 1.2 = 5');
  assert.strictEqual(result1.ratePerKg, 50, 'Inter-zone B2C rate should be 50');
  assert.strictEqual(result1.baseCharge, 250, 'Base charge should be 5 * 50 = 250');
  assert.strictEqual(result1.codSurcharge, 0, 'Prepaid should have 0 COD surcharge');
  assert.strictEqual(result1.totalCharge, 250, 'Total charge should be 250');
  console.log('✔ Test 1 passed: Inter-zone Prepaid B2C calculation is correct!');

  // Test 2: Intra-zone, COD, B2C
  // Dimensions: 10x20x30, actualWeight: 1kg, B2C, COD
  const result2 = await calculateRate({
    pickupPincode: '110001',
    dropPincode: '110001',
    length: 10,
    breadth: 20,
    height: 30,
    actualWeight: 1,
    orderType: 'B2C',
    paymentType: 'COD'
  });

  assert.strictEqual(result2.volumetricWeight, 1.2, 'Volumetric weight should be 1.2');
  assert.strictEqual(result2.billedWeight, 1.2, 'Billed weight should be max of 1 and 1.2 = 1.2');
  assert.strictEqual(result2.ratePerKg, 30, 'Intra-zone B2C rate should be 30');
  assert.strictEqual(result2.baseCharge, 36, 'Base charge should be 1.2 * 30 = 36');
  assert.strictEqual(result2.codSurcharge, 25, 'COD should have 25 surcharge');
  assert.strictEqual(result2.totalCharge, 61, 'Total charge should be 61');
  console.log('✔ Test 2 passed: Intra-zone COD B2C calculation is correct!');
}

async function run() {
  try {
    await testRateCalculation();
    console.log('--- ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('❌ Test execution failed:', err);
    process.exit(1);
  }
}

run();
