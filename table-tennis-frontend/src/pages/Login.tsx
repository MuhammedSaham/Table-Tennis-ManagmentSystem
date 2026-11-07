import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../services/api";
import invertedLogo from "../assets/Logo  with Name inverted.png";

/* Palette: #061D23 | #4AEEFF | #FFFFFF | #12679E */

const styles: Record<string, React.CSSProperties> = {
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

  /* ── Local TT table background ── */
  bgImage: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/tablenew.png')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    zIndex: 0,
  },

  /* Subtle dark overlay — keep it light so table stays visible */
  bgOverlay: {
    position: "absolute",
    inset: 10,
    background: "#061D23",
    opacity: 0.2,
    zIndex: 1,
  },

  /* Thin diagonal palette accents on the left edge */
  geo1: {
    position: "absolute",
    top: 0,
    left: "-50px",
    width: "200px",
    height: "100%",
    background: "#12679E",
    opacity: 0.6,
    zIndex: 2,
    transform: "skewX(-30deg)",
    transformOrigin: "left",
  },

  geo2: {
    position: "absolute",
    top: 0,
    left: "120px",
    width: "200px",
    height: "100%",
    background: "#4AEEFF",
    opacity: 0.5,
    zIndex: 2,
    transform: "skewX(-30deg)",
    transformOrigin: "left",
  },

  /* ── Logo on the left half ── */
  leftBrand: {
    position: "absolute" as const,
    top: "40%",
    left: "1%",
    transform: "translateY(-50%)",
    zIndex: 5,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
  },
  /*leftAccentLine: {
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
    fontSize: 18,
    letterSpacing: 2,
    color: "#1b0143",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    textShadow: "0 0px 0px rgba(0,0,0,0.6)",
  },*/

  /* ── Transparent sign-in card ── */
  card: {
    position: "relative",
    zIndex: 20,
    width: "calc(100% - 32px)",
    maxWidth: 440,
    padding: "22px 28px",
    margin: "20px 60px 20px 16px",
    boxSizing: "border-box",
    borderRadius: 20,

    background: "rgba(5, 45, 65, 0.58)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",

    border: "1.5px solid rgba(220, 245, 255, 0.65)",
    boxShadow: "0 8px 30px rgba(0, 15, 30, 0.15)",

    color: "#FFFFFF",
  },
  cardBrand: {
    textAlign: "center",
    marginBottom: 12,
  },

  cardLogo: {
    width: 190,
    maxWidth: "75%",
    height: "auto",
    display: "block",
    margin: "0 auto",
  },

  cardSubtitle: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "center",
    margin: "6px 0 0",
  },

  welcomeTitle: {
    color: "#35EFFF",
    fontSize: 30,
    fontWeight: 800,
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
    margin: "12px 0 6px",
    fontFamily: "Arial, sans-serif",
  },

  welcomeSubtitle: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
    margin: "0 0 24px",
  },

  inputIcon: {
    position: "absolute",
    left: 15,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    color: "#647F9F",
    pointerEvents: "none",
  },

  compactLabel: {
    display: "block",
    color: "#35EFFF",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 7,
  },

  compactInput: {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #C4D3E2",
    borderRadius: 9,
    padding: "13px 42px 13px 46px",
    color: "#082443",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },

  compactButton: {
    width: "100%",
    padding: "14px",
    background: "#0057C8",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 16,
    border: "none",
    borderRadius: 9,
    cursor: "pointer",
  },
  /* White top accent bar */
  accentBar: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 0,
    background: "#FFFFFF",
    zIndex: 1,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    margin: "0 0 24px",
    textShadow: "0 1px 8px rgba(0,0,0,0.5)",
  },

  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: "#35EFFF",
    textTransform: "uppercase" as const,
    marginBottom: 6,
  },
  inputWrap: {
    position: "relative" as const,
    marginBottom: 16,
    background: "#FFFFFF",
    border: "1px solid rgba(220,235,245,0.8)",
    borderRadius: 10,
  },
  /* Inputs: semi-transparent so background bleeds through */
  input: {
    width: "100%",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 3,
    padding: "13px 16px",
    color: "#102C40",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s, background 0.2s",
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
    color: "#082A3B",
    fontWeight: 800,
    letterSpacing: 2,
    fontSize: 15,
    textTransform: "uppercase" as const,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    transition: "opacity 0.2s",
    marginBottom: 0,
  },

  tos: {
    fontSize: 13,
    color: "#FFFFFF",
    margin: "12px 0 16px",
    letterSpacing: 0.3,
    lineHeight: 1.6,
  },

  divider: {
    borderColor: "rgba(255,255,255,0.15)",
    margin: "4px 0 12px",
  },

  forgotRow: {
    textAlign: "center" as const,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  btnOutline: {
    width: "100%",
    padding: "12px",
    background: "rgba(6,29,35,0.30)",
    color: "#FFFFFF",
    fontWeight: 700,
    letterSpacing: 2,
    fontSize: 12,
    textTransform: "uppercase" as const,
    border: "1px solid rgba(255,255,255,0.30)",
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
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 14,
    letterSpacing: 0.5,
  },
  registerLink: {
    color: "#35EFFF",
    fontWeight: 700,
    textDecoration: "none",
  },

  banner: {
    background: "rgba(6,29,35,0.55)",
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
  e.currentTarget.style.background = "rgba(6,29,35,0.55)";
};
const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
  e.currentTarget.style.background = "rgba(6,29,35,0.45)";
};

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
const EmailIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loggedUser = await login(email, password);
      toast.success("Login successful!");
      if (loggedUser?.role === "REFEREE") {
        navigate("/app/referee/matches");
      } else {
        navigate("/app/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }
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
    <>
      <style>{`
      @media (max-width: 900px) {
        .login-root {
          min-height: 100dvh !important;
          height: auto !important;
          overflow-y: auto !important;
        }

        .login-card {
          width: calc(100% - 24px) !important;
          max-width: 440px !important;
          margin: 12px !important;
          padding: 18px 20px !important;
        }
      }
    `}</style>

      <div className="login-root" style={styles.root}>
        {/* ── BACKGROUND: local TT table image ── */}
        <div style={styles.bgImage} />
        <div style={styles.bgOverlay} />
        <div style={styles.geo1} />
        <div style={styles.geo2} />

        {/* ── LEFT: Sam's College logo ── */}
        <div style={styles.leftBrand}>
          <img
            src="/Logo__with_Name.png"
            alt="Sam's College"
            style={{ width: 350, maxWidth: "90%", display: "block" }}
          />
          <div style={styles.leftAccentLine} />
          <div style={styles.leftAccentLineCross} />
          {/* <p style={styles.leftSub}>Table Tennis Management System</p> */}
        </div>

        {/* ── RIGHT: Transparent sign-in card ── */}
        <div style={styles.card}>
          <div style={styles.accentBar} />

          {!showForgotPassword ? (
            <form onSubmit={handleSubmit}>
              {/* Logo */}
              <div style={styles.cardBrand}>
                <img
                  src={invertedLogo}
                  alt="Sam's College"
                  style={styles.cardLogo}
                />

                <p style={styles.cardSubtitle}>
                  Table Tennis Management System
                </p>
              </div>

              {/* Heading */}
              <h2 style={styles.welcomeTitle}>Welcome Back</h2>

              <p style={styles.welcomeSubtitle}>Sign in to your account</p>

              {/* Email */}
              <label htmlFor="login-email" style={styles.compactLabel}>
                Email Address
              </label>

              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <EmailIcon />
                </span>

                <input
                  id="login-email"
                  style={styles.compactInput}
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <label htmlFor="login-password" style={styles.compactLabel}>
                Password
              </label>

              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <LockIcon />
                </span>

                <input
                  id="login-password"
                  style={styles.compactInput}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  style={{ ...styles.eyeBtn, color: "#647F9F" }}
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              {/* Forgot password */}
              <div style={{ textAlign: "right", margin: "0 0 18px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotPassword(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#35EFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  ...styles.compactButton,
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? "Signing In…" : "Sign In"}
              </button>

              {/* Create Account */}
              <p
                style={{
                  textAlign: "center",
                  margin: "18px 0 14px",
                  fontSize: 14,
                  color: "#FFFFFF",
                }}
              >
                Don't have an account?{" "}
                <Link
                  to="/register"
                  style={{
                    color: "#35EFFF",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Create Account
                </Link>
              </p>

              <hr
                style={{
                  border: 0,
                  borderTop: "1px solid rgba(255,255,255,0.5)",
                  margin: "12px 0",
                }}
              />

              {/* Terms */}
              <p
                style={{
                  textAlign: "center",
                  color: "#FFFFFF",
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: "12px 0",
                }}
              >
                By signing in, you agree to our{" "}
                <span style={{ color: "#35EFFF", fontWeight: 700 }}>
                  Terms and Conditions
                </span>{" "}
                and{" "}
                <span style={{ color: "#35EFFF", fontWeight: 700 }}>
                  Privacy Policy
                </span>
                .
              </p>

              {/* Back Home */}
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <Link
                  to="/"
                  style={{
                    color: "#35EFFF",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  ← Back to Home
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <h2 style={styles.heading}>Reset Password</h2>

              <label htmlFor="reset-email" style={styles.label}>
                Email Address
              </label>

              <div
                style={{
                  ...styles.inputWrap,
                  background: "#FFFFFF",
                  border: "1px solid #D5E2EC",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    ...styles.inputIcon,
                    color: "#315775",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                >
                  <EmailIcon />
                </span>

                <input
                  id="reset-email"
                  style={{
                    ...styles.input,
                    background: "transparent",
                    color: "#082A3B",
                    paddingLeft: 48,
                  }}
                  type="email"
                  placeholder="Enter your email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  autoComplete="email"
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

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#35EFFF",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "6px 0",
                  }}
                >
                  <span style={{ fontSize: 20 }}>←</span>
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
