import React from "react";

export default function ProfilePage({ subPageColor, setActiveSubPage }) {
  return (
    <div className="w-full h-full">
      
      {/* PROFILE HEADER */}
      <div
        className={`w-full p-4 rounded-lg text-white ${
          subPageColor || "bg-blue-600"
        }`}
      >
        <button
          onClick={() => {
            setActiveSubPage(null);
          }}
          className="bg-white bg-opacity-20 hover:bg-opacity-40 text-white px-3 py-1 rounded"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold mt-2">Profile</h2>
      </div>

      {/* PROFILE CONTENT */}
      <div className="mt-4 bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Profile Information
        </h3>

        <p className="text-gray-600 text-sm mb-4">
          Here you can edit your CoreFlex user information.
        </p>

        <div className="space-y-4">

          {/* FULL NAME */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Full Name
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="John Doe"
            />
          </div>

          {/* ROLE / POSITION */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Role / Position
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Engineer, Integrator, Technician..."
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Email
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="email@example.com"
            />
          </div>

          {/* COMPANY */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Company
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Company"
            />
          </div>

          {/* COMPANY ADDRESS */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Company Address
            </label>
            <input
              className="w-full p-2 border:border-gray-300 rounded-md"
              placeholder="123 Industrial Ave, OH....."
            />
          </div>

        </div>

        <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Save Changes
        </button>
      </div>
    </div>
  );
}
