import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

// Public Pages
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { NotFound } from './pages/NotFound';

// The Two Destination Core Hubs
import { CareerDashboard } from './pages/CareerDashboard';
import { SpeakingCompanion } from './pages/SpeakingCompanion';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth initialTab="login" />} />
            <Route path="/register" element={<Auth initialTab="register" />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />

            {/* Protected Application Routes (Inside Unified AppLayout) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Screen 2: Main Campus Dashboard */}
              <Route path="/dashboard" element={<CareerDashboard initialView="hub" />} />

              {/* Screen 4: Career Path Roadmap */}
              <Route path="/career-path" element={<CareerDashboard initialView="roadmap" />} />
              <Route path="/roadmap" element={<CareerDashboard initialView="roadmap" />} />

              {/* Screen 8: Student Profile */}
              <Route path="/profile" element={<CareerDashboard initialView="profile" />} />

              {/* Screen 4 Diagnostic: Skill Assessment */}
              <Route path="/assessment" element={<CareerDashboard initialView="assessment" />} />

              {/* Screen 5: AI Career Mentor */}
              <Route path="/career-mentor" element={<CareerDashboard initialView="mentor" />} />

              {/* Screen 3: AI Slide Maker */}
              <Route path="/slides" element={<CareerDashboard initialView="slides" />} />

              {/* Screen 7: Technical Interview Practice */}
              <Route path="/interview" element={<CareerDashboard initialView="interview" />} />
              <Route path="/interview/technical" element={<CareerDashboard initialView="interview" />} />
              <Route path="/interview/hr" element={<CareerDashboard initialView="interview" />} />

              {/* Screen 9: Progress Reports */}
              <Route path="/progress" element={<CareerDashboard initialView="progress" />} />
              <Route path="/session-report" element={<CareerDashboard initialView="progress" />} />

              {/* Speaking Destination (Screens 6 & 7) */}
              <Route path="/speak" element={<SpeakingCompanion initialStage="partner-select" />} />
              <Route path="/speaking" element={<SpeakingCompanion initialStage="partner-select" />} />
              <Route path="/speaking-session" element={<SpeakingCompanion initialStage="room" />} />

              {/* Backward compatibility aliases */}
              <Route path="/practice" element={<Navigate to="/speaking" replace />} />
              <Route path="/gd" element={<Navigate to="/speaking" replace />} />
              <Route path="/learning" element={<Navigate to="/career-path" replace />} />
              <Route path="/tasks" element={<Navigate to="/dashboard" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Unknown Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
