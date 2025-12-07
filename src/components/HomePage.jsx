import React from "react";

export default function HomePage({ setActiveSubPage, setSubPageColor }) {
  return (
    <>
      {/* TOP ROW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* PROFILE CARD */}
        <div
          className="rounded-xl bg-blue-600 text-white p-4 md:p-5 flex flex-col justify-between cursor-pointer"
          onClick={() => {
            setActiveSubPage("profile");
            setSubPageColor("bg-blue-600");
          }}
        >
          <h2 className="text-lg font-semibold mb-2">Profile</h2>
          <p className="text-sm text-blue-100">
            View and edit your profile.
          </p>
        </div>

        {/* LOCATIONS CARD */}
        <div className="rounded-xl bg-teal-500 text-white p-4 md:p-5 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">Locations</h2>
          <p className="text-sm text-teal-100">
            Manage customer sites.
          </p>
        </div>

        {/* DEVICES CARD */}
        <div className="rounded-xl bg-orange-500 text-white p-4 md:p-5 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">
            Registered Devices
          </h2>
          <p className="text-sm text-orange-100">
            Review all sensors and gateways.
          </p>
        </div>

      </div>

      {/* ADMIN DASHBOARD CARD */}
      <div className="mt-4 md:mt-6">
        <div className="rounded-xl bg-gray-700 text-white p-4 md:p-5 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">Admin Dashboard</h2>
          <p className="text-sm text-gray-200 mb-2">
            Central control for users, locations and devices.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs md:text-sm">
            <span>• Manage Users</span>
            <span>• Manage Devices</span>
            <span>• Manage Locations</span>
            <span>• Billing</span>
            <span>• Logs</span>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

        <div className="rounded-xl bg-slate-600 text-white p-4 md:p-5 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">Settings</h2>
          <p className="text-sm text-slate-100">
            Configure preferences.
          </p>
        </div>

        <div className="rounded-xl bg-emerald-500 text-white p-4 md:p-5 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">Billing & Payments</h2>
          <p className="text-sm text-emerald-100">
            Manage subscriptions.
          </p>
        </div>

        <div className="rounded-xl bg-gray-800 text-white p-4 md:p-5 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">Logs & Activity</h2>
          <p className="text-sm text-gray-200">
            Audit recent events.
          </p>
        </div>

      </div>
    </>
  );
}
