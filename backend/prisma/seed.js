const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  await prisma.reschedule.deleteMany();
  await prisma.trackingLog.deleteMany();
  await prisma.order.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.area.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();

  console.log('Creating zones and areas (pincodes)...');
  const zonesData = [
    { name: 'Zone-North', pincodes: ['110001', '110002', '110003'] },
    { name: 'Zone-South', pincodes: ['110004', '110005', '110006'] },
    { name: 'Zone-East', pincodes: ['110007', '110008', '110009'] },
    { name: 'Zone-West', pincodes: ['110010', '110011', '110012'] }
  ];

  const zones = {};
  for (const z of zonesData) {
    const zone = await prisma.zone.create({
      data: { name: z.name }
    });
    zones[z.name] = zone;

    for (const pin of z.pincodes) {
      await prisma.area.create({
        data: {
          pincode: pin,
          name: `${z.name} Area ${pin}`,
          zoneId: zone.id
        }
      });
    }
  }

  console.log('Creating rate cards for all zone pairs...');
  const zoneList = Object.values(zones);
  for (const fromZone of zoneList) {
    for (const toZone of zoneList) {
      const isIntra = fromZone.id === toZone.id;
      
      // B2C RateCard
      await prisma.rateCard.create({
        data: {
          zoneFromId: fromZone.id,
          zoneToId: toZone.id,
          orderType: 'B2C',
          ratePerKg: isIntra ? 30.0 : 50.0,
          codSurcharge: 25.0
        }
      });

      // B2B RateCard
      await prisma.rateCard.create({
        data: {
          zoneFromId: fromZone.id,
          zoneToId: toZone.id,
          orderType: 'B2B',
          ratePerKg: isIntra ? 20.0 : 35.0,
          codSurcharge: 25.0
        }
      });
    }
  }

  console.log('Creating default Admin user...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@lastmile.com',
      passwordHash: passwordHash,
      role: 'ADMIN'
    }
  });

  console.log('Seed database successfully completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
