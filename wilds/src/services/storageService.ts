import type { AppState, ButtonData, ClickRecord, Screen } from '../types';

const STORAGE_KEY_PREFIX = 'wilds_tracker_';
const ARCHIVE_KEY_PREFIX = 'wilds_archive_';

const getDefaultState = (trackerName: string): AppState => {
  const defaultScreen: Screen = {
    id: 'screen-1',
    name: 'Main Screen',
    buttons: [
      {
        id: 'button-1',
        text: 'Water',
        count: 0,
        clicks: []
      },
      {
        id: 'button-2',
        text: 'Exercise',
        count: 0,
        clicks: []
      }
    ]
  };

  return {
    trackerId: crypto.randomUUID(),
    trackerName,
    screens: [defaultScreen],
    currentScreenId: defaultScreen.id,
    archived: false
  };
};

export const loadData = (trackerId: string): AppState | null => {
  try {
    // First try to load from active trackers
    let data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${trackerId}`);
    
    // If not found, try to load from archived trackers
    if (!data) {
      data = localStorage.getItem(`${ARCHIVE_KEY_PREFIX}${trackerId}`);
    }
    
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Failed to load data from localStorage', error);
    return null;
  }
};

export const saveData = (data: AppState): void => {
  try {
    const prefix = data.archived ? ARCHIVE_KEY_PREFIX : STORAGE_KEY_PREFIX;
    localStorage.setItem(`${prefix}${data.trackerId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to localStorage', error);
  }
};

export const createTracker = (trackerName: string): AppState => {
  const newState = getDefaultState(trackerName);
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
      if (button.clicks.length > 0) {
        button.clicks.pop();
      }
    }
  }
  
  saveData(newState);
  return newState;
};

export const addButton = (state: AppState, screenId: string, buttonText: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);
  
  if (screen) {
    const newButton: ButtonData = {
      id: `button-${Date.now()}`,
      text: buttonText,
      count: 0,
      clicks: []
    };
    
    screen.buttons.push(newButton);
  }
  
  saveData(newState);
  return newState;
};

export const addScreen = (state: AppState, screenName: string): AppState => {
  const newScreen: Screen = {
    id: `screen-${Date.now()}`,
    name: screenName,
    buttons: []
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
      archived: true
    };
    
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
      archived: false
    };
  }
  
  saveData(newState);
  return newState;
};

export const renameScreen = (state: AppState, screenId: string, newName: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);
  
  if (screen && newName.trim()) {
    screen.name = newName.trim();
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
      button.text = newName.trim();
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
        archived: true
      };
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
        archived: false
      };
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
    screen.buttons = screen.buttons.filter(b => b.id !== buttonId);
  }
  
  saveData(newState);
  return newState;
}; 