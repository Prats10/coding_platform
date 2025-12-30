// services/submissionPoller.js - Polls Codeforces for submissions

const db = require('../config/database');
const { checkUserSubmissions } = require('./codeforcesService');

// Track active polling intervals
const activePollers = new Map();

// Polling interval in milliseconds (5 seconds)
const POLLING_INTERVAL = 5000;

// ==================== START POLLING ====================
function startPolling(roomCode, io) {
    // Don't start if already polling
    if (activePollers.has(roomCode)) {
        console.log(`⏭️  Already polling room ${roomCode}`);
        return;
    }

    console.log(`▶️  Started polling room ${roomCode}`);
    console.log(`   Checking every ${POLLING_INTERVAL / 1000} seconds...`);

    // Do initial check immediately
    checkRoomSubmissions(roomCode, io);

    // Then check every POLLING_INTERVAL
    const intervalId = setInterval(async () => {
        try {
            await checkRoomSubmissions(roomCode, io);
        } catch (error) {
            console.error(`❌ Polling error for ${roomCode}:`, error.message);
        }
    }, POLLING_INTERVAL);

    activePollers.set(roomCode, intervalId);
}

// ==================== STOP POLLING ====================
function stopPolling(roomCode) {
    const intervalId = activePollers.get(roomCode);
    
    if (intervalId) {
        clearInterval(intervalId);
        activePollers.delete(roomCode);
        console.log(`⏹️  Stopped polling room ${roomCode}`);
    }
}

// ==================== CHECK SUBMISSIONS ====================
async function checkRoomSubmissions(roomCode, io) {
    // Get room details
    const roomResult = await db.query(
        `SELECT * FROM rooms WHERE room_code = $1 AND status = 'in_progress'`,
        [roomCode]
    );

    if (roomResult.rows.length === 0) {
        console.log(`⏹️  Room ${roomCode} not found or not in progress. Stopping polling.`);
        stopPolling(roomCode);
        return;
    }

    const room = roomResult.rows[0];
    const matchStartTime = new Date(room.match_started_at).getTime();

    console.log(`🔄 Polling room ${roomCode}...`);
    console.log(`   Problem: ${room.problem_id}`);
    console.log(`   Creator: ${room.creator_cf_handle}`);
    console.log(`   Opponent: ${room.opponent_cf_handle}`);

    // Check creator's submissions
    if (room.creator_cf_handle) {
        const submission = await checkUserSubmissions(
            room.creator_cf_handle,
            room.problem_id,
            matchStartTime
        );

        if (submission) {
            console.log(`🏆 Creator ${room.creator_cf_handle} has accepted solution!`);
            await declareWinner(roomCode, room.creator_id, submission, io);
            stopPolling(roomCode);
            return;
        }
    }

    // Check opponent's submissions
    if (room.opponent_cf_handle) {
        const submission = await checkUserSubmissions(
            room.opponent_cf_handle,
            room.problem_id,
            matchStartTime
        );

        if (submission) {
            console.log(`🏆 Opponent ${room.opponent_cf_handle} has accepted solution!`);
            await declareWinner(roomCode, room.opponent_id, submission, io);
            stopPolling(roomCode);
            return;
        }
    }

    // Notify clients that we're still checking
    io.to(roomCode).emit('polling_update', {
        message: 'Checking for submissions...',
        timestamp: new Date()
    });
}

// ==================== DECLARE WINNER ====================
async function declareWinner(roomCode, winnerId, submission, io) {
    try {
        console.log(`🎉 WINNER FOUND IN ROOM ${roomCode}!`);
        console.log(`   Winner ID: ${winnerId}`);
        console.log(`   Submission ID: ${submission.submissionId}`);
        console.log(`   Time: ${submission.timeMs}ms`);
        console.log(`   Memory: ${submission.memoryBytes} bytes`);

        // Update room in database
        await db.query(
            `UPDATE rooms 
             SET winner_id = $1, status = 'completed', match_ended_at = NOW()
             WHERE room_code = $2`,
            [winnerId, roomCode]
        );

        // Save winning submission
        await db.query(
            `INSERT INTO winning_submissions 
             (room_code, winner_id, cf_submission_id, problem_id, verdict, time_ms, memory_bytes, programming_language, submitted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                roomCode,
                winnerId,
                submission.submissionId,
                submission.problemId,
                submission.verdict,
                submission.timeMs,
                submission.memoryBytes,
                submission.language,
                submission.submittedAt
            ]
        );

        // Update winner's stats
        await db.query(
            `UPDATE users SET wins = wins + 1 WHERE user_id = $1`,
            [winnerId]
        );

        // Get winner username
        const userResult = await db.query(
            'SELECT username FROM users WHERE user_id = $1',
            [winnerId]
        );

        const winnerUsername = userResult.rows[0].username;

        // Extract contest ID for submission URL
        const contestId = submission.problemId.match(/\d+/)[0];

        // Notify all players in the room
        io.to(roomCode).emit('match_ended', {
            winnerId: winnerId,
            winnerUsername: winnerUsername,
            submission: {
                id: submission.submissionId,
                time: submission.timeMs,
                memory: submission.memoryBytes,
                language: submission.language,
                url: `https://codeforces.com/contest/${contestId}/submission/${submission.submissionId}`
            },
            timestamp: new Date()
        });

        console.log(`✅ Match completed! Winner: ${winnerUsername}`);
        console.log(`================================================`);

    } catch (error) {
        console.error('❌ Error declaring winner:', error.message);
        console.error(error.stack);
    }
}

// ==================== GET ACTIVE POLLERS INFO ====================
function getActivePollers() {
    return {
        count: activePollers.size,
        rooms: Array.from(activePollers.keys())
    };
}

module.exports = {
    startPolling,
    stopPolling,
    getActivePollers
};


