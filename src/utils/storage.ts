import { Location, MeteorShower, ObservationSetting, ObservationRecord, ShowerArchive } from '@/types';
import { DEFAULT_LOCATIONS } from '@/data/locations';
import { METEOR_SHOWERS } from '@/data/showers';

const STORAGE_KEYS = {
  LOCATIONS: 'meteor_locations',
  SHOWERS: 'meteor_showers',
  SETTINGS: 'meteor_settings',
  RECORDS: 'meteor_records',
  ARCHIVES: 'meteor_archives',
  CURRENT_SETTING: 'meteor_current_setting',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export function initializeData(): void {
  if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) {
    saveToStorage(STORAGE_KEYS.LOCATIONS, DEFAULT_LOCATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHOWERS)) {
    saveToStorage(STORAGE_KEYS.SHOWERS, METEOR_SHOWERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.RECORDS)) {
    saveToStorage(STORAGE_KEYS.RECORDS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ARCHIVES)) {
    saveToStorage(STORAGE_KEYS.ARCHIVES, []);
  }
}

export function getLocations(): Location[] {
  return getFromStorage<Location[]>(STORAGE_KEYS.LOCATIONS, DEFAULT_LOCATIONS);
}

export function saveLocation(location: Location): Location {
  const locations = getLocations();
  if (!location.id) {
    location.id = generateId();
  }
  const existingIndex = locations.findIndex(l => l.id === location.id);
  if (existingIndex >= 0) {
    locations[existingIndex] = location;
  } else {
    locations.push(location);
  }
  saveToStorage(STORAGE_KEYS.LOCATIONS, locations);
  return location;
}

export function deleteLocation(id: string): void {
  const locations = getLocations().filter(l => l.id !== id);
  saveToStorage(STORAGE_KEYS.LOCATIONS, locations);
}

export function getShowers(): MeteorShower[] {
  return getFromStorage<MeteorShower[]>(STORAGE_KEYS.SHOWERS, METEOR_SHOWERS);
}

export function getShowerById(id: string): MeteorShower | undefined {
  return getShowers().find(s => s.id === id);
}

export function saveShower(shower: MeteorShower): MeteorShower {
  const showers = getShowers();
  if (!shower.id) {
    shower.id = generateId();
  }
  const existingIndex = showers.findIndex(s => s.id === shower.id);
  if (existingIndex >= 0) {
    showers[existingIndex] = shower;
  } else {
    showers.push(shower);
  }
  saveToStorage(STORAGE_KEYS.SHOWERS, showers);
  return shower;
}

export function deleteShower(id: string): void {
  const showers = getShowers().filter(s => s.id !== id);
  saveToStorage(STORAGE_KEYS.SHOWERS, showers);
}

export function getRecords(): ObservationRecord[] {
  return getFromStorage<ObservationRecord[]>(STORAGE_KEYS.RECORDS, []);
}

export function saveRecord(record: ObservationRecord): ObservationRecord {
  const records = getRecords();
  if (!record.id) {
    record.id = generateId();
  }
  if (!record.createdAt) {
    record.createdAt = new Date().toISOString();
  }
  const existingIndex = records.findIndex(r => r.id === record.id);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  saveToStorage(STORAGE_KEYS.RECORDS, records);
  return record;
}

export function deleteRecord(id: string): void {
  const records = getRecords().filter(r => r.id !== id);
  saveToStorage(STORAGE_KEYS.RECORDS, records);
}

export function getRecordsByShower(showerId: string): ObservationRecord[] {
  return getRecords().filter(r => r.settingId === showerId);
}

export function getArchives(): ShowerArchive[] {
  return getFromStorage<ShowerArchive[]>(STORAGE_KEYS.ARCHIVES, []);
}

export function saveArchive(archive: ShowerArchive): ShowerArchive {
  const archives = getArchives();
  if (!archive.id) {
    archive.id = generateId();
  }
  const existingIndex = archives.findIndex(a => a.id === archive.id);
  if (existingIndex >= 0) {
    archives[existingIndex] = archive;
  } else {
    archives.push(archive);
  }
  saveToStorage(STORAGE_KEYS.ARCHIVES, archives);
  return archive;
}

export function deleteArchive(id: string): void {
  const archives = getArchives().filter(a => a.id !== id);
  saveToStorage(STORAGE_KEYS.ARCHIVES, archives);
}

export function getArchivesByShower(showerId: string): ShowerArchive[] {
  return getArchives().filter(a => a.showerId === showerId);
}

export function exportData(): string {
  const data = {
    locations: getLocations(),
    showers: getShowers(),
    records: getRecords(),
    archives: getArchives(),
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.locations) saveToStorage(STORAGE_KEYS.LOCATIONS, data.locations);
    if (data.showers) saveToStorage(STORAGE_KEYS.SHOWERS, data.showers);
    if (data.records) saveToStorage(STORAGE_KEYS.RECORDS, data.records);
    if (data.archives) saveToStorage(STORAGE_KEYS.ARCHIVES, data.archives);
    return true;
  } catch (e) {
    console.error('Error importing data:', e);
    return false;
  }
}

export function downloadExport(): void {
  const dataStr = exportData();
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meteor-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getSettings(): ObservationSetting[] {
  return getFromStorage<ObservationSetting[]>(STORAGE_KEYS.SETTINGS, []);
}

export function saveSetting(setting: ObservationSetting): ObservationSetting {
  const settings = getSettings();
  if (!setting.id) {
    setting.id = generateId();
  }
  const existingIndex = settings.findIndex(s => s.id === setting.id);
  if (existingIndex >= 0) {
    settings[existingIndex] = setting;
  } else {
    settings.push(setting);
  }
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  saveToStorage(STORAGE_KEYS.CURRENT_SETTING, setting);
  return setting;
}

export function getCurrentSetting(): ObservationSetting | null {
  return getFromStorage<ObservationSetting | null>(STORAGE_KEYS.CURRENT_SETTING, null);
}
