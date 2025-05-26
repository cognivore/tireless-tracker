import { useState, useEffect, useRef } from 'react';
import TrackerArchive from './TrackerArchive';
import * as storageService from '../services/storageService';
import { decompressState } from '../utils/compressionUtils';
import '../styles/HomePage.css';

interface HomePageProps {
  onTrackerCreate: (trackerId: string) => void;
  onTrackerSelect: (trackerId: string) => void;
}

export default function HomePage({ onTrackerCreate, onTrackerSelect }: HomePageProps) {
  const [trackers, setTrackers] = useState<{id: string; name: string; archived: boolean}[]>([]);
  const [newTrackerName, setNewTrackerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to show paste success toast
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [pasteMessage, setPasteMessage] = useState('');
  
  const showPasteSuccessToast = (trackerName: string) => {
    setPasteMessage(`"${trackerName}" imported successfully`);
    setPasteSuccess(true);
    setTimeout(() => {
      setPasteSuccess(false);
    }, 3000);
  };

  const loadTrackers = () => {
    // Get only active trackers
    const allTrackers = storageService.getTrackersList();
    const activeTrackers = allTrackers.filter(tracker => !tracker.archived);
    setTrackers(activeTrackers);
  };

  useEffect(() => {
    loadTrackers();
    
    // Add paste event listener
    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && !showImport && !isCreating && !showArchive) {
        try {
          // Try to decompress and validate the pasted data
          const importedState = decompressState(pastedText.trim());
          if (importedState) {
            e.preventDefault(); // Prevent default paste behavior
            
            // Check if the tracker already exists
            const exists = storageService.trackerExists(importedState.trackerId);
            
            if (exists) {
              // Show the import dialog with the pasted data
              setImportData(pastedText.trim());
              setShowImport(true);
            } else {
              // Import directly if no conflict
              const success = storageService.importTracker(importedState);
              if (success) {
                showSuccessToast();
                showPasteSuccessToast(importedState.trackerName);
                loadTrackers();
              } else {
                setImportError('Failed to import tracker');
                setShowImport(true);
              }
            }
          }
        } catch (error) {
          // Not valid tracker data, ignore
          console.log('Pasted content was not valid tracker data');
        }
      }
    };
    
    // Add the event listener to the container
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [showImport, isCreating, showArchive]);
  
  const showSuccessToast = () => {
    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
      setShowImport(false);
      setImportData('');
      setImportError(null);
    }, 1500);
  };

  const handleCreateTracker = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrackerName.trim()) {
      const newTracker = storageService.createTracker(newTrackerName.trim());
      setNewTrackerName('');
      setIsCreating(false);
      onTrackerCreate(newTracker.trackerId);
    }
  };

  const handleArchiveTracker = (trackerId: string) => {
    if (window.confirm('Are you sure you want to archive this tracker?')) {
      storageService.archiveTracker(trackerId);
      loadTrackers();
    }
  };

  const hasArchivedTrackers = () => {
    const allTrackers = storageService.getTrackersList();
    return allTrackers.some(tracker => tracker.archived);
  };

  const handleImportTracker = () => {
    try {
      if (!importData.trim()) {
        setImportError('Please paste the tracker data');
        return;
      }
      
      // Try to decompress the state
      const importedState = decompressState(importData.trim());
      
      if (!importedState) {
        setImportError('Failed to parse tracker data');
        return;
      }
      
      // Check if the tracker already exists
      const exists = storageService.trackerExists(importedState.trackerId);
      
      if (exists) {
        const confirmed = window.confirm('A tracker with this ID already exists. Do you want to merge the data?');
        if (confirmed) {
          // Merge the states
          const mergedState = storageService.mergeTrackerState(importedState);
          if (mergedState) {
            showSuccessToast();
            showPasteSuccessToast(`${importedState.trackerName} (merged)`);
            loadTrackers();
          } else {
            setImportError('Failed to merge tracker data');
          }
        }
      } else {
        // Import as new
        const success = storageService.importTracker(importedState);
        if (success) {
          showSuccessToast();
          showPasteSuccessToast(importedState.trackerName);
          loadTrackers();
        } else {
          setImportError('Failed to import tracker');
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Invalid tracker data. Please check the format and try again.');
    }
  };

  return (
    <div className="home-page" ref={containerRef}>
      <header className="home-header">
        <h1 className="home-title">Tracker</h1>
        <p className="home-subtitle">Create and manage your activity trackers</p>
      </header>

      <div className="trackers-container">
        <div className="trackers-header">
          <h2 className="trackers-title">Your Trackers</h2>
          {hasArchivedTrackers() && (
            <button 
              className="view-archive-button" 
              onClick={() => setShowArchive(true)}
            >
              View Archive
            </button>
          )}
        </div>
        
        {trackers.length > 0 ? (
          <div className="trackers-list">
            {trackers.map(tracker => (
              <div key={tracker.id} className="tracker-item-container">
                <button
                  className="tracker-item"
                  onClick={() => onTrackerSelect(tracker.id)}
                >
                  <span className="tracker-name">{tracker.name}</span>
                  <span className="tracker-arrow">→</span>
                </button>
                <button 
                  className="archive-tracker-button" 
                  onClick={() => handleArchiveTracker(tracker.id)}
                  aria-label={`Archive ${tracker.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8v13H3V8"></path>
                    <path d="M1 3h22v5H1z"></path>
                    <path d="M10 12h4"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-trackers">
            <p>You don't have any trackers yet.</p>
          </div>
        )}

        {isCreating ? (
          <form className="create-tracker-form" onSubmit={handleCreateTracker}>
            <input
              type="text"
              value={newTrackerName}
              onChange={(e) => setNewTrackerName(e.target.value)}
              placeholder="Tracker name"
              autoFocus
              className="create-tracker-input"
            />
            <div className="create-tracker-controls">
              <button type="submit" className="create-tracker-submit">Create</button>
              <button 
                type="button" 
                className="create-tracker-cancel"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="home-buttons">
            <button 
              className="create-tracker-button" 
              onClick={() => setIsCreating(true)}
            >
              + Create New Tracker
            </button>
            <button
              className="import-tracker-button"
              onClick={() => setShowImport(true)}
            >
              → Import Tracker
            </button>
          </div>
        )}
      </div>

      {showArchive && (
        <TrackerArchive 
          onClose={() => {
            setShowArchive(false);
            loadTrackers(); // Refresh the main list after closing archive
          }}
          onTrackerSelect={onTrackerSelect} 
        />
      )}
      
      {/* Import Tracker Dialog */}
      {showImport && (
        <>
          <div className="screen-selector-overlay" onClick={() => setShowImport(false)}></div>
          <div className="import-dialog">
            <div className="import-dialog-header">
              <h2>Import Tracker</h2>
            </div>
            <div className="import-dialog-content">
              <p className="import-dialog-description">
                Paste the tracker data below to import it:
              </p>
              {importError && (
                <div className="import-error">{importError}</div>
              )}
              <textarea
                className="import-data-input"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste tracker data here..."
                rows={8}
              />
            </div>
            <div className="import-dialog-actions">
              <button 
                className={`import-dialog-submit ${importSuccess ? 'success' : ''}`}
                onClick={handleImportTracker}
                disabled={importSuccess}
              >
                {importSuccess ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  'Import'
                )}
              </button>
              <button 
                className="screen-selector-cancel"
                onClick={() => {
                  setShowImport(false);
                  setImportData('');
                  setImportError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Paste success toast notification */}
      <div className={`paste-toast-notification ${pasteSuccess ? 'visible' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{pasteMessage}</span>
      </div>
    </div>
  );
} 