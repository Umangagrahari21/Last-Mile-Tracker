const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { calculateRate } = require('../services/rateCalculator');
const { autoAssign } = require('../services/agentAssigner');
const { sendStatusEmail } = require('../services/notificationService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to get order with customer details for emailing
async function getOrderWithCustomer(orderId) {
  return await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true }
  });
}

// 1. POST /api/orders/preview - Preview charge
router.post('/preview', auth, async (req, res, next) => {
  try {
    const { pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType } = req.body;
    
    if (!pickupPincode || !dropPincode || !length || !breadth || !height || !actualWeight || !orderType || !paymentType) {
      return res.status(400).json({ error: 'All preview fields are required' });
    }

    const chargeData = await calculateRate({
      pickupPincode,
      dropPincode,
      length: parseFloat(length),
      breadth: parseFloat(breadth),
      height: parseFloat(height),
      actualWeight: parseFloat(actualWeight),
      orderType,
      paymentType
    });

    res.json(chargeData);
  } catch (error) {
    next(error);
  }
});

// 2. POST /api/orders - Create order (CUSTOMER or ADMIN)
router.post('/', auth, role('CUSTOMER', 'ADMIN'), async (req, res, next) => {
  try {
    const {
      pickupPincode,
      dropPincode,
      length,
      breadth,
      height,
      actualWeight,
      orderType,
      paymentType,
      pickupAddress,
      dropAddress,
      customerId
    } = req.body;

    if (!pickupPincode || !dropPincode || !length || !breadth || !height || !actualWeight || !orderType || !paymentType || !pickupAddress || !dropAddress) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Determine target customer
    let targetCustomerId = req.user.id;
    if (req.user.role === 'ADMIN' && customerId) {
      targetCustomerId = customerId;
    }

    // Run rate calculator
    const chargeData = await calculateRate({
      pickupPincode,
      dropPincode,
      length: parseFloat(length),
      breadth: parseFloat(breadth),
      height: parseFloat(height),
      actualWeight: parseFloat(actualWeight),
      orderType,
      paymentType
    });

    // Create Order
    const order = await prisma.order.create({
      data: {
        customerId: targetCustomerId,
        pickupAddress,
        pickupPincode,
        dropAddress,
        dropPincode,
        pickupZoneId: chargeData.pickupZoneId,
        dropZoneId: chargeData.dropZoneId,
        length: parseFloat(length),
        breadth: parseFloat(breadth),
        height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        volumetricWeight: chargeData.volumetricWeight,
        billedWeight: chargeData.billedWeight,
        ratePerKg: chargeData.ratePerKg,
        baseCharge: chargeData.baseCharge,
        codSurcharge: chargeData.codSurcharge,
        totalCharge: chargeData.totalCharge,
        orderType,
        paymentType,
        status: 'CREATED'
      }
    });

    // Create TrackingLog row
    await prisma.trackingLog.create({
      data: {
        orderId: order.id,
        status: 'CREATED',
        actorId: req.user.id,
        note: 'Order registered successfully'
      }
    });

    // Send confirmation email
    const fullOrder = await getOrderWithCustomer(order.id);
    if (fullOrder && fullOrder.customer) {
      await sendStatusEmail(fullOrder.customer.email, fullOrder.customer.name, order.id, 'CREATED');
    }

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// 3. GET /api/orders - Get orders (role aware with optional filters)
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, zoneId, agentId } = req.query;
    
    // Base filters
    const where = {};

    // Role restrictions
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.id;
    } else if (req.user.role === 'AGENT') {
      where.agentId = req.user.id;
    }

    // Optional Query Filters
    if (status) {
      where.status = status;
    }
    if (agentId) {
      where.agentId = agentId;
    }
    if (zoneId) {
      where.OR = [
        { pickupZoneId: zoneId },
        { dropZoneId: zoneId }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
        pickupZone: true,
        dropZone: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// 4. GET /api/orders/:id - Get single order
router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
        pickupZone: true,
        dropZone: true,
        trackingLogs: {
          include: { actor: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        },
        reschedules: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Authorization checks
    if (req.user.role === 'CUSTOMER' && order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'AGENT' && order.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 5. GET /api/orders/:id/tracking - Get tracking logs
router.get('/:id/tracking', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await prisma.trackingLog.findMany({
      where: { orderId: id },
      include: {
        actor: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// 6. POST /api/orders/:id/assign - Manual assign (Admin only)
router.post('/:id/assign', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body; // Can be Agent ID or User ID

    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find agent profile by Agent ID or User ID
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [
          { id: agentId },
          { userId: agentId }
        ]
      },
      include: { user: true }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check transition
    if (order.status !== 'CREATED' && order.status !== 'RESCHEDULED') {
      return res.status(400).json({ error: `Cannot assign order from status ${order.status}` });
    }

    // Assign
    await prisma.order.update({
      where: { id },
      data: {
        agentProfileId: agent.id,
        agentId: agent.userId,
        status: 'ASSIGNED'
      }
    });

    // Mark agent status as BUSY
    await prisma.agent.update({
      where: { id: agent.id },
      data: { status: 'BUSY' }
    });

    // Append TrackingLog
    await prisma.trackingLog.create({
      data: {
        orderId: id,
        status: 'ASSIGNED',
        actorId: req.user.id,
        note: `Manually assigned to agent ${agent.user.name}`
      }
    });

    // Send email
    const fullOrder = await getOrderWithCustomer(id);
    if (fullOrder && fullOrder.customer) {
      await sendStatusEmail(fullOrder.customer.email, fullOrder.customer.name, id, 'ASSIGNED', `Assigned agent: ${agent.user.name}`);
    }

    res.json({ message: 'Order assigned successfully' });
  } catch (error) {
    next(error);
  }
});

// 7. POST /api/orders/:id/auto-assign - Auto assign agent (Admin only)
router.post('/:id/auto-assign', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'CREATED' && order.status !== 'RESCHEDULED') {
      return res.status(400).json({ error: `Cannot auto-assign order from status ${order.status}` });
    }

    const agent = await autoAssign(order.dropZoneId, order.id);

    // Append TrackingLog
    await prisma.trackingLog.create({
      data: {
        orderId: id,
        status: 'ASSIGNED',
        actorId: req.user.id,
        note: `Auto-assigned to agent ${agent.user.name}`
      }
    });

    // Send email
    const fullOrder = await getOrderWithCustomer(id);
    if (fullOrder && fullOrder.customer) {
      await sendStatusEmail(fullOrder.customer.email, fullOrder.customer.name, id, 'ASSIGNED', `Auto-assigned agent: ${agent.user.name}`);
    }

    res.json({ message: 'Order auto-assigned successfully', agentName: agent.user.name });
  } catch (error) {
    next(error);
  }
});

// 8. PATCH /api/orders/:id/status - Status transitions
router.patch('/:id/status', auth, role('AGENT', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, rescheduleDate } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Status Transition Table
    const transitions = {
      CREATED: { allowed: ['ASSIGNED'], who: ['ADMIN'] },
      ASSIGNED: { allowed: ['PICKED_UP'], who: ['AGENT', 'ADMIN'] },
      PICKED_UP: { allowed: ['IN_TRANSIT'], who: ['AGENT', 'ADMIN'] },
      IN_TRANSIT: { allowed: ['OUT_FOR_DELIVERY'], who: ['AGENT', 'ADMIN'] },
      OUT_FOR_DELIVERY: { allowed: ['DELIVERED', 'FAILED'], who: ['AGENT', 'ADMIN'] },
      FAILED: { allowed: ['RESCHEDULED'], who: ['CUSTOMER'] },
      RESCHEDULED: { allowed: ['ASSIGNED'], who: ['ADMIN'] },
      DELIVERED: { allowed: [], who: [] }
    };

    const currentRules = transitions[order.status];
    if (!currentRules.allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid transition from ${order.status} to ${status}` });
    }

    if (!currentRules.who.includes(req.user.role)) {
      return res.status(403).json({ error: `Role ${req.user.role} is not authorized to transition from ${order.status} to ${status}` });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });

    // Tracking Log
    await prisma.trackingLog.create({
      data: {
        orderId: id,
        status,
        actorId: req.user.id,
        note: note || `Status updated to ${status}`
      }
    });

    // Special logic for DELIVERED / FAILED
    if (status === 'DELIVERED') {
      if (order.agentProfileId) {
        await prisma.agent.update({
          where: { id: order.agentProfileId },
          data: { status: 'AVAILABLE' }
        });
      }
    } else if (status === 'FAILED') {
      if (!rescheduleDate) {
        return res.status(400).json({ error: 'rescheduleDate is required when status is FAILED' });
      }

      // Create reschedule record
      await prisma.reschedule.create({
        data: {
          orderId: id,
          newDate: new Date(rescheduleDate),
          reason: note || 'Delivery attempt failed'
        }
      });

      // Free up the agent as this delivery attempt is over
      if (order.agentProfileId) {
        await prisma.agent.update({
          where: { id: order.agentProfileId },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    // Send email
    const fullOrder = await getOrderWithCustomer(id);
    if (fullOrder && fullOrder.customer) {
      await sendStatusEmail(fullOrder.customer.email, fullOrder.customer.name, id, status, note);
    }

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

// 9. POST /api/orders/:id/reschedule - Customer confirms reschedule
router.post('/:id/reschedule', auth, role('CUSTOMER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, reason } = req.body;

    if (!newDate || !reason) {
      return res.status(400).json({ error: 'newDate and reason are required' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Confirm order is currently FAILED
    if (order.status !== 'FAILED') {
      return res.status(400).json({ error: 'Only FAILED orders can be rescheduled' });
    }

    // Update order status to RESCHEDULED and set scheduledDate
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        scheduledDate: new Date(newDate)
      }
    });

    // Create Reschedule record
    await prisma.reschedule.create({
      data: {
        orderId: id,
        newDate: new Date(newDate),
        reason
      }
    });

    // Append TrackingLog for RESCHEDULED
    await prisma.trackingLog.create({
      data: {
        orderId: id,
        status: 'RESCHEDULED',
        actorId: req.user.id,
        note: `Reschedule confirmed for ${new Date(newDate).toLocaleDateString()}: ${reason}`
      }
    });

    // Send email for RESCHEDULED
    const fullOrder = await getOrderWithCustomer(id);
    if (fullOrder && fullOrder.customer) {
      await sendStatusEmail(fullOrder.customer.email, fullOrder.customer.name, id, 'RESCHEDULED', `Rescheduled date: ${newDate}. Reason: ${reason}`);
    }

    // Step 4 of Failed & Reschedule Flow: Auto-assign agent after RESCHEDULED
    let assignedAgent = null;
    try {
      assignedAgent = await autoAssign(order.dropZoneId, order.id);

      // Append TrackingLog for ASSIGNED
      await prisma.trackingLog.create({
        data: {
          orderId: id,
          status: 'ASSIGNED',
          actorId: req.user.id, // Customer actor for this automated transition
          note: `Auto-assigned to agent ${assignedAgent.user.name} after rescheduling`
        }
      });

      // Send email for ASSIGNED
      if (fullOrder && fullOrder.customer) {
        await sendStatusEmail(fullOrder.customer.email, fullOrder.customer.name, id, 'ASSIGNED', `Auto-assigned agent: ${assignedAgent.user.name}`);
      }
    } catch (assignError) {
      console.warn(`[Reschedule Flow] Failed to auto-assign agent: ${assignError.message}`);
    }

    res.json({
      order: updatedOrder,
      autoAssigned: !!assignedAgent,
      agentName: assignedAgent ? assignedAgent.user.name : null
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
