import type { AppState, ButtonData, EntityChange, Screen } from '../types';
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
  
  console.log('Source screen:', sourceScreen.name, 'with', sourceScreen.buttons.length, 'buttons');
  console.log('Destination screen:', destinationScreen.name, 'with', destinationScreen.buttons.length, 'buttons');
  
  // Get only visible (non-archived) buttons
  const sourceVisibleButtons = sourceScreen.buttons.filter(button => !button.archived);
  console.log('Source visible buttons:', sourceVisibleButtons.length);
  
  if (sourceIndex < 0 || sourceIndex >= sourceVisibleButtons.length) {
    console.error('Source index out of bounds:', sourceIndex, 'for length', sourceVisibleButtons.length);
    return state;
  }
  
  // Remove the button from the source screen
  const [movedButton] = sourceVisibleButtons.splice(sourceIndex, 1);
  console.log('Moving button:', movedButton.text);
  
  // Update the source screen's buttons array, preserving archived buttons
  const sourceArchivedButtons = sourceScreen.buttons.filter(button => button.archived);
  sourceScreen.buttons = [...sourceVisibleButtons, ...sourceArchivedButtons];
  
  // Get visible buttons from destination screen
  const destinationVisibleButtons = destinationScreen.buttons.filter(button => !button.archived);
  
  // Insert the button at the destination position
  destinationVisibleButtons.splice(destinationIndex, 0, {
    ...movedButton,
    lastModified: Date.now(),
    entityVersion: (movedButton.entityVersion || 1) + 1
  });
  
  // Update the destination screen's buttons array, preserving archived buttons
  const destinationArchivedButtons = destinationScreen.buttons.filter(button => button.archived);
  destinationScreen.buttons = [...destinationVisibleButtons, ...destinationArchivedButtons];
  
  // Log the change
  const change: EntityChange = {
    entityId: movedButton.id,
    entityType: 'button',
    changeType: 'move',
    timestamp: Date.now(),
    oldValue: sourceScreenId,
    newValue: destinationScreenId
  };
  
  newState.changeLog = [...(newState.changeLog || []), change];
  
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