const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields (name, email, password, role) are required' });
    }
    
    // Check role validity (ADMIN registration is restricted for security)
    if (!['CUSTOMER', 'AGENT'].includes(role)) {
      return res.status(400).json({ error: 'Invalid or restricted signup role. Admin accounts cannot be self-registered.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role
      }
    });

    // If role is AGENT, create an Agent profile
    if (role === 'AGENT') {
      await prisma.agent.create({
        data: {
          userId: user.id,
          status: 'AVAILABLE'
        }
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, isAdmin } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const roleToSign = isAdmin ? 'ADMIN' : user.role;
    const token = jwt.sign({ id: user.id, role: roleToSign }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleToSign
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/google-login', async (req, res, next) => {
  try {
    const { credential, role, isAdmin } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    // Verify token with Google's tokeninfo API
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    const response = await fetch(googleVerifyUrl);
    const payload = await response.json();

    if (payload.error || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google credential token. Please try again.' });
    }

    const email = payload.email;
    const name = payload.name || payload.email.split('@')[0];

    let user = await prisma.user.findUnique({ where: { email } });


    if (!user) {
      // If user doesn't exist, we register them
      const targetRole = role || 'CUSTOMER';
      if (!['CUSTOMER', 'AGENT'].includes(targetRole)) {
        return res.status(400).json({ error: 'Invalid or restricted signup role. Admin accounts cannot be self-registered.' });
      }

      // Create new user with a randomized password since they use Google
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          name: name || 'Google User',
          email,
          passwordHash,
          role: targetRole
        }
      });

      // Create profile for Agent if role is AGENT
      if (targetRole === 'AGENT') {
        await prisma.agent.create({
          data: {
            userId: user.id,
            status: 'AVAILABLE'
          }
        });
      }
    }

    // Sign jwt token
    const roleToSign = isAdmin ? 'ADMIN' : user.role;
    const token = jwt.sign({ id: user.id, role: roleToSign }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleToSign
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

