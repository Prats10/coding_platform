// src/App.js - Main App with Routing

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import GameRoom from './pages/GameRoom';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/create" element={<CreateRoom />} />
                    <Route path="/room/:roomCode" element={<GameRoom />} />
                    <Route path="/join/:roomCode" element={<GameRoom />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
