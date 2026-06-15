import { ASTRONOMICAL_CONSTANTS, OBSERVATION_THRESHOLDS, BORTLE_SCALE } from '@/data/constants';
import { Location, MeteorShower, RadiantData, MoonData, SunData, HourlyObservationData, ObservationWindow } from '@/types';

const { DEG_TO_RAD, RAD_TO_DEG, J2000 } = ASTRONOMICAL_CONSTANTS;
const { MIN_RADIANT_ALTITUDE, SUN_ALTITUDE_NIGHT, MAX_MOON_ILLUMINATION, GAMMA_INDEX } = OBSERVATION_THRESHOLDS;

function normalizeAngle(angle: number): number {
  let result = angle % 360;
  if (result < 0) result += 360;
  return result;
}

function normalizeHourAngle(angle: number): number {
  let result = angle % 360;
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
}

export function julianDate(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const C = Math.floor(365.25 * (y + 4716));
  const D = Math.floor(30.6001 * (m + 1));

  const jd = B + C + D + day - 1524.5;
  const jdTime = (hour + minute / 60 + second / 3600) / 24;

  return jd + jdTime;
}

export function julianCentury(date: Date): number {
  const jd = julianDate(date);
  return (jd - J2000) / 36525.0;
}

export function meanSiderealTime(date: Date, longitude: number): number {
  const jd = julianDate(date);
  const jd0 = Math.floor(jd - 0.5) + 0.5;
  const T = (jd0 - J2000) / 36525.0;

  const H = (jd - jd0) * 24;

  let GMST = 280.46061837 + 360.98564736629 * (jd - J2000)
    + 0.0003032 * T * T - T * T * T / 38710000;

  GMST = normalizeAngle(GMST);
  GMST += H * 360.98564736629 / 24;
  GMST = normalizeAngle(GMST);

  const LST = GMST + longitude;
  return normalizeAngle(LST);
}

export function equatorialToHorizontal(
  ra: number,
  dec: number,
  lst: number,
  latitude: number
): { altitude: number; azimuth: number } {
  const raRad = ra * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;
  const lstRad = lst * DEG_TO_RAD;
  const latRad = latitude * DEG_TO_RAD;

  const ha = normalizeHourAngle(lst - ra);
  const haRad = ha * DEG_TO_RAD;

  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD_TO_DEG;

  const y = Math.sin(haRad);
  const x = Math.cos(haRad) * Math.sin(latRad) - Math.tan(decRad) * Math.cos(latRad);
  let azimuth = Math.atan2(y, x) * RAD_TO_DEG;
  azimuth = normalizeAngle(azimuth);

  return { altitude, azimuth };
}

export function calculateRadiantAltitude(
  shower: MeteorShower,
  date: Date,
  location: Location
): RadiantData {
  const lst = meanSiderealTime(date, location.longitude);
  const { altitude, azimuth } = equatorialToHorizontal(
    shower.radiantRA,
    shower.radiantDec,
    lst,
    location.latitude
  );

  return {
    time: date,
    hour: date.getHours() + date.getMinutes() / 60,
    altitude: Math.round(altitude * 10) / 10,
    azimuth: Math.round(azimuth * 10) / 10,
    isVisible: altitude > 0,
  };
}

export function calculateHourlyRadiantData(
  shower: MeteorShower,
  observationDate: string,
  location: Location
): RadiantData[] {
  const data: RadiantData[] = [];
  const baseDate = new Date(observationDate + 'T00:00:00');

  for (let i = 0; i < 48; i++) {
    const date = new Date(baseDate.getTime() + i * 30 * 60 * 1000);
    data.push(calculateRadiantAltitude(shower, date, location));
  }

  return data;
}

export function calculateSunPosition(date: Date, location: Location): SunData {
  const T = julianCentury(date);

  const L = normalizeAngle(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const G = normalizeAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;

  const G_rad = G * DEG_TO_RAD;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(G_rad)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * G_rad)
    + 0.000289 * Math.sin(3 * G_rad);

  const trueLong = L + C;
  const omega = normalizeAngle(125.04 - 1934.136 * T);
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG_TO_RAD);
  const epsilon = 23 + (26 + (21.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T * T * T) / 60) / 60;
  const epsilon_corr = epsilon + 0.00256 * Math.cos(omega * DEG_TO_RAD);

  const lambdaRad = lambda * DEG_TO_RAD;
  const epsilonRad = epsilon_corr * DEG_TO_RAD;

  const sinDec = Math.sin(epsilonRad) * Math.sin(lambdaRad);
  const dec = Math.asin(sinDec) * RAD_TO_DEG;

  const y = Math.cos(epsilonRad) * Math.sin(lambdaRad);
  const x = Math.cos(lambdaRad);
  let ra = Math.atan2(y, x) * RAD_TO_DEG;
  ra = normalizeAngle(ra);

  const lst = meanSiderealTime(date, location.longitude);
  const { altitude, azimuth } = equatorialToHorizontal(ra, dec, lst, location.latitude);

  return {
    time: date,
    altitude: Math.round(altitude * 10) / 10,
    azimuth: Math.round(azimuth * 10) / 10,
    isUp: altitude > 0,
  };
}

export function calculateMoonPosition(date: Date, location: Location): MoonData {
  const T = julianCentury(date);

  const Lp = normalizeAngle(218.3164591 + 481267.88134236 * T - 0.0013268 * T * T
    + T * T * T / 538841 - T * T * T * T / 65194000);
  const D = normalizeAngle(297.8502042 + 445267.1114034 * T - 0.0018819 * T * T
    + T * T * T / 545868 - T * T * T * T / 113065000);
  const M = normalizeAngle(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T
    + T * T * T / 24490000);
  const Mp = normalizeAngle(134.9634114 + 477198.8675055 * T + 0.0087414 * T * T
    + T * T * T / 69699 - T * T * T * T / 14712000);
  const F = normalizeAngle(93.2720993 + 483202.0175273 * T - 0.0034504 * T * T
    + T * T * T / 3526000 - T * T * T * T / 863310000);

  const A1 = normalizeAngle(119.75 + 131.849 * T);
  const A2 = normalizeAngle(53.09 + 479264.29 * T);
  const A3 = normalizeAngle(313.45 + 481266.484 * T);

  const D_rad = D * DEG_TO_RAD;
  const M_rad = M * DEG_TO_RAD;
  const Mp_rad = Mp * DEG_TO_RAD;
  const F_rad = F * DEG_TO_RAD;

  let dL = 0
    + 6288774 * Math.sin(Mp_rad)
    + 1274027 * Math.sin(2 * D_rad - Mp_rad)
    + 658314 * Math.sin(2 * D_rad)
    + 213618 * Math.sin(2 * Mp_rad)
    - 185116 * Math.sin(M_rad)
    - 114332 * Math.sin(2 * F_rad)
    + 58793 * Math.sin(2 * D_rad - 2 * Mp_rad)
    + 57066 * Math.sin(2 * D_rad - M_rad - Mp_rad)
    + 53322 * Math.sin(2 * D_rad + Mp_rad)
    + 45758 * Math.sin(2 * D_rad - M_rad)
    - 40923 * Math.sin(2 * F_rad - Mp_rad)
    - 34720 * Math.sin(M_rad + Mp_rad)
    - 30383 * Math.sin(M_rad - Mp_rad)
    + 15327 * Math.sin(2 * D_rad - 2 * F_rad)
    - 12528 * Math.sin(Mp_rad + 2 * F_rad)
    + 10980 * Math.sin(Mp_rad - 2 * F_rad)
    + 10675 * Math.sin(4 * D_rad - Mp_rad)
    + 10034 * Math.sin(3 * Mp_rad)
    + 8548 * Math.sin(4 * D_rad - 2 * Mp_rad)
    - 7888 * Math.sin(2 * D_rad + M_rad - Mp_rad)
    - 6766 * Math.sin(2 * D_rad + M_rad)
    + 5162 * Math.sin(Mp_rad - M_rad)
    + 5000 * Math.sin(2 * D_rad + 2 * Mp_rad)
    + 4987 * Math.sin(2 * D_rad - Mp_rad + M_rad);

  dL += 3958 * Math.sin(A1 * DEG_TO_RAD);
  dL += 1962 * Math.sin((Mp_rad - F_rad));
  dL += 1771 * Math.sin(A2 * DEG_TO_RAD);
  dL += 722 * Math.sin((Mp_rad + F_rad));
  dL += 638 * Math.sin((A3 - 2 * D_rad) * DEG_TO_RAD);
  dL += 627 * Math.sin((2 * D_rad - M_rad - 2 * F_rad) * DEG_TO_RAD);

  let dS = 0
    - 52619 * Math.cos(Mp_rad)
    - 16687 * Math.cos(2 * D_rad - Mp_rad)
    - 15942 * Math.cos(2 * Mp_rad)
    - 11060 * Math.cos(2 * D_rad)
    + 4421 * Math.cos(2 * D_rad + Mp_rad)
    + 3362 * Math.cos(2 * D_rad - M_rad - Mp_rad)
    + 2463 * Math.cos(2 * D_rad - 2 * Mp_rad)
    + 2211 * Math.cos(2 * D_rad - M_rad)
    + 2065 * Math.cos(2 * F_rad - Mp_rad)
    + 1294 * Math.cos(Mp_rad + 2 * F_rad)
    + 1149 * Math.cos(4 * D_rad - Mp_rad)
    + 1056 * Math.cos(3 * Mp_rad)
    + 854 * Math.cos(4 * D_rad - 2 * Mp_rad)
    + 771 * Math.cos(Mp_rad - 2 * F_rad)
    + 754 * Math.cos(2 * D_rad + M_rad - Mp_rad)
    + 699 * Math.cos(2 * D_rad + M_rad)
    + 534 * Math.cos(Mp_rad - M_rad)
    + 529 * Math.cos(2 * D_rad + 2 * Mp_rad);

  let dH = 0
    + 5128122 * Math.sin(F_rad)
    + 280602 * Math.sin(Mp_rad + F_rad)
    + 277693 * Math.sin(Mp_rad - F_rad)
    + 173237 * Math.sin(2 * D_rad - F_rad)
    + 55413 * Math.sin(2 * D_rad + F_rad - Mp_rad)
    + 46271 * Math.sin(2 * D_rad - F_rad - Mp_rad)
    + 32573 * Math.sin(2 * D_rad + F_rad)
    + 17198 * Math.sin(2 * Mp_rad + F_rad)
    + 9266 * Math.sin(2 * D_rad - 2 * F_rad - Mp_rad)
    + 8822 * Math.sin(2 * D_rad + F_rad + Mp_rad)
    + 8216 * Math.sin(2 * D_rad - 2 * F_rad)
    + 4324 * Math.sin(2 * D_rad - 2 * Mp_rad)
    + 4200 * Math.sin(2 * D_rad + F_rad - M_rad - Mp_rad)
    - 3359 * Math.sin(F_rad - Mp_rad)
    + 2463 * Math.sin(2 * D_rad - F_rad + M_rad)
    + 2211 * Math.sin(2 * D_rad + 2 * F_rad)
    + 722 * Math.sin(2 * D_rad + F_rad + M_rad)
    + 647 * Math.sin(2 * D_rad + M_rad - F_rad - Mp_rad)
    + 591 * Math.sin(2 * D_rad + F_rad - M_rad)
    + 552 * Math.sin(2 * D_rad - F_rad + M_rad + Mp_rad);

  const Lm = Lp + dL / 1000000;
  const Bm = dS / 1000000;

  const lambdaRad = Lm * DEG_TO_RAD;
  const betaRad = Bm * DEG_TO_RAD;
  const epsilon = 23.4397 * DEG_TO_RAD;

  const sinDec = Math.sin(betaRad) * Math.cos(epsilon) + Math.cos(betaRad) * Math.sin(epsilon) * Math.sin(lambdaRad);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec))) * RAD_TO_DEG;

  const y = Math.sin(lambdaRad) * Math.cos(epsilon) - Math.tan(betaRad) * Math.sin(epsilon);
  const x = Math.cos(lambdaRad);
  let ra = Math.atan2(y, x) * RAD_TO_DEG;
  ra = normalizeAngle(ra);

  const lst = meanSiderealTime(date, location.longitude);
  const { altitude, azimuth } = equatorialToHorizontal(ra, dec, lst, location.latitude);

  const phaseData = calculateMoonPhase(date);

  return {
    time: date,
    hour: date.getHours() + date.getMinutes() / 60,
    altitude: Math.round(altitude * 10) / 10,
    azimuth: Math.round(azimuth * 10) / 10,
    phase: phaseData.phase,
    illumination: phaseData.illumination,
    isUp: altitude > 0,
  };
}

export function calculateMoonPhase(date: Date): { phase: number; illumination: number } {
  const T = julianCentury(date);

  const D = normalizeAngle(297.8502042 + 445267.1114034 * T);
  const M = normalizeAngle(357.5291092 + 35999.0502909 * T);
  const Mp = normalizeAngle(134.9634114 + 477198.8675055 * T);

  const D_rad = D * DEG_TO_RAD;
  const M_rad = M * DEG_TO_RAD;
  const Mp_rad = Mp * DEG_TO_RAD;

  let i = 180 - D
    - 6.289 * Math.sin(Mp_rad)
    + 2.100 * Math.sin(M_rad)
    - 1.274 * Math.sin(2 * D_rad - Mp_rad)
    - 0.658 * Math.sin(2 * D_rad)
    - 0.214 * Math.sin(2 * Mp_rad)
    - 0.110 * Math.sin(D_rad);

  i = normalizeAngle(i);
  const phase = i / 360;
  const illumination = (1 + Math.cos(i * DEG_TO_RAD)) / 2;

  return {
    phase: Math.round(phase * 1000) / 1000,
    illumination: Math.round(illumination * 1000) / 1000,
  };
}

export function isNightTime(date: Date, location: Location): boolean {
  const sunPos = calculateSunPosition(date, location);
  return sunPos.altitude < SUN_ALTITUDE_NIGHT;
}

export function calculateLimitingMagnitude(
  lightPollution: number,
  moonAltitude: number,
  moonIllumination: number
): number {
  const bortle = BORTLE_SCALE.find(b => b.level === lightPollution) || BORTLE_SCALE[4];
  let lm = bortle.limitingMag;

  if (moonAltitude > 0 && moonIllumination > 0.05) {
    const moonCorrection = 1.5 * moonIllumination * Math.exp(-moonAltitude / 20);
    lm -= moonCorrection;
  }

  return Math.round(lm * 10) / 10;
}

export function calculateVisibleRate(
  zhr: number,
  radiantAltitude: number,
  limitingMag: number,
  showerMagnitude: number,
  cloudFactor: number = 1.0
): number {
  if (radiantAltitude <= 0) return 0;

  const radiantRad = radiantAltitude * DEG_TO_RAD;
  const heightFactor = Math.pow(Math.sin(radiantRad), GAMMA_INDEX);

  const magDiff = limitingMag - showerMagnitude;
  const magFactor = Math.pow(10, -0.4 * Math.max(0, -magDiff));

  const visibleRate = zhr * heightFactor * magFactor * cloudFactor;

  return Math.max(0, Math.round(visibleRate * 10) / 10);
}

export function getMoonInterferenceLevel(
  moonAltitude: number,
  moonIllumination: number
): 'none' | 'low' | 'medium' | 'high' {
  if (moonAltitude <= 0 || moonIllumination < 0.05) return 'none';
  if (moonIllumination < 0.25) return 'low';
  if (moonIllumination < 0.6) return 'medium';
  return 'high';
}

export function getObservationQuality(
  isNight: boolean,
  radiantAltitude: number,
  moonInterference: string,
  cloudCover: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (!isNight || radiantAltitude <= 0) return 'poor';
  if (cloudCover > 5) return 'poor';

  let score = 0;
  if (radiantAltitude >= 60) score += 3;
  else if (radiantAltitude >= 45) score += 2;
  else if (radiantAltitude >= 30) score += 1;

  if (moonInterference === 'none') score += 3;
  else if (moonInterference === 'low') score += 2;
  else if (moonInterference === 'medium') score += 1;

  if (cloudCover <= 1) score += 2;
  else if (cloudCover <= 3) score += 1;

  if (score >= 7) return 'excellent';
  if (score >= 5) return 'good';
  if (score >= 3) return 'fair';
  return 'poor';
}

export function calculateHourlyObservationData(
  shower: MeteorShower,
  location: Location,
  observationDate: string,
  cloudCover: number,
  lightPollution: number
): HourlyObservationData[] {
  const data: HourlyObservationData[] = [];
  const baseDate = new Date(observationDate + 'T00:00:00');

  for (let i = 0; i < 48; i++) {
    const date = new Date(baseDate.getTime() + i * 30 * 60 * 1000);

    const radiantData = calculateRadiantAltitude(shower, date, location);
    const moonData = calculateMoonPosition(date, location);
    const sunData = calculateSunPosition(date, location);
    const isNight = sunData.altitude < SUN_ALTITUDE_NIGHT;

    const limitingMag = calculateLimitingMagnitude(lightPollution, moonData.altitude, moonData.illumination);
    const cloudFactor = 1 - (cloudCover / 10);
    const visibleRate = calculateVisibleRate(
      shower.zhr,
      radiantData.altitude,
      limitingMag,
      shower.magnitude,
      cloudFactor
    );

    const moonInterference = getMoonInterferenceLevel(moonData.altitude, moonData.illumination);
    const quality = getObservationQuality(isNight, radiantData.altitude, moonInterference, cloudCover);

    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    data.push({
      hour: hour + minute / 60,
      timeLabel,
      radiantAltitude: radiantData.altitude,
      radiantAzimuth: radiantData.azimuth,
      moonAltitude: moonData.altitude,
      moonIllumination: moonData.illumination,
      sunAltitude: sunData.altitude,
      isNight,
      visibleRate,
      quality,
      moonInterference: moonInterference as 'none' | 'low' | 'medium' | 'high',
    });
  }

  return data;
}

export function findGoldenWindows(
  hourlyData: HourlyObservationData[],
  cloudCover: number
): ObservationWindow[] {
  const windows: ObservationWindow[] = [];
  let currentWindow: HourlyObservationData[] | null = null;

  for (const data of hourlyData) {
    const isGoodWindow =
      data.isNight &&
      data.radiantAltitude >= MIN_RADIANT_ALTITUDE &&
      (data.moonInterference === 'none' || data.moonInterference === 'low') &&
      cloudCover <= OBSERVATION_THRESHOLDS.MAX_CLOUD_COVER;

    if (isGoodWindow) {
      if (!currentWindow) {
        currentWindow = [data];
      } else {
        currentWindow.push(data);
      }
    } else if (currentWindow) {
      if (currentWindow.length >= 4) {
        const avgAltitude = currentWindow.reduce((sum, d) => sum + d.radiantAltitude, 0) / currentWindow.length;
        const avgRate = currentWindow.reduce((sum, d) => sum + d.visibleRate, 0) / currentWindow.length;
        const maxMoon = Math.max(...currentWindow.map(d => d.moonInterference === 'low' ? 1 : 0));
        const minQuality = Math.min(...currentWindow.map(d => {
          if (d.quality === 'excellent') return 4;
          if (d.quality === 'good') return 3;
          if (d.quality === 'fair') return 2;
          return 1;
        }));

        windows.push({
          startTime: currentWindow[0].timeLabel as unknown as Date,
          endTime: currentWindow[currentWindow.length - 1].timeLabel as unknown as Date,
          quality: minQuality >= 4 ? 'excellent' : minQuality >= 3 ? 'good' : 'fair',
          avgRadiantAltitude: Math.round(avgAltitude * 10) / 10,
          avgMeteorRate: Math.round(avgRate * 10) / 10,
          moonInterference: maxMoon > 0 ? 'low' : 'none',
          reason: generateWindowReason(currentWindow, avgAltitude, avgRate),
        });
      }
      currentWindow = null;
    }
  }

  if (currentWindow && currentWindow.length >= 4) {
    const avgAltitude = currentWindow.reduce((sum, d) => sum + d.radiantAltitude, 0) / currentWindow.length;
    const avgRate = currentWindow.reduce((sum, d) => sum + d.visibleRate, 0) / currentWindow.length;
    windows.push({
      startTime: currentWindow[0].timeLabel as unknown as Date,
      endTime: currentWindow[currentWindow.length - 1].timeLabel as unknown as Date,
      quality: 'good',
      avgRadiantAltitude: Math.round(avgAltitude * 10) / 10,
      avgMeteorRate: Math.round(avgRate * 10) / 10,
      moonInterference: 'none',
      reason: generateWindowReason(currentWindow, avgAltitude, avgRate),
    });
  }

  return windows;
}

function generateWindowReason(
  window: HourlyObservationData[],
  avgAltitude: number,
  avgRate: number
): string {
  const reasons: string[] = [];

  if (avgAltitude >= 60) {
    reasons.push('辐射点高度极佳');
  } else if (avgAltitude >= 45) {
    reasons.push('辐射点高度良好');
  } else {
    reasons.push('辐射点高度适宜');
  }

  if (avgRate >= 50) {
    reasons.push('可见流量极高');
  } else if (avgRate >= 20) {
    reasons.push('可见流量较高');
  } else if (avgRate >= 10) {
    reasons.push('可见流量适中');
  }

  const hasMoon = window.some(d => d.moonInterference !== 'none');
  if (!hasMoon) {
    reasons.push('无月光干扰');
  } else {
    reasons.push('月光干扰轻微');
  }

  return reasons.join('，');
}

export function getMoonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return '新月';
  if (phase < 0.22) return '娥眉月';
  if (phase < 0.28) return '上弦月';
  if (phase < 0.47) return '盈凸月';
  if (phase < 0.53) return '满月';
  if (phase < 0.72) return '亏凸月';
  if (phase < 0.78) return '下弦月';
  return '残月';
}

export function getDirectionName(azimuth: number): string {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const index = Math.round(normalizeAngle(azimuth) / 45) % 8;
  return directions[index];
}
