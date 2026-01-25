// src/hooks/useAlarmsMockData.js
import { useEffect, useState } from "react";

export default function useAlarmsMockData() {
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAlarms((prev) => [
        {
          id: crypto.randomUUID(),
          active: true,
          acknowledged: false,
          severity: Math.floor(Math.random() * 5) + 1,
          text: "Exceeded threshold values",
          time: new Date().toLocaleString(),
          groupName: "Turbine",
          controller: "Unit 01",
          color: "#16a34a",
        },
        ...prev.slice(0, 50),
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return alarms;
}
