import type { AppState, ButtonData, Screen } from '../types';

const CURRENT_SCHEMA_VERSION = 1;

/**
 * Ensures all screens have proper IDs and metadata
 */
function migrateScreens(screens: Screen[]): Screen[] {
  return screens.map(screen => {
    const now = Date.now();
    
    return {
      ...screen,
      id: screen.id || `screen-${now}-${Math.floor(Math.random() * 10000)}`,
      createdAt: screen.createdAt || now,
      lastModified: screen.lastModified || now,
      entityVersion: screen.entityVersion || 1,
      buttons: migrateButtons(screen.buttons)
    };
  });
}

/**
 * Ensures all buttons have proper IDs and metadata
 */
function migrateButtons(buttons: ButtonData[]): ButtonData[] {
  return buttons.map(button => {
    const now = Date.now();
    
    return {
      ...button,
      id: button.id || `button-${now}-${Math.floor(Math.random() * 10000)}`,
      createdAt: button.createdAt || now,
      lastModified: button.lastModified || now,
      entityVersion: button.entityVersion || 1
    };
  });
}

/**
 * Migrates an AppState to the current schema version
 */
export function migrateAppState(state: AppState): AppState {
  // If already at the current version, return as is
  if (state.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return state;
  }
  
  // Create a new state with the updated schema
  const migratedState: AppState = {
    ...state,
    screens: migrateScreens(state.screens),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    changeLog: state.changeLog || []
  };
  
  return migratedState;
}

/**
 * Checks if an app state needs migration
 */
export function needsMigration(state: AppState): boolean {
  return state.schemaVersion !== CURRENT_SCHEMA_VERSION;
} 