import { useState, useRef, useEffect, useMemo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import type { ButtonData } from '../types';
import '../styles/Button.css';
import '../styles/DraggableButton.css';

interface DraggableButtonProps {
  button: ButtonData;
  index: number;
  onClick: () => void;
  onDoubleClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DraggableButton({
  button,
  index,
  onClick,
  onDoubleClick,
  onEdit,
  onDelete
}: DraggableButtonProps) {
  const [timerId, setTimerId] = useState<number | null>(null);
  const isDragging = useRef(false);
  
  // Create a stable draggable ID that won't change between renders
  const draggableId = useMemo(() => {
    // Ensure the ID is valid and consistent
    return button.id.toString().replace(/\s+/g, '-');
  }, [button.id]);
  
  // Log button info for debugging
  useEffect(() => {
    console.log(`Button rendered: ${button.text} (ID: ${draggableId}, Index: ${index})`);
  }, [button.text, draggableId, index]);
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if we just finished dragging
    if (isDragging.current) {
      isDragging.current = false;
      return;
    }
    
    // Don't trigger click if we're clicking on the drag handle
    if ((e.target as any).closest('[data-drag-handle="true"]')) {
      return;
    }
    
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
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => {
        // Set dragging flag when drag state changes
        if (snapshot.isDragging) {
          isDragging.current = true;
          console.log(`Dragging button: ${button.text} (ID: ${draggableId})`);
        }
        
        return (
          <div
            className={`button-container ${snapshot.isDragging ? 'dragging' : ''}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
          >
            <div className="button-actions">
              <button 
                className="button-edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                aria-label={`Edit ${button.text} button`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
              <button 
                className="button-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                aria-label={`Delete ${button.text} button`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            
            {/* The tracker button for clicking */}
            <button 
              className="tracker-button" 
              onClick={handleClick}
              aria-label={`${button.text} counter: ${button.count}`}
            >
              <span className="button-text">{button.text}</span>
              <span className="button-count">{button.count}</span>
            </button>
            
            {/* Separate drag handle element */}
            <div 
              className="drag-handle"
              data-drag-handle="true"
              {...provided.dragHandleProps}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="1"></circle>
                <circle cx="8" cy="16" r="1"></circle>
                <circle cx="16" cy="8" r="1"></circle>
                <circle cx="16" cy="16" r="1"></circle>
              </svg>
            </div>
          </div>
        );
      }}
    </Draggable>
  );
} 