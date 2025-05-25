export interface ButtonData {
  id: string;
  text: string;
  count: number;
  clicks: ClickRecord[];
}

export interface ClickRecord {
  timestamp: number;
  date: string;
}

export interface Screen {
  id: string;
  name: string;
  buttons: ButtonData[];
}

export interface AppState {
  screens: Screen[];
  currentScreenId: string;
} 