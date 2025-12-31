// sockets/gameSocket.js - WITH CODEFORCES INTEGRATION

const db = require('../config/database');
const { getRandomProblem, verifyCFHandle } = require('../services/codeforcesService');
const { startPolling, stopPolling } = require('../services/submissionPoller');

// Store active rooms in memory
const activeRooms = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('✅ New client connected:', socket.id);

        // ==================== CREATE ROOM ====================
        socket.on('create_room', async (data) => {
            console.log('📝 Received create_room request:', data);
            
            try {
                const { userId, difficulty } = data;

                // Step 1: Get user details
                console.log('🔍 Looking for user with ID:', userId);
                const userResult = await db.query(
                    'SELECT username, codeforces_handle FROM users WHERE user_id = $1',
                    [userId]
                );

                if (userResult.rows.length === 0) {
                    console.error('❌ User not found');
                    socket.emit('error', { message: 'User not found' });
                    return;
                }

                const user = userResult.rows[0];
                console.log('✅ User found:', user.username);

                // Step 2: Check Codeforces handle
                if (!user.codeforces_handle) {
                    console.error('❌ User has no Codeforces handle');
                    socket.emit('error', { 
                        message: 'Please set your Codeforces handle in your profile first' 
                    });
                    return;
                }

                console.log('🔍 Verifying CF handle:', user.codeforces_handle);
                const isValidHandle = await verifyCFHandle(user.codeforces_handle);
                
                if (!isValidHandle) {
                    console.error('❌ Invalid Codeforces handle');
                    socket.emit('error', { 
                        message: `Invalid Codeforces handle: ${user.codeforces_handle}` 
                    });
                    return;
                }

                console.log('✅ Codeforces handle verified');

                // Step 3: Generate room code
                const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                console.log('🎲 Generated room code:', roomCode);

                // Step 4: Fetch random problem from Codeforces
                const minRating = difficulty === 'easy' ? 800 : 
                                 difficulty === 'medium' ? 1200 : 1600;
                const maxRating = minRating + 400;

                console.log(`🔍 Fetching problem (difficulty: ${difficulty})...`);
                const problem = await getRandomProblem(minRating, maxRating);

                // Step 5: Save to database
                console.log('💾 Saving room to database...');
                await db.query(
                    `INSERT INTO rooms 
                     (room_code, creator_id, creator_cf_handle, problem_id, problem_name, problem_rating, problem_url, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting')`,
                    [roomCode, userId, user.codeforces_handle, problem.problemId, 
                     problem.name, problem.rating, problem.url]
                );
                console.log('✅ Room saved to database');

                // Step 6: Store in memory
                activeRooms.set(roomCode, {
                    creator: { userId, socketId: socket.id, cfHandle: user.codeforces_handle },
                    opponent: null,
                    problem: problem,
                    status: 'waiting'
                });

                // Step 7: Join socket room
                socket.join(roomCode);

                // Step 8: Send success response
                socket.emit('room_created', {
                    success: true,
                    roomCode,
                    problem: {
                        id: problem.problemId,
                        name: problem.name,
                        rating: problem.rating,
                        tags: problem.tags,
                        url: problem.url
                    }
                });

                console.log('✅ SUCCESS! Room created:', roomCode);
                console.log('================================================');

            } catch (error) {
                console.error('❌❌❌ ERROR in create_room:');
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                socket.emit('error', { 
                    message: 'Failed to create room: ' + error.message 
                });
            }
        });

        // ==================== JOIN ROOM ====================
        socket.on('join_room', async (data) => {
            console.log('🚪 Received join_room request:', data);
            
            try {
                const { userId, roomCode } = data;

                // Step 1: Check if room exists
                console.log('🔍 Looking for room:', roomCode);
                const roomResult = await db.query(
                    'SELECT * FROM rooms WHERE room_code = $1 AND status = $2',
                    [roomCode, 'waiting']
                );

                if (roomResult.rows.length === 0) {
                    console.error('❌ Room not found or already started');
                    socket.emit('error', { 
                        message: 'Room not found or match already in progress' 
                    });
                    return;
                }

                const room = roomResult.rows[0];
                console.log('✅ Room found');

                // Step 2: Get user details
                console.log('🔍 Looking for user with ID:', userId);
                const userResult = await db.query(
                    'SELECT username, codeforces_handle FROM users WHERE user_id = $1',
                    [userId]
                );

                if (userResult.rows.length === 0) {
                    console.error('❌ User not found');
                    socket.emit('error', { message: 'User not found' });
                    return;
                }

                const user = userResult.rows[0];
                console.log('✅ User found:', user.username);

                // Step 3: Check Codeforces handle
                if (!user.codeforces_handle) {
                    console.error('❌ User has no Codeforces handle');
                    socket.emit('error', { 
                        message: 'Please set your Codeforces handle first' 
                    });
                    return;
                }

                console.log('🔍 Verifying CF handle:', user.codeforces_handle);
                const isValidHandle = await verifyCFHandle(user.codeforces_handle);
                
                if (!isValidHandle) {
                    console.error('❌ Invalid Codeforces handle');
                    socket.emit('error', { 
                        message: `Invalid Codeforces handle: ${user.codeforces_handle}` 
                    });
                    return;
                }

                console.log('✅ Codeforces handle verified');

                // Step 4: Check if trying to join own room
                if (room.creator_id === userId) {
                    console.error('❌ User trying to join own room');
                    socket.emit('error', { message: 'Cannot join your own room' });
                    return;
                }

                // Step 5: Update database
                console.log('💾 Updating room in database...');
                await db.query(
                    `UPDATE rooms 
                     SET opponent_id = $1, opponent_cf_handle = $2, status = 'in_progress', match_started_at = NOW()
                     WHERE room_code = $3`,
                    [userId, user.codeforces_handle, roomCode]
                );
                console.log('✅ Room updated');

                // Step 6: Update memory
                const roomData = activeRooms.get(roomCode);
                if (roomData) {
                    roomData.opponent = { 
                        userId, 
                        socketId: socket.id, 
                        cfHandle: user.codeforces_handle 
                    };
                    roomData.status = 'in_progress';
                }

                // Step 7: Join socket room
                socket.join(roomCode);

                // Get creator username
                const creatorResult = await db.query(
                    'SELECT username FROM users WHERE user_id = $1',
                    [room.creator_id]
                );
                const creatorUsername = creatorResult.rows[0].username;

                // Step 8: Notify both players
                io.to(roomCode).emit('match_started', {
                    roomCode,
                    problem: roomData.problem,
                    players: {
                        creatorId: room.creator_id,
                        creatorUsername: creatorUsername,
                        creatorCfHandle: roomData.creator.cfHandle,
                        opponentId: userId,
                        opponentUsername: user.username,
                        opponentCfHandle: user.codeforces_handle
                    },
                    startTime: new Date(),
                    message: '⚔️ Match started! Submit your solution on Codeforces!'
                });

                console.log('✅ Match started!');

                // Step 9: START POLLING FOR SUBMISSIONS! 🎯
                console.log('▶️  Starting submission polling...');
                startPolling(roomCode, io);

                console.log('✅ SUCCESS! Everything ready for room:', roomCode);
                console.log('================================================');

            } catch (error) {
                console.error('❌❌❌ ERROR in join_room:');
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                socket.emit('error', { 
                    message: 'Failed to join room: ' + error.message 
                });
            }
        });

        // ==================== LEAVE ROOM ====================
        socket.on('leave_room', async (data) => {
            console.log('👋 User leaving room:', data);
            
            const { userId, roomCode } = data;

            // Update room status
            await db.query(
                `UPDATE rooms SET status = 'abandoned' 
                 WHERE room_code = $1 AND status != 'completed'`,
                [roomCode]
            );

            // Stop polling
            stopPolling(roomCode);

            // Notify other player
            socket.to(roomCode).emit('opponent_left', {
                message: 'Opponent left the match'
            });

            // Clean up
            activeRooms.delete(roomCode);
            socket.leave(roomCode);
        });

        // ==================== DISCONNECT ====================
        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);

            // Find and handle disconnected rooms
            for (const [roomCode, room] of activeRooms.entries()) {
                if (room.creator?.socketId === socket.id || 
                    room.opponent?.socketId === socket.id) {
                    
                    console.log(`🧹 Cleaning up room ${roomCode} due to disconnect`);
                    
                    // If match in progress, mark as abandoned
                    if (room.status === 'in_progress') {
                        db.query(
                            `UPDATE rooms SET status = 'abandoned' WHERE room_code = $1`,
                            [roomCode]
                        ).catch(err => console.error('Error updating room:', err));
                        
                        stopPolling(roomCode);
                        
                        io.to(roomCode).emit('opponent_left', {
                            reason: 'disconnected'
                        });
                    }
                    
                    activeRooms.delete(roomCode);
                }
            }
        });
    });
};
