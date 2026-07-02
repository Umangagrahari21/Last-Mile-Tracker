const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function autoAssign(dropZoneId, orderId) {
  // 1. Find AVAILABLE agent in drop zone
  let agent = await prisma.agent.findFirst({
    where: { status: 'AVAILABLE', currentZoneId: dropZoneId },
    include: { user: true }
  });

  // 2. If none in drop zone, find any AVAILABLE agent
  if (!agent) {
    agent = await prisma.agent.findFirst({
      where: { status: 'AVAILABLE' },
      include: { user: true }
    });
  }

  if (!agent) {
    throw new Error('No available agents');
  }

  // 3. Assign: update Order.agentProfileId and Order.agentId, set Agent.status=BUSY
  await prisma.order.update({
    where: { id: orderId },
    data: {
      agentProfileId: agent.id,
      agentId: agent.userId,
      status: 'ASSIGNED' // Also transition status to ASSIGNED as part of assignment!
    }
  });

  await prisma.agent.update({
    where: { id: agent.id },
    data: { status: 'BUSY' }
  });

  return agent;
}

module.exports = { autoAssign };
