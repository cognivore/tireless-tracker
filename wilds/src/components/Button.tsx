import { useState } from 'react';
import type { ButtonData } from '../types';
import '../styles/Button.css';

interface ButtonProps {
  data: ButtonData;
  onClick: () => void;
  onDoubleClick: () => void;
}

export default function Button({ data, onClick, onDoubleClick }: ButtonProps) {
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
    <button 
      className="tracker-button" 
      onClick={handleClick}
      aria-label={`${data.text} counter: ${data.count}`}
    >
      <span className="button-text">{data.text}</span>
      <span className="button-count">{data.count}</span>
    </button>
  );
} 