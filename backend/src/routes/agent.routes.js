const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/agents - List all agents
router.get('/', auth, async (req, res, next) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        currentZone: true
      }
    });
    res.json(agents);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/agents/location - Update current agent's zone
router.patch('/location', auth, role('AGENT'), async (req, res, next) => {
  try {
    const { currentZoneId } = req.body;
    
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user.id }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent profile not found' });
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: { currentZoneId },
      include: { currentZone: true }
    });

    res.json(updatedAgent);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
