import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: Date | string, pattern: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale: zhCN });
}

export function formatDuration(start: Date | string, end: Date | string): string;
export function formatDuration(minutes: number): string;
export function formatDuration(startOrMinutes: Date | string | number, end?: Date | string): string {
  let totalMinutes: number;

  if (typeof startOrMinutes === 'number') {
    totalMinutes = startOrMinutes;
  } else if (end !== undefined) {
    const startDate = typeof startOrMinutes === 'string' ? parseISO(startOrMinutes) : startOrMinutes;
    const endDate = typeof end === 'string' ? parseISO(end) : end;
    totalMinutes = differenceInMinutes(endDate, startDate);
  } else {
    return '0分钟';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`;
  }
  return `${minutes}分钟`;
}

export function formatDegrees(degrees: number): string {
  return `${degrees.toFixed(1)}°`;
}

export function formatAltitude(altitude: number): string {
  if (altitude <= 0) return '未升起';
  return `${altitude.toFixed(1)}°`;
}

export function formatAzimuth(azimuth: number): string {
  return `${azimuth.toFixed(1)}°`;
}

export function formatMagnitude(magnitude: number): string {
  return magnitude.toFixed(1);
}

export function formatZHR(zhr: number): string {
  if (zhr < 1) return '<1';
  return zhr.toFixed(0);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function getQualityColor(quality: string): string {
  switch (quality) {
    case 'excellent': return 'text-emerald-400';
    case 'good': return 'text-sky-400';
    case 'fair': return 'text-amber-400';
    case 'poor': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

export function getQualityBgColor(quality: string): string {
  switch (quality) {
    case 'excellent': return 'bg-emerald-500/20 border-emerald-500/50';
    case 'good': return 'bg-sky-500/20 border-sky-500/50';
    case 'fair': return 'bg-amber-500/20 border-amber-500/50';
    case 'poor': return 'bg-red-500/20 border-red-500/50';
    default: return 'bg-gray-500/20 border-gray-500/50';
  }
}

export function getQualityLabel(quality: string): string {
  switch (quality) {
    case 'excellent': return '极佳';
    case 'good': return '良好';
    case 'fair': return '一般';
    case 'poor': return '较差';
    default: return '未知';
  }
}

export function getMoonInterferenceColor(level: string): string {
  switch (level) {
    case 'none': return 'text-emerald-400';
    case 'low': return 'text-sky-400';
    case 'medium': return 'text-amber-400';
    case 'high': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

export function getMoonInterferenceLabel(level: string): string {
  switch (level) {
    case 'none': return '无';
    case 'low': return '轻微';
    case 'medium': return '中等';
    case 'high': return '严重';
    default: return '未知';
  }
}

export function getBortleLabel(level: number): string {
  const labels = [
    '', '极暗天空', '典型乡村', '乡村/郊区过渡', '郊区夜空',
    '郊区/城市过渡', '明亮郊区', '城市夜空', '城市中心', '市中心夜空'
  ];
  return labels[level] || '未知';
}

export function getCloudCoverLabel(level: number): string {
  const labels = ['晴朗无云', '极少量云', '少量云', '散云', '多云', '大部分云', '阴天'];
  return labels[level] || '未知';
}

export function validateLatitude(lat: number): boolean {
  return !isNaN(lat) && lat >= -90 && lat <= 90;
}

export function validateLongitude(lng: number): boolean {
  return !isNaN(lng) && lng >= -180 && lng <= 180;
}

export function validateAltitude(alt: number): boolean {
  return !isNaN(alt) && alt >= -500 && alt <= 9000;
}

export function validateRA(ra: number): boolean {
  return !isNaN(ra) && ra >= 0 && ra <= 360;
}

export function validateDec(dec: number): boolean {
  return !isNaN(dec) && dec >= -90 && dec <= 90;
}

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatCoordinate(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

export function getDirectionName(azimuth: number): string {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const index = Math.round(((azimuth % 360) / 45)) % 8;
  return directions[index];
}
