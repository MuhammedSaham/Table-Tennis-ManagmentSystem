import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    api
      .get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data?.message || "Email verified! You can now log in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "This link is invalid or has expired.");
      });
  }, [params]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#061D23",
        backgroundImage: "url('/tablenew.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "rgba(6, 29, 35, 0.88)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(74, 238, 255, 0.3)",
          borderRadius: 20,
          padding: 48,
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        }}
      >
        {status === "loading" && (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                border: "3px solid rgba(74, 238, 255, 0.2)",
                borderTopColor: "#4AEEFF",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: "#ffffff", fontSize: "16px" }}>Verifying your email…</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: "#4AEEFF", fontWeight: 800, marginBottom: 8, fontSize: "24px" }}>
              Email Verified!
            </h2>
            <p style={{ color: "#e2e8f0", marginBottom: 28, fontSize: "15px" }}>{message}</p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "12px 32px",
                background: "linear-gradient(135deg, #12679E, #4AEEFF)",
                color: "#061D23",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "15px",
                transition: "transform 0.2s ease",
              }}
            >
              Go to Login
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: "#f87171", fontWeight: 800, marginBottom: 8, fontSize: "24px" }}>
              Verification Failed
            </h2>
            <p style={{ color: "#e2e8f0", marginBottom: 28, fontSize: "15px" }}>{message}</p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "12px 32px",
                background: "#12679E",
                color: "#ffffff",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
