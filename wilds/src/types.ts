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
  entityType: 'screen' | 'button' | 'questionnaire' | 'question';
  changeType: 'rename' | 'archive' | 'unarchive' | 'delete' | 'reorder' | 'move' | 'create' | 'update';
  timestamp: number;
  oldValue?: string;
  newValue?: string;
}

// Questionnaire Types
export type QuestionScaleType = 'binary' | 'five-point' | 'seven-point';

export interface QuestionData {
  id: string;
  text: string;
  scaleType: QuestionScaleType;
  order: number;
  subscribedButtonIds: string[]; // Button IDs this question tracks
  archived?: boolean;
  createdAt?: number;
  lastModified?: number;
  entityVersion?: number;
}

export interface QuestionnaireConfig {
  id: string;
  name: string;
  description?: string;
  frequency: {
    type: 'daily' | 'weekly' | 'custom';
    interval?: number; // For custom frequency (hours)
    time?: string; // Preferred time of day (HH:MM)
    weekdays?: number[]; // For weekly (0=Sunday, 1=Monday, etc.)
  };
  questions: QuestionData[];
  isActive: boolean;
  archived?: boolean;
  createdAt?: number;
  lastModified?: number;
  entityVersion?: number;
}

export interface QuestionResponse {
  questionId: string;
  value: number; // -3 to 3 for seven-point, -2 to 2 for five-point, 0 or 1 for binary
}

export interface FilledQuestionnaire {
  id: string;
  questionnaireId: string;
  questionnaireName: string;
  responses: QuestionResponse[];
  filledAt: number;
  date: string;
  notes?: string;
}

export interface NotificationData {
  id: string;
  questionnaireId: string;
  questionnaireName: string;
  scheduledFor: number;
  dismissed?: boolean;
  createdAt: number;
}

export interface AppState {
  trackerId: string;
  trackerName: string;
  screens: Screen[];
  currentScreenId: string;
  questionnaires: QuestionnaireConfig[];
  filledQuestionnaires: FilledQuestionnaire[];
  notifications: NotificationData[];
  archived?: boolean;
  schemaVersion?: number;
  changeLog?: EntityChange[];
  lastModified?: number;
}