import type { AppState, ButtonData, ClickRecord, EntityChange, Screen } from '../types';

/**
 * Merges clicks from two arrays, avoiding duplicates based on timestamp
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
 */
function processChangeLogs(
  screens: Screen[],
  changeLogs: EntityChange[]
): Screen[] {
  // Sort change logs by timestamp to apply in chronological order
  const sortedChanges = [...changeLogs].sort((a, b) => a.timestamp - b.timestamp);
  
  // Create maps for quick lookup
  const screenMap = new Map<string, Screen>();
  const buttonMap = new Map<string, { screen: Screen; button: ButtonData }>();
  
  // Initialize maps
  screens.forEach(screen => {
    screenMap.set(screen.id, { ...screen });
    screen.buttons.forEach(button => {
      buttonMap.set(button.id, { 
        screen: screenMap.get(screen.id)!, 
        button: { ...button } 
      });
    });
  });
  
  // Apply each change
  sortedChanges.forEach(change => {
    if (change.entityType === 'screen') {
      const screen = screenMap.get(change.entityId);
      if (screen) {
        switch (change.changeType) {
          case 'rename':
            // Only apply if this is a newer change than what we have
            if (change.timestamp > (screen.lastModified || 0)) {
              screen.name = change.newValue || screen.name;
              screen.lastModified = change.timestamp;
            }
            break;
          case 'archive':
            // Only archive if this is a newer change than what we have
            if (change.timestamp > (screen.lastModified || 0)) {
              screen.archived = true;
              screen.lastModified = change.timestamp;
            }
            break;
          case 'unarchive':
            // Only unarchive if this is a newer change than what we have
            if (change.timestamp > (screen.lastModified || 0)) {
              screen.archived = false;
              screen.lastModified = change.timestamp;
            }
            break;
          case 'delete':
            // Mark for deletion
            screenMap.delete(change.entityId);
            break;
          case 'reorder':
            // Reordering is handled separately during the merge process
            // We don't need to do anything here
            break;
        }
      }
    } else if (change.entityType === 'button') {
      const buttonData = buttonMap.get(change.entityId);
      if (buttonData) {
        const { screen, button } = buttonData;
        
        switch (change.changeType) {
          case 'rename':
            // Only apply if this is a newer change than what we have
            if (change.timestamp > (button.lastModified || 0)) {
              button.text = change.newValue || button.text;
              button.lastModified = change.timestamp;
            }
            break;
          case 'archive':
            // Only archive if this is a newer change than what we have
            if (change.timestamp > (button.lastModified || 0)) {
              button.archived = true;
              button.lastModified = change.timestamp;
            }
            break;
          case 'unarchive':
            // Only unarchive if this is a newer change than what we have
            if (change.timestamp > (button.lastModified || 0)) {
              button.archived = false;
              button.lastModified = change.timestamp;
            }
            break;
          case 'delete':
            // Mark for deletion from parent screen
            buttonMap.delete(change.entityId);
            const updatedButtons = screen.buttons.filter(b => b.id !== change.entityId);
            screen.buttons = updatedButtons;
            break;
          case 'move':
            // For moves, we need the destination screen ID
            if (change.newValue && change.timestamp > (button.lastModified || 0)) {
              // Get destination screen
              const destinationScreen = screenMap.get(change.newValue);
              if (destinationScreen) {
                // Remove button from current screen
                screen.buttons = screen.buttons.filter(b => b.id !== button.id);
                
                // Add button to destination screen
                destinationScreen.buttons.push({
                  ...button,
                  lastModified: change.timestamp
                });
                
                // Update button map with new screen reference
                buttonMap.set(button.id, {
                  screen: destinationScreen,
                  button
                });
              }
            }
            break;
          case 'reorder':
            // Reordering is handled separately during the merge process
            // We don't need to do anything here
            break;
        }
      }
    }
  });
  
  // Rebuild screens from the maps, filtering out deleted items
  const processedScreens: Screen[] = [];
  
  // Add all screens that weren't deleted
  screenMap.forEach(screen => {
    // Filter out deleted buttons
    const validButtons = screen.buttons.filter(button => buttonMap.has(button.id));
    // Update the buttons with any changes
    const updatedButtons = validButtons.map(button => {
      const buttonData = buttonMap.get(button.id);
      return buttonData ? buttonData.button : button;
    });
    
    // Add the screen with updated buttons
    processedScreens.push({
      ...screen,
      buttons: updatedButtons
    });
  });
  
  return processedScreens;
}

/**
 * Merges buttons from two arrays, combining their clicks and updating counts
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
      
      // Merge clicks
      const mergedClicks = mergeClicks(existingButton.clicks, button.clicks);
      
      // Recalculate count based on clicks
      const incrementCount = mergedClicks.filter(click => !click.isDecrement).length;
      const decrementCount = mergedClicks.filter(click => click.isDecrement).length;
      const count = incrementCount - decrementCount;
      
      // Use the button with the newer version
      const baseButton = 
        (button.entityVersion || 0) > (existingButton.entityVersion || 0)
          ? button
          : existingButton;
      
      // Update button
      buttonMap.set(button.id, {
        ...baseButton,
        count: count >= 0 ? count : 0, // Count shouldn't be negative
        clicks: mergedClicks,
        // Keep the highest entity version
        entityVersion: Math.max(
          (existingButton.entityVersion || 1),
          (button.entityVersion || 1)
        ),
        // Keep the latest modification time
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
  // Merge change logs first
  const mergedChangeLogs = mergeChangeLogs(
    state1.changeLog || [],
    state2.changeLog || []
  );
  
  // Merge screens
  let mergedScreens = mergeScreens(state1.screens, state2.screens);
  
  // Process all screens through the change logs to ensure consistency
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
    changeLog: mergedChangeLogs
  };
} 