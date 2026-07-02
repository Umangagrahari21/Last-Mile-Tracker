const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all rate cards
router.get('/', auth, async (req, res, next) => {
  try {
    const ratecards = await prisma.rateCard.findMany({
      include: {
        zoneFrom: true,
        zoneTo: true
      }
    });
    res.json(ratecards);
  } catch (error) {
    next(error);
  }
});

// Create rate card (Admin only)
router.post('/', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const { zoneFromId, zoneToId, orderType, ratePerKg, codSurcharge } = req.body;
    if (!zoneFromId || !zoneToId || !orderType || ratePerKg === undefined) {
      return res.status(400).json({ error: 'zoneFromId, zoneToId, orderType, and ratePerKg are required' });
    }
    const ratecard = await prisma.rateCard.create({
      data: {
        zoneFromId,
        zoneToId,
        orderType,
        ratePerKg: parseFloat(ratePerKg),
        codSurcharge: codSurcharge ? parseFloat(codSurcharge) : 0
      }
    });
    res.status(201).json(ratecard);
  } catch (error) {
    next(error);
  }
});

// Update rate card (Admin only)
router.put('/:id', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ratePerKg, codSurcharge } = req.body;
    const ratecard = await prisma.rateCard.update({
      where: { id },
      data: {
        ratePerKg: ratePerKg !== undefined ? parseFloat(ratePerKg) : undefined,
        codSurcharge: codSurcharge !== undefined ? parseFloat(codSurcharge) : undefined
      }
    });
    res.json(ratecard);
  } catch (error) {
    next(error);
  }
});

// Delete rate card (Admin only)
router.delete('/:id', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.rateCard.delete({ where: { id } });
    res.json({ message: 'Rate card deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
