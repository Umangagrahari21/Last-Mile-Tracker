const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/admin/dashboard - Metrics
router.get('/dashboard', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const totalOrders = await prisma.order.count();
    const orders = await prisma.order.findMany();
    const agents = await prisma.agent.findMany();

    const statusCounts = {
      CREATED: 0,
      ASSIGNED: 0,
      PICKED_UP: 0,
      IN_TRANSIT: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      FAILED: 0,
      RESCHEDULED: 0
    };

    orders.forEach(o => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
    });

    const agentStatusCounts = {
      AVAILABLE: 0,
      BUSY: 0,
      OFFLINE: 0
    };

    agents.forEach(a => {
      if (agentStatusCounts[a.status] !== undefined) {
        agentStatusCounts[a.status]++;
      }
    });

    // Count orders by drop zone name
    const zones = await prisma.zone.findMany({
      include: {
        _count: {
          select: { dropOrders: true }
        }
      }
    });

    const zoneOrders = zones.map(z => ({
      zoneName: z.name,
      count: z._count.dropOrders
    }));

    res.json({
      totalOrders,
      statusCounts,
      agentStatusCounts,
      zoneOrders
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/customers - List all customers (for admin create order flow)
router.get('/customers', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
