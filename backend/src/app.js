const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS Configuration - handle undefined FRONTEND_URL
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin || 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:') ||
        allowedOrigins.indexOf(origin) !== -1 || 
        allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/zones', require('./routes/zone.routes'));
app.use('/api/ratecards', require('./routes/ratecard.routes'));
app.use('/api/agents', require('./routes/agent.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Global Error Handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
