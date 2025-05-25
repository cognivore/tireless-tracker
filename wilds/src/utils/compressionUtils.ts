import type { AppState } from '../types';

/**
 * Compresses app state to a URL-safe string
 */
export function compressState(state: AppState): string {
  try {
    // Convert state to JSON string
    const jsonString = JSON.stringify(state);
    
    // Use built-in compression
    const compressed = btoa(encodeURIComponent(jsonString));
    
    return compressed;
  } catch (error) {
    console.error('Error compressing state:', error);
    return '';
  }
}

/**
 * Decompresses a URL-safe string back to app state
 */
export function decompressState(compressed: string): AppState | null {
  try {
    // Decompress
    const jsonString = decodeURIComponent(atob(compressed));
    
    // Parse JSON
    const state = JSON.parse(jsonString) as AppState;
    
    return state;
  } catch (error) {
    console.error('Error decompressing state:', error);
    return null;
  }
} 