import type { AppState, ButtonData, ClickRecord, Screen } from '../types';

const STORAGE_KEY_PREFIX = 'wilds_tracker_';

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
    currentScreenId: defaultScreen.id
  };
};

export const loadData = (trackerId: string): AppState | null => {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${trackerId}`);
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
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${data.trackerId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to localStorage', error);
  }
};

export const createTracker = (trackerName: string): AppState => {
  const newState = getDefaultState(trackerName);
  saveData(newState);
  return newState;
};

export const getTrackersList = (): { id: string, name: string }[] => {
  const trackers: { id: string, name: string }[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const trackerId = key.substring(STORAGE_KEY_PREFIX.length);
        const data = localStorage.getItem(key);
        if (data) {
          const trackerData = JSON.parse(data) as AppState;
          trackers.push({
            id: trackerId,
            name: trackerData.trackerName
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

export const removeButton = (state: AppState, screenId: string, buttonId: string): AppState => {
  const newState = { ...state };
  const screen = newState.screens.find(s => s.id === screenId);
  
  if (screen) {
    screen.buttons = screen.buttons.filter(b => b.id !== buttonId);
  }
  
  saveData(newState);
  return newState;
};

export const removeScreen = (state: AppState, screenId: string): AppState => {
  // Don't remove if it's the last screen
  if (state.screens.length <= 1) {
    return state;
  }
  
  const newState = {
    ...state,
    screens: state.screens.filter(s => s.id !== screenId)
  };
  
  // Update current screen if the removed screen was active
  if (newState.currentScreenId === screenId) {
    newState.currentScreenId = newState.screens[0].id;
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