export const ASTRONOMICAL_CONSTANTS = {
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  J2000: 2451545.0,
  SIDEREAL_DAY: 86164.0905,
  SOLAR_DAY: 86400,
  EARTH_OBLIQUITY: 23.4397,
};

export const OBSERVATION_THRESHOLDS = {
  MIN_RADIANT_ALTITUDE: 30,
  SUN_ALTITUDE_NIGHT: -18,
  MAX_MOON_ILLUMINATION: 0.15,
  MAX_CLOUD_COVER: 3,
  GAMMA_INDEX: 1.0,
};

export const BORTLE_SCALE = [
  { level: 1, name: '极暗天空', limitingMag: 7.5, description: '乡村/偏远地区' },
  { level: 2, name: '典型乡村', limitingMag: 7.0, description: '乡村地区' },
  { level: 3, name: '乡村/郊区过渡', limitingMag: 6.5, description: '郊区边缘' },
  { level: 4, name: '郊区夜空', limitingMag: 6.0, description: '郊区' },
  { level: 5, name: '郊区/城市过渡', limitingMag: 5.5, description: '较亮郊区' },
  { level: 6, name: '明亮郊区', limitingMag: 5.0, description: '城市边缘' },
  { level: 7, name: '城市夜空', limitingMag: 4.5, description: '城市' },
  { level: 8, name: '城市中心', limitingMag: 4.0, description: '大城市中心' },
  { level: 9, name: '市中心夜空', limitingMag: 3.0, description: '大城市最亮区域' },
];

export const CLOUD_COVER_SCALE = [
  { level: 0, name: '晴朗无云', factor: 1.0, description: '0%' },
  { level: 1, name: '极少量云', factor: 0.95, description: '0-10%' },
  { level: 2, name: '少量云', factor: 0.85, description: '10-25%' },
  { level: 3, name: '散云', factor: 0.7, description: '25-50%' },
  { level: 4, name: '多云', factor: 0.5, description: '50-75%' },
  { level: 5, name: '大部分云', factor: 0.3, description: '75-90%' },
  { level: 6, name: '阴天', factor: 0.1, description: '90-100%' },
];

export const WEATHER_OPTIONS = [
  '晴朗', '少云', '多云', '阴天', '薄雾', '有雾', '小雨', '大雪', '大风'
];

export const SKY_CONDITION_OPTIONS = [
  '极佳', '良好', '一般', '较差', '有薄云', '有霾', '低空有云', '满月干扰'
];

export const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];
