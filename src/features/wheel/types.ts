export interface WheelOption {
  id: string;
  label: string;
}

export interface Wheel {
  id: string;
  name: string;
  options: WheelOption[];
  createdAt: string;
  updatedAt: string;
  lastSpunAt?: string;
}

export const WHEEL_MIN_OPTIONS = 2;
export const WHEEL_MAX_OPTIONS = 16;
export const WHEEL_NAME_MAX = 40;
export const WHEEL_OPTION_MAX = 24;
