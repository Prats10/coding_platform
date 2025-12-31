// backend/routes/auth.js - Registration & Login Routes

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, codeforcesHandle } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: 'Please provide username, email, and password' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters' 
            });
        }

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                error: 'Username or email already exists' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, codeforces_handle, rating, wins, losses)
             VALUES ($1, $2, $3, $4, 1200, 0, 0)
             RETURNING user_id, username, email, codeforces_handle, rating, wins, losses, created_at`,
            [username, email, hashedPassword, codeforcesHandle || null]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.user_id,
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        console.log('✅ New user registered:', user.username);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                codeforcesHandle: user.codeforces_handle,
                rating: user.rating,
                wins: user.wins,
                losses: user.losses,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Server error during registration' 
        });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Please provide email and password' 
            });
        }

        // Find user
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        const user = result.rows[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Update last login
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = $1',
            [user.user_id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.user_id,
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        console.log('✅ User logged in:', user.username);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                codeforcesHandle: user.codeforces_handle,
                rating: user.rating,
                wins: user.wins,
                losses: user.losses
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Server error during login' 
        });
    }
});

// ==================== GET CURRENT USER ====================
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT user_id, username, email, codeforces_handle, rating, wins, losses, created_at, last_login
             FROM users WHERE user_id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                codeforcesHandle: user.codeforces_handle,
                rating: user.rating,
                wins: user.wins,
                losses: user.losses,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            error: 'Server error fetching user data' 
        });
    }
});

// ==================== UPDATE CODEFORCES HANDLE ====================
router.put('/update-cf-handle', authMiddleware, async (req, res) => {
    try {
        const { codeforcesHandle } = req.body;

        if (!codeforcesHandle) {
            return res.status(400).json({ 
                error: 'Please provide Codeforces handle' 
            });
        }

        // Verify the handle exists on Codeforces
        const { verifyCFHandle } = require('../services/codeforcesService');
        const isValid = await verifyCFHandle(codeforcesHandle);

        if (!isValid) {
            return res.status(400).json({ 
                error: 'Invalid Codeforces handle' 
            });
        }

        // Update in database
        await db.query(
            'UPDATE users SET codeforces_handle = $1 WHERE user_id = $2',
            [codeforcesHandle, req.user.userId]
        );

        console.log('✅ Updated CF handle for user:', req.user.username);

        res.json({
            success: true,
            message: 'Codeforces handle updated successfully',
            codeforcesHandle
        });

    } catch (error) {
        console.error('Update CF handle error:', error);
        res.status(500).json({ 
            error: 'Server error updating Codeforces handle' 
        });
    }
});

module.exports = router;
