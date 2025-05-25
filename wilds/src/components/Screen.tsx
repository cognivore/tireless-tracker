import type { Screen as ScreenType } from '../types';
import Button from './Button';
import '../styles/Screen.css';

interface ScreenProps {
  screen: ScreenType;
  onButtonClick: (buttonId: string) => void;
  onButtonDoubleClick: (buttonId: string) => void;
  onButtonEdit: (buttonId: string) => void;
  onButtonDelete: (buttonId: string) => void;
}

export default function Screen({ 
  screen, 
  onButtonClick, 
  onButtonDoubleClick,
  onButtonEdit,
  onButtonDelete
}: ScreenProps) {
  // Filter out archived buttons
  const activeButtons = screen.buttons.filter(button => !button.archived);

  return (
    <div className="screen">
      <div className="screen-name">{screen.name}</div>
      {activeButtons.length > 0 ? (
        <div className="buttons-grid">
          {activeButtons.map(button => (
            <Button
              key={button.id}
              data={button}
              onClick={() => onButtonClick(button.id)}
              onDoubleClick={() => onButtonDoubleClick(button.id)}
              onEditClick={onButtonEdit}
              onDeleteClick={onButtonDelete}
            />
          ))}
        </div>
      ) : (
        <div className="empty-screen">
          <p>No buttons on this screen yet.</p>
          <p className="empty-screen-help">Click "+ Add Button" below to create one.</p>
        </div>
      )}
    </div>
  );
} 