// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages haru import garne
import StoreFront from './pages/StoreFront';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Main pasal ko route */}
        <Route path="/" element={<StoreFront />} />
        
        {/* Admin panel ko route */}
        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}