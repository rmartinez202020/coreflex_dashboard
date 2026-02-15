import React, { useMemo } from "react";

/**
 * Math panel
 * - Uses a "VALUE" placeholder (case-insensitive) for the selected AI value
 * - Supports basic arithmetic: + - * / % and parentheses
 * - Supports CONCAT("text", VALUE, "text") for string output
 */

function safeEvalMathExpression(expr) {
  // Allow only digits, operators, parentheses, dot, whitespace, and VALUE letters (already replaced before calling)
  // This function expects VALUE has already been replaced with a number string.
  const allowed = /^[0-9+\-*/%.()\s]+$/;
  if (!allowed.test(expr)) {
    throw new Error("Invalid characters in formula.");
  }

  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${expr});`);
  return fn();
}

function splitArgsTopLevel(s) {
  // Splits by commas, but ignores commas inside quotes.
  const out = [];
  let cur = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if ((ch === `"` || ch === `'`) && (i === 0 || s[i - 1] !== "\\")) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inQuotes = false;
        quoteChar = "";
      }
      cur += ch;
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }

  if (cur.trim()) out.push(cur.trim());
  return out;
}

function unquote(s) {
  const t = String(s || "").trim();
  if (
    (t.startsWith(`"`) && t.endsWith(`"`)) ||
    (t.startsWith(`'`) && t.endsWith(`'`))
  ) {
    return t.slice(1, -1).replace(/\\"/g, `"`).replace(/\\'/g, `'`);
  }
  return null;
}

function evaluateFormula(formulaRaw, value) {
  const formula = String(formulaRaw || "").trim();
  if (!formula) return { ok: true, out: "" };

  const hasValue = value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  const numericValue = hasValue ? Number(value) : null;

  // CONCAT(...)
  if (/^concat\s*\(/i.test(formula) && /\)\s*$/.test(formula)) {
    const inside = formula.replace(/^concat\s*\(/i, "").replace(/\)\s*$/, "");
    const args = splitArgsTopLevel(inside);

    const parts = args.map((a) => {
      const uq = unquote(a);
      if (uq !== null) return uq;

      if (/^value$/i.test(a)) {
        return numericValue === null ? "" : String(numericValue);
      }

      // allow numeric sub-expressions too
      if (numericValue === null) return "";
      const replaced = String(a).replace(/value/gi, String(numericValue));
      const v = safeEvalMathExpression(replaced);
      return v === null || v === undefined ? "" : String(v);
    });

    return { ok: true, out: parts.join("") };
  }

  // arithmetic expression with VALUE
  if (numericValue === null) {
    return { ok: false, out: "", err: "No live value yet (VALUE is empty)." };
  }

  const replaced = formula.replace(/value/gi, String(numericValue));
  const result = safeEvalMathExpression(replaced);

  return { ok: true, out: result };
}

export default function GraphicDisplayMathPanel({
  value,
  formula,
  setFormula,
}) {
  const preview = useMemo(() => {
    try {
      const r = evaluateFormula(formula, value);
      return r;
    } catch (e) {
      return { ok: false, out: "", err: e?.message || "Invalid formula." };
    }
  }, [formula, value]);

  const liveLabel =
    value === null || value === undefined || value === ""
      ? "—"
      : Number.isFinite(Number(value))
      ? Number(value).toFixed(2)
      : String(value);

  const outputLabel =
    preview.ok && preview.out !== null && preview.out !== undefined
      ? typeof preview.out === "number"
        ? Number(preview.out).toFixed(2)
        : String(preview.out)
      : "—";

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        padding: 14,
        display: "grid",
        gap: 12,
        alignContent: "start",
      }}
    >
      <div style={{ fontWeight: 900, color: "#111827" }}>Math</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
            Live VALUE
          </div>
          <div
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 110,
              borderRadius: 999,
              padding: "6px 10px",
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: 12,
              border: "1px solid #c7e7d1",
              background: "#dff7e6",
              color: "#0b3b18",
            }}
            title="This is the selected AI live value"
          >
            {liveLabel}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
            Output
          </div>
          <div
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 110,
              borderRadius: 999,
              padding: "6px 10px",
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: 12,
              border: "1px solid #d1d5db",
              background: "#f3f4f6",
              color: "#111827",
            }}
            title="Formula output preview"
          >
            {outputLabel}
          </div>
        </div>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
          Formula
        </span>
        <textarea
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder='Example: VALUE * 2   or   CONCAT("Temp=", VALUE)'
          rows={3}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: "10px 10px",
            fontSize: 13,
            resize: "vertical",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        />
      </label>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          background: "#f9fafb",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
          Supported Operators
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: "#111827", lineHeight: 1.6 }}>
          <div><b>VALUE</b> + 10 → add</div>
          <div><b>VALUE</b> - 3 → subtract</div>
          <div><b>VALUE</b> * 2 → multiply</div>
          <div><b>VALUE</b> / 5 → divide</div>
          <div><b>VALUE</b> % 60 → modulo</div>

          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: "#111827" }}>
            Combined Examples
          </div>
          <div>(<b>VALUE</b> * 1.5) + 5 → scale & offset</div>
          <div>(<b>VALUE</b> / 4095) * 20 - 4 → ADC → 4–20 mA</div>

          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: "#111827" }}>
            String Output Examples
          </div>
          <div>CONCAT("Temp=", <b>VALUE</b>)</div>
          <div>CONCAT("Level=", <b>VALUE</b>, "%")</div>
          <div>CONCAT("Vol=", <b>VALUE</b> * 2, " Gal")</div>
        </div>

        {!preview.ok && (
          <div style={{ marginTop: 10, color: "#b42318", fontWeight: 900, fontSize: 12 }}>
            {preview.err || "Invalid formula."}
          </div>
        )}
      </div>
    </div>
  );
}
