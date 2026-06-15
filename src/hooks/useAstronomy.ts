import { useMemo } from 'react';
import { calculateHourlyObservationData, findGoldenWindows, calculateMoonPhase } from '@/utils/astronomy';
import { useAppStore } from '@/store/useAppStore';
import { HourlyObservationData, ObservationWindow } from '@/types';

export function useAstronomyData() {
  const { currentLocation, currentShower, observationDate, cloudCover, lightPollution } = useAppStore();

  const isReady = useMemo(() => {
    return currentLocation && currentShower && observationDate;
  }, [currentLocation, currentShower, observationDate]);

  const hourlyData: HourlyObservationData[] = useMemo(() => {
    if (!isReady || !currentLocation || !currentShower) return [];
    return calculateHourlyObservationData(
      currentShower,
      currentLocation,
      observationDate,
      cloudCover,
      lightPollution
    );
  }, [isReady, currentLocation, currentShower, observationDate, cloudCover, lightPollution]);

  const goldenWindows: ObservationWindow[] = useMemo(() => {
    if (hourlyData.length === 0) return [];
    return findGoldenWindows(hourlyData, cloudCover);
  }, [hourlyData, cloudCover]);

  const moonPhase = useMemo(() => {
    if (!observationDate) return { phase: 0, illumination: 0 };
    const date = new Date(observationDate + 'T00:00:00');
    return calculateMoonPhase(date);
  }, [observationDate]);

  const nightData = useMemo(() => {
    return hourlyData.filter(d => d.isNight);
  }, [hourlyData]);

  const peakHour = useMemo(() => {
    if (nightData.length === 0) return null;
    return nightData.reduce((peak, d) =>
      d.visibleRate > peak.visibleRate ? d : peak,
      nightData[0]
    );
  }, [nightData]);

  const maxAltitude = useMemo(() => {
    if (hourlyData.length === 0) return null;
    return hourlyData.reduce((max, d) =>
      d.radiantAltitude > max.radiantAltitude ? d : max,
      hourlyData[0]
    );
  }, [hourlyData]);

  const hasInefficientPeriods = useMemo(() => {
    return hourlyData.some(d =>
      d.isNight && (d.radiantAltitude <= 0 || d.moonInterference === 'high')
    );
  }, [hourlyData]);

  const inefficientWarning = useMemo(() => {
    const warnings: string[] = [];
    const lowAltitudeCount = hourlyData.filter(d => d.isNight && d.radiantAltitude <= 0).length;
    const highMoonCount = hourlyData.filter(d => d.isNight && d.moonInterference === 'high').length;

    if (lowAltitudeCount > 0) {
      warnings.push(`有 ${lowAltitudeCount / 2} 小时辐射点未升起，建议避开这段时间`);
    }
    if (highMoonCount > 0) {
      warnings.push(`有 ${highMoonCount / 2} 小时月光干扰严重，暗弱流星难以观测`);
    }
    if (cloudCover > 3) {
      warnings.push('云量较多，会显著降低可见流星数');
    }
    return warnings;
  }, [hourlyData, cloudCover]);

  return {
    isReady,
    hourlyData,
    nightData,
    goldenWindows,
    moonPhase,
    peakHour,
    maxAltitude,
    hasInefficientPeriods,
    inefficientWarning,
  };
}
