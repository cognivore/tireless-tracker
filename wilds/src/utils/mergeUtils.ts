import type { AppState, ButtonData, ClickRecord, EntityChange, Screen } from '../types';

/**
 * Merges clicks from two arrays, avoiding duplicates based on timestamp
 * This implements a PN-Counter CRDT operation
 */
function mergeClicks(clicks1: ClickRecord[], clicks2: ClickRecord[]): ClickRecord[] {
  // Combine all clicks
  const allClicks = [...clicks1, ...clicks2];
  
  // Create a map using timestamps as keys to identify duplicates
  const uniqueClicks = new Map<number, ClickRecord>();
  
  allClicks.forEach(click => {
    uniqueClicks.set(click.timestamp, click);
  });
  
  // Convert back to array and sort by timestamp (newest first)
  return Array.from(uniqueClicks.values())
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Processes change logs to ensure consistent entity state
 * Uses Last-Writer-Wins (LWW) semantics for metadata operations
 */
function processChangeLogs(
  screens: Screen[],
  changeLogs: EntityChange[]
): Screen[] {
  // Sort changes chronologically
  const sortedChanges = [...changeLogs].sort((a, b) => a.timestamp - b.timestamp);
  
  // Initialize clean screen structure
  const screenMap = new Map<string, Screen>();
  screens.forEach(screen => {
    screenMap.set(screen.id, { ...screen, buttons: [] });
  });

  // Step 1: Extract all unique buttons, preserving their clicks
  const allButtons = new Map<string, ButtonData>();
  screens.forEach(screen => {
    screen.buttons.forEach(button => {
      if (!allButtons.has(button.id)) {
        allButtons.set(button.id, { ...button });
      } else {
        // If button already exists, merge clicks
        const existingButton = allButtons.get(button.id)!;
        const mergedClicks = mergeClicks(existingButton.clicks, button.clicks);
        
        // Update clicks and recalculate count
        existingButton.clicks = mergedClicks;
        const incrementCount = mergedClicks.filter(click => !click.isDecrement).length;
        const decrementCount = mergedClicks.filter(click => click.isDecrement).length;
        existingButton.count = Math.max(0, incrementCount - decrementCount);
      }
    });
  });

  // Step 2: Apply metadata changes (LWW-CRDT) in chronological order
  sortedChanges.forEach(change => {
    if (change.entityType === 'screen') {
      const screen = screenMap.get(change.entityId);
      if (screen) {
        switch (change.changeType) {
          case 'rename':
            screen.name = change.newValue || screen.name;
            screen.lastModified = change.timestamp;
            break;
          case 'archive':
            screen.archived = true;
            screen.lastModified = change.timestamp;
            break;
          case 'unarchive':
            screen.archived = false;
            screen.lastModified = change.timestamp;
            break;
          case 'delete':
            screenMap.delete(change.entityId);
            break;
        }
      }
    } else if (change.entityType === 'button') {
      const button = allButtons.get(change.entityId);
      if (button) {
        switch (change.changeType) {
          case 'rename':
            button.text = change.newValue || button.text;
            button.lastModified = change.timestamp;
            break;
          case 'archive':
            button.archived = true;
            button.lastModified = change.timestamp;
            break;
          case 'unarchive':
            button.archived = false;
            button.lastModified = change.timestamp;
            break;
          case 'delete':
            allButtons.delete(change.entityId);
            break;
        }
      }
    }
  });

  // Step 3: Determine final button placement (LWW-CRDT)
  // Track button location with a map: button ID -> screen ID
  const buttonLocationMap = new Map<string, string>();
  
  // Initialize from original state
  screens.forEach(screen => {
    screen.buttons.forEach(button => {
      buttonLocationMap.set(button.id, screen.id);
    });
  });
  
  // Apply move operations in chronological order (LWW)
  sortedChanges.forEach(change => {
    if (change.entityType === 'button' && 
        change.changeType === 'move' && 
        change.newValue && 
        allButtons.has(change.entityId) &&
        screenMap.has(change.newValue)) {
      // Update button location to the destination screen
      buttonLocationMap.set(change.entityId, change.newValue);
    }
  });
  
  // Step 4: Place buttons in their final locations
  buttonLocationMap.forEach((screenId, buttonId) => {
    const button = allButtons.get(buttonId);
    const screen = screenMap.get(screenId);
    if (button && screen) {
      screen.buttons.push(button);
    }
  });
  
  return Array.from(screenMap.values());
}

/**
 * Merges buttons from two arrays, combining their clicks
 * Implements a PN-Counter CRDT for clicks, LWW-CRDT for metadata
 */
function mergeButtons(buttons1: ButtonData[], buttons2: ButtonData[]): ButtonData[] {
  const buttonMap = new Map<string, ButtonData>();
  
  // Process first array of buttons
  buttons1.forEach(button => {
    buttonMap.set(button.id, { ...button });
  });
  
  // Process second array of buttons, merging with existing ones or adding new ones
  buttons2.forEach(button => {
    if (buttonMap.has(button.id)) {
      // Button exists in both states, merge
      const existingButton = buttonMap.get(button.id)!;
      
      // Step 1: Merge clicks (PN-Counter CRDT)
      const mergedClicks = mergeClicks(existingButton.clicks, button.clicks);
      
      // Recalculate count from merged clicks
      const incrementCount = mergedClicks.filter(click => !click.isDecrement).length;
      const decrementCount = mergedClicks.filter(click => click.isDecrement).length;
      const count = Math.max(0, incrementCount - decrementCount);
      
      // Step 2: For metadata, use LWW semantics
      const newerButton = 
        (button.lastModified || 0) > (existingButton.lastModified || 0)
          ? button
          : existingButton;
      
      buttonMap.set(button.id, {
        // LWW for metadata
        ...newerButton,
        // PN-Counter for clicks
        clicks: mergedClicks,
        count: count,
        // Track highest entity version
        entityVersion: Math.max(
          (existingButton.entityVersion || 1),
          (button.entityVersion || 1)
        ),
        lastModified: Math.max(
          (existingButton.lastModified || 0),
          (button.lastModified || 0)
        )
      });
    } else {
      // New button, add it
      buttonMap.set(button.id, { ...button });
    }
  });
  
  return Array.from(buttonMap.values());
}

/**
 * Merges screens from two arrays, combining their buttons
 */
function mergeScreens(screens1: Screen[], screens2: Screen[]): Screen[] {
  const screenMap = new Map<string, Screen>();
  
  // Process first array of screens
  screens1.forEach(screen => {
    screenMap.set(screen.id, { ...screen });
  });
  
  // Process second array of screens, merging with existing ones or adding new ones
  screens2.forEach(screen => {
    if (screenMap.has(screen.id)) {
      // Screen exists in both states, merge
      const existingScreen = screenMap.get(screen.id)!;
      
      // Merge buttons
      const mergedButtons = mergeButtons(existingScreen.buttons, screen.buttons);
      
      // Use the screen with the newer version
      const baseScreen = 
        (screen.entityVersion || 0) > (existingScreen.entityVersion || 0)
          ? screen
          : existingScreen;
      
      // Update screen
      screenMap.set(screen.id, {
        ...baseScreen,
        buttons: mergedButtons,
        // Keep the highest entity version
        entityVersion: Math.max(
          (existingScreen.entityVersion || 1),
          (screen.entityVersion || 1)
        ),
        // Keep the latest modification time
        lastModified: Math.max(
          (existingScreen.lastModified || 0),
          (screen.lastModified || 0)
        )
      });
    } else {
      // New screen, add it
      screenMap.set(screen.id, { ...screen });
    }
  });
  
  return Array.from(screenMap.values());
}

/**
 * Merges change logs from two trackers
 */
function mergeChangeLogs(logs1: EntityChange[] = [], logs2: EntityChange[] = []): EntityChange[] {
  // Combine all changes
  const allChanges = [...logs1, ...logs2];
  
  // Create a map for unique changes based on entity ID + timestamp
  const uniqueChanges = new Map<string, EntityChange>();
  
  allChanges.forEach(change => {
    const key = `${change.entityId}-${change.timestamp}-${change.changeType}`;
    uniqueChanges.set(key, change);
  });
  
  // Convert back to array and sort by timestamp
  return Array.from(uniqueChanges.values())
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Merges two tracker states
 */
export function mergeTrackerStates(state1: AppState, state2: AppState): AppState {
  // Merge change logs first to get a complete history of operations
  const mergedChangeLogs = mergeChangeLogs(
    state1.changeLog || [],
    state2.changeLog || []
  );
  
  // First merge the screens and their buttons, combining all data
  let mergedScreens = mergeScreens(state1.screens, state2.screens);
  
  // Then process the merged screens through all change logs to ensure consistent state
  // This applies all operations in chronological order
  mergedScreens = processChangeLogs(mergedScreens, mergedChangeLogs);
  
  // Determine the current screen ID
  let currentScreenId = state1.currentScreenId;
  
  // If the current screen is archived or deleted in the merged state, find another active screen
  const currentScreenExists = mergedScreens.some(s => 
    s.id === currentScreenId && !s.archived
  );
  
  if (!currentScreenExists) {
    const firstActiveScreen = mergedScreens.find(s => !s.archived);
    if (firstActiveScreen) {
      currentScreenId = firstActiveScreen.id;
    }
  }
  
  // Keep the most recent tracker name
  const trackerName = 
    (state2.lastModified || 0) > (state1.lastModified || 0)
      ? state2.trackerName
      : state1.trackerName;
  
  // Create the merged state
  return {
    trackerId: state1.trackerId, // Keep the same ID
    trackerName,
    screens: mergedScreens,
    currentScreenId,
    archived: state1.archived || state2.archived, // If archived in either, keep archived
    schemaVersion: Math.max(
      (state1.schemaVersion || 0),
      (state2.schemaVersion || 0)
    ),
    lastModified: Math.max(
      (state1.lastModified || 0),
      (state2.lastModified || 0)
    ),
    changeLog: mergedChangeLogs
  };
} 