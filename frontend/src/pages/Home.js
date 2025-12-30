// src/pages/Home.js - Landing Page

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState('');

    const handleCreateRoom = () => {
        navigate('/create');
    };

    const handleJoinRoom = () => {
        if (joinCode.trim()) {
            navigate(`/join/${joinCode.toUpperCase()}`);
        } else {
            alert('Please enter a room code!');
        }
    };

    return (
        <div className="home-container">
            <div className="hero-section">
                <h1 className="title">
                    ⚔️ CodeBattle
                </h1>
                <p className="subtitle">
                    Real-time 1v1 competitive programming battles
                </p>
            </div>

            <div className="action-cards">
                {/* Create Room Card */}
                <div className="card create-card">
                    <div className="card-icon">🎮</div>
                    <h2>Create Room</h2>
                    <p>Start a new match and challenge your friends</p>
                    <button 
                        className="btn btn-primary"
                        onClick={handleCreateRoom}
                    >
                        Create New Room
                    </button>
                </div>

                {/* Join Room Card */}
                <div className="card join-card">
                    <div className="card-icon">🚪</div>
                    <h2>Join Room</h2>
                    <p>Enter a room code to join an existing match</p>
                    <input
                        type="text"
                        className="room-code-input"
                        placeholder="Enter room code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                    />
                    <button 
                        className="btn btn-secondary"
                        onClick={handleJoinRoom}
                    >
                        Join Room
                    </button>
                </div>
            </div>

            <div className="features">
                <h3>How It Works</h3>
                <div className="features-grid">
                    <div className="feature">
                        <span className="feature-number">1</span>
                        <p>Create or join a room</p>
                    </div>
                    <div className="feature">
                        <span className="feature-number">2</span>
                        <p>Get a random problem</p>
                    </div>
                    <div className="feature">
                        <span className="feature-number">3</span>
                        <p>Solve on Codeforces</p>
                    </div>
                    <div className="feature">
                        <span className="feature-number">4</span>
                        <p>First to AC wins!</p>
                    </div>
                </div>
            </div>

            <footer className="home-footer">
                <p>Powered by Codeforces API</p>
            </footer>
        </div>
    );
}

export default Home;
