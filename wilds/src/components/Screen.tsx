import type { Screen as ScreenType } from '../types';
import { Droppable } from '@hello-pangea/dnd';
import DraggableButton from './DraggableButton';
import '../styles/Screen.css';

interface ScreenProps {
  screen: ScreenType;
  onButtonClick: (buttonId: string) => void;
  onButtonDoubleClick: (buttonId: string) => void;
  onButtonEdit: (buttonId: string) => void;
  onButtonDelete: (buttonId: string) => void;
  screens: ScreenType[];
  onMoveToScreen?: (buttonId: string, buttonText: string) => void;
}

export default function Screen({ 
  screen, 
  onButtonClick, 
  onButtonDoubleClick,
  onButtonEdit,
  onButtonDelete,
  onMoveToScreen,
}: ScreenProps) {
  // Filter out archived buttons
  const activeButtons = screen.buttons.filter(button => !button.archived);

  return (
    <div className="screen">
      <div className="screen-name">{screen.name}</div>
      <Droppable 
        droppableId={screen.id} 
        type="BUTTON" 
        isDropDisabled={false}
        isCombineEnabled={false}
        ignoreContainerClipping={false}
      >
        {(provided, snapshot) => (
          <div 
            className={`buttons-container ${snapshot.isDraggingOver ? 'dragging-over' : ''} ${activeButtons.length === 0 ? 'empty' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {activeButtons.length > 0 ? (
              <div className="buttons-grid">
                {activeButtons.map((button, index) => (
                  <DraggableButton
                    key={button.id}
                    button={button}
                    index={index}
                    onClick={() => onButtonClick(button.id)}
                    onDoubleClick={() => onButtonDoubleClick(button.id)}
                    onEdit={() => onButtonEdit(button.id)}
                    onDelete={() => onButtonDelete(button.id)}
                    onMoveToScreen={onMoveToScreen}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-screen">
                <p>No buttons on this screen yet.</p>
                <p className="empty-screen-help">Click "+ Add Button" below to create one.</p>
                <p className="empty-screen-help">You can also drag buttons from other screens here.</p>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
} 