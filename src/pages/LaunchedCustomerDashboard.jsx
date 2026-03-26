// src/pages/LaunchedCustomerDashboard.jsx
import React from "react";
import DashboardCanvas from "../components/DashboardCanvas";
import PortalTopBar from "./PortalTopBar.jsx";
import useLaunchedCustomerDashboard from "./useLaunchedCustomerDashboard";

export default function LaunchedCustomerDashboard() {
  const {
    privateDashId,
    publicDashSlug,
    publicDashLaunchId,
    isPublicLaunch,

    sensorsData,
    droppedTanks,
    setDroppedTanks,

    loading,
    fatalError,

    resolvedDashboardId,
    dashboardTitle,

    isTenantAuthenticated,
    tenantName,
    tenantAccessLevel,

    tenantEmail,
    setTenantEmail,
    tenantPassword,
    setTenantPassword,
    tenantAuthLoading,
    tenantAuthError,

    requiresPasswordChange,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    passwordChangeLoading,
    passwordChangeError,

    hasAlarmLog,
    shouldHideDashboard,

    resetTenantAuthState,
    handleOpenAlarmLog,
    handleTenantLogin,
    handleTenantSetPassword,
  } = useLaunchedCustomerDashboard();

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
      >
        Loading dashboard…
      </div>
    );
  }

  if (fatalError) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "white",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Launch error</div>
          <div style={{ opacity: 0.85 }}>{fatalError}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "white",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PortalTopBar
        dashboardName={dashboardTitle}
        tenantName={tenantName}
        accessLevel={tenantAccessLevel}
        isAuthenticated={!shouldHideDashboard}
        hasAlarmLog={hasAlarmLog}
        onOpenAlarmLog={handleOpenAlarmLog}
        onLogin={() => {}}
        onLogout={() => {
          if (isPublicLaunch) {
            resetTenantAuthState();
            return;
          }
          window.close();
        }}
      />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          background: "white",
          position: "relative",
        }}
      >
        {shouldHideDashboard ? (
          <PublicPortalAccessCard
            requiresPasswordChange={requiresPasswordChange}
            tenantEmail={tenantEmail}
            setTenantEmail={setTenantEmail}
            tenantPassword={tenantPassword}
            setTenantPassword={setTenantPassword}
            tenantAuthLoading={tenantAuthLoading}
            tenantAuthError={tenantAuthError}
            handleTenantLogin={handleTenantLogin}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmNewPassword={confirmNewPassword}
            setConfirmNewPassword={setConfirmNewPassword}
            passwordChangeLoading={passwordChangeLoading}
            passwordChangeError={passwordChangeError}
            setRequiresPasswordChange={() => {}}
            clearPasswordChangeState={() => {
              setNewPassword("");
              setConfirmNewPassword("");
            }}
            handleTenantSetPassword={handleTenantSetPassword}
          />
        ) : (
          <DashboardCanvas
            dashboardMode="play"
            embedMode={true}
            dashboardId={resolvedDashboardId}
            activeDashboardId={resolvedDashboardId}
            droppedTanks={droppedTanks}
            setDroppedTanks={setDroppedTanks}
            sensorsData={sensorsData}
            sensors={[]}
            selectedIds={[]}
            setSelectedIds={() => {}}
            selectedTank={null}
            setSelectedTank={() => {}}
            dragDelta={{ x: 0, y: 0 }}
            setDragDelta={() => {}}
            contextMenu={{ visible: false }}
            setContextMenu={() => {}}
            activeSiloId={null}
            setActiveSiloId={() => {}}
            setShowSiloProps={() => {}}
            handleSelect={() => {}}
            handleRightClick={() => {}}
            handleDrop={() => {}}
            handleDragMove={() => {}}
            handleDragEnd={() => {}}
            handleCanvasMouseDown={() => {}}
            handleCanvasMouseMove={() => {}}
            handleCanvasMouseUp={() => {}}
            getLayerScore={(o) => o.zIndex || 1}
            selectionBox={null}
            hideContextMenu={() => {}}
            guides={[]}
            onOpenDisplaySettings={() => {}}
            onOpenGraphicDisplaySettings={() => {}}
            isPublicLaunch={isPublicLaunch}
            publicDashSlug={publicDashSlug}
            publicDashLaunchId={publicDashLaunchId}
            tenantEmail={tenantEmail}
            isTenantAuthenticated={isTenantAuthenticated}
            tenantAccessLevel={tenantAccessLevel}
          />
        )}
      </div>
    </div>
  );
}

function PublicPortalAccessCard({
  requiresPasswordChange,
  tenantEmail,
  setTenantEmail,
  tenantPassword,
  setTenantPassword,
  tenantAuthLoading,
  tenantAuthError,
  handleTenantLogin,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  passwordChangeLoading,
  passwordChangeError,
  setRequiresPasswordChange,
  clearPasswordChangeState,
  handleTenantSetPassword,
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "white",
          border: "1px solid #dbe3ea",
          borderRadius: 18,
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.10)",
          padding: 28,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Customer Portal Access
        </div>

        <div
          style={{
            fontSize: 15,
            color: "#334155",
            lineHeight: 1.6,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Please sign in to access this dashboard.
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          This dashboard is available only to authorized tenant users.
        </div>

        {!requiresPasswordChange ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                placeholder="Enter your tenant email"
                style={inputStyle}
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={tenantPassword}
                onChange={(e) => setTenantPassword(e.target.value)}
                placeholder="Enter your password"
                style={inputStyle}
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !tenantAuthLoading) {
                    handleTenantLogin();
                  }
                }}
              />
            </div>

            {tenantAuthError ? (
              <div style={errorBoxStyle}>{tenantAuthError}</div>
            ) : null}

            <button
              type="button"
              onClick={handleTenantLogin}
              disabled={tenantAuthLoading}
              style={{
                ...primaryButtonStyle,
                width: "100%",
                background: tenantAuthLoading ? "#94a3b8" : "#374151",
                cursor: tenantAuthLoading ? "not-allowed" : "pointer",
              }}
            >
              {tenantAuthLoading ? "Signing In..." : "Sign In"}
            </button>
          </>
        ) : (
          <>
            <div style={infoBoxStyle}>
              For security, please create a new password before opening this
              dashboard.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={inputStyle}
                autoComplete="new-password"
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                style={inputStyle}
                autoComplete="new-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !passwordChangeLoading) {
                    handleTenantSetPassword();
                  }
                }}
              />
            </div>

            {passwordChangeError ? (
              <div style={errorBoxStyle}>{passwordChangeError}</div>
            ) : null}

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setRequiresPasswordChange(false);
                  clearPasswordChangeState();
                }}
                disabled={passwordChangeLoading}
                style={{
                  ...secondaryButtonStyle,
                  flex: 1,
                  cursor: passwordChangeLoading ? "not-allowed" : "pointer",
                }}
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleTenantSetPassword}
                disabled={passwordChangeLoading}
                style={{
                  ...primaryButtonStyle,
                  flex: 1.4,
                  background: passwordChangeLoading ? "#94a3b8" : "#374151",
                  cursor: passwordChangeLoading ? "not-allowed" : "pointer",
                }}
              >
                {passwordChangeLoading ? "Saving..." : "Save New Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  height: 44,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  padding: "0 14px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const errorBoxStyle = {
  marginBottom: 14,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13,
  lineHeight: 1.5,
};

const infoBoxStyle = {
  marginBottom: 16,
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#1e3a8a",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 13,
  lineHeight: 1.6,
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 46,
  borderRadius: 10,
  border: "1px solid #475569",
  color: "white",
  fontSize: 15,
  fontWeight: 700,
};

const secondaryButtonStyle = {
  height: 46,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#334155",
  fontSize: 14,
  fontWeight: 700,
};