const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all zones with areas
router.get('/', auth, async (req, res, next) => {
  try {
    const zones = await prisma.zone.findMany({
      include: { areas: true }
    });
    res.json(zones);
  } catch (error) {
    next(error);
  }
});

// Create zone (Admin only)
router.post('/', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const zone = await prisma.zone.create({
      data: { name }
    });
    res.status(201).json(zone);
  } catch (error) {
    next(error);
  }
});

// Delete zone (Admin only)
router.delete('/:id', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    // Delete areas in zone first
    await prisma.area.deleteMany({ where: { zoneId: id } });
    await prisma.zone.delete({ where: { id } });
    res.json({ message: 'Zone deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add pincode to zone (Admin only)
router.post('/:id/areas', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pincode, name } = req.body;
    if (!pincode || !name) return res.status(400).json({ error: 'Pincode and name are required' });
    const area = await prisma.area.create({
      data: {
        pincode,
        name,
        zoneId: id
      }
    });
    res.status(201).json(area);
  } catch (error) {
    next(error);
  }
});

// Delete pincode/area (Admin only)
router.delete('/areas/:areaId', auth, role('ADMIN'), async (req, res, next) => {
  try {
    const { areaId } = req.params;
    await prisma.area.delete({ where: { id: areaId } });
    res.json({ message: 'Area/pincode removed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
