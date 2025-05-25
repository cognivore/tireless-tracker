import { useState, useEffect } from 'react';
import * as storageService from '../services/storageService';
import '../styles/HomePage.css';

interface HomePageProps {
  onTrackerCreate: (trackerId: string) => void;
  onTrackerSelect: (trackerId: string) => void;
}

export default function HomePage({ onTrackerCreate, onTrackerSelect }: HomePageProps) {
  const [trackers, setTrackers] = useState<{id: string; name: string}[]>([]);
  const [newTrackerName, setNewTrackerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const trackersList = storageService.getTrackersList();
    setTrackers(trackersList);
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

  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="home-title">Tracker</h1>
        <p className="home-subtitle">Create and manage your activity trackers</p>
      </header>

      <div className="trackers-container">
        <h2 className="trackers-title">Your Trackers</h2>
        
        {trackers.length > 0 ? (
          <div className="trackers-list">
            {trackers.map(tracker => (
              <button
                key={tracker.id}
                className="tracker-item"
                onClick={() => onTrackerSelect(tracker.id)}
              >
                <span className="tracker-name">{tracker.name}</span>
                <span className="tracker-arrow">→</span>
              </button>
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
    </div>
  );
} 