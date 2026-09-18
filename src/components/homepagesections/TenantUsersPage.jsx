// src/components/homepagesections/TenantUsersPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

const ACCESS_OPTIONS = [
  { value: "read", label: "Read" },
  { value: "read_control", label: "Read + Control" },
];

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

function TenantUsersLoadingOverlay({ open }) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
      <div className="w-[170px] h-[150px] rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col items-center justify-center">
        <div className="relative w-11 h-11 mb-4">
          <div className="absolute inset-0 rounded-xl border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-xl border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>

        <div className="text-sm font-bold text-gray-800">Loading Data</div>
        <div className="mt-1 text-xs text-gray-500">Please wait...</div>
      </div>
    </div>
  );
}

function normalizeUserFromBackend(row) {
  const dashboards = Array.isArray(row?.dashboards) ? row.dashboards : [];

  return {
    id: row?.id ?? Date.now(),
    name: norm(row?.full_name || row?.name),
    email: norm(row?.email).toLowerCase(),
    access: normalizeAccess(row?.access_level || row?.access),
    customerName: norm(row?.customer_name || row?.customerName),
    dashboards: dashboards.map((d) => String(d?.id ?? "").trim()).filter(Boolean),
    dashboardObjects: dashboards
      .map((d) => ({
        id: String(d?.id ?? "").trim(),
        name: norm(d?.dashboard_name || d?.name),
        customerName: norm(
          d?.customer_name ||
            d?.customerName ||
            row?.customer_name ||
            row?.customerName
        ),
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
  const [showInitialLoading, setShowInitialLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState("");

  const [customerDashboards, setCustomerDashboards] = useState([]);
  const [loadingDashboards, setLoadingDashboards] = useState(false);
  const [dashboardsError, setDashboardsError] = useState("");

  // Edit User can manage dashboard access across every customer.
  const [editAllDashboards, setEditAllDashboards] = useState([]);
  const [loadingEditDashboards, setLoadingEditDashboards] = useState(false);
  const [editDashboardsError, setEditDashboardsError] = useState("");

  // Explicit Edit User workflow for adding another dashboard by customer.
  const [addAccessCustomerName, setAddAccessCustomerName] = useState("");
  const [addAccessDashboardId, setAddAccessDashboardId] = useState("");

  const [pageMsg, setPageMsg] = useState("");

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowInitialLoading(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

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

  const fetchAllDashboardsForEdit = useCallback(
    async (customerRows = customers) => {
      const sourceCustomers = Array.isArray(customerRows) ? customerRows : [];

      if (!sourceCustomers.length) {
        setEditAllDashboards([]);
        setEditDashboardsError("");
        return [];
      }

      try {
        setLoadingEditDashboards(true);
        setEditDashboardsError("");

        const results = await Promise.all(
          sourceCustomers.map(async (customerRow) => {
            const customerName = norm(customerRow?.name);
            if (!customerName) return [];

            const res = await fetch(
              `${API_URL}/customers-dashboards?customer_name=${encodeURIComponent(
                customerName
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
              throw new Error(
                text || `Failed to load dashboards for ${customerName}.`
              );
            }

            const rows = await res.json().catch(() => []);
            const arr = Array.isArray(rows) ? rows : [];

            return arr
              .map((row) => ({
                id: String(row?.id ?? "").trim(),
                name: norm(row?.dashboard_name),
                customerName: norm(row?.customer_name || customerName),
              }))
              .filter((d) => d.id && d.name);
          })
        );

        const map = new Map();
        for (const rows of results) {
          for (const dashboard of rows) {
            map.set(String(dashboard.id), dashboard);
          }
        }

        const cleaned = Array.from(map.values()).sort((a, b) => {
          const customerCompare = a.customerName.localeCompare(b.customerName);
          if (customerCompare !== 0) return customerCompare;
          return a.name.localeCompare(b.name);
        });

        setEditAllDashboards(cleaned);
        return cleaned;
      } catch (err) {
        console.error("❌ Failed to load all dashboards for Edit User:", err);
        setEditAllDashboards([]);
        setEditDashboardsError(String(err?.message || err));
        return [];
      } finally {
        setLoadingEditDashboards(false);
      }
    },
    [customers]
  );

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
    if (editingUserId) return;
    fetchDashboardsForCustomer(form.customerName);
  }, [editingUserId, form.customerName, fetchDashboardsForCustomer]);

  const availableDashboards = useMemo(() => {
    const selectedCustomer = norm(form.customerName);
    if (!selectedCustomer) return [];

    return customerDashboards.filter(
      (d) => norm(d.customerName) === selectedCustomer
    );
  }, [customerDashboards, form.customerName]);

  const editDashboardsByCustomer = useMemo(() => {
    const groups = new Map();

    for (const dashboard of editAllDashboards) {
      const customerName = norm(dashboard.customerName) || "Customer";
      if (!groups.has(customerName)) groups.set(customerName, []);
      groups.get(customerName).push(dashboard);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([customerName, dashboards]) => ({
        customerName,
        dashboards: [...dashboards].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [editAllDashboards]);

  const addAccessAvailableDashboards = useMemo(() => {
    const customerName = norm(addAccessCustomerName);
    if (!customerName) return [];

    return editAllDashboards.filter(
      (dashboard) =>
        norm(dashboard.customerName) === customerName &&
        !form.dashboards.includes(String(dashboard.id))
    );
  }, [addAccessCustomerName, editAllDashboards, form.dashboards]);

  const allKnownDashboards = useMemo(() => {
    const map = new Map();

    for (const d of customerDashboards) {
      map.set(String(d.id), d);
    }

    for (const d of editAllDashboards) {
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
  }, [customerDashboards, editAllDashboards, users]);

  const filteredUsers = useMemo(() => {
    const customerQuery = norm(searchCustomer).toLowerCase();
    const emailQuery = norm(searchEmail).toLowerCase();

    return users.filter((u) => {
      const dashboardCustomers = Array.isArray(u.dashboardObjects)
        ? u.dashboardObjects
            .map((d) => norm(d?.customerName).toLowerCase())
            .filter(Boolean)
        : [];

      const customerOk = customerQuery
        ? norm(u.customerName).toLowerCase().includes(customerQuery) ||
          dashboardCustomers.some((name) => name.includes(customerQuery))
        : true;

      const emailOk = emailQuery
        ? norm(u.email).toLowerCase().includes(emailQuery)
        : true;

      return customerOk && emailOk;
    });
  }, [users, searchCustomer, searchEmail]);

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

  const createEmailMatchesExistingTenant = useMemo(() => {
    if (editingUserId) return false;
    const email = norm(form.email).toLowerCase();
    if (!isValidEmail(email)) return false;

    return users.some((u) => norm(u.email).toLowerCase() === email);
  }, [editingUserId, form.email, users]);

  const tenantLimitBlocksCurrentCreate =
    !editingUserId &&
    !createEmailMatchesExistingTenant &&
    totalTenantUserSlots > 0 &&
    usedTenantUsers >= totalTenantUserSlots;

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
    setEditAllDashboards([]);
    setEditDashboardsError("");
    setAddAccessCustomerName("");
    setAddAccessDashboardId("");
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
    if (!editingUserId && !customerName) return "Customer is required.";
    if (!norm(form.access)) return "Access level is required.";
    if (!Array.isArray(form.dashboards) || form.dashboards.length === 0) {
      return "Select at least one dashboard.";
    }

    if (tenantLimitBlocksCurrentCreate) {
      return "Tenant user limit reached for your current subscription. You can still enter an existing tenant email to assign additional dashboard access.";
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

    const dashboardSource = editingUserId
      ? editAllDashboards
      : availableDashboards;

    const selectedDashboardObjects = dashboardSource.filter((d) =>
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          String(data?.detail || data?.error || "Failed to save tenant user.")
        );
      }

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
        const wasExistingTenant = users.some(
          (u) => norm(u.email).toLowerCase() === payload.email
        );

        setUsers((prev) => {
          if (!wasExistingTenant) {
            return [normalizedSavedUser, ...prev];
          }

          return prev.map((u) =>
            norm(u.email).toLowerCase() === payload.email
              ? normalizedSavedUser
              : u
          );
        });

        setPageMsg(
          wasExistingTenant
            ? "✅ Dashboard access added to the existing tenant. The tenant keeps the same password."
            : "✅ Tenant user created. Temporary credentials were sent to the tenant email."
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

  const handleAddDashboardAccess = () => {
    const dashboardId = String(addAccessDashboardId || "").trim();
    if (!dashboardId) return;

    setFormError("");
    setForm((prev) => {
      if (prev.dashboards.includes(dashboardId)) return prev;
      return {
        ...prev,
        dashboards: [...prev.dashboards, dashboardId],
      };
    });

    setAddAccessDashboardId("");
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
    setEditDashboardsError("");
    setAddAccessCustomerName("");
    setAddAccessDashboardId("");
    setShowModal(true);

    let customerRows = customers;

    if (!customerRows.length) {
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

        customerRows = arr
          .map((row) => ({
            id: row?.id,
            name: norm(row?.customer_name),
          }))
          .filter((row) => {
            if (!row.name) return false;
            const key = row.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setCustomers(customerRows);
      } catch (err) {
        console.error("❌ Failed to load customer list:", err);
        setCustomersError(String(err?.message || err));
        customerRows = [];
      } finally {
        setLoadingCustomers(false);
      }
    }

    await fetchAllDashboardsForEdit(customerRows);
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
    <div className="relative w-full h-full border rounded-lg bg-white p-6">
      <TenantUsersLoadingOverlay open={showInitialLoading} />

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
            {loadingSubscription
              ? "..."
              : `${usedTenantUsers} / ${totalTenantUserSlots}`}
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

        <button
          onClick={openCreateModal}
          disabled={loadingSubscription}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              <div className="text-xs text-gray-600">
                {Array.isArray(u.dashboardObjects) && u.dashboardObjects.length > 0
                  ? Array.from(
                      new Set(
                        u.dashboardObjects
                          .map((d) => norm(d?.customerName))
                          .filter(Boolean)
                      )
                    ).join(", ") || u.customerName || "—"
                  : u.customerName || "—"}
              </div>
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4">
          <div
            className={`bg-white rounded-lg shadow-lg ${
              editingUserId
                ? "w-[min(1120px,94vw)] max-h-[88vh] p-5"
                : "w-[560px] max-w-[94vw] max-h-[88vh] overflow-y-auto p-5"
            }`}
          >
            <h3 className="text-lg font-semibold mb-3">
              {editingUserId ? "Edit User" : "Create User"}
            </h3>

            {editingUserId ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5">
                  {/* LEFT SIDE: USER INFO + ADD DASHBOARD ACCESS */}
                  <div className="min-w-0 lg:pr-5 lg:border-r lg:border-gray-200">
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

                    <input
                      placeholder="Email"
                      className="w-full border rounded-md px-3 py-2 mb-1 bg-gray-100 text-gray-500 cursor-not-allowed"
                      value={form.email}
                      disabled
                    />

                    <div className="mb-2 text-xs text-gray-500">
                      Email cannot be modified after the tenant user is created.
                    </div>

                    <select
                      className="w-full border rounded-md px-3 py-2 mb-4"
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

                    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                      <div className="text-sm font-semibold text-gray-800 mb-1">
                        + Add Dashboard Access
                      </div>

                      <div className="text-xs text-gray-600 mb-3">
                        Select a customer and then choose another dashboard to add to
                        this tenant.
                      </div>

                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Customer
                      </label>
                      <select
                        className="w-full border rounded-md px-3 py-2 bg-white text-sm mb-3"
                        value={addAccessCustomerName}
                        onChange={(e) => {
                          setAddAccessCustomerName(e.target.value);
                          setAddAccessDashboardId("");
                          setFormError("");
                        }}
                        disabled={
                          loadingCustomers ||
                          loadingEditDashboards ||
                          isSubmitting ||
                          isDeleting
                        }
                      >
                        <option value="">Select customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.name}>
                            {customer.name}
                          </option>
                        ))}
                      </select>

                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Dashboard
                      </label>
                      <select
                        className="w-full border rounded-md px-3 py-2 bg-white text-sm mb-3"
                        value={addAccessDashboardId}
                        onChange={(e) => {
                          setAddAccessDashboardId(e.target.value);
                          setFormError("");
                        }}
                        disabled={
                          !addAccessCustomerName ||
                          loadingEditDashboards ||
                          isSubmitting ||
                          isDeleting
                        }
                      >
                        <option value="">
                          {!addAccessCustomerName
                            ? "Select customer first"
                            : addAccessAvailableDashboards.length === 0
                            ? "No additional dashboards available"
                            : "Select dashboard"}
                        </option>

                        {addAccessAvailableDashboards.map((dashboard) => (
                          <option key={dashboard.id} value={dashboard.id}>
                            {dashboard.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleAddDashboardAccess}
                        disabled={
                          !addAccessDashboardId || isSubmitting || isDeleting
                        }
                        className="w-full px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        + Add Dashboard
                      </button>

                      <div className="mt-3 text-xs text-gray-500">
                        The dashboard is added to the list on the right immediately.
                        Click Save Changes to apply the updated access.
                      </div>
                    </div>

                    {customersError ? (
                      <div className="mt-3 text-xs text-red-600">
                        Failed to load customers from backend: {customersError}
                      </div>
                    ) : null}
                  </div>

                  {/* RIGHT SIDE: ALL ASSIGNED/AVAILABLE DASHBOARDS */}
                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="text-sm font-semibold">Assign Dashboards</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {editDashboardsByCustomer.length} customers •{" "}
                        {editAllDashboards.length} dashboards
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      Manage this tenant's complete dashboard access across all
                      customers. Existing assignments stay checked. Check or uncheck
                      dashboards to modify access.
                    </div>

                    <div className="h-[460px] overflow-y-scroll overscroll-contain border rounded-md p-2 bg-gray-50">
                      {loadingCustomers || loadingEditDashboards ? (
                        <div className="text-sm text-gray-500 py-2">
                          Loading all customer dashboards...
                        </div>
                      ) : editDashboardsError ? (
                        <div className="text-sm text-red-600 py-2">
                          Failed to load dashboards: {editDashboardsError}
                        </div>
                      ) : editDashboardsByCustomer.length === 0 ? (
                        <div className="text-sm text-gray-500 py-2">
                          No dashboards found under this admin user.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editDashboardsByCustomer.map((group) => (
                            <div
                              key={group.customerName}
                              className="rounded-md border border-gray-200 bg-white p-2"
                            >
                              <div className="text-xs font-bold text-gray-700 mb-1.5">
                                {group.customerName} ({group.dashboards.length})
                              </div>

                              <div className="space-y-1">
                                {group.dashboards.map((d) => (
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
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {formError ? (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <div className="mt-4 flex justify-between items-center gap-2">
                  <button
                    onClick={handleDeleteUser}
                    className="px-3 py-2 rounded-md text-sm border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete User"}
                  </button>

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
                        !Array.isArray(form.dashboards) ||
                        form.dashboards.length === 0 ||
                        loadingCustomers ||
                        loadingEditDashboards ||
                        isSubmitting ||
                        isDeleting
                      }
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* CREATE USER KEEPS THE EXISTING COMPACT WORKFLOW */}
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

                <input
                  placeholder="Email"
                  className={`w-full border rounded-md px-3 py-2 mb-1 ${
                    form.email && !isValidEmail(form.email)
                      ? "border-red-400 bg-red-50"
                      : ""
                  }`}
                  value={form.email}
                  onChange={(e) => {
                    setFormError("");
                    setForm((p) => ({ ...p, email: e.target.value }));
                  }}
                  disabled={isSubmitting || isDeleting}
                />

                {form.email && !isValidEmail(form.email) ? (
                  <div className="mb-2 text-xs text-red-600">
                    Please enter a valid email address.
                  </div>
                ) : createEmailMatchesExistingTenant ? (
                  <div className="mb-2 text-xs text-blue-600">
                    Existing tenant account found. Additional dashboards will be added
                    without creating another tenant-user or changing the tenant
                    password.
                  </div>
                ) : null}

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

                <div className="mb-3">
                  <div className="text-sm font-semibold mb-1">
                    Assign Dashboards
                  </div>

                  <div className="text-xs text-gray-500 mb-2">
                    Select a customer, then choose one or more dashboards for the
                    tenant's initial access.
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
                        <label key={d.id} className="flex items-center gap-2 text-sm">
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
                      tenantLimitBlocksCurrentCreate
                    }
                  >
                    {isSubmitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}