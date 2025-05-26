import type { Screen } from '../types';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import '../styles/Navigation.css';

interface NavigationProps {
  screens: Screen[];
  currentScreenId: string;
  onScreenChange: (screenId: string) => void;
  onAddScreenClick: () => void;
  onEditScreenClick: (screenId: string) => void;
  onDeleteScreenClick: (screenId: string) => void;
  onArchiveClick: () => void;
  hasArchivedItems: boolean;
}

export default function Navigation({ 
  screens, 
  currentScreenId, 
  onScreenChange, 
  onAddScreenClick,
  onEditScreenClick,
  onDeleteScreenClick,
  onArchiveClick,
  hasArchivedItems
}: NavigationProps) {
  // Filter out archived screens
  const activeScreens = screens.filter(screen => !screen.archived);

  return (
    <nav className="navigation">
      <Droppable 
        droppableId="screens" 
        direction="horizontal" 
        type="SCREEN" 
        isDropDisabled={false}
        isCombineEnabled={false}
        ignoreContainerClipping={false}
      >
        {(provided, snapshot) => (
          <div 
            className={`screens-tabs ${snapshot.isDraggingOver ? 'dragging-over' : ''}`} 
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {activeScreens.map((screen, index) => (
              <Draggable key={screen.id} draggableId={screen.id} index={index}>
                {(provided, snapshot) => (
                  <div 
                    className={`screen-tab-container ${snapshot.isDragging ? 'dragging' : ''}`}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                  >
                    <button
                      className={`screen-tab ${screen.id === currentScreenId ? 'active' : ''}`}
                      onClick={() => onScreenChange(screen.id)}
                      {...provided.dragHandleProps}
                    >
                      <div className="screen-actions">
                        <div 
                          className="edit-screen-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditScreenClick(screen.id);
                          }}
                          aria-label={`Edit ${screen.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </div>
                        <div 
                          className="delete-screen-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteScreenClick(screen.id);
                          }}
                          aria-label={`Delete ${screen.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </div>
                      </div>
                      <span className="screen-tab-text">{screen.name}</span>
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className="navigation-actions">
        {hasArchivedItems && (
          <button className="archive-button" onClick={onArchiveClick}>
            Archive
          </button>
        )}
        <button className="add-screen-button" onClick={onAddScreenClick}>
          + New Screen
        </button>
      </div>
    </nav>
  );
} 