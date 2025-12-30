// src/services/socket.js - Socket.io Client Connection

import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (this.socket?.connected) {
            console.log('Already connected');
            return this.socket;
        }

        console.log('Connecting to server...');
        
        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to server:', this.socket.id);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Room Actions
    createRoom(userId, difficulty) {
        this.socket.emit('create_room', { userId, difficulty });
    }

    joinRoom(userId, roomCode) {
        this.socket.emit('join_room', { userId, roomCode });
    }

    leaveRoom(userId, roomCode) {
        this.socket.emit('leave_room', { userId, roomCode });
    }

    // Event Listeners
    on(event, callback) {
        this.socket.on(event, callback);
    }

    off(event, callback) {
        this.socket.off(event, callback);
    }

    // Remove all listeners for an event
    removeAllListeners(event) {
        if (event) {
            this.socket.removeAllListeners(event);
        }
    }
}

export default new SocketService();
