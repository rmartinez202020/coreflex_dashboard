// src/components/homepagesections/TenantUsersPage.jsx
import React, { useMemo, useState } from "react";

const ACCESS_OPTIONS = [
  { value: "read", label: "Read" },
  { value: "read_control", label: "Read + Control" },
];

function normalizeAccess(value) {
  const v = String(value || "").toLowerCase();
  if (v === "read_control") return "read_control";
  return "read";
}

export default function TenantUsersPage({ onGoBack }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    access: "read",
    dashboards: [],
  });

  // MOCK dashboards (later you will load from backend)
  const dashboards = useMemo(
    () => [
      { id: "1", name: "Main Dashboard" },
      { id: "2", name: "Utilities Room" },
      { id: "3", name: "Pump Station" },
    ],
    []
  );

  const handleCreateUser = () => {
    if (!form.name || !form.email) return;

    const newUser = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      access: normalizeAccess(form.access),
      dashboards: form.dashboards,
    };

    setUsers((prev) => [...prev, newUser]);

    // reset
    setForm({
      name: "",
      email: "",
      access: "read",
      dashboards: [],
    });

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

  return (
    <div className="w-full h-full border rounded-lg bg-white p-6">
      {/* HEADER */}
      <div className="mb-6 rounded-lg bg-[#374151] text-white px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tenant Users & Access</h2>
          <p className="text-sm text-gray-200">
            Create tenant users and assign dashboard access by permission level.
          </p>
        </div>

        <button
          onClick={onGoBack}
          className="px-3 py-1 rounded-md bg-[#4B5563] hover:bg-[#6B7280] text-sm"
        >
          ← Back
        </button>
      </div>

      {/* ACTION BAR */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-md font-semibold text-gray-800">
          Tenant Users ({users.length})
        </h3>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          + Add User
        </button>
      </div>

      {/* TABLE */}
      <div className="border rounded-md overflow-hidden">
        <div className="grid grid-cols-4 bg-gray-100 text-sm font-semibold text-gray-700 px-4 py-2">
          <div>Name</div>
          <div>Email</div>
          <div>Access</div>
          <div>Dashboards</div>
        </div>

        {users.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No users created yet.</div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-4 px-4 py-2 text-sm border-t"
            >
              <div>{u.name}</div>
              <div>{u.email}</div>
              <div>
                {u.access === "read_control" ? "Read + Control" : "Read"}
              </div>
              <div className="text-xs text-gray-600">
                {u.dashboards.length === 0
                  ? "—"
                  : dashboards
                      .filter((d) => u.dashboards.includes(d.id))
                      .map((d) => d.name)
                      .join(", ")}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-white w-[500px] rounded-lg shadow-lg p-5">
            <h3 className="text-lg font-semibold mb-3">Create User</h3>

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
              className="w-full border rounded-md px-3 py-2 mb-3"
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

            {/* DASHBOARDS */}
            <div className="mb-3">
              <div className="text-sm font-semibold mb-1">
                Assign Dashboards
              </div>

              <div className="space-y-1 max-h-[120px] overflow-y-auto border rounded-md p-2">
                {dashboards.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.dashboards.includes(d.id)}
                      onChange={() => toggleDashboard(d.id)}
                    />
                    {d.name}
                  </label>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateUser}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}