// src/components/homepagesections/TenantUsersPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

const ACCESS_OPTIONS = [
  { value: "read", label: "Read" },
  { value: "read_control", label: "Read + Control" },
];

const ADD_TENANT_USER_COST = "$310";

function normalizeAccess(value) {
  const v = String(value || "").toLowerCase().trim();
  if (v === "read_control" || v === "read-and-control") return "read_control";
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

function normalizeUserFromBackend(row) {
  const dashboards = Array.isArray(row?.dashboards) ? row.dashboards : [];

  return {
    id: row?.id ?? Date.now(),
    name: norm(row?.full_name || row?.name),
    email: norm(row?.email).toLowerCase(),
    access: normalizeAccess(row?.access_level || row?.access),
    customerName: norm(row?.customer_name || row?.customerName),
    dashboards: dashboards
      .map((d) => String(d?.id ?? "").trim())
      .filter(Boolean),
    dashboardObjects: dashboards
      .map((d) => ({
        id: String(d?.id ?? "").trim(),
        name: norm(d?.dashboard_name || d?.name),
        customerName: norm(row?.customer_name || row?.customerName),
      }))
      .filter((d) => d.id && d.name),
    isActive: Boolean(row?.is_active ?? true),
    mustChangePassword: Boolean(row?.must_change_password ?? false),
  };
}

function normalizeSubscriptionFromBackend(row) {
  return {
    planKey: String(row?.plan_key || "free").trim().toLowerCase(),
    tenantUsersLimit: Number(row?.tenants_users_limit ?? 0) || 0,
    tenantUsersUsed: Number(row?.tenant_users_used ?? 0) || 0,
  };
}

export default function TenantUsersPage({
  onGoBack,
  currentAdminEmail = "roquemartinezpolanco@gmail.com",
}) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // ✅ search/filter states
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

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

  // ✅ modal validation / save/delete state
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchTenantUsersFromBackend = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setUsersError("");

      const res = await fetch(`${API_URL}/tenant-users`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to load tenant users.");
      }

      const rows = await res.json().catch(() => []);
      const arr = Array.isArray(rows) ? rows : [];

      setUsers(arr.map(normalizeUserFromBackend));
    } catch (err) {
      console.error("❌ Failed to load tenant users:", err);
      setUsers([]);
      setUsersError(String(err?.message || err));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchSubscriptionFromBackend = useCallback(async () => {
    try {
      setLoadingSubscription(true);
      setSubscriptionError("");

      const res = await fetch(`${API_URL}/subscription/me`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to load subscription.");
      }

      const row = await res.json().catch(() => ({}));
      setSubscription(normalizeSubscriptionFromBackend(row));
    } catch (err) {
      console.error("❌ Failed to load subscription:", err);
      setSubscription(null);
      setSubscriptionError(String(err?.message || err));
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  const fetchCustomersFromBackend = useCallback(async () => {
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
  }, []);

  const fetchDashboardsForCustomer = useCallback(async (customerName) => {
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
  }, []);

  useEffect(() => {
    fetchTenantUsersFromBackend();
    fetchCustomersFromBackend();
    fetchSubscriptionFromBackend();
  }, [
    fetchTenantUsersFromBackend,
    fetchCustomersFromBackend,
    fetchSubscriptionFromBackend,
  ]);

  useEffect(() => {
    fetchDashboardsForCustomer(form.customerName);
  }, [form.customerName, fetchDashboardsForCustomer]);

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

  const filteredUsers = useMemo(() => {
    const customerQuery = norm(searchCustomer).toLowerCase();
    const emailQuery = norm(searchEmail).toLowerCase();

    return users.filter((u) => {
      const customerOk = customerQuery
        ? norm(u.customerName).toLowerCase().includes(customerQuery)
        : true;

      const emailOk = emailQuery
        ? norm(u.email).toLowerCase().includes(emailQuery)
        : true;

      return customerOk && emailOk;
    });
  }, [users, searchCustomer, searchEmail]);

  // ✅ subscription counters for top section
  const totalTenantUserSlots =
    Number(subscription?.tenantUsersLimit ?? 0) > 0
      ? Number(subscription.tenantUsersLimit)
      : 0;

  const usedTenantUsers =
    Number(subscription?.tenantUsersUsed ?? users.length) >= 0
      ? Number(subscription?.tenantUsersUsed ?? users.length)
      : users.length;

  const availableTenantUsers = Math.max(
    0,
    totalTenantUserSlots - usedTenantUsers
  );

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
    setIsDeleting(false);
  };

  const clearSearch = () => {
    setSearchCustomer("");
    setSearchEmail("");
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

    if (!editingUserId && totalTenantUserSlots > 0 && usedTenantUsers >= totalTenantUserSlots) {
      return "Tenant user limit reached for your current subscription.";
    }

    return "";
  };

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

      const normalizedSavedUser = data?.id
        ? normalizeUserFromBackend(data)
        : {
            id: editingUserId ?? Date.now(),
            name: payload.name,
            email: payload.email,
            access: payload.access,
            customerName: payload.customer_name,
            dashboards: payload.dashboard_ids.map(String),
            dashboardObjects: selectedDashboardObjects,
            isActive: true,
            mustChangePassword: !editingUserId,
          };

      if (editingUserId) {
        setUsers((prev) =>
          prev.map((u) =>
            String(u.id) === String(editingUserId) ? normalizedSavedUser : u
          )
        );
        setPageMsg("✅ Tenant user updated.");
      } else {
        setUsers((prev) => [normalizedSavedUser, ...prev]);
        setPageMsg(
          "✅ Tenant user created. Temporary credentials were sent to the tenant email."
        );
      }

      resetForm();
      setShowModal(false);
      await Promise.all([
        fetchTenantUsersFromBackend(),
        fetchSubscriptionFromBackend(),
      ]);
    } catch (err) {
      console.error("❌ Failed to save tenant user:", err);
      setFormError(String(err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUserId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this tenant user? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setFormError("");
      setPageMsg("");

      const res = await fetch(
        `${API_URL}/tenant-users/${encodeURIComponent(editingUserId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to delete tenant user.");
      }

      setUsers((prev) =>
        prev.filter((u) => String(u.id) !== String(editingUserId))
      );
      setPageMsg("✅ Tenant user deleted.");
      resetForm();
      setShowModal(false);
      await Promise.all([
        fetchTenantUsersFromBackend(),
        fetchSubscriptionFromBackend(),
      ]);
    } catch (err) {
      console.error("❌ Failed to delete tenant user:", err);
      setFormError(String(err?.message || err));
    } finally {
      setIsDeleting(false);
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

    if (user.customerName) {
      await fetchDashboardsForCustomer(user.customerName);
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
            Admin dashboards scope: {normalizedAdminEmail}
          </div>
        </div>
      </div>

      {/* PAGE MESSAGE */}
      {pageMsg ? (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
          {pageMsg}
        </div>
      ) : null}

      {usersError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load tenant users from backend: {usersError}
        </div>
      ) : null}

      {subscriptionError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load subscription from backend: {subscriptionError}
        </div>
      ) : null}

      {/* TENANT USER SUMMARY */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="text-xs font-medium text-gray-600">
            Available Tenant-Users
          </div>
          <div className="mt-1 text-xl font-semibold text-gray-900">
            {loadingSubscription ? "..." : availableTenantUsers}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="text-xs font-medium text-gray-600">
            Used Tenant-Users
          </div>
          <div className="mt-1 text-xl font-semibold text-gray-900">
            {loadingSubscription ? "..." : `${usedTenantUsers} / ${totalTenantUserSlots}`}
          </div>
        </div>
      </div>

      {/* PURCHASE STRIP */}
      <div className="mb-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-emerald-800">
              Purchase Additional Tenant-User
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Expand your tenant-user capacity for this account and create access
              for more users under your current subscription.
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
            <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Price
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {ADD_TENANT_USER_COST}
              </div>
              <div className="text-xs text-gray-500">per user</div>
            </div>

            <button
              type="button"
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 text-sm font-semibold shadow-sm transition"
            >
              Purchase Tenant-User
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="mb-2 text-sm font-semibold text-gray-800">
          Search Tenant Users
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Search by Customer
            </label>
            <input
              type="text"
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              placeholder="Enter customer name..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Search by User Email
            </label>
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter user email..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearSearch}
              className="px-3 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm disabled:opacity-50"
              disabled={!searchCustomer && !searchEmail}
            >
              Clear Search
            </button>

            <button
              onClick={async () => {
                await Promise.all([
                  fetchTenantUsersFromBackend(),
                  fetchSubscriptionFromBackend(),
                ]);
              }}
              className="px-3 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm"
              disabled={loadingUsers || loadingSubscription}
            >
              {loadingUsers || loadingSubscription ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-md font-semibold text-gray-800">
          Tenant Users ({filteredUsers.length})
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            disabled={
              loadingSubscription ||
              (totalTenantUserSlots > 0 && usedTenantUsers >= totalTenantUserSlots)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            + Add User
          </button>
        </div>
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

        {loadingUsers ? (
          <div className="p-4 text-sm text-gray-500">
            Loading tenant users from backend...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            {!users.length
              ? "No users created yet."
              : "No users matched the current search filters."}
          </div>
        ) : (
          filteredUsers.map((u) => (
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
              disabled={isSubmitting || isDeleting}
            />

            {/* EMAIL */}
            <input
              placeholder="Email"
              className={`w-full border rounded-md px-3 py-2 mb-1 ${
                form.email && !isValidEmail(form.email)
                  ? "border-red-400 bg-red-50"
                  : ""
              } ${
                editingUserId
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : ""
              }`}
              value={form.email}
              onChange={(e) => {
                if (editingUserId) return;
                setFormError("");
                setForm((p) => ({ ...p, email: e.target.value }));
              }}
              disabled={Boolean(editingUserId) || isSubmitting || isDeleting}
            />

            {editingUserId ? (
              <div className="mb-2 text-xs text-gray-500">
                Email cannot be modified after the tenant user is created.
              </div>
            ) : form.email && !isValidEmail(form.email) ? (
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
              disabled={isSubmitting || isDeleting}
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
              disabled={loadingCustomers || isSubmitting || isDeleting}
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
                        disabled={isSubmitting || isDeleting}
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
            <div className="flex justify-between items-center gap-2">
              <div>
                {editingUserId ? (
                  <button
                    onClick={handleDeleteUser}
                    className="px-3 py-2 rounded-md text-sm border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete User"}
                  </button>
                ) : (
                  <span />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                  disabled={isSubmitting || isDeleting}
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
                    isSubmitting ||
                    isDeleting ||
                    (!editingUserId &&
                      totalTenantUserSlots > 0 &&
                      usedTenantUsers >= totalTenantUserSlots)
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
        </div>
      )}
    </div>
  );
}