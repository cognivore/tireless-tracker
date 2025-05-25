import { useState } from 'react';
import '../styles/RenameTracker.css';

interface RenameTrackerProps {
  currentName: string;
  onRename: (newName: string) => void;
  onCancel: () => void;
}

export default function RenameTracker({ 
  currentName, 
  onRename, 
  onCancel 
}: RenameTrackerProps) {
  const [newName, setNewName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onRename(newName);
    }
  };

  return (
    <div className="rename-overlay">
      <div className="rename-dialog">
        <h2>Rename Tracker</h2>
        <form onSubmit={handleSubmit}>
          <div className="rename-input-group">
            <label htmlFor="tracker-name">Tracker Name</label>
            <input
              id="tracker-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              placeholder="Enter tracker name"
            />
          </div>
          <div className="rename-actions">
            <button 
              type="button" 
              className="rename-button rename-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="rename-button rename-confirm"
              disabled={!newName.trim() || newName.trim() === currentName}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 