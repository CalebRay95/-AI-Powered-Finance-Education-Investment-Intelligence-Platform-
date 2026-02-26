import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

// ─── Lazy-loaded pages (code-splitting per route) ─────────────────────────────
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Playground = lazy(() => import('./pages/Playground.jsx'));
const PortfolioAnalyzer = lazy(() => import('./pages/PortfolioAnalyzer.jsx'));
const NewsIntelligence = lazy(() => import('./pages/NewsIntelligence.jsx'));
const Academy = lazy(() => import('./pages/Academy.jsx'));
const Advisor = lazy(() => import('./pages/Advisor.jsx'));
const Community = lazy(() => import('./pages/Community.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

// ─── Full-screen loading spinner (used by Suspense + auth guards) ─────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0b101e] flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-[#14b8a6]/30 border-t-[#14b8a6] rounded-full animate-spin" />
    </div>
  );
}

// ─── Smart Root Redirect ──────────────────────────────────────────────────────
// Authenticated  → /dashboard
// Unauthenticated → /login
// While loading   → full-screen spinner (prevents flash redirects)
function SmartRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

// ─── Protected Route ──────────────────────────────────────────────────────────
// Wraps all authenticated pages. Redirects to /login if no valid JWT session.
function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────
//
//  Route tree:
//  /                 → SmartRedirect (→ /dashboard or /login)
//  /login            → Login          (public)
//  /register         → Register       (public)
//  /dashboard        → Dashboard      (protected)
//  /playground       → Playground     (protected) — NSE stock predictor + AI
//  /portfolio        → PortfolioAnalyzer (protected) — risk engine + Monte Carlo
//  /news             → NewsIntelligence  (protected) — FinBERT sentiment feed
//  /academy          → Academy           (protected) — courses + quizzes
//  /advisor          → Advisor           (protected) — Gemini SSE chat
//  /community        → Community         (protected) — Socket.IO rooms
//  *                 → 404
//
export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public ──────────────────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Protected — all wrapped in DashboardLayout ───────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/portfolio" element={<PortfolioAnalyzer />} />
              <Route path="/news" element={<NewsIntelligence />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/advisor" element={<Advisor />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* ── Root — smart redirect based on auth state ───────────────── */}
          <Route path="/" element={<SmartRedirect />} />

          {/* ── 404 Fallback ─────────────────────────────────────────────── */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-[#0b101e] text-white flex flex-col items-center justify-center gap-4">
                <p className="text-7xl font-bold text-[#1f2937]">404</p>
                <p className="text-gray-400 text-sm">Page not found</p>
                <a href="/dashboard" className="text-[#14b8a6] text-xs hover:underline mt-1">
                  ← Back to Dashboard
                </a>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
