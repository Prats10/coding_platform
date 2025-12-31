// frontend/src/pages/Register.js - Registration Page

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './Auth.css';

function Register() {
    const navigate = useNavigate();
    const { register } = useUser();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        codeforcesHandle: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        const result = await register(
            formData.username,
            formData.email,
            formData.password,
            formData.codeforcesHandle || null
        );

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card register-card">
                <div className="auth-header">
                    <h1>⚔️ CodeBattle</h1>
                    <h2>Join the Battle!</h2>
                    <p>Create your account and start competing</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Username *</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="At least 6 characters"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password *</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="codeforcesHandle">
                            Codeforces Handle (Optional)
                            <span className="label-hint">You can add this later</span>
                        </label>
                        <input
                            type="text"
                            id="codeforcesHandle"
                            name="codeforcesHandle"
                            value={formData.codeforcesHandle}
                            onChange={handleChange}
                            placeholder="Your Codeforces username"
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            ❌ {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Creating Account...
                            </>
                        ) : (
                            '🎮 Create Account'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
