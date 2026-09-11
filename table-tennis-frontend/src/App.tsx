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
import ErrorBoundary from "./components/ErrorBoundary";
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

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - no login required */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="tournaments" element={<PublicTournamentsRoute />} />
        <Route path="tournaments/:id" element={<PublicTournamentDetailsRoute />} />
        <Route path="leaderboard" element={<PublicLeaderboardRoute />} />
        <Route path="global-leaderboard" element={<PublicGlobalLeaderboardRoute />} />
        <Route path="profile/:userId" element={<PublicProfile />} />
        <Route path="players" element={<Players />} />
        {/*<Route path="verify-email" element={<VerifyEmail />} />*/}
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
        <Route path="create-tournament" element={<CreateTournament />} />
        <Route path="my-registrations" element={<MyRegistrations />} />
        <Route path="my-matches" element={<MyMatches />} />
        <Route path="referee/matches" element={<RefereeMatches />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<Users />} />
        <Route path="admin-requests" element={<AdminRequests />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 1800,
            style: {
              background: "#363636",
              color: "#fff",
              borderRadius: "12px",
            },
            success: {
              duration: 1800,
              icon: "🏆",
              style: {
                background: "#10b981",
              },
            },
            error: {
              duration: 3500,
              icon: "❌",
              style: {
                background: "#ef4444",
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
