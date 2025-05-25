import { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import TrackerApp from './components/TrackerApp';
import ConfirmationDialog from './components/ConfirmationDialog';
import * as storageService from './services/storageService';
import { decompressState } from './utils/compressionUtils';
import './App.css';

function App() {
  const [currentTrackerId, setCurrentTrackerId] = useState<string | null>(null);
  const [importState, setImportState] = useState<{
    state: any;
    needsConfirmation: boolean;
  } | null>(null);

  // Check for tracker ID in URL on initial load
  useEffect(() => {
    // Handle GitHub Pages path (might include base path)
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const trackerId = params.get('id');
    const importData = params.get('import');

    // Handle import if present
    if (importData) {
      try {
        // Try to decompress the state
        const decompressedState = decompressState(importData);
        
        if (decompressedState) {
          // Check if a tracker with this ID already exists
          if (storageService.trackerExists(decompressedState.trackerId)) {
            // Ask for confirmation before overwriting
            setImportState({
              state: decompressedState,
              needsConfirmation: true
            });
          } else {
            // Import directly since it doesn't exist
            importTracker(decompressedState, false);
          }
          
          // Remove the import parameter from URL
          url.searchParams.delete('import');
          window.history.replaceState({}, '', url);
        }
      } catch (error) {
        console.error('Failed to import tracker:', error);
      }
    } 
    // If no import but ID is present, load that tracker
    else if (trackerId) {
      // Check if the tracker exists and load it
      const data = storageService.loadData(trackerId);
      if (data) {
        setCurrentTrackerId(trackerId);
      }
    }
  }, []);

  // Update URL when tracker changes
  useEffect(() => {
    if (currentTrackerId) {
      const url = new URL(window.location.href);
      url.searchParams.set('id', currentTrackerId);
      window.history.pushState({}, '', url);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      window.history.pushState({}, '', url);
    }
  }, [currentTrackerId]);
  
  const importTracker = (state: any, overwrite: boolean) => {
    if (state) {
      // Import the tracker
      const success = storageService.importTracker(state, overwrite);
      
      if (success) {
        // Switch to the imported tracker
        setCurrentTrackerId(state.trackerId);
      }
    }
    
    // Clear the import state
    setImportState(null);
  };

  const handleConfirmImport = () => {
    if (importState) {
      importTracker(importState.state, true);
    }
  };

  const handleCancelImport = () => {
    setImportState(null);
  };

  const handleTrackerCreate = (trackerId: string) => {
    setCurrentTrackerId(trackerId);
  };

  const handleTrackerSelect = (trackerId: string) => {
    setCurrentTrackerId(trackerId);
  };

  const handleBackToHome = () => {
    setCurrentTrackerId(null);
  };

  return (
    <>
      {importState?.needsConfirmation && (
        <ConfirmationDialog
          title="Import Tracker"
          message="A tracker with this ID already exists. Do you want to replace it with the imported data?"
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
        />
      )}
      
      {currentTrackerId ? (
        <TrackerApp trackerId={currentTrackerId} onBack={handleBackToHome} />
      ) : (
        <HomePage 
          onTrackerCreate={handleTrackerCreate} 
          onTrackerSelect={handleTrackerSelect} 
        />
      )}
    </>
  );
}

export default App;
