// src/components/ForgotPasswordModal.jsx
import React, { useState } from "react";
import { API_URL } from "../config/api";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSendCode = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      setMessage(data.message || "Code sent");
      setStep(2);
    } catch (err) {
      setError("Failed to send code");
    }

    setLoading(false);
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Error");
      }

      setMessage("✅ Password reset successfully");

      setTimeout(() => {
        onClose();
        setStep(1);
        setEmail("");
        setCode("");
        setNewPassword("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    }

    setLoading(false);
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={{ color: "#22c55e" }}>
          CoreFlex IIoTs Platform
        </h2>

        {step === 1 && (
          <>
            <p style={{ color: "#ccc" }}>
              Enter your email to receive a reset code
            </p>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
            />

            <button onClick={handleSendCode} style={button}>
              {loading ? "Sending..." : "Send Code"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ color: "#ccc" }}>
              Enter the code and your new password
            </p>

            <input
              placeholder="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={input}
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={input}
            />

            <button onClick={handleResetPassword} style={button}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

        {message && <p style={{ color: "#22c55e" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <button onClick={onClose} style={closeBtn}>
          Close
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modal = {
  background: "#020617",
  padding: "30px",
  borderRadius: "12px",
  width: "360px",
  textAlign: "center",
  boxShadow: "0 0 25px rgba(34,197,94,0.25)",
  border: "1px solid #1e293b",
};

const input = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#020617",
  color: "#fff",
};

const button = {
  width: "100%",
  padding: "10px",
  background: "#22c55e",
  border: "none",
  borderRadius: "6px",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
};

const closeBtn = {
  marginTop: "10px",
  background: "transparent",
  border: "1px solid #334155",
  color: "#aaa",
  padding: "6px",
  borderRadius: "6px",
};