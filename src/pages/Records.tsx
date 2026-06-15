import { useState, useMemo } from 'react';
import { BookOpen, Plus, Trash2, Calendar, Clock, MapPin, Cloud, Eye, Search, Filter, Download, Upload, Star, AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getRecords, saveRecord, deleteRecord, downloadExport, importData } from '@/utils/storage';
import { formatDateTime, formatDuration, getCloudCoverLabel } from '@/utils/format';
import { WEATHER_OPTIONS, SKY_CONDITION_OPTIONS } from '@/data/constants';
import Card from '@/components/Card';
import { ObservationRecord } from '@/types';
import { differenceInMinutes } from 'date-fns';

export default function Records() {
  const { showers, currentShower } = useAppStore();
  const [records, setRecords] = useState<ObservationRecord[]>(() => getRecords());
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShower, setFilterShower] = useState<string>('all');

  const [newRecord, setNewRecord] = useState<Partial<ObservationRecord>>({
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date().toISOString().slice(0, 16),
    meteorCount: 0,
    weather: '晴朗',
    skyCondition: '良好',
    notes: '',
  });

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        if (filterShower !== 'all' && r.settingId !== filterShower) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            r.notes.toLowerCase().includes(query) ||
            r.weather.toLowerCase().includes(query) ||
            r.skyCondition.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [records, searchQuery, filterShower]);

  const isValidRecord = (r: ObservationRecord) => {
    const start = new Date(r.startTime);
    const end = new Date(r.endTime);
    return end > start;
  };

  const stats = useMemo(() => {
    const validRecords = records.filter(isValidRecord);
    const totalRecords = records.length;
    const validCount = validRecords.length;
    const totalMeteors = validRecords.reduce((sum, r) => sum + r.meteorCount, 0);
    const totalMinutes = validRecords.reduce((sum, r) => {
      return sum + differenceInMinutes(new Date(r.endTime), new Date(r.startTime));
    }, 0);
    const avgZH = totalMinutes > 0 ? (totalMeteors / totalMinutes) * 60 : 0;
    const invalidCount = totalRecords - validCount;

    return { totalRecords, validCount, totalMeteors, totalMinutes, avgZH, invalidCount };
  }, [records]);

  const [saveError, setSaveError] = useState('');

  const handleSaveRecord = () => {
    if (!newRecord.startTime || !newRecord.endTime) return;

    const start = new Date(newRecord.startTime);
    const end = new Date(newRecord.endTime);
    
    if (end <= start) {
      setSaveError('结束时间必须晚于开始时间！');
      return;
    }
    
    if (differenceInMinutes(end, start) < 1) {
      setSaveError('观测时长至少需要1分钟！');
      return;
    }

    setSaveError('');
    const minutes = differenceInMinutes(end, start);
    const actualZH = minutes > 0 ? (newRecord.meteorCount! / minutes) * 60 : 0;

    const record: ObservationRecord = {
      id: '',
      settingId: currentShower?.id || 'unknown',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      meteorCount: newRecord.meteorCount || 0,
      actualZH: Math.round(actualZH * 10) / 10,
      weather: newRecord.weather || '晴朗',
      skyCondition: newRecord.skyCondition || '良好',
      notes: newRecord.notes || '',
      createdAt: new Date().toISOString(),
    };

    const saved = saveRecord(record);
    setRecords(getRecords());
    setShowAddModal(false);
    setNewRecord({
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date().toISOString().slice(0, 16),
      meteorCount: 0,
      weather: '晴朗',
      skyCondition: '良好',
      notes: '',
    });
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('确定要删除这条观测记录吗？')) {
      deleteRecord(id);
      setRecords(getRecords());
    }
  };

  const handleExport = () => {
    downloadExport();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (importData(content)) {
            alert('数据导入成功！');
            setRecords(getRecords());
          } else {
            alert('数据导入失败，请检查文件格式');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getShowerName = (id: string) => {
    return showers.find(s => s.id === id)?.name || '未知';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">观测记录</h2>
          <p className="text-gray-400">记录和管理您的流星雨观测数据</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            导入
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新建记录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1">观测次数</div>
          <div className="text-3xl font-bold text-white font-mono">
            {stats.validCount}
            {stats.invalidCount > 0 && (
              <span className="text-sm text-gray-500 ml-1">/{stats.totalRecords}</span>
            )}
          </div>
          {stats.invalidCount > 0 && (
            <div className="text-xs text-red-400 mt-1">
              {stats.invalidCount} 条无效记录已排除
            </div>
          )}
        </Card>
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1">流星总数</div>
          <div className="text-3xl font-bold text-amber-400 font-mono">{stats.totalMeteors}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1">观测时长</div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{Math.round(stats.totalMinutes / 60)}h</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-gray-400 mb-1">平均 ZHR</div>
          <div className="text-3xl font-bold text-blue-400 font-mono">{stats.avgZH.toFixed(1)}</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索备注、天气..."
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterShower}
            onChange={(e) => setFilterShower(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">全部流星雨</option>
            {showers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              {searchQuery || filterShower !== 'all' ? '没有找到匹配的观测记录' : '还没有观测记录'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-block mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm"
            >
              添加第一条记录
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:bg-white/[0.07] transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                      {getShowerName(record.settingId)}
                    </span>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(record.startTime)}
                    </span>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(record.startTime, record.endTime)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">目击流星</div>
                      <div className="text-xl font-bold text-amber-400 font-mono">{record.meteorCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">实际 ZHR</div>
                      <div className="text-xl font-bold text-emerald-400 font-mono">{record.actualZH}/h</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">天气</div>
                      <div className="text-white flex items-center gap-1">
                        <Cloud className="w-4 h-4 text-blue-400" />
                        {record.weather}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">天空状况</div>
                      <div className="text-white flex items-center gap-1">
                        <Eye className="w-4 h-4 text-emerald-400" />
                        {record.skyCondition}
                      </div>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="text-sm text-gray-400 bg-white/5 rounded-lg p-3">
                      {record.notes}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteRecord(record.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0e27] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">新建观测记录</h3>
                <p className="text-sm text-gray-400 mt-1">记录您的流星雨观测数据</p>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">开始时间</label>
                  <input
                    type="datetime-local"
                    value={newRecord.startTime}
                    onChange={(e) => {
                      setNewRecord({ ...newRecord, startTime: e.target.value });
                      setSaveError('');
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">结束时间</label>
                  <input
                    type="datetime-local"
                    value={newRecord.endTime}
                    onChange={(e) => {
                      setNewRecord({ ...newRecord, endTime: e.target.value });
                      setSaveError('');
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">目击流星数</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setNewRecord({ ...newRecord, meteorCount: Math.max(0, (newRecord.meteorCount || 0) - 1) })}
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-lg text-2xl"
                  >
                    -
                  </button>
                  <div className="text-4xl font-bold text-amber-400 font-mono min-w-[80px] text-center">
                    {newRecord.meteorCount}
                  </div>
                  <button
                    onClick={() => setNewRecord({ ...newRecord, meteorCount: (newRecord.meteorCount || 0) + 1 })}
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-lg text-2xl"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">天气状况</label>
                <div className="flex flex-wrap gap-2">
                  {WEATHER_OPTIONS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setNewRecord({ ...newRecord, weather: w })}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        newRecord.weather === w
                          ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">天空状况</label>
                <div className="flex flex-wrap gap-2">
                  {SKY_CONDITION_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewRecord({ ...newRecord, skyCondition: s })}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        newRecord.skyCondition === s
                          ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">备注</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  rows={3}
                  placeholder="记录观测中的特殊现象、设备、同伴等..."
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
                onClick={handleSaveRecord}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
              >
                保存记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
