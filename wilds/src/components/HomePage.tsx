import { useState, useEffect } from 'react';
import TrackerArchive from './TrackerArchive';
import * as storageService from '../services/storageService';
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

  const loadTrackers = () => {
    // Get only active trackers
    const allTrackers = storageService.getTrackersList();
    const activeTrackers = allTrackers.filter(tracker => !tracker.archived);
    setTrackers(activeTrackers);
  };

  useEffect(() => {
    loadTrackers();
  }, []);

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

  return (
    <div className="home-page">
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
          <button 
            className="create-tracker-button" 
            onClick={() => setIsCreating(true)}
          >
            + Create New Tracker
          </button>
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
    </div>
  );
} 