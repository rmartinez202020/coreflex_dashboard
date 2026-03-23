// src/components/homepagesections/TenantUsersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

const ACCESS_OPTIONS = [
  { value: "read", label: "Read" },
  { value: "read_control", label: "Read + Control" },
];

function normalizeAccess(value) {
  const v = String(value || "").toLowerCase();
  if (v === "read_control") return "read_control";
  return "read";
}

function norm(value) {
  return String(value || "").trim();
}

function isValidEmail(value) {
  const v = norm(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
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

  // ✅ Customers from backend (/customer-locations)
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState("");

  // ✅ Dashboards from backend (/customers-dashboards?customer_name=...)
  const [customerDashboards, setCustomerDashboards] = useState([]);
  const [loadingDashboards, setLoadingDashboards] = useState(false);
  const [dashboardsError, setDashboardsError] = useState("");

  // ✅ page-level message
  const [pageMsg, setPageMsg] = useState("");

  // ✅ modal validation / save state
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ✅ load customers created by authenticated admin user only
  // backend router already scopes /customer-locations to current_user.id
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

  // ✅ load dashboards assigned to selected customer in DB
  // backend router already scopes /customers-dashboards to current_user.id
  // and supports ?customer_name=
  const fetchDashboardsForCustomer = async (customerName) => {
    const customer = norm(customerName);
    if (!customer) {
      setCustomerDashboards([]);
      setDashboardsError("");
      return;
    }

    try {
      setLoadingDashboards(true);
      setDashboardsError("");

      const res = await fetch(
        `${API_URL}/customers-dashboards?customer_name=${encodeURIComponent(
          customer
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to load dashboards.");
      }

      const rows = await res.json().catch(() => []);
      const arr = Array.isArray(rows) ? rows : [];

      const cleaned = arr.map((row) => ({
        id: String(row?.id ?? "").trim(),
        name: norm(row?.dashboard_name),
        customerName: norm(row?.customer_name),
      }));

      setCustomerDashboards(cleaned.filter((d) => d.id && d.name));
    } catch (err) {
      console.error("❌ Failed to load dashboards for customer:", err);
      setCustomerDashboards([]);
      setDashboardsError(String(err?.message || err));
    } finally {
      setLoadingDashboards(false);
    }
  };

  useEffect(() => {
    fetchCustomersFromBackend();
  }, []);

  // ✅ when customer changes in modal, search DB for dashboards assigned to that customer
  useEffect(() => {
    fetchDashboardsForCustomer(form.customerName);
  }, [form.customerName]);

  const availableDashboards = useMemo(() => {
    const selectedCustomer = norm(form.customerName);
    if (!selectedCustomer) return [];

    return customerDashboards.filter(
      (d) => norm(d.customerName) === selectedCustomer
    );
  }, [customerDashboards, form.customerName]);

  const allKnownDashboards = useMemo(() => {
    const map = new Map();

    for (const d of customerDashboards) {
      map.set(String(d.id), d);
    }

    for (const u of users) {
      if (Array.isArray(u.dashboardObjects)) {
        for (const d of u.dashboardObjects) {
          if (d?.id) map.set(String(d.id), d);
        }
      }
    }

    return Array.from(map.values());
  }, [customerDashboards, users]);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      access: "read",
      customerName: "",
      dashboards: [],
    });
    setEditingUserId(null);
    setCustomerDashboards([]);
    setDashboardsError("");
    setFormError("");
  };

  const validateForm = () => {
    const name = norm(form.name);
    const email = norm(form.email).toLowerCase();
    const customerName = norm(form.customerName);

    if (!name) return "Name is required.";
    if (!email) return "Email is required.";
    if (!isValidEmail(email)) return "Please enter a valid email address.";
    if (!customerName) return "Customer is required.";
    if (!norm(form.access)) return "Access level is required.";
    if (!Array.isArray(form.dashboards) || form.dashboards.length === 0) {
      return "Select at least one dashboard.";
    }
    return "";
  };

  // ✅ IMPORTANT:
  // Frontend validates and sends to backend.
  // Backend must:
  // - generate temporary password
  // - hash password
  // - save tenant user + dashboard access
  // - email credentials via Resend from access@coreflexiiotsplatform.com
  // - NEVER return the password to admin UI
  const handleSaveUser = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");
    setPageMsg("");

    const selectedDashboardObjects = availableDashboards.filter((d) =>
      form.dashboards.includes(String(d.id))
    );

    const payload = {
      name: norm(form.name),
      email: norm(form.email).toLowerCase(),
      access: normalizeAccess(form.access),
      customer_name: norm(form.customerName),
      dashboard_ids: form.dashboards.map((id) => Number(id)).filter(Boolean),
    };

    try {
      setIsSubmitting(true);

      // ✅ Expected backend endpoints:
      // POST   /tenant-users        -> create user + generate password + email user
      // PUT    /tenant-users/{id}   -> update user access/customer/dashboard assignments
      //
      // This frontend is ready for that flow.
      // If backend route is not added yet, it will show a clear error.
      const endpoint = editingUserId
        ? `${API_URL}/tenant-users/${encodeURIComponent(editingUserId)}`
        : `${API_URL}/tenant-users`;

      const method = editingUserId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to save tenant user.");
      }

      const data = await res.json().catch(() => ({}));

      const normalizedSavedUser = {
        id: data?.id ?? editingUserId ?? Date.now(),
        name: payload.name,
        email: payload.email,
        access: payload.access,
        customerName: payload.customer_name,
        dashboards: payload.dashboard_ids.map(String),
        dashboardObjects: selectedDashboardObjects,
      };

      if (editingUserId) {
        setUsers((prev) =>
          prev.map((u) =>
            String(u.id) === String(editingUserId) ? normalizedSavedUser : u
          )
        );
        setPageMsg("✅ Tenant user updated.");
      } else {
        setUsers((prev) => [...prev, normalizedSavedUser]);
        setPageMsg(
          "✅ Tenant user created. A temporary password should be sent only to that user's email."
        );
      }

      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error("❌ Failed to save tenant user:", err);
      setFormError(String(err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDashboard = (id) => {
    const dashboardId = String(id);
    setForm((prev) => {
      const exists = prev.dashboards.includes(dashboardId);
      return {
        ...prev,
        dashboards: exists
          ? prev.dashboards.filter((d) => d !== dashboardId)
          : [...prev.dashboards, dashboardId],
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
      dashboards: Array.isArray(user.dashboards)
        ? user.dashboards.map((id) => String(id))
        : [],
    });
    setFormError("");
    setShowModal(true);

    if (!customers.length) {
      await fetchCustomersFromBackend();
    }
  };

  const selectedDashboardNames = (dashboardIds, dashboardObjects = null) => {
    if (Array.isArray(dashboardObjects) && dashboardObjects.length > 0) {
      return dashboardObjects
        .map((d) => norm(d?.name))
        .filter(Boolean)
        .join(", ");
    }

    return allKnownDashboards
      .filter((d) => dashboardIds.includes(String(d.id)))
      .map((d) => d.name)
      .join(", ");
  };

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

      {/* PAGE MESSAGE */}
      {pageMsg ? (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
          {pageMsg}
        </div>
      ) : null}

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
                  : selectedDashboardNames(u.dashboards, u.dashboardObjects)}
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
              onChange={(e) => {
                setFormError("");
                setForm((p) => ({ ...p, name: e.target.value }));
              }}
            />

            {/* EMAIL */}
            <input
              placeholder="Email"
              className={`w-full border rounded-md px-3 py-2 mb-2 ${
                form.email && !isValidEmail(form.email)
                  ? "border-red-400 bg-red-50"
                  : ""
              }`}
              value={form.email}
              onChange={(e) => {
                setFormError("");
                setForm((p) => ({ ...p, email: e.target.value }));
              }}
            />

            {form.email && !isValidEmail(form.email) ? (
              <div className="mb-2 text-xs text-red-600">
                Please enter a valid email address.
              </div>
            ) : null}

            {/* ACCESS */}
            <select
              className="w-full border rounded-md px-3 py-2 mb-2"
              value={form.access}
              onChange={(e) => {
                setFormError("");
                setForm((p) => ({ ...p, access: e.target.value }));
              }}
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
              onChange={(e) => {
                setFormError("");
                setForm((p) => ({
                  ...p,
                  customerName: e.target.value,
                  dashboards: [],
                }));
              }}
              disabled={loadingCustomers || isSubmitting}
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
                After selecting a customer, the system searches the dashboard DB
                for dashboards assigned to that customer under the authenticated
                admin user.
              </div>

              <div className="space-y-1 max-h-[140px] overflow-y-auto border rounded-md p-2">
                {!form.customerName ? (
                  <div className="text-sm text-gray-500">
                    Select a customer first.
                  </div>
                ) : loadingDashboards ? (
                  <div className="text-sm text-gray-500">
                    Loading customer dashboards...
                  </div>
                ) : dashboardsError ? (
                  <div className="text-sm text-red-600">
                    Failed to load dashboards: {dashboardsError}
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
                        checked={form.dashboards.includes(String(d.id))}
                        onChange={() => toggleDashboard(d.id)}
                        disabled={isSubmitting}
                      />
                      <span>{d.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {formError ? (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="px-3 py-2 border rounded-md text-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveUser}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={
                  !norm(form.name) ||
                  !norm(form.email) ||
                  !isValidEmail(form.email) ||
                  !norm(form.customerName) ||
                  !Array.isArray(form.dashboards) ||
                  form.dashboards.length === 0 ||
                  loadingCustomers ||
                  loadingDashboards ||
                  isSubmitting
                }
              >
                {isSubmitting
                  ? editingUserId
                    ? "Saving..."
                    : "Creating..."
                  : editingUserId
                  ? "Save Changes"
                  : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}