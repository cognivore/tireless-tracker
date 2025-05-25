import { useState } from 'react';
import '../styles/AddScreen.css';

interface AddScreenProps {
  onAdd: (name: string) => void;
  onCancel: () => void;
}

export default function AddScreen({ onAdd, onCancel }: AddScreenProps) {
  const [screenName, setScreenName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (screenName.trim()) {
      onAdd(screenName.trim());
      setScreenName('');
    }
  };

  return (
    <div className="add-screen-overlay">
      <div className="add-screen-modal">
        <h2>Add New Screen</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            placeholder="Screen name"
            autoFocus
            className="add-screen-input"
          />
          <div className="add-screen-controls">
            <button type="submit" className="add-screen-submit">Add</button>
            <button 
              type="button" 
              className="add-screen-cancel"
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