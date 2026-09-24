import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

/**
 * TagExplorerSection
 *
 * Tag management / visualization page.
 *
 * FINAL COLUMN ORDER:
 * 1. Device/Model
 * 2. Device ID #
 * 3. Tag
 * 4. Description
 * 5. Current Value
 * 6. Math
 * 7. Unit
 * 8. Group
 * 9. Actions
 *
 * NOTE:
 * For now this is the frontend structure.
 * Later we will connect it to the real registered devices,
 * live telemetry, and backend tag configuration.
 */

const DEVICE_SOURCES = [
  { deviceModel: "CF-2000", endpoint: "/zhc1921/my-devices", points: [
    ["DI-1","in1"],["DI-2","in2"],["DI-3","in3"],["DI-4","in4"],["DI-5","in5"],["DI-6","in6"],
    ["DO-1","do1"],["DO-2","do2"],["DO-3","do3"],["DO-4","do4"],
    ["AI-1","ai1"],["AI-2","ai2"],["AI-3","ai3"],["AI-4","ai4"]
  ]},
  { deviceModel: "CF-1600", endpoint: "/zhc1661/my-devices", points: [
    ["AI-1","ai1"],["AI-2","ai2"],["AO-1","ao1"],["AO-2","ao2"]
  ]},
  { deviceModel: "TP-4000", endpoint: "/tp4000/my-devices", points: [
    ["TE-101","te101"],["TE-102","te102"],["TE-103","te103"],["TE-104","te104"],
    ["TE-105","te105"],["TE-106","te106"],["TE-107","te107"],["TE-108","te108"]
  ]}
];

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildTagRows(source, devices) {
  return (Array.isArray(devices) ? devices : []).flatMap((device) => {
    const deviceId = String(device?.deviceId ?? "").trim();
    if (!deviceId) return [];
    return source.points.map(([tag, key]) => ({
      id: `${source.deviceModel}:${deviceId}:${tag}`,
      deviceModel: source.deviceModel,
      deviceId,
      tag,
      description: "",
      currentValue: device?.[key] ?? "",
      math: "",
      unit: "",
      group: "",
    }));
  });
}

/* ============================================================
   SMALL HELPERS
   ============================================================ */

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function uniqueValues(rows, key) {
  return Array.from(
    new Set(
      rows
        .map((row) => safeText(row[key]).trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/* ============================================================
   SEARCHABLE FILTER DROPDOWN
   ============================================================ */

function SearchableFilter({
  label,
  value,
  options,
  allLabel,
  searchPlaceholder,
  onChange,
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const filteredOptions = options.filter((option) =>
    safeText(option)
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const displayValue = value || allLabel;

  function selectOption(nextValue) {
    onChange(nextValue);
    setOpen(false);
    setSearch("");
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full sm:w-[280px]"
    >
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          flex
          h-11
          w-full
          items-center
          justify-between
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          text-left
          text-sm
          font-semibold
          text-slate-800
          shadow-sm
          transition
          hover:border-amber-300
          hover:bg-amber-50/30
          focus:border-amber-400
          focus:outline-none
          focus:ring-2
          focus:ring-amber-100
        "
      >
        <span className="truncate">{displayValue}</span>

        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          className="
            absolute
            left-0
            top-[calc(100%+8px)]
            z-50
            w-full
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
            shadow-xl
          "
        >
          {/* SEARCH IS ALWAYS FIRST */}
          <div className="border-b border-slate-100 p-2.5">
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                autoFocus
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-slate-200
                  bg-slate-50
                  pl-9
                  pr-3
                  text-sm
                  text-slate-800
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-amber-400
                  focus:bg-white
                  focus:ring-2
                  focus:ring-amber-100
                "
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {/* ALL OPTION */}
            <button
              type="button"
              onClick={() => selectOption("")}
              className={`
                flex
                w-full
                items-center
                justify-between
                px-4
                py-2.5
                text-left
                text-sm
                transition
                ${
                  value === ""
                    ? "bg-amber-50 font-bold text-amber-900"
                    : "text-slate-700 hover:bg-slate-50"
                }
              `}
            >
              <span>{allLabel}</span>

              {value === "" && (
                <span className="text-amber-500">✓</span>
              )}
            </button>

            {/* AVAILABLE OPTIONS */}
            {filteredOptions.map((option) => {
              const selected = value === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectOption(option)}
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    px-4
                    py-2.5
                    text-left
                    text-sm
                    transition
                    ${
                      selected
                        ? "bg-amber-50 font-bold text-amber-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }
                  `}
                >
                  <span className="truncate">{option}</span>

                  {selected && (
                    <span className="text-amber-500">✓</span>
                  )}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="px-4 py-5 text-center text-sm text-slate-400">
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   EDIT FIELD
   ============================================================ */

function EditableInput({
  value,
  placeholder,
  onChange,
  minWidth = "min-w-[150px]",
}) {
  return (
    <input
      type="text"
      value={safeText(value)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`
        ${minWidth}
        h-9
        w-full
        rounded-lg
        border
        border-slate-200
        bg-white
        px-3
        text-sm
        text-slate-800
        outline-none
        transition
        placeholder:text-slate-300
        focus:border-amber-400
        focus:ring-2
        focus:ring-amber-100
      `}
    />
  );
}

/* ============================================================
   MAIN TAG EXPLORER
   ============================================================ */

export default function TagExplorerSection({ onBack }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const rowsRef = React.useRef([]);
  const loadingRef = React.useRef(false);

  const [deviceIdFilter, setDeviceIdFilter] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState("");

  const [savedRowIds, setSavedRowIds] = React.useState([]);

  React.useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const loadRegisteredDevices = React.useCallback(async ({ silent = false } = {}) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!silent) setLoading(true);
    setLoadError("");

    try {
      if (!String(getToken() || "").trim()) {
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const resultSets = await Promise.all(
        DEVICE_SOURCES.map(async (source) => {
          const res = await fetch(`${API_URL}${source.endpoint}`, {
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.detail || `Failed to load ${source.deviceModel} devices (${res.status})`);
          }
          return buildTagRows(source, await res.json());
        })
      );

      const oldRows = new Map(rowsRef.current.map((row) => [row.id, row]));
      const nextRows = resultSets.flat().map((live) => {
        const old = oldRows.get(live.id);
        return old ? {
          ...live,
          description: old.description,
          math: old.math,
          unit: old.unit,
          group: old.group,
        } : live;
      });

      rowsRef.current = nextRows;
      setRows(nextRows);
    } catch (e) {
      setLoadError(e?.message || "Failed to load registered devices.");
    } finally {
      loadingRef.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRegisteredDevices({ silent: false });
    const id = window.setInterval(() => {
      if (!document.hidden) loadRegisteredDevices({ silent: true });
    }, 3000);
    return () => window.clearInterval(id);
  }, [loadRegisteredDevices]);

  const deviceIds = React.useMemo(
    () => uniqueValues(rows, "deviceId"),
    [rows]
  );

  const groups = React.useMemo(
    () => uniqueValues(rows, "group"),
    [rows]
  );

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const deviceMatches =
        !deviceIdFilter || row.deviceId === deviceIdFilter;

      const groupMatches =
        !groupFilter || row.group === groupFilter;

      return deviceMatches && groupMatches;
    });
  }, [rows, deviceIdFilter, groupFilter]);

  function updateRow(rowId, field, value) {
    setRows((previousRows) =>
      previousRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );

    setSavedRowIds((previous) =>
      previous.filter((id) => id !== rowId)
    );
  }

  function saveRow(rowId) {
    /*
     * Backend save will be connected later.
     * For now this visually confirms the row was saved.
     */

    setSavedRowIds((previous) =>
      previous.includes(rowId)
        ? previous
        : [...previous, rowId]
    );
  }

  function clearFilters() {
    setDeviceIdFilter("");
    setGroupFilter("");
  }

  const filtersActive = Boolean(deviceIdFilter || groupFilter);

  return (
    <div className="mt-4 md:mt-6">
      {/* ======================================================
          TOP BAR — BACK + TAG EXPLORER
          ====================================================== */}

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <button type="button" onClick={onBack}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
          <span aria-hidden="true">←</span>
          Back to Home
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">🏷️</div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight text-slate-900">Tag Explorer</h1>
            <p className="mt-0.5 hidden text-xs text-slate-500 lg:block">
              View, document, organize, and manage your device points.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTER AREA
          ====================================================== */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* DEVICE ID FILTER */}

            <SearchableFilter
              label="Device ID #"
              value={deviceIdFilter}
              options={deviceIds}
              allLabel="All Devices"
              searchPlaceholder="Search Device ID..."
              onChange={setDeviceIdFilter}
            />

            {/* GROUP FILTER */}

            <SearchableFilter
              label="Group"
              value={groupFilter}
              options={groups}
              allLabel="All Groups"
              searchPlaceholder="Search Group..."
              onChange={setGroupFilter}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredRows.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {rows.length}
              </span>{" "}
              tags
            </div>

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-2
                  text-xs
                  font-bold
                  text-slate-600
                  transition
                  hover:bg-slate-50
                "
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLE
          ====================================================== */}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1500px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-amber-200 bg-amber-50">
                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Device/Model
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Device ID #
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Tag
                </th>

                <th className="min-w-[280px] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Description
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Current Value
                </th>

                <th className="min-w-[170px] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Math
                </th>

                <th className="min-w-[130px] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Unit
                </th>

                <th className="min-w-[170px] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Group
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && rows.length === 0 && (
                <tr><td colSpan={9} className="px-6 py-16 text-center text-slate-500">Loading registered devices...</td></tr>
              )}

              {!loading && loadError && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="font-bold text-red-700">Unable to load registered devices</div>
                    <div className="mt-2 text-sm text-red-600">{loadError}</div>
                    <button type="button" onClick={() => loadRegisteredDevices({ silent: false })}
                      className="mt-4 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-500">
                      Retry
                    </button>
                  </td>
                </tr>
              )}

              {filteredRows.map((row) => {
                const saved = savedRowIds.includes(row.id);

                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                  >
                    {/* DEVICE / MODEL */}

                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {row.deviceModel}
                      </div>
                    </td>

                    {/* DEVICE ID */}

                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-mono text-sm text-slate-700">
                        {row.deviceId}
                      </span>
                    </td>

                    {/* TAG */}

                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-bold text-slate-800">
                        {row.tag}
                      </span>
                    </td>

                    {/* DESCRIPTION */}

                    <td className="px-4 py-3">
                      <EditableInput
                        value={row.description}
                        placeholder="Add description..."
                        minWidth="min-w-[260px]"
                        onChange={(value) =>
                          updateRow(
                            row.id,
                            "description",
                            value
                          )
                        }
                      />
                    </td>

                    {/* CURRENT VALUE */}

                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="inline-flex min-w-[80px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-bold text-slate-900">
                        {safeText(row.currentValue) || "—"}
                      </div>
                    </td>

                    {/* MATH */}

                    <td className="px-4 py-3">
                      <EditableInput
                        value={row.math}
                        placeholder="Example: x * 0.1"
                        minWidth="min-w-[160px]"
                        onChange={(value) =>
                          updateRow(row.id, "math", value)
                        }
                      />
                    </td>

                    {/* UNIT */}

                    <td className="px-4 py-3">
                      <EditableInput
                        value={row.unit}
                        placeholder="Unit"
                        minWidth="min-w-[110px]"
                        onChange={(value) =>
                          updateRow(row.id, "unit", value)
                        }
                      />
                    </td>

                    {/* GROUP */}

                    <td className="px-4 py-3">
                      <EditableInput
                        value={row.group}
                        placeholder="Add group..."
                        minWidth="min-w-[160px]"
                        onChange={(value) =>
                          updateRow(row.id, "group", value)
                        }
                      />
                    </td>

                    {/* ACTIONS */}

                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        onClick={() => saveRow(row.id)}
                        className={`
                          inline-flex
                          h-9
                          items-center
                          justify-center
                          rounded-lg
                          px-4
                          text-sm
                          font-bold
                          shadow-sm
                          transition
                          ${
                            saved
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "bg-amber-400 text-slate-950 hover:bg-amber-500"
                          }
                        `}
                      >
                        {saved ? "✓ Saved" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && !loadError && filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center"
                  >
                    <div className="text-3xl">🏷️</div>

                    <div className="mt-3 text-base font-bold text-slate-700">
                      No tags found
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      No tags match the selected Device ID and
                      Group filters.
                    </div>

                    {filtersActive && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-500"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Device values will update automatically when live
            telemetry is connected.
          </span>

          <span>
            Scroll inside the tag table to move up/down or left/right.
          </span>
        </div>
      </div>
    </div>
  );
}