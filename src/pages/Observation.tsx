import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Area } from 'recharts';
import { Eye, Moon, Star, Clock, MapPin, AlertTriangle, Sparkles, Calculator, Target, Navigation } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAstronomyData } from '@/hooks/useAstronomy';
import { calculateVisibleRate } from '@/utils/astronomy';
import { formatDate, formatTime, getQualityColor, getQualityLabel, getQualityBgColor, getMoonInterferenceColor, getMoonInterferenceLabel, formatPercentage, getDirectionName } from '@/utils/format';
import { getMoonPhaseName } from '@/utils/astronomy';
import Card from '@/components/Card';
import { NavLink } from 'react-router-dom';
import { BORTLE_SCALE } from '@/data/constants';

export default function Observation() {
  const { currentLocation, currentShower, observationDate, cloudCover, lightPollution } = useAppStore();
  const { isReady, hourlyData, goldenWindows, peakHour, moonPhase, hasInefficientPeriods, inefficientWarning } = useAstronomyData();

  const [zhr, setZhr] = useState(currentShower?.zhr || 100);
  const [limitingMag, setLimitingMag] = useState(5.5);
  const [radiantAlt, setRadiantAlt] = useState(45);

  const customRate = useMemo(() => {
    const cloudFactor = 1 - (cloudCover / 10);
    return calculateVisibleRate(zhr, radiantAlt, limitingMag, currentShower?.magnitude || 2.5, cloudFactor);
  }, [zhr, limitingMag, radiantAlt, cloudCover, currentShower]);

  const rateChartData = useMemo(() => {
    return hourlyData.filter((_, i) => i % 2 === 0).map(d => ({
      ...d,
      timeLabel: d.timeLabel,
      visibleRate: d.visibleRate,
      isNight: d.isNight,
      quality: d.quality,
    }));
  }, [hourlyData]);

  const moonInterferenceData = useMemo(() => {
    return hourlyData.filter((_, i) => i % 2 === 0).map(d => ({
      timeLabel: d.timeLabel,
      moonInterference:
        d.moonInterference === 'high' ? 4 :
        d.moonInterference === 'medium' ? 3 :
        d.moonInterference === 'low' ? 2 : 1,
      interferenceLabel: getMoonInterferenceLabel(d.moonInterference),
    }));
  }, [hourlyData]);

  const getQualityBarColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!isReady) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">观测时段分析</h2>
          <p className="text-gray-400">请先在观测设置页配置地点和流星雨</p>
        </div>
        <Card>
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">请先完成观测设置</p>
            <NavLink
              to="/"
              className="inline-block mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              前往设置
            </NavLink>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">观测时段分析</h2>
        <p className="text-gray-400">
          {currentLocation?.name} · {currentShower?.name} · {formatDate(observationDate)}
        </p>
      </div>

      {hasInefficientPeriods && inefficientWarning.length > 0 && (
        <div className="space-y-2">
          {inefficientWarning.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{warning}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1">
            <Star className="w-4 h-4" />
            天顶流量 (ZHR)
          </div>
          <div className="text-3xl font-bold text-amber-400 font-mono">
            {currentShower?.zhr}
          </div>
          <div className="text-xs text-gray-500">理论最大值</div>
        </Card>

        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4" />
            预计可见峰值
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">
            {peakHour?.visibleRate.toFixed(1) || '--'}<span className="text-lg">/h</span>
          </div>
          <div className="text-xs text-gray-500">{peakHour?.timeLabel || '--'}</div>
        </Card>

        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1">
            <Moon className="w-4 h-4" />
            月相
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {Math.round(moonPhase.illumination * 100)}%
          </div>
          <div className="text-xs text-gray-500">{getMoonPhaseName(moonPhase.phase)}</div>
        </Card>
      </div>

      {goldenWindows.length > 0 && (
        <Card
          title="黄金观测窗口"
          subtitle="辐射点高且无月光干扰的最佳时段"
          icon={<Star className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goldenWindows.map((window, index) => (
              <div
                key={index}
                className={`p-5 rounded-xl border ${getQualityBgColor(window.quality)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(window.quality)}`}>
                    {getQualityLabel(window.quality)}
                  </span>
                  <span className="text-xs text-gray-400">窗口 #{index + 1}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-white font-mono text-lg">
                      {formatTime(window.startTime)} - {formatTime(window.endTime)}
                    </div>
                    <div className="text-xs text-gray-400">
                      约 {Math.round(((window.endTime.getTime() - window.startTime.getTime()) / (1000 * 60 * 60)))} 小时
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400">平均高度</div>
                    <div className="text-white font-mono">{window.avgRadiantAltitude}°</div>
                  </div>
                  <div>
                    <div className="text-gray-400">可见流量</div>
                    <div className="text-amber-400 font-mono">{window.avgMeteorRate}/h</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-400">月光干扰</div>
                    <div className={getMoonInterferenceColor(window.moonInterference)}>
                      {getMoonInterferenceLabel(window.moonInterference)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-300">
                  {window.reason}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {goldenWindows.length === 0 && (
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="text-amber-400 font-semibold mb-1">无黄金观测窗口</h3>
              <p className="text-amber-200 text-sm">
                在所选日期，没有同时满足辐射点高度≥30°且无严重月光干扰的连续时段。
                建议选择其他日期，或在条件相对较好的时段进行观测。
              </p>
            </div>
          </div>
        </div>
      )}

      <Card
        title="可见流星流量"
        subtitle="每小时预计可见流星数"
        icon={<Calculator className="w-4 h-4" />}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rateChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="timeLabel"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                interval={3}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                label={{ value: '流星数/小时', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 14, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(value: number) => [`${value.toFixed(1)} 颗/小时`, '可见流量']}
                labelFormatter={(label) => `时间: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="visibleRate"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#rateGradient)"
                dot={false}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
              <Bar dataKey="visibleRate" opacity={0} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        title="月光干扰分析"
        subtitle="月光对暗弱流星的影响程度"
        icon={<Moon className="w-4 h-4" />}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moonInterferenceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="timeLabel"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                interval={3}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                domain={[0, 4]}
                ticks={[1, 2, 3, 4]}
                tickFormatter={(value) => ['', '无', '轻微', '中等', '严重'][value]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 14, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(_: unknown, __: unknown, props: { payload: { interferenceLabel: string } }) => [
                  props.payload.interferenceLabel,
                  '月光干扰'
                ]}
                labelFormatter={(label) => `时间: ${label}`}
              />
              <Bar dataKey="moonInterference" radius={[4, 4, 0, 0]}>
                {moonInterferenceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.moonInterference === 4 ? '#ef4444' :
                      entry.moonInterference === 3 ? '#f59e0b' :
                      entry.moonInterference === 2 ? '#3b82f6' : '#10b981'
                    }
                    fillOpacity={0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="流量换算计算器"
          subtitle="ZHR到实际可见流量的换算"
          icon={<Calculator className="w-4 h-4" />}
        >
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm">天顶流量 (ZHR)</label>
                <span className="text-amber-400 font-mono text-sm">{zhr}</span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={zhr}
                onChange={(e) => setZhr(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm">辐射点高度</label>
                <span className="text-amber-400 font-mono text-sm">{radiantAlt}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={radiantAlt}
                onChange={(e) => setRadiantAlt(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm">极限星等</label>
                <span className="text-amber-400 font-mono text-sm">{limitingMag.toFixed(1)} mag</span>
              </div>
              <input
                type="range"
                min="3"
                max="7.5"
                step="0.1"
                value={limitingMag}
                onChange={(e) => setLimitingMag(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
              <div className="text-sm text-gray-400 mb-1">预计可见流星数</div>
              <div className="text-4xl font-bold text-emerald-400 font-mono">
                {customRate.toFixed(1)}<span className="text-lg">/h</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                换算公式: 可见率 = ZHR × sin(h)^γ × 10^(-0.4×(lim-r)) × k
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>· h = 辐射点高度，γ = 天顶角指数 (1.0)</p>
              <p>· lim = 极限星等，r = 流星群平均星等 ({currentShower?.magnitude})</p>
              <p>· k = 云量修正 ({(1 - cloudCover / 10).toFixed(2)})</p>
            </div>
          </div>
        </Card>

        <Card
          title="观测朝向建议"
          subtitle="最佳观测方向与视野范围"
          icon={<Navigation className="w-4 h-4" />}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                    const rad = (angle - 90) * (Math.PI / 180);
                    const x2 = 100 + 85 * Math.cos(rad);
                    const y2 = 100 + 85 * Math.sin(rad);
                    const labels = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
                    return (
                      <g key={angle}>
                        <line x1="100" y1="100" x2={x2} y2={y2} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <text
                          x={100 + 95 * Math.cos(rad)}
                          y={100 + 95 * Math.sin(rad)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#9ca3af"
                          fontSize="10"
                        >
                          {labels[i]}
                        </text>
                      </g>
                    );
                  })}

                  {peakHour && (
                    <>
                      {(() => {
                        const rad = (peakHour.radiantAzimuth - 90) * (Math.PI / 180);
                        const r = Math.max(20, peakHour.radiantAltitude);
                        const x = 100 + (r / 90) * 60 * Math.cos(rad);
                        const y = 100 + (r / 90) * 60 * Math.sin(rad);
                        return (
                          <>
                            <path
                              d={`M 100 100 L ${100 + 85 * Math.cos(rad - 0.5)} ${100 + 85 * Math.sin(rad - 0.5)} A 85 85 0 0 1 ${100 + 85 * Math.cos(rad + 0.5)} ${100 + 85 * Math.sin(rad + 0.5)} Z`}
                              fill="#fbbf24"
                              fillOpacity="0.2"
                            />
                            <circle cx={x} cy={y} r="8" fill="#fbbf24" />
                            <text
                              x={x}
                              y={y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#fff"
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {peakHour.radiantAltitude.toFixed(0)}°
                            </text>
                          </>
                        );
                      })()}
                    </>
                  )}

                  {hourlyData.some(d => d.moonAltitude > 0) && (
                    <>
                      {(() => {
                        const moonData = hourlyData.find(d => d.moonAltitude > 0);
                        if (!moonData) return null;
                        const rad = (moonData.moonAltitude - 90) * (Math.PI / 180);
                        const r = Math.max(20, moonData.moonAltitude);
                        const x = 100 + (r / 90) * 60 * Math.cos(rad);
                        const y = 100 + (r / 90) * 60 * Math.sin(rad);
                        return (
                          <>
                            <circle cx={x} cy={y} r="12" fill="#3b82f6" opacity="0.2" />
                            <circle cx={x} cy={y} r="6" fill="#60a5fa" />
                            <text x={x} y={y + 22} textAnchor="middle" fill="#60a5fa" fontSize="9">月亮</text>
                          </>
                        );
                      })()}
                    </>
                  )}

                  <circle cx="100" cy="100" r="3" fill="#fff" />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium text-sm">最佳朝向</h4>
                  <p className="text-sm text-gray-400">
                    朝向{peakHour ? getDirectionName(peakHour.radiantAzimuth) : '--'}方向，
                    视野中心抬高约{peakHour ? Math.round(peakHour.radiantAltitude / 2) : '--'}°
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium text-sm">避开方向</h4>
                  <p className="text-sm text-gray-400">
                    {hourlyData.some(d => d.moonAltitude > 0)
                      ? '月亮方向，如果月亮在地平线以上，请将月亮置于视野之外'
                      : '月亮未升起，无需特别避开'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium text-sm">视野范围</h4>
                  <p className="text-sm text-gray-400">
                    建议视野覆盖约60°×60°的天区，以辐射点为中心向四周扩展
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="流量修正说明">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white/5 rounded-xl">
            <h4 className="text-white font-medium mb-2">辐射点高度修正</h4>
            <p className="text-sm text-gray-400">
              流星的可见数量与辐射点高度的正弦值成正比。辐射点在天顶时（90°）可见流星最多，
              接近地平线时（0°）流星会被大气消光严重削弱。
            </p>
            <div className="mt-3 text-xs text-amber-400 font-mono">
              修正因子 = sin(高度)^1.0
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl">
            <h4 className="text-white font-medium mb-2">极限星等修正</h4>
            <p className="text-sm text-gray-400">
              光污染会降低能看到的最暗星等。每降低1个星等，可见流星数约减少2.5倍。
              当前光污染等级{lightPollution}，极限星等约{BORTLE_SCALE.find(b => b.level === lightPollution)?.limitingMag.toFixed(1)}。
            </p>
            <div className="mt-3 text-xs text-amber-400 font-mono">
              修正因子 = 10^(-0.4×(lim-r))
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl">
            <h4 className="text-white font-medium mb-2">云量修正</h4>
            <p className="text-sm text-gray-400">
              云层会遮挡部分流星。当前云量{cloudCover}级，
              约{cloudCover * 16.7}%的天空被遮挡，可见流星数相应减少。
            </p>
            <div className="mt-3 text-xs text-amber-400 font-mono">
              修正因子 = {(1 - cloudCover / 10).toFixed(2)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
