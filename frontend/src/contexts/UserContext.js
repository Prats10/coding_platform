// frontend/src/contexts/UserContext.js - Real Authentication Context

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    // Load user on mount
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setCurrentUser(JSON.parse(storedUser));
                
                // Verify token is still valid
                try {
                    const response = await authAPI.getCurrentUser();
                    setCurrentUser(response.user);
                    localStorage.setItem('user', JSON.stringify(response.user));
                } catch (error) {
                    // Token invalid, clear everything
                    logout();
                }
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            
            setToken(response.token);
            setCurrentUser(response.user);
            
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Login failed' 
            };
        }
    };

    const register = async (username, email, password, codeforcesHandle) => {
        try {
            const response = await authAPI.register(username, email, password, codeforcesHandle);
            
            setToken(response.token);
            setCurrentUser(response.user);
            
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            return { success: true };
        } catch (error) {
            console.error('Register error:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Registration failed' 
            };
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const updateCFHandle = async (codeforcesHandle) => {
        try {
            await authAPI.updateCFHandle(codeforcesHandle);
            
            const updatedUser = { ...currentUser, codeforcesHandle };
            setCurrentUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            return { success: true };
        } catch (error) {
            console.error('Update CF handle error:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Update failed' 
            };
        }
    };

    return (
        <UserContext.Provider value={{ 
            currentUser, 
            loading,
            token,
            login, 
            register,
            logout,
            updateCFHandle
        }}>
            {children}
        </UserContext.Provider>
    );
};
