import { useEffect, useState } from "react";
import type { LocationData } from "../types/location";
import { loadLocationData } from "../utils/api";

export function useLocationData() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    loadLocationData().then(setLocationData);
  }, []);

  return locationData;
}
