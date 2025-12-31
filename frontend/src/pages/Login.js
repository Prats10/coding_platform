// frontend/src/pages/Login.js - Login Page

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './Auth.css';

function Login() {
    const navigate = useNavigate();
    const { login } = useUser();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(formData.email, formData.password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>⚔️ CodeBattle</h1>
                    <h2>Welcome Back!</h2>
                    <p>Login to continue your battles</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
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
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
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
                                Logging in...
                            </>
                        ) : (
                            '🚀 Login'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register">Register here</Link>
                    </p>
                </div>

                <div className="demo-credentials">
                    <h4>📝 Demo Accounts:</h4>
                    <p><strong>Email:</strong> test@example.com</p>
                    <p><strong>Password:</strong> password123</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
