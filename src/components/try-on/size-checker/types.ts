import { GarmentItem } from "../garment-selector/garment-selector";

export type UnitType = "cm" | "in";
export type FitPreference = "slim" | "regular" | "relaxed";

export interface BodyMeasurements {
  [key: string]: number;
  height: number; // always in cm internally
  chest: number;  // always in cm internally
  waist: number;  // always in cm internally
  hips: number;   // always in cm internally
}

export interface PresetProfile {
  id: string;
  label: string;
  description: string;
  height: number; // cm
  chest: number;  // cm
  waist: number;  // cm
  hips: number;   // cm
}

export interface AISizeCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGarments: GarmentItem[];
}

export interface NoGarmentSelectedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGarmentsNow: () => void;
}

export const PRESET_PROFILES: PresetProfile[] = [
  {
    id: "slim",
    label: "Slim Build",
    description: "Tighter fit across chest & waist",
    height: 172,
    chest: 90,
    waist: 74,
    hips: 92,
  },
  {
    id: "regular",
    label: "Regular Build",
    description: "Standard proportional body cut",
    height: 176,
    chest: 96,
    waist: 80,
    hips: 98,
  },
  {
    id: "athletic",
    label: "Athletic Build",
    description: "Broader shoulders & chest",
    height: 180,
    chest: 104,
    waist: 84,
    hips: 102,
  },
  {
    id: "relaxed",
    label: "Relaxed / Comfort",
    description: "Generous fit with extra ease",
    height: 178,
    chest: 110,
    waist: 92,
    hips: 108,
  },
];
