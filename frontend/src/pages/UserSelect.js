// src/pages/UserSelect.js - Select which user you are

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './UserSelect.css';

function UserSelect() {
    const navigate = useNavigate();
    const { selectUser } = useUser();

    const users = [
        { id: 1, username: 'testuser', cfHandle: 'tourist', color: '#4caf50' },
        { id: 2, username: 'testuser2', cfHandle: 'Petr', color: '#2196f3' }
    ];

    const handleSelectUser = (user) => {
        selectUser(user.id, user.username, user.cfHandle);
        navigate('/');
    };

    return (
        <div className="user-select-container">
            <div className="user-select-card">
                <h1>👤 Select Your User</h1>
                <p className="subtitle">Choose which user you want to play as</p>
                <p className="info-text">
                    💡 <strong>Testing Tip:</strong> Open this page in two tabs/windows. 
                    Select User 1 in one tab and User 2 in the other tab!
                </p>

                <div className="users-grid">
                    {users.map((user) => (
                        <div 
                            key={user.id}
                            className="user-card"
                            onClick={() => handleSelectUser(user)}
                            style={{ borderColor: user.color }}
                        >
                            <div 
                                className="user-icon"
                                style={{ background: user.color }}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <h3>{user.username}</h3>
                            <p className="cf-handle">
                                Codeforces: <strong>{user.cfHandle}</strong>
                            </p>
                            <button 
                                className="select-btn"
                                style={{ background: user.color }}
                            >
                                Select User {user.id}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="note">
                    <p><strong>Note:</strong> This is for testing only. We'll add proper authentication later!</p>
                </div>
            </div>
        </div>
    );
}

export default UserSelect;
