// frontend/src/App.js - Updated with Auth

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import GameRoom from './pages/GameRoom';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// Protected route wrapper
function ProtectedRoute({ children }) {
    const { currentUser, loading } = useUser();
    
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner-large"></div>
                <p>Loading...</p>
            </div>
        );
    }
    
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
}

// Public route wrapper (redirect to home if already logged in)
function PublicRoute({ children }) {
    const { currentUser, loading } = useUser();
    
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner-large"></div>
                <p>Loading...</p>
            </div>
        );
    }
    
    if (currentUser) {
        return <Navigate to="/" replace />;
    }
    
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route 
                path="/login" 
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } 
            />
            <Route 
                path="/register" 
                element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                } 
            />
            
            {/* Protected Routes */}
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/create" 
                element={
                    <ProtectedRoute>
                        <CreateRoom />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/room/:roomCode" 
                element={
                    <ProtectedRoute>
                        <GameRoom />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/join/:roomCode" 
                element={
                    <ProtectedRoute>
                        <GameRoom />
                    </ProtectedRoute>
                } 
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <UserProvider>
                <div className="App">
                    <AppRoutes />
                </div>
            </UserProvider>
        </BrowserRouter>
    );
}

export default App;
