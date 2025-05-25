import { useState } from 'react';
import type { ButtonData } from '../types';
import '../styles/Button.css';

interface ButtonProps {
  data: ButtonData;
  onClick: () => void;
  onDoubleClick: () => void;
  onEditClick: (buttonId: string) => void;
  onDeleteClick: (buttonId: string) => void;
}

export default function Button({ data, onClick, onDoubleClick, onEditClick, onDeleteClick }: ButtonProps) {
  const [timerId, setTimerId] = useState<number | null>(null);
  
  const handleClick = () => {
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
      onDoubleClick();
    } else {
      const id = window.setTimeout(() => {
        onClick();
        setTimerId(null);
      }, 300);
      setTimerId(id);
    }
  };

  return (
    <div className="button-container">
      <div className="button-actions">
        <button 
          className="button-edit"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(data.id);
          }}
          aria-label={`Edit ${data.text} button`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </button>
        <button 
          className="button-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(data.id);
          }}
          aria-label={`Delete ${data.text} button`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      <button 
        className="tracker-button" 
        onClick={handleClick}
        aria-label={`${data.text} counter: ${data.count}`}
      >
        <span className="button-text">{data.text}</span>
        <span className="button-count">{data.count}</span>
      </button>
    </div>
  );
} 