import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../services/api";

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    background: "#061D23",
  },

  /* ── LEFT panel ── */
  leftPanel: {
    flex: "1 1 55%",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#061D23",
  },
  slab1: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(135deg, #12679E 0%, #061D23 60%)",
    clipPath: "polygon(0 0, 72% 0, 45% 100%, 0 100%)",
  },
  slab2: {
    position: "absolute",
    inset: 0,
    background: "#4AEEFF",
    clipPath: "polygon(68% 0, 80% 0, 53% 100%, 41% 100%)",
    opacity: 0.9,
  },
  slab3: {
    position: "absolute",
    inset: 0,
    background: "#12679E",
    clipPath: "polygon(78% 0, 90% 0, 63% 100%, 51% 100%)",
    opacity: 0.6,
  },
  brandWrap: {
    position: "relative",
    zIndex: 10,
    textAlign: "left",
    color: "#FFFFFF",
    userSelect: "none",
    marginRight: "30%",
  },
  brandName: {
    fontSize: 96,
    fontWeight: 900,
    letterSpacing: 6,
    textTransform: "uppercase" as const,
    color: "#FFFFFF",
    margin: 0,
    lineHeight: 1.05,
    textShadow: "0 0 48px rgba(74,238,255,0.5)",
  },
  brandAccentLine: {
    width: 120,
    height: 4,
    background: "linear-gradient(90deg, #4AEEFF, #12679E)",
    margin: "18px 0 4px",
    borderRadius: 2,
  },
  brandAccentLineCross: {
    width: 70,
    height: 4,
    background: "linear-gradient(90deg, #12679E, #4AEEFF)",
    margin: "6px 0 14px",
    marginLeft: 30,
    borderRadius: 2,
  },
  brandSub: {
    fontSize: 16,
    letterSpacing: 3,
    color: "#4AEEFF",
    marginTop: 6,
    textTransform: "uppercase" as const,
  },

  /* ── RIGHT form panel ── */
  rightPanel: {
    flex: "0 0 540px",
    background: "linear-gradient(160deg, #0d2d3a 0%, #061D23 100%)",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    padding: "44px 60px",
    boxSizing: "border-box" as const,
    position: "relative" as const,
    zIndex: 1,
    height: "100vh",
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: "linear-gradient(90deg, #4AEEFF, #12679E)",
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    margin: "0 0 24px",
  },

  label: {
    display: "block",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#4AEEFF",
    textTransform: "uppercase" as const,
    marginBottom: 7,
  },
  inputWrap: {
    position: "relative" as const,
    marginBottom: 18,
  },
  input: {
    width: "100%",
    background: "#061D23",
    border: "1px solid #12679E",
    borderRadius: 4,
    padding: "14px 18px",
    color: "#FFFFFF",
    fontSize: 17,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 14,
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

  tos: {
    fontSize: 14,
    color: "#9ab8c2",
    margin: "0 0 14px",
    letterSpacing: 0.3,
    lineHeight: 1.5,
  },

  btnPrimary: {
    width: "100%",
    padding: "14px",
    background: "#FFFFFF",
    color: "#061D23",
    fontWeight: 900,
    letterSpacing: 3,
    fontSize: 16,
    textTransform: "uppercase" as const,
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    marginBottom: 0,
    transition: "background 0.2s, color 0.2s",
  },
  btnOutline: {
    width: "100%",
    padding: "13px",
    background: "transparent",
    color: "#FFFFFF",
    fontWeight: 700,
    letterSpacing: 2,
    fontSize: 15,
    textTransform: "uppercase" as const,
    border: "1px solid #12679E",
    borderRadius: 4,
    cursor: "pointer",
    marginTop: 10,
    transition: "border-color 0.2s, color 0.2s",
    display: "block",
    textDecoration: "none",
    textAlign: "center" as const,
    boxSizing: "border-box" as const,
  },

  divider: {
    borderColor: "#12679E",
    margin: "18px 0 14px",
    opacity: 0.4,
  },
  forgotRow: {
    textAlign: "center" as const,
    fontSize: 15,
    color: "#7a9ea8",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  registerRow: {
    textAlign: "center" as const,
    fontSize: 15,
    color: "#7a9ea8",
    marginTop: 18,
    letterSpacing: 0.5,
  },
  registerLink: {
    color: "#4AEEFF",
    fontWeight: 700,
    textDecoration: "none",
  },
  banner: {
    background: "rgba(74,238,255,0.08)",
    border: "1px solid #4AEEFF",
    borderRadius: 4,
    padding: "12px 16px",
    textAlign: "center" as const,
    marginTop: 12,
  },
  bannerText: { color: "#4AEEFF", fontSize: 14, marginBottom: 8 },
  bannerBtn: {
    background: "none",
    border: "none",
    color: "#FFFFFF",
    fontSize: 14,
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
  e.currentTarget.style.borderColor = "#12679E";
};

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      {/* ── LEFT PANEL ── */}
      <div style={styles.leftPanel}>
        <div style={styles.slab1} />
        <div style={styles.slab2} />
        <div style={styles.slab3} />
        <div style={styles.brandWrap}>
          <h1 style={styles.brandName}>Sam's<br />College</h1>
          <div style={styles.brandAccentLine} />
          <div style={styles.brandAccentLineCross} />
          <p style={styles.brandSub}>Table Tennis Management System</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={styles.rightPanel}>
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
                style={{ ...styles.input, paddingRight: 48 }}
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

            <p style={styles.tos}>
              By signing in, you agree to our{" "}
              <span style={{ color: "#4AEEFF", fontWeight: 700 }}>Terms & Conditions</span>{" "}
              and our{" "}
              <span style={{ color: "#4AEEFF", fontWeight: 700 }}>Privacy Policy</span>.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...styles.btnPrimary, opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? "Signing In…" : "Sign In"}
            </button>

            {unverifiedEmail && (
              <div style={styles.banner}>
                <p style={styles.bannerText}>📧 Your email is not verified yet.</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={styles.bannerBtn}
                >
                  {resending ? "Sending…" : "Resend verification email"}
                </button>
              </div>
            )}

            <hr style={styles.divider} />

            <p style={styles.forgotRow}>Forgot your password?</p>

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
              <Link to="/register" style={styles.registerLink}>
                Create Account
              </Link>
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
              style={styles.btnOutline}
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