import React, { useState, useEffect } from "react";
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
import TournamentRegistration from "./pages/TournamentRegistration";
import CreateTournament from "./pages/CreateTournament";
import MyRegistrations from "./pages/MyRegistrations";
import MyMatches from "./pages/MyMatches";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import UserDetails from "./pages/UserDetails";
import api from "./services/api";
import ResetPassword from "./pages/ResetPassword";
import AdminRequests from "./pages/AdminRequests";
import PublicProfile from "./pages/PublicProfile";
import GlobalLeaderboard from "./pages/GlobalLeaderboard";
import Players from "./pages/Players";
import RefereeMatches from "./pages/RefereeMatches";
import About from "./pages/About";
import ManageAbout from "./pages/ManageAbout";
import AuditLogs from "./pages/AuditLogs";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import VerifyEmail from "./pages/VerifyEmail";

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

const PermissionRoute: React.FC<{
  permission: any;
  children: React.ReactNode;
}> = ({ permission, children }) => {
  const { user, hasPermission } = useAuth();
  if (
    user?.role === "SUPER_ADMIN" ||
    user?.isSuperAdmin ||
    hasPermission(permission)
  ) {
    return <>{children}</>;
  }
  return <Navigate to="/app/dashboard" replace />;
};

const AdminRequestsRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, hasPermission } = useAuth();
  if (
    user?.role === "SUPER_ADMIN" ||
    user?.isSuperAdmin ||
    hasPermission("MANAGE_CLUB_MEMBERSHIPS") ||
    hasPermission("MANAGE_REGISTRATIONS")
  ) {
    return <>{children}</>;
  }
  return <Navigate to="/app/dashboard" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (
    user?.role === "SUPER_ADMIN" ||
    user?.isSuperAdmin ||
    user?.role === "ADMIN"
  ) {
    return <>{children}</>;
  }
  return <Navigate to="/app/dashboard" replace />;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN" || user?.isSuperAdmin) {
    return <>{children}</>;
  }
  return <Navigate to="/app/dashboard" replace />;
};

const UserDetailRouter: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    api
      .get(`/users/${userId}`)
      .then((res) => {
        setRole(res.data?.data?.role || "PLAYER");
      })
      .catch(() => {
        setRole("PLAYER");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-[#4AEEFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role === "REFEREE" || role === "ADMIN" || role === "SUPER_ADMIN") {
    return <UserDetails />;
  }

  return <Profile />;
};

const PlayerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (user?.role !== "PLAYER") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - no login required */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="tournaments" element={<PublicTournamentsRoute />} />
        <Route
          path="tournaments/:id"
          element={<PublicTournamentDetailsRoute />}
        />
        <Route path="leaderboard" element={<PublicLeaderboardRoute />} />
        <Route
          path="global-leaderboard"
          element={<PublicGlobalLeaderboardRoute />}
        />
        <Route path="profile/:userId" element={<PublicProfile />} />
        <Route path="players" element={<Players />} />
      </Route>

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
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

        <Route
          path="tournaments/:id/register"
          element={
            <PlayerRoute>
              <TournamentRegistration />
            </PlayerRoute>
          }
        />
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
        <Route path="players" element={<Players />} />
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
          path="users/:userId"
          element={
            <PermissionRoute permission="MANAGE_USERS">
              <UserDetailRouter />
            </PermissionRoute>
          }
        />
        <Route
          path="admin-requests"
          element={
            <AdminRequestsRoute>
              <AdminRequests />
            </AdminRequestsRoute>
          }
        />
        <Route
          path="admin/about"
          element={
            <AdminRoute>
              <ManageAbout />
            </AdminRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <SuperAdminRoute>
              <AuditLogs />
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
              boxShadow:
                "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 20px rgba(74, 238, 255, 0.08)",
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
                boxShadow:
                  "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.15)",
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
                boxShadow:
                  "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(244, 63, 94, 0.15)",
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
                boxShadow:
                  "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(74, 238, 255, 0.15)",
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
