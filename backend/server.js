// backend/server.js - Updated with Authentication

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Coding Platform API is running!',
        timestamp: new Date()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

// Test Codeforces API
app.get('/test-codeforces', async (req, res) => {
    const { testConnection, getRandomProblem } = require('./services/codeforcesService');
    
    try {
        const connected = await testConnection();
        const problem = await getRandomProblem(800, 1200);
        
        res.json({
            connected,
            sampleProblem: problem
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Socket.io setup
require('./sockets/gameSocket')(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io server ready for connections`);
});
