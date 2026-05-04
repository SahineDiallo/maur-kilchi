import { create } from "zustand";

type Coords = { latitude: number; longitude: number };

interface LocationState {
  coords: Coords | null;
  inMauritania: boolean | null;
  detectedCity: string | null;
  setLocation: (coords: Coords | null, inMauritania: boolean | null, detectedCity: string | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  inMauritania: null,
  detectedCity: null,
  setLocation: (coords, inMauritania, detectedCity) => set({ coords, inMauritania, detectedCity }),
}));
