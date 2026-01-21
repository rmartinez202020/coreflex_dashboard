// src/components/DashboardAdminPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

/**
 * DashboardAdminPage
 * - Pick Customer (no location for now)
 * - Create Dashboard
 * - List Dashboards
 * - Open/Edit (loads it into your main editor)
 * - Launch (opens play-mode in new tab)
 *
 * IMPORTANT:
 * - This page must be fed by App.jsx with:
 *    onOpenDashboard(dashboardRow)
 *    onLaunchDashboard(dashboardRow)
 */
export default function DashboardAdminPage({
  onOpenDashboard, // (dashboardRow) => void
  onLaunchDashboard, // (dashboardRow) => void
}) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [dashboards, setDashboards] = useState([]);

  const [newDashboardName, setNewDashboardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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

    // normalize + unique by customer_name
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
        // Default: show nothing until customer is picked (this is your "FIRST STEP")
        setDashboards([]);
      } catch (e) {
        console.error(e);
        setMsg(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // -----------------------------
  // ✅ When customer changes, load dashboards for that customer
  // -----------------------------
  useEffect(() => {
    (async () => {
      try {
        setMsg("");
        if (!selectedCustomer) {
          setDashboards([]);
          return;
        }
        await fetchDashboards(selectedCustomer);
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
  // ✅ UI
  // -----------------------------
  return (
    <div className="w-full h-full border rounded-lg bg-white p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-sm text-gray-600">
          Pick a customer, create dashboards, then open them in the editor.
        </p>
      </div>

      {/* CUSTOMER PICKER + CREATE */}
      <div className="flex flex-col md:flex-row gap-3 md:items-end mb-4">
        {/* PICK CUSTOMER (FIRST STEP) */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Pick Customer <span className="text-red-500">*</span>
          </label>

          <select
            className="w-full border rounded-md px-3 py-2"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Select customer --</option>
            {customers.map((c) => (
              <option key={c.customer_name} value={c.customer_name}>
                {c.customer_name}
              </option>
            ))}
          </select>

          <div className="text-xs text-gray-500 mt-1">
            Customers come from your saved Customer/Locations list.
          </div>
        </div>

        {/* CREATE DASHBOARD */}
        <div className="flex-[1.2]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Create Dashboard
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
                  ? "Pick a customer first"
                  : "Create dashboard"
              }
            >
              + Create
            </button>
          </div>

          {!selectedCustomer ? (
            <div className="text-xs text-gray-500 mt-1">
              Pick a customer first (required).
            </div>
          ) : null}
        </div>
      </div>

      {msg ? <div className="mb-4 text-sm text-gray-800">{msg}</div> : null}

      {/* LIST (only after customer chosen) */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 flex items-center justify-between">
          <span>
            List Dashboards{" "}
            {selectedCustomer ? `— ${selectedCustomer}` : "(pick a customer)"}
          </span>

          <button
            type="button"
            disabled={!selectedCustomer || loading}
            className={`text-xs px-3 py-1 border rounded-md ${
              !selectedCustomer || loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
            }`}
            onClick={() => {
              if (!selectedCustomer) return;
              fetchDashboards(selectedCustomer).catch((err) => {
                console.error(err);
                setMsg(String(err?.message || err));
              });
            }}
          >
            Refresh
          </button>
        </div>

        {!selectedCustomer ? (
          <div className="p-4 text-sm text-gray-600">
            Pick a customer to see dashboards.
          </div>
        ) : (
          <div className="divide-y">
            {dashboards.length === 0 ? (
              <div className="p-4 text-sm text-gray-600">
                No dashboards yet for <b>{selectedCustomer}</b>.
              </div>
            ) : (
              dashboards.map((d) => (
                <div
                  key={d.id}
                  className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {d.dashboard_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Customer: {d.customer_name} • ID: {d.id}
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Next later: Versions / Permissions.
      </div>
    </div>
  );
}
