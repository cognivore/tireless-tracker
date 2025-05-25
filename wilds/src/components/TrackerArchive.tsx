import { useState, useEffect } from 'react';
import * as storageService from '../services/storageService';
import '../styles/TrackerArchive.css';

interface TrackerArchiveProps {
  onClose: () => void;
  onTrackerSelect: (trackerId: string) => void;
}

export default function TrackerArchive({ onClose, onTrackerSelect }: TrackerArchiveProps) {
  const [trackers, setTrackers] = useState<{ id: string; name: string; archived: boolean }[]>([]);
  
  useEffect(() => {
    // Get only archived trackers
    const allTrackers = storageService.getTrackersList();
    const archivedTrackers = allTrackers.filter(tracker => tracker.archived);
    setTrackers(archivedTrackers);
  }, []);

  const handleUnarchiveTracker = (trackerId: string) => {
    storageService.unarchiveTracker(trackerId);
    
    // Update the list
    setTrackers(trackers.filter(tracker => tracker.id !== trackerId));
  };

  const handleDeleteTrackerPermanently = (trackerId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this tracker? This action cannot be undone.')) {
      storageService.deleteTrackerPermanently(trackerId);
      
      // Update the list
      setTrackers(trackers.filter(tracker => tracker.id !== trackerId));
    }
  };

  return (
    <div className="archive-overlay">
      <div className="archive-modal">
        <header className="archive-header">
          <h2>Archived Trackers</h2>
          <button className="archive-close-button" onClick={onClose}>×</button>
        </header>
        
        {trackers.length > 0 ? (
          <div className="archive-content">
            <ul className="archive-list">
              {trackers.map(tracker => (
                <li key={tracker.id} className="archive-item">
                  <div className="archive-item-info">
                    <span className="archive-item-name">{tracker.name}</span>
                    <span className="archive-item-type">Tracker</span>
                  </div>
                  <div className="archive-item-actions">
                    <button 
                      className="archive-view-button"
                      onClick={() => onTrackerSelect(tracker.id)}
                    >
                      View
                    </button>
                    <button 
                      className="archive-restore-button"
                      onClick={() => handleUnarchiveTracker(tracker.id)}
                    >
                      Restore
                    </button>
                    <button 
                      className="archive-delete-button"
                      onClick={() => handleDeleteTrackerPermanently(tracker.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="archive-empty">
            <p>No archived trackers found.</p>
          </div>
        )}
      </div>
    </div>
  );
} 