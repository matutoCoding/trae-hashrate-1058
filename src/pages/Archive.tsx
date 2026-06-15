import { useState, useMemo } from 'react';
import { Database, Star, Calendar, TrendingUp, Moon, BookOpen, ChevronDown, ChevronUp, Sparkles, Plus, X, Trash2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getRecords, getArchives, saveArchive, deleteArchive } from '@/utils/storage';
import { formatDate, formatPercentage } from '@/utils/format';
import { getMoonPhaseName } from '@/utils/astronomy';
import Card from '@/components/Card';
import { MeteorShower, ShowerArchive } from '@/types';

export default function Archive() {
  const { showers } = useAppStore();
  const [expandedShower, setExpandedShower] = useState<string | null>(null);
  const [archives, setArchives] = useState<ShowerArchive[]>(() => getArchives());
  const records = useMemo(() => getRecords(), []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newArchive, setNewArchive] = useState<Partial<ShowerArchive>>({
    showerId: '',
    year: new Date().getFullYear(),
    peakDate: `${new Date().getFullYear()}-01-01`,
    observedZHR: 100,
    moonPhase: 0,
    moonIllumination: 0,
    notes: '',
    source: 'manual',
    recordIds: [],
  });
  const [saveError, setSaveError] = useState('');

  const toggleShower = (id: string) => {
    setExpandedShower(expandedShower === id ? null : id);
  };

  const getShowerArchives = (showerId: string) => {
    return archives.filter(a => a.showerId === showerId);
  };

  const getShowerRecords = (showerId: string) => {
    return records.filter(r => r.settingId === showerId);
  };

  const handleSaveArchive = () => {
    if (!newArchive.showerId) {
      setSaveError('请选择流星雨');
      return;
    }
    if (!newArchive.peakDate) {
      setSaveError('请选择极大日期');
      return;
    }
    if (!newArchive.observedZHR || newArchive.observedZHR <= 0) {
      setSaveError('请输入有效的实测ZHR');
      return;
    }

    const archive: ShowerArchive = {
      id: '',
      showerId: newArchive.showerId!,
      year: newArchive.year || new Date().getFullYear(),
      peakDate: newArchive.peakDate!,
      observedZHR: newArchive.observedZHR!,
      moonPhase: newArchive.moonPhase || 0,
      moonIllumination: newArchive.moonIllumination || 0,
      notes: newArchive.notes || '',
      recordIds: newArchive.recordIds || [],
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    saveArchive(archive);
    setArchives(getArchives());
    setShowAddModal(false);
    setSaveError('');
    setNewArchive({
      showerId: '',
      year: new Date().getFullYear(),
      peakDate: `${new Date().getFullYear()}-01-01`,
      observedZHR: 100,
      moonPhase: 0,
      moonIllumination: 0,
      notes: '',
      source: 'manual',
      recordIds: [],
    });
  };

  const handleDeleteArchive = (id: string) => {
    if (confirm('确定要删除这条档案记录吗？')) {
      deleteArchive(id);
      setArchives(getArchives());
    }
  };

  const generateArchiveForShower = (shower: MeteorShower) => {
    const showerRecords = getShowerRecords(shower.id);
    if (showerRecords.length === 0) return null;

    const year = new Date().getFullYear();
    const totalMeteors = showerRecords.reduce((sum, r) => sum + r.meteorCount, 0);
    const totalMinutes = showerRecords.reduce((sum, r) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      if (end <= start) return sum;
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
      source: 'auto',
      createdAt: new Date().toISOString(),
    };

    saveArchive(archive);
    setArchives(getArchives());
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

  const MOON_PHASE_OPTIONS = [
    { value: 0, label: '新月', illumination: 0 },
    { value: 0.125, label: '娥眉月', illumination: 0.15 },
    { value: 0.25, label: '上弦月', illumination: 0.5 },
    { value: 0.375, label: '盈凸月', illumination: 0.85 },
    { value: 0.5, label: '满月', illumination: 1 },
    { value: 0.625, label: '亏凸月', illumination: 0.85 },
    { value: 0.75, label: '下弦月', illumination: 0.5 },
    { value: 0.875, label: '残月', illumination: 0.15 },
  ];

  const getSourceLabel = (source: string) => {
    return source === 'manual' ? '手动录入' : '自动生成';
  };

  const getSourceColor = (source: string) => {
    return source === 'manual' 
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">流星雨档案</h2>
          <p className="text-gray-400">流星雨群资料库与历年观测数据</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          添加档案
        </button>
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
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {showerArchives.map(archive => (
                              <div
                                key={archive.id}
                                className="p-3 bg-white/5 rounded-lg flex items-center justify-between group"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-medium">{archive.year}年</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getSourceColor(archive.source || 'auto')}`}>
                                      {getSourceLabel(archive.source || 'auto')}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400">{formatDate(archive.peakDate)}</div>
                                  {archive.notes && (
                                    <div className="text-xs text-gray-500 mt-1">{archive.notes}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-amber-400 font-mono">ZHR {archive.observedZHR}</div>
                                    <div className="text-xs text-gray-400">
                                      {getMoonPhaseName(archive.moonPhase)} ({formatPercentage(archive.moonIllumination)})
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteArchive(archive.id);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="删除档案"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0e27] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">添加流星雨档案</h3>
                <p className="text-sm text-gray-400 mt-1">记录历年极大期观测数据</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSaveError('');
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {saveError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {saveError}
                </div>
              )}

              <div>
                <label className="text-sm text-gray-400 mb-1 block">流星雨</label>
                <select
                  value={newArchive.showerId}
                  onChange={(e) => {
                    const shower = showers.find(s => s.id === e.target.value);
                    setNewArchive({ 
                      ...newArchive, 
                      showerId: e.target.value,
                      year: newArchive.year,
                      peakDate: `${newArchive.year}-${shower?.peakDate || '01-01'}`,
                    });
                    setSaveError('');
                  }}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">请选择流星雨</option>
                  {showers.map(shower => (
                    <option key={shower.id} value={shower.id} className="bg-[#0a0e27]">
                      {shower.name} ({shower.code}) - ZHR {shower.zhr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">年份</label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={newArchive.year}
                    onChange={(e) => {
                      const year = parseInt(e.target.value) || new Date().getFullYear();
                      const shower = showers.find(s => s.id === newArchive.showerId);
                      setNewArchive({
                        ...newArchive,
                        year,
                        peakDate: `${year}-${shower?.peakDate || '01-01'}`,
                      });
                      setSaveError('');
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">极大日期</label>
                  <input
                    type="date"
                    value={newArchive.peakDate}
                    onChange={(e) => {
                      setNewArchive({ ...newArchive, peakDate: e.target.value });
                      setSaveError('');
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">实测 ZHR</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={newArchive.observedZHR}
                  onChange={(e) => {
                    setNewArchive({ ...newArchive, observedZHR: parseInt(e.target.value) || 0 });
                    setSaveError('');
                  }}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="输入每小时天顶流量"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">月相</label>
                <div className="grid grid-cols-4 gap-2">
                  {MOON_PHASE_OPTIONS.map((phase) => (
                    <button
                      key={phase.value}
                      onClick={() => setNewArchive({ 
                        ...newArchive, 
                        moonPhase: phase.value, 
                        moonIllumination: phase.illumination 
                      })}
                      className={`px-2 py-2 rounded-lg text-xs transition-colors ${
                        newArchive.moonPhase === phase.value
                          ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                          : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      {phase.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">备注</label>
                <textarea
                  value={newArchive.notes}
                  onChange={(e) => setNewArchive({ ...newArchive, notes: e.target.value })}
                  rows={3}
                  placeholder="记录观测条件、特殊现象、参考来源等..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSaveError('');
                }}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveArchive}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
              >
                保存档案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
