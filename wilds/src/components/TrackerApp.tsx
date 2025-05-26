import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import Screen from './Screen';
import AddButton from './AddButton';
import AddScreen from './AddScreen';
import EditScreenName from './EditScreenName';
import EditButtonName from './EditButtonName';
import ArchiveManager from './ArchiveManager';
import ActivityJournal from './ActivityJournal';
import RenameTracker from './RenameTracker';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult, DragStart } from '@hello-pangea/dnd';
import * as storageService from '../services/storageService';
import { compressState } from '../utils/compressionUtils';
import type { AppState } from '../types';
import '../styles/TrackerApp.css';

// Create a mock ShareDialog component if needed
// This will be replaced with the real one when it's implemented
const ShareDialog = ({ shareUrl, onClose }: { shareUrl: string, onClose: () => void }) => (
  <div className="share-dialog-placeholder">
    <p>Share URL: {shareUrl}</p>
    <button onClick={onClose}>Close</button>
  </div>
);

interface TrackerAppProps {
  trackerId: string;
  onBack: () => void;
}

export default function TrackerApp({ trackerId, onBack }: TrackerAppProps) {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [draggingButtonId, setDraggingButtonId] = useState<string | null>(null);
  const [draggingButtonText, setDraggingButtonText] = useState<string>('');
  const [draggingSourceScreenId, setDraggingSourceScreenId] = useState<string | null>(null);
  const [screenSelectorVisible, setScreenSelectorVisible] = useState(false);

  // Load data on mount
  useEffect(() => {
    const data = storageService.loadData(trackerId);
    if (data) {
      setAppState(data);
    }
    setLoading(false);
  }, [trackerId]);

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && screenSelectorVisible) {
        setScreenSelectorVisible(false);
        setIsDragging(false);
        setDraggingButtonId(null);
        setDraggingSourceScreenId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [screenSelectorVisible]);

  // Add/remove dragging class to body
  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('dragging-active');
    } else {
      document.body.classList.remove('dragging-active');
    }
    
    return () => {
      document.body.classList.remove('dragging-active');
    };
  }, [isDragging]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!appState) {
    return (
      <div className="error-container">
        <h2>Tracker Not Found</h2>
        <p>The tracker you requested could not be found.</p>
        <button className="back-button" onClick={onBack}>Back to Home</button>
      </div>
    );
  }

  const handleButtonClick = (buttonId: string) => {
    const newState = storageService.addClick(appState, appState.currentScreenId, buttonId);
    setAppState(newState);
  };

  const handleButtonDoubleClick = (buttonId: string) => {
    const newState = storageService.decrementClick(appState, appState.currentScreenId, buttonId);
    setAppState(newState);
  };

  const handleScreenChange = (screenId: string) => {
    setAppState({ ...appState, currentScreenId: screenId });
  };

  const handleAddButton = (buttonText: string) => {
    const newState = storageService.addButton(appState, appState.currentScreenId, buttonText);
    setAppState(newState);
  };

  const handleAddScreen = (screenName: string) => {
    const newState = storageService.addScreen(appState, screenName);
    setAppState({ ...newState, currentScreenId: newState.screens[newState.screens.length - 1].id });
    setShowAddScreen(false);
  };
  
  const handleEditScreenClick = (screenId: string) => {
    setEditingScreenId(screenId);
  };
  
  const handleRenameScreen = (screenId: string, newName: string) => {
    const newState = storageService.renameScreen(appState, screenId, newName);
    setAppState(newState);
    setEditingScreenId(null);
  };
  
  const handleDeleteScreenClick = (screenId: string) => {
    if (confirm('Are you sure you want to archive this screen?')) {
      const newState = storageService.archiveScreen(appState, screenId);
      setAppState(newState);
    }
  };
  
  const handleEditButtonClick = (buttonId: string) => {
    setEditingButtonId(buttonId);
  };
  
  const handleRenameButton = (buttonId: string, newName: string) => {
    const newState = storageService.renameButton(appState, appState.currentScreenId, buttonId, newName);
    setAppState(newState);
    setEditingButtonId(null);
  };
  
  const handleDeleteButton = (buttonId: string) => {
    if (confirm('Are you sure you want to archive this button?')) {
      const newState = storageService.archiveButton(appState, appState.currentScreenId, buttonId);
      setAppState(newState);
    }
  };
  
  const handleUnarchiveScreen = (screenId: string) => {
    const newState = storageService.unarchiveScreen(appState, screenId);
    setAppState(newState);
  };
  
  const handleUnarchiveButton = (screenId: string, buttonId: string) => {
    const newState = storageService.unarchiveButton(appState, screenId, buttonId);
    setAppState(newState);
  };
  
  const handleDeleteScreenPermanently = (screenId: string) => {
    const newState = storageService.deleteScreenPermanently(appState, screenId);
    setAppState(newState);
  };
  
  const handleDeleteButtonPermanently = (screenId: string, buttonId: string) => {
    const newState = storageService.deleteButtonPermanently(appState, screenId, buttonId);
    setAppState(newState);
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };
  
  const getShareableUrl = (): string => {
    if (!appState) return '';
    
    // Compress the state to a URL-safe string
    const compressedState = compressState(appState);
    
    // Create the URL with the compressed state
    const baseUrl = window.location.origin + window.location.pathname;
    const url = new URL(baseUrl);
    
    // Add the compressed state as a parameter
    url.searchParams.set('import', compressedState);
    
    return url.toString();
  };
  
  const handleRenameTracker = (newName: string) => {
    if (!appState) return;
    
    const updatedState = storageService.renameTracker(appState.trackerId, newName);
    if (updatedState) {
      setAppState(updatedState);
    }
    setShowRenameDialog(false);
  };

  const currentScreen = appState.screens.find(s => s.id === appState.currentScreenId);
  const editingScreen = editingScreenId ? appState.screens.find(s => s.id === editingScreenId) : null;
  const hasArchivedItems = storageService.hasArchivedItems(appState);
  
  let editingButton = null;
  if (editingButtonId && currentScreen) {
    editingButton = currentScreen.buttons.find(b => b.id === editingButtonId);
  }

  const handleDragStart = (start: DragStart) => {
    console.log('Drag start:', start);
    
    // Set dragging state for visual indicators
    if (start.type === 'BUTTON') {
      setIsDragging(true);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    
    // Clear dragging state
    setIsDragging(false);
    setDraggingButtonId(null);
    setDraggingSourceScreenId(null);
    setScreenSelectorVisible(false);
    
    // Dropped outside the list
    if (!destination) {
      return;
    }
    
    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (type === 'SCREEN') {
      // Handle screen reordering
      const newState = storageService.reorderScreens(
        appState,
        source.index,
        destination.index
      );
      setAppState(newState);
    } else if (type === 'BUTTON') {
      if (source.droppableId === destination.droppableId) {
        // Same screen, just reordering
        const newState = storageService.reorderButton(
          appState,
          source.droppableId,
          source.index,
          destination.index
        );
        setAppState(newState);
      } else {
        // Moving to a different screen
        const sourceScreen = appState.screens.find(s => s.id === source.droppableId);
        const destScreen = appState.screens.find(s => s.id === destination.droppableId);
        const button = sourceScreen?.buttons.find((_, idx) => idx === source.index);
        
        const newState = storageService.moveButtonToScreen(
          appState,
          source.droppableId,
          destination.droppableId,
          source.index,
          destination.index
        );
        
        // Switch to the destination screen
        newState.currentScreenId = destination.droppableId;
        setAppState(newState);
        
        // Show toast notification
        if (button && sourceScreen && destScreen) {
          setToast({
            message: `Moved "${button.text}" from "${sourceScreen.name}" to "${destScreen.name}"`,
            visible: true
          });
          
          // Hide toast after 3 seconds
          setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
          }, 3000);
        }
      }
    }
  };

  // Function to handle showing screen selector
  const handleMoveToScreen = (buttonId: string, buttonText: string) => {
    setDraggingButtonId(buttonId);
    setDraggingButtonText(buttonText);
    setDraggingSourceScreenId(appState.currentScreenId);
    setScreenSelectorVisible(true);
  };

  if (!currentScreen) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="tracker-app">
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <header className="tracker-header">
          <button className="back-button" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <div className="tracker-title-container" onClick={() => setShowRenameDialog(true)}>
            <h1 className="tracker-title">{appState.trackerName}</h1>
            <svg className="edit-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </div>
          <div className="header-actions">
            <button className="share-button" onClick={handleShare}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
            <button className="journal-button" onClick={() => setShowJournal(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </button>
          </div>
        </header>
        
        <Navigation 
          screens={appState.screens}
          currentScreenId={appState.currentScreenId}
          onScreenChange={handleScreenChange}
          onAddScreenClick={() => setShowAddScreen(true)}
          onEditScreenClick={handleEditScreenClick}
          onDeleteScreenClick={handleDeleteScreenClick}
          onArchiveClick={() => setShowArchive(true)}
          hasArchivedItems={hasArchivedItems}
        />
        
        <main className="tracker-content">
          {/* Only render the current screen */}
          <Screen 
            screen={currentScreen}
            screens={appState.screens}
            onButtonClick={handleButtonClick}
            onButtonDoubleClick={handleButtonDoubleClick}
            onButtonEdit={handleEditButtonClick}
            onButtonDelete={handleDeleteButton}
            onMoveToScreen={handleMoveToScreen}
          />
          
          <div className="add-button-container">
            <AddButton onAdd={handleAddButton} />
          </div>
        </main>
      </DragDropContext>

      {showAddScreen && (
        <AddScreen 
          onAdd={handleAddScreen} 
          onCancel={() => setShowAddScreen(false)} 
        />
      )}
      
      {editingScreen && (
        <EditScreenName
          screenId={editingScreen.id}
          currentName={editingScreen.name}
          onRename={handleRenameScreen}
          onCancel={() => setEditingScreenId(null)}
        />
      )}
      
      {editingButton && (
        <EditButtonName
          buttonId={editingButton.id}
          currentName={editingButton.text}
          onRename={handleRenameButton}
          onCancel={() => setEditingButtonId(null)}
        />
      )}
      
      {showArchive && (
        <ArchiveManager
          appState={appState}
          onUnarchiveScreen={handleUnarchiveScreen}
          onUnarchiveButton={handleUnarchiveButton}
          onDeleteScreenPermanently={handleDeleteScreenPermanently}
          onDeleteButtonPermanently={handleDeleteButtonPermanently}
          onClose={() => setShowArchive(false)}
        />
      )}
      
      {showJournal && (
        <ActivityJournal
          appState={appState}
          onClose={() => setShowJournal(false)}
        />
      )}
      
      {showShareDialog && (
        <ShareDialog
          shareUrl={getShareableUrl()}
          onClose={() => setShowShareDialog(false)}
        />
      )}
      
      {showRenameDialog && (
        <RenameTracker
          currentName={appState.trackerName}
          onRename={handleRenameTracker}
          onCancel={() => setShowRenameDialog(false)}
        />
      )}
      
      {/* Toast notification */}
      <div className={`toast-notification ${toast.visible ? 'visible' : ''}`}>
        {toast.message}
      </div>
      
      {/* Screen selector for moving buttons between screens */}
      {screenSelectorVisible && (
        <>
          <div className="screen-selector-overlay" onClick={() => setScreenSelectorVisible(false)}></div>
          <div className="screen-selector">
            <div className="screen-selector-header">
              <span className="screen-selector-title">Move "{draggingButtonText}" to:</span>
            </div>
            <div className="screen-selector-options">
              {appState.screens
                .filter(screen => !screen.archived && screen.id !== draggingSourceScreenId)
                .map(screen => (
                  <button
                    key={screen.id}
                    className="screen-selector-option"
                    onClick={() => {
                      // Move the button to the selected screen
                      if (draggingButtonId && draggingSourceScreenId) {
                        // Find the button index in the source screen
                        const sourceScreen = appState.screens.find(s => s.id === draggingSourceScreenId);
                        if (sourceScreen) {
                          const buttonIndex = sourceScreen.buttons.findIndex(b => b.id === draggingButtonId);
                          if (buttonIndex !== -1) {
                            const newState = storageService.moveButtonToScreen(
                              appState,
                              draggingSourceScreenId,
                              screen.id,
                              buttonIndex,
                              0 // Insert at the beginning of the target screen
                            );
                            // Switch to the destination screen
                            newState.currentScreenId = screen.id;
                            setAppState(newState);
                            
                            // Show toast notification
                            setToast({
                              message: `Moved "${draggingButtonText}" to "${screen.name}"`,
                              visible: true
                            });
                            
                            // Hide toast after 3 seconds
                            setTimeout(() => {
                              setToast(prev => ({ ...prev, visible: false }));
                            }, 3000);
                          }
                        }
                      }
                      // Hide the screen selector
                      setScreenSelectorVisible(false);
                      setIsDragging(false);
                      setDraggingButtonId(null);
                      setDraggingSourceScreenId(null);
                    }}
                  >
                    {screen.name}
                  </button>
                ))}
            </div>
            <button 
              className="screen-selector-cancel" 
              onClick={() => {
                setScreenSelectorVisible(false);
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
} 