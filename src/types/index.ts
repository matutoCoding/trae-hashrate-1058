export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timezone: string;
}

export interface MeteorShower {
  id: string;
  name: string;
  code: string;
  radiantRA: number;
  radiantDec: number;
  peakDate: string;
  zhr: number;
  activeStart: string;
  activeEnd: string;
  velocity: number;
  parentBody: string;
  magnitude: number;
}

export interface ObservationSetting {
  id: string;
  locationId: string;
  showerId: string;
  observationDate: string;
  cloudCover: number;
  lightPollution: number;
  limitingMagnitude: number;
}

export interface RadiantData {
  time: Date;
  hour: number;
  altitude: number;
  azimuth: number;
  isVisible: boolean;
}

export interface MoonData {
  time: Date;
  hour: number;
  altitude: number;
  azimuth: number;
  phase: number;
  illumination: number;
  isUp: boolean;
}

export interface SunData {
  time: Date;
  altitude: number;
  azimuth: number;
  isUp: boolean;
}

export interface ObservationWindow {
  startTime: Date;
  endTime: Date;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  avgRadiantAltitude: number;
  avgMeteorRate: number;
  moonInterference: 'none' | 'low' | 'medium' | 'high';
  reason: string;
}

export interface HourlyObservationData {
  hour: number;
  timeLabel: string;
  time: Date;
  radiantAltitude: number;
  radiantAzimuth: number;
  moonAltitude: number;
  moonIllumination: number;
  sunAltitude: number;
  isNight: boolean;
  visibleRate: number;
  peakTimeFactor: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  moonInterference: 'none' | 'low' | 'medium' | 'high';
}

export interface ObservationRecord {
  id: string;
  settingId: string;
  startTime: string;
  endTime: string;
  meteorCount: number;
  actualZH: number;
  weather: string;
  skyCondition: string;
  notes: string;
  createdAt: string;
}

export interface ShowerArchive {
  id: string;
  showerId: string;
  year: number;
  peakDate: string;
  observedZHR: number;
  moonPhase: number;
  moonIllumination: number;
  notes: string;
  recordIds: string[];
  source: 'manual' | 'auto';
  createdAt: string;
}

export interface AppState {
  currentLocation: Location | null;
  currentShower: MeteorShower | null;
  observationDate: string;
  cloudCover: number;
  lightPollution: number;
}
