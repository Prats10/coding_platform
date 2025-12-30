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

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Coding Platform API is running!',
        timestamp: new Date()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

// Socket.io setup
require('./sockets/gameSocket')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io server ready for connections`);
});