import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Sparkles, TrendingUp, MapPin, AlertTriangle, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAstronomyData } from '@/hooks/useAstronomy';
import { formatAltitude, formatAzimuth, formatDate, getQualityColor, getQualityLabel, getQualityBgColor, getDirectionName } from '@/utils/format';
import { getMoonPhaseName } from '@/utils/astronomy';
import Card from '@/components/Card';
import { NavLink } from 'react-router-dom';

export default function Radiant() {
  const { currentLocation, currentShower, observationDate } = useAppStore();
  const { isReady, hourlyData, maxAltitude, hasInefficientPeriods, inefficientWarning, moonPhase } = useAstronomyData();

  const chartData = useMemo(() => {
    return hourlyData.filter((_, i) => i % 2 === 0).map(d => ({
      ...d,
      timeLabel: d.timeLabel,
      altitude: Math.max(0, d.radiantAltitude),
      moonAlt: Math.max(0, d.moonAltitude),
    }));
  }, [hourlyData]);

  const nightHours = useMemo(() => {
    return hourlyData.filter(d => d.isNight);
  }, [hourlyData]);

  const riseTime = useMemo(() => {
    const rise = hourlyData.find(d => d.radiantAltitude > 0 && d.hour >= 12);
    return rise?.timeLabel || '未升起';
  }, [hourlyData]);

  const setTime = useMemo(() => {
    const set = [...hourlyData].reverse().find(d => d.radiantAltitude > 0);
    return set?.timeLabel || '未落';
  }, [hourlyData]);

  if (!isReady) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">辐射点推算</h2>
          <p className="text-gray-400">请先在观测设置页配置地点和流星雨</p>
        </div>
        <Card>
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">辐射点推算</h2>
          <p className="text-gray-400">
            {currentLocation?.name} · {currentShower?.name} · {formatDate(observationDate)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">月相</div>
          <div className="text-amber-400 font-medium">
            {getMoonPhaseName(moonPhase.phase)} ({Math.round(moonPhase.illumination * 100)}%)
          </div>
        </div>
      </div>

      {hasInefficientPeriods && inefficientWarning.length > 0 && (
        <div className="space-y-2">
          {inefficientWarning.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-pulse-slow"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-200 text-sm">{warning}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4" />
            最大高度
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {maxAltitude ? formatAltitude(maxAltitude.radiantAltitude) : '--'}
          </div>
          <div className="text-xs text-gray-500">
            {maxAltitude?.timeLabel || '--'}
          </div>
        </Card>

        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1">
            <ArrowUp className="w-4 h-4" />
            升起时间
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {riseTime}
          </div>
          <div className="text-xs text-gray-500">辐射点升起</div>
        </Card>

        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1">
            <ArrowDown className="w-4 h-4" />
            下落时间
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {setTime}
          </div>
          <div className="text-xs text-gray-500">辐射点下落</div>
        </Card>

        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1">
            <MapPin className="w-4 h-4" />
            辐射点坐标
          </div>
          <div className="text-lg font-bold text-white font-mono">
            RA {currentShower?.radiantRA}°
          </div>
          <div className="text-sm text-white font-mono">
            Dec {currentShower?.radiantDec}°
          </div>
        </Card>
      </div>

      <Card
        title="辐射点高度变化"
        subtitle="24小时辐射点地平高度曲线"
        icon={<Sparkles className="w-4 h-4" />}
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="moonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
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
                domain={[0, 90]}
                label={{ value: '高度 (°)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 14, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}°`,
                  name === 'altitude' ? '辐射点高度' : '月亮高度'
                ]}
                labelFormatter={(label) => `时间: ${label}`}
              />
              <ReferenceLine
                y={30}
                stroke="#10b981"
                strokeDasharray="5 5"
                label={{ value: '适宜观测', fill: '#10b981', fontSize: 10, position: 'right' }}
              />
              <Area
                type="monotone"
                dataKey="altitude"
                stroke="#fbbf24"
                strokeWidth={2}
                fill="url(#altitudeGradient)"
                name="altitude"
                dot={false}
                activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="moonAlt"
                stroke="#60a5fa"
                strokeWidth={1.5}
                fill="url(#moonGradient)"
                name="moon"
                dot={false}
                opacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-gray-400">辐射点高度</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-gray-400">月亮高度</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-emerald-400" style={{ borderStyle: 'dashed' }} />
            <span className="text-gray-400">适宜观测线 (30°)</span>
          </div>
        </div>
      </Card>

      <Card
        title="逐小时数据"
        subtitle="夜间时段详细数据"
        icon={<Clock className="w-4 h-4" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">辐射点高度</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">方位</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">月亮高度</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">可见流量</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">观测条件</th>
              </tr>
            </thead>
            <tbody>
              {nightHours.filter((_, i) => i % 2 === 0).map((data, index) => (
                <tr
                  key={index}
                  className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                    data.radiantAltitude <= 0 ? 'opacity-50' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-white font-mono">{data.timeLabel}</td>
                  <td className="py-3 px-4">
                    <span className={data.radiantAltitude >= 30 ? 'text-emerald-400' : data.radiantAltitude > 0 ? 'text-amber-400' : 'text-red-400'}>
                      {formatAltitude(data.radiantAltitude)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {getDirectionName(data.radiantAzimuth)} ({formatAzimuth(data.radiantAzimuth)})
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {formatAltitude(data.moonAltitude)}
                  </td>
                  <td className="py-3 px-4 font-mono text-amber-400">
                    {data.visibleRate.toFixed(1)}/h
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getQualityBgColor(data.quality)} ${getQualityColor(data.quality)}`}>
                      {getQualityLabel(data.quality)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="方位角变化">
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                  const rad = (angle - 90) * (Math.PI / 180);
                  const x1 = 100 + 70 * Math.cos(rad);
                  const y1 = 100 + 70 * Math.sin(rad);
                  const x2 = 100 + 90 * Math.cos(rad);
                  const y2 = 100 + 90 * Math.sin(rad);
                  const labels = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
                  return (
                    <g key={angle}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                      <text
                        x={100 + 98 * Math.cos(rad)}
                        y={100 + 98 * Math.sin(rad)}
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

                {nightHours.filter((_, i) => i % 4 === 0).map((data, i) => {
                  const rad = (data.radiantAzimuth - 90) * (Math.PI / 180);
                  const r = Math.max(10, data.radiantAltitude);
                  const x = 100 + (r / 90) * 70 * Math.cos(rad);
                  const y = 100 + (r / 90) * 70 * Math.sin(rad);
                  const opacity = 0.3 + (i / nightHours.length) * 0.7;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={4}
                      fill="#fbbf24"
                      opacity={opacity}
                    />
                  );
                })}

                {maxAltitude && (
                  <g>
                    {(() => {
                      const rad = (maxAltitude.radiantAzimuth - 90) * (Math.PI / 180);
                      const r = Math.max(10, maxAltitude.radiantAltitude);
                      const x = 100 + (r / 90) * 70 * Math.cos(rad);
                      const y = 100 + (r / 90) * 70 * Math.sin(rad);
                      return (
                        <>
                          <circle cx={x} cy={y} r="8" fill="#fbbf24" opacity="0.3" />
                          <circle cx={x} cy={y} r="5" fill="#fbbf24" />
                        </>
                      );
                    })()}
                  </g>
                )}

                <circle cx="100" cy="100" r="3" fill="#fff" />
              </svg>
            </div>
          </div>
          <div className="text-center text-sm text-gray-400 mt-4">
            <p>辐射点方位角轨迹（从最高点到最低点）</p>
            <p className="text-amber-400 mt-1">
              最大高度方位: {maxAltitude ? getDirectionName(maxAltitude.radiantAzimuth) : '--'}
            </p>
          </div>
        </Card>

        <Card title="观测提示">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">最佳观测高度</h4>
                <p className="text-sm text-gray-400">辐射点高度超过30°时观测效果较好，越高流星数越多</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">观测朝向</h4>
                <p className="text-sm text-gray-400">
                  朝向{maxAltitude ? getDirectionName(maxAltitude.radiantAzimuth) : '--'}方向，
                  视野中心抬高约{maxAltitude ? Math.round(maxAltitude.radiantAltitude / 2) : '--'}°
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">避开月光</h4>
                <p className="text-sm text-gray-400">
                  月相为{getMoonPhaseName(moonPhase.phase)}，
                  照亮率{Math.round(moonPhase.illumination * 100)}%，
                  {moonPhase.illumination > 0.5 ? '月光影响较大，暗弱流星难以观测' : '月光影响较小，观测条件良好'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
