const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detectZone(pincode) {
  const area = await prisma.area.findUnique({
    where: { pincode },
    include: { zone: true }
  });
  if (!area) throw new Error(`No zone found for pincode ${pincode}`);
  return area.zone; // returns { id, name }
}

module.exports = { detectZone };
