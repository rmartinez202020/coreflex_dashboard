import { useState } from "react";
import { API_URL } from "../config/api";

export default function useLaunchedCustomerDashboardTenantAuth({
  publicDashSlug,
  publicDashLaunchId,
  onResetSensors,
}) {
  const [isTenantAuthenticated, setIsTenantAuthenticated] = useState(false);
  const [tenantName, setTenantName] = useState("Portal User");
  const [tenantAccessLevel, setTenantAccessLevel] = useState("read_only");

  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPassword, setTenantPassword] = useState("");
  const [tenantAuthLoading, setTenantAuthLoading] = useState(false);
  const [tenantAuthError, setTenantAuthError] = useState("");

  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");

  const resetTenantAuthState = () => {
    setIsTenantAuthenticated(false);
    setTenantName("Portal User");
    setTenantAccessLevel("read_only");
    setTenantAuthError("");
    setRequiresPasswordChange(false);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordChangeError("");
    setTenantPassword("");

    if (typeof onResetSensors === "function") {
      onResetSensors();
    }
  };

  const handleTenantLogin = async () => {
    const email = String(tenantEmail || "").trim().toLowerCase();
    const password = String(tenantPassword || "").trim();

    if (!email || !password) {
      setTenantAuthError("Please enter your email and password.");
      return;
    }

    setTenantAuthLoading(true);
    setTenantAuthError("");
    setPasswordChangeError("");

    try {
      const res = await fetch(
        `${API_URL}/customers-dashboards/tenant-access/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dashboard_slug: publicDashSlug,
            public_launch_id: publicDashLaunchId,
            email,
            password,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          String(
            data?.detail ||
              data?.error ||
              "Tenant login failed. Please verify your credentials."
          )
        );
      }

      const mustChange = Boolean(data?.must_change_password);

      setTenantName(
        String(data?.tenant_name || data?.full_name || email || "Portal User")
      );
      setTenantAccessLevel(
        String(data?.access_level || "read_only").trim() || "read_only"
      );

      if (mustChange) {
        setRequiresPasswordChange(true);
        setIsTenantAuthenticated(false);
        return;
      }

      setRequiresPasswordChange(false);
      setIsTenantAuthenticated(true);
    } catch (err) {
      console.error("❌ Tenant login failed:", err);
      setTenantAuthError(String(err?.message || err));
    } finally {
      setTenantAuthLoading(false);
    }
  };

  const handleTenantSetPassword = async () => {
    const email = String(tenantEmail || "").trim().toLowerCase();
    const currentPassword = String(tenantPassword || "").trim();
    const nextPassword = String(newPassword || "").trim();
    const confirmPassword = String(confirmNewPassword || "").trim();

    if (!nextPassword || !confirmPassword) {
      setPasswordChangeError("Please enter and confirm the new password.");
      return;
    }

    if (nextPassword.length < 8) {
      setPasswordChangeError("New password must be at least 8 characters.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordChangeError("New password and confirmation do not match.");
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeError("");
    setTenantAuthError("");

    try {
      const res = await fetch(
        `${API_URL}/customers-dashboards/tenant-access/set-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dashboard_slug: publicDashSlug,
            public_launch_id: publicDashLaunchId,
            email,
            temporary_password: currentPassword,
            new_password: nextPassword,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          String(
            data?.detail || data?.error || "Failed to set the new password."
          )
        );
      }

      setTenantPassword(nextPassword);
      setNewPassword("");
      setConfirmNewPassword("");
      setRequiresPasswordChange(false);
      setTenantName(
        String(data?.tenant_name || data?.full_name || email || "Portal User")
      );
      setTenantAccessLevel(
        String(data?.access_level || "read_only").trim() || "read_only"
      );
      setIsTenantAuthenticated(true);
    } catch (err) {
      console.error("❌ Tenant password change failed:", err);
      setPasswordChangeError(String(err?.message || err));
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  return {
    isTenantAuthenticated,
    tenantName,
    tenantAccessLevel,

    tenantEmail,
    setTenantEmail,
    tenantPassword,
    setTenantPassword,
    tenantAuthLoading,
    tenantAuthError,
    setTenantAuthError,

    requiresPasswordChange,
    setRequiresPasswordChange,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    passwordChangeLoading,
    passwordChangeError,
    setPasswordChangeError,

    resetTenantAuthState,
    handleTenantLogin,
    handleTenantSetPassword,
  };
}