import type {
  AppState,
  ButtonData,
  EntityChange,
  Screen,
  QuestionnaireConfig,
  QuestionData,
  QuestionScaleType,
  QuestionResponse,
  FilledQuestionnaire,
  NotificationData,
  ClickRecord
} from '../types';
import { mergeTrackerStates } from '../utils/mergeUtils';
import { migrateAppState, needsMigration } from '../utils/migrationUtils';

const STORAGE_KEY_PREFIX = 'wilds_tracker_';
const ARCHIVE_KEY_PREFIX = 'wilds_archive_';

export const loadData = (trackerId: string): AppState | null => {
  try {
    // First try to load from active trackers
    let data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${trackerId}`);

    // If not found, try to load from archived trackers
    if (!data) {
      data = localStorage.getItem(`${ARCHIVE_KEY_PREFIX}${trackerId}`);
    }

    if (data) {
      const state = JSON.parse(data) as AppState;

      // Check if migration is needed
      if (needsMigration(state)) {
        const migratedState = migrateAppState(state);
        // Save the migrated state back
        saveData(migratedState);
        return migratedState;
      }

      return state;
    }
    return null;
  } catch (error) {
    console.error('Failed to load data from localStorage', error);
    return null;
  }
};

export const saveData = (data: AppState): void => {
  try {
    // Set the last modified time
    data.lastModified = Date.now();

    const prefix = data.archived ? ARCHIVE_KEY_PREFIX : STORAGE_KEY_PREFIX;
    localStorage.setItem(`${prefix}${data.trackerId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to localStorage', error);
  }
};

export const createTracker = (trackerName: string): AppState => {
  const defaultScreen: Screen = {
    id: `screen-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: 'Main Screen',
    createdAt: Date.now(),
    lastModified: Date.now(),
    entityVersion: 1,
    buttons: [
      {
        id: `button-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        text: 'Water',
        count: 0,
        clicks: [],
        createdAt: Date.now(),
        lastModified: Date.now(),
        entityVersion: 1
      },
      {
        id: `button-${Date.now() + 1}-${Math.floor(Math.random() * 10000)}`,
        text: 'Exercise',
        count: 0,
        clicks: [],
        createdAt: Date.now(),
        lastModified: Date.now(),
        entityVersion: 1
      }
    ]
  };

  const newState: AppState = {
    trackerId: crypto.randomUUID(),
    trackerName,
    screens: [defaultScreen],
    currentScreenId: defaultScreen.id,
    questionnaires: [],
    filledQuestionnaires: [],
    notifications: [],
    archived: false,
    schemaVersion: 1,
    changeLog: []
  };

  saveData(newState);
  return newState;
};

export const getTrackersList = (): { id: string, name: string, archived: boolean }[] => {
  const trackers: { id: string, name: string, archived: boolean }[] = [];

  try {
    // Get active trackers
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const trackerId = key.substring(STORAGE_KEY_PREFIX.length);
        const data = localStorage.getItem(key);
        if (data) {
          const trackerData = JSON.parse(data) as AppState;
          trackers.push({
            id: trackerId,
            name: trackerData.trackerName,
            archived: false
          });
        }
      } else if (key && key.startsWith(ARCHIVE_KEY_PREFIX)) {
        const trackerId = key.substring(ARCHIVE_KEY_PREFIX.length);
        const data = localStorage.getItem(key);
        if (data) {
          const trackerData = JSON.parse(data) as AppState;
          trackers.push({
            id: trackerId,
            name: trackerData.trackerName,
            archived: true
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to retrieve trackers list', error);
  }

  return trackers;
};

export const addClick = (state: AppState, screenId: string, buttonId: string): AppState => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);

  if (screen) {
    const button = screen.buttons.find(b => b.id === buttonId);
    if (button) {
      button.count += 1;
      button.clicks.push({
        timestamp: now.getTime(),
        date: today
      });
    }
  }

  saveData(newState);
  return newState;
};

export const decrementClick = (state: AppState, screenId: string, buttonId: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);

  if (screen) {
    const button = screen.buttons.find(b => b.id === buttonId);
    if (button && button.count > 0) {
      button.count -= 1;

      // Don't remove the click record, just mark it differently
      // In a real app, you might want to add a separate array for decrements
      // But for simplicity, we'll keep it in one array with a timestamp
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Add a "decrement" click record
      button.clicks.push({
        timestamp: now.getTime(),
        date: today,
        isDecrement: true // We add this property to track decrements
      });
    }
  }

  saveData(newState);
  return newState;
};

/**
 * Sanitizes an ID to ensure it's a valid, consistent string
 */
function sanitizeId(id: string | number): string {
  return id.toString().replace(/\s+/g, '-');
}

export const addButton = (state: AppState, screenId: string, buttonText: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);

  if (screen) {
    const now = Date.now();
    const buttonId = sanitizeId(`button-${now}-${Math.floor(Math.random() * 10000)}`);

    const newButton: ButtonData = {
      id: buttonId,
      text: buttonText,
      count: 0,
      clicks: [],
      createdAt: now,
      lastModified: now,
      entityVersion: 1
    };

    screen.buttons.push(newButton);
  }

  saveData(newState);
  return newState;
};

export const addScreen = (state: AppState, screenName: string): AppState => {
  const now = Date.now();
  const newScreen: Screen = {
    id: `screen-${now}-${Math.floor(Math.random() * 10000)}`,
    name: screenName,
    buttons: [],
    createdAt: now,
    lastModified: now,
    entityVersion: 1
  };

  const newState = {
    ...state,
    screens: [...state.screens, newScreen]
  };

  saveData(newState);
  return newState;
};

export const removeScreen = (state: AppState, screenId: string): AppState => {
  // Don't remove if it's the last non-archived screen
  const activeScreens = state.screens.filter(s => !s.archived);
  if (activeScreens.length <= 1 && activeScreens.some(s => s.id === screenId)) {
    return state;
  }

  return archiveScreen(state, screenId);
};

export const archiveScreen = (state: AppState, screenId: string): AppState => {
  const newState = { ...state };
  const screenIndex = newState.screens.findIndex(s => s.id === screenId);

  if (screenIndex !== -1) {
    // Mark the screen as archived
    newState.screens[screenIndex] = {
      ...newState.screens[screenIndex],
      archived: true,
      lastModified: Date.now(),
      entityVersion: (newState.screens[screenIndex].entityVersion || 1) + 1
    };

    // Log the change
    const change: EntityChange = {
      entityId: screenId,
      entityType: 'screen',
      changeType: 'archive',
      timestamp: Date.now()
    };

    newState.changeLog = [...(newState.changeLog || []), change];

    // Update current screen if the archived screen was active
    if (newState.currentScreenId === screenId) {
      const activeScreen = newState.screens.find(s => !s.archived);
      if (activeScreen) {
        newState.currentScreenId = activeScreen.id;
      }
    }
  }

  saveData(newState);
  return newState;
};

export const unarchiveScreen = (state: AppState, screenId: string): AppState => {
  const newState = { ...state };
  const screenIndex = newState.screens.findIndex(s => s.id === screenId);

  if (screenIndex !== -1) {
    // Mark the screen as not archived
    newState.screens[screenIndex] = {
      ...newState.screens[screenIndex],
      archived: false,
      lastModified: Date.now(),
      entityVersion: (newState.screens[screenIndex].entityVersion || 1) + 1
    };

    // Log the change
    const change: EntityChange = {
      entityId: screenId,
      entityType: 'screen',
      changeType: 'unarchive',
      timestamp: Date.now()
    };

    newState.changeLog = [...(newState.changeLog || []), change];
  }

  saveData(newState);
  return newState;
};

export const renameScreen = (state: AppState, screenId: string, newName: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);

  if (screen && newName.trim()) {
    const oldName = screen.name;
    screen.name = newName.trim();
    screen.lastModified = Date.now();
    screen.entityVersion = (screen.entityVersion || 1) + 1;

    // Log the change
    const change: EntityChange = {
      entityId: screenId,
      entityType: 'screen',
      changeType: 'rename',
      timestamp: Date.now(),
      oldValue: oldName,
      newValue: newName.trim()
    };

    newState.changeLog = [...(newState.changeLog || []), change];
  }

  saveData(newState);
  return newState;
};

export const renameButton = (state: AppState, screenId: string, buttonId: string, newName: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);

  if (screen) {
    const button = screen.buttons.find(b => b.id === buttonId);
    if (button && newName.trim()) {
      const oldName = button.text;
      button.text = newName.trim();
      button.lastModified = Date.now();
      button.entityVersion = (button.entityVersion || 1) + 1;

      // Log the change
      const change: EntityChange = {
        entityId: buttonId,
        entityType: 'button',
        changeType: 'rename',
        timestamp: Date.now(),
        oldValue: oldName,
        newValue: newName.trim()
      };

      newState.changeLog = [...(newState.changeLog || []), change];
    }
  }

  saveData(newState);
  return newState;
};

export const removeButton = (state: AppState, screenId: string, buttonId: string): AppState => {
  return archiveButton(state, screenId, buttonId);
};

export const archiveButton = (state: AppState, screenId: string, buttonId: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);

  if (screen) {
    const buttonIndex = screen.buttons.findIndex(b => b.id === buttonId);
    if (buttonIndex !== -1) {
      // Mark the button as archived
      screen.buttons[buttonIndex] = {
        ...screen.buttons[buttonIndex],
        archived: true,
        lastModified: Date.now(),
        entityVersion: (screen.buttons[buttonIndex].entityVersion || 1) + 1
      };

      // Log the change
      const change: EntityChange = {
        entityId: buttonId,
        entityType: 'button',
        changeType: 'archive',
        timestamp: Date.now()
      };

      newState.changeLog = [...(newState.changeLog || []), change];
    }
  }

  saveData(newState);
  return newState;
};

export const unarchiveButton = (state: AppState, screenId: string, buttonId: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);

  if (screen) {
    const buttonIndex = screen.buttons.findIndex(b => b.id === buttonId);
    if (buttonIndex !== -1) {
      // Mark the button as not archived
      screen.buttons[buttonIndex] = {
        ...screen.buttons[buttonIndex],
        archived: false,
        lastModified: Date.now(),
        entityVersion: (screen.buttons[buttonIndex].entityVersion || 1) + 1
      };

      // Log the change
      const change: EntityChange = {
        entityId: buttonId,
        entityType: 'button',
        changeType: 'unarchive',
        timestamp: Date.now()
      };

      newState.changeLog = [...(newState.changeLog || []), change];
    }
  }

  saveData(newState);
  return newState;
};

export const hasArchivedItems = (state: AppState): boolean => {
  return state.screens.some(screen =>
    screen.archived || screen.buttons.some(button => button.archived)
  );
};

export const archiveTracker = (trackerId: string): void => {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${trackerId}`);
    if (data) {
      const trackerData = JSON.parse(data) as AppState;
      trackerData.archived = true;

      // Remove from active trackers
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${trackerId}`);

      // Add to archived trackers
      localStorage.setItem(`${ARCHIVE_KEY_PREFIX}${trackerId}`, JSON.stringify(trackerData));
    }
  } catch (error) {
    console.error('Failed to archive tracker', error);
  }
};

export const unarchiveTracker = (trackerId: string): void => {
  try {
    const data = localStorage.getItem(`${ARCHIVE_KEY_PREFIX}${trackerId}`);
    if (data) {
      const trackerData = JSON.parse(data) as AppState;
      trackerData.archived = false;

      // Remove from archived trackers
      localStorage.removeItem(`${ARCHIVE_KEY_PREFIX}${trackerId}`);

      // Add to active trackers
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${trackerId}`, JSON.stringify(trackerData));
    }
  } catch (error) {
    console.error('Failed to unarchive tracker', error);
  }
};

export const deleteTrackerPermanently = (trackerId: string): void => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${trackerId}`);
    localStorage.removeItem(`${ARCHIVE_KEY_PREFIX}${trackerId}`);
  } catch (error) {
    console.error('Failed to delete tracker permanently', error);
  }
};

export const deleteScreenPermanently = (state: AppState, screenId: string): AppState => {
  const newState = { ...state };

  // Log the deletion before removing the screen
  const change: EntityChange = {
    entityId: screenId,
    entityType: 'screen',
    changeType: 'delete',
    timestamp: Date.now()
  };

  newState.changeLog = [...(newState.changeLog || []), change];

  newState.screens = newState.screens.filter(s => s.id !== screenId);

  // Update current screen if the deleted screen was active
  if (newState.currentScreenId === screenId && newState.screens.length > 0) {
    newState.currentScreenId = newState.screens[0].id;
  }

  saveData(newState);
  return newState;
};

export const deleteButtonPermanently = (state: AppState, screenId: string, buttonId: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);

  if (screen) {
    // Log the deletion before removing the button
    const change: EntityChange = {
      entityId: buttonId,
      entityType: 'button',
      changeType: 'delete',
      timestamp: Date.now()
    };

    newState.changeLog = [...(newState.changeLog || []), change];

    screen.buttons = screen.buttons.filter(b => b.id !== buttonId);
  }

  saveData(newState);
  return newState;
};

/**
 * Checks if a tracker with the given ID already exists
 */
export const trackerExists = (trackerId: string): boolean => {
  return (
    localStorage.getItem(`${STORAGE_KEY_PREFIX}${trackerId}`) !== null ||
    localStorage.getItem(`${ARCHIVE_KEY_PREFIX}${trackerId}`) !== null
  );
};

/**
 * Imports a tracker state
 * If overwrite is true, it will replace any existing tracker with the same ID
 */
export const importTracker = (importedState: AppState, overwrite: boolean = false): boolean => {
  try {
    // Check if tracker already exists
    if (!overwrite && trackerExists(importedState.trackerId)) {
      return false;
    }

    // Save the imported tracker
    saveData(importedState);
    return true;
  } catch (error) {
    console.error('Failed to import tracker', error);
    return false;
  }
};

/**
 * Renames a tracker
 */
export const renameTracker = (trackerId: string, newName: string): AppState | null => {
  try {
    const data = loadData(trackerId);
    if (!data) return null;

    const updatedData = {
      ...data,
      trackerName: newName.trim()
    };

    saveData(updatedData);
    return updatedData;
  } catch (error) {
    console.error('Failed to rename tracker', error);
    return null;
  }
};

/**
 * Merges imported state with existing state
 */
export const mergeTrackerState = (importedState: AppState): AppState | null => {
  try {
    // Load the existing state
    const existingState = loadData(importedState.trackerId);

    if (!existingState) {
      // If no existing state, just save the imported state
      saveData(importedState);
      return importedState;
    }

    // Merge the states
    const mergedState = mergeTrackerStates(existingState, importedState);

    // Save the merged state
    saveData(mergedState);

    return mergedState;
  } catch (error) {
    console.error('Failed to merge tracker states', error);
    return null;
  }
};

/**
 * Reorders a button within the same screen
 */
export const reorderButton = (
  state: AppState,
  screenId: string,
  sourceIndex: number,
  destinationIndex: number
): AppState => {
  console.log('Reordering button in screen:', screenId, 'from index', sourceIndex, 'to', destinationIndex);

  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);

  if (!screen) {
    console.error('Screen not found:', screenId);
    return state;
  }

  console.log('Found screen:', screen.name, 'with', screen.buttons.length, 'buttons');

  // Get only visible (non-archived) buttons
  const visibleButtons = screen.buttons.filter(button => !button.archived);
  console.log('Visible buttons:', visibleButtons.length);

  if (sourceIndex < 0 || sourceIndex >= visibleButtons.length) {
    console.error('Source index out of bounds:', sourceIndex, 'for length', visibleButtons.length);
    return state;
  }

  // Remove the button from its current position
  const [movedButton] = visibleButtons.splice(sourceIndex, 1);
  console.log('Moving button:', movedButton.text);

  // Insert the button at the new position
  visibleButtons.splice(destinationIndex, 0, movedButton);

  // Update the buttons array, preserving archived buttons
  const archivedButtons = screen.buttons.filter(button => button.archived);
  screen.buttons = [...visibleButtons, ...archivedButtons];

  // Log the change
  const change: EntityChange = {
    entityId: movedButton.id,
    entityType: 'button',
    changeType: 'reorder',
    timestamp: Date.now()
  };

  newState.changeLog = [...(newState.changeLog || []), change];

  saveData(newState);
  return newState;
};

/**
 * Moves a button from one screen to another
 */
export const moveButtonToScreen = (
  state: AppState,
  sourceScreenId: string,
  destinationScreenId: string,
  sourceIndex: number,
  destinationIndex: number
): AppState => {
  console.log('Moving button from screen:', sourceScreenId, 'to screen:', destinationScreenId);

  const newState = { ...state };
  const sourceScreen = newState.screens.find(s => s.id === sourceScreenId);
  const destinationScreen = newState.screens.find(s => s.id === destinationScreenId);

  if (!sourceScreen) {
    console.error('Source screen not found:', sourceScreenId);
    return state;
  }

  if (!destinationScreen) {
    console.error('Destination screen not found:', destinationScreenId);
    return state;
  }

  // Get only visible (non-archived) buttons
  const sourceVisibleButtons = sourceScreen.buttons.filter(button => !button.archived);

  if (sourceIndex < 0 || sourceIndex >= sourceVisibleButtons.length) {
    console.error('Source index out of bounds:', sourceIndex, 'for length', sourceVisibleButtons.length);
    return state;
  }

  // Get the button to move
  const movedButton = sourceVisibleButtons[sourceIndex];

  // Increment the button's entity version
  const now = Date.now();
  const updatedButton = {
    ...movedButton,
    lastModified: now,
    entityVersion: (movedButton.entityVersion || 1) + 1
  };

  // Remove the button from the source screen
  sourceScreen.buttons = sourceScreen.buttons.filter(b => b.id !== movedButton.id);

  // Get visible buttons from destination screen
  const destinationVisibleButtons = destinationScreen.buttons.filter(button => !button.archived);

  // Insert the button at the destination position
  destinationVisibleButtons.splice(destinationIndex, 0, updatedButton);

  // Update the destination screen's buttons array, preserving archived buttons
  const destinationArchivedButtons = destinationScreen.buttons.filter(button => button.archived);
  destinationScreen.buttons = [...destinationVisibleButtons, ...destinationArchivedButtons];

  // Log the change
  const change: EntityChange = {
    entityId: movedButton.id,
    entityType: 'button',
    changeType: 'move',
    timestamp: now,
    oldValue: sourceScreenId,
    newValue: destinationScreenId
  };

  newState.changeLog = [...(newState.changeLog || []), change];

  // Update the state's last modified time
  newState.lastModified = now;

  saveData(newState);
  return newState;
};

/**
 * Reorders screens
 */
export const reorderScreens = (
  state: AppState,
  sourceIndex: number,
  destinationIndex: number
): AppState => {
  const newState = { ...state };

  // Get only visible (non-archived) screens
  const visibleScreens = newState.screens.filter(screen => !screen.archived);

  // Remove the screen from its current position
  const [movedScreen] = visibleScreens.splice(sourceIndex, 1);

  // Insert the screen at the new position
  visibleScreens.splice(destinationIndex, 0, movedScreen);

  // Update the screens array, preserving archived screens
  const archivedScreens = newState.screens.filter(screen => screen.archived);
  newState.screens = [...visibleScreens, ...archivedScreens];

  // Log the change
  const change: EntityChange = {
    entityId: movedScreen.id,
    entityType: 'screen',
    changeType: 'reorder',
    timestamp: Date.now()
  };

  newState.changeLog = [...(newState.changeLog || []), change];

  saveData(newState);
  return newState;
};

// ======= QUESTIONNAIRE FUNCTIONS =======

/**
 * Creates a new questionnaire configuration
 */
export const createQuestionnaire = (
  state: AppState,
  name: string,
  description?: string
): AppState => {
  const now = Date.now();
  const newQuestionnaire: QuestionnaireConfig = {
    id: `questionnaire-${now}-${Math.floor(Math.random() * 10000)}`,
    name: name.trim(),
    description: description?.trim(),
    frequency: {
      type: 'daily',
      time: '20:00' // Default to 8 PM
    },
    questions: [],
    isActive: false,
    archived: false,
    createdAt: now,
    lastModified: now,
    entityVersion: 1
  };

  const newState = {
    ...state,
    questionnaires: [...(state.questionnaires || []), newQuestionnaire]
  };

  // Log the change
  const change: EntityChange = {
    entityId: newQuestionnaire.id,
    entityType: 'questionnaire',
    changeType: 'create',
    timestamp: now
  };

  newState.changeLog = [...(newState.changeLog || []), change];

  saveData(newState);
  return newState;
};

/**
 * Updates questionnaire configuration
 */
export const updateQuestionnaire = (
  state: AppState,
  questionnaireId: string,
  updates: Partial<QuestionnaireConfig>
): AppState => {
  const newState = { ...state };
  const questionnaireIndex = newState.questionnaires?.findIndex(q => q.id === questionnaireId) ?? -1;

  if (questionnaireIndex !== -1 && newState.questionnaires) {
    const oldQuestionnaire = newState.questionnaires[questionnaireIndex];
    newState.questionnaires[questionnaireIndex] = {
      ...oldQuestionnaire,
      ...updates,
      lastModified: Date.now(),
      entityVersion: (oldQuestionnaire.entityVersion || 1) + 1
    };

    // Log the change
    const change: EntityChange = {
      entityId: questionnaireId,
      entityType: 'questionnaire',
      changeType: 'update',
      timestamp: Date.now()
    };

    newState.changeLog = [...(newState.changeLog || []), change];
  }

  saveData(newState);
  return newState;
};

/**
 * Archives a questionnaire
 */
export const archiveQuestionnaire = (state: AppState, questionnaireId: string): AppState => {
  const newState = { ...state };
  const questionnaire = newState.questionnaires?.find(q => q.id === questionnaireId);

  if (questionnaire) {
    questionnaire.archived = true;
    questionnaire.isActive = false; // Deactivate when archiving
    questionnaire.lastModified = Date.now();
    questionnaire.entityVersion = (questionnaire.entityVersion || 1) + 1;

    // Log the change
    const change: EntityChange = {
      entityId: questionnaireId,
      entityType: 'questionnaire',
      changeType: 'archive',
      timestamp: Date.now()
    };

    newState.changeLog = [...(newState.changeLog || []), change];
  }

  saveData(newState);
  return newState;
};

/**
 * Adds a question to a questionnaire
 */
export const addQuestion = (
  state: AppState,
  questionnaireId: string,
  text: string,
  scaleType: QuestionScaleType,
  subscribedButtonIds: string[] = []
): AppState => {
  const newState = { ...state };
  const questionnaire = newState.questionnaires?.find(q => q.id === questionnaireId);

  if (questionnaire) {
    const now = Date.now();
    const newQuestion: QuestionData = {
      id: `question-${now}-${Math.floor(Math.random() * 10000)}`,
      text: text.trim(),
      scaleType,
      order: questionnaire.questions.length,
      subscribedButtonIds: [...subscribedButtonIds],
      archived: false,
      createdAt: now,
      lastModified: now,
      entityVersion: 1
    };

    questionnaire.questions.push(newQuestion);
    questionnaire.lastModified = now;
    questionnaire.entityVersion = (questionnaire.entityVersion || 1) + 1;

    // Log the change
    const change: EntityChange = {
      entityId: newQuestion.id,
      entityType: 'question',
      changeType: 'create',
      timestamp: now
    };

    newState.changeLog = [...(newState.changeLog || []), change];
  }

  saveData(newState);
  return newState;
};

/**
 * Updates a question
 */
export const updateQuestion = (
  state: AppState,
  questionnaireId: string,
  questionId: string,
  updates: Partial<QuestionData>
): AppState => {
  const newState = { ...state };
  const questionnaire = newState.questionnaires?.find(q => q.id === questionnaireId);

  if (questionnaire) {
    const questionIndex = questionnaire.questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      const oldQuestion = questionnaire.questions[questionIndex];
      questionnaire.questions[questionIndex] = {
        ...oldQuestion,
        ...updates,
        lastModified: Date.now(),
        entityVersion: (oldQuestion.entityVersion || 1) + 1
      };

      questionnaire.lastModified = Date.now();
      questionnaire.entityVersion = (questionnaire.entityVersion || 1) + 1;

      // Log the change
      const change: EntityChange = {
        entityId: questionId,
        entityType: 'question',
        changeType: 'update',
        timestamp: Date.now()
      };

      newState.changeLog = [...(newState.changeLog || []), change];
    }
  }

  saveData(newState);
  return newState;
};

/**
 * Reorders questions within a questionnaire
 */
export const reorderQuestions = (
  state: AppState,
  questionnaireId: string,
  sourceIndex: number,
  destinationIndex: number
): AppState => {
  const newState = { ...state };
  const questionnaire = newState.questionnaires?.find(q => q.id === questionnaireId);

  if (questionnaire) {
    const visibleQuestions = questionnaire.questions.filter(q => !q.archived);
    const [movedQuestion] = visibleQuestions.splice(sourceIndex, 1);
    visibleQuestions.splice(destinationIndex, 0, movedQuestion);

    // Update order numbers
    visibleQuestions.forEach((question, index) => {
      question.order = index;
    });

    // Combine with archived questions
    const archivedQuestions = questionnaire.questions.filter(q => q.archived);
    questionnaire.questions = [...visibleQuestions, ...archivedQuestions];

    questionnaire.lastModified = Date.now();
    questionnaire.entityVersion = (questionnaire.entityVersion || 1) + 1;

    // Log the change
    const change: EntityChange = {
      entityId: movedQuestion.id,
      entityType: 'question',
      changeType: 'reorder',
      timestamp: Date.now()
    };

    newState.changeLog = [...(newState.changeLog || []), change];
  }

  saveData(newState);
  return newState;
};

/**
 * Archives a question
 */
export const archiveQuestion = (
  state: AppState,
  questionnaireId: string,
  questionId: string
): AppState => {
  const newState = { ...state };
  const questionnaire = newState.questionnaires?.find(q => q.id === questionnaireId);

  if (questionnaire) {
    const question = questionnaire.questions.find(q => q.id === questionId);
    if (question) {
      question.archived = true;
      question.lastModified = Date.now();
      question.entityVersion = (question.entityVersion || 1) + 1;

      questionnaire.lastModified = Date.now();
      questionnaire.entityVersion = (questionnaire.entityVersion || 1) + 1;

      // Log the change
      const change: EntityChange = {
        entityId: questionId,
        entityType: 'question',
        changeType: 'archive',
        timestamp: Date.now()
      };

      newState.changeLog = [...(newState.changeLog || []), change];
    }
  }

  saveData(newState);
  return newState;
};

/**
 * Submits a filled questionnaire
 */
export const submitQuestionnaire = (
  state: AppState,
  questionnaireId: string,
  responses: QuestionResponse[],
  notes?: string
): AppState => {
  const newState = { ...state };
  const questionnaire = newState.questionnaires?.find(q => q.id === questionnaireId);

  if (questionnaire) {
    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0];

    const filledQuestionnaire: FilledQuestionnaire = {
      id: `filled-${now}-${Math.floor(Math.random() * 10000)}`,
      questionnaireId,
      questionnaireName: questionnaire.name,
      responses,
      filledAt: now,
      date: today,
      notes: notes?.trim()
    };

    newState.filledQuestionnaires = [...(newState.filledQuestionnaires || []), filledQuestionnaire];

    // Clear any pending notifications for this questionnaire
    if (newState.notifications) {
      newState.notifications = newState.notifications.filter(
        n => n.questionnaireId !== questionnaireId || n.dismissed
      );
    }
  }

  saveData(newState);
  return newState;
};

/**
 * Creates notifications based on questionnaire frequency
 */
export const scheduleNotifications = (state: AppState, questionnaireId: string): AppState => {
  const newState = { ...state };
  const questionnaire = newState.questionnaires?.find(q => q.id === questionnaireId);

  if (questionnaire && questionnaire.isActive) {
    const now = Date.now();
    const today = new Date(now);

    // Clear existing notifications for this questionnaire
    newState.notifications = newState.notifications?.filter(n => n.questionnaireId !== questionnaireId) || [];

    let scheduledTime: Date;

    switch (questionnaire.frequency.type) {
      case 'daily':
        scheduledTime = new Date(today);
        if (questionnaire.frequency.time) {
          const [hours, minutes] = questionnaire.frequency.time.split(':').map(Number);
          scheduledTime.setHours(hours, minutes, 0, 0);
        } else {
          scheduledTime.setHours(20, 0, 0, 0); // Default to 8 PM
        }

        // If the time has passed today, schedule for tomorrow
        if (scheduledTime.getTime() <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        break;

      case 'weekly':
        scheduledTime = new Date(today);
        const targetDay = questionnaire.frequency.weekdays?.[0] || 0; // Default to Sunday
        const currentDay = scheduledTime.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;

        scheduledTime.setDate(scheduledTime.getDate() + (daysUntilTarget || 7));

        if (questionnaire.frequency.time) {
          const [hours, minutes] = questionnaire.frequency.time.split(':').map(Number);
          scheduledTime.setHours(hours, minutes, 0, 0);
        } else {
          scheduledTime.setHours(20, 0, 0, 0);
        }
        break;

      case 'custom':
        scheduledTime = new Date(now + (questionnaire.frequency.interval || 24) * 60 * 60 * 1000);
        break;

      default:
        return newState;
    }

    const notification: NotificationData = {
      id: `notification-${now}-${Math.floor(Math.random() * 10000)}`,
      questionnaireId,
      questionnaireName: questionnaire.name,
      scheduledFor: scheduledTime.getTime(),
      dismissed: false,
      createdAt: now
    };

    newState.notifications = [...(newState.notifications || []), notification];
  }

  saveData(newState);
  return newState;
};

/**
 * Dismisses a notification
 */
export const dismissNotification = (state: AppState, notificationId: string): AppState => {
  const newState = { ...state };
  const notification = newState.notifications?.find(n => n.id === notificationId);

  if (notification) {
    notification.dismissed = true;
  }

  saveData(newState);
  return newState;
};

/**
 * Gets pending notifications
 */
export const getPendingNotifications = (state: AppState): NotificationData[] => {
  const now = Date.now();
  return (state.notifications || []).filter(
    n => !n.dismissed && n.scheduledFor <= now
  );
};

/**
 * Gets tracker data for a specific time range (for journal integration)
 */
export const getTrackerDataForTimeRange = (
  state: AppState,
  buttonIds: string[],
  startTime: number,
  endTime: number
): { buttonId: string; buttonName: string; clicks: ClickRecord[] }[] => {
  const result: { buttonId: string; buttonName: string; clicks: ClickRecord[] }[] = [];

  for (const screen of state.screens) {
    for (const button of screen.buttons) {
      if (buttonIds.includes(button.id)) {
        const relevantClicks = button.clicks.filter(
          click => click.timestamp >= startTime && click.timestamp <= endTime
        );

        result.push({
          buttonId: button.id,
          buttonName: button.text,
          clicks: relevantClicks
        });
      }
    }
  }

  return result;
};