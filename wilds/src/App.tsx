import { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import TrackerApp from './components/TrackerApp';
import './App.css';

function App() {
  const [currentTrackerId, setCurrentTrackerId] = useState<string | null>(null);

  // Check for tracker ID in URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackerId = params.get('id');
    if (trackerId) {
      setCurrentTrackerId(trackerId);
    }
  }, []);

  // Update URL when tracker changes
  useEffect(() => {
    if (currentTrackerId) {
      const url = new URL(window.location.href);
      url.searchParams.set('id', currentTrackerId);
      window.history.pushState({}, '', url);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      window.history.pushState({}, '', url);
    }
  }, [currentTrackerId]);

  const handleTrackerCreate = (trackerId: string) => {
    setCurrentTrackerId(trackerId);
  };

  const handleTrackerSelect = (trackerId: string) => {
    setCurrentTrackerId(trackerId);
  };

  const handleBackToHome = () => {
    setCurrentTrackerId(null);
  };

  if (currentTrackerId) {
    return <TrackerApp trackerId={currentTrackerId} onBack={handleBackToHome} />;
  }

  return (
    <HomePage 
      onTrackerCreate={handleTrackerCreate} 
      onTrackerSelect={handleTrackerSelect} 
    />
  );
}

export default App;
