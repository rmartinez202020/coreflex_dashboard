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
        throw new Error(
          getErrorMessage(data, "Failed to reset password.")
        );
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
      <div style={modal} onClick={(e) => e.stopPropagation()}>
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
              style={button}
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
              style={button}
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

        {message && <p style={successText}>{message}</p>}
        {error && <p style={errorText}>{error}</p>}

        <button
          type="button"
          onClick={handleClose}
          style={closeBtn}
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
  background: "rgba(0, 0, 0, 0.72)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "20px",
};

const modal = {
  width: "100%",
  maxWidth: "400px",
  background:
    "linear-gradient(180deg, rgba(2,6,23,0.98) 0%, rgba(1,10,30,0.98) 100%)",
  padding: "28px 30px 22px",
  borderRadius: "16px",
  textAlign: "center",
  boxShadow:
    "0 0 0 1px rgba(34,197,94,0.15), 0 0 26px rgba(34,197,94,0.18), 0 18px 50px rgba(0,0,0,0.48)",
  border: "1px solid rgba(51, 65, 85, 0.9)",
};

const title = {
  color: "#22c55e",
  fontSize: "29px",
  fontWeight: 800,
  margin: "0 0 10px 0",
  lineHeight: 1.1,
};

const subtitle = {
  color: "#d5dbe5",
  margin: "0 0 18px 0",
  fontSize: "15px",
  lineHeight: 1.45,
};

const fieldWrap = {
  textAlign: "left",
  marginBottom: "12px",
};

const label = {
  display: "block",
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "6px",
};

const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "#020617",
  color: "#ffffff",
  outline: "none",
  fontSize: "15px",
  boxSizing: "border-box",
};

const readOnlyInput = {
  ...input,
  background: "#e5e7eb",
  color: "#111827",
  border: "1px solid #cbd5e1",
  cursor: "default",
};

const button = {
  width: "100%",
  padding: "12px",
  background: "#22c55e",
  border: "none",
  borderRadius: "8px",
  color: "#000000",
  fontWeight: 800,
  fontSize: "18px",
  cursor: "pointer",
  marginTop: "4px",
};

const linkButton = {
  marginTop: "10px",
  background: "transparent",
  border: "none",
  color: "#60a5fa",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "14px",
};

const successText = {
  color: "#22c55e",
  marginTop: "12px",
  fontWeight: 700,
  fontSize: "14px",
};

const errorText = {
  color: "#ff2b2b",
  marginTop: "12px",
  fontWeight: 700,
  fontSize: "14px",
};

const closeBtn = {
  marginTop: "14px",
  background: "transparent",
  border: "1px solid #334155",
  color: "#cbd5e1",
  padding: "8px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
};