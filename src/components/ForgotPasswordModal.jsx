// src/components/ForgotPasswordModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../config/api";

function getErrorMessage(data, fallback) {
  if (!data) return fallback;

  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail.trim();
  }

  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0];

    if (typeof first === "string" && first.trim()) {
      return first.trim();
    }

    if (first && typeof first === "object") {
      const msg = String(first.msg || "").trim().toLowerCase();

      if (msg.includes("valid email")) {
        return "Please enter a valid email address.";
      }

      if (msg) {
        return first.msg;
      }
    }

    return fallback;
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error.trim();
  }

  return fallback;
}

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      setStep(1);
      setEmail("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setLoading(false);
      setMessage("");
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    onClose?.();
  };

  const handleSendCode = async () => {
    const emailClean = String(email || "").trim().toLowerCase();

    if (!emailClean) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailClean }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to send the temporary reset code.")
        );
      }

      setEmail(emailClean);
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(
        data?.message ||
          "If an account exists for this email, a temporary code has been sent."
      );
      setError("");
      setStep(2);
    } catch (err) {
      setError(err?.message || "Failed to send the temporary reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const emailClean = String(email || "").trim().toLowerCase();
    const codeClean = String(code || "").trim();
    const newPass = String(newPassword || "");
    const confirmPass = String(confirmPassword || "");

    if (!emailClean) {
      setError("Email is required.");
      return;
    }

    if (!codeClean) {
      setError("Please enter the reset code.");
      return;
    }

    if (!newPass) {
      setError("Please enter your new password.");
      return;
    }

    if (newPass.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (!confirmPass) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPass !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailClean,
          code: codeClean,
          new_password: newPass,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(getErrorMessage(data, "Failed to reset password."));
      }

      setMessage("✅ Password reset successfully. You can now log in.");
      setError("");

      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        onClose?.();
      }, 1600);
    } catch (err) {
      setError(err?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={card}>
        <h2 style={title}>CoreFlex IIoTs Platform</h2>

        {step === 1 && (
          <>
            <p style={subtitle}>
              Enter the email associated with your account to receive a temporary
              reset code.
            </p>

            <div style={fieldWrap}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={input}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <button
              type="button"
              onClick={handleSendCode}
              style={primaryButton}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Temporary Code"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={subtitle}>
              Enter the temporary code from your email and create a new password.
            </p>

            <div style={fieldWrap}>
              <label style={label}>Email</label>
              <input
                type="email"
                value={email}
                style={readOnlyInput}
                readOnly
                disabled
              />
            </div>

            <div style={fieldWrap}>
              <label style={label}>Reset Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={input}
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>

            <div style={fieldWrap}>
              <label style={label}>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={input}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div style={fieldWrap}>
              <label style={label}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={input}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button
              type="button"
              onClick={handleResetPassword}
              style={primaryButton}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (loading) return;
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
                setMessage("");
                setError("");
                setStep(1);
              }}
              style={linkButton}
            >
              Send a new code
            </button>
          </>
        )}

        {message && <div style={successBox}>{message}</div>}
        {error && <div style={errorBox}>{error}</div>}

        <button
          type="button"
          onClick={handleClose}
          style={closeButton}
          disabled={loading}
        >
          Close
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.58)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "20px",
};

const card = {
  width: "100%",
  maxWidth: "460px",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.30)",
  background: "rgba(255,255,255,0.30)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
  padding: "30px 32px 24px",
  textAlign: "center",
};

const title = {
  fontSize: "2.05rem",
  fontWeight: 800,
  color: "#020617",
  margin: "0 0 12px 0",
  lineHeight: 1.08,
  letterSpacing: "-0.02em",
};

const subtitle = {
  color: "#1e293b",
  fontSize: "15px",
  fontWeight: 600,
  lineHeight: 1.5,
  margin: "0 0 20px 0",
};

const fieldWrap = {
  textAlign: "left",
  marginBottom: "14px",
};

const label = {
  display: "block",
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: 700,
  marginBottom: "8px",
};

const input = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  padding: "14px 16px",
  fontSize: "16px",
  color: "#0f172a",
  background: "rgba(255,255,255,0.96)",
  boxSizing: "border-box",
  outline: "none",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const readOnlyInput = {
  ...input,
  background: "#e5e7eb",
  color: "#334155",
  cursor: "default",
};

const primaryButton = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "1.1rem",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: "4px",
  boxShadow: "0 6px 18px rgba(37,99,235,0.28)",
};

const linkButton = {
  marginTop: "12px",
  background: "transparent",
  border: "none",
  color: "#1d4ed8",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "14px",
};

const successBox = {
  marginTop: "14px",
  background: "rgba(220,252,231,0.95)",
  color: "#166534",
  border: "1px solid #bbf7d0",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "14px",
  fontWeight: 700,
};

const errorBox = {
  marginTop: "14px",
  background: "rgba(254,226,226,0.96)",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "14px",
  fontWeight: 700,
};

const closeButton = {
  marginTop: "14px",
  background: "transparent",
  border: "1px solid rgba(15,23,42,0.18)",
  color: "#0f172a",
  padding: "9px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 700,
};