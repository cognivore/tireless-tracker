import { useState } from 'react';
import '../styles/EditScreenName.css';

interface EditScreenNameProps {
  screenId: string;
  currentName: string;
  onRename: (screenId: string, newName: string) => void;
  onCancel: () => void;
}

export default function EditScreenName({ screenId, currentName, onRename, onCancel }: EditScreenNameProps) {
  const [screenName, setScreenName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (screenName.trim()) {
      onRename(screenId, screenName.trim());
    }
  };

  return (
    <div className="edit-screen-overlay">
      <div className="edit-screen-modal">
        <h2>Edit Screen Name</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            placeholder="Screen name"
            autoFocus
            className="edit-screen-input"
          />
          <div className="edit-screen-controls">
            <button type="submit" className="edit-screen-submit">Save</button>
            <button 
              type="button" 
              className="edit-screen-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 