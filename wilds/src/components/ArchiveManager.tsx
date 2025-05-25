import type { AppState } from '../types';
import '../styles/ArchiveManager.css';

interface ArchiveManagerProps {
  appState: AppState;
  onUnarchiveScreen: (screenId: string) => void;
  onUnarchiveButton: (screenId: string, buttonId: string) => void;
  onDeleteScreenPermanently: (screenId: string) => void;
  onDeleteButtonPermanently: (screenId: string, buttonId: string) => void;
  onClose: () => void;
}

export default function ArchiveManager({ 
  appState, 
  onUnarchiveScreen, 
  onUnarchiveButton,
  onDeleteScreenPermanently,
  onDeleteButtonPermanently, 
  onClose 
}: ArchiveManagerProps) {
  const archivedScreens = appState.screens.filter(screen => screen.archived);
  const screensWithArchivedButtons = appState.screens
    .filter(screen => !screen.archived && screen.buttons.some(button => button.archived));

  const hasArchivedItems = archivedScreens.length > 0 || screensWithArchivedButtons.length > 0;

  const handleDeleteScreenPermanently = (screenId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this screen? This action cannot be undone.')) {
      onDeleteScreenPermanently(screenId);
    }
  };

  const handleDeleteButtonPermanently = (screenId: string, buttonId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this button? This action cannot be undone.')) {
      onDeleteButtonPermanently(screenId, buttonId);
    }
  };

  return (
    <div className="archive-overlay">
      <div className="archive-modal">
        <header className="archive-header">
          <h2>Archive</h2>
          <button className="archive-close-button" onClick={onClose}>×</button>
        </header>
        
        {hasArchivedItems ? (
          <div className="archive-content">
            {archivedScreens.length > 0 && (
              <section className="archive-section">
                <h3>Archived Screens</h3>
                <ul className="archive-list">
                  {archivedScreens.map(screen => (
                    <li key={screen.id} className="archive-item">
                      <div className="archive-item-info">
                        <span className="archive-item-name">{screen.name}</span>
                        <span className="archive-item-type">Screen</span>
                      </div>
                      <div className="archive-item-actions">
                        <button 
                          className="archive-restore-button"
                          onClick={() => onUnarchiveScreen(screen.id)}
                        >
                          Restore
                        </button>
                        <button 
                          className="archive-delete-button"
                          onClick={() => handleDeleteScreenPermanently(screen.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            
            {screensWithArchivedButtons.length > 0 && (
              <section className="archive-section">
                <h3>Archived Buttons</h3>
                {screensWithArchivedButtons.map(screen => (
                  <div key={screen.id} className="archive-screen-buttons">
                    <h4>{screen.name}</h4>
                    <ul className="archive-list">
                      {screen.buttons.filter(button => button.archived).map(button => (
                        <li key={button.id} className="archive-item">
                          <div className="archive-item-info">
                            <span className="archive-item-name">{button.text}</span>
                            <span className="archive-item-type">Button</span>
                          </div>
                          <div className="archive-item-actions">
                            <button 
                              className="archive-restore-button"
                              onClick={() => onUnarchiveButton(screen.id, button.id)}
                            >
                              Restore
                            </button>
                            <button 
                              className="archive-delete-button"
                              onClick={() => handleDeleteButtonPermanently(screen.id, button.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
          </div>
        ) : (
          <div className="archive-empty">
            <p>No archived items found.</p>
          </div>
        )}
      </div>
    </div>
  );
} 