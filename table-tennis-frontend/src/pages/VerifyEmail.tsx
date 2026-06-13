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
      .then(() => {
        setStatus("success");
        setMessage("Email verified! You can now log in.");
      })
      .catch(() => {
        setStatus("error");
        setMessage("This link is invalid or has expired.");
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 48,
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        {status === "loading" && (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                border: "3px solid #e2e8f0",
                borderTopColor: "#0f172a",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: "#64748b" }}>Verifying your email…</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: "#0f172a", fontWeight: 900, marginBottom: 8 }}>
              Email Verified!
            </h2>
            <p style={{ color: "#64748b", marginBottom: 24 }}>{message}</p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "12px 32px",
                background: "#0f172a",
                color: "#fff",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Go to Login
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: "#0f172a", fontWeight: 900, marginBottom: 8 }}>
              Verification Failed
            </h2>
            <p style={{ color: "#64748b", marginBottom: 24 }}>{message}</p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "12px 32px",
                background: "#0f172a",
                color: "#fff",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
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
