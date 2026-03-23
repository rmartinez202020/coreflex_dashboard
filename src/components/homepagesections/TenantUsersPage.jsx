// src/components/homepagesections/TenantUsersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

const ACCESS_OPTIONS = [
  { value: "read", label: "Read" },
  { value: "read_control", label: "Read + Control" },
];

// ✅ Mock dashboards still include:
// - customerName
// - createdBy
// Later this can also come from backend
const MOCK_DASHBOARDS = [
  {
    id: "1",
    name: "Main Dashboard",
    customerName: "COREFLEX LAB",
    createdBy: "roquemartinezpolanco@gmail.com",
  },
  {
    id: "2",
    name: "Utilities Room",
    customerName: "COREFLEX LAB",
    createdBy: "roquemartinezpolanco@gmail.com",
  },
  {
    id: "3",
    name: "Pump Station",
    customerName: "COREFLEX LAB",
    createdBy: "roquemartinezpolanco@gmail.com",
  },

  // ❌ these will not appear for roquemartinezpolanco@gmail.com
  {
    id: "4",
    name: "Boiler Room",
    customerName: "COREFLEX LAB",
    createdBy: "anotheradmin@gmail.com",
  },
  {
    id: "5",
    name: "Warehouse",
    customerName: "MAIN PLANT",
    createdBy: "anotheradmin@gmail.com",
  },
];

function normalizeAccess(value) {
  const v = String(value || "").toLowerCase();
  if (v === "read_control") return "read_control";
  return "read";
}

function norm(value) {
  return String(value || "").trim();
}

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function TenantUsersPage({
  onGoBack,
  currentAdminEmail = "roquemartinezpolanco@gmail.com",
}) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // ✅ Customers now come from backend (/customer-locations)
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    access: "read",
    customerName: "",
    dashboards: [],
  });

  const normalizedAdminEmail = String(currentAdminEmail || "")
    .trim()
    .toLowerCase();

  // ✅ Only dashboards created by THIS admin user
  const adminOwnedDashboards = useMemo(() => {
    return MOCK_DASHBOARDS.filter(
      (d) =>
        String(d.createdBy || "").trim().toLowerCase() === normalizedAdminEmail
    );
  }, [normalizedAdminEmail]);

  // ✅ Filter dashboards by selected customer + current admin user
  const availableDashboards = useMemo(() => {
    const selectedCustomer = norm(form.customerName);
    if (!selectedCustomer) return [];

    return adminOwnedDashboards.filter(
      (d) => norm(d.customerName) === selectedCustomer
    );
  }, [adminOwnedDashboards, form.customerName]);

  // ✅ Read only customers that belong to the authenticated admin user
  // Backend reference:
  // GET /customer-locations returns current_user.id scoped rows only
  const fetchCustomersFromBackend = async () => {
    try {
      setLoadingCustomers(true);
      setCustomersError("");

      const res = await fetch(`${API_URL}/customer-locations`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to load customers.");
      }

      const rows = await res.json().catch(() => []);
      const arr = Array.isArray(rows) ? rows : [];

      // ✅ De-duplicate customer_name from current admin's rows
      const seen = new Set();
      const uniqueCustomers = [];

      for (const row of arr) {
        const customerName = norm(row?.customer_name);
        if (!customerName) continue;

        const key = customerName.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        uniqueCustomers.push({
          id: row?.id || `${key}-${uniqueCustomers.length + 1}`,
          name: customerName,
        });
      }

      uniqueCustomers.sort((a, b) => a.name.localeCompare(b.name));
      setCustomers(uniqueCustomers);
    } catch (err) {
      console.error("❌ Failed to load customer list:", err);
      setCustomers([]);
      setCustomersError(String(err?.message || err));
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomersFromBackend();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      access: "read",
      customerName: "",
      dashboards: [],
    });
    setEditingUserId(null);
  };

  const handleSaveUser = () => {
    if (!form.name || !form.email || !form.customerName) return;

    const payload = {
      name: form.name,
      email: form.email,
      access: normalizeAccess(form.access),
      customerName: form.customerName,
      dashboards: form.dashboards,
    };

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUserId ? { ...u, ...payload } : u))
      );
    } else {
      const newUser = {
        id: Date.now(),
        ...payload,
      };
      setUsers((prev) => [...prev, newUser]);
    }

    resetForm();
    setShowModal(false);
  };

  const toggleDashboard = (id) => {
    setForm((prev) => {
      const exists = prev.dashboards.includes(id);
      return {
        ...prev,
        dashboards: exists
          ? prev.dashboards.filter((d) => d !== id)
          : [...prev.dashboards, id],
      };
    });
  };

  const openCreateModal = async () => {
    resetForm();
    setShowModal(true);

    if (!customers.length) {
      await fetchCustomersFromBackend();
    }
  };

  const openEditModal = async (user) => {
    setEditingUserId(user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      access: normalizeAccess(user.access),
      customerName: user.customerName || "",
      dashboards: Array.isArray(user.dashboards) ? user.dashboards : [],
    });
    setShowModal(true);

    if (!customers.length) {
      await fetchCustomersFromBackend();
    }
  };

  const selectedDashboardNames = (dashboardIds) =>
    adminOwnedDashboards
      .filter((d) => dashboardIds.includes(d.id))
      .map((d) => d.name)
      .join(", ");

  return (
    <div className="w-full h-full border rounded-lg bg-white p-6">
      {/* HEADER */}
      <div className="mb-6 rounded-lg bg-[#374151] text-white px-5 py-4 flex items-center gap-4">
        <button
          onClick={onGoBack}
          className="px-3 py-1 rounded-md bg-[#4B5563] hover:bg-[#6B7280] text-sm shrink-0"
        >
          ← Back
        </button>

        <div className="flex-1">
          <h2 className="text-lg font-semibold">Tenant Users & Access</h2>
          <p className="text-sm text-gray-200">
            Create tenant users and assign dashboard access by permission level.
          </p>
          <div className="mt-1 text-xs text-gray-300">
            Admin dashboards scope: {currentAdminEmail}
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-md font-semibold text-gray-800">
          Tenant Users ({users.length})
        </h3>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          + Add User
        </button>
      </div>

      {/* TABLE */}
      <div className="border rounded-md overflow-hidden">
        <div className="grid grid-cols-6 bg-gray-100 text-sm font-semibold text-gray-700 px-4 py-2">
          <div>Name</div>
          <div>Email</div>
          <div>Access</div>
          <div>Customer</div>
          <div>Dashboards</div>
          <div className="text-right">Actions</div>
        </div>

        {users.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No users created yet.</div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-6 px-4 py-2 text-sm border-t items-center gap-3"
            >
              <div>{u.name}</div>
              <div>{u.email}</div>
              <div>
                {u.access === "read_control" ? "Read + Control" : "Read"}
              </div>
              <div>{u.customerName || "—"}</div>
              <div className="text-xs text-gray-600">
                {u.dashboards.length === 0
                  ? "—"
                  : selectedDashboardNames(u.dashboards)}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => openEditModal(u)}
                  className="px-2.5 py-1.5 text-xs rounded-md border bg-white hover:bg-gray-100"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-white w-[560px] rounded-lg shadow-lg p-5">
            <h3 className="text-lg font-semibold mb-3">
              {editingUserId ? "Edit User" : "Create User"}
            </h3>

            {/* NAME */}
            <input
              placeholder="Name"
              className="w-full border rounded-md px-3 py-2 mb-2"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
            />

            {/* EMAIL */}
            <input
              placeholder="Email"
              className="w-full border rounded-md px-3 py-2 mb-2"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />

            {/* ACCESS */}
            <select
              className="w-full border rounded-md px-3 py-2 mb-2"
              value={form.access}
              onChange={(e) =>
                setForm((p) => ({ ...p, access: e.target.value }))
              }
            >
              {ACCESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* CUSTOMER */}
            <select
              className="w-full border rounded-md px-3 py-2 mb-3"
              value={form.customerName}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  customerName: e.target.value,
                  dashboards: [],
                }))
              }
              disabled={loadingCustomers}
            >
              <option value="">
                {loadingCustomers ? "Loading customers..." : "Select customer"}
              </option>

              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {customersError ? (
              <div className="mb-3 text-xs text-red-600">
                Failed to load customers from backend: {customersError}
              </div>
            ) : null}

            {/* DASHBOARDS */}
            <div className="mb-3">
              <div className="text-sm font-semibold mb-1">
                Assign Dashboards
              </div>

              <div className="text-xs text-gray-500 mb-2">
                Customers are loaded from the backend for the authenticated admin
                user. Only dashboards created by <b>{currentAdminEmail}</b> for
                the selected customer are shown.
              </div>

              <div className="space-y-1 max-h-[140px] overflow-y-auto border rounded-md p-2">
                {!form.customerName ? (
                  <div className="text-sm text-gray-500">
                    Select a customer first.
                  </div>
                ) : availableDashboards.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No dashboards found for this customer under this admin user.
                  </div>
                ) : (
                  availableDashboards.map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.dashboards.includes(d.id)}
                        onChange={() => toggleDashboard(d.id)}
                      />
                      <span>{d.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveUser}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={
                  !form.name ||
                  !form.email ||
                  !form.customerName ||
                  loadingCustomers
                }
              >
                {editingUserId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}