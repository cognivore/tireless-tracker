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
}

export default function Screen({ 
  screen, 
  onButtonClick, 
  onButtonDoubleClick,
  onButtonEdit,
  onButtonDelete,
}: ScreenProps) {
  // Filter out archived buttons
  const activeButtons = screen.buttons.filter(button => !button.archived);

  return (
    <div className="screen">
      <div className="screen-name">{screen.name}</div>
      {activeButtons.length > 0 ? (
        <Droppable 
          droppableId={screen.id} 
          type="BUTTON" 
          isDropDisabled={false}
          isCombineEnabled={false}
          ignoreContainerClipping={false}
        >
          {(provided) => (
            <div 
              className="buttons-grid"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {activeButtons.map((button, index) => (
                <DraggableButton
                  key={button.id}
                  button={button}
                  index={index}
                  onClick={() => onButtonClick(button.id)}
                  onDoubleClick={() => onButtonDoubleClick(button.id)}
                  onEdit={() => onButtonEdit(button.id)}
                  onDelete={() => onButtonDelete(button.id)}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ) : (
        <Droppable 
          droppableId={screen.id} 
          type="BUTTON" 
          isDropDisabled={false}
          isCombineEnabled={false}
          ignoreContainerClipping={false}
        >
          {(provided) => (
            <div 
              className="empty-screen"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <p>No buttons on this screen yet.</p>
              <p className="empty-screen-help">Click "+ Add Button" below to create one.</p>
              <p className="empty-screen-help">You can also drag buttons from other screens here.</p>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
      
      {/* Hidden droppable areas for other screens are not needed and might cause conflicts */}
    </div>
  );
} 