import React, { useEffect, useMemo, useState } from "react";
import { Country, State, City } from "country-state-city";

/**
 * AddressPicker
 * - Country -> State -> City cascading selects
 * - Outputs: { country, state, city, street, zip }
 *
 * Props:
 * - value: { country, state, city, street, zip }
 * - onChange: (nextValue) => void
 */
export default function AddressPicker({ value, onChange }) {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const [countryIso, setCountryIso] = useState("");
  const [stateIso, setStateIso] = useState("");

  const setField = (key, v) => {
    onChange?.({ ...(value || {}), [key]: v });
  };

  // ✅ Initialize country (default US)
  useEffect(() => {
    const desiredName = value?.country || "United States";

    const match =
      countries.find((c) => c.name === desiredName) ||
      countries.find((c) => c.isoCode === "US") ||
      countries.find((c) => c.name.toLowerCase().includes("united states"));

    if (match) {
      setCountryIso(match.isoCode);

      // also keep parent country name consistent
      if (!value?.country || value.country !== match.name) {
        setField("country", match.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);

  const states = useMemo(() => {
    if (!countryIso) return [];
    return State.getStatesOfCountry(countryIso);
  }, [countryIso]);

  const cities = useMemo(() => {
    if (!countryIso || !stateIso) return [];
    return City.getCitiesOfState(countryIso, stateIso);
  }, [countryIso, stateIso]);

  // ✅ CRITICAL FIX:
  // If parent already has a state NAME (value.state), sync internal stateIso
  useEffect(() => {
    if (!countryIso) return;

    const stateName = (value?.state || "").trim();
    if (!stateName) return;

    const match = states.find(
      (s) => s.name.toLowerCase() === stateName.toLowerCase()
    );

    if (match && match.isoCode !== stateIso) {
      setStateIso(match.isoCode);
    }
  }, [countryIso, states, value?.state, stateIso]);

  // ✅ If state changes and current city isn't valid anymore, clear city
  useEffect(() => {
    if (!stateIso) return;
    if (!value?.city) return;

    const cityName = value.city.trim();
    const cityExists = cities.some(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );

    if (!cityExists) setField("city", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateIso, cities]);

  return (
    <div className="space-y-4">
      {/* Country */}
      <div>
        <label className="block text-gray-700 text-sm mb-1">Country</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={countryIso}
          onChange={(e) => {
            const iso = e.target.value;
            setCountryIso(iso);
            setStateIso("");

            const countryName =
              countries.find((c) => c.isoCode === iso)?.name || "";

            setField("country", countryName);
            setField("state", "");
            setField("city", "");
          }}
        >
          <option value="" disabled>
            Select country...
          </option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* State */}
      <div>
        <label className="block text-gray-700 text-sm mb-1">State</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={stateIso}
          onChange={(e) => {
            const iso = e.target.value;
            setStateIso(iso);

            const stateName = states.find((s) => s.isoCode === iso)?.name || "";
            setField("state", stateName);
            setField("city", "");
          }}
          disabled={!countryIso}
        >
          <option value="" disabled>
            {countryIso ? "Select state..." : "Select country first"}
          </option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="block text-gray-700 text-sm mb-1">City</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={value?.city || ""}
          onChange={(e) => setField("city", e.target.value)}
          disabled={!stateIso}
        >
          <option value="" disabled>
            {stateIso ? "Select city..." : "Select state first"}
          </option>
          {cities.map((c) => (
            <option key={`${c.name}-${c.latitude}-${c.longitude}`} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Street */}
      <div>
        <label className="block text-gray-700 text-sm mb-1">Street Address</label>
        <input
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="123 Industrial Ave"
          value={value?.street || ""}
          onChange={(e) => setField("street", e.target.value)}
        />
      </div>

      {/* ZIP */}
      <div>
        <label className="block text-gray-700 text-sm mb-1">ZIP</label>
        <input
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="07102"
          value={value?.zip || ""}
          onChange={(e) => setField("zip", e.target.value)}
        />
      </div>
    </div>
  );
}
