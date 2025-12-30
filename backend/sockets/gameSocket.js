// This file handles all real-time events (create room, join room, etc.)

const db = require('../config/database');

// Store active rooms in memory for quick access
// Map is like a dictionary: roomCode -> room data
const activeRooms = new Map();

module.exports = (io) => {
    // This runs whenever a client connects
    io.on('connection', (socket) => {
        console.log('✅ New client connected:', socket.id);

        // ==================== CREATE ROOM ====================
        socket.on('create_room', async (data) => {
            try {
                console.log('📝 Create room request:', data);

                const { userId, difficulty } = data;

                // Generate random 6-character room code
                const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

                // For now, use a dummy problem (we'll add Codeforces later)
                const dummyProblem = {
                    contestId: 1234,
                    index: 'A',
                    problemId: '1234A',
                    name: 'Sample Problem',
                    rating: 1200,
                    url: 'https://codeforces.com/problemset/problem/1234/A'
                };

                // Get user's Codeforces handle from database
                const userResult = await db.query(
                    'SELECT username, codeforces_handle FROM users WHERE user_id = $1',
                    [userId]
                );

                if (userResult.rows.length === 0) {
                    socket.emit('error', { message: 'User not found' });
                    return;
                }

                const user = userResult.rows[0];

                // Save room to database
                await db.query(
                    `INSERT INTO rooms 
                     (room_code, creator_id, creator_cf_handle, problem_id, problem_name, problem_rating, problem_url, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting')`,
                    [roomCode, userId, user.codeforces_handle, dummyProblem.problemId, 
                     dummyProblem.name, dummyProblem.rating, dummyProblem.url]
                );

                // Store in memory
                activeRooms.set(roomCode, {
                    creator: { userId, socketId: socket.id, cfHandle: user.codeforces_handle },
                    opponent: null,
                    problem: dummyProblem,
                    status: 'waiting'
                });

                // Join the socket room (separate from our room concept)
                socket.join(roomCode);

                // Send success response to creator
                socket.emit('room_created', {
                    success: true,
                    roomCode,
                    problem: dummyProblem
                });

                console.log('✅ Room created:', roomCode);

            } catch (error) {
                console.error('❌ Error creating room:', error);
                socket.emit('error', { message: 'Failed to create room' });
            }
        });

        // ==================== JOIN ROOM ====================
        socket.on('join_room', async (data) => {
            try {
                console.log('🚪 Join room request:', data);

                const { userId, roomCode } = data;

                // Check if room exists in database
                const roomResult = await db.query(
                    'SELECT * FROM rooms WHERE room_code = $1 AND status = $2',
                    [roomCode, 'waiting']
                );

                if (roomResult.rows.length === 0) {
                    socket.emit('error', { message: 'Room not found or already started' });
                    return;
                }

                // Get user details
                const userResult = await db.query(
                    'SELECT username, codeforces_handle FROM users WHERE user_id = $1',
                    [userId]
                );

                if (userResult.rows.length === 0) {
                    socket.emit('error', { message: 'User not found' });
                    return;
                }

                const user = userResult.rows[0];

                // Update database - add opponent
                await db.query(
                    `UPDATE rooms 
                     SET opponent_id = $1, opponent_cf_handle = $2, status = 'in_progress', match_started_at = NOW()
                     WHERE room_code = $3`,
                    [userId, user.codeforces_handle, roomCode]
                );

                // Update memory
                const roomData = activeRooms.get(roomCode);
                roomData.opponent = { userId, socketId: socket.id, cfHandle: user.codeforces_handle };
                roomData.status = 'in_progress';

                // Join socket room
                socket.join(roomCode);

                // Notify BOTH players that match is starting
                io.to(roomCode).emit('match_started', {
                    roomCode,
                    problem: roomData.problem,
                    startTime: new Date(),
                    message: '⚔️ Match started! Go to Codeforces and submit your solution!'
                });

                console.log('✅ Match started in room:', roomCode);

            } catch (error) {
                console.error('❌ Error joining room:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // ==================== DISCONNECT ====================
        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);

            // Find any rooms this user was in
            for (const [roomCode, room] of activeRooms.entries()) {
                if (room.creator?.socketId === socket.id || room.opponent?.socketId === socket.id) {
                    // Notify other player
                    io.to(roomCode).emit('opponent_left', {
                        message: 'Opponent disconnected'
                    });

                    // Update database
                    db.query(
                        `UPDATE rooms SET status = 'abandoned' WHERE room_code = $1`,
                        [roomCode]
                    );

                    // Clean up
                    activeRooms.delete(roomCode);
                }
            }
        });
    });
};