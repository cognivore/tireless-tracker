export interface ButtonData {
  id: string;
  text: string;
  count: number;
  clicks: ClickRecord[];
  archived?: boolean;
}

export interface ClickRecord {
  timestamp: number;
  date: string;
}

export interface Screen {
  id: string;
  name: string;
  buttons: ButtonData[];
  archived?: boolean;
}

export interface AppState {
  trackerId: string;
  trackerName: string;
  screens: Screen[];
  currentScreenId: string;
  archived?: boolean;
} 