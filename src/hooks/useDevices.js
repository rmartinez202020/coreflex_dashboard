import { useEffect, useState } from "react";

export default function useDevices() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/devices")
      .then((res) => res.json())
      .then((data) =>
        setDevices(
          data.map((s) => ({
            ...s,
            level_percent: Math.min(
              100,
              Math.round((s.level / 55) * 100)
            ),
            date_received: s.last_update.split("T")[0],
            time_received: new Date(s.last_update).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))
        )
      );
  }, []);

  return devices;
}
