export default function Tank({ sensor }) {
  const levelPercent = Math.round(sensor.level_percent || 0);

  return (
    <div className="flex items-start space-x-6 p-4 bg-white rounded-lg shadow-md w-[350px]">
      
      {/* TANK VISUAL */}
      <div className="relative w-32 h-40 border border-gray-400 rounded-t-full overflow-hidden">
        {/* Liquid fill */}
        <div 
          className="absolute bottom-0 w-full bg-yellow-300 transition-all duration-700"
          style={{ height: `${levelPercent}%` }}
        ></div>

        {/* % text */}
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
          {levelPercent}%
        </div>
      </div>

      {/* SENSOR INFO */}
      <div className="text-gray-700 text-sm">
        <p><strong>IMEI:</strong> {sensor.imei}</p>
        <p><strong>Temperature:</strong> {sensor.temperature}°F</p>
        <p><strong>Date Received:</strong> {sensor.date_received}</p>
        <p><strong>Time Received:</strong> {sensor.time_received}</p>
      </div>
    </div>
  );
}
