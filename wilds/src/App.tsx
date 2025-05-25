import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Screen from './components/Screen';
import AddButton from './components/AddButton';
import AddScreen from './components/AddScreen';
import * as storageService from './services/storageService';
import type { AppState, Screen as ScreenType } from './types';
import './App.css';

function App() {
  const [appState, setAppState] = useState<AppState>({ screens: [], currentScreenId: '' });
  const [showAddScreen, setShowAddScreen] = useState(false);
  
  // Load data on mount
  useEffect(() => {
    const data = storageService.loadData();
    setAppState(data);
  }, []);

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

  const currentScreen = appState.screens.find(s => s.id === appState.currentScreenId);

  if (!currentScreen) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Tracker</h1>
      </header>
      
      <Navigation 
        screens={appState.screens}
        currentScreenId={appState.currentScreenId}
        onScreenChange={handleScreenChange}
        onAddScreenClick={() => setShowAddScreen(true)}
      />
      
      <main className="app-content">
        <Screen 
          screen={currentScreen}
          onButtonClick={handleButtonClick}
          onButtonDoubleClick={handleButtonDoubleClick}
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
    </div>
  );
}

export default App;
