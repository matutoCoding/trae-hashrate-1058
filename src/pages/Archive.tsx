import { useState, useMemo } from 'react';
import { Database, Star, Calendar, TrendingUp, Moon, BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getRecords, getArchives, saveArchive } from '@/utils/storage';
import { formatDate, formatPercentage } from '@/utils/format';
import { getMoonPhaseName } from '@/utils/astronomy';
import Card from '@/components/Card';
import { MeteorShower, ShowerArchive } from '@/types';

export default function Archive() {
  const { showers } = useAppStore();
  const [expandedShower, setExpandedShower] = useState<string | null>(null);
  const [archives] = useState<ShowerArchive[]>(() => getArchives());
  const records = useMemo(() => getRecords(), []);

  const toggleShower = (id: string) => {
    setExpandedShower(expandedShower === id ? null : id);
  };

  const getShowerArchives = (showerId: string) => {
    return archives.filter(a => a.showerId === showerId);
  };

  const getShowerRecords = (showerId: string) => {
    return records.filter(r => r.settingId === showerId);
  };

  const generateArchiveForShower = (shower: MeteorShower) => {
    const showerRecords = getShowerRecords(shower.id);
    if (showerRecords.length === 0) return null;

    const year = new Date().getFullYear();
    const totalMeteors = showerRecords.reduce((sum, r) => sum + r.meteorCount, 0);
    const totalMinutes = showerRecords.reduce((sum, r) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      return sum + (end.getTime() - start.getTime()) / 60000;
    }, 0);
    const avgZH = totalMinutes > 0 ? (totalMeteors / totalMinutes) * 60 : 0;

    const archive: ShowerArchive = {
      id: '',
      showerId: shower.id,
      year,
      peakDate: `${year}-${shower.peakDate}`,
      observedZHR: Math.round(avgZH),
      moonPhase: 0.5,
      moonIllumination: 0.5,
      notes: `基于 ${showerRecords.length} 次观测记录`,
      recordIds: showerRecords.map(r => r.id),
    };

    saveArchive(archive);
    alert('档案生成成功！');
  };

  const getNextPeakDate = (shower: MeteorShower) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let peakDate = new Date(`${currentYear}-${shower.peakDate}`);
    if (peakDate < now) {
      peakDate = new Date(`${currentYear + 1}-${shower.peakDate}`);
    }
    return peakDate;
  };

  const getDaysUntilPeak = (shower: MeteorShower) => {
    const peak = getNextPeakDate(shower);
    const now = new Date();
    const diff = Math.ceil((peak.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getSeasonColor = (peakDate: string) => {
    const month = parseInt(peakDate.split('-')[0]);
    if (month >= 3 && month <= 5) return 'text-green-400';
    if (month >= 6 && month <= 8) return 'text-amber-400';
    if (month >= 9 && month <= 11) return 'text-orange-400';
    return 'text-blue-400';
  };

  const getSeasonName = (peakDate: string) => {
    const month = parseInt(peakDate.split('-')[0]);
    if (month >= 3 && month <= 5) return '春季';
    if (month >= 6 && month <= 8) return '夏季';
    if (month >= 9 && month <= 11) return '秋季';
    return '冬季';
  };

  const majorShowers = showers.filter(s => s.zhr >= 10);
  const minorShowers = showers.filter(s => s.zhr < 10);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">流星雨档案</h2>
        <p className="text-gray-400">流星雨群资料库与历年观测数据</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1">收录流星雨</div>
          <div className="text-3xl font-bold text-white font-mono">{showers.length}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1">主要流星雨</div>
          <div className="text-3xl font-bold text-amber-400 font-mono">{majorShowers.length}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1">档案记录</div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{archives.length}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1">观测记录</div>
          <div className="text-3xl font-bold text-blue-400 font-mono">{records.length}</div>
        </Card>
      </div>

      <Card
        title="近期极大"
        subtitle="未来90天内的流星雨极大期"
        icon={<Calendar className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showers
            .filter(s => getDaysUntilPeak(s) <= 90)
            .sort((a, b) => getDaysUntilPeak(a) - getDaysUntilPeak(b))
            .slice(0, 6)
            .map(shower => {
              const daysUntil = getDaysUntilPeak(shower);
              return (
                <div
                  key={shower.id}
                  className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium">{shower.name}</h4>
                      <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-400">
                        {shower.code}
                      </span>
                    </div>
                    <div className={`text-2xl font-bold ${getSeasonColor(shower.peakDate)}`}>
                      {daysUntil}
                      <span className="text-sm text-gray-400">天</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">极大期</span>
                      <span className="text-white">{formatDate(getNextPeakDate(shower))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ZHR</span>
                      <span className="text-amber-400 font-mono">{shower.zhr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">季节</span>
                      <span className={getSeasonColor(shower.peakDate)}>{getSeasonName(shower.peakDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      <Card
        title="主要流星雨"
        subtitle="ZHR ≥ 10 的主要流星雨群"
        icon={<Star className="w-4 h-4" />}
      >
        <div className="space-y-3">
          {majorShowers.map(shower => {
            const isExpanded = expandedShower === shower.id;
            const showerArchives = getShowerArchives(shower.id);
            const showerRecords = getShowerRecords(shower.id);

            return (
              <div
                key={shower.id}
                className="border border-white/10 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleShower(shower.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{shower.name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-400">
                          {shower.code}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          getSeasonColor(shower.peakDate) + ' bg-current/10'
                        }`}>
                          {getSeasonName(shower.peakDate)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        活动期: {shower.activeStart} ~ {shower.activeEnd} · 极大: {shower.peakDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm text-gray-400">ZHR</div>
                      <div className="text-2xl font-bold text-amber-400 font-mono">{shower.zhr}</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-white font-medium flex items-center gap-2">
                          <Database className="w-4 h-4 text-amber-400" />
                          基本信息
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="text-gray-400 text-xs">辐射点赤经</div>
                            <div className="text-white font-mono">{shower.radiantRA}°</div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="text-gray-400 text-xs">辐射点赤纬</div>
                            <div className="text-white font-mono">{shower.radiantDec}°</div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="text-gray-400 text-xs">流星速度</div>
                            <div className="text-white font-mono">{shower.velocity} km/s</div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="text-gray-400 text-xs">平均星等</div>
                            <div className="text-white font-mono">{shower.magnitude}</div>
                          </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-gray-400 text-xs">母体</div>
                          <div className="text-white">{shower.parentBody}</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-white font-medium flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          观测历史
                        </h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="p-3 bg-white/5 rounded-lg text-center">
                            <div className="text-2xl font-bold text-amber-400">{showerRecords.length}</div>
                            <div className="text-gray-400 text-xs">观测次数</div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg text-center">
                            <div className="text-2xl font-bold text-emerald-400">
                              {showerRecords.reduce((s, r) => s + r.meteorCount, 0)}
                            </div>
                            <div className="text-gray-400 text-xs">总流星数</div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-400">{showerArchives.length}</div>
                            <div className="text-gray-400 text-xs">档案数</div>
                          </div>
                        </div>

                        {showerArchives.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {showerArchives.map(archive => (
                              <div
                                key={archive.id}
                                className="p-3 bg-white/5 rounded-lg flex items-center justify-between"
                              >
                                <div>
                                  <div className="text-white font-medium">{archive.year}年</div>
                                  <div className="text-xs text-gray-400">{formatDate(archive.peakDate)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-amber-400 font-mono">ZHR {archive.observedZHR}</div>
                                  <div className="text-xs text-gray-400">
                                    {getMoonPhaseName(archive.moonPhase)} ({formatPercentage(archive.moonIllumination)})
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-white/5 rounded-lg text-center">
                            <p className="text-gray-400 text-sm">暂无档案记录</p>
                            {showerRecords.length > 0 && (
                              <button
                                onClick={() => generateArchiveForShower(shower)}
                                className="mt-2 px-4 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors"
                              >
                                生成档案
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="其他流星雨"
        subtitle="ZHR < 10 的次要流星雨群"
        icon={<TrendingUp className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {minorShowers.map(shower => (
            <div
              key={shower.id}
              className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-white font-medium text-sm">{shower.name}</h4>
                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-gray-500">
                  {shower.code}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">极大</span>
                  <span className="text-gray-300">{shower.peakDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ZHR</span>
                  <span className="text-amber-400 font-mono">{shower.zhr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">速度</span>
                  <span className="text-gray-300">{shower.velocity}km/s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="观测小知识">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
            <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" />
              什么是ZHR？
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              ZHR（Zenithal Hourly Rate）是每小时天顶流量，指在理想观测条件下（辐射点在天顶、极限星等6.5等、无云、无月光）每小时可见的流星数量。实际观测到的流星数通常低于ZHR。
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
            <h4 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
              <Moon className="w-4 h-4" />
              月光的影响
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              月光会严重影响暗弱流星的可见度。月相越圆、月亮高度越高，对观测影响越大。建议选择新月前后观测，或避开月亮在地平线以上的时段。
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20">
            <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              辐射点高度
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              辐射点高度是决定可见流星数量的关键因素。辐射点越高，流星路径越长，可见流星越多。一般30°以上才有较好的观测效果。
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <h4 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              观测技巧
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              让眼睛适应黑暗至少20分钟，不要盯着辐射点看，而是观察辐射点周围约30-40度的区域。躺着观测最舒适，带好保暖装备和红光手电筒。
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
