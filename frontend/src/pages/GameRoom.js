// src/pages/GameRoom.js - Main Game Room

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import './GameRoom.css';

function GameRoom() {
    const { roomCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [status, setStatus] = useState('waiting'); // waiting, in_progress, completed
    const [problem, setProblem] = useState(null);
    const [opponentHandle, setOpponentHandle] = useState(null);
    const [winner, setWinner] = useState(null);
    const [pollingMessage, setPollingMessage] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const userId = location.state?.userId || 1;
    const isCreator = location.state?.isCreator || false;

    useEffect(() => {
        // Connect socket
        const socket = socketService.connect();

        // If creator, we already have room data
        if (isCreator && location.state?.roomData) {
            setProblem(location.state.roomData.problem);
            setStatus('waiting');
        } else {
            // If joining, trigger join
            socketService.joinRoom(userId, roomCode);
        }

        // Listen for match started
        socket.on('match_started', (data) => {
            console.log('Match started:', data);
            setProblem(data.problem);
            setOpponentHandle(data.players.creator || data.players.opponent);
            setStatus('in_progress');
        });

        // Listen for polling updates
        socket.on('polling_update', (data) => {
            setPollingMessage(data.message);
        });

        // Listen for match ended
        socket.on('match_ended', (data) => {
            console.log('Match ended:', data);
            setWinner(data);
            setStatus('completed');
        });

        // Listen for opponent left
        socket.on('opponent_left', (data) => {
            alert('Opponent left the match!');
            navigate('/');
        });

        // Listen for errors
        socket.on('error', (data) => {
            alert('Error: ' + data.message);
            navigate('/');
        });

        return () => {
            socket.removeAllListeners('match_started');
            socket.removeAllListeners('polling_update');
            socket.removeAllListeners('match_ended');
            socket.removeAllListeners('opponent_left');
            socket.removeAllListeners('error');
        };
    }, [roomCode, userId, isCreator, location.state, navigate]);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handlePlayAgain = () => {
        navigate('/');
    };

    const handleLeaveRoom = () => {
        socketService.leaveRoom(userId, roomCode);
        navigate('/');
    };

    // Waiting for opponent
    if (status === 'waiting') {
        return (
            <div className="game-room-container">
                <div className="waiting-card">
                    <h1>Room Created! 🎉</h1>
                    
                    <div className="room-code-display">
                        <p>Room Code:</p>
                        <div className="code-box">
                            {roomCode}
                            <button 
                                className="copy-btn"
                                onClick={copyRoomCode}
                            >
                                {copySuccess ? '✓ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                    </div>

                    {problem && (
                        <div className="problem-preview">
                            <h3>Problem Preview</h3>
                            <p className="problem-name">{problem.name}</p>
                            <p className="problem-rating">Rating: {problem.rating}</p>
                            <div className="tags">
                                {problem.tags?.map((tag, i) => (
                                    <span key={i} className="tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="waiting-animation">
                        <div className="pulse"></div>
                        <p>Waiting for opponent to join...</p>
                    </div>

                    <button className="leave-btn" onClick={handleLeaveRoom}>
                        Leave Room
                    </button>
                </div>
            </div>
        );
    }

    // Match in progress
    if (status === 'in_progress') {
        return (
            <div className="game-room-container">
                <div className="match-header">
                    <div className="room-info">
                        <span className="room-label">Room:</span>
                        <span className="room-code-small">{roomCode}</span>
                    </div>
                    <div className="status-badge">
                        <span className="status-dot"></span>
                        Match In Progress
                    </div>
                </div>

                <div className="match-content">
                    <div className="problem-card">
                        <h2>{problem.name}</h2>
                        
                        <div className="problem-meta">
                            <span className="rating-badge">
                                ⭐ {problem.rating}
                            </span>
                            <div className="tags">
                                {problem.tags?.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="tag">{tag}</span>
                                ))}
                            </div>
                        </div>

                        <div className="instructions">
                            <h3>How to Play:</h3>
                            <ol>
                                <li>Click "Solve on Codeforces" below</li>
                                <li>Read the problem statement</li>
                                <li>Write your solution</li>
                                <li>Submit your code</li>
                                <li>First to get "Accepted" wins! 🏆</li>
                            </ol>
                        </div>

                        <a 
                            href={problem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="solve-btn"
                        >
                            🚀 Solve on Codeforces
                        </a>
                    </div>

                    <div className="status-panel">
                        <h3>Match Status</h3>
                        
                        {opponentHandle && (
                            <div className="opponent-info">
                                <p>Playing against:</p>
                                <div className="opponent-name">{opponentHandle}</div>
                            </div>
                        )}

                        <div className="polling-status">
                            <div className="pulse-small"></div>
                            <p>{pollingMessage || 'Checking for submissions...'}</p>
                        </div>

                        <div className="tips">
                            <h4>💡 Tips:</h4>
                            <ul>
                                <li>Read the problem carefully</li>
                                <li>Test with sample cases</li>
                                <li>Submit when confident</li>
                                <li>Only "Accepted" counts!</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <button className="leave-btn-small" onClick={handleLeaveRoom}>
                    Leave Match
                </button>
            </div>
        );
    }

    // Match completed
    if (status === 'completed' && winner) {
        const isWinner = winner.winnerId === userId;

        return (
            <div className="game-room-container">
                <div className="result-card">
                    <div className={`result-header ${isWinner ? 'winner' : 'loser'}`}>
                        {isWinner ? (
                            <>
                                <div className="trophy">🏆</div>
                                <h1>You Won!</h1>
                            </>
                        ) : (
                            <>
                                <div className="trophy">😔</div>
                                <h1>You Lost</h1>
                            </>
                        )}
                    </div>

                    <div className="winner-info">
                        <h2>Winner: {winner.winnerUsername}</h2>
                    </div>

                    {winner.submission && (
                        <div className="submission-stats">
                            <h3>Winning Submission:</h3>
                            <div className="stats-grid">
                                <div className="stat">
                                    <span className="stat-label">Time:</span>
                                    <span className="stat-value">{winner.submission.time}ms</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Memory:</span>
                                    <span className="stat-value">
                                        {(winner.submission.memory / 1024).toFixed(2)} KB
                                    </span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Language:</span>
                                    <span className="stat-value">{winner.submission.language}</span>
                                </div>
                            </div>

                            {winner.submission.url && (
                                <a 
                                    href={winner.submission.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-submission-btn"
                                >
                                    View Submission on Codeforces
                                </a>
                            )}
                        </div>
                    )}

                    <div className="action-buttons">
                        <button className="play-again-btn" onClick={handlePlayAgain}>
                            🎮 Play Again
                        </button>
                        <button className="home-btn" onClick={() => navigate('/')}>
                            🏠 Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default GameRoom;
