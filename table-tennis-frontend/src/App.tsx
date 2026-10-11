import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import PublicLayout from "./components/PublicLayout";
import Home from "./pages/Home";
import Tournaments from "./pages/Tournaments";
import TournamentDetails from "./pages/TournamentDetails";
import CreateTournament from "./pages/CreateTournament";
import MyRegistrations from "./pages/MyRegistrations";
import MyMatches from "./pages/MyMatches";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import ResetPassword from "./pages/ResetPassword";
import AdminRequests from "./pages/AdminRequests";
import PublicProfile from "./pages/PublicProfile";
import GlobalLeaderboard from "./pages/GlobalLeaderboard";
import Players from "./pages/Players";
import RefereeMatches from "./pages/RefereeMatches";
import About from "./pages/About";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
//import VerifyEmail from "./pages/VerifyEmail";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const DashboardRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === "REFEREE") {
    return <Navigate to="/app/referee/matches" replace />;
  }
  return <Dashboard />;
};

const AppIndexRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === "REFEREE") {
    return <Navigate to="/app/referee/matches" replace />;
  }
  return <Navigate to="/app/dashboard" replace />;
};

const PublicTournamentsRoute: React.FC = () => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/app/tournaments" replace />;
  }
  return <Tournaments />;
};

const PublicTournamentDetailsRoute: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  if (user) {
    return <Navigate to={`/app/tournaments/${id}`} replace />;
  }
  return <TournamentDetails />;
};

const PublicLeaderboardRoute: React.FC = () => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/app/leaderboard" replace />;
  }
  return <Leaderboard />;
};

const PublicGlobalLeaderboardRoute: React.FC = () => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/app/global-leaderboard" replace />;
  }
  return <GlobalLeaderboard />;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== "SUPER_ADMIN" && !user?.isSuperAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <>{children}</>;
};

const PermissionRoute: React.FC<{ permission: any; children: React.ReactNode }> = ({
  permission,
  children,
}) => {
  const { user, hasPermission } = useAuth();
  if (user?.role === "SUPER_ADMIN" || user?.isSuperAdmin || hasPermission(permission)) {
    return <>{children}</>;
  }
  return <Navigate to="/app/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - no login required */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="tournaments" element={<PublicTournamentsRoute />} />
        <Route path="tournaments/:id" element={<PublicTournamentDetailsRoute />} />
        <Route path="leaderboard" element={<PublicLeaderboardRoute />} />
        <Route path="global-leaderboard" element={<PublicGlobalLeaderboardRoute />} />
        <Route path="profile/:userId" element={<PublicProfile />} />
        <Route path="players" element={<Players />} />
      </Route>

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes - require login */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AppIndexRoute />} />
        <Route path="dashboard" element={<DashboardRoute />} />
        <Route path="tournaments" element={<Tournaments />} />
        <Route path="tournaments/:id" element={<TournamentDetails />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="global-leaderboard" element={<GlobalLeaderboard />} />
        <Route
          path="create-tournament"
          element={
            <PermissionRoute permission="MANAGE_TOURNAMENTS">
              <CreateTournament />
            </PermissionRoute>
          }
        />
        <Route path="my-registrations" element={<MyRegistrations />} />
        <Route path="my-matches" element={<MyMatches />} />
        <Route path="referee/matches" element={<RefereeMatches />} />
        <Route path="profile" element={<Profile />} />
        <Route
          path="users"
          element={
            <PermissionRoute permission="MANAGE_USERS">
              <Users />
            </PermissionRoute>
          }
        />
        <Route
          path="admin-requests"
          element={
            <SuperAdminRoute>
              <AdminRequests />
            </SuperAdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 3500,
            style: {
              background: "rgba(6, 29, 35, 0.96)",
              color: "#ffffff",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(74, 238, 255, 0.25)",
              borderRadius: "14px",
              padding: "14px 18px",
              boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 20px rgba(74, 238, 255, 0.08)",
              fontSize: "13px",
              fontWeight: "600",
              letterSpacing: "0.015em",
              maxWidth: "420px",
            },
            success: {
              duration: 2500,
              iconTheme: {
                primary: "#10b981",
                secondary: "#061D23",
              },
              style: {
                background: "rgba(6, 29, 35, 0.96)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderLeft: "4px solid #10b981",
                boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.15)",
                color: "#ffffff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#0f172a",
              },
              style: {
                background: "rgba(15, 23, 42, 0.96)",
                border: "1px solid rgba(244, 63, 94, 0.35)",
                borderLeft: "4px solid #f43f5e",
                boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(244, 63, 94, 0.15)",
                color: "#ffffff",
              },
            },
            loading: {
              iconTheme: {
                primary: "#4AEEFF",
                secondary: "#061D23",
              },
              style: {
                background: "rgba(6, 29, 35, 0.96)",
                border: "1px solid rgba(74, 238, 255, 0.35)",
                borderLeft: "4px solid #4AEEFF",
                boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(74, 238, 255, 0.15)",
                color: "#ffffff",
              },
            },
          }}
        />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
