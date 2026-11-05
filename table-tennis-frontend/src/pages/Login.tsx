import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../services/api";

/* Palette: #061D23 | #4AEEFF | #FFFFFF | #12679E */

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    overflowX: "hidden",
    overflowY: "auto",
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

  rightPanel: {
    position: "relative",
    zIndex: 10,

    width: "36%",
    minWidth: "540px",
    minHeight: "100vh",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    padding: "24px 20px",

    background: "rgba(0, 175, 210, 0.45)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",

    boxSizing: "border-box" as const,
  },

  /* ── Transparent sign-in card ── */
  card: {
    position: "relative",
    zIndex: 20,

    width: "420px",
    maxWidth: "100%",

    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",

    padding: "18px 24px",

    boxSizing: "border-box" as const,

    background: "rgba(166, 211, 237, 0.78)",

    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",

    border: "1.5px solid rgba(255,255,255,0.85)",
    borderRadius: "18px",

    boxShadow: "none",

    color: "#082445",
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

  cardBrand: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    textAlign: "center" as const,
    marginBottom: "8px",
  },

  cardLogo: {
    width: "160px",
    maxWidth: "100%",
    height: "auto",
    objectFit: "contain" as const,
    marginBottom: "4px",
  },

  cardSubtitle: {
    fontSize: "13px",
    color: "#173B5E",
    fontWeight: 500,
    margin: "0",
  },

  cardDivider: {
    width: "100%",
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.65)",
    margin: "12px 0 16px",
  },

  welcomeTitle: {
    fontSize: "27px",
    fontWeight: 800,
    color: "#071D3A",
    textAlign: "center" as const,
    margin: "0 0 4px",
  },

  welcomeSubtitle: {
    fontSize: "14px",
    color: "#173B5E",
    textAlign: "center" as const,
    margin: "0 0 14px",
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
    fontSize: 14,
    fontWeight: 700,
    color: "#071D3A",
    marginBottom: 7,
  },
  inputWrap: {
    position: "relative" as const,
    marginBottom: 12,
  },
  /* Inputs: semi-transparent so background bleeds through */
  input: {
    width: "100%",
    height: "46px",

    background: "#FFFFFF",
    border: "1px solid #C5D3E3",
    borderRadius: "8px",

    padding: "12px 42px",

    color: "#173B5E",
    fontSize: "14px",

    outline: "none",
    boxSizing: "border-box" as const,

    transition: "border-color 0.2s, box-shadow 0.2s",
  },

  inputIcon: {
    position: "absolute" as const,
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",

    color: "#647A95",

    display: "flex",
    alignItems: "center",

    pointerEvents: "none" as const,
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",

    background: "none",
    border: "none",
    cursor: "pointer",

    color: "#647A95",
    padding: 0,

    display: "flex",
    alignItems: "center",
  },

  btnPrimary: {
    width: "100%",
    padding: "14px",
    background: "#0057C8",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 0,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 0.2s",
    marginTop: 8,
    marginBottom: 8,
  },

  tos: {
    fontSize: 14,
    color: "#244461",
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
    color: "#071D3A",
    marginTop: 14,
    letterSpacing: 0.5,
  },
  registerLink: {
    color: "#0057C8",
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
  e.currentTarget.style.borderColor = "#1264C8";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(18,100,200,0.12)";
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "#C5D3E3";
  e.currentTarget.style.boxShadow = "none";
};

const EmailIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

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
  /* Tablet */
  @media (min-width: 601px) and (max-width: 1100px) {
    .login-root {
      min-height: 100dvh !important;
      height: auto !important;
    }

    .login-right-panel {
      width: 48% !important;
      min-width: 0 !important;
      padding: 16px 12px !important;
    }

    .login-card {
      width: 100% !important;
      max-width: 420px !important;
      padding: 18px !important;
    }
  }

  /* Mobile */
  @media (max-width: 600px) {
    .login-root {
      display: flex !important;
      flex-direction: column !important;
      min-height: 100dvh !important;
      height: auto !important;
      overflow-x: hidden !important;
    }

    .login-left-brand {
      display: none !important;
    }

    .login-right-panel {
      width: 100% !important;
      min-width: 0 !important;
      min-height: 100dvh !important;
      padding: 20px 12px !important;

      background: rgba(3, 39, 65, 0.82) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
    }

    .login-card {
      width: 100% !important;
      max-width: 420px !important;
      padding: 18px !important;
      border-radius: 16px !important;
    }

    .login-card-logo {
      width: 140px !important;
    }

    .login-bg-image {
      background-position: center !important;
    }
      .login-sign-in {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  min-height: 46px !important;
  padding: 10px 16px !important;
}
  }
    @media (max-width: 600px) {

  .login-right-panel {
    padding: 12px 10px !important;
  }

  .login-card {
    padding: 14px 18px !important;
  }

  .login-card-logo {
    width: 115px !important;
  }

  .login-card-brand {
    margin-bottom: 4px !important;
  }

  .login-welcome-title {
    font-size: 25px !important;
    margin: 4px 0 !important;
  }

  .login-welcome-subtitle {
    margin: 0 0 12px !important;
  }

  .login-input-wrap {
    margin-bottom: 8px !important;
  }

  .login-register-row {
    margin: 8px 0 !important;
  }

  .login-tos {
    margin: 8px 0 !important;
    line-height: 1.4 !important;
  }

  .login-back-home {
    margin-top: 8px !important;
  }
}
`}</style>
      <div className="login-root" style={styles.root}>
        {/* ── BACKGROUND: local TT table image ── */}
        <div className="login-bg-image" style={styles.bgImage} />
        <div style={styles.bgOverlay} />
        <div style={styles.geo1} />
        <div style={styles.geo2} />

        {/* ── LEFT: Sam's College logo ── */}
        <div className="login-left-brand" style={styles.leftBrand}>
          <img
            src="/Logo__with_Name.png"
            alt="Sam's College"
            style={{ width: 350, maxWidth: "90%", display: "block" }}
          />
          <div style={styles.leftAccentLine} />
          <div style={styles.leftAccentLineCross} />
          {/* <p style={styles.leftSub}>Table Tennis Management System</p> */}
        </div>

        {/* ── RIGHT: Dark-blue panel ── */}
        <div className="login-right-panel" style={styles.rightPanel}>
          {/* Light-blue glass login card */}
          <div className="login-card" style={styles.card}>
            <div style={styles.accentBar} />
            {!showForgotPassword ? (
              <form onSubmit={handleSubmit}>
                {/* Sam's College branding */}
                <div style={styles.cardBrand}>
                  <img
                    src="/Logo__with_Name.png"
                    alt="Sam's College"
                    style={styles.cardLogo}
                  />

                  <p style={styles.cardSubtitle}>
                    Table Tennis Management System
                  </p>
                </div>

                {/*<hr style={styles.cardDivider} />*/}

                {/* Welcome heading */}
                <h2 style={styles.welcomeTitle}>Welcome Back</h2>

                <p style={styles.welcomeSubtitle}>Sign in to your account</p>
                <label htmlFor="login-email" style={styles.label}>
                  Email Address
                </label>

                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <EmailIcon />
                  </span>

                  <input
                    id="login-email"
                    style={styles.input}
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoComplete="email"
                    required
                  />
                </div>

                <label htmlFor="login-password" style={styles.label}>
                  Password
                </label>

                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <LockIcon />
                  </span>

                  <input
                    id="login-password"
                    style={styles.input}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    style={styles.eyeBtn}
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>

                <div style={{ textAlign: "right", margin: "4px 0 14px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotPassword(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0057C8",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  className="login-sign-in"
                  type="submit"
                  disabled={isLoading}
                  style={{ ...styles.btnPrimary, opacity: isLoading ? 0.6 : 1 }}
                >
                  {isLoading ? "Signing In…" : "Sign In"}
                </button>

                <p style={styles.registerRow}>
                  Don't have an account?{" "}
                  <Link to="/register" style={styles.registerLink}>
                    Create Account
                  </Link>
                </p>

                <hr style={styles.divider} />

                <p style={styles.tos}>
                  By Signing In, You Agree To Our{" "}
                  <span style={{ color: "#0057C8", fontWeight: 700 }}>
                    Terms And Conditions
                  </span>{" "}
                  And Our{" "}
                  <span style={{ color: "#0057C8", fontWeight: 700 }}>
                    Privacy Policy
                  </span>
                  .
                </p>

                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <Link
                    to="/"
                    style={{
                      color: "#0057C8",
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>←</span>
                    Back to Home
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <h2 style={styles.heading}>Reset Password</h2>

                <label htmlFor="reset-email" style={styles.label}>
                  Email Address
                </label>

                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <EmailIcon />
                  </span>

                  <input
                    id="reset-email"
                    style={styles.input}
                    type="email"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoComplete="email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isResetting}
                  style={{
                    ...styles.btnPrimary,
                    opacity: isResetting ? 0.6 : 1,
                  }}
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
      </div>
    </>
  );
};

export default Login;
