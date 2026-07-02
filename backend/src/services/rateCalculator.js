const { PrismaClient } = require('@prisma/client');
const { detectZone } = require('./zoneDetector');
const prisma = new PrismaClient();

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

async function calculateRate({
  pickupPincode,
  dropPincode,
  length,
  breadth,
  height,
  actualWeight,
  orderType,
  paymentType
}) {
  // 1. Volumetric weight: (length * breadth * height) / 5000 -> round to 2 decimals
  const volWeightRaw = (length * breadth * height) / 5000;
  const volumetricWeight = round2(volWeightRaw);

  // 2. Billed weight: Math.max(actualWeight, volumetricWeight) -> round to 2 decimals
  const billedWeight = round2(Math.max(actualWeight, volumetricWeight));

  // 3. Zone detection
  const pickupZone = await detectZone(pickupPincode);
  const dropZone = await detectZone(dropPincode);

  if (!pickupZone || !dropZone) {
    throw new Error('Could not resolve pickup or drop zone');
  }

  // 4. Rate card lookup
  const rateCard = await prisma.rateCard.findUnique({
    where: {
      zoneFromId_zoneToId_orderType: {
        zoneFromId: pickupZone.id,
        zoneToId: dropZone.id,
        orderType: orderType
      }
    }
  });

  if (!rateCard) {
    throw new Error(`No rate card found from ${pickupZone.name} to ${dropZone.name} for ${orderType}`);
  }

  // 5. Base charge: billedWeight * rateCard.ratePerKg -> round to 2 decimals
  const baseCharge = round2(billedWeight * rateCard.ratePerKg);

  // 6. COD surcharge: (paymentType === 'COD') ? rateCard.codSurcharge : 0
  const codSurcharge = paymentType === 'COD' ? rateCard.codSurcharge : 0;

  // 7. Total charge: baseCharge + codSurcharge
  const totalCharge = round2(baseCharge + codSurcharge);

  // 8. Return object
  return {
    volumetricWeight,
    billedWeight,
    ratePerKg: rateCard.ratePerKg,
    baseCharge,
    codSurcharge,
    totalCharge,
    pickupZoneId: pickupZone.id,
    dropZoneId: dropZone.id
  };
}

module.exports = { calculateRate };
