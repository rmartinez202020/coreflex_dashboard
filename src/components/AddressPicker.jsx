import React, { useEffect, useMemo, useState } from "react";
import { Country, State, City } from "country-state-city";

/**
 * AddressPicker
 * - Country -> State -> City cascading selects
 * - value: { country, state, city, street, zip }  (state/city are NAMES)
 * - onChange: (nextValue) => void
 */
export default function AddressPicker({ value, onChange }) {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const [countryIso, setCountryIso] = useState("");
  const [stateIso, setStateIso] = useState("");

  const update = (patch) => {
    onChange?.({ ...(value || {}), ...patch });
  };

  // ✅ Initialize / sync Country ISO from value.country (name or iso)
  useEffect(() => {
    const vCountry = value?.country || "United States";

    const match =
      countries.find((c) => c.name === vCountry) ||
      countries.find((c) => c.isoCode === vCountry) ||
      countries.find((c) => c.isoCode === "US") ||
      countries.find((c) => c.name.toLowerCase().includes("united states"));

    if (!match) return;

    setCountryIso(match.isoCode);

    // keep parent value consistent
    if ((value?.country || "") !== match.name) {
      update({ country: match.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);

  const states = useMemo(() => {
    if (!countryIso) return [];
    return State.getStatesOfCountry(countryIso);
  }, [countryIso]);

  // ✅ Sync State ISO from value.state (NAME)
  useEffect(() => {
    if (!countryIso) return;

    const vStateName = (value?.state || "").trim();
    if (!vStateName) {
      setStateIso("");
      return;
    }

    const match = states.find((s) => s.name === vStateName);
    if (match && match.isoCode !== stateIso) {
      setStateIso(match.isoCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIso, states, value?.state]);

  const cities = useMemo(() => {
    if (!countryIso || !stateIso) return [];
    return City.getCitiesOfState(countryIso, stateIso);
  }, [countryIso, stateIso]);

  const cityValue = (value?.city || "").trim();

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

            // ✅ one update only
            update({
              country: countryName,
              state: "",
              city: "",
            });
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

            // ✅ one update only
            update({
              state: stateName,
              city: "",
            });
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
          value={cityValue}
          onChange={(e) => update({ city: e.target.value })}
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
          onChange={(e) => update({ street: e.target.value })}
        />
      </div>

      {/* ZIP */}
      <div>
        <label className="block text-gray-700 text-sm mb-1">ZIP</label>
        <input
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="07102"
          value={value?.zip || ""}
          onChange={(e) => update({ zip: e.target.value })}
        />
      </div>
    </div>
  );
}
