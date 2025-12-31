// src/pages/CreateRoom.js - Create Room Page

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import socketService from '../services/socket';
import './CreateRoom.css';

function CreateRoom() {
    const navigate = useNavigate();
    const { currentUser } = useUser();
    const [difficulty, setDifficulty] = useState('medium');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userId = currentUser.userId;

    useEffect(() => {
        // Connect to socket
        socketService.connect();

        // Listen for room created
        socketService.on('room_created', (data) => {
            console.log('Room created:', data);
            setLoading(false);
            // Navigate to game room
            navigate(`/room/${data.roomCode}`, { 
                state: { 
                    roomData: data,
                    userId: userId,
                    isCreator: true
                } 
            });
        });

        // Listen for errors
        socketService.on('error', (data) => {
            console.error('Error:', data.message);
            setError(data.message);
            setLoading(false);
        });

        return () => {
            socketService.removeAllListeners('room_created');
            socketService.removeAllListeners('error');
        };
    }, [navigate, userId]);

    const handleCreateRoom = () => {
        setLoading(true);
        setError('');
        console.log('Creating room with difficulty:', difficulty);
        socketService.createRoom(userId, difficulty);
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className="create-room-container">
            <button className="back-btn" onClick={handleBack}>
                ← Back
            </button>

            <div className="create-room-card">
                <h1>Create a New Room</h1>
                <p className="description">
                    Choose the difficulty level for your match
                </p>

                <div className="difficulty-selector">
                    <div 
                        className={`difficulty-option easy ${difficulty === 'easy' ? 'selected' : ''}`}
                        onClick={() => setDifficulty('easy')}
                    >
                        <div className="difficulty-icon">🟢</div>
                        <h3>Easy</h3>
                        <p>Rating: 800-1200</p>
                        <span className="difficulty-label">Good for beginners</span>
                    </div>

                    <div 
                        className={`difficulty-option medium ${difficulty === 'medium' ? 'selected' : ''}`}
                        onClick={() => setDifficulty('medium')}
                    >
                        <div className="difficulty-icon">🟡</div>
                        <h3>Medium</h3>
                        <p>Rating: 1200-1600</p>
                        <span className="difficulty-label">Balanced challenge</span>
                    </div>

                    <div 
                        className={`difficulty-option hard ${difficulty === 'hard' ? 'selected' : ''}`}
                        onClick={() => setDifficulty('hard')}
                    >
                        <div className="difficulty-icon">🔴</div>
                        <h3>Hard</h3>
                        <p>Rating: 1600-2000</p>
                        <span className="difficulty-label">For experts</span>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        ❌ {error}
                    </div>
                )}

                <button 
                    className="create-btn"
                    onClick={handleCreateRoom}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Creating Room...
                        </>
                    ) : (
                        '🎮 Create Room'
                    )}
                </button>

                <div className="info-box">
                    <h4>📝 Note:</h4>
                    <ul>
                        <li>A random Codeforces problem will be selected</li>
                        <li>Share the room code with your opponent</li>
                        <li>First to get "Accepted" wins!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default CreateRoom;
