import type { Screen } from '../types';
import '../styles/Navigation.css';

interface NavigationProps {
  screens: Screen[];
  currentScreenId: string;
  onScreenChange: (screenId: string) => void;
  onAddScreenClick: () => void;
  onEditScreenClick: (screenId: string) => void;
}

export default function Navigation({ 
  screens, 
  currentScreenId, 
  onScreenChange, 
  onAddScreenClick,
  onEditScreenClick
}: NavigationProps) {
  return (
    <nav className="navigation">
      <div className="screens-tabs">
        {screens.map(screen => (
          <div key={screen.id} className="screen-tab-container">
            {screen.id === currentScreenId && (
              <button 
                className="edit-screen-button"
                onClick={() => onEditScreenClick(screen.id)}
                aria-label={`Edit ${screen.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
            )}
            <button
              className={`screen-tab ${screen.id === currentScreenId ? 'active' : ''}`}
              onClick={() => onScreenChange(screen.id)}
            >
              {screen.name}
            </button>
          </div>
        ))}
      </div>
      <button className="add-screen-button" onClick={onAddScreenClick}>
        + New Screen
      </button>
    </nav>
  );
} 