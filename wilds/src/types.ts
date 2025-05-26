export interface ButtonData {
  id: string;
  text: string;
  count: number;
  clicks: ClickRecord[];
  archived?: boolean;
  createdAt?: number;
  lastModified?: number;
  entityVersion?: number;
}

export interface ClickRecord {
  timestamp: number;
  date: string;
  isDecrement?: boolean;
}

export interface Screen {
  id: string;
  name: string;
  buttons: ButtonData[];
  archived?: boolean;
  createdAt?: number;
  lastModified?: number;
  entityVersion?: number;
}

export interface EntityChange {
  entityId: string;
  entityType: 'screen' | 'button';
  changeType: 'rename' | 'archive' | 'unarchive' | 'delete' | 'reorder' | 'move';
  timestamp: number;
  oldValue?: string;
  newValue?: string;
}

export interface AppState {
  trackerId: string;
  trackerName: string;
  screens: Screen[];
  currentScreenId: string;
  archived?: boolean;
  schemaVersion?: number;
  changeLog?: EntityChange[];
  lastModified?: number;
} 