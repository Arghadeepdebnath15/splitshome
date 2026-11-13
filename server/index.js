const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const flatRoutes = require('./routes/flatRoutes');
const taskRoutes = require('./routes/taskRoutes');
const choreCreditRoutes = require('./routes/choreCreditRoutes');
const exchangeRoutes = require('./routes/exchangeRoutes');
const itemDebtRoutes = require('./routes/itemDebtRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB Atlas
connectDB();

// Setup Socket.IO
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

initSocket(io);

// Middleware — open CORS so Vercel frontend can reach Render backend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // handle all preflight requests
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/credits', choreCreditRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/items', itemDebtRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'FlatMate API Server is live and healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`[FlatMate Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
