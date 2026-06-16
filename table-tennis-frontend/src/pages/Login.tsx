import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../services/api";

/* Palette: #061D23 | #4AEEFF | #FFFFFF | #12679E */

const styles: Record<string, React.CSSProperties> = {

  /* ── Full-screen background with TT table image ── */
  root: {
    minHeight: "100vh",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  /* Table tennis table background */
  bgImage: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=1920&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    zIndex: 0,
  },

  /* Dark tinted overlay to keep palette feel */
  bgOverlay: {
    position: "absolute",
    inset: 0,
    background: "#061D23",
    opacity: 0.62,
    zIndex: 1,
  },

  /* Diagonal colour accents over the bg (WTT style) */
  geo1: {
    position: "absolute",
    inset: 0,
    background: "#12679E",
    clipPath: "polygon(0 0, 32% 0, 18% 100%, 0 100%)",
    opacity: 0.28,
    zIndex: 2,
  },
  geo2: {
    position: "absolute",
    inset: 0,
    background: "#4AEEFF",
    clipPath: "polygon(30% 0, 36% 0, 22% 100%, 16% 100%)",
    opacity: 0.22,
    zIndex: 2,
  },

  /* Logo on the left side over background */
  leftBrand: {
    position: "absolute" as const,
    top: "50%",
    left: "6%",
    transform: "translateY(-50%)",
    zIndex: 5,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
  },
  leftAccentLine: {
    width: 140,
    height: 4,
    background: "#4AEEFF",
    margin: "16px 0 4px",
    borderRadius: 2,
  },
  leftAccentLineCross: {
    width: 80,
    height: 4,
    background: "#FFFFFF",
    margin: "6px 0 12px",
    marginLeft: 28,
    borderRadius: 2,
  },
  leftSub: {
    fontSize: 14,
    letterSpacing: 3,
    color: "#FFFFFF",
    textTransform: "uppercase" as const,
    fontWeight: 700,
  },

  /* ── Transparent sign-in card (right side, WTT style) ── */
  card: {
  position: "relative",
  zIndex: 10,
  width: 440,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  padding: "52px 48px",
  boxSizing: "border-box" as const,
  background: "rgba(255, 255, 255, 0.04)", // was 0.08
  backdropFilter: "blur(14px)",            // was 24px
  WebkitBackdropFilter: "blur(14px)",
  borderLeft: "1px solid rgba(255,255,255,0.12)",
},

  /* White top accent bar */
  accentBar: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: "#FFFFFF",
    zIndex: 1,
  },

  /* Logo at top of card */
  logoRow: {
    marginBottom: 24,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    margin: "0 0 28px",
  },

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#4AEEFF",
    textTransform: "uppercase" as const,
    marginBottom: 6,
  },
  inputWrap: {
    position: "relative" as const,
    marginBottom: 18,
  },
  input: {
    width: "100%",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    padding: "13px 16px",
    color: "#FFFFFF",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#4AEEFF",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },

  btnPrimary: {
    width: "100%",
    padding: "14px",
    background: "#FFFFFF",
    color: "#061D23",
    fontWeight: 900,
    letterSpacing: 3,
    fontSize: 14,
    textTransform: "uppercase" as const,
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
    transition: "opacity 0.2s",
    marginBottom: 0,
  },

  tos: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    margin: "12px 0 18px",
    letterSpacing: 0.3,
    lineHeight: 1.6,
  },

  divider: {
    borderColor: "rgba(74,238,255,0.2)",
    margin: "4px 0 12px",
  },

  forgotRow: {
    textAlign: "center" as const,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  btnOutline: {
    width: "100%",
    padding: "12px",
    background: "rgba(6,29,35,0.4)",
    color: "#FFFFFF",
    fontWeight: 700,
    letterSpacing: 2,
    fontSize: 12,
    textTransform: "uppercase" as const,
    border: "1px solid rgba(74,238,255,0.4)",
    borderRadius: 3,
    cursor: "pointer",
    marginTop: 10,
    display: "block",
    textDecoration: "none",
    textAlign: "center" as const,
    boxSizing: "border-box" as const,
    transition: "opacity 0.2s",
  },

  registerRow: {
    textAlign: "center" as const,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  registerLink: {
    color: "#4AEEFF",
    fontWeight: 700,
    textDecoration: "none",
  },

  banner: {
    background: "rgba(6,29,35,0.7)",
    border: "1px solid #4AEEFF",
    borderRadius: 3,
    padding: "10px 14px",
    textAlign: "center" as const,
    marginTop: 10,
  },
  bannerText: { color: "#4AEEFF", fontSize: 12, marginBottom: 6 },
  bannerBtn: {
    background: "none",
    border: "none",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "underline",
    cursor: "pointer",
    letterSpacing: 1,
  },
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "#4AEEFF";
};
const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "rgba(74,238,255,0.35)";
};

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Login successful!");
      navigate("/app/dashboard");
    } catch (error: any) {
      if (error.response?.status === 403) setUnverifiedEmail(email);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: unverifiedEmail });
      toast.success("Verification email sent! Check your inbox.");
      setUnverifiedEmail("");
    } catch {
      toast.error("Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error("Please enter your email address"); return; }
    setIsResetting(true);
    try {
      await api.post("/auth/forgot-password", { email: resetEmail });
      toast.success("Password reset link sent! Check your email.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch {
      /* handled by interceptor */
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={styles.root}>

      {/* ── FULL-SCREEN TABLE TENNIS TABLE BACKGROUND ── */}
      <div style={styles.bgImage} />
      <div style={styles.bgOverlay} />
      <div style={styles.geo1} />
      <div style={styles.geo2} />

      {/* ── LEFT LOGO ── */}
      <div style={styles.leftBrand}>
        <img
          src="/Logo__with_Name.png"
          alt="Sam's College"
          style={{ width: 380, maxWidth: "100%", display: "block" }}
        />
        <div style={styles.leftAccentLine} />
        <div style={styles.leftAccentLineCross} />
        <p style={styles.leftSub}>Table Tennis Management System</p>
      </div>

      {/* ── TRANSPARENT SIGN-IN CARD ── */}
      <div style={styles.card}>
        <div style={styles.accentBar} />

        {!showForgotPassword ? (
          <form onSubmit={handleSubmit}>

            <h2 style={styles.heading}>Account Sign In</h2>

            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrap}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
            </div>

            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <input
                style={{ ...styles.input, paddingRight: 42 }}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...styles.btnPrimary, opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? "Signing In…" : "Sign In"}
            </button>

            <p style={styles.tos}>
              By Signing In, You Agree To Our{" "}
              <span style={{ color: "#4AEEFF", fontWeight: 700 }}>Terms And Conditions</span>{" "}
              And Our{" "}
              <span style={{ color: "#4AEEFF", fontWeight: 700 }}>Privacy Policy</span>.
            </p>

            {unverifiedEmail && (
              <div style={styles.banner}>
                <p style={styles.bannerText}>📧 Your email is not verified yet.</p>
                <button type="button" onClick={handleResend} disabled={resending} style={styles.bannerBtn}>
                  {resending ? "Sending…" : "Resend verification email"}
                </button>
              </div>
            )}

            <hr style={styles.divider} />

            <p style={styles.forgotRow}>Forgot your password ?</p>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              style={styles.btnOutline}
            >
              Reset Password
            </button>

            <Link to="/" style={{ textDecoration: "none" }}>
              <button type="button" style={styles.btnOutline}>
                Back to Home
              </button>
            </Link>

            <p style={styles.registerRow}>
              Don't have an account?{" "}
              <Link to="/register" style={styles.registerLink}>Create Account</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <h2 style={styles.heading}>Reset Password</h2>

            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrap}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email Address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isResetting}
              style={{ ...styles.btnPrimary, opacity: isResetting ? 0.6 : 1 }}
            >
              {isResetting ? "Sending…" : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              style={{ ...styles.btnOutline, marginTop: 14 }}
            >
              ← Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;