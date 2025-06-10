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
  entityType: 'screen' | 'button' | 'questionnaire' | 'question' | 'response';
  changeType: 'rename' | 'archive' | 'unarchive' | 'delete' | 'reorder' | 'move' | 'create' | 'update' | 'edit';
  timestamp: number;
  oldValue?: string;
  newValue?: string;
  // For response edits
  questionnaireResponseId?: string;
  questionId?: string;
  previousValue?: number;
  newResponseValue?: number;
}

// Questionnaire Types
export type QuestionScaleType = 'binary' | 'five-point' | 'seven-point';

export interface ScaleLabels {
  binary?: {
    positive: string; // Default: "Yes"
    negative: string; // Default: "No"
  };
  fivePoint?: {
    veryNegative: string; // Default: "Strongly Disagree"
    negative: string; // Default: "Disagree"
    neutral: string; // Default: "Neutral"
    positive: string; // Default: "Agree"
    veryPositive: string; // Default: "Strongly Agree"
  };
  sevenPoint?: {
    veryNegative: string; // Default: "Strongly Disagree"
    negative: string; // Default: "Disagree"
    somewhatNegative: string; // Default: "Somewhat Disagree"
    neutral: string; // Default: "Neutral"
    somewhatPositive: string; // Default: "Somewhat Agree"
    positive: string; // Default: "Agree"
    veryPositive: string; // Default: "Strongly Agree"
  };
}

export interface QuestionData {
  id: string;
  text: string;
  scaleType: QuestionScaleType;
  order: number;
  subscribedButtonIds: string[]; // Button IDs this question tracks
  scaleLabels?: ScaleLabels; // Custom labels for the scale
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
  lastModified?: number; // Track when this response was last edited
  editHistory?: {
    timestamp: number;
    previousValue: number;
    newValue: number;
  }[];
}

export interface FilledQuestionnaire {
  id: string;
  questionnaireId: string;
  questionnaireName: string;
  responses: QuestionResponse[];
  filledAt: number;
  date: string;
  notes?: string;
  lastModified?: number; // Track when this filled questionnaire was last edited
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