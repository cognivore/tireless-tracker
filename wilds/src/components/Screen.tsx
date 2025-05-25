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
  return (
    <div className="screen">
      <div className="screen-name">{screen.name}</div>
      <div className="buttons-grid">
        {screen.buttons.map(button => (
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
    </div>
  );
} 