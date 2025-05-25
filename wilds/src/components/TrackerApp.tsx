import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import Screen from './Screen';
import AddButton from './AddButton';
import AddScreen from './AddScreen';
import EditScreenName from './EditScreenName';
import EditButtonName from './EditButtonName';
import ArchiveManager from './ArchiveManager';
import * as storageService from '../services/storageService';
import type { AppState } from '../types';
import '../styles/TrackerApp.css';

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
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const data = storageService.loadData(trackerId);
    if (data) {
      setAppState(data);
    }
    setLoading(false);
  }, [trackerId]);

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

  const currentScreen = appState.screens.find(s => s.id === appState.currentScreenId);
  const editingScreen = editingScreenId ? appState.screens.find(s => s.id === editingScreenId) : null;
  const hasArchivedItems = storageService.hasArchivedItems(appState);
  
  let editingButton = null;
  if (editingButtonId && currentScreen) {
    editingButton = currentScreen.buttons.find(b => b.id === editingButtonId);
  }

  if (!currentScreen) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="tracker-app">
      <header className="tracker-header">
        <button className="back-button" onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="tracker-title">{appState.trackerName}</h1>
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
        <Screen 
          screen={currentScreen}
          onButtonClick={handleButtonClick}
          onButtonDoubleClick={handleButtonDoubleClick}
          onButtonEdit={handleEditButtonClick}
          onButtonDelete={handleDeleteButton}
        />
        
        <div className="add-button-container">
          <AddButton onAdd={handleAddButton} />
        </div>
      </main>

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
    </div>
  );
} 