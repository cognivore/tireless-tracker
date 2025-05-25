import { useState } from 'react';
import '../styles/EditButtonName.css';

interface EditButtonNameProps {
  buttonId: string;
  currentName: string;
  onRename: (buttonId: string, newName: string) => void;
  onCancel: () => void;
}

export default function EditButtonName({ buttonId, currentName, onRename, onCancel }: EditButtonNameProps) {
  const [buttonName, setButtonName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buttonName.trim()) {
      onRename(buttonId, buttonName.trim());
    }
  };

  return (
    <div className="edit-button-overlay">
      <div className="edit-button-modal">
        <h2>Edit Button Name</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={buttonName}
            onChange={(e) => setButtonName(e.target.value)}
            placeholder="Button name"
            autoFocus
            className="edit-button-input"
          />
          <div className="edit-button-controls">
            <button type="submit" className="edit-button-submit">Save</button>
            <button 
              type="button" 
              className="edit-button-cancel"
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