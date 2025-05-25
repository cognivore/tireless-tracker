import { useState } from 'react';
import '../styles/AddButton.css';

interface AddButtonProps {
  onAdd: (text: string) => void;
}

export default function AddButton({ onAdd }: AddButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [buttonText, setButtonText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buttonText.trim()) {
      onAdd(buttonText.trim());
      setButtonText('');
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <form className="add-button-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
          placeholder="Button text"
          autoFocus
          className="add-button-input"
        />
        <div className="add-button-controls">
          <button type="submit" className="add-button-submit">Add</button>
          <button 
            type="button" 
            className="add-button-cancel"
            onClick={() => setIsAdding(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <button 
      className="add-button-trigger" 
      onClick={() => setIsAdding(true)}
    >
      + Add Button
    </button>
  );
} 