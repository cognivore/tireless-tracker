import type { Screen } from '../types';
import '../styles/Navigation.css';

interface NavigationProps {
  screens: Screen[];
  currentScreenId: string;
  onScreenChange: (screenId: string) => void;
  onAddScreenClick: () => void;
}

export default function Navigation({ screens, currentScreenId, onScreenChange, onAddScreenClick }: NavigationProps) {
  return (
    <nav className="navigation">
      <div className="screens-tabs">
        {screens.map(screen => (
          <button
            key={screen.id}
            className={`screen-tab ${screen.id === currentScreenId ? 'active' : ''}`}
            onClick={() => onScreenChange(screen.id)}
          >
            {screen.name}
          </button>
        ))}
      </div>
      <button className="add-screen-button" onClick={onAddScreenClick}>
        + New Screen
      </button>
    </nav>
  );
} 