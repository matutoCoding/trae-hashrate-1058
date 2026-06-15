import { useState, useEffect } from 'react';
import { MapPin, Calendar, Cloud, Moon, Search, Plus, Trash2, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { saveLocation, saveSetting, initializeData } from '@/utils/storage';
import { formatDate, getBortleLabel, getCloudCoverLabel, formatCoordinate, validateLatitude, validateLongitude, validateAltitude } from '@/utils/format';
import Card from '@/components/Card';
import { Location, MeteorShower } from '@/types';
import { BORTLE_SCALE, CLOUD_COVER_SCALE } from '@/data/constants';

export default function Settings() {
  const {
    currentLocation,
    currentShower,
    observationDate,
    cloudCover,
    lightPollution,
    locations,
    showers,
    setLocation,
    setShower,
    setObservationDate,
    setCloudCover,
    setLightPollution,
    refreshLocations,
    refreshShowers,
    initializeFromStorage,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: '',
    latitude: 0,
    longitude: 0,
    altitude: 0,
    timezone: 'Asia/Shanghai',
  });
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    initializeData();
    initializeFromStorage();
  }, [initializeFromStorage]);

  useEffect(() => {
    if (currentLocation && currentShower) {
      saveSetting({
        id: 'current',
        locationId: currentLocation.id,
        showerId: currentShower.id,
        observationDate,
        cloudCover,
        lightPollution,
        limitingMagnitude: BORTLE_SCALE.find(b => b.level === lightPollution)?.limitingMag || 5.5,
      });
    }
  }, [currentLocation, currentShower, observationDate, cloudCover, lightPollution]);

  const filteredShowers = showers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddLocation = () => {
    setLocationError('');

    if (!newLocation.name?.trim()) {
      setLocationError('请输入地点名称');
      return;
    }
    if (!validateLatitude(newLocation.latitude!)) {
      setLocationError('纬度必须在 -90 到 90 之间');
      return;
    }
    if (!validateLongitude(newLocation.longitude!)) {
      setLocationError('经度必须在 -180 到 180 之间');
      return;
    }
    if (!validateAltitude(newLocation.altitude!)) {
      setLocationError('海拔必须在 -500 到 9000 米之间');
      return;
    }

    const saved = saveLocation(newLocation as Location);
    setLocation(saved);
    refreshLocations();
    setShowAddLocation(false);
    setNewLocation({ name: '', latitude: 0, longitude: 0, altitude: 0, timezone: 'Asia/Shanghai' });
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewLocation({
            name: '当前位置',
            latitude: Math.round(position.coords.latitude * 10000) / 10000,
            longitude: Math.round(position.coords.longitude * 10000) / 10000,
            altitude: Math.round(position.coords.altitude || 50),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
          setShowAddLocation(true);
        },
        () => {
          setLocationError('无法获取当前位置，请手动输入');
        }
      );
    } else {
      setLocationError('您的浏览器不支持地理定位');
    }
  };

  const handleDeleteLocation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (locations.length <= 1) return;
    import('@/utils/storage').then(({ deleteLocation }) => {
      deleteLocation(id);
      refreshLocations();
      if (currentLocation?.id === id) {
        const remaining = locations.filter(l => l.id !== id);
        if (remaining.length > 0) {
          setLocation(remaining[0]);
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">观测设置</h2>
        <p className="text-gray-400">配置观测地点、目标流星雨和环境参数</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="观测地点"
          subtitle="选择或添加观测地点"
          icon={<MapPin className="w-4 h-4" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setLocation(loc)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 flex items-center justify-between ${
                    currentLocation?.id === loc.id
                      ? 'bg-amber-500/20 border border-amber-500/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{loc.name}</span>
                      {currentLocation?.id === loc.id && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatCoordinate(loc.latitude, loc.longitude)}
                      <span className="mx-2">·</span>
                      海拔 {loc.altitude}m
                    </div>
                  </div>
                  {locations.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteLocation(loc.id, e)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddLocation(!showAddLocation)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                添加地点
              </button>
              <button
                onClick={handleGetCurrentLocation}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>

            {showAddLocation && (
              <div className="p-4 bg-white/5 rounded-xl space-y-3 animate-slideUp">
                <h4 className="text-white font-medium">添加新地点</h4>
                {locationError && (
                  <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                    {locationError}
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-400">地点名称</label>
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                    placeholder="如：北京密云"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400">纬度</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newLocation.latitude}
                      onChange={(e) => setNewLocation({ ...newLocation, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">经度</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newLocation.longitude}
                      onChange={(e) => setNewLocation({ ...newLocation, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">海拔（米）</label>
                  <input
                    type="number"
                    value={newLocation.altitude}
                    onChange={(e) => setNewLocation({ ...newLocation, altitude: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddLocation}
                    className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    保存地点
                  </button>
                  <button
                    onClick={() => setShowAddLocation(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card
          title="目标流星雨"
          subtitle="选择要观测的流星雨群"
          icon={<Search className="w-4 h-4" />}
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索流星雨名称或代码..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-2">
              {filteredShowers.map((shower) => (
                <button
                  key={shower.id}
                  onClick={() => setShower(shower)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 ${
                    currentShower?.id === shower.id
                      ? 'bg-amber-500/20 border border-amber-500/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{shower.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-300">
                          {shower.code}
                        </span>
                        {currentShower?.id === shower.id && (
                          <Check className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                        <span>极大期: {shower.peakDate}</span>
                        <span>ZHR: {shower.zhr}</span>
                        <span>速度: {shower.velocity}km/s</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        辐射点: RA {shower.radiantRA}°, Dec {shower.radiantDec}°
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card
          title="观测日期"
          subtitle="选择观测日期"
          icon={<Calendar className="w-4 h-4" />}
        >
          <div className="space-y-4">
            <input
              type="date"
              value={observationDate}
              onChange={(e) => setObservationDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500/50 text-lg"
            />
            {currentShower && (
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400">
                  {currentShower.name} 活动期: {currentShower.activeStart} ~ {currentShower.activeEnd}
                </p>
                <p className="text-sm text-amber-400 mt-1">
                  预计极大: {formatDate(new Date().getFullYear() + '-' + currentShower.peakDate)}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card
          title="环境参数"
          subtitle="设置观测环境条件"
          icon={<Cloud className="w-4 h-4" />}
        >
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  云量等级
                </label>
                <span className="text-amber-400 font-mono">
                  {getCloudCoverLabel(cloudCover)} ({CLOUD_COVER_SCALE[cloudCover]?.description})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                value={cloudCover}
                onChange={(e) => setCloudCover(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>晴朗</span>
                <span>阴天</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  光污染等级 (Bortle)
                </label>
                <span className="text-amber-400 font-mono">
                  {getBortleLabel(lightPollution)} ({lightPollution}级)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="9"
                value={lightPollution}
                onChange={(e) => setLightPollution(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>极暗乡村</span>
                <span>城市中心</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
              <div className="text-sm text-gray-400 mb-1">预计极限星等</div>
              <div className="text-3xl font-bold text-amber-400 font-mono">
                {BORTLE_SCALE.find(b => b.level === lightPollution)?.limitingMag.toFixed(1)}<span className="text-lg"> mag</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {BORTLE_SCALE.find(b => b.level === lightPollution)?.description}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {currentLocation && currentShower && (
        <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <Check className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-white font-semibold">设置已完成</h3>
              <p className="text-sm text-gray-400">
                {currentLocation.name} · {currentShower.name} · {formatDate(observationDate)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
