// src/components/DashboardAdminPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

/**
 * DashboardAdminPage
 * - Pick Customer (optional filter)
 * - Create Dashboard (requires customer)
 * - List Dashboards (ALWAYS shows existing dashboards; filter by customer if selected)
 * - Open/Edit (loads it into your main editor)
 * - Launch (opens play-mode in new tab)
 * - ✅ Delete Dashboard (with confirm modal)
 *
 * IMPORTANT:
 * - This page must be fed by App.jsx with:
 *    onOpenDashboard(dashboardRow)
 *    onLaunchDashboard(dashboardRow)
 *    onGoHome()   ✅ (for Back button)
 */
export default function DashboardAdminPage({
  onOpenDashboard, // (dashboardRow) => void
  onLaunchDashboard, // (dashboardRow) => void
  onGoHome, // ✅ new
}) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(""); // optional filter

  const [dashboards, setDashboards] = useState([]);
  const [search, setSearch] = useState(""); // quick search across dashboards

  const [newDashboardName, setNewDashboardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // dashboard row
  const [isDeleting, setIsDeleting] = useState(false);

  // Used only to trigger initial load when token changes (login/logout)
  const token = useMemo(() => getToken(), []);

  // -----------------------------
  // ✅ Fetch Customers (unique list)
  // -----------------------------
  const fetchCustomers = async () => {
    const t = getToken();
    if (!t) throw new Error("Not logged in.");

    const res = await fetch(`${API_URL}/customers-dashboards/customers`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) throw new Error("Failed to load customers");

    const data = await res.json();
    const arr = Array.isArray(data) ? data : [];

    const seen = new Set();
    const unique = [];
    for (const row of arr) {
      const name = String(row?.customer_name || "").trim();
      if (!name) continue;
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      unique.push({ customer_name: name });
    }

    setCustomers(unique);
  };

  // -----------------------------
  // ✅ Fetch Dashboards
  // -----------------------------
  const fetchDashboards = async (customerName = "") => {
    const t = getToken();
    if (!t) throw new Error("Not logged in.");

    const url = customerName
      ? `${API_URL}/customers-dashboards?customer_name=${encodeURIComponent(
          customerName
        )}`
      : `${API_URL}/customers-dashboards`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) throw new Error("Failed to load dashboards");

    const data = await res.json();
    setDashboards(Array.isArray(data) ? data : []);
  };

  // -----------------------------
  // ✅ Initial Load
  // -----------------------------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        await fetchCustomers();
        await fetchDashboards(""); // show all dashboards immediately
      } catch (e) {
        console.error(e);
        setMsg(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // -----------------------------
  // ✅ When customer changes, refetch
  // -----------------------------
  useEffect(() => {
    (async () => {
      try {
        setMsg("");
        await fetchDashboards(selectedCustomer || "");
      } catch (e) {
        console.error(e);
        setMsg(String(e?.message || e));
      }
    })();
  }, [selectedCustomer]);

  // -----------------------------
  // ✅ Create Dashboard
  // -----------------------------
  const handleCreate = async () => {
    try {
      setMsg("");

      const t = getToken();
      if (!t) {
        setMsg("Not logged in.");
        return;
      }

      const customer = (selectedCustomer || "").trim();
      const name = (newDashboardName || "").trim();

      if (!customer) {
        setMsg("Pick a customer first.");
        return;
      }
      if (!name) {
        setMsg("Enter a dashboard name.");
        return;
      }

      setLoading(true);

      const res = await fetch(`${API_URL}/customers-dashboards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          customer_name: customer,
          dashboard_name: name,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Create failed");
      }

      setNewDashboardName("");

      await fetchDashboards(customer);
      setMsg("✅ Dashboard created");
    } catch (e) {
      console.error(e);
      setMsg(`❌ ${String(e?.message || e)}`);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // ✅ Delete Dashboard (API call)
  // - Assumes your backend supports:
  //     DELETE /customers-dashboards/{id}
  // -----------------------------
  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      setIsDeleting(true);
      setMsg("");

      const t = getToken();
      if (!t) {
        setMsg("Not logged in.");
        return;
      }

      const res = await fetch(
        `${API_URL}/customers-dashboards/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${t}` },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Delete failed");
      }

      // close modal
      setDeleteTarget(null);

      // refresh list (keep current filter)
      await fetchDashboards(selectedCustomer || "");
      setMsg(`✅ Deleted: ${deleteTarget.dashboard_name}`);
    } catch (e) {
      console.error(e);
      setMsg(`❌ ${String(e?.message || e)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // -----------------------------
  // ✅ Filtered Dashboards (search + optional customer)
  // -----------------------------
  const filteredDashboards = dashboards.filter((d) => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return true;

    const dn = String(d?.dashboard_name || "").toLowerCase();
    const cn = String(d?.customer_name || "").toLowerCase();
    const id = String(d?.id || "").toLowerCase(); // search-only

    return dn.includes(q) || cn.includes(q) || id.includes(q);
  });

  // -----------------------------
  // ✅ Group by customer when showing ALL
  // -----------------------------
  const groupedByCustomer = filteredDashboards.reduce((acc, d) => {
    const key = String(d?.customer_name || "Unknown").trim() || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const groupKeys = Object.keys(groupedByCustomer).sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <div className="w-full h-full border rounded-lg bg-white p-6 relative">
      {/* ✅ HEADER STYLE */}
      <div className="mb-6 rounded-lg bg-[#374151] text-white px-5 py-4 flex items-start gap-4">
        <button
          type="button"
          onClick={() => onGoHome?.()}
          className="px-3 py-1 rounded-md bg-[#4B5563] hover:bg-[#6B7280] text-sm font-medium"
          title="Back to Home"
        >
          ← Back
        </button>

        <div className="flex-1">
          <h2 className="text-lg font-semibold leading-tight">
            Admin Dashboard
          </h2>
          <p className="text-sm text-gray-200">
            Create and manage customer dashboards.
          </p>
        </div>
      </div>

      {/* CUSTOMER PICKER + CREATE */}
      <div className="flex flex-col md:flex-row gap-3 md:items-end mb-4">
        {/* PICK CUSTOMER (OPTIONAL FILTER) */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Filter by Customer{" "}
            <span className="text-xs text-gray-500">(optional)</span>
          </label>

          <select
            className="w-full border rounded-md px-3 py-2"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            disabled={loading}
          >
            <option value="">-- All customers --</option>
            {customers.map((c) => (
              <option key={c.customer_name} value={c.customer_name}>
                {c.customer_name}
              </option>
            ))}
          </select>
        </div>

        {/* CREATE DASHBOARD */}
        <div className="flex-[1.2]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Create Dashboard{" "}
            <span className="text-xs text-gray-500">(requires customer)</span>
          </label>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-md px-3 py-2"
              placeholder="Dashboard name (e.g. Utilities Room)"
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              disabled={!selectedCustomer || loading}
            />

            <button
              type="button"
              disabled={!selectedCustomer || loading}
              onClick={handleCreate}
              className={`px-4 py-2 rounded-md text-white ${
                !selectedCustomer || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              title={
                !selectedCustomer
                  ? "Pick a customer first to create"
                  : "Create dashboard"
              }
            >
              + Create
            </button>
          </div>

          {!selectedCustomer ? (
            <div className="text-xs text-gray-500 mt-1">
              Pick a customer above to enable Create.
            </div>
          ) : null}
        </div>
      </div>

      {/* SEARCH + MSG */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex-1">
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Search dashboards (name / customer)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="button"
          disabled={loading}
          className={`text-sm px-4 py-2 border rounded-md ${
            loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white hover:bg-gray-100"
          }`}
          onClick={() => {
            fetchDashboards(selectedCustomer || "")
              .then(() => setMsg(""))
              .catch((err) => {
                console.error(err);
                setMsg(String(err?.message || err));
              });
          }}
          title="Refresh dashboards"
        >
          Refresh
        </button>
      </div>

      {msg ? <div className="mb-4 text-sm text-gray-800">{msg}</div> : null}

      {/* LIST */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 flex items-center justify-between">
          <span>
            {selectedCustomer
              ? `Dashboards — ${selectedCustomer}`
              : "Dashboards — All customers"}
            <span className="ml-2 text-xs text-gray-500">
              ({filteredDashboards.length})
            </span>
          </span>

          {search ? (
            <span className="text-xs text-gray-500">Search: “{search}”</span>
          ) : null}
        </div>

        {/* ✅ SCROLLABLE LIST CONTAINER */}
        <div className="max-h-[520px] overflow-y-auto">
          {filteredDashboards.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">No dashboards found.</div>
          ) : selectedCustomer ? (
            // ✅ Flat list when filtering a single customer
            <div className="divide-y">
              {filteredDashboards.map((d) => (
                <div
                  key={d.id}
                  className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {d.dashboard_name}
                    </div>

                    <div className="text-xs text-gray-500">
                      Customer: {d.customer_name}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md text-sm border bg-white hover:bg-gray-100"
                      onClick={() => onOpenDashboard?.(d)}
                      title="Open this dashboard in the main editor"
                    >
                      ✎ Open / Edit
                    </button>

                    <button
                      type="button"
                      className="px-3 py-2 rounded-md text-sm border bg-green-600 text-white hover:bg-green-700"
                      onClick={() => onLaunchDashboard?.(d)}
                      title="Launch play-mode in a new tab"
                    >
                      🚀 Launch
                    </button>

                    {/* ✅ DELETE */}
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md text-sm border bg-red-600 text-white hover:bg-red-700"
                      onClick={() => setDeleteTarget(d)}
                      title="Delete this dashboard"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ✅ Grouped list when showing ALL customers
            <div className="divide-y">
              {groupKeys.map((customerName) => (
                <div
                  key={customerName}
                  className="border border-blue-200 rounded-md mb-3 overflow-hidden"
                >
                  {/* ✅ BLUE CUSTOMER HEADER */}
                  <div className="px-4 py-2 bg-blue-50 border-l-4 border-blue-600 text-sm font-semibold text-blue-800 flex items-center justify-between">
                    <span className="uppercase tracking-wide">
                      {customerName}
                    </span>
                    <span className="text-xs text-blue-600">
                      {groupedByCustomer[customerName].length} dashboards
                    </span>
                  </div>

                  <div className="divide-y">
                    {groupedByCustomer[customerName].map((d) => (
                      <div
                        key={d.id}
                        className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50"
                      >
                        <div>
                          <div className="font-semibold text-gray-900">
                            {d.dashboard_name}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="px-3 py-2 rounded-md text-sm border bg-white hover:bg-gray-100"
                            onClick={() => onOpenDashboard?.(d)}
                            title="Open this dashboard in the main editor"
                          >
                            ✎ Open / Edit
                          </button>

                          <button
                            type="button"
                            className="px-3 py-2 rounded-md text-sm border bg-green-600 text-white hover:bg-green-700"
                            onClick={() => onLaunchDashboard?.(d)}
                            title="Launch play-mode in a new tab"
                          >
                            🚀 Launch
                          </button>

                          {/* ✅ DELETE */}
                          <button
                            type="button"
                            className="px-3 py-2 rounded-md text-sm border bg-red-600 text-white hover:bg-red-700"
                            onClick={() => setDeleteTarget(d)}
                            title="Delete this dashboard"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================
          ✅ DELETE CONFIRM MODAL
         ========================= */}
      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          onMouseDown={() => {
            // click outside closes (optional)
            if (!isDeleting) setDeleteTarget(null);
          }}
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-[92%] max-w-[520px] bg-white rounded-xl shadow-xl border p-5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-gray-900">
              Delete dashboard?
            </div>

            <div className="mt-2 text-sm text-gray-700">
              Are you sure you want to eliminate dashboard{" "}
              <b>“{deleteTarget.dashboard_name}”</b>?
              <div className="mt-1 text-xs text-gray-500">
                This action cannot be undone.
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md border bg-white hover:bg-gray-100 text-sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`px-4 py-2 rounded-md text-sm text-white ${
                  isDeleting
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
